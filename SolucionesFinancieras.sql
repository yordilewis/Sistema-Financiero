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