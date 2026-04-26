# MarketLens IQ

MarketLens IQ is a browser-based Excel-to-dashboard studio for large IMS/IQVIA-style pharma datasets and standard business workbooks. Upload Excel or CSV data, choose a corporate view, filter the criteria, and export a professional dashboard as PPT, PDF, CSV, HTML, PNG, or BI model JSON.

## Highlights

- Upload `.xlsx`, `.xls`, `.csv`, or `.tsv`
- Large `.xlsx` streaming mode for 250-500 MB+ IMS/IQVIA files
- Auto-detect IMS/pharma matrix files with fields such as `BRANDS`, `PACK_DESC`, `MANUFACT. DESC`, `GROUP`, `ACUTE_CHRONIC`, and `NFC`
- Derived IMS metrics: `IMS Total`, `IMS Latest`, `IMS Average`, `IMS Peak`, `IMS Active Periods`
- Corporate dashboard modes:
  - Executive: board-level performance, concentration, coverage
  - Marketing: brand, pack, lifecycle, and category performance
  - Pre-sales & BD: opportunity identification and whitespace pockets
  - Finance: budget allocation, concentration, and variance focus
  - Sales: latest-period performance, gaps, and coverage monitoring
  - Custom: manual metric/dimension/date selection
- Criteria controls for segment filtering, ranking depth, and active IMS rows
- Exports respect the selected dashboard view and criteria

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

## Exports

- `PPT`: boardroom-ready PowerPoint deck
- `PDF`: dashboard report
- `BI`: JSON handoff with schema, measures, visuals, and sample data
- `CSV`: filtered/cleaned data
- `HTML`: shareable dashboard report
- `PNG`: image snapshot of the dashboard

## Large IMS/IQVIA Files

For IMS/IQVIA-like `.xlsx` files, and for workbooks above roughly `50 MB`, the app switches to large workbook mode. It reads workbook metadata and samples the first analyzable rows without expanding the entire Excel file into memory. This makes 100-500 MB IMS/IQVIA datasets usable in the browser while keeping the dashboard responsive.

Large mode is intentionally sample-based. For enterprise production use where every row must be processed, connect the same dashboard UI to a server-side ETL pipeline or warehouse.

## Tech Stack

- HTML, CSS, JavaScript
- Chart.js
- SheetJS for normal Excel parsing
- Native browser streams for large `.xlsx` sampling
- html2canvas, jsPDF, and PptxGenJS for exports
- Lucide icons

## Privacy

All analysis runs in the browser. Files are not uploaded to a server by this static app.
