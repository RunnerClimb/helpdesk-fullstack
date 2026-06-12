# Caso de Análisis: Módulo de Gestión de Incidencias

## A) Requerimientos

### Funcionales
1. Los operadores deben poder crear incidencias asociadas a una entrega fallida.
2. Los supervisores deben poder cambiar el estado de una incidencia (workflow: Open → Assigned → InProgress → Resolved → Closed).
3. Los supervisores deben poder asignar/reasignar responsables a una incidencia.
4. El sistema debe registrar un historial de auditoría de todos los cambios (estado, asignación, edición de campos).
5. Debe exponerse una API REST consumible por el frontend web y por terceros (con autenticación independiente).
6. El sistema debe permitir consultar (solo lectura) información del portal legado en Java para enriquecer las incidencias (ej. datos de la entrega/cliente).

### No funcionales
7. La API debe soportar registros de 10.000 incidencias/día (~7 incidencias/minuto en promedio, con registros mayores).
8. Autenticación basada en JWT y autorización por rol (Operador, Supervisor, Admin, ServicioExterno).
9. Toda entrada debe validarse (longitudes, tipos, enums) antes de persistir.
10. El sistema debe ser observable: logs estructurados, métricas de uso y trazas distribuidas (especialmente en la integración con el legado).

### Supuestos y preguntas abiertas
1. **¿El portal legado expone una API REST/SOAP, o el acceso es directo a su base de datos?** Esto determina si la integración es vía API Gateway o vía un proceso ETL/batch.
2. **¿Qué SLA de latencia se requiere al consultar el legado?** Si es lento, conviene cachear o replicar datos en lugar de consultar en tiempo real.
3. **¿Los 10.000 registros/día están distribuidos uniformemente o hay registros horarios concentrados** (ej. fin de turno)? Esto afecta el dimensionamiento de la infraestructura.
4. **¿Qué pasa si el legado está caído al crear una incidencia?** ¿Se permite crear sin los datos enriquecidos y completarlos después, o se bloquea la creación?
5. **¿Los terceros que consumen la API tienen requisitos de formato/contrato distintos** (ej. SOAP, versión de API específica) o pueden adaptarse al mismo contrato REST?
6. **¿La auditoría requiere cumplimiento normativo específico** (tiempo de retención, inmutabilidad, firma digital) o es solo trazabilidad interna?
7. **¿Qué entidad asigna los roles de usuario** — un sistema de identidad corporativo existente (AD/SSO) o se gestiona dentro del nuevo módulo?

---

## B) Propuesta Técnica

### Arquitectura de alto nivel

```
                    ┌─────────────────┐
                    │   Frontend Web   │ (Angular)
                    └────────┬─────────┘
                             │ HTTPS/JWT
                    ┌────────▼─────────┐
        Terceros ──▶│   API Gateway    │◀── Rate limiting, auth, logging
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
     │ Incidencias   │ │   Auditoría │ │  Integración  │
     │   API (.NET)  │ │   API/Log   │ │  Legado (Java)│
     └──────┬────────┘ └──────┬──────┘ └──────┬───────┘
            │                 │                │
            ▼                 ▼                ▼
     ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
     │  SQL Server   │ │ Audit Table │ │ Cola (Service │
     │  (Incidencias)│ │ / Event Log │ │  Bus / Kafka) │
     └───────────────┘ └─────────────┘ └──────────────┘
```

### Capas / módulos en .NET y Front

**.NET (Monolito modular)**:
- `Incidencias.API` — Controllers, autenticación JWT, autorización por rol
- `Incidencias.Application` — Casos de uso (CrearIncidencia, CambiarEstado, AsignarResponsable), validaciones FluentValidation
- `Incidencias.Domain` — Entidades, enums de workflow, reglas de transición de estado, eventos de dominio (ej. `IncidenciaEstadoCambiadoEvent`)
- `Incidencias.Infrastructure` — EF Core, repositorios, cliente HTTP/cola hacia el legado, publicación de eventos de auditoría
- `Incidencias.Audit` — Módulo separado (o tabla dedicada) que escucha eventos de dominio y persiste el historial

