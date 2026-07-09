using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using SolucionesFinancieras.API.Data;
using SolucionesFinancieras.API.Models;

namespace SolucionesFinancieras.API.Controllers;

[ApiController]
[Route("api/clientes")]
public class ClientesController : ControllerBase
{
    private readonly DbConnection _db;

    public ClientesController(DbConnection db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetClientes()
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("ConsultarClientes", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;

        using var reader = await cmd.ExecuteReaderAsync();

        var list = new List<ClienteResponse>();
        while (await reader.ReadAsync())
        {
            var idCliente      = reader.GetInt32(reader.GetOrdinal("IdCliente"));
            var nombreCompleto = reader.GetString(reader.GetOrdinal("Nombre"));
            var partes         = nombreCompleto.Split(' ', 2);

            list.Add(new ClienteResponse
            {
                Id        = "C-" + idCliente.ToString("D3"),
                IdCliente = idCliente,
                Nombre    = partes[0],
                Apellido  = partes.Length > 1 ? partes[1] : "",
                Telefono  = reader.IsDBNull(reader.GetOrdinal("Telefono"))  ? "" : reader.GetString(reader.GetOrdinal("Telefono")),
                Cedula    = reader.IsDBNull(reader.GetOrdinal("Cedula"))    ? "" : reader.GetString(reader.GetOrdinal("Cedula")),
                Direccion = reader.IsDBNull(reader.GetOrdinal("Direccion")) ? "" : reader.GetString(reader.GetOrdinal("Direccion")),
                Estado    = reader.IsDBNull(reader.GetOrdinal("Estado"))    ? "Activo" : reader.GetString(reader.GetOrdinal("Estado")),
            });
        }

        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> RegistrarCliente([FromBody] ClienteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            return BadRequest(new { mensaje = "El nombre es obligatorio" });

        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("RegistrarCliente", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@Nombre",    (request.Nombre + " " + request.Apellido).Trim());
        cmd.Parameters.AddWithValue("@Telefono",  request.Telefono);
        cmd.Parameters.AddWithValue("@Cedula",    request.Cedula);
        cmd.Parameters.AddWithValue("@Direccion", request.Direccion);

        await cmd.ExecuteNonQueryAsync();
        return Ok(new { mensaje = "Cliente registrado" });
    }

    [HttpPut("{idCliente:int}")]
    public async Task<IActionResult> ActualizarCliente(int idCliente, [FromBody] ClienteRequest request)
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("ActualizarCliente", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@IdCliente", idCliente);
        cmd.Parameters.AddWithValue("@Nombre",    (request.Nombre + " " + request.Apellido).Trim());
        cmd.Parameters.AddWithValue("@Telefono",  request.Telefono);
        cmd.Parameters.AddWithValue("@Cedula",    request.Cedula);
        cmd.Parameters.AddWithValue("@Direccion", request.Direccion);
        cmd.Parameters.AddWithValue("@Estado",    request.Estado);

        await cmd.ExecuteNonQueryAsync();
        return Ok(new { mensaje = "Cliente actualizado" });
    }

    [HttpDelete("{idCliente:int}")]
    public async Task<IActionResult> EliminarCliente(int idCliente)
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("EliminarCliente", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@IdCliente", idCliente);

        try
        {
            await cmd.ExecuteNonQueryAsync();
            return Ok(new { mensaje = "Cliente eliminado" });
        }
        catch (SqlException ex) when (ex.Number == 547)
        {
            return Conflict(new { mensaje = "No se puede eliminar: el cliente tiene préstamos registrados" });
        }
    }
}