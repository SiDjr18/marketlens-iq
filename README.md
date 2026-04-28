# MarketLens IQ

MarketLens IQ is a static, browser-based pharma commercial intelligence dashboard for IMS, IQVIA, IPM, Excel, CSV, TSV, SQL, and JSON datasets. It converts uploaded market data into mapped pharma fields, data health checks, executive dashboards, competitor positioning, strategy insights, brand plans, and exportable reports.

## What It Does

- Upload `.xlsx`, `.xls`, `.csv`, `.tsv`, `.sql`, or `.json`
- Parse CSV/TSV and SQL dumps in chunks with a Web Worker for large files
- Parse Excel workbooks with SheetJS and sheet selection
- Auto-map pharma fields including Brand, Company, Therapy, Molecule, Acute/Chronic, Indian/MNC, Plain/Combination, Value Sales, Units, Volume, MAT, Month, and Pack
- Block strategy and brand-plan output until the data health gate passes
- Analyze the full loaded dataset for dashboards, not only preview rows
- Use sticky top filters instead of sidebar filters
- Export the current filtered view as CSV, PDF, PPT, and PNG

## Dashboards

- Overview
- Market Landscape
- Competitor Positioning
- Brand Deep Dive
- Therapy
- Molecule
- Strategy Lab
- Brand Plan
- Exports

## Privacy

MarketLens IQ is designed for GitHub Pages and runs as a static frontend. Uploaded files are processed in the user's browser session. This repo does not include a backend, database, or file upload server, so people using the public app cannot access files from the repository owner's local computer.

Public GitHub users can view or fork public code, but they cannot change the original repository unless the owner grants access or merges a pull request. For stricter control, enable GitHub branch protection for `main`.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Build

```bash
npm run build
```

The Vite build writes GitHub Pages-ready assets to the repository root so Pages can deploy from the `main` branch root folder.

## Deploy On GitHub Pages

1. Push the repository to GitHub.
2. Open `Settings > Pages`.
3. Choose `Deploy from a branch`.
4. Select branch `main`.
5. Select folder `/ (root)`.
6. Save and wait for GitHub Pages to publish.

Live URL format:

```text
https://<username>.github.io/<repo-name>/
```

## Large File Notes

CSV, TSV, and SQL dump files are best for very large IMS/IQVIA exports because they can be parsed incrementally in a worker. Excel parsing happens in the browser and depends on the user's device memory and browser limits. For very large Excel workbooks, export the relevant worksheet as CSV when possible.
