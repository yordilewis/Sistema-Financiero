using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SolucionesFinancieras.API.Data;
using SolucionesFinancieras.API.Models;

namespace SolucionesFinancieras.API.Controllers;

[ApiController]
[Route("api/prestamos")]
public class PrestamosController : ControllerBase
{
    private readonly DbConnection _db;

    public PrestamosController(DbConnection db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetPrestamos()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string sql = @"
            SELECT
                p.IdPrestamo,
                c.Nombre        AS Cliente,
                c.Telefono,
                p.Monto,
                p.Interes,
                p.CantidadCuotas,
                p.Estado,
                (SELECT COUNT(*) FROM Cuotas cu
                 WHERE cu.IdPrestamo = p.IdPrestamo AND cu.Estado = 'Pagada') AS Pagadas,
                (SELECT MIN(cu.FechaVencimiento) FROM Cuotas cu
                 WHERE cu.IdPrestamo = p.IdPrestamo AND cu.Estado = 'Pendiente') AS ProximoPago
            FROM Prestamos p
            INNER JOIN Clientes c ON p.IdCliente = c.IdCliente
            ORDER BY p.IdPrestamo DESC";

        using var cmd    = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        var hoy   = DateTime.Today;
        var meses = new[] { "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic" };
        var list  = new List<PrestamoResponse>();

        while (await reader.ReadAsync())
        {
            var idPrestamo = reader.GetInt32(reader.GetOrdinal("IdPrestamo"));
            var interes    = reader.IsDBNull(reader.GetOrdinal("Interes")) ? 0m : reader.GetDecimal(reader.GetOrdinal("Interes"));

            string proximo;
            var ordProx = reader.GetOrdinal("ProximoPago");
            if (reader.IsDBNull(ordProx))
            {
                proximo = "—";
            }
            else
            {
                var fecha = reader.GetDateTime(ordProx);
                proximo = fecha < hoy ? "Vencida" : $"{fecha.Day:D2} {meses[fecha.Month - 1]}";
            }

            list.Add(new PrestamoResponse
            {
                Id          = "P-" + idPrestamo.ToString("D3"),
                IdPrestamo  = idPrestamo,
                Cliente     = reader.GetString(reader.GetOrdinal("Cliente")),
                Telefono    = reader.IsDBNull(reader.GetOrdinal("Telefono")) ? "" : reader.GetString(reader.GetOrdinal("Telefono")),
                Monto       = reader.IsDBNull(reader.GetOrdinal("Monto")) ? 0m : reader.GetDecimal(reader.GetOrdinal("Monto")),
                Tasa        = interes.ToString("0.##") + "%",
                Cuotas      = reader.IsDBNull(reader.GetOrdinal("CantidadCuotas")) ? 0 : reader.GetInt32(reader.GetOrdinal("CantidadCuotas")),
                Pagadas     = reader.GetInt32(reader.GetOrdinal("Pagadas")),
                Estado      = reader.IsDBNull(reader.GetOrdinal("Estado")) ? "Activo" : reader.GetString(reader.GetOrdinal("Estado")),
                ProximoPago = proximo,
            });
        }

        return Ok(list);
    }

        [HttpPost]
    public async Task<IActionResult> RegistrarPrestamo([FromBody] PrestamoRequest request)
    {
        if (request.IdCliente <= 0 || request.Monto <= 0 || request.CantidadCuotas <= 0)
            return BadRequest(new { mensaje = "Datos del préstamo incompletos" });

        using var conn = _db.CreateConnection();
        await conn.OpenAsync();
        using var tx = (SqlTransaction)await conn.BeginTransactionAsync();

        try
        {
            var hoy = DateTime.Today;

            // 1. Insertar el préstamo y obtener su Id
            const string sqlPrestamo = @"
                INSERT INTO Prestamos (IdCliente, Monto, Interes, CantidadCuotas, FechaPrestamo, Estado)
                VALUES (@IdCliente, @Monto, @Interes, @CantidadCuotas, @FechaPrestamo, 'Activo');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            int idPrestamo;
            using (var cmd = new SqlCommand(sqlPrestamo, conn, tx))
            {
                cmd.Parameters.AddWithValue("@IdCliente",      request.IdCliente);
                cmd.Parameters.AddWithValue("@Monto",          request.Monto);
                cmd.Parameters.AddWithValue("@Interes",        request.Interes);
                cmd.Parameters.AddWithValue("@CantidadCuotas", request.CantidadCuotas);
                cmd.Parameters.AddWithValue("@FechaPrestamo",  hoy);
                idPrestamo = (int)(await cmd.ExecuteScalarAsync())!;
            }

            // 2. Total a pagar: interés por cuota (interés simple por período)
            var n         = request.CantidadCuotas;
            var total     = request.Monto * (1 + (request.Interes / 100m) * n);
            var cuotaBase = Math.Round(total / n, 2, MidpointRounding.AwayFromZero);

            // 3. Generar las cuotas (la última absorbe el redondeo)
            for (int k = 1; k <= n; k++)
            {
                var montoCuota = (k == n) ? total - cuotaBase * (n - 1) : cuotaBase;

                DateTime vence = request.Frecuencia switch
                {
                    "Semanal"   => hoy.AddDays(7 * k),
                    "Quincenal" => hoy.AddDays(15 * k),
                    _           => hoy.AddMonths(k),   // Mensual por defecto
                };

                const string sqlCuota = @"
                    INSERT INTO Cuotas (IdPrestamo, NumeroCuota, MontoCuota, FechaVencimiento, Estado)
                    VALUES (@IdPrestamo, @NumeroCuota, @MontoCuota, @FechaVencimiento, 'Pendiente');";

                using var cmdCuota = new SqlCommand(sqlCuota, conn, tx);
                cmdCuota.Parameters.AddWithValue("@IdPrestamo",       idPrestamo);
                cmdCuota.Parameters.AddWithValue("@NumeroCuota",      k);
                cmdCuota.Parameters.AddWithValue("@MontoCuota",       montoCuota);
                cmdCuota.Parameters.AddWithValue("@FechaVencimiento", vence);
                await cmdCuota.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();
            return Ok(new { idPrestamo, mensaje = "Préstamo registrado" });
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}