import { query } from './pg';

// Hourly Translation Limit Functions
export const getUserHourlyTranslationCount = async (userId: string): Promise<number> => {
    const sql = `
        SELECT COUNT(*) as count 
        FROM user_daily_translations 
        WHERE user_id = $1 
        AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    const result = await query(sql, [userId]);
    return parseInt(result.rows[0]?.count || '0');
};

export const addDailyTranslation = async (
    userId: string,
    articleId: string,
    languageCode: string
): Promise<boolean> => {
    try {
        const sql = `
            INSERT INTO user_daily_translations (user_id, article_id, language_code)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, translation_date, article_id, language_code) 
            DO UPDATE SET created_at = NOW()
            RETURNING id
        `;
        const result = await query(sql, [userId, articleId, languageCode]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error adding hourly translation:', error);
        return false;
    }
};

export const checkDailyTranslationLimit = async (
    userId: string,
    limit: number = 4
): Promise<{ canTranslate: boolean; currentCount: number; remaining: number }> => {
    const currentCount = await getUserHourlyTranslationCount(userId);
    return {
        canTranslate: currentCount < limit,
        currentCount,
        remaining: Math.max(0, limit - currentCount)
    };
};
