import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

// Lazy initialization - build sırasında değil, ilk kullanımda oluştur
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
    if (!pool) {
        const DATABASE_URL = env.DATABASE_URL;
        if (!DATABASE_URL) {
            throw new Error('DATABASE_URL environment variable is required');
        }
        pool = new Pool({
            connectionString: DATABASE_URL,
        });
    }
    return pool;
}

export function start_pg(): Promise<pg.PoolClient> {
    return getPool().connect();
}

export default {
    get connect() { return getPool().connect.bind(getPool()); },
    get query() { return getPool().query.bind(getPool()); },
    get end() { return getPool().end.bind(getPool()); }
};

// Helper function to execute queries
export async function query(text: string, params?: any[]): Promise<pg.QueryResult> {
    const client = await getPool().connect();
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
