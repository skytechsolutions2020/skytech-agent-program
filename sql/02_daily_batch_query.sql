-- Version: V1.0 (2026-10-01) — sql/02_daily_batch_query.sql — V1.0
-- BackOffice agent: 20 unchecked companies in one industry and city
USE SkyTechCRM;
GO
DECLARE @Industry NVARCHAR(100) = 'Plumbing';
DECLARE @City     NVARCHAR(100) = 'Baltimore';

SELECT TOP 20 c.*
FROM Companies c
LEFT JOIN WebPresence w ON w.CompanyID = c.CompanyID
WHERE c.Industry = @Industry AND c.City = @City
  AND w.CompanyID IS NULL
ORDER BY c.EmployeeCount DESC;
