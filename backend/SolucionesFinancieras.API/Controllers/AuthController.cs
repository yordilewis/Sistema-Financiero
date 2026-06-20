using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using SolucionesFinancieras.API.Data;
using SolucionesFinancieras.API.Models;

namespace SolucionesFinancieras.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly DbConnection _db;
    private readonly IConfiguration _config;

    public AuthController(DbConnection db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        using var conn = _db.CreateConnection();
        await conn.OpenAsync();

        using var cmd = new SqlCommand("LoginUsuario", conn);
        cmd.CommandType = System.Data.CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@NombreUsuario", request.NombreUsuario);
        cmd.Parameters.AddWithValue("@Clave", request.Clave);

        using var reader = await cmd.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        var usuario = new Usuario
        {
            IdUsuario      = reader.GetInt32(reader.GetOrdinal("IdUsuario")),
            NombreUsuario  = reader.GetString(reader.GetOrdinal("NombreUsuario")),
            NombreCompleto = reader.GetString(reader.GetOrdinal("NombreCompleto")),
            NombreRol      = reader.GetString(reader.GetOrdinal("NombreRol"))
        };

        return Ok(new LoginResponse { Token = GenerarToken(usuario), Usuario = usuario });
    }

    private string GenerarToken(Usuario usuario)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expira = DateTime.UtcNow.AddHours(double.Parse(_config["Jwt:ExpiresInHours"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
            new Claim(ClaimTypes.Name,            usuario.NombreUsuario),
            new Claim(ClaimTypes.Role,            usuario.NombreRol),
        };

        var token = new JwtSecurityToken(
            issuer:            _config["Jwt:Issuer"],
            audience:          _config["Jwt:Audience"],
            claims:            claims,
            expires:           expira,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
