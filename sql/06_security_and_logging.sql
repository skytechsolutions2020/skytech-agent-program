-- Version: V1.1 (2026-10-10) — sql/06_security_and_logging.sql — V1.1
-- Change  : V1.1 — DENY on usp_BackupSkyTechCRM moved below its CREATE (V1.0 gave Msg 15151 on first run).
-- Purpose : database security and resilience for SkyTechCRM (SQL Server 2014 Developer, SSMS).
--   1. SkyTechApp role  — least privilege: read/write data and run procedures; no table changes, no audit edits.
--   2. Optional SQL login for the Admin site (commented out; Windows login stays the default and recommended).
--   3. Audit log protection — dbo.AuditLog can be added to but never edited or deleted (SKY-SEC-006, error 50100).
--   4. dbo.usp_BackupSkyTechCRM — full, compressed, checksummed backup + verification (SKY-BAK-001 / SKY-BAK-003).
--   5. dbo.usp_PurgeErrorLog — removes old rows from dbo.ErrorLog (keeps 90 days by default).
--   6. Optional SQL Server Audit of failed logins and permission changes (commented out).
-- Run     : AFTER 01 → lead import → 04 → 05. Execute as the owner (your Windows login). SAFE TO RE-RUN; never deletes data.
-- Errors  : every failure is written to dbo.ErrorLog and explained in docs/architecture/SkyTech_Troubleshooting_Guide.
USE SkyTechCRM;
GO
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;
GO
IF OBJECT_ID(N'dbo.usp_LogError', N'P') IS NULL
  RAISERROR (N'[SKY-DB-005] Run sql/01_create_skytechcrm.sql (V2.3+) first - dbo.usp_LogError is missing.', 16, 1);
GO
---------------------------------------------------------------- 1. least-privilege application role
-- SkyTechApp: what the Admin site needs and nothing more. Schema-level grants cover new tables automatically.
-- No ALTER/CREATE/DROP rights, so a bug or an attacker using the app cannot change the database design.
IF DATABASE_PRINCIPAL_ID(N'SkyTechApp') IS NULL CREATE ROLE SkyTechApp AUTHORIZATION dbo;
GO
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO SkyTechApp;
GRANT EXECUTE ON SCHEMA::dbo TO SkyTechApp;
-- audit and error history are append-only for the application
DENY UPDATE, DELETE ON dbo.AuditLog TO SkyTechApp;
DENY UPDATE, DELETE ON dbo.ErrorLog TO SkyTechApp;
GO
---------------------------------------------------------------- 2. optional dedicated SQL login (DB_AUTH=sql)
-- Use only if Windows login cannot be used. Pick your own strong password (16+ characters) in SSMS - never store it
-- in this file or in GitHub; put it only in admin-site\.env as DB_PASSWORD. Remove the leading "--" to run.
-- USE master;
-- CREATE LOGIN SkyTechAdminSite WITH PASSWORD = N'<your strong password>', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = SkyTechCRM;
-- USE SkyTechCRM;
-- CREATE USER SkyTechAdminSite FOR LOGIN SkyTechAdminSite;
-- ALTER ROLE SkyTechApp ADD MEMBER SkyTechAdminSite;
GO
---------------------------------------------------------------- 3. audit log is append-only
-- trg_AuditLog_Protect: blocks UPDATE and DELETE on dbo.AuditLog for everyone (even the owner) with error 50100.
-- To archive very old audit rows, an owner must first run: DISABLE TRIGGER dbo.trg_AuditLog_Protect ON dbo.AuditLog;
-- (and ENABLE it again straight after). That action itself shows in the SQL Server log.
IF OBJECT_ID(N'dbo.trg_AuditLog_Protect', N'TR') IS NOT NULL DROP TRIGGER dbo.trg_AuditLog_Protect;
GO
CREATE TRIGGER dbo.trg_AuditLog_Protect ON dbo.AuditLog
INSTEAD OF UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;
  THROW 50100, N'[SKY-SEC-006] dbo.AuditLog is append-only; rows cannot be changed or deleted.', 1;
