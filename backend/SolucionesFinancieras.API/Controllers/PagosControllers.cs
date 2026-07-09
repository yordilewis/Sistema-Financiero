using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SolucionesFinancieras.API.Data;
using SolucionesFinancieras.API.Models;

namespace SolucionesFinancieras.API.Controllers;

[ApiController]
[Route("api/pagos")]
public class PagosController : ControllerBase
{
    private readonly DbConnection _db;

    public PagosController(DbConnection db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetPagos()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string sql = @"
            SELECT pg.IdPago, c.Nombre AS Cliente, pg.IdPrestamo, pg.MontoPagado, pg.FechaPago, pg.MetodoPago
            FROM Pagos pg
            INNER JOIN Prestamos p ON pg.IdPrestamo = p.IdPrestamo
            INNER JOIN Clientes c  ON p.IdCliente  = c.IdCliente
            ORDER BY pg.IdPago DESC";

        using var cmd    = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        var meses = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var list  = new List<PagoResponse>();

        while (await reader.ReadAsync())
        {
            var fecha = reader.GetDateTime(reader.GetOrdinal("FechaPago"));
            list.Add(new PagoResponse
            {
                Recibo   = "PG-" + reader.GetInt32(reader.GetOrdinal("IdPago")).ToString("D3"),
                Cliente  = reader.GetString(reader.GetOrdinal("Cliente")),
                Prestamo = "P-" + reader.GetInt32(reader.GetOrdinal("IdPrestamo")).ToString("D3"),
                Monto    = reader.GetDecimal(reader.GetOrdinal("MontoPagado")),
                Fecha    = $"{fecha.Day:D2} {meses[fecha.Month - 1]} {fecha.Year}",
                Metodo   = reader.IsDBNull(reader.GetOrdinal("MetodoPago")) ? "" : reader.GetString(reader.GetOrdinal("MetodoPago")),
            });
        }

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarPago([FromBody] PagoRequest request)
    {
        if (request.IdPrestamo <= 0 || request.Monto <= 0)
            return BadRequest(new { mensaje = "Datos del pago incompletos" });

        using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var tx = (SqlTransaction)await conn.BeginTransactionAsync();

        try
        {
            var fechaPago = request.Fecha ?? DateTime.Today;

            // 1. Registrar el pago
            const string sqlPago = @"
                INSERT INTO Pagos (IdPrestamo, MontoPagado, FechaPago, MetodoPago, Observaciones)
                VALUES (@IdPrestamo, @MontoPagado, @FechaPago, @MetodoPago, '');";
            using (var cmd = new SqlCommand(sqlPago, conn, tx))
            {
                cmd.Parameters.AddWithValue("@IdPrestamo",  request.IdPrestamo);
                cmd.Parameters.AddWithValue("@MontoPagado", request.Monto);
                cmd.Parameters.AddWithValue("@FechaPago",   fechaPago);
                cmd.Parameters.AddWithValue("@MetodoPago",  request.Metodo ?? "Efectivo");
                await cmd.ExecuteNonQueryAsync();
            }

            // 2. Leer las cuotas pendientes (más antiguas primero)
            var pendientes = new List<(int Id, decimal Monto)>();
            const string sqlPend = @"
                SELECT IdCuota, MontoCuota FROM Cuotas
                WHERE IdPrestamo = @IdPrestamo AND Estado = 'Pendiente'
                ORDER BY NumeroCuota";
            using (var cmd = new SqlCommand(sqlPend, conn, tx))
            {
                cmd.Parameters.AddWithValue("@IdPrestamo", request.IdPrestamo);
                using var r = await cmd.ExecuteReaderAsync();
                while (await r.ReadAsync())
                    pendientes.Add((r.GetInt32(0), r.GetDecimal(1)));
            }

            // 3. Marcar 'Pagada' tantas cuotas como cubra el monto (según el monto)
            decimal acumulado = 0m;
            var saldadas = new List<int>();
            foreach (var cuota in pendientes)
            {
                if (acumulado + cuota.Monto <= request.Monto)
                {
                    acumulado += cuota.Monto;
                    saldadas.Add(cuota.Id);
                }
                else break;
            }

            foreach (var idCuota in saldadas)
            {
                using var cmd = new SqlCommand("UPDATE Cuotas SET Estado = 'Pagada' WHERE IdCuota = @IdCuota", conn, tx);
                cmd.Parameters.AddWithValue("@IdCuota", idCuota);
                await cmd.ExecuteNonQueryAsync();
            }

            // 4. Si ya no quedan cuotas pendientes, el préstamo queda Saldado
            if (pendientes.Count > 0 && saldadas.Count == pendientes.Count)
            {
                using var cmd = new SqlCommand("UPDATE Prestamos SET Estado = 'Saldado' WHERE IdPrestamo = @IdPrestamo", conn, tx);
                cmd.Parameters.AddWithValue("@IdPrestamo", request.IdPrestamo);
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
            return Ok(new { mensaje = "Pago registrado", cuotasSaldadas = saldadas.Count });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}