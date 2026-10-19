-- Seed from CoinGecko daily closes, fetched 2026-10-19.
-- Jun-Sep are closed months. Oct is month-to-date (provisional).

INSERT INTO zec_usd_monthly (month, avg_usd, close_usd, source, provisional, fetched_at)
VALUES
  ('2026-06-01', 454.88,  406.61,  'coingecko', FALSE, now()),
  ('2026-07-01', 494.19,  469.96,  'coingecko', FALSE, now()),
  ('2026-08-01', 600.39,  836.20,  'coingecko', FALSE, now()),
  ('2026-09-01', 1272.29, 1417.26, 'coingecko', FALSE, now()),
  ('2026-10-01', 1246.99, 1139.68, 'coingecko', TRUE,  now())
ON CONFLICT (month) DO UPDATE SET
  avg_usd     = EXCLUDED.avg_usd,
  close_usd   = EXCLUDED.close_usd,
  provisional = EXCLUDED.provisional,
  fetched_at  = now();
