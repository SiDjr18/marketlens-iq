# Enterprise Full-Data Mode

MarketLens IQ on GitHub Pages is a static browser app. It now uses worker-backed full-row parsing for supported browser workloads, but a browser still cannot honestly guarantee unlimited processing for every file size, machine, and memory condition.

For true 100% processing of very large datasets, use this architecture:

1. Upload workbook to a controlled backend or storage bucket.
2. Stream parse the `.xlsx` sheet XML row by row.
3. Aggregate measures by brand, company, molecule, therapy group, pack, acute/chronic, territory, and any uploaded dimension.
4. Store output tables in Parquet, DuckDB, Postgres, BigQuery, Snowflake, or another warehouse.
5. Serve aggregated JSON to the MarketLens IQ frontend.
6. Generate PPT/PDF/CSV/image exports from the validated aggregate tables.

Recommended validation rules:

- Never generate a strategy plan unless row count, parsed column count, and measure-column count are available.
- Always show rows processed, skipped rows, mapping status, and confidence score.
- Block budget allocation recommendations when required mappings or numeric parsing confidence are weak.
- Keep audit metadata: file name, sheet, rows processed, rows skipped, parse errors, timestamp, and aggregation grain.

This keeps the public demo fast while preserving a clear production path for MNC-grade analytics.
