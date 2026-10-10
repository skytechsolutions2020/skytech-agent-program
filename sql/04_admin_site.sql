-- Version: V1.5 (2026-10-10) — sql/04_admin_site.sql — V1.5 (procedures write failures to dbo.ErrorLog)
-- Purpose : objects used by the SkyTech Admin site: sign-in users, audit log, detail views for the screens,
--           the live duplicate check and the three duplicate-repair procedures. SQL Server 2014 Developer (SSMS).
-- Run     : AFTER sql/01_create_skytechcrm.sql (V2.3+, which creates dbo.usp_LogError). SAFE TO RE-RUN; never deletes data.
-- Errors  : THROW 50001/50002 → SKY-DUP-005, 50011/50012 → SKY-DUP-002, 50021 → SKY-DUP-003 (shown in the Admin site);
--           unexpected failures are rolled back, written to dbo.ErrorLog (SKY-DB-010) and re-raised.
USE SkyTechCRM;
GO
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;
GO
-- dbo.AdminUsers: Admin site sign-ins. Passwords are stored only as bcrypt hashes (cost 12), never in plain text.
-- Role: admin = full access, viewer = read only. Create users with: npm run create-admin
IF OBJECT_ID(N'dbo.AdminUsers', N'U') IS NULL
CREATE TABLE dbo.AdminUsers (
  UserID       INT IDENTITY PRIMARY KEY,
  Username     NVARCHAR(50)  NOT NULL CONSTRAINT UQ_AdminUsers_Username UNIQUE,
  PasswordHash NVARCHAR(100) NOT NULL,          -- bcrypt hash, never the password
  Role         VARCHAR(10)   NOT NULL DEFAULT 'admin',   -- admin = read/write, viewer = read only
  IsActive     BIT           NOT NULL DEFAULT 1,
  CreatedOn    DATETIME      NOT NULL DEFAULT GETDATE(),
  LastLoginOn  DATETIME      NULL
);
-- dbo.AuditLog: who changed what and when (sign-ins, creates, edits, deletes, merges). Made read-only by sql/06 (SKY-SEC-006).
IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
CREATE TABLE dbo.AuditLog (
  AuditID   INT IDENTITY PRIMARY KEY,
  At        DATETIME      NOT NULL DEFAULT GETDATE(),
  Username  NVARCHAR(50)  NOT NULL,
  Entity    NVARCHAR(50)  NOT NULL,
  Action    VARCHAR(10)   NOT NULL,              -- LOGIN, CREATE, UPDATE, DELETE
  RecordKey NVARCHAR(50)  NULL,
  Details   NVARCHAR(MAX) NULL                   -- JSON of what changed
);
GO
IF OBJECT_ID(N'dbo.vw_LeadDetail', N'V') IS NOT NULL DROP VIEW dbo.vw_LeadDetail;
GO
CREATE VIEW dbo.vw_LeadDetail AS
SELECT l.LeadID, l.CompanyID, c.CompanyName,
       CASE WHEN c.Industry LIKE N'Real Estate%' THEN N'Real Estate'
            WHEN c.Industry LIKE N'Utility%'     THEN N'Utility Trades'
            ELSE ISNULL(c.Industry, N'Other') END AS Niche,
       c.County, c.City, c.Phone, c.Email,
       w.HasWebsite, w.WebsiteURL, w.Notes,
       l.BatchName, l.Status, l.DemoURL, l.AssignedAgent, l.NextFollowUp,
       l.DealValue, l.MonthlyPlan, l.LastSeenBatch, l.UpdatedOn
  FROM dbo.Leads l
  JOIN dbo.Companies c ON c.CompanyID = l.CompanyID
  LEFT JOIN dbo.WebPresence w ON w.CompanyID = l.CompanyID;
GO
IF OBJECT_ID(N'dbo.vw_WebPresenceDetail', N'V') IS NOT NULL DROP VIEW dbo.vw_WebPresenceDetail;
GO
CREATE VIEW dbo.vw_WebPresenceDetail AS
SELECT w.CompanyID, c.CompanyName, w.CheckedOn, w.HasWebsite, w.WebsiteURL, w.HasGoogleProfile, w.HasFacebook, w.Notes
  FROM dbo.WebPresence w JOIN dbo.Companies c ON c.CompanyID = w.CompanyID;
