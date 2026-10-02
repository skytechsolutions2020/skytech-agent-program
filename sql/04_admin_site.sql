-- Version: V1.0 (2026-10-02) — sql/04_admin_site.sql — V1.0
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
SELECT N'Admin site objects ready' AS Result,
       (SELECT COUNT(*) FROM dbo.AdminUsers) AS AdminUsers;
GO
