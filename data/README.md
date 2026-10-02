# data/

Lead data files live here (`C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program\data`), one folder per pull:

```
data/
  raw/overture/2026-10-xx/        # GeoJSON files from Overture Maps Explorer (untouched)
  samples/                        # SkyTech_Leads_Sample100.csv and its _import.sql
```

- Status (2026-10-02): first sample in `samples/` (100 leads) from `raw/overture/2026-10-02/`. First pull = 100-lead sample, real estate + utility trades, Baltimore City / Baltimore County / Howard County.
## No duplicates (standing rule, from 2026-10-02)
- All imports go through `dbo.StgLeads` + `EXEC dbo.usp_ImportStagedLeads` (created by `sql/01_create_skytechcrm.sql` V2.0). Never INSERT directly into Companies/Leads.
- A company is the same company if it has the same source ID (e.g. Overture ID), or else the same normalized name + ZIP. Existing companies are updated (blanks filled), never duplicated; leads already in outreach keep their status.
- The database enforces it with unique indexes (source ID; name + ZIP; one WebPresence row and one Lead per company).
- Every run is logged in `dbo.ImportBatches`; `dbo.vw_PossibleDuplicates` lists near-matches (same phone, or same name in another ZIP) for review.
- Import scripts are safe to re-run.

- Databases: SkyTechCRM runs on SQL Server 2014 Developer edition on the owner's laptop. Its schema is `sql/01_create_skytechcrm.sql`; database backups (.bak) are not stored in Git. Export reports as CSV into `data/` instead.
- Lead data contains business contact details: keep this repository **private**.

---
Version: V1.3 (2026-10-02) — data/README.md — V1.3
