-- Version: V1.1 (2026-10-02) — sql/01_create_skytechcrm.sql — V1.1
-- SkyTechCRM: run once in SQL Server Management Studio on the owner's SQL Server 2014 Developer edition (also works on newer versions)
CREATE DATABASE SkyTechCRM;
GO
USE SkyTechCRM;
GO
CREATE TABLE Companies (
  CompanyID      INT IDENTITY PRIMARY KEY,
  CompanyName    NVARCHAR(200) NOT NULL,
  Industry       NVARCHAR(100),   -- domain, e.g. Plumbing, Salon
  Address        NVARCHAR(250),
  City           NVARCHAR(100),
  State          CHAR(2),
  Zip            VARCHAR(10),
  Phone          VARCHAR(25),
  Email          NVARCHAR(150),
  ContactName    NVARCHAR(150),   -- POC
  ContactTitle   NVARCHAR(100),
  EmployeeCount  INT,
  SourceFile     NVARCHAR(150),
  ImportedOn     DATETIME DEFAULT GETDATE()
);
CREATE TABLE WebPresence (
  CompanyID        INT REFERENCES Companies(CompanyID),
  CheckedOn        DATETIME DEFAULT GETDATE(),
  HasWebsite       BIT,
  WebsiteURL       NVARCHAR(250),
  HasGoogleProfile BIT,
  HasFacebook      BIT,
  Notes            NVARCHAR(500)
);
CREATE TABLE Leads (
  LeadID         INT IDENTITY PRIMARY KEY,
  CompanyID      INT REFERENCES Companies(CompanyID),
  BatchName      NVARCHAR(100),   -- e.g. 2026-W41 Plumbing Baltimore
  Status         VARCHAR(30) DEFAULT 'New',
  -- New, Checked, NoSite, DemoBuilt, Contacted, Interested, Proposal, Won, Lost, DoNotContact
  DemoURL        NVARCHAR(250),
  AssignedAgent  VARCHAR(50),
  NextFollowUp   DATE,
  DealValue      DECIMAL(10,2),
  MonthlyPlan    DECIMAL(10,2),
  UpdatedOn      DATETIME DEFAULT GETDATE()
);
CREATE TABLE Activities (
  ActivityID     INT IDENTITY PRIMARY KEY,
  LeadID         INT REFERENCES Leads(LeadID),
  Agent          VARCHAR(50),     -- SkyTech_PhoneMarketing etc.
  ActivityType   VARCHAR(30),     -- Call, Email, SocialDM, Post, Note
  Outcome        NVARCHAR(500),
  ActivityDate   DATETIME DEFAULT GETDATE()
);
GO