GO
IF OBJECT_ID(N'dbo.vw_ActivityDetail', N'V') IS NOT NULL DROP VIEW dbo.vw_ActivityDetail;
GO
CREATE VIEW dbo.vw_ActivityDetail AS
SELECT a.ActivityID, a.LeadID, c.CompanyName, a.Agent, a.ActivityType, a.Outcome, a.ActivityDate
  FROM dbo.Activities a
  LEFT JOIN dbo.Leads l ON l.LeadID = a.LeadID
  LEFT JOIN dbo.Companies c ON c.CompanyID = l.CompanyID;
GO
---------------------------------------------------------------- duplicate review (V1.1)
IF OBJECT_ID(N'dbo.DuplicateDismissals', N'U') IS NULL
CREATE TABLE dbo.DuplicateDismissals (
  CompanyID_A  INT NOT NULL,
  CompanyID_B  INT NOT NULL,
  DismissedBy  NVARCHAR(50) NOT NULL,
  DismissedOn  DATETIME NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_DuplicateDismissals PRIMARY KEY (CompanyID_A, CompanyID_B)
);
GO
IF OBJECT_ID(N'dbo.vw_DuplicateReview', N'V') IS NOT NULL DROP VIEW dbo.vw_DuplicateReview;
GO
CREATE VIEW dbo.vw_DuplicateReview AS
-- possible duplicates still waiting for a decision (pairs marked "not a duplicate" are hidden)
SELECT p.Reason, p.CompanyID_A, p.Name_A, p.Zip_A, p.CompanyID_B, p.Name_B, p.Zip_B, p.MatchValue
  FROM dbo.vw_PossibleDuplicates p
 WHERE NOT EXISTS (SELECT 1 FROM dbo.DuplicateDismissals d
                    WHERE d.CompanyID_A = p.CompanyID_A AND d.CompanyID_B = p.CompanyID_B);
