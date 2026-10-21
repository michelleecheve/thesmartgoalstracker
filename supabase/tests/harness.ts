import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

/**
 * Postgres local (PGlite) con una simulación mínima de lo que Supabase trae:
 * roles anon/authenticated, auth.users, auth.uid() y el esquema storage.
 * Aplica todas las migraciones en orden.
 */
export async function createTestDatabase() {
  const db = new PGlite()
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    grant usage on schema public to authenticated, anon;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
    create function storage.foldername(name text) returns text[] language sql immutable as
      $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  `)

  const dir = join(import.meta.dirname, '..', 'migrations')
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(dir, file), 'utf8'))
  }

  /** Ejecuta una consulta como un usuario autenticado (o anónimo si user es null). */
  async function as<T = Record<string, unknown>>(user: string | null, sql: string, params: unknown[] = []) {
    await db.exec(
      user
        ? `set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`
        : `set role anon; select set_config('request.jwt.claim.sub', '', false);`,
    )
    try {
      return await db.query<T>(sql, params)
    } finally {
      await db.exec('reset role;')
    }
  }

  async function createUser(id: string, displayName?: string) {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
      id,
      `${id.slice(0, 4)}@prueba.com`,
      JSON.stringify(displayName ? { display_name: displayName } : {}),
    ])
  }

  return { db, as, createUser }
}

export const USER_A = '11111111-1111-1111-1111-111111111111'
export const USER_B = '22222222-2222-2222-2222-222222222222'
