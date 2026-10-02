# Demo sites

Free one-page demo websites built by SkyTech_WebsiteDeveloper. Each one is a single file, `demo-sites/<business>-<zip>/index.html`, which you can open in any browser by double-clicking it.

- `manifest.csv` lists every demo built so far (one row per business).
- All demos carry a "Website preview" banner and are hidden from search engines until the business approves.
- To rebuild after a wording change: `python scripts/website/build_demo_sites.py --names "<name>"` (or `--all`).
- After you approve a batch, run `sql\05_demo_sites_built.sql` in SSMS to mark those leads **DemoBuilt**.

Hosting (planned): free Netlify site with one link per demo, published only after owner approval.

---
Version: V1.0 (2026-10-02) — demo-sites/README.md — V1.0
