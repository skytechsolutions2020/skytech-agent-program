-- Version: V2.2 (2026-10-05) — sql/01_create_skytechcrm.sql — V2.2 (DemoSites photo columns)
-- SkyTechCRM setup + duplicate protection. SQL Server 2014 Developer (also newer versions).
-- SAFE TO RE-RUN: creates what is missing, upgrades a V1 database, never deletes data.
--
-- How duplicates are prevented
--   1. Every company is matched on its source ID (e.g. Overture ID), else on
--      normalized name + ZIP. Unique indexes enforce both rules in the database.
--   2. One WebPresence row and one Lead per company (unique on CompanyID).
--   3. Imports go through staging (dbo.StgLeads) + dbo.usp_ImportStagedLeads,
--      which UPDATES existing companies and INSERTS only new ones. Re-running
--      an import changes nothing new.
--   4. Every import run is logged in dbo.ImportBatches (rows in / inserted / updated / skipped).
--   5. dbo.vw_PossibleDuplicates lists near-duplicates (same phone, or same name
--      in another ZIP) for a person to review.

IF DB_ID(N'SkyTechCRM') IS NULL CREATE DATABASE SkyTechCRM;
GO
USE SkyTechCRM;
GO
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;
GO
---------------------------------------------------------------- tables
IF OBJECT_ID(N'dbo.ImportBatches', N'U') IS NULL
CREATE TABLE dbo.ImportBatches (
  BatchID      INT IDENTITY PRIMARY KEY,
  BatchName    NVARCHAR(100) NOT NULL CONSTRAINT UQ_ImportBatches_BatchName UNIQUE,
  SourceFile   NVARCHAR(150) NULL,
  FirstRunOn   DATETIME NOT NULL DEFAULT GETDATE(),
  LastRunOn    DATETIME NOT NULL DEFAULT GETDATE(),
  Runs         INT NOT NULL DEFAULT 0,
  RowsIn       INT NULL, Inserted INT NULL, Updated INT NULL, SkippedInFile INT NULL
);
IF OBJECT_ID(N'dbo.Companies', N'U') IS NULL
CREATE TABLE dbo.Companies (
  CompanyID      INT IDENTITY PRIMARY KEY,
  CompanyName    NVARCHAR(200) NOT NULL,
  Industry       NVARCHAR(100),
  Address        NVARCHAR(250),
  City           NVARCHAR(100),
  State          CHAR(2),
  Zip            VARCHAR(10),
  Phone          VARCHAR(25),
  Email          NVARCHAR(150),
  ContactName    NVARCHAR(150),
  ContactTitle   NVARCHAR(100),
  EmployeeCount  INT,
  SourceFile     NVARCHAR(150),
  ImportedOn     DATETIME DEFAULT GETDATE()
);
IF OBJECT_ID(N'dbo.WebPresence', N'U') IS NULL
CREATE TABLE dbo.WebPresence (
  CompanyID        INT REFERENCES dbo.Companies(CompanyID),
  CheckedOn        DATETIME DEFAULT GETDATE(),
  HasWebsite       BIT,
  WebsiteURL       NVARCHAR(250),
  HasGoogleProfile BIT,
  HasFacebook      BIT,
  Notes            NVARCHAR(500)
);
IF OBJECT_ID(N'dbo.Leads', N'U') IS NULL
CREATE TABLE dbo.Leads (
  LeadID         INT IDENTITY PRIMARY KEY,
  CompanyID      INT REFERENCES dbo.Companies(CompanyID),
  BatchName      NVARCHAR(100),
  Status         VARCHAR(30) DEFAULT 'New',
  -- New, Checked, NoSite, DemoBuilt, Contacted, Interested, Proposal, Won, Lost, DoNotContact
  DemoURL        NVARCHAR(250),
  AssignedAgent  VARCHAR(50),
  NextFollowUp   DATE,
  DealValue      DECIMAL(10,2),
  MonthlyPlan    DECIMAL(10,2),
  UpdatedOn      DATETIME DEFAULT GETDATE()
);
IF OBJECT_ID(N'dbo.Activities', N'U') IS NULL
CREATE TABLE dbo.Activities (
  ActivityID     INT IDENTITY PRIMARY KEY,
  LeadID         INT REFERENCES dbo.Leads(LeadID),
  Agent          VARCHAR(50),
  ActivityType   VARCHAR(30),
  Outcome        NVARCHAR(500),
  ActivityDate   DATETIME DEFAULT GETDATE()
);
IF OBJECT_ID(N'dbo.StgLeads', N'U') IS NULL
CREATE TABLE dbo.StgLeads (
  SourceRecordID  NVARCHAR(64) NULL,
  CompanyName     NVARCHAR(200) NOT NULL,
  Industry        NVARCHAR(100) NULL,
  Address         NVARCHAR(250) NULL,
  City            NVARCHAR(100) NULL,
  County          NVARCHAR(50)  NULL,
  State           CHAR(2) NULL,
  Zip             VARCHAR(10) NULL,
  Phone           VARCHAR(25) NULL,
  Email           NVARCHAR(150) NULL,
  HasWebsite      BIT NULL,
  WebsiteURL      NVARCHAR(250) NULL,
  HasFacebook     BIT NULL,
  Notes           NVARCHAR(500) NULL,
  Status          VARCHAR(30) NULL,
  SourceFile      NVARCHAR(150) NULL,
  NormName        NVARCHAR(200) NULL,
  PhoneDigits     VARCHAR(20) NULL,
  Zip5            VARCHAR(5) NULL,
  MatchCompanyID  INT NULL
);
GO
---------------------------------------------------------------- V1 -> V2 columns
IF COL_LENGTH(N'dbo.Companies', N'SourceRecordID') IS NULL ALTER TABLE dbo.Companies ADD SourceRecordID NVARCHAR(64) NULL;
IF COL_LENGTH(N'dbo.Companies', N'NormName')       IS NULL ALTER TABLE dbo.Companies ADD NormName NVARCHAR(200) NULL;
IF COL_LENGTH(N'dbo.Companies', N'PhoneDigits')    IS NULL ALTER TABLE dbo.Companies ADD PhoneDigits VARCHAR(20) NULL;
IF COL_LENGTH(N'dbo.Companies', N'County')         IS NULL ALTER TABLE dbo.Companies ADD County NVARCHAR(50) NULL;
IF COL_LENGTH(N'dbo.Companies', N'UpdatedOn')      IS NULL ALTER TABLE dbo.Companies ADD UpdatedOn DATETIME NULL;
IF COL_LENGTH(N'dbo.Companies', N'LastBatchName')  IS NULL ALTER TABLE dbo.Companies ADD LastBatchName NVARCHAR(100) NULL;
IF COL_LENGTH(N'dbo.Leads', N'LastSeenBatch')      IS NULL ALTER TABLE dbo.Leads ADD LastSeenBatch NVARCHAR(100) NULL;
GO
---------------------------------------------------------------- helper functions
IF OBJECT_ID(N'dbo.fn_DigitsOnly', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_DigitsOnly;
GO
CREATE FUNCTION dbo.fn_DigitsOnly (@s NVARCHAR(50))
RETURNS VARCHAR(20)
AS
BEGIN
  -- keeps digits only; US numbers lose a leading 1 -> 10 digits
  DECLARE @r VARCHAR(20) = '', @i INT = 1, @c NCHAR(1);
  WHILE @i <= LEN(ISNULL(@s, N''))
  BEGIN
    SET @c = SUBSTRING(@s, @i, 1);
    IF @c LIKE N'[0-9]' AND LEN(@r) < 20 SET @r = @r + CAST(@c AS VARCHAR(1));
    SET @i = @i + 1;
  END
  IF LEN(@r) = 11 AND LEFT(@r, 1) = '1' SET @r = RIGHT(@r, 10);
  RETURN NULLIF(@r, '');
END
GO
IF OBJECT_ID(N'dbo.fn_NormName', N'FN') IS NOT NULL DROP FUNCTION dbo.fn_NormName;
GO
CREATE FUNCTION dbo.fn_NormName (@s NVARCHAR(200))
RETURNS NVARCHAR(200)
AS
BEGIN
  -- lower case, letters/digits only, '&' -> 'and', drops LLC/Inc/Co/Corp/Ltd/The
  DECLARE @r NVARCHAR(200) = LOWER(LTRIM(RTRIM(ISNULL(@s, N''))));
  DECLARE @o NVARCHAR(400) = N'', @i INT = 1, @c NCHAR(1);
  WHILE @i <= LEN(@r)
  BEGIN
    SET @c = SUBSTRING(@r, @i, 1);
    IF @c LIKE N'[a-z0-9]' SET @o = @o + @c;
    ELSE IF @c = N'&' SET @o = @o + N' and ';
    ELSE SET @o = @o + N' ';
    SET @i = @i + 1;
  END
  SET @o = N' ' + @o + N' ';
  WHILE CHARINDEX(N'  ', @o) > 0 SET @o = REPLACE(@o, N'  ', N' ');
  SET @o = REPLACE(@o, N' llc ', N' ');  SET @o = REPLACE(@o, N' l l c ', N' ');
  SET @o = REPLACE(@o, N' inc ', N' ');  SET @o = REPLACE(@o, N' corp ', N' ');
  SET @o = REPLACE(@o, N' ltd ', N' ');  SET @o = REPLACE(@o, N' co ', N' ');
  IF LEFT(@o, 5) = N' the ' SET @o = SUBSTRING(@o, 5, 400);
  RETURN NULLIF(LEFT(LTRIM(RTRIM(@o)), 200), N'');
END
GO
---------------------------------------------------------------- backfill keys on existing rows
UPDATE dbo.Companies
   SET NormName = dbo.fn_NormName(CompanyName),
       PhoneDigits = dbo.fn_DigitsOnly(Phone)
 WHERE NormName IS NULL OR PhoneDigits IS NULL;
GO
---------------------------------------------------------------- unique indexes (created only when existing data is clean)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Companies_SourceRecordID')
BEGIN
  IF NOT EXISTS (SELECT SourceRecordID FROM dbo.Companies WHERE SourceRecordID IS NOT NULL GROUP BY SourceRecordID HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_Companies_SourceRecordID ON dbo.Companies(SourceRecordID) WHERE SourceRecordID IS NOT NULL;
  ELSE PRINT N'WARNING: duplicate SourceRecordID values exist - see the duplicate report at the end.';
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Companies_NormName_Zip')
BEGIN
  IF NOT EXISTS (SELECT NormName, LEFT(Zip, 5) FROM dbo.Companies WHERE NormName IS NOT NULL AND Zip IS NOT NULL GROUP BY NormName, LEFT(Zip, 5) HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_Companies_NormName_Zip ON dbo.Companies(NormName, Zip) WHERE NormName IS NOT NULL AND Zip IS NOT NULL;
  ELSE PRINT N'WARNING: duplicate company name + ZIP rows exist - see the duplicate report at the end.';
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_WebPresence_CompanyID')
BEGIN
  IF NOT EXISTS (SELECT CompanyID FROM dbo.WebPresence GROUP BY CompanyID HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_WebPresence_CompanyID ON dbo.WebPresence(CompanyID) WHERE CompanyID IS NOT NULL;
  ELSE PRINT N'WARNING: some companies have more than one WebPresence row.';
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Leads_CompanyID')
BEGIN
  IF NOT EXISTS (SELECT CompanyID FROM dbo.Leads GROUP BY CompanyID HAVING COUNT(*) > 1)
    CREATE UNIQUE INDEX UX_Leads_CompanyID ON dbo.Leads(CompanyID) WHERE CompanyID IS NOT NULL;
  ELSE PRINT N'WARNING: some companies have more than one Lead row.';
END
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Companies_PhoneDigits')
  CREATE INDEX IX_Companies_PhoneDigits ON dbo.Companies(PhoneDigits);
GO
---------------------------------------------------------------- near-duplicate review view
IF OBJECT_ID(N'dbo.vw_PossibleDuplicates', N'V') IS NOT NULL DROP VIEW dbo.vw_PossibleDuplicates;
GO
CREATE VIEW dbo.vw_PossibleDuplicates
AS
SELECT N'Same phone' AS Reason, a.CompanyID AS CompanyID_A, a.CompanyName AS Name_A, a.Zip AS Zip_A,
       b.CompanyID AS CompanyID_B, b.CompanyName AS Name_B, b.Zip AS Zip_B, a.PhoneDigits AS MatchValue
  FROM dbo.Companies a JOIN dbo.Companies b ON a.PhoneDigits = b.PhoneDigits AND a.CompanyID < b.CompanyID
 WHERE a.PhoneDigits IS NOT NULL
UNION ALL
SELECT N'Same name, other ZIP', a.CompanyID, a.CompanyName, a.Zip, b.CompanyID, b.CompanyName, b.Zip, a.NormName
  FROM dbo.Companies a JOIN dbo.Companies b ON a.NormName = b.NormName AND a.CompanyID < b.CompanyID
 WHERE a.NormName IS NOT NULL AND ISNULL(a.Zip, '') <> ISNULL(b.Zip, '');
GO
---------------------------------------------------------------- import procedure (upsert, no duplicates)
IF OBJECT_ID(N'dbo.usp_ImportStagedLeads', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_ImportStagedLeads;
GO
CREATE PROCEDURE dbo.usp_ImportStagedLeads
  @BatchName  NVARCHAR(100),
  @SourceFile NVARCHAR(150) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @RowsIn INT, @Skipped INT, @Inserted INT, @Updated INT;
  BEGIN TRY
    BEGIN TRANSACTION;

    -- 1. keys for matching
    UPDATE dbo.StgLeads
       SET NormName = dbo.fn_NormName(CompanyName),
           PhoneDigits = dbo.fn_DigitsOnly(Phone),
           Zip5 = LEFT(LTRIM(Zip), 5),
           MatchCompanyID = NULL;
    SELECT @RowsIn = COUNT(*) FROM dbo.StgLeads;

    -- 2. duplicates inside the file itself: keep the first row
    ;WITH d AS (SELECT ROW_NUMBER() OVER (PARTITION BY ISNULL(SourceRecordID, NormName + N'|' + ISNULL(Zip5, N''))
                                          ORDER BY CASE WHEN SourceRecordID IS NULL THEN 1 ELSE 0 END) AS rn
                  FROM dbo.StgLeads)
    DELETE FROM d WHERE rn > 1;
    ;WITH d AS (SELECT ROW_NUMBER() OVER (PARTITION BY NormName, Zip5 ORDER BY CASE WHEN SourceRecordID IS NULL THEN 1 ELSE 0 END) AS rn
                  FROM dbo.StgLeads WHERE NormName IS NOT NULL AND Zip5 IS NOT NULL)
    DELETE FROM d WHERE rn > 1;
    SELECT @Skipped = @RowsIn - COUNT(*) FROM dbo.StgLeads;

    -- 3. match to existing companies: source ID first, then name + ZIP
    UPDATE s SET MatchCompanyID = c.CompanyID
      FROM dbo.StgLeads s JOIN dbo.Companies c ON c.SourceRecordID = s.SourceRecordID
     WHERE s.SourceRecordID IS NOT NULL;
    UPDATE s SET MatchCompanyID = c.CompanyID
      FROM dbo.StgLeads s JOIN dbo.Companies c ON c.NormName = s.NormName AND LEFT(c.Zip, 5) = s.Zip5
     WHERE s.MatchCompanyID IS NULL AND s.NormName IS NOT NULL AND s.Zip5 IS NOT NULL;
    SELECT @Updated = COUNT(*) FROM dbo.StgLeads WHERE MatchCompanyID IS NOT NULL;

    -- 4. update existing companies (fill blanks, never erase data)
    UPDATE c SET
        SourceRecordID = ISNULL(c.SourceRecordID, s.SourceRecordID),
        Industry  = ISNULL(c.Industry, s.Industry),
        Address   = ISNULL(c.Address, s.Address),
        City      = ISNULL(c.City, s.City),
        County    = ISNULL(c.County, s.County),
        State     = ISNULL(c.State, s.State),
        Phone     = ISNULL(NULLIF(c.Phone, ''), s.Phone),
        PhoneDigits = ISNULL(c.PhoneDigits, s.PhoneDigits),
        Email     = ISNULL(NULLIF(c.Email, N''), NULLIF(s.Email, N'')),
        UpdatedOn = GETDATE(),
        LastBatchName = @BatchName
      FROM dbo.Companies c JOIN dbo.StgLeads s ON s.MatchCompanyID = c.CompanyID;

    -- 5. insert new companies
    INSERT INTO dbo.Companies (CompanyName, Industry, Address, City, County, State, Zip, Phone, Email, SourceFile,
                               SourceRecordID, NormName, PhoneDigits, UpdatedOn, LastBatchName)
    SELECT CompanyName, Industry, Address, City, County, ISNULL(State, 'MD'), Zip5, Phone, NULLIF(Email, N''),
           ISNULL(SourceFile, @SourceFile), SourceRecordID, NormName, PhoneDigits, GETDATE(), @BatchName
      FROM dbo.StgLeads WHERE MatchCompanyID IS NULL;
    SET @Inserted = @@ROWCOUNT;
    UPDATE s SET MatchCompanyID = c.CompanyID
      FROM dbo.StgLeads s JOIN dbo.Companies c ON c.SourceRecordID = s.SourceRecordID
     WHERE s.MatchCompanyID IS NULL AND s.SourceRecordID IS NOT NULL;
    UPDATE s SET MatchCompanyID = c.CompanyID
      FROM dbo.StgLeads s JOIN dbo.Companies c ON c.NormName = s.NormName AND LEFT(c.Zip, 5) = s.Zip5
     WHERE s.MatchCompanyID IS NULL;

    -- 6. one WebPresence row per company (latest check wins)
    UPDATE w SET CheckedOn = GETDATE(), HasWebsite = s.HasWebsite, WebsiteURL = NULLIF(s.WebsiteURL, N''),
                 HasFacebook = s.HasFacebook, Notes = s.Notes
      FROM dbo.WebPresence w JOIN dbo.StgLeads s ON s.MatchCompanyID = w.CompanyID;
    INSERT INTO dbo.WebPresence (CompanyID, CheckedOn, HasWebsite, WebsiteURL, HasFacebook, Notes)
    SELECT s.MatchCompanyID, GETDATE(), s.HasWebsite, NULLIF(s.WebsiteURL, N''), s.HasFacebook, s.Notes
      FROM dbo.StgLeads s
     WHERE s.MatchCompanyID IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.WebPresence w WHERE w.CompanyID = s.MatchCompanyID);

    -- 7. one Lead per company; never move a lead backwards once outreach has started
    UPDATE l SET LastSeenBatch = @BatchName, UpdatedOn = GETDATE(),
                 Status = CASE WHEN l.Status IN ('New', 'Checked', 'NoSite') AND s.Status IS NOT NULL THEN s.Status ELSE l.Status END
      FROM dbo.Leads l JOIN dbo.StgLeads s ON s.MatchCompanyID = l.CompanyID;
    INSERT INTO dbo.Leads (CompanyID, BatchName, Status, LastSeenBatch, UpdatedOn)
    SELECT s.MatchCompanyID, @BatchName, ISNULL(s.Status, 'New'), @BatchName, GETDATE()
      FROM dbo.StgLeads s
     WHERE s.MatchCompanyID IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.Leads l WHERE l.CompanyID = s.MatchCompanyID);

    -- 8. log the run
    IF EXISTS (SELECT 1 FROM dbo.ImportBatches WHERE BatchName = @BatchName)
      UPDATE dbo.ImportBatches SET LastRunOn = GETDATE(), Runs = Runs + 1, RowsIn = @RowsIn,
             Inserted = @Inserted, Updated = @Updated, SkippedInFile = @Skipped, SourceFile = ISNULL(@SourceFile, SourceFile)
       WHERE BatchName = @BatchName;
    ELSE
      INSERT INTO dbo.ImportBatches (BatchName, SourceFile, Runs, RowsIn, Inserted, Updated, SkippedInFile)
      VALUES (@BatchName, @SourceFile, 1, @RowsIn, @Inserted, @Updated, @Skipped);

    DELETE FROM dbo.StgLeads;
    COMMIT TRANSACTION;

    SELECT @BatchName AS BatchName, @RowsIn AS RowsInFile, @Skipped AS DuplicatesInFile,
           @Inserted AS NewCompanies, @Updated AS ExistingCompaniesUpdated;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
  END CATCH
END
GO
---------------------------------------------------------------- demo websites (V2.1)
-- One row per company (unique), edited in the Admin site "Demo sites" tab.
IF OBJECT_ID(N'dbo.DemoSites', N'U') IS NULL
CREATE TABLE dbo.DemoSites (
  DemoID          INT IDENTITY PRIMARY KEY,
  CompanyID       INT NOT NULL REFERENCES dbo.Companies(CompanyID),
  Slug            NVARCHAR(80)  NOT NULL,
  Status          VARCHAR(20)   NOT NULL CONSTRAINT DF_DemoSites_Status DEFAULT 'Draft'
                  CONSTRAINT CK_DemoSites_Status CHECK (Status IN ('Draft', 'ReadyForReview', 'Approved', 'Sent', 'Published', 'Removed')),
  Layout          VARCHAR(20)   NOT NULL CONSTRAINT DF_DemoSites_Layout DEFAULT 'split',
  Theme           NVARCHAR(60)  NULL,
  PrimaryColor    VARCHAR(7)    NULL,
  AccentColor     VARCHAR(7)    NULL,
  BackgroundColor VARCHAR(7)    NULL,
  HeadingFont     NVARCHAR(60)  NULL,
  BodyFont        NVARCHAR(60)  NULL,
  LogoText        NVARCHAR(10)  NULL,
  LogoShape       VARCHAR(20)   NULL,
  Illustration    VARCHAR(30)   NULL,
  BrandName       NVARCHAR(200) NULL,
  Tagline         NVARCHAR(200) NULL,
  Headline        NVARCHAR(250) NULL,
  Subheadline     NVARCHAR(500) NULL,
  About           NVARCHAR(1000) NULL,
  Services        NVARCHAR(MAX) NULL,   -- one per line: Title | description
  Highlights      NVARCHAR(MAX) NULL,   -- one per line: Title | description
  Steps           NVARCHAR(MAX) NULL,   -- one per line: Title | description
  ServiceAreas    NVARCHAR(500) NULL,   -- comma separated
  CallToAction    NVARCHAR(60)  NULL,
  DisclosureNote  NVARCHAR(400) NULL,
  PreviewPath     NVARCHAR(250) NULL,
  PublicURL       NVARCHAR(250) NULL,
  TemplateVersion VARCHAR(10)   NULL,
  BuiltBy         VARCHAR(50)   NULL,
  BuiltOn         DATETIME      NOT NULL CONSTRAINT DF_DemoSites_BuiltOn DEFAULT GETDATE(),
  UpdatedOn       DATETIME      NOT NULL CONSTRAINT DF_DemoSites_UpdatedOn DEFAULT GETDATE(),
  Notes           NVARCHAR(500) NULL
);
GO
-- V2.2: photos (free-licence links, e.g. images.pexels.com) for the banner, About section and footer credit
IF COL_LENGTH(N'dbo.DemoSites', N'HeroImage') IS NULL ALTER TABLE dbo.DemoSites ADD HeroImage NVARCHAR(400) NULL;
IF COL_LENGTH(N'dbo.DemoSites', N'AboutImage') IS NULL ALTER TABLE dbo.DemoSites ADD AboutImage NVARCHAR(400) NULL;
IF COL_LENGTH(N'dbo.DemoSites', N'PhotoCredit') IS NULL ALTER TABLE dbo.DemoSites ADD PhotoCredit NVARCHAR(200) NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_DemoSites_CompanyID')
  CREATE UNIQUE INDEX UX_DemoSites_CompanyID ON dbo.DemoSites(CompanyID);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_DemoSites_Slug')
  CREATE UNIQUE INDEX UX_DemoSites_Slug ON dbo.DemoSites(Slug);
GO
---------------------------------------------------------------- report
SELECT N'Companies' AS TableName, COUNT(*) AS Rows FROM dbo.Companies
UNION ALL SELECT N'Leads', COUNT(*) FROM dbo.Leads
UNION ALL SELECT N'Demo sites', COUNT(*) FROM dbo.DemoSites
UNION ALL SELECT N'Possible duplicates to review', COUNT(*) FROM dbo.vw_PossibleDuplicates;
GO
