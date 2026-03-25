import fs from 'fs';
import path from 'path';
import { query } from '../config/database';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(): Promise<Set<string>> {
  const result = await query<{ filename: string }>(
    'SELECT filename FROM _migrations ORDER BY id'
  );
  return new Set(result.rows.map((r) => r.filename));
}

export async function runMigrations(): Promise<void> {
  console.log('[Migrate] Checking for pending migrations...');

  await ensureMigrationsTable();
  const executed = await getExecutedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;

  for (const file of files) {
    if (executed.has(file)) {
      continue;
    }

    console.log(`[Migrate] Running: ${file}`);
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await query('BEGIN');
      await query(sql);
      await query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await query('COMMIT');
      ranCount++;
      console.log(`[Migrate] Completed: ${file}`);
    } catch (err) {
      await query('ROLLBACK');
      console.error(`[Migrate] Failed: ${file}`, err);
      throw err;
    }
  }

  if (ranCount === 0) {
    console.log('[Migrate] All migrations are up to date.');
  } else {
    console.log(`[Migrate] Ran ${ranCount} migration(s) successfully.`);
  }
}