END
GO
---------------------------------------------------------------- 4. backup with verification
-- dbo.usp_BackupSkyTechCRM: full backup to @Folder\SkyTechCRM_YYYYMMDD_HHMM.bak with CHECKSUM (detects damaged pages),
-- COMPRESSION, then RESTORE VERIFYONLY (proves the file can be restored). Creates the folder if missing.
-- Run weekly (doctor warns after 7 days, SKY-BAK-003):  EXEC dbo.usp_BackupSkyTechCRM;
-- Restore (SKY-BAK-002), in SSMS as owner:
--   RESTORE DATABASE SkyTechCRM FROM DISK = N'C:\SkyTechBackups\<file>.bak' WITH REPLACE, CHECKSUM;
-- Copy the .bak files off this computer (USB drive or cloud folder); *.bak is git-ignored and never goes to GitHub.
IF OBJECT_ID(N'dbo.usp_BackupSkyTechCRM', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_BackupSkyTechCRM;
GO
CREATE PROCEDURE dbo.usp_BackupSkyTechCRM
  @Folder NVARCHAR(200) = N'C:\SkyTechBackups'
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @file NVARCHAR(400) = @Folder + N'\SkyTechCRM_' + CONVERT(CHAR(8), GETDATE(), 112) + N'_'
                               + REPLACE(CONVERT(CHAR(5), GETDATE(), 108), ':', '') + N'.bak';
  BEGIN TRY
    EXEC master.dbo.xp_create_subdir @Folder;   -- no error if it already exists
    BACKUP DATABASE SkyTechCRM TO DISK = @file WITH INIT, CHECKSUM, COMPRESSION, NAME = N'SkyTechCRM full backup';
    RESTORE VERIFYONLY FROM DISK = @file WITH CHECKSUM;
    SELECT N'Backup OK and verified' AS Result, @file AS BackupFile, GETDATE() AS FinishedOn;
  END TRY
  BEGIN CATCH
    DECLARE @ctx NVARCHAR(400) = LEFT(@file, 400);
    EXEC dbo.usp_LogError @ProcedureName = N'usp_BackupSkyTechCRM', @SkyCode = 'SKY-BAK-001', @Context = @ctx;
    THROW;
  END CATCH
END
GO
-- backups are run by the owner in SSMS, not by the website (placed after CREATE so it also survives re-runs)
DENY EXECUTE ON dbo.usp_BackupSkyTechCRM TO SkyTechApp;
GO
---------------------------------------------------------------- 5. error log housekeeping
-- dbo.usp_PurgeErrorLog: deletes ErrorLog rows older than @KeepDays (default 90). Owner use; returns rows removed.
IF OBJECT_ID(N'dbo.usp_PurgeErrorLog', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_PurgeErrorLog;
GO
CREATE PROCEDURE dbo.usp_PurgeErrorLog
  @KeepDays INT = 90
AS
BEGIN
  SET NOCOUNT ON;
  IF @KeepDays < 7 SET @KeepDays = 7;   -- never wipe the most recent week by mistake
  DELETE FROM dbo.ErrorLog WHERE LoggedOn < DATEADD(day, -@KeepDays, GETDATE());
  SELECT @@ROWCOUNT AS RowsRemoved, @KeepDays AS KeptDays;
END
GO
DENY EXECUTE ON dbo.usp_PurgeErrorLog TO SkyTechApp;
GO
---------------------------------------------------------------- 6. optional SQL Server Audit (Developer edition supports it)
-- Records failed logins and permission changes to C:\SkyTechBackups\Audit. Remove the leading "--" to enable.
-- USE master;
-- EXEC master.dbo.xp_create_subdir N'C:\SkyTechBackups\Audit';
-- CREATE SERVER AUDIT SkyTechAudit TO FILE (FILEPATH = N'C:\SkyTechBackups\Audit\', MAXSIZE = 50 MB, MAX_ROLLOVER_FILES = 10);
-- CREATE SERVER AUDIT SPECIFICATION SkyTechAuditSpec FOR SERVER AUDIT SkyTechAudit
--   ADD (FAILED_LOGIN_GROUP), ADD (SERVER_ROLE_MEMBER_CHANGE_GROUP), ADD (DATABASE_PERMISSION_CHANGE_GROUP) WITH (STATE = ON);
-- ALTER SERVER AUDIT SkyTechAudit WITH (STATE = ON);
-- Read it: SELECT event_time, action_id, server_principal_name, statement FROM sys.fn_get_audit_file(N'C:\SkyTechBackups\Audit\*', DEFAULT, DEFAULT);
GO
---------------------------------------------------------------- report
SELECT N'Security and logging ready' AS Result,
       (SELECT COUNT(*) FROM sys.database_role_members rm JOIN sys.database_principals r ON r.principal_id = rm.role_principal_id WHERE r.name = N'SkyTechApp') AS AppRoleMembers,
       (SELECT COUNT(*) FROM dbo.ErrorLog) AS ErrorLogRows,
       (SELECT MAX(backup_finish_date) FROM msdb.dbo.backupset WHERE database_name = N'SkyTechCRM' AND type = 'D') AS LastFullBackup;
GO
-- Version: V1.1 (2026-10-10) — sql/06_security_and_logging.sql — V1.1
