-- Version: V1.1 (2026-10-02) — sql/04_admin_site.sql — V1.1 (duplicate review: dismissals, review view, merge procedure)
-- Objects used by the SkyTech Admin site. SQL Server 2014 Developer (SSMS).
-- Run AFTER sql/01_create_skytechcrm.sql (V2.0+). SAFE TO RE-RUN; never deletes data.
USE SkyTechCRM;
GO
SET ANSI_NULLS ON; SET QUOTED_IDENTIFIER ON;
GO
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
    THROW;
  END CATCH
END
GO
SELECT N'Admin site objects ready' AS Result,
       (SELECT COUNT(*) FROM dbo.AdminUsers) AS AdminUsers;
GO
