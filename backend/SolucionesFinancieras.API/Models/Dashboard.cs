namespace SolucionesFinancieras.API.Models;

public class DashboardMetrics
{
    public decimal CapitalActivo { get; set; }
    public int TotalClientes { get; set; }
    public int ClientesNuevosMes { get; set; }
    public decimal TotalCobrado { get; set; }
    public int CuotasPendientes { get; set; }
    public decimal MontoEnAtraso { get; set; }
    public int PrestamosEnAtraso { get; set; }
}

public class PrestamoReciente
{
    public int IdPrestamo { get; set; }
    public string ClienteNombre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public int Progreso { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime? ProximoPago { get; set; }
}

public class AlertaSistema
{
    public string Mensaje { get; set; } = string.Empty;
}

public class CobroHoy
{
    public string Nombre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
}

public class CobrosHoyResponse
{
    public List<CobroHoy> Cobros { get; set; } = new();
    public decimal Total { get; set; }
}