GO
IF OBJECT_ID(N'dbo.usp_MergeCompanies', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_MergeCompanies;
GO
CREATE PROCEDURE dbo.usp_MergeCompanies
  @KeepID   INT,
  @RemoveID INT
AS
BEGIN
  -- Merges company @RemoveID into @KeepID, then deletes @RemoveID.
  -- Nothing is lost: blanks on the kept company are filled from the removed one;
  -- the removed company's lead, activities and web presence move to the kept company.
  SET NOCOUNT ON;
  IF @KeepID = @RemoveID THROW 50001, 'Choose two different companies.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Companies WHERE CompanyID = @KeepID)
     OR NOT EXISTS (SELECT 1 FROM dbo.Companies WHERE CompanyID = @RemoveID)
     THROW 50002, 'One of the companies no longer exists.', 1;
  BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @src NVARCHAR(64) = (SELECT SourceRecordID FROM dbo.Companies WHERE CompanyID = @RemoveID);
    UPDATE dbo.Companies SET SourceRecordID = NULL WHERE CompanyID = @RemoveID;   -- free the unique source ID

    UPDATE k SET
      Industry = ISNULL(k.Industry, r.Industry), Address = ISNULL(k.Address, r.Address), City = ISNULL(k.City, r.City),
      County = ISNULL(k.County, r.County), State = ISNULL(k.State, r.State),
      Phone = ISNULL(NULLIF(k.Phone, ''), r.Phone), PhoneDigits = ISNULL(k.PhoneDigits, r.PhoneDigits),
      Email = ISNULL(NULLIF(k.Email, N''), r.Email), ContactName = ISNULL(k.ContactName, r.ContactName),
      ContactTitle = ISNULL(k.ContactTitle, r.ContactTitle), EmployeeCount = ISNULL(k.EmployeeCount, r.EmployeeCount),
      SourceRecordID = ISNULL(k.SourceRecordID, @src), UpdatedOn = GETDATE()
    FROM dbo.Companies k CROSS JOIN dbo.Companies r
    WHERE k.CompanyID = @KeepID AND r.CompanyID = @RemoveID;

    -- web presence: move, or fill blanks then drop the extra row
    IF NOT EXISTS (SELECT 1 FROM dbo.WebPresence WHERE CompanyID = @KeepID)
      UPDATE dbo.WebPresence SET CompanyID = @KeepID WHERE CompanyID = @RemoveID;
    ELSE
    BEGIN
      UPDATE k SET HasWebsite = ISNULL(k.HasWebsite, r.HasWebsite), WebsiteURL = ISNULL(k.WebsiteURL, r.WebsiteURL),
                   HasGoogleProfile = ISNULL(k.HasGoogleProfile, r.HasGoogleProfile), HasFacebook = ISNULL(k.HasFacebook, r.HasFacebook),
                   Notes = LEFT(ISNULL(k.Notes, N'') + CASE WHEN r.Notes IS NULL THEN N'' ELSE N' | merged: ' + r.Notes END, 500)
        FROM dbo.WebPresence k JOIN dbo.WebPresence r ON r.CompanyID = @RemoveID
       WHERE k.CompanyID = @KeepID;
      DELETE FROM dbo.WebPresence WHERE CompanyID = @RemoveID;
    END

    -- lead: move, or keep the further-along status, move activities, drop the extra lead
    DECLARE @keepLead INT = (SELECT TOP 1 LeadID FROM dbo.Leads WHERE CompanyID = @KeepID),
            @remLead  INT = (SELECT TOP 1 LeadID FROM dbo.Leads WHERE CompanyID = @RemoveID);
    IF @remLead IS NOT NULL
    BEGIN
      IF @keepLead IS NULL
        UPDATE dbo.Leads SET CompanyID = @KeepID, UpdatedOn = GETDATE() WHERE LeadID = @remLead;
      ELSE
      BEGIN
        UPDATE k SET
          Status = CASE WHEN CHARINDEX('|' + r.Status + '|', '|New|Checked|NoSite|DemoBuilt|Contacted|Interested|Proposal|Won|')
                           > CHARINDEX('|' + k.Status + '|', '|New|Checked|NoSite|DemoBuilt|Contacted|Interested|Proposal|Won|')
                         AND k.Status NOT IN ('Lost', 'DoNotContact') THEN r.Status ELSE k.Status END,
          DemoURL = ISNULL(k.DemoURL, r.DemoURL), AssignedAgent = ISNULL(k.AssignedAgent, r.AssignedAgent),
          NextFollowUp = ISNULL(k.NextFollowUp, r.NextFollowUp), DealValue = ISNULL(k.DealValue, r.DealValue),
          MonthlyPlan = ISNULL(k.MonthlyPlan, r.MonthlyPlan), UpdatedOn = GETDATE()
          FROM dbo.Leads k JOIN dbo.Leads r ON r.LeadID = @remLead
         WHERE k.LeadID = @keepLead;
        UPDATE dbo.Activities SET LeadID = @keepLead WHERE LeadID = @remLead;
        DELETE FROM dbo.Leads WHERE LeadID = @remLead;
      END
    END

    DELETE FROM dbo.DuplicateDismissals WHERE CompanyID_A IN (@KeepID, @RemoveID) OR CompanyID_B IN (@KeepID, @RemoveID);
    DELETE FROM dbo.Companies WHERE CompanyID = @RemoveID;
    COMMIT TRANSACTION;
    SELECT @KeepID AS KeptCompanyID, @RemoveID AS RemovedCompanyID;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ctx NVARCHAR(400) = CONCAT(N'keep ', @KeepID, N' remove ', @RemoveID);
    EXEC dbo.usp_LogError @ProcedureName = N'usp_MergeCompanies', @Context = @ctx;
    THROW;
  END CATCH
END
GO
---------------------------------------------------------------- live duplicate check across tables (V1.2)
IF COL_LENGTH(N'dbo.DuplicateDismissals', N'Category') IS NULL
BEGIN
  ALTER TABLE dbo.DuplicateDismissals ADD Category VARCHAR(20) NOT NULL CONSTRAINT DF_DuplicateDismissals_Category DEFAULT 'Companies';
END
GO
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = N'PK_DuplicateDismissals'
           AND NOT EXISTS (SELECT 1 FROM sys.index_columns ic JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                           WHERE ic.object_id = OBJECT_ID(N'dbo.DuplicateDismissals') AND c.name = N'Category'))