**Front (Angular)**:
- `core/` — servicios HTTP, interceptores JWT, guards por rol
- `features/incidencias/` — listado, detalle, asignación, cambio de estado
- `features/auditoria/` — vista de historial de cambios por incidencia
- `shared/` — componentes reutilizables (badges de estado, formularios)

### Estrategia de persistencia y auditoría

- **Persistencia principal**: SQL Server, tabla `Incidencias` con `RowVersion` (concurrencia optimista) dado que varios supervisores pueden editar en paralelo.
- **Auditoría**: tabla `IncidenciaAuditLog` (append-only) que registra `{IncidenciaId, Campo, ValorAnterior, ValorNuevo, UsuarioId, Timestamp, Accion}`. Se popula mediante:
  - Interceptor de EF Core (`SaveChangesInterceptor`) que detecta cambios en entidades trackeadas, **o**
  - Eventos de dominio publicados tras cada caso de uso (más explícito y testeable).
- Para los registros de 10.000/día, la tabla de auditoría debe particionarse por fecha o archivarse periódicamente (ej. job mensual que mueve registros antiguos a una tabla histórica).

### Estrategia de integración con sistema legado (Java, solo lectura)

Dado que es **solo lectura** y el legado es Java (probablemente con su propia BD o servicios SOAP):

1. **Opción preferida — API Gateway + caché**: si el legado expone algún endpoint (REST/SOAP), se consume a través de un **adaptador** (`Incidencias.Infrastructure.LegacyClient`) que traduce el contrato legado a un modelo interno. Se aplica **caché de corta duración** (ej. Redis, TTL 5 min) para datos que cambian poco (info de cliente/entrega), evitando llamadas síncronas en cada request.
2. **Opción batch (si el legado no expone API)**: un job programado (ej. cada 15 min) lee de la BD legada (vista de solo lectura) y replica los datos relevantes a una tabla local `EntregasLegacy` mediante ETL. La API de Incidencias consulta esta copia local, desacoplándose completamente de la disponibilidad del legado.
3. En ambos casos, si el legado no responde, la incidencia se crea igual con los campos enriquecidos en `null`/pendientes, y un proceso de reconciliación los completa después (no se bloquea la operación crítica).

### Manejo de errores y observabilidad

- **Logs estructurados** (Serilog + Seq/ELK): cada request con `CorrelationId`, usuario, acción y resultado.
- **Métricas** (Prometheus/Grafana o Application Insights): tasa de creación de incidencias, latencia de la API, tasa de error de la integración con el legado.
- **Trazas distribuidas** (OpenTelemetry): especialmente en la llamada al legado y a la cola de mensajería, para diagnosticar cuellos de botella.
- **Manejo de errores**: middleware global (igual que en el ejercicio práctico) + circuit breaker (Polly) en el cliente del legado para evitar cascadas de fallos si el legado está caído.

---

## C) ADRs (Architecture Decision Records)

### ADR-001: Monolito modular vs Microservicios

**Contexto**: el sistema debe integrarse con un legado, exponer API a terceros y manejar 10k incidencias/día, con un equipo Scrum de tamaño moderado y releases quincenales.

**Decisión**: optar por un **monolito modular** (.NET, módulos por bounded context: Incidencias, Auditoría, Integración) en lugar de microservicios desde el inicio.

**Consecuencias**: despliegue y testing más simples, menor complejidad operacional (no se requiere orquestación de múltiples servicios). Trade-off: si en el futuro un módulo (ej. Integración con legado) necesita escalar independientemente o usar otro lenguaje, se puede extraer como microservicio aprovechando los límites de módulo ya definidos.

---

### ADR-002: JWT vs Cookies para autenticación

