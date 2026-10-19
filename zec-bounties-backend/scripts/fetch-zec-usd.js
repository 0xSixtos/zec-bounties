/**
 * Fetch the prior calendar month's ZEC/USD from CoinGecko and upsert it.
 *
 * Run on the 1st of each month (cron or node-cron):
 *   node scripts/fetch-zec-usd.js
 *
 * Uses the public CoinGecko market_chart endpoint. No API key required
 * for this volume. Stores avg of daily closes and the month-end close.
 *
 * Env: DATABASE_URL (Postgres, same as the app).
 */

const { PrismaClient } = require("@prisma/client");

const COINGECKO =
  "https://api.coingecko.com/api/v3/coins/zcash/market_chart?vs_currency=usd&days=40&interval=daily";

function monthKey(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

async function main() {
  const now = new Date();
  // Prior closed month.
  const prior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const target = monthKey(prior);
  const targetYear = prior.getUTCFullYear();
  const targetMonth = prior.getUTCMonth();

  const res = await fetch(COINGECKO);
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
  const data = await res.json();
  const prices = data.prices || [];

  const inMonth = prices.filter(([ts]) => {
    const d = new Date(ts);
    return d.getUTCFullYear() === targetYear && d.getUTCMonth() === targetMonth;
  });
  if (inMonth.length === 0) {
    throw new Error(`No daily prices for ${target}`);
  }

  const avg = inMonth.reduce((s, [, p]) => s + p, 0) / inMonth.length;
  const close = inMonth[inMonth.length - 1][1];

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`
      INSERT INTO zec_usd_monthly (month, avg_usd, close_usd, source, provisional, fetched_at)
      VALUES (${target}::date, ${avg}, ${close}, 'coingecko', FALSE, now())
      ON CONFLICT (month) DO UPDATE SET
        avg_usd = EXCLUDED.avg_usd,
        close_usd = EXCLUDED.close_usd,
        provisional = FALSE,
        fetched_at = now()
    `;
    console.log(
      `upserted ${target}: avg=${avg.toFixed(2)} close=${close.toFixed(2)} days=${inMonth.length}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
