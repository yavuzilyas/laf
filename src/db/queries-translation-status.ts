import { query } from './pg';

// Create a new translation status record
export async function createTranslationStatus(
    articleId: string, 
    languageCode: string, 
    translatorId: string
): Promise<string | null> {
    try {
        const sql = `
            INSERT INTO article_translation_statuses 
            (article_id, language_code, translator_id, status, submitted_at)
            VALUES ($1, $2, $3, 'pending', NOW())
            ON CONFLICT (article_id, language_code, translator_id) 
            DO UPDATE SET status = 'pending', submitted_at = NOW(), reviewed_at = NULL, review_notes = NULL
            RETURNING id
        `;
        const result = await query(sql, [articleId, languageCode, translatorId]);
        return result.rows[0]?.id || null;
    } catch (error) {
        console.error('Error creating translation status:', error);
        return null;
    }
}

// Update translation status to approved or rejected
export async function updateTranslationStatus(
    statusId: string,
    newStatus: 'approved' | 'rejected',
    reviewNotes?: string | null
): Promise<boolean> {
    try {
        const sql = `
            UPDATE article_translation_statuses 
            SET status = $2, reviewed_at = NOW(), review_notes = $3
            WHERE id = $1
            RETURNING *
        `;
        const result = await query(sql, [statusId, newStatus, reviewNotes || null]);
        return result.rowCount > 0;
    } catch (error) {
        console.error('Error updating translation status:', error);
        return false;
    }
}

// Get translation status by ID
export async function getTranslationStatus(statusId: string): Promise<any | null> {
    try {
        const sql = `
            SELECT ats.*, 
                   a.author_id, 
                   a.translations as article_translations,
                   a.default_language,
                   u.username as translator_name
            FROM article_translation_statuses ats
            JOIN articles a ON ats.article_id = a.id
            JOIN users u ON ats.translator_id = u.id
            WHERE ats.id = $1
        `;
        const result = await query(sql, [statusId]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting translation status:', error);
        return null;
    }
}

// Get pending translations for an article author
export async function getPendingTranslationsForAuthor(authorId: string): Promise<any[]> {
    try {
        const sql = `
            SELECT ats.*, 
                   a.translations as article_translations,
                   a.default_language,
                   u.username as translator_name
            FROM article_translation_statuses ats
            JOIN articles a ON ats.article_id = a.id
            JOIN users u ON ats.translator_id = u.id
            WHERE a.author_id = $1 AND ats.status = 'pending'
            ORDER BY ats.submitted_at DESC
        `;
        const result = await query(sql, [authorId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting pending translations:', error);
        return [];
    }
}

// Get translation status for a specific article + language
export async function getTranslationStatusForArticle(
    articleId: string, 
    languageCode: string
): Promise<any | null> {
    try {
        const sql = `
            SELECT ats.*, u.username as translator_name
            FROM article_translation_statuses ats
            JOIN users u ON ats.translator_id = u.id
            WHERE ats.article_id = $1 AND ats.language_code = $2 AND ats.status = 'approved'
            ORDER BY ats.reviewed_at DESC
            LIMIT 1
        `;
        const result = await query(sql, [articleId, languageCode]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error getting translation status for article:', error);
        return null;
    }
}

// Check if a translation is approved
export async function isTranslationApproved(articleId: string, languageCode: string): Promise<boolean> {
    try {
        const sql = `
            SELECT EXISTS (
                SELECT 1 FROM article_translation_statuses
                WHERE article_id = $1 AND language_code = $2 AND status = 'approved'
            ) as is_approved
        `;
        const result = await query(sql, [articleId, languageCode]);
        return result.rows[0]?.is_approved || false;
    } catch (error) {
        console.error('Error checking translation approval:', error);
        return false;
    }
}
