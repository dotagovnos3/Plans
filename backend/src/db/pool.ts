import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/plans';

export const pool = new pg.Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected pg pool error:', err);
});

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}
