namespace SolucionesFinancieras.API.Models;

public class PagoResponse
{
    public string Recibo { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Prestamo { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public string Fecha { get; set; } = string.Empty;
    public string Metodo { get; set; } = string.Empty;
}

public class PagoRequest
{
    public int IdPrestamo { get; set; }
    public decimal Monto { get; set; }
    public DateTime? Fecha { get; set; }
    public string Metodo { get; set; } = "Efectivo";
}