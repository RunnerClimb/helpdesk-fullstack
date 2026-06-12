-- ============================================
-- DDL - HelpDesk Database
-- ============================================

CREATE TABLE Users (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Email       NVARCHAR(200) NOT NULL UNIQUE,
    DisplayName NVARCHAR(100) NOT NULL
);

CREATE TABLE Tickets (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    Title       NVARCHAR(120) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    Priority    NVARCHAR(20) NOT NULL
                CHECK (Priority IN ('Low','Medium','High','Critical')),
    Status      NVARCHAR(20) NOT NULL
                CHECK (Status IN ('Open','InProgress','Resolved','Closed')),
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedById INT NOT NULL,
    CONSTRAINT FK_Tickets_Users FOREIGN KEY (CreatedById)
        REFERENCES Users(Id)
);

CREATE TABLE Comments (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TicketId    INT NOT NULL,
    Text        NVARCHAR(1000) NOT NULL,
    CreatedAt   DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedById INT NOT NULL,
    CONSTRAINT FK_Comments_Tickets FOREIGN KEY (TicketId)
        REFERENCES Tickets(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (CreatedById)
        REFERENCES Users(Id)
);

-- Datos de ejemplo
INSERT INTO Users (Email, DisplayName) VALUES
('admin@helpdesk.com', 'Administrador'),
('jperez@empresa.com', 'Juan Pérez'),
('mlopez@empresa.com', 'María López');

INSERT INTO Tickets (Title, Description, Priority, Status, CreatedById) VALUES
('No funciona el login', 'Los usuarios no pueden iniciar sesión desde ayer', 'Critical', 'Open', 2),
('Error en reporte mensual', 'El reporte de ventas muestra totales incorrectos', 'High', 'InProgress', 3),
('Solicitud de acceso a carpeta', 'Necesito acceso a la carpeta compartida de RRHH', 'Low', 'Open', 2);

INSERT INTO Comments (TicketId, Text, CreatedById) VALUES
(1, 'Estamos revisando el servidor de autenticación', 1),
(1, 'Se identificó el problema, aplicando fix', 1),
(2, 'Validando con el equipo de BI', 1);
