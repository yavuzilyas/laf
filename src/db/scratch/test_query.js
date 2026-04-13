import pg from 'pg';
import { env } from 'process';

const pool = new pg.Pool({
    connectionString: "postgresql://postgres@localhost:5432/laf_app",
});

async function test() {
    const slug = 'hyhy-lasdmlakdsmlas-hy';
    const language = undefined;
    
    const conditions = [];
    conditions.push('a.deleted_at IS NULL');
    conditions.push('a.is_hidden = FALSE');
    const whereClause = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    const sql = `
        SELECT a.id, 
               t.matched_lang
        FROM articles a
        JOIN users u ON a.author_id = u.id,
        LATERAL (
            SELECT key AS matched_lang 
            FROM jsonb_each(a.translations) 
            WHERE value->>'slug' = $1
            ${language ? `AND key = $2` : ''}
            LIMIT 1
        ) t
        WHERE 1=1 ${whereClause}
        LIMIT 1
    `;
    
    console.log('SQL:', sql);
    try {
        const result = await pool.query(sql, [slug]);
        console.log('Result:', result.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

test();
