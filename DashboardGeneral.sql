USE SolucionesFinancieras;
GO

CREATE PROCEDURE DashboardGeneral
AS
BEGIN
    SELECT
        (SELECT COUNT(*) FROM Clientes) AS TotalClientes,

        (SELECT COUNT(*) 
         FROM Prestamos
         WHERE Estado = 'Activo') AS PrestamosActivos,

        (SELECT ISNULL(SUM(MontoPagado),0)
         FROM Pagos) AS TotalCobrado,

        (SELECT COUNT(*)
         FROM Cuotas
         WHERE Estado = 'Pendiente') AS CuotasPendientes,

        (SELECT COUNT(*)
         FROM Cuotas
         WHERE FechaVencimiento < GETDATE()
         AND Estado = 'Pendiente') AS CuotasVencidas;
END;
GO