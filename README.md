# HelpDesk - Sistema de Gestión de Tickets

Sistema fullstack para administración de tickets de soporte (helpdesk),
construido como prueba técnica.

## Stack

- **Backend**: .NET 8, ASP.NET Core Web API, EF Core, SQL Server
- **Frontend**: Angular 20+ (standalone components), Bootstrap 5
- **Base de Datos**: SQL Server
- **Tests**: xUnit, Moq, FluentAssertions

## Estructura del repositorio

```
helpdesk/
├── backend/
│   ├── HelpDesk.API/            # Controllers, middleware, Program.cs
│   ├── HelpDesk.Application/    # DTOs, Services (casos de uso)
│   ├── HelpDesk.Domain/         # Entidades, enums, reglas de negocio
│   ├── HelpDesk.Infrastructure/ # EF Core, repositorios, migraciones
│   └── HelpDesk.Tests/          # Tests unitarios xUnit
├── frontend/
│   └── helpdesk-ui/              # Angular app
├── db/
│   ├── 01_ddl.sql
│   ├── 02_queries.sql
│   └── 03_performance.sql
└── docs/
    ├── backend-decisions.md
    ├── frontend-notes.md
    ├── caso-analisis.md
    └── HelpDesk.postman_collection.json
```

## Requisitos

- .NET SDK 8.0+
- Node.js 18+ y Angular CLI 20+
- SQL Server (local o instancia con nombre, ej. `localhost\PABLO_BD`)

## Cómo ejecutar

### 1. Backend

```bash
cd backend

# Configurar connection string en HelpDesk.API/appsettings.json
# "DefaultConnection": "Server=localhost\\PABLO_BD;Database=HelpDeskDB;Trusted_Connection=True;TrustServerCertificate=True"

# Aplicar migraciones (crea la BD automáticamente)
dotnet ef database update \
  --project HelpDesk.Infrastructure \
  --startup-project HelpDesk.API

# Ejecutar
cd HelpDesk.API
dotnet run
```

API disponible en `http://localhost:5000` (o el puerto que indique `dotnet run`, ej. `http://localhost:5274`)
Swagger en `http://localhost:5000/swagger`

### 2. Base de Datos (índices de performance opcionales)

Las tablas y datos base se crean automáticamente mediante migraciones de EF Core.
Para aplicar los índices adicionales de performance (sección `db/03_performance.sql`),
ejecutarlos manualmente en SSMS/Azure Data Studio contra `HelpDeskDB`:

```bash
# Desde SSMS, abrir y ejecutar:
db/03_performance.sql
```

Las consultas de la sección `db/02_queries.sql` pueden ejecutarse para validar
los reportes solicitados (listado paginado, top usuarios, búsqueda, tickets atrasados).

### 3. Frontend

```bash
cd frontend/helpdesk-ui
npm install
ng serve --open
```

App disponible en `http://localhost:4200`

> **Importante:** Verificar que `baseUrl` en `core/services/ticket.service.ts`
> coincida con el puerto real del backend (ej. `http://localhost:5274/api/tickets`).

### 4. Tests

```bash
cd backend
dotnet test
```

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/tickets?status=&priority=&q=&page=&pageSize=` | Lista paginada con filtros |
| GET | `/api/tickets/{id}` | Detalle de ticket + comentarios |
| POST | `/api/tickets` | Crear ticket |
| PUT | `/api/tickets/{id}` | Actualizar ticket |
| PATCH | `/api/tickets/{id}/status` | Cambiar estado |
| GET | `/api/tickets/{id}/comments` | Listar comentarios |
| POST | `/api/tickets/{id}/comments` | Agregar comentario |

### Ejemplo de request — Crear ticket

```http
POST /api/tickets
Content-Type: application/json
X-User: 1

{
  "title": "No funciona la impresora",
  "description": "La impresora del piso 3 no responde desde ayer",
  "priority": "Medium"
}
```

### Ejemplo de respuesta

```json
{
  "id": 4,
  "title": "No funciona la impresora",
  "description": "La impresora del piso 3 no responde desde ayer",
  "priority": "Medium",
  "status": "Open",
  "createdAt": "2026-06-11T10:30:00Z",
  "updatedAt": "2026-06-11T10:30:00Z",
  "createdBy": "Administrador",
  "comments": []
}
```

## Notas

- El header `X-User` simula autenticación (stub de JWT). El interceptor
  Angular lo agrega automáticamente con valor `1`.
- La base de datos se crea automáticamente al ejecutar el backend
  (migraciones aplicadas en `Program.cs`).
- Ver `/docs/backend-decisions.md`, `/docs/frontend-notes.md` y
  `/docs/caso-analisis.md` para detalles de diseño y trade-offs.
