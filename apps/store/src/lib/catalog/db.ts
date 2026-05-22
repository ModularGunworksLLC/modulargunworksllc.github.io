import { createClient, type Client } from "@libsql/client";
import type { CatalogSyncStats, StoreProduct } from "@/lib/catalog/types";
import { slugFromSku } from "@/lib/catalog/slug";

export type CatalogProduct = StoreProduct & { slug: string };

let client: Client | null = null;

export function hasCatalogDatabase(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL?.trim() && process.env.TURSO_AUTH_TOKEN?.trim(),
  );
}

function getClient(): Client {
  if (!hasCatalogDatabase()) {
    throw new Error(
      "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (create a free DB at https://turso.tech)",
    );
  }
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return client;
}

export async function initCatalogSchema(): Promise<void> {
  const db = getClient();
  const ddl = [
    `CREATE TABLE IF NOT EXISTS catalog_products (
      sku TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      top_slug TEXT,
      sub_slug TEXT,
      list_price REAL,
      name TEXT,
      brand TEXT,
      in_stock INTEGER NOT NULL DEFAULT 0,
      sellable INTEGER NOT NULL DEFAULT 0,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_catalog_top_slug ON catalog_products(top_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_catalog_sellable ON catalog_products(sellable)`,
    `CREATE INDEX IF NOT EXISTS idx_catalog_slug ON catalog_products(slug)`,
    `CREATE TABLE IF NOT EXISTS catalog_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ];
  for (const sql of ddl) {
    await db.execute(sql);
  }
}

function rowToProduct(row: {
  data: string;
  slug: string;
}): CatalogProduct {
  const p = JSON.parse(row.data) as StoreProduct;
  return { ...p, slug: row.slug };
}

export async function replaceCatalogProducts(
  products: StoreProduct[],
  stats: CatalogSyncStats,
): Promise<{ inserted: number }> {
  await initCatalogSchema();
  const db = getClient();
  const now = new Date().toISOString();

  await db.execute(`DELETE FROM catalog_products`);

  const BATCH = 400;
  let inserted = 0;

  for (let i = 0; i < products.length; i += BATCH) {
    const chunk = products.slice(i, i + BATCH);
    const stmts = chunk.map((p) => {
      const slug = slugFromSku(p.sku);
      return {
        sql: `INSERT INTO catalog_products (
          sku, slug, top_slug, sub_slug, list_price, name, brand, in_stock, sellable, data, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.sku,
          slug,
          p.topSlug || "",
          p.subSlug || "",
          p.listPrice ?? 0,
          p.name,
          p.brand || "",
          p.stock > 0 ? 1 : 0,
          p.sellable ? 1 : 0,
          JSON.stringify(p),
          now,
        ],
      };
    });
    await db.batch(stmts);
    inserted += chunk.length;
  }

  await db.execute({
    sql: `INSERT INTO catalog_meta (key, value) VALUES ('last_sync_stats', ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    args: [JSON.stringify(stats)],
  });

  return { inserted };
}

export async function getCatalogStats(): Promise<CatalogSyncStats | null> {
  if (!hasCatalogDatabase()) return null;
  await initCatalogSchema();
  const db = getClient();
  const r = await db.execute({
    sql: `SELECT value FROM catalog_meta WHERE key = 'last_sync_stats'`,
  });
  if (!r.rows.length) return null;
  return JSON.parse(String(r.rows[0].value)) as CatalogSyncStats;
}

export type ListCatalogQuery = {
  topSlug?: string;
  search?: string;
  page?: number;
  perPage?: number;
};

export async function listCatalogProducts(
  query: ListCatalogQuery = {},
): Promise<{
  products: CatalogProduct[];
  total: number;
  totalPages: number;
  page: number;
}> {
  await initCatalogSchema();
  const db = getClient();
  const perPage = Math.min(Math.max(query.perPage ?? 48, 1), 100);
  const page = Math.max(query.page ?? 1, 1);
  const offset = (page - 1) * perPage;

  const where: string[] = ["sellable = 1"];
  const args: (string | number)[] = [];

  if (query.topSlug) {
    where.push("top_slug = ?");
    args.push(query.topSlug);
  }
  if (query.search) {
    where.push("(name LIKE ? OR sku LIKE ? OR brand LIKE ?)");
    const q = `%${query.search}%`;
    args.push(q, q, q);
  }

  const whereSql = where.join(" AND ");

  const countR = await db.execute({
    sql: `SELECT COUNT(*) AS c FROM catalog_products WHERE ${whereSql}`,
    args,
  });
  const total = Number(countR.rows[0]?.c ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const rows = await db.execute({
    sql: `SELECT data, slug FROM catalog_products WHERE ${whereSql}
          ORDER BY name ASC LIMIT ? OFFSET ?`,
    args: [...args, perPage, offset],
  });

  return {
    products: rows.rows.map((row) =>
      rowToProduct({ data: String(row.data), slug: String(row.slug) }),
    ),
    total,
    totalPages,
    page,
  };
}

export async function getCatalogProductBySlug(
  slug: string,
): Promise<CatalogProduct | null> {
  await initCatalogSchema();
  const db = getClient();
  const r = await db.execute({
    sql: `SELECT data, slug FROM catalog_products WHERE slug = ? AND sellable = 1 LIMIT 1`,
    args: [slug],
  });
  if (!r.rows.length) return null;
  return rowToProduct({
    data: String(r.rows[0].data),
    slug: String(r.rows[0].slug),
  });
}

export async function getCatalogProductCount(): Promise<number> {
  if (!hasCatalogDatabase()) return 0;
  await initCatalogSchema();
  const db = getClient();
  const r = await db.execute(
    `SELECT COUNT(*) AS c FROM catalog_products WHERE sellable = 1`,
  );
  return Number(r.rows[0]?.c ?? 0);
}