BEGIN
  ALTER TABLE dbo.DuplicateDismissals DROP CONSTRAINT PK_DuplicateDismissals;
  ALTER TABLE dbo.DuplicateDismissals ADD CONSTRAINT PK_DuplicateDismissals PRIMARY KEY (Category, CompanyID_A, CompanyID_B);
END
GO
IF OBJECT_ID(N'dbo.vw_DuplicateCheck', N'V') IS NOT NULL DROP VIEW dbo.vw_DuplicateCheck;
GO
CREATE VIEW dbo.vw_DuplicateCheck AS
-- Live duplicate check across Companies, Leads, WebPresence and Activities. One row per suspected pair
-- (strongest reason only). Severity: Exact = breaks a no-duplicates rule; Likely = same phone/email/website
-- or a repeated activity; Possible = same name in another ZIP. Pairs marked "not a duplicate" are hidden.
WITH web AS (
  SELECT CompanyID,
         LOWER(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(WebsiteURL)), N'https://', N''), N'http://', N''), N'www.', N''), N'/', N'')) AS Site
    FROM dbo.WebPresence WHERE NULLIF(LTRIM(RTRIM(WebsiteURL)), N'') IS NOT NULL
), comp AS (
  SELECT 'Companies' AS Category, 1 AS Pri, 'Exact' AS Severity, 'Same source ID' AS Reason, a.CompanyID AS IdA, a.CompanyName AS LabelA, b.CompanyID AS IdB, b.CompanyName AS LabelB, CAST(a.SourceRecordID AS NVARCHAR(200)) AS MatchValue
    FROM dbo.Companies a JOIN dbo.Companies b ON a.SourceRecordID = b.SourceRecordID AND a.CompanyID < b.CompanyID
  UNION ALL
  SELECT 'Companies', 2, 'Exact', 'Same name + ZIP', a.CompanyID, a.CompanyName, b.CompanyID, b.CompanyName, a.NormName + N' / ' + LEFT(a.Zip, 5)
    FROM dbo.Companies a JOIN dbo.Companies b ON a.NormName = b.NormName AND LEFT(a.Zip, 5) = LEFT(b.Zip, 5) AND a.CompanyID < b.CompanyID
  UNION ALL
  SELECT 'Companies', 3, 'Likely', 'Same phone', a.CompanyID, a.CompanyName, b.CompanyID, b.CompanyName, a.PhoneDigits
    FROM dbo.Companies a JOIN dbo.Companies b ON a.PhoneDigits = b.PhoneDigits AND a.CompanyID < b.CompanyID
  UNION ALL
  SELECT 'Companies', 4, 'Likely', 'Same email', a.CompanyID, a.CompanyName, b.CompanyID, b.CompanyName, LOWER(a.Email)
    FROM dbo.Companies a JOIN dbo.Companies b ON LOWER(LTRIM(RTRIM(a.Email))) = LOWER(LTRIM(RTRIM(b.Email))) AND a.CompanyID < b.CompanyID
   WHERE NULLIF(LTRIM(RTRIM(a.Email)), N'') IS NOT NULL
  UNION ALL
  SELECT 'Companies', 5, 'Likely', 'Same website', a.CompanyID, a.CompanyName, b.CompanyID, b.CompanyName, wa.Site
    FROM web wa JOIN web wb ON wa.Site = wb.Site AND wa.CompanyID < wb.CompanyID
    JOIN dbo.Companies a ON a.CompanyID = wa.CompanyID JOIN dbo.Companies b ON b.CompanyID = wb.CompanyID
  UNION ALL
  SELECT 'Companies', 6, 'Possible', 'Same name, other ZIP', a.CompanyID, a.CompanyName, b.CompanyID, b.CompanyName, a.NormName
    FROM dbo.Companies a JOIN dbo.Companies b ON a.NormName = b.NormName AND ISNULL(LEFT(a.Zip, 5), '') <> ISNULL(LEFT(b.Zip, 5), '') AND a.CompanyID < b.CompanyID
), ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY IdA, IdB ORDER BY Pri) AS rn FROM comp
), allpairs AS (
  SELECT Category, Severity, Reason, IdA, LabelA, IdB, LabelB, MatchValue FROM ranked WHERE rn = 1
  UNION ALL
  SELECT 'Leads', 'Exact', 'Company has more than one lead', a.LeadID, c.CompanyName + N' (lead ' + CAST(a.LeadID AS NVARCHAR(10)) + N', ' + ISNULL(a.Status, N'') + N')',
         b.LeadID, c.CompanyName + N' (lead ' + CAST(b.LeadID AS NVARCHAR(10)) + N', ' + ISNULL(b.Status, N'') + N')', CAST(a.CompanyID AS NVARCHAR(20))
    FROM dbo.Leads a JOIN dbo.Leads b ON a.CompanyID = b.CompanyID AND a.LeadID < b.LeadID
    JOIN dbo.Companies c ON c.CompanyID = a.CompanyID
  UNION ALL
  SELECT 'WebPresence', 'Exact', 'Company has ' + CAST(COUNT(*) AS VARCHAR(10)) + ' web-presence rows', w.CompanyID, MAX(c.CompanyName), w.CompanyID, MAX(c.CompanyName), CAST(w.CompanyID AS NVARCHAR(20))
    FROM dbo.WebPresence w JOIN dbo.Companies c ON c.CompanyID = w.CompanyID
   GROUP BY w.CompanyID HAVING COUNT(*) > 1
  UNION ALL
  SELECT 'Activities', 'Likely', 'Same activity logged twice (same lead, type, text, day)', a.ActivityID, ISNULL(c.CompanyName, N'') + N' - ' + ISNULL(a.ActivityType, N''),
         b.ActivityID, ISNULL(c.CompanyName, N'') + N' - ' + ISNULL(b.ActivityType, N''), LEFT(ISNULL(a.Outcome, N''), 120)
    FROM dbo.Activities a JOIN dbo.Activities b
      ON a.LeadID = b.LeadID AND ISNULL(a.ActivityType, '') = ISNULL(b.ActivityType, '') AND ISNULL(a.Outcome, N'') = ISNULL(b.Outcome, N'')
     AND CAST(a.ActivityDate AS DATE) = CAST(b.ActivityDate AS DATE) AND a.ActivityID < b.ActivityID
    LEFT JOIN dbo.Leads l ON l.LeadID = a.LeadID LEFT JOIN dbo.Companies c ON c.CompanyID = l.CompanyID
)
SELECT p.Category, p.Severity, p.Reason, p.IdA, p.LabelA, p.IdB, p.LabelB, p.MatchValue,
       p.Category + ':' + CAST(p.IdA AS VARCHAR(12)) + '-' + CAST(p.IdB AS VARCHAR(12)) AS PairKey
  FROM allpairs p
 WHERE NOT EXISTS (SELECT 1 FROM dbo.DuplicateDismissals d
                    WHERE d.Category = p.Category AND d.CompanyID_A = p.IdA AND d.CompanyID_B = p.IdB);
