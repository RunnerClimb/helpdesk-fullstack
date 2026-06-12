-- ============================================
-- 1. Listado paginado con total de comentarios y creador
-- ============================================
DECLARE @Status NVARCHAR(20) = 'Open';
DECLARE @Priority NVARCHAR(20) = NULL;
DECLARE @Page INT = 1;
DECLARE @PageSize INT = 10;

SELECT
    t.Id,
    t.Title,
    t.Priority,
    t.Status,
    t.CreatedAt,
    u.DisplayName AS CreatedBy,
    COUNT(c.Id) AS CommentsCount
FROM Tickets t
INNER JOIN Users u ON u.Id = t.CreatedById
LEFT JOIN Comments c ON c.TicketId = t.Id
WHERE (@Status IS NULL OR t.Status = @Status)
  AND (@Priority IS NULL OR t.Priority = @Priority)
GROUP BY t.Id, t.Title, t.Priority, t.Status, t.CreatedAt, u.DisplayName
ORDER BY t.CreatedAt DESC
OFFSET (@Page - 1) * @PageSize ROWS
FETCH NEXT @PageSize ROWS ONLY;


-- ============================================
-- 2. Top 5 usuarios que más tickets crearon en el último mes
-- ============================================
SELECT TOP 5
    u.Id,
    u.DisplayName,
    u.Email,
    COUNT(t.Id) AS TicketsCreated
FROM Users u
INNER JOIN Tickets t ON t.CreatedById = u.Id
WHERE t.CreatedAt >= DATEADD(MONTH, -1, SYSUTCDATETIME())
GROUP BY u.Id, u.DisplayName, u.Email
ORDER BY TicketsCreated DESC;


-- ============================================
-- 3. Búsqueda por texto (case-insensitive) en Title o Description
-- ============================================
DECLARE @q NVARCHAR(100) = 'login';

SELECT
    t.Id,
    t.Title,
    t.Description,
    t.Status,
    t.Priority
FROM Tickets t
WHERE t.Title LIKE '%' + @q + '%'
   OR t.Description LIKE '%' + @q + '%';
-- Nota: SQL Server por defecto usa collation case-insensitive (CI),
-- por lo que LIKE ya es case-insensitive. Si la collation fuera CS,
-- se podría forzar con: COLLATE Latin1_General_CI_AI


-- ============================================
-- 4. Tickets "atrasados": creados hace más de X días y NO cerrados
-- ============================================
DECLARE @Days INT = 7;

SELECT
    t.Id,
    t.Title,
    t.Status,
    t.Priority,
    t.CreatedAt,
    DATEDIFF(DAY, t.CreatedAt, SYSUTCDATETIME()) AS DaysOpen,
    u.DisplayName AS CreatedBy
FROM Tickets t
INNER JOIN Users u ON u.Id = t.CreatedById
WHERE t.Status <> 'Closed'
  AND t.CreatedAt <= DATEADD(DAY, -@Days, SYSUTCDATETIME())
ORDER BY t.CreatedAt ASC;
