import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function walkFiles(dir: string, extFilter: string[]): string[] {
  if (!existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, extFilter));
    } else if (extFilter.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

describe('Phase 9: Security, Secret Isolation & Full-Schema RLS Audit', () => {
  it('enforces Row Level Security on every single PostgreSQL table across all migrations', () => {
    const migrationsDir = resolve(process.cwd(), 'supabase/migrations');
    const sqlFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    expect(sqlFiles.length).toBeGreaterThanOrEqual(9);
    const allSql = sqlFiles.map((f) => readFileSync(resolve(migrationsDir, f), 'utf8')).join('\n');

    const tables = Array.from(allSql.matchAll(/CREATE TABLE IF NOT EXISTS public\.([a-z_]+)/g)).map(
      (m: RegExpExecArray) => m[1]
    );
    expect(tables.length).toBeGreaterThanOrEqual(55);

    for (const table of tables) {
      expect(allSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it('never exposes server-side secrets or unsafe DOM sinks in client source code', () => {
    const srcFiles = walkFiles(resolve(process.cwd(), 'src'), ['.ts', '.tsx']).filter(
      (p) => !p.includes(`${resolve(process.cwd(), 'src/test')}`)
    );

    const forbiddenPatterns = [
      'SUPABASE_SERVICE_ROLE_KEY',
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'WHATSAPP_API_TOKEN',
      'GEMINI_API_KEY',
      'dangerouslySetInnerHTML',
    ];

    for (const file of srcFiles) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(content, `${pattern} found in ${file}`).not.toContain(pattern);
      }
    }
  });

  it('keeps production client chunks free of server-side secret names if dist exists', () => {
    const distAssets = walkFiles(resolve(process.cwd(), 'dist/assets'), ['.js']);
    for (const file of distAssets) {
      const content = readFileSync(file, 'utf8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('RAZORPAY_KEY_SECRET');
      expect(content).not.toContain('GEMINI_API_KEY');
    }
  });
});
