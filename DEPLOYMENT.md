# Deployment

MarketLens IQ can be deployed as a static site. Users can pull the code, deploy it, and use it without sending workbook data to a custom backend.

## Option 1: GitHub Pages

1. Fork or clone the repository.
2. Push it to your own GitHub account.
3. Go to `Settings > Pages`.
4. Set source to `Deploy from a branch`.
5. Select `main` and `/root`.
6. Save.
7. Open the GitHub Pages URL after the build completes.

## Option 2: Netlify

1. Create a new Netlify site.
2. Connect the GitHub repository.
3. Build command: leave blank.
4. Publish directory: `/` or root.
5. Deploy.

## Option 3: Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: `Other`.
3. Build command: leave blank.
4. Output directory: leave blank or use root.
5. Deploy.

## Option 4: Internal Static Server

Copy these files to any internal static host:

- `index.html`
- `styles.css`
- `app.js`
- documentation files as needed

The included `server.js` is only a local development helper:

```bash
npm start
```

## Privacy-Safe Deployment Checklist

- Keep the app static for local-only file analysis.
- Do not add server upload endpoints unless your organization wants centralized processing.
- Self-host CDN scripts if external CDN usage is not allowed.
- Tell users when analysis is sampled versus full-data.
- Use `ENTERPRISE_FULL_DATA.md` if full IMS/IQVIA processing is required.