**Contexto**: la API debe ser consumida tanto por el frontend web (Angular) como por sistemas de terceros, con autorización por rol.

**Decisión**: usar **JWT (Bearer tokens)** en lugar de cookies de sesión.

**Consecuencias**: los tokens son fáciles de propagar a terceros (header `Authorization`), no requieren estado en el servidor (escalable horizontalmente) y los roles/claims viajan embebidos en el token. Trade-off: la revocación inmediata de tokens es más compleja (requiere blacklist o tokens de corta duración + refresh tokens), a diferencia de cookies de sesión que se pueden invalidar server-side instantáneamente.

---

## D) Sprint Plan (2 semanas)

### User Stories

1. **Como** operador, **quiero** crear una incidencia asociada a una entrega fallida **para** notificar el problema al equipo correspondiente.
   - **Estimación**: M

2. **Como** operador, **quiero** ver el estado actual de mis incidencias creadas **para** dar seguimiento sin necesitar a un supervisor.
   - **Estimación**: S

3. **Como** supervisor, **quiero** cambiar el estado de una incidencia (Open → Assigned → InProgress → Resolved → Closed) **para** reflejar el progreso real del trabajo.
   - **Estimación**: M

4. **Como** supervisor, **quiero** asignar una incidencia a un responsable **para** delegar su resolución.
   - **Estimación**: M

5. **Como** supervisor o auditor, **quiero** ver el historial de cambios de una incidencia **para** rastrear quién hizo qué y cuándo.
   - **Estimación**: L

6. **Como** sistema externo (tercero), **quiero** consultar incidencias vía API autenticada **para** integrarlas con mi propio sistema de reportes.
   - **Estimación**: M

7. **Como** operador, **quiero** ver datos enriquecidos de la entrega (desde el portal legado) al crear una incidencia **para** no tener que buscarlos manualmente.
   - **Estimación**: L

8. **Como** administrador, **quiero** que el sistema siga funcionando si el portal legado está caído **para** no bloquear la operación diaria.
   - **Estimación**: M

### Criterios de aceptación (2 historias)

**Historia 1 — Crear incidencia**
- Dado que soy un operador autenticado, cuando completo título, descripción y selecciono la entrega afectada, y presiono "Crear", entonces la incidencia se guarda con estado `Open` y se registra en el log de auditoría con mi usuario y timestamp.
- Si algún campo requerido falta o excede su longitud máxima, el sistema muestra un error de validación sin guardar.
- La incidencia creada recibe un ID único y queda visible inmediatamente en el listado del operador.

**Historia 3 — Cambiar estado**
- Dado que soy supervisor y la incidencia está en estado `Open`, cuando selecciono "Asignar" entonces el estado cambia a `Assigned` y se registra en auditoría.
- Si intento una transición no permitida (ej. de `Closed` a `Open` directamente), el sistema responde `409 Conflict` con un mensaje claro y no modifica el estado.
- Cada cambio de estado exitoso queda visible en el historial de auditoría de la incidencia en menos de 1 segundo.

### Riesgos

1. **Disponibilidad/latencia del portal legado desconocida**: si la integración (historia 7) toma más tiempo del estimado por falta de documentación del legado, puede retrasar el sprint completo. *Mitigación*: hacer un spike técnico de 1 día al inicio del sprint para validar el contrato del legado.
2. **Volumen de auditoría (10k incidencias/día) puede degradar performance** si la tabla de auditoría no se diseña con índices/particionamiento adecuados desde el inicio. *Mitigación*: incluir pruebas de carga básicas antes de cerrar la historia 5.
3. **Definición de roles y permisos aún no está cerrada con el cliente** (pregunta abierta #7), lo que puede causar retrabajo en historias 3, 4 y 6 si los roles cambian a mitad de sprint. *Mitigación*: confirmar matriz de roles/permisos en el primer día del sprint con el Product Owner.
