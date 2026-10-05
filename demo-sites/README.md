# Demo sites

Free one-page demo websites built by SkyTech_WebsiteDeveloper. Each one is a single file, `demo-sites/<business>-<zip>/index.html`, which opens in any browser with a double-click.

- `designs/<business>.json`: the unique design and wording for each business (the source for the page and for the database row).
- `manifest.csv`: every demo built so far, one row per business.
- Rebuild after changing a design file: in `admin-site`, run `npm run build-demos`.
- Load into SkyTechCRM: run `sql\05_demo_sites_built.sql` in SSMS. Then edit, preview and save each demo in the Admin site under **Demo sites**.
- Every demo carries a "Website preview" banner and is hidden from search engines until its status is **Published**.

Hosting (planned): a free Netlify site with one link per demo, published only after owner approval.

---
Version: V2.0 (2026-10-05) — demo-sites/README.md — V2.0
