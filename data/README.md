# data/

Lead data files live here (`C:\Users\AV\Documents\SkyTechClaude\skytech-agent-program\data`), one folder per pull:

```
data/
  raw/overture/2026-10-xx/        # GeoJSON files from Overture Maps Explorer (untouched)
  samples/                        # SkyTech_Leads_Sample100.csv and its _import.sql
```

- Status (2026-10-02): first sample in `samples/` (100 leads) from `raw/overture/2026-10-02/`. First pull = 100-lead sample, real estate + utility trades, Baltimore City / Baltimore County / Howard County.
- Databases: SkyTechCRM runs on SQL Server Express on the owner's laptop. Its schema is `sql/01_create_skytechcrm.sql`; database backups (.bak) are not stored in Git. Export reports as CSV into `data/` instead.
- Lead data contains business contact details: keep this repository **private**.

---
Version: V1.2 (2026-10-02) — data/README.md — V1.2
