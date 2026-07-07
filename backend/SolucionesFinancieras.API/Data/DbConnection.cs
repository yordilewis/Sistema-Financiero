using Microsoft.Data.SqlClient;

namespace SolucionesFinancieras.API.Data;

public class DbConnection
{
    private readonly string _connectionString;

    public DbConnection(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("DefaultConnection")!;
    }

    public SqlConnection CreateConnection() => new SqlConnection(_connectionString);
}
