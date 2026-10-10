// Version: V2.0 (2026-10-10) — admin-site/src/db/mssql.js — V2.0 (error codes, timeouts, ping, encryption options)
/**
 * @file SQL Server adapter (SkyTechCRM on SQL Server 2014+). Same functions as src/db/memory.js (demo mode).
 * Security: every value is sent as a typed parameter (no string-built SQL with user input → no SQL injection);
 *           table and column names come only from the whitelist in src/schema.js.
 * Settings: DB_SERVER, DB_DATABASE, DB_AUTH (windows|sql), DB_DRIVER, DB_USER/DB_PASSWORD, DB_ENCRYPT, DB_TRUST_CERT.
 * Errors:   every driver/SQL error is converted by fromDbError() (src/errors.js) into a SKY-DB-/DUP-/DATA- code.
 */
const { ENTITIES, editableColumns } = require('../schema');
const { AppError, fromDbError } = require('../errors');
const log = require('../logger');

let sql, pool;

// connect — builds the connection pool: Windows login via msnodesqlv8/ODBC, or SQL login via tedious.
function connect() {
  const auth = (process.env.DB_AUTH || 'windows').toLowerCase();
  const server = process.env.DB_SERVER || 'localhost';
  const database = process.env.DB_DATABASE || 'SkyTechCRM';
  if (auth === 'windows') {
    try { sql = require('mssql/msnodesqlv8'); } catch (e) {
      throw new AppError('SKY-DB-002', 'Windows login needs the "msnodesqlv8" package (installed by npm install on Windows). Or set DB_AUTH=sql and use a SQL login.');
    }
    const driver = process.env.DB_DRIVER || 'SQL Server Native Client 11.0';
    return new sql.ConnectionPool({
      connectionString: `Driver={${driver}};Server=${server};Database=${database};Trusted_Connection=yes;`,
      connectionTimeout: 15000, requestTimeout: 30000
    }).connect();
  }
  sql = require('mssql');
  const [host, instanceName] = server.split('\\');
  return new sql.ConnectionPool({
    server: host, database, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    connectionTimeout: 15000, requestTimeout: 30000,
    // DB_ENCRYPT=1 encrypts the connection (recommended when SQL Server has a certificate; required off-laptop)
    options: { encrypt: process.env.DB_ENCRYPT === '1', trustServerCertificate: process.env.DB_TRUST_CERT !== '0', ...(instanceName ? { instanceName } : {}) }
  }).connect();
}

// sqlType — maps a schema column type (int, money, date, bit, text…) to the mssql parameter type.
function sqlType(t) {
  switch (t) {
    case 'int': return sql.Int;
    case 'money': return sql.Decimal(10, 2);
    case 'bit': return sql.Bit;
    case 'date': return sql.Date;
    case 'datetime': return sql.DateTime;
    case 'longtext': return sql.NVarChar(sql.MAX);
    default: return sql.NVarChar(500);
  }
}

// coerce — converts a form value to the column type ("" → NULL, "1"/"true" → bit, numbers parsed).
function coerce(def, v) {
  if (v === '' || v === undefined || v === null) return null;
  if (def.type === 'int') return parseInt(v, 10);
  if (def.type === 'money') return Number(v);
  if (def.type === 'bit') return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
  if (def.type === 'date' || def.type === 'datetime') return new Date(v);
  return String(v);
}

/** friendly — converts any SQL Server error into a SkyTech AppError (codes in config/error-codes.json). */
const friendly = err => fromDbError(err);

// q — wraps a whitelisted column/table name in [brackets].
const q = name => `[${name}]`;

