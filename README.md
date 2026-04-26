# MarketLens IQ

MarketLens IQ is a browser-based Excel-to-dashboard studio for large IMS/IQVIA-style pharma datasets and standard business workbooks. Upload Excel or CSV data, choose a corporate view, filter the criteria, and export a professional dashboard as PPT, PDF, CSV, HTML, PNG, or BI model JSON.

## Highlights

- Upload `.xlsx`, `.xls`, `.csv`, `.tsv`, `.json`, or `.sql`
- Large `.xlsx` streaming mode for 250-500 MB+ IMS/IQVIA files
- Auto-detect IMS/pharma matrix files with fields such as `BRANDS`, `PACK_DESC`, `MANUFACT. DESC`, `GROUP`, `ACUTE_CHRONIC`, and `NFC`
- Derived IMS metrics: `MAT Value`, `Monthly Value`, `Value Sales`, `Unit Sales`, `Volume Sales`, `Growth %`, `Price Proxy`, `IMS Active Periods`
- Corporate dashboard modes:
  - Executive: board-level performance, concentration, coverage
  - Marketing: brand, pack, lifecycle, and category performance
  - Pre-sales & BD: opportunity identification and whitespace pockets
  - Finance: budget allocation, concentration, and variance focus
  - Sales: latest-period performance, gaps, and coverage monitoring
  - Custom: manual metric/dimension/date selection
- Criteria controls for segment filtering, ranking depth, and active IMS rows
- Exports respect the selected dashboard view and criteria

## Data Inputs

MarketLens IQ supports common business data exports:

- Excel workbooks: `.xlsx`, `.xls`
- Flat files: `.csv`, `.tsv`
- JSON arrays or objects: `.json`
- SQL dumps with `CREATE TABLE` and `INSERT INTO ... VALUES`: `.sql`

The app profiles the uploaded columns, classifies the likely business domain, selects useful metrics/dimensions, and changes the dashboard and strategy plan accordingly.

SQL support is designed for exported row data, not live database connections. For direct database connectivity, use the enterprise backend pattern described below.

## Run Locally

Open `index.html` directly in Chrome or Edge.

For the best experience with large files, use a modern Chromium browser because large workbook mode uses browser streaming decompression.

## Deploy On GitHub Pages

1. Create a new GitHub repository.
2. Upload all files in this folder.
3. Go to `Settings > Pages`.
4. Choose `Deploy from a branch`.
5. Select the `main` branch and root folder.
6. Open the generated GitHub Pages URL.

More deployment options are documented in `DEPLOYMENT.md`.

## Free Cloud, Privacy, And Ownership

MarketLens IQ is GitHub Pages deployable as a static site, so the standard public deployment path can run for free without a paid server. Users upload their own data in their own browser; this project does not include a backend that can read files from your local computer or collect uploaded workbooks.

Only the repository owner can change this GitHub repository unless collaborators are explicitly added or a pull request is merged. Public users can view or fork public code, but they cannot directly change your original repository.

GitHub does not send notifications for every public view, clone, or download. Use repository stars, forks, issues, pull requests, and the `Insights > Traffic` page for available visibility. To make change control stricter, enable branch protection in GitHub: `Settings > Branches > Add branch protection rule > main`, then require pull requests before merging.

## Exports

- `PPT`: boardroom-ready PowerPoint deck
- `PDF`: dashboard report
- `BI`: JSON handoff with schema, measures, visuals, and the selected-state data extract
- `CSV`: filtered/cleaned data
- `HTML`: shareable dashboard report
- `PNG`: image snapshot of the dashboard

## Large IMS/IQVIA Files

For IMS/IQVIA-like `.xlsx` files, and for workbooks above roughly `50 MB`, the app switches to worker-backed large workbook mode. It reads workbook metadata and streams worksheet rows so final dashboard calculations are based on the loaded workbook rows, not a first-rows preview cut.

Very large browser workloads still depend on the user's machine memory and browser limits. If the browser cannot complete a file, export the workbook as CSV or use the enterprise backend pattern in `ENTERPRISE_FULL_DATA.md`.

The included parser has been tested against an IMS workbook with more than 100,000 rows and 200+ columns. It uses streaming worksheet parsing so the sheet XML is never expanded into one giant browser string.

## Strategy Outputs

The dashboard changes its operating logic by department:

- Executive: portfolio concentration, leadership focus, governance
- Marketing: brand plan, campaign design, measurement architecture
- Brand Strategy: where-to-play/how-to-win, molecule strategy, end-to-end plan
- Pre-sales & BD: opportunity mapping, account narrative, whitespace identification
- Finance: budget allocation, scenario modelling, investment gates
- Sales: gap diagnosis, field priorities, review cadence
- Supply Chain: demand signals, pack risk, S&OP linkage

All recommendations are rule-based and calculated from the selected workbook, metric, dimension, and filter criteria. The app does not use generated facts outside the uploaded data.

## Tech Stack

- HTML, CSS, JavaScript
- Chart.js
- SheetJS for normal Excel parsing
- Web Worker and native browser streams for large `.xlsx` parsing
- html2canvas, jsPDF, and PptxGenJS for exports
- Lucide icons

## Privacy

All analysis runs in the browser. Files are not uploaded to a server by this static app. See `PRIVACY.md` for details and enterprise self-hosting notes.
