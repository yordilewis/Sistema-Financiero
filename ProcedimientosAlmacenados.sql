
USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ActualizarCliente]    Script Date: 21/5/2026 4:04:17 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ActualizarCliente]
(
    @IdCliente INT,
    @Nombre VARCHAR(100),
    @Telefono VARCHAR(20),
    @Cedula VARCHAR(20),
    @Direccion VARCHAR(200),
    @Estado VARCHAR(20)
)
AS
BEGIN
    UPDATE Clientes
    SET
        Nombre = @Nombre,
        Telefono = @Telefono,
        Cedula = @Cedula,
        Direccion = @Direccion,
        Estado = @Estado
    WHERE IdCliente = @IdCliente;
END;
GO


USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ConsultarClientes]    Script Date: 21/5/2026 4:15:02 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ConsultarClientes]
AS
BEGIN
    SELECT * FROM Clientes;
END;
GO

USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ConsultarPagos]    Script Date: 21/5/2026 4:16:41 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[ConsultarPagos]
AS
BEGIN
    SELECT * FROM Pagos;
END;
GO


USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ConsultarPagosClientes]    Script Date: 21/5/2026 4:17:12 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ConsultarPagosClientes]
AS
BEGIN
    SELECT
        Pagos.IdPago,
        Clientes.Nombre,
        Prestamos.IdPrestamo,
        Pagos.MontoPagado,
        Pagos.FechaPago,
        Pagos.MetodoPago,
        Pagos.Observaciones
    FROM Pagos
    INNER JOIN Prestamos
        ON Pagos.IdPrestamo = Prestamos.IdPrestamo
    INNER JOIN Clientes
        ON Prestamos.IdCliente = Clientes.IdCliente;
END;
GO

USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ConsultarPrestamos]    Script Date: 21/5/2026 4:18:03 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ConsultarPrestamos]
AS
BEGIN
    SELECT * FROM Prestamos;
END;
GO


USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[ConsultarPrestamosClientes]    Script Date: 21/5/2026 4:18:30 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[ConsultarPrestamosClientes]
AS
BEGIN
    SELECT
        Prestamos.IdPrestamo,
        Clientes.Nombre,
        Prestamos.Monto,
        Prestamos.Interes,
        Prestamos.CantidadCuotas,
        Prestamos.FechaPrestamo,
        Prestamos.Estado
    FROM Prestamos
    INNER JOIN Clientes
    ON Prestamos.IdCliente = Clientes.IdCliente;
END;
GO

USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[EliminarCliente]    Script Date: 21/5/2026 4:19:00 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[EliminarCliente]
(
    @IdCliente INT
)
AS
BEGIN
    DELETE FROM Clientes
    WHERE IdCliente = @IdCliente;
END;
GO


USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[RegistrarCliente]    Script Date: 21/5/2026 4:19:32 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RegistrarCliente]
(
    @Nombre VARCHAR(100),
    @Telefono VARCHAR(20),
    @Cedula VARCHAR(20),
    @Direccion VARCHAR(200)
)
AS
BEGIN
    INSERT INTO Clientes
    (Nombre, Telefono, Cedula, Direccion)
    VALUES
    (@Nombre, @Telefono, @Cedula, @Direccion);
END;
GO


USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[RegistrarPago]    Script Date: 21/5/2026 4:20:24 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO


CREATE PROCEDURE [dbo].[RegistrarPago]
(
    @IdPrestamo INT,
    @MontoPagado DECIMAL(18,2),
    @FechaPago DATE,
    @MetodoPago VARCHAR(50),
    @Observaciones VARCHAR(200)
)
AS
BEGIN
    INSERT INTO Pagos
    (IdPrestamo, MontoPagado, FechaPago, MetodoPago, Observaciones)
    VALUES
    (@IdPrestamo, @MontoPagado, @FechaPago, @MetodoPago, @Observaciones);
END;
GO

USE [SolucionesFinancieras]
GO

/****** Object:  StoredProcedure [dbo].[RegistrarPrestamo]    Script Date: 21/5/2026 4:21:04 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE PROCEDURE [dbo].[RegistrarPrestamo]
(
    @IdCliente INT,
    @Monto DECIMAL(18,2),
    @Interes DECIMAL(5,2),
    @CantidadCuotas INT,
    @FechaPrestamo DATE
)
AS
BEGIN
    INSERT INTO Prestamos
    (IdCliente, Monto, Interes, CantidadCuotas, FechaPrestamo)
    VALUES
    (@IdCliente, @Monto, @Interes, @CantidadCuotas, @FechaPrestamo);
END;
GO

-- LOGIN USUARIO
USE SolucionesFinancieras;
GO

CREATE PROCEDURE LoginUsuario
(
    @NombreUsuario VARCHAR(50),
    @Clave VARCHAR(100)
)
AS
BEGIN
    SELECT
        Usuarios.IdUsuario,
        Usuarios.NombreUsuario,
        Usuarios.NombreCompleto,
        Roles.NombreRol
    FROM Usuarios
    INNER JOIN Roles
        ON Usuarios.IdRol = Roles.IdRol
    WHERE
        Usuarios.NombreUsuario = @NombreUsuario
        AND Usuarios.Clave = @Clave
        AND Usuarios.Estado = 'Activo';
END;
GO


