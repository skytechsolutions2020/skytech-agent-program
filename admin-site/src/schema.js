// Version: V1.2 (2026-10-02) — admin-site/src/schema.js — V1.2
// Whitelist of what the admin site may read and change. Only names listed here
// ever reach SQL, so the site cannot touch other tables or columns.

const STATUSES = ['New', 'Checked', 'NoSite', 'DemoBuilt', 'Contacted', 'Interested', 'Proposal', 'Won', 'Lost', 'DoNotContact'];
const ACTIVITY_TYPES = ['Call', 'Email', 'SocialDM', 'Post', 'Meeting', 'Note'];
const AGENTS = ['SkyTech_Manager', 'SkyTech_BackOffice', 'SkyTech_WebsiteDeveloper', 'SkyTech_PhoneMarketing', 'SkyTech_SocialMediaMarketing', 'SkyTech_ProjectManagement', 'Owner'];

// type: text | longtext | int | money | bit | date | datetime | enum
const ENTITIES = {
  leads: {
    label: 'Leads', source: 'dbo.vw_LeadDetail', table: 'dbo.Leads', key: 'LeadID', writable: true,
    defaultSort: 'UpdatedOn', defaultDir: 'desc',
    listColumns: ['LeadID', 'CompanyName', 'Niche', 'County', 'City', 'Phone', 'Status', 'HasWebsite', 'NextFollowUp', 'AssignedAgent', 'UpdatedOn'],
    searchColumns: ['CompanyName', 'City', 'Phone', 'Email', 'Notes', 'AssignedAgent'],
    filterColumns: ['Status', 'County', 'Niche', 'AssignedAgent'],
    columns: {
      LeadID: { type: 'int', readonly: true },
      CompanyID: { type: 'int', required: true, ref: 'companies' },
      CompanyName: { type: 'text', view: true }, Niche: { type: 'text', view: true }, County: { type: 'text', view: true },
      City: { type: 'text', view: true }, Phone: { type: 'text', view: true }, Email: { type: 'text', view: true },
      HasWebsite: { type: 'bit', view: true }, WebsiteURL: { type: 'text', view: true }, Notes: { type: 'longtext', view: true },
      BatchName: { type: 'text' },
      Status: { type: 'enum', options: STATUSES, required: true },
      DemoURL: { type: 'text' },
      AssignedAgent: { type: 'enum', options: AGENTS },
      NextFollowUp: { type: 'date' },
      DealValue: { type: 'money' },
      MonthlyPlan: { type: 'money' },
      LastSeenBatch: { type: 'text', readonly: true },
      UpdatedOn: { type: 'datetime', readonly: true }
    }
  },
  companies: {
    label: 'Companies', source: 'dbo.Companies', table: 'dbo.Companies', key: 'CompanyID', writable: true,
    defaultSort: 'CompanyName', defaultDir: 'asc',
    listColumns: ['CompanyID', 'CompanyName', 'Industry', 'City', 'County', 'Zip', 'Phone', 'Email', 'UpdatedOn'],
    searchColumns: ['CompanyName', 'Industry', 'City', 'Zip', 'Phone', 'Email', 'ContactName'],
    filterColumns: ['County', 'City'],
    columns: {
      CompanyID: { type: 'int', readonly: true },
      CompanyName: { type: 'text', required: true },
      Industry: { type: 'text' }, Address: { type: 'text' }, City: { type: 'text' }, County: { type: 'text' },
      State: { type: 'text', max: 2 }, Zip: { type: 'text', max: 10 }, Phone: { type: 'text' }, Email: { type: 'text' },
      ContactName: { type: 'text' }, ContactTitle: { type: 'text' }, EmployeeCount: { type: 'int' }, SourceFile: { type: 'text' },
      SourceRecordID: { type: 'text', readonly: true }, NormName: { type: 'text', readonly: true },
      PhoneDigits: { type: 'text', readonly: true }, LastBatchName: { type: 'text', readonly: true },
      ImportedOn: { type: 'datetime', readonly: true }, UpdatedOn: { type: 'datetime', readonly: true }
    }
  },
  webpresence: {
    label: 'Web presence', source: 'dbo.vw_WebPresenceDetail', table: 'dbo.WebPresence', key: 'CompanyID', writable: true, keyIsInput: true,
    defaultSort: 'CheckedOn', defaultDir: 'desc',
    listColumns: ['CompanyID', 'CompanyName', 'HasWebsite', 'WebsiteURL', 'HasGoogleProfile', 'HasFacebook', 'CheckedOn'],
    searchColumns: ['CompanyName', 'WebsiteURL', 'Notes'],
    filterColumns: ['HasWebsite', 'HasFacebook'],
    columns: {
      CompanyID: { type: 'int', required: true, ref: 'companies' },
      CompanyName: { type: 'text', view: true },
      CheckedOn: { type: 'datetime' },
      HasWebsite: { type: 'bit' }, WebsiteURL: { type: 'text' }, HasGoogleProfile: { type: 'bit' }, HasFacebook: { type: 'bit' },
      Notes: { type: 'longtext' }
    }
  },
  activities: {
    label: 'Activities', source: 'dbo.vw_ActivityDetail', table: 'dbo.Activities', key: 'ActivityID', writable: true,
    defaultSort: 'ActivityDate', defaultDir: 'desc',
    listColumns: ['ActivityID', 'ActivityDate', 'CompanyName', 'Agent', 'ActivityType', 'Outcome'],
    searchColumns: ['CompanyName', 'Agent', 'Outcome'],
    filterColumns: ['Agent', 'ActivityType'],
    columns: {
      ActivityID: { type: 'int', readonly: true },
      LeadID: { type: 'int', required: true, ref: 'leads' },
      CompanyName: { type: 'text', view: true },
      Agent: { type: 'enum', options: AGENTS }, ActivityType: { type: 'enum', options: ACTIVITY_TYPES, required: true },
      Outcome: { type: 'longtext' }, ActivityDate: { type: 'datetime' }
    }
  },
  imports: {
    label: 'Imports', source: 'dbo.ImportBatches', key: 'BatchID', writable: false, defaultSort: 'LastRunOn', defaultDir: 'desc',
    listColumns: ['BatchID', 'BatchName', 'SourceFile', 'Runs', 'RowsIn', 'Inserted', 'Updated', 'SkippedInFile', 'LastRunOn'],
    searchColumns: ['BatchName', 'SourceFile'], filterColumns: [],
    columns: { BatchID: { type: 'int' }, BatchName: { type: 'text' }, SourceFile: { type: 'text' }, FirstRunOn: { type: 'datetime' },
      LastRunOn: { type: 'datetime' }, Runs: { type: 'int' }, RowsIn: { type: 'int' }, Inserted: { type: 'int' }, Updated: { type: 'int' }, SkippedInFile: { type: 'int' } }
  },
  duplicates: {
    label: 'Possible duplicates', source: 'dbo.vw_DuplicateCheck', key: 'PairKey', writable: false, defaultSort: 'Severity', defaultDir: 'asc',
    listColumns: ['Severity', 'Category', 'Reason', 'IdA', 'LabelA', 'IdB', 'LabelB', 'MatchValue'],
    searchColumns: ['LabelA', 'LabelB', 'MatchValue', 'Reason'], filterColumns: ['Severity', 'Category'],
    columns: { Severity: { type: 'enum', options: ['Exact', 'Likely', 'Possible'] }, Category: { type: 'enum', options: ['Companies', 'Leads', 'WebPresence', 'Activities'] },
      Reason: { type: 'text' }, IdA: { type: 'int' }, LabelA: { type: 'text' }, IdB: { type: 'int' }, LabelB: { type: 'text' },
      MatchValue: { type: 'text' }, PairKey: { type: 'text' } }
  },
  audit: {
    label: 'Audit log', source: 'dbo.AuditLog', key: 'AuditID', writable: false, defaultSort: 'At', defaultDir: 'desc',
    listColumns: ['AuditID', 'At', 'Username', 'Entity', 'Action', 'RecordKey', 'Details'],
    searchColumns: ['Username', 'Entity', 'Action', 'RecordKey', 'Details'], filterColumns: ['Entity', 'Action', 'Username'],
    columns: { AuditID: { type: 'int' }, At: { type: 'datetime' }, Username: { type: 'text' }, Entity: { type: 'text' },
      Action: { type: 'text' }, RecordKey: { type: 'text' }, Details: { type: 'longtext' } }
  }
};

function editableColumns(entity) {
  const e = ENTITIES[entity];
  return Object.entries(e.columns)
    .filter(([name, c]) => !c.readonly && !c.view && (name !== e.key || e.keyIsInput))
    .map(([name]) => name);
}

module.exports = { ENTITIES, STATUSES, ACTIVITY_TYPES, AGENTS, editableColumns };
