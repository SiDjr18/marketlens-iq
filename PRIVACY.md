# Privacy

MarketLens IQ is designed as a local-first, static web app.

## What Happens To Uploaded Files

- Uploaded Excel, CSV, TSV, JSON, and SQL files are read by JavaScript in the user's browser.
- The static GitHub Pages version does not include a backend server, database, upload endpoint, telemetry endpoint, or analytics tracker.
- Workbook contents are not transmitted by MarketLens IQ to the repository owner, GitHub, or any custom server controlled by this project.
- Exports are generated in the user's browser and downloaded directly by the user.

## Third-Party CDN Scripts

The app loads client-side libraries from public CDNs:

- SheetJS for normal Excel parsing
- Chart.js for charts
- html2canvas for dashboard image capture
- jsPDF for PDF export
- PptxGenJS for PowerPoint export
- Lucide for icons

These scripts run in the browser. The project does not send uploaded file contents to those services. Teams with strict compliance rules can self-host these libraries by downloading the scripts and changing the `<script>` tags in `index.html`.

## Large Files

Very large IMS/IQVIA-style Excel workbooks may be sampled in browser mode. The dashboard discloses sampled analysis and should not be treated as final full-market truth when full validation is required.

For full-data enterprise processing, use a backend or warehouse pipeline as described in `ENTERPRISE_FULL_DATA.md`.

## Recommended Deployment

For public demos:

- Deploy on GitHub Pages, Netlify, Vercel static hosting, or an internal static web server.
- Keep the app static if you want local-only analysis.
- Do not add upload APIs unless your organization has approved storage, retention, and access policies.

For enterprise use:

- Add authentication only if needed.
- Add a backend ETL pipeline only when full-data processing is required.
- Log metadata, not raw patient/customer/confidential data, unless governance permits it.
