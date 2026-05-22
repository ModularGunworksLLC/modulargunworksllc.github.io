/**
 * Server-side env (secrets). Populated from WordPress via scripts/sync-env-from-wordpress.sh
 * then copied to Vercel project env (Settings → Environment Variables).
 */

function req(name: string, optional = false): string {
  const v = process.env[name]?.trim() || "";
  if (!v && !optional) return "";
  return v;
}

export const env = {
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""),
  liveStoreUrl:
    process.env.NEXT_PUBLIC_LIVE_STORE_URL || "https://www.modulargunworks.com",
  turso: {
    url: req("TURSO_DATABASE_URL"),
    token: req("TURSO_AUTH_TOKEN"),
  },

  chattanooga: {
    sid: req("CHATTANOOGA_API_SID") || req("API_SID"),
    token: req("CHATTANOOGA_API_TOKEN") || req("API_TOKEN"),
  },

  catalogSyncSecret:
    req("CRON_SECRET") || req("CATALOG_SYNC_SECRET"),

  ledgerIntake: {
    enabled:
      process.env.LEDGER_INTAKE_ENABLED === "true" ||
      process.env.MGW_LEDGER_INTAKE_ENABLED === "true",
    url: req("LEDGER_INTAKE_URL") || req("MGW_LEDGER_INTAKE_URL"),
    token: req("LEDGER_INTAKE_TOKEN") || req("MGW_LEDGER_INTAKE_TOKEN"),
  },

  paymentHub: {
    enabled: process.env.PAYMENTHUB_ENABLED === "yes" || process.env.PAYMENTHUB_ENABLED === "true",
    epiId: req("PAYMENTHUB_EPI_ID"),
    epiKey: req("PAYMENTHUB_EPI_KEY"),
    testMode: process.env.PAYMENTHUB_TESTMODE === "true",
  },

  guntab: {
    enabled: process.env.GUNTAB_ENABLED === "yes" || process.env.GUNTAB_ENABLED === "true",
    apiToken: req("GUNTAB_API_TOKEN"),
    webhookKey: req("GUNTAB_WEBHOOK_KEY", true),
    sellerEmail: process.env.GUNTAB_SELLER_EMAIL || "modulargunworks@gmail.com",
    testMode: process.env.GUNTAB_TESTMODE === "true",
  },
} as const;

export function hasChattanoogaCredentials(): boolean {
  return Boolean(env.chattanooga.sid && env.chattanooga.token);
}

export function hasLedgerIntake(): boolean {
  return env.ledgerIntake.enabled && Boolean(env.ledgerIntake.url && env.ledgerIntake.token);
}

export function hasTursoCatalog(): boolean {
  return Boolean(env.turso.url && env.turso.token);
}
