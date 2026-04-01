import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

// Runtime'da env'den oku (build-time'da değil)
const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
    connectionString: DATABASE_URL,
});

export function start_pg(): Promise<pg.PoolClient> {
    return pool.connect();
}

export default pool;

// Helper function to execute queries
export async function query(text: string, params?: any[]): Promise<pg.QueryResult> {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// Helper function to execute transactions
export async function transaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
