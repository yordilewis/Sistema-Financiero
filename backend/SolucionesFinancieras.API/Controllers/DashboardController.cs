using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SolucionesFinancieras.API.Data;
using SolucionesFinancieras.API.Models;

namespace SolucionesFinancieras.API.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly DbConnection _db;

    public DashboardController(DbConnection db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetMetrics()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("DashboardGeneral", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        using var reader = await cmd.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
            return Ok(new DashboardMetrics());

        var metrics = new DashboardMetrics
        {
            TotalClientes     = reader.GetInt32(reader.GetOrdinal("TotalClientes")),
            CuotasPendientes  = reader.GetInt32(reader.GetOrdinal("CuotasPendientes")),
            PrestamosEnAtraso = reader.GetInt32(reader.GetOrdinal("CuotasVencidas")),
            TotalCobrado      = reader.GetDecimal(reader.GetOrdinal("TotalCobrado")),
        };

        return Ok(metrics);
    }

    [HttpGet("prestamos/recientes")]
    public async Task<IActionResult> GetPrestamosRecientes()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string sql = @"
            SELECT TOP 10
                p.IdPrestamo,
                c.Nombre AS ClienteNombre,
                p.Monto,
                p.Estado,
                p.FechaPrestamo,
                (SELECT MIN(cu.FechaVencimiento)
                 FROM Cuotas cu
                 WHERE cu.IdPrestamo = p.IdPrestamo
                   AND cu.Estado = 'Pendiente') AS ProximoPago,
                CASE
                    WHEN p.Monto = 0 THEN 0
                    ELSE CAST(
                        (SELECT ISNULL(SUM(pa.MontoPagado),0)
                         FROM Pagos pa WHERE pa.IdPrestamo = p.IdPrestamo)
                        * 100.0 / p.Monto AS INT)
                END AS Progreso
            FROM Prestamos p
            INNER JOIN Clientes c ON p.IdCliente = c.IdCliente
            ORDER BY p.IdPrestamo DESC";

        using var cmd    = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        var list = new List<PrestamoReciente>();
        while (await reader.ReadAsync())
        {
            list.Add(new PrestamoReciente
            {
                IdPrestamo    = reader.GetInt32(reader.GetOrdinal("IdPrestamo")),
                ClienteNombre = reader.GetString(reader.GetOrdinal("ClienteNombre")),
                Monto         = reader.GetDecimal(reader.GetOrdinal("Monto")),
                Estado        = reader.GetString(reader.GetOrdinal("Estado")),
                ProximoPago   = reader.IsDBNull(reader.GetOrdinal("ProximoPago")) ? null : reader.GetDateTime(reader.GetOrdinal("ProximoPago")),
                Progreso      = reader.IsDBNull(reader.GetOrdinal("Progreso")) ? 0 : reader.GetInt32(reader.GetOrdinal("Progreso")),
            });
        }

        return Ok(list);
    }

    [HttpGet("alertas")]
    public async Task<IActionResult> GetAlertas()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string sql = @"
            SELECT TOP 5 mensaje FROM (
                SELECT CONCAT(c.Nombre, ' - cuota vencida en P-', RIGHT('000' + CAST(p.IdPrestamo AS VARCHAR), 3)) AS mensaje, cu.FechaVencimiento
                FROM Cuotas cu
                INNER JOIN Prestamos p ON cu.IdPrestamo = p.IdPrestamo
                INNER JOIN Clientes c ON p.IdCliente = c.IdCliente
                WHERE cu.Estado = 'Pendiente' AND cu.FechaVencimiento < GETDATE()
            ) alertas
            ORDER BY FechaVencimiento";

        using var cmd    = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        var alertas = new List<AlertaSistema>();
        while (await reader.ReadAsync())
            alertas.Add(new AlertaSistema { Mensaje = reader.GetString(0) });

        return Ok(alertas);
    }

    [HttpGet("cobros-hoy")]
    public async Task<IActionResult> GetCobrosHoy()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        const string sql = @"
            SELECT c.Nombre, cu.MontoCuota AS Monto
            FROM Cuotas cu
            INNER JOIN Prestamos p ON cu.IdPrestamo = p.IdPrestamo
            INNER JOIN Clientes c ON p.IdCliente = c.IdCliente
            WHERE CAST(cu.FechaVencimiento AS DATE) = CAST(GETDATE() AS DATE)
              AND cu.Estado = 'Pendiente'
            ORDER BY c.Nombre";

        using var cmd    = new SqlCommand(sql, conn);
        using var reader = await cmd.ExecuteReaderAsync();

        var cobros = new List<CobroHoy>();
        while (await reader.ReadAsync())
            cobros.Add(new CobroHoy { Nombre = reader.GetString(0), Monto = reader.GetDecimal(1) });

        return Ok(new CobrosHoyResponse { Cobros = cobros, Total = cobros.Sum(c => c.Monto) });
    }
}
