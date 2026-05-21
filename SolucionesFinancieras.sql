CREATE DATABASE SolucionesFinancieras;
GO

USE SolucionesFinancieras;
GO

-- TABLA CLIENTES
CREATE TABLE Clientes (
    IdCliente INT PRIMARY KEY IDENTITY(1,1),
    Nombre VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20),
    Cedula VARCHAR(20),
    Direccion VARCHAR(200),
    Estado VARCHAR(20) DEFAULT 'Activo'
);

-- TABLA PRESTAMOS
CREATE TABLE Prestamos (
    IdPrestamo INT PRIMARY KEY IDENTITY(1,1),
    IdCliente INT NOT NULL,
    Monto DECIMAL(18,2),
    Interes DECIMAL(5,2),
    CantidadCuotas INT,
    FechaPrestamo DATE,
    Estado VARCHAR(20) DEFAULT 'Activo',

    FOREIGN KEY (IdCliente)
    REFERENCES Clientes(IdCliente)
);

-- TABLA PAGOS
CREATE TABLE Pagos (
    IdPago INT PRIMARY KEY IDENTITY(1,1),
    IdPrestamo INT NOT NULL,
    MontoPagado DECIMAL(18,2),
    FechaPago DATE,
    MetodoPago VARCHAR(50),
    Observaciones VARCHAR(200),

    FOREIGN KEY (IdPrestamo)
    REFERENCES Prestamos(IdPrestamo)
);

-- TABLA CUOTAS
CREATE TABLE Cuotas (
    IdCuota INT PRIMARY KEY IDENTITY(1,1),
    IdPrestamo INT NOT NULL,
    NumeroCuota INT,
    MontoCuota DECIMAL(18,2),
    FechaVencimiento DATE,
    Estado VARCHAR(20) DEFAULT 'Pendiente',

    FOREIGN KEY (IdPrestamo)
    REFERENCES Prestamos(IdPrestamo)
);