module.exports = {
  name: 'SQL Server',
  /** init — opens the connection pool and runs a test query; failures become SKY-DB-00x codes. */
  async init() {
    try {
      pool = await connect();
      pool.on('error', e => log.error('db', 'Connection pool error', { code: fromDbError(e).code, details: { message: e.message } }));
      await pool.request().query('SELECT 1 AS ok');
    } catch (e) { throw e instanceof AppError ? e : fromDbError(e); }
  },
  /** _pool — the open connection pool (used by scripts/doctor.js for read-only checks). */
  _pool() { return pool; },
  /** ping — health check used by /api/health and doctor. */
  async ping() { await pool.request().query('SELECT 1 AS ok'); return true; },

  // getUser — active admin user by name (for sign-in); returns hash and role.
  async getUser(username) {
    const r = await pool.request().input('u', sql.NVarChar(50), username)
      .query('SELECT UserID, Username, PasswordHash, Role, IsActive FROM dbo.AdminUsers WHERE Username = @u');
    return r.recordset[0];
  },
  // touchLogin — records the time of the last successful sign-in.
  async touchLogin(userId) {
    await pool.request().input('id', sql.Int, userId).query('UPDATE dbo.AdminUsers SET LastLoginOn = GETDATE() WHERE UserID = @id');
  },
  // createUser — adds or resets a login (bcrypt hash only) — used by scripts/create-admin.js.
  async createUser(username, hash, role) {
    await pool.request().input('u', sql.NVarChar(50), username).input('h', sql.NVarChar(100), hash).input('r', sql.VarChar(10), role)
      .query(`IF EXISTS (SELECT 1 FROM dbo.AdminUsers WHERE Username = @u)
                UPDATE dbo.AdminUsers SET PasswordHash = @h, Role = @r, IsActive = 1 WHERE Username = @u
              ELSE INSERT INTO dbo.AdminUsers (Username, PasswordHash, Role) VALUES (@u, @h, @r)`);
  },
  // audit — appends one row to dbo.AuditLog (who, what, which record, JSON details). Append-only (sql/06).
  async audit(user, entity, action, key, details) {
    await pool.request().input('u', sql.NVarChar(50), user).input('e', sql.NVarChar(50), entity).input('a', sql.VarChar(10), action)
      .input('k', sql.NVarChar(50), key == null ? null : String(key)).input('d', sql.NVarChar(sql.MAX), details ? JSON.stringify(details) : null)
      .query('INSERT INTO dbo.AuditLog (Username, Entity, Action, RecordKey, Details) VALUES (@u, @e, @a, @k, @d)');
  },

  // dashboard — KPI numbers and chart data for the Dashboard screen.
  async dashboard() {
    const r = await pool.request().query(`
      SET NOCOUNT ON;
      DECLARE @today DATE = CAST(GETDATE() AS DATE);
      SELECT
        (SELECT COUNT(*) FROM dbo.Companies) AS Companies,
        (SELECT COUNT(*) FROM dbo.Leads) AS Leads,
        (SELECT COUNT(*) FROM dbo.Leads WHERE Status = 'NoSite') AS PotentialClients,
        (SELECT COUNT(*) FROM dbo.Leads WHERE Status = 'DemoBuilt') AS DemosBuilt,
        (SELECT COUNT(*) FROM dbo.Leads WHERE Status IN ('Contacted','Interested','Proposal','Won','Lost')) AS Contacted,
        (SELECT COUNT(*) FROM dbo.Leads WHERE Status IN ('Interested','Proposal')) AS Pipeline,
        (SELECT COUNT(*) FROM dbo.Leads WHERE Status = 'Won') AS Won,
        (SELECT ISNULL(SUM(MonthlyPlan),0) FROM dbo.Leads WHERE Status = 'Won') AS MRR,
        (SELECT ISNULL(SUM(DealValue),0) FROM dbo.Leads WHERE Status = 'Won') AS SetupRevenue,
        (SELECT COUNT(*) FROM dbo.Leads WHERE NextFollowUp <= @today AND Status NOT IN ('Won','Lost','DoNotContact')) AS FollowUpsDue,
        (SELECT COUNT(*) FROM dbo.vw_DuplicateCheck) AS PossibleDuplicates;
      SELECT Status, COUNT(*) AS N FROM dbo.Leads GROUP BY Status;
      SELECT ISNULL(County, N'(none)') AS County, Niche, COUNT(*) AS N, SUM(CASE WHEN Status = 'NoSite' THEN 1 ELSE 0 END) AS Potential
        FROM dbo.vw_LeadDetail GROUP BY County, Niche;
      SELECT TOP 10 LeadID, CompanyName, Phone, Status, NextFollowUp, AssignedAgent FROM dbo.vw_LeadDetail
       WHERE NextFollowUp <= DATEADD(day, 7, @today) AND Status NOT IN ('Won','Lost','DoNotContact') ORDER BY NextFollowUp;
      SELECT TOP 8 ActivityDate, CompanyName, Agent, ActivityType, Outcome FROM dbo.vw_ActivityDetail ORDER BY ActivityDate DESC;
      SELECT TOP 5 BatchName, RowsIn, Inserted, Updated, SkippedInFile, LastRunOn FROM dbo.ImportBatches ORDER BY LastRunOn DESC;`);
    const [k, byStatus, byArea, followUps, activity, imports] = r.recordsets;
    return { kpis: k[0], byStatus, byArea, followUps, activity, imports };
  },

  // list — one page of rows for a drill-down table: search, column filters, sort, paging (all parameterised).
  async list(entity, opts) {
    const e = ENTITIES[entity];
    const req = pool.request();
    const where = [];
    if (opts.search) {
      req.input('s', sql.NVarChar(200), `%${opts.search}%`);
      where.push('(' + e.searchColumns.map(c => `${q(c)} LIKE @s`).join(' OR ') + ')');
    }
    Object.entries(opts.filters || {}).forEach(([col, val], i) => {
      const def = e.columns[col];
      if (!def) return;
      if (val === '__null__') { where.push(`${q(col)} IS NULL`); return; }
      req.input('f' + i, sqlType(def.type), coerce(def, val));
      where.push(`${q(col)} = @f${i}`);
    });
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sort = e.columns[opts.sort] ? opts.sort : e.defaultSort;
    const dir = (opts.dir || e.defaultDir) === 'asc' ? 'ASC' : 'DESC';
    const size = Math.min(Math.max(parseInt(opts.size, 10) || 25, 1), 500);
    const page = Math.max(parseInt(opts.page, 10) || 1, 1);
    req.input('off', sql.Int, (page - 1) * size).input('size', sql.Int, size);
    const r = await req.query(`SELECT COUNT(*) AS Total FROM ${e.source} ${w};
      SELECT * FROM ${e.source} ${w} ORDER BY ${q(sort)} ${dir}, ${q(e.key)} OFFSET @off ROWS FETCH NEXT @size ROWS ONLY;`);
    return { total: r.recordsets[0][0].Total, rows: r.recordsets[1], page, size };
  },

  // get — one record by its key (from the entity's view or table).
  async get(entity, key) {
    const e = ENTITIES[entity];
    const r = await pool.request().input('k', e.columns[e.key].type === 'int' ? sql.Int : sql.NVarChar(100), e.columns[e.key].type === 'int' ? parseInt(key, 10) : String(key))
      .query(`SELECT * FROM ${e.source} WHERE ${q(e.key)} = @k`);
    return r.recordset[0];
  },

  // create — inserts a record (only editable whitelisted columns); duplicates → SKY-DUP-001.
  async create(entity, values) {
    const e = ENTITIES[entity];
    const req = pool.request();
    const cols = [], vals = [];
    editableColumns(entity).forEach((c, i) => {
      if (!(c in values)) return;
      cols.push(q(c)); vals.push('@v' + i);
      req.input('v' + i, sqlType(e.columns[c].type), coerce(e.columns[c], values[c]));
    });
    if (entity === 'companies') {
      cols.push('[NormName]', '[PhoneDigits]', '[UpdatedOn]');
      vals.push(`dbo.fn_NormName(${vals[cols.indexOf('[CompanyName]')] || "N''"})`,
        `dbo.fn_DigitsOnly(${vals[cols.indexOf('[Phone]')] || 'NULL'})`, 'GETDATE()');
    }
    if (entity === 'leads') { cols.push('[UpdatedOn]'); vals.push('GETDATE()'); }
    if (entity === 'demosites') { cols.push('[BuiltBy]', '[TemplateVersion]'); vals.push("'Owner'", "'V2.0'"); }
    try {
      const r = await req.query(`INSERT INTO ${e.table} (${cols.join(', ')}) VALUES (${vals.join(', ')});
        SELECT CAST(SCOPE_IDENTITY() AS INT) AS NewKey;`);
      return e.keyIsInput ? parseInt(values[e.key], 10) : r.recordset[0].NewKey;
    } catch (err) { throw friendly(err); }
  },

  // update — changes a record's editable columns; returns the updated row.
  async update(entity, key, values) {
    const e = ENTITIES[entity];
    const req = pool.request().input('k', sql.Int, parseInt(key, 10));
    const sets = [];
    editableColumns(entity).forEach((c, i) => {
      if (!(c in values) || (c === e.key)) return;
      sets.push(`${q(c)} = @v${i}`);
      req.input('v' + i, sqlType(e.columns[c].type), coerce(e.columns[c], values[c]));
      if (entity === 'companies' && c === 'CompanyName') sets.push(`[NormName] = dbo.fn_NormName(@v${i})`);
      if (entity === 'companies' && c === 'Phone') sets.push(`[PhoneDigits] = dbo.fn_DigitsOnly(@v${i})`);
    });
    if (!sets.length) return 0;
    if (['companies', 'leads', 'demosites'].includes(entity)) sets.push('[UpdatedOn] = GETDATE()');
    try {
      const r = await req.query(`UPDATE ${e.table} SET ${sets.join(', ')} WHERE ${q(e.key)} = @k`);
      return r.rowsAffected[0];
    } catch (err) { throw friendly(err); }
  },

  // duplicateSummary — counts from dbo.vw_DuplicateCheck by category and severity (live duplicate badge).
  async duplicateSummary() {
    const r = await pool.request().query(`SELECT Category, Severity, COUNT(*) AS N FROM dbo.vw_DuplicateCheck GROUP BY Category, Severity;`);
    return { total: r.recordset.reduce((t, x) => t + x.N, 0), byCategory: r.recordset, checkedOn: new Date().toISOString() };
  },
  // compareCompanies — two companies side by side for the merge screen.
  async compareCompanies(a, b) {
    const one = async id => {
      const r = await pool.request().input('id', sql.Int, id).query(`
        SELECT * FROM dbo.Companies WHERE CompanyID = @id;
        SELECT * FROM dbo.WebPresence WHERE CompanyID = @id;
        SELECT l.*, (SELECT COUNT(*) FROM dbo.Activities a WHERE a.LeadID = l.LeadID) AS Activities FROM dbo.Leads l WHERE l.CompanyID = @id;`);
      return r.recordsets[0][0] ? { company: r.recordsets[0][0], web: r.recordsets[1][0] || null, lead: r.recordsets[2][0] || null } : null;
    };
    return { a: await one(parseInt(a, 10)), b: await one(parseInt(b, 10)) };
  },
  // compareLeads — two leads side by side.
  async compareLeads(a, b) {
    const one = async id => (await pool.request().input('id', sql.Int, parseInt(id, 10)).query(`
      SELECT l.*, c.CompanyName, (SELECT COUNT(*) FROM dbo.Activities a WHERE a.LeadID = l.LeadID) AS Activities
        FROM dbo.Leads l LEFT JOIN dbo.Companies c ON c.CompanyID = l.CompanyID WHERE l.LeadID = @id`)).recordset[0] || null;
    return { a: await one(a), b: await one(b) };
  },
  // webRows — all web-presence rows of one company (duplicate repair).
  async webRows(companyId) {
    const r = await pool.request().input('id', sql.Int, parseInt(companyId, 10))
      .query('SELECT w.*, c.CompanyName FROM dbo.WebPresence w JOIN dbo.Companies c ON c.CompanyID = w.CompanyID WHERE w.CompanyID = @id ORDER BY w.CheckedOn DESC');
    return r.recordset;
  },
  // compareActivities — two activities side by side.
  async compareActivities(a, b) {
    const one = async id => (await pool.request().input('id', sql.Int, parseInt(id, 10))
      .query('SELECT * FROM dbo.Activities WHERE ActivityID = @id')).recordset[0] || null;
    return { a: await one(a), b: await one(b) };
  },
  // mergeCompanies — EXEC dbo.usp_MergeCompanies (errors 50001/50002 → SKY-DUP-005).
  async mergeCompanies(keepId, removeId) {
    try {
      await pool.request().input('k', sql.Int, parseInt(keepId, 10)).input('r', sql.Int, parseInt(removeId, 10))
        .query('EXEC dbo.usp_MergeCompanies @KeepID = @k, @RemoveID = @r');
    } catch (err) { throw friendly(err); }
  },
  // mergeLeads — EXEC dbo.usp_MergeLeads (errors 50011/50012 → SKY-DUP-002).
  async mergeLeads(keepId, removeId) {
    try {
      await pool.request().input('k', sql.Int, parseInt(keepId, 10)).input('r', sql.Int, parseInt(removeId, 10))
        .query('EXEC dbo.usp_MergeLeads @KeepLeadID = @k, @RemoveLeadID = @r');
    } catch (err) { throw friendly(err); }
  },
  // fixWebPresence — EXEC dbo.usp_FixDuplicateWebPresence (error 50021 → SKY-DUP-003).
  async fixWebPresence(companyId) {
    try {
      await pool.request().input('id', sql.Int, parseInt(companyId, 10)).query('EXEC dbo.usp_FixDuplicateWebPresence @CompanyID = @id');
    } catch (err) { throw friendly(err); }
  },
  // removeActivity — deletes one repeated activity.
  async removeActivity(id) {
    const r = await pool.request().input('id', sql.Int, parseInt(id, 10)).query('DELETE FROM dbo.Activities WHERE ActivityID = @id');
    if (!r.rowsAffected[0]) throw new AppError('SKY-DATA-004', 'This activity no longer exists.');
  },
  // dismissDuplicate — records "not a duplicate" so the pair is hidden from the check.
  async dismissDuplicate(category, a, b, user) {
    const [x, y] = [parseInt(a, 10), parseInt(b, 10)].sort((m, n) => m - n);
    await pool.request().input('c', sql.VarChar(20), category).input('a', sql.Int, x).input('b', sql.Int, y).input('u', sql.NVarChar(50), user)
      .query(`IF NOT EXISTS (SELECT 1 FROM dbo.DuplicateDismissals WHERE Category = @c AND CompanyID_A = @a AND CompanyID_B = @b)
              INSERT INTO dbo.DuplicateDismissals (Category, CompanyID_A, CompanyID_B, DismissedBy) VALUES (@c, @a, @b, @u)`);
  },

  // remove — deletes a record; linked records block it (SQL 547 → SKY-DATA-003).
  async remove(entity, key) {
    const e = ENTITIES[entity];
    try {
      const r = await pool.request().input('k', sql.Int, parseInt(key, 10)).query(`DELETE FROM ${e.table} WHERE ${q(e.key)} = @k`);
      return r.rowsAffected[0];
    } catch (err) { throw friendly(err); }
  }
};

// Version: V2.0 (2026-10-10) — admin-site/src/db/mssql.js — V2.0
