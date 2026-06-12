-- ============================================
-- ÍNDICES PROPUESTOS
-- ============================================

-- 1) Índice para filtros frecuentes por Status y Priority
--    Justificación: el endpoint GET /api/tickets filtra constantemente
--    por estos campos (Status=Open, Priority=High, etc.). Sin índice,
--    SQL Server hace un Table Scan completo en cada consulta.
--    Se incluye CreatedAt para soportar el ORDER BY sin operación
--    adicional de sort (covering index parcial).
CREATE NONCLUSTERED INDEX IX_Tickets_Status_Priority_CreatedAt
ON Tickets (Status, Priority, CreatedAt DESC)
INCLUDE (Title, CreatedById);

-- 2) Índice para la FK de Comments -> Tickets
--    Justificación: el conteo de comentarios por ticket (JOIN + GROUP BY)
--    y la consulta GET /api/tickets/{id}/comments dependen de buscar
--    por TicketId. Sin índice en la FK, cada JOIN provoca un escaneo
--    completo de la tabla Comments.
CREATE NONCLUSTERED INDEX IX_Comments_TicketId
ON Comments (TicketId)
INCLUDE (Text, CreatedAt, CreatedById);


-- ============================================
-- CÓMO VALIDAR LA MEJORA
-- ============================================
-- 1. Activar estadísticas de IO y tiempo:
SET STATISTICS IO ON;
SET STATISTICS TIME ON;

-- 2. Ejecutar la query objetivo antes y después de crear el índice,
--    comparando:
--    - "logical reads" (menos páginas leídas = mejor)
--    - "CPU time" / "elapsed time"

-- 3. Revisar el Plan de Ejecución (Ctrl+M en SSMS):
--    - Antes: buscar "Table Scan" o "Clustered Index Scan" (costoso)
--    - Después: debería aparecer "Index Seek" (mucho más eficiente)

-- 4. Revisar estadísticas de la tabla:
DBCC SHOW_STATISTICS ('Tickets', 'IX_Tickets_Status_Priority_CreatedAt');

-- 5. Monitorear con sys.dm_db_index_usage_stats para confirmar
--    que el índice realmente se está usando en producción:
SELECT
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks,
    s.user_scans,
    s.user_lookups
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE OBJECT_NAME(s.object_id) IN ('Tickets', 'Comments');


-- ============================================
-- ANTIPATRONES IDENTIFICADOS
-- ============================================

-- ANTIPATRÓN 1: SELECT * en lugar de columnas específicas
-- Malo:
--   SELECT * FROM Tickets WHERE Status = 'Open'
-- Bueno:
--   SELECT Id, Title, Priority, Status, CreatedAt FROM Tickets WHERE Status = 'Open'
-- Razón: trae columnas innecesarias (ej. Description de 2000 chars),
-- aumenta IO de red y memoria, e impide el uso de índices "covering".

-- ANTIPATRÓN 2: Funciones sobre columnas filtradas (no SARGable)
-- Malo:
--   SELECT * FROM Tickets WHERE YEAR(CreatedAt) = 2025
-- Bueno:
--   SELECT * FROM Tickets
--   WHERE CreatedAt >= '2025-01-01' AND CreatedAt < '2026-01-01'
-- Razón: aplicar una función a la columna impide que SQL Server use
-- el índice (no SARGable), forzando un escaneo completo de tabla.

-- ANTIPATRÓN 3 (adicional): Falta de índice en columnas de FK
-- Sin índice en Comments.TicketId, cada JOIN Tickets-Comments
-- y cada borrado en cascada provoca un escaneo completo de Comments,
-- degradando drásticamente el performance con picos de tráfico
-- (ej. 10.000 incidencias/día mencionadas en el caso de análisis).