GO
IF OBJECT_ID(N'dbo.usp_MergeLeads', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_MergeLeads;
GO
CREATE PROCEDURE dbo.usp_MergeLeads @KeepLeadID INT, @RemoveLeadID INT
AS
BEGIN
  -- Two leads for the same company: keep one, take the further-along status and any missing details, move activities, delete the other.
  SET NOCOUNT ON;
  IF @KeepLeadID = @RemoveLeadID THROW 50011, 'Choose two different leads.', 1;
  IF NOT EXISTS (SELECT 1 FROM dbo.Leads k JOIN dbo.Leads r ON r.CompanyID = k.CompanyID WHERE k.LeadID = @KeepLeadID AND r.LeadID = @RemoveLeadID)
     THROW 50012, 'These leads do not belong to the same company (or no longer exist).', 1;
  BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE k SET
      Status = CASE WHEN CHARINDEX('|' + r.Status + '|', '|New|Checked|NoSite|DemoBuilt|Contacted|Interested|Proposal|Won|')
                       > CHARINDEX('|' + k.Status + '|', '|New|Checked|NoSite|DemoBuilt|Contacted|Interested|Proposal|Won|')
                     AND k.Status NOT IN ('Lost', 'DoNotContact') THEN r.Status ELSE k.Status END,
      DemoURL = ISNULL(k.DemoURL, r.DemoURL), AssignedAgent = ISNULL(k.AssignedAgent, r.AssignedAgent),
      NextFollowUp = ISNULL(k.NextFollowUp, r.NextFollowUp), DealValue = ISNULL(k.DealValue, r.DealValue),
      MonthlyPlan = ISNULL(k.MonthlyPlan, r.MonthlyPlan), UpdatedOn = GETDATE()
      FROM dbo.Leads k JOIN dbo.Leads r ON r.LeadID = @RemoveLeadID
     WHERE k.LeadID = @KeepLeadID;
    UPDATE dbo.Activities SET LeadID = @KeepLeadID WHERE LeadID = @RemoveLeadID;
    DELETE FROM dbo.Leads WHERE LeadID = @RemoveLeadID;
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ctx NVARCHAR(400) = CONCAT(N'keep lead ', @KeepLeadID, N' remove lead ', @RemoveLeadID);
    EXEC dbo.usp_LogError @ProcedureName = N'usp_MergeLeads', @Context = @ctx;
    THROW;
  END CATCH
  -- with duplicates gone, add the one-lead-per-company rule if it is still missing
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Leads_CompanyID')
     AND NOT EXISTS (SELECT CompanyID FROM dbo.Leads WHERE CompanyID IS NOT NULL GROUP BY CompanyID HAVING COUNT(*) > 1)
  BEGIN
  BEGIN TRY
    -- needs ALTER permission: works for the owner; under the least-privilege SkyTechApp role (sql/06) it is skipped
    -- quietly and the rule is added the next time sql/01 or sql/04 is run in SSMS.
    CREATE UNIQUE INDEX UX_Leads_CompanyID ON dbo.Leads(CompanyID) WHERE CompanyID IS NOT NULL;
  END TRY
  BEGIN CATCH
    EXEC dbo.usp_LogError @SkyCode = 'SKY-DUP-004', @Context = N'UX_Leads_CompanyID not created by the merge (permission); run sql/04 in SSMS';
  END CATCH
  END
END
GO
IF OBJECT_ID(N'dbo.usp_FixDuplicateWebPresence', N'P') IS NOT NULL DROP PROCEDURE dbo.usp_FixDuplicateWebPresence;
GO
CREATE PROCEDURE dbo.usp_FixDuplicateWebPresence @CompanyID INT
AS
BEGIN
  -- Keeps one web-presence row for the company: the most recently checked one, with blanks filled and notes carried over from the others.
  SET NOCOUNT ON;
  IF (SELECT COUNT(*) FROM dbo.WebPresence WHERE CompanyID = @CompanyID) < 2 THROW 50021, 'This company has only one web-presence row now.', 1;
  DECLARE @keep TABLE (CompanyID INT, CheckedOn DATETIME, HasWebsite BIT, WebsiteURL NVARCHAR(250), HasGoogleProfile BIT, HasFacebook BIT, Notes NVARCHAR(500));
  INSERT INTO @keep
  SELECT TOP 1 w.CompanyID, w.CheckedOn,
         ISNULL(w.HasWebsite, x.HasWebsite), ISNULL(w.WebsiteURL, x.WebsiteURL), ISNULL(w.HasGoogleProfile, x.HasGoogleProfile),
         ISNULL(w.HasFacebook, x.HasFacebook),
         LEFT(ISNULL(w.Notes, N'') + ISNULL((SELECT N' | merged: ' + o.Notes FROM dbo.WebPresence o
                                           WHERE o.CompanyID = @CompanyID AND o.Notes IS NOT NULL AND o.Notes <> ISNULL(w.Notes, N'')
                                           FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), N''), 500)
    FROM dbo.WebPresence w
   CROSS JOIN (SELECT CAST(MAX(CAST(HasWebsite AS INT)) AS BIT) AS HasWebsite, MAX(WebsiteURL) AS WebsiteURL,
                      CAST(MAX(CAST(HasGoogleProfile AS INT)) AS BIT) AS HasGoogleProfile, CAST(MAX(CAST(HasFacebook AS INT)) AS BIT) AS HasFacebook
                 FROM dbo.WebPresence WHERE CompanyID = @CompanyID) x
   WHERE w.CompanyID = @CompanyID
   ORDER BY w.CheckedOn DESC;
  BEGIN TRY
    BEGIN TRANSACTION;
    DELETE FROM dbo.WebPresence WHERE CompanyID = @CompanyID;
    INSERT INTO dbo.WebPresence (CompanyID, CheckedOn, HasWebsite, WebsiteURL, HasGoogleProfile, HasFacebook, Notes)
    SELECT CompanyID, CheckedOn, HasWebsite, WebsiteURL, HasGoogleProfile, HasFacebook, Notes FROM @keep;
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @ctx NVARCHAR(400) = CONCAT(N'company ', @CompanyID);
    EXEC dbo.usp_LogError @ProcedureName = N'usp_FixDuplicateWebPresence', @Context = @ctx;
    THROW;
  END CATCH
  -- with duplicates gone, add the one-row-per-company rule if it is still missing
  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_WebPresence_CompanyID')
     AND NOT EXISTS (SELECT CompanyID FROM dbo.WebPresence WHERE CompanyID IS NOT NULL GROUP BY CompanyID HAVING COUNT(*) > 1)
  BEGIN
  BEGIN TRY
    -- needs ALTER permission: works for the owner; under the least-privilege SkyTechApp role (sql/06) it is skipped
    -- quietly and the rule is added the next time sql/01 or sql/04 is run in SSMS.
    CREATE UNIQUE INDEX UX_WebPresence_CompanyID ON dbo.WebPresence(CompanyID) WHERE CompanyID IS NOT NULL;
  END TRY
  BEGIN CATCH
    EXEC dbo.usp_LogError @SkyCode = 'SKY-DUP-004', @Context = N'UX_WebPresence_CompanyID not created by the merge (permission); run sql/04 in SSMS';
  END CATCH
  END
END
GO
---------------------------------------------------------------- demo websites view (V1.3)
IF OBJECT_ID(N'dbo.vw_DemoSiteDetail', N'V') IS NOT NULL DROP VIEW dbo.vw_DemoSiteDetail;
GO
CREATE VIEW dbo.vw_DemoSiteDetail AS
-- demo site design + the company facts the page shows + the lead's sales status
SELECT s.DemoID, s.CompanyID, s.Slug, s.Status, s.Layout, s.Theme, s.PrimaryColor, s.AccentColor, s.BackgroundColor,
       s.HeadingFont, s.BodyFont, s.LogoText, s.LogoShape, s.Illustration, s.BrandName, s.Tagline, s.Headline, s.Subheadline,
       s.About, s.Services, s.Highlights, s.Steps, s.ServiceAreas, s.CallToAction, s.DisclosureNote, s.PreviewPath, s.PublicURL,
       s.HeroImage, s.AboutImage, s.PhotoCredit,
       s.TemplateVersion, s.BuiltBy, s.BuiltOn, s.UpdatedOn, s.Notes,
       c.CompanyName, c.Phone, c.Email, c.Address, c.City, c.County, c.Zip, l.LeadID, l.Status AS LeadStatus
  FROM dbo.DemoSites s
  JOIN dbo.Companies c ON c.CompanyID = s.CompanyID
  LEFT JOIN dbo.Leads l ON l.CompanyID = s.CompanyID;
GO
SELECT N'Admin site objects ready' AS Result,
       (SELECT COUNT(*) FROM dbo.AdminUsers) AS AdminUsers;
GO
-- Version: V1.5 (2026-10-10) — sql/04_admin_site.sql — V1.5
