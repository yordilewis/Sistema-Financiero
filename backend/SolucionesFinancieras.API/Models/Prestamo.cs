namespace SolucionesFinancieras.API.Models;

public class PrestamoResponse
{
    public string Id { get; set; } = string.Empty;
    public int IdPrestamo { get; set; }
    public string Cliente { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string Tasa { get; set; } = string.Empty;
    public int Cuotas { get; set; }
    public int Pagadas { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string ProximoPago { get; set; } = string.Empty;
}

public class PrestamoRequest
{
    public int IdCliente { get; set; }
    public decimal Monto { get; set; }
    public decimal Interes { get; set; }
    public int CantidadCuotas { get; set; }
}