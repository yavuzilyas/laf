// PostgreSQL query helpers for LAF application

import { query, transaction } from './pg';
import { v4 as uuidv4 } from 'uuid';

// Helper functions to replace MongoDB ObjectId operations
export const toObjectId = (id: string): string => {
    return id; // In PostgreSQL, we use UUID strings directly
};

export const fromObjectId = (obj: any) => {
    return obj; // No conversion needed in PostgreSQL
};

// Collection helpers (these return query functions, not actual collections)
export const getUsersCollection = () => {
    return {
        findOne: async (filter: any, options?: any) => {
            const users = await getUsers(filter);
            return users[0] || null;
        },
        find: async (filter: any, options?: any) => {
            const users = await getUsers(filter);
            return {
                toArray: async () => users,
                sort: () => ({ toArray: async () => users })
            };
        },
        insertOne: async (doc: any) => {
            const result = await createUser(doc);
            return { insertedId: result.id };
        },
        updateOne: async (filter: any, update: any) => {
            const id = filter._id || filter.id;
            const updates = update.$set || update;
            const result = await updateUser(id, updates);
            return { modifiedCount: result ? 1 : 0 };
        },
        deleteOne: async (filter: any) => {
            // Implementation needed
            return { deletedCount: 0 };
        }
    };
};

export const getArticlesCollection = () => {
    return {
        findOne: async (filter: any, options?: any) => {
            const articles = await getArticles(filter);
            return articles[0] || null;
        },
        find: async (filter: any, options?: any) => {
            const articles = await getArticles(filter);
            return {
                toArray: async () => articles,
                sort: () => ({ toArray: async () => articles })
            };
        },
        insertOne: async (doc: any) => {
            const result = await createArticle(doc);
            return { insertedId: result.id };
        },
        updateOne: async (filter: any, update: any) => {
            const id = filter._id || filter.id;
            const updates = update.$set || update;
            const result = await updateArticle(id, updates);
            return { modifiedCount: result ? 1 : 0 };
        }
    };
};

export const getCommentsCollection = () => {
    return {
        findOne: async (filter: any, options?: any) => {
            const comments = await getComments(filter);
            return comments[0] || null;
        },
        find: async (filter: any, options?: any) => {
            const comments = await getComments(filter);
            return {
                toArray: async () => comments,
                sort: () => ({ toArray: async () => comments })
            };
        },
        insertOne: async (doc: any) => {
            const result = await createComment(doc);
            return { insertedId: result.id };
        },
        updateOne: async (filter: any, update: any) => {
            const id = filter._id || filter.id;
            const updates = update.$set || update;
            const result = await updateComment(id, updates);
            return { modifiedCount: result ? 1 : 0 };
        }
    };
};

export const getNotificationsCollection = () => {
    return {
        findOne: async (filter: any, options?: any) => {
            const notifications = await getNotifications(filter.userId || filter.user_id);
            return notifications[0] || null;
        },
        find: async (filter: any, options?: any) => {
            const notifications = await getNotifications(filter.userId || filter.user_id);
            return {
                toArray: async () => notifications,
                sort: () => ({ toArray: async () => notifications })
            };
        },
        insertOne: async (doc: any) => {
            const result = await createNotification(doc);
            return { insertedId: result.id };
        },
        updateOne: async (filter: any, update: any) => {
            const id = filter._id || filter.id;
            const updates = update.$set || update;
            const result = await updateNotification(id, updates);
            return { modifiedCount: result ? 1 : 0 };
        },
        updateMany: async (filter: any, update: any) => {
            // Implementation needed
            return { modifiedCount: 0 };
        }
    };
};

// Users
export const getUsers = async (filters: any = {}) => {
    let sql = 'SELECT * FROM users';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.id) {
        if (typeof filters.id === 'object' && filters.id !== null && filters.id.$in) {
            if (Array.isArray(filters.id.$in) && filters.id.$in.length > 0) {
                const startIndex = params.length + 1;
                const inPlaceholders = filters.id.$in
                    .map((_: any, i: number) => '$' + (startIndex + i))
                    .join(', ');
                conditions.push(`id IN (${inPlaceholders})`);
                params.push(...filters.id.$in);
            }
        } else {
            conditions.push('id = $' + (params.length + 1));
            params.push(filters.id);
        }
    }
    if (filters.email) {
        conditions.push('email = $' + (params.length + 1));
        params.push(filters.email);
    }
    if (filters.username) {
        conditions.push('username = $' + (params.length + 1));
        params.push(filters.username);
    }
    if (filters.nickname) {
        conditions.push('username = $' + (params.length + 1));
        params.push(filters.nickname);
    }
    if (filters.status && filters.status !== 'all') {
        if (typeof filters.status === 'object' && filters.status !== null) {
            if (filters.status.$ne !== undefined) {
                conditions.push('status <> $' + (params.length + 1));
                params.push(filters.status.$ne);
            } else if (Array.isArray(filters.status.$in) && filters.status.$in.length > 0) {
                const startIndex = params.length + 1;
                const inPlaceholders = filters.status.$in
                    .map((_: any, i: number) => '$' + (startIndex + i))
                    .join(', ');
                conditions.push(`status IN (${inPlaceholders})`);
                params.push(...filters.status.$in);
            }
        } else {
            conditions.push('status = $' + (params.length + 1));
            params.push(filters.status);
        }
    }
    
    if (filters.role) {
        conditions.push('role = $' + (params.length + 1));
        params.push(filters.role);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result.rows;
};

export const getUserByIdentifier = async (identifier: string) => {
    const sql = 'SELECT * FROM users WHERE username = $1 OR email = $1';
    const result = await query(sql, [identifier]);
    return result.rows[0] || null;
};

// Optimized user search across multiple fields with ILIKE pattern matching
export const searchUsers = async (searchQuery: string, limit: number = 20) => {
    const sql = `
        SELECT id, username, name, surname, email, phone_number, location, avatar_url
        FROM users
        WHERE (
            username ILIKE $1 OR
            name ILIKE $1 OR
            surname ILIKE $1 OR
            email ILIKE $1 OR
            phone_number ILIKE $1 OR
            location ILIKE $1 OR
            matrix_username ILIKE $1
        )
        AND (status IS NULL OR status != 'banned')
        ORDER BY 
            CASE 
                WHEN username ILIKE $2 THEN 1
                WHEN name ILIKE $2 THEN 2
                WHEN surname ILIKE $2 THEN 3
                ELSE 4
            END,
            username
        LIMIT $3
    `;
    const pattern = `%${searchQuery}%`;
    const exactPattern = `${searchQuery}%`;
    const result = await query(sql, [pattern, exactPattern, limit.toString()]);
    return result.rows;
};

export const createUser = async (userData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO users (id, username, email, password_hash, name, surname, mnemonic_hash, preferences, phone_number, location, matrix_username)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        userData.username,
        userData.email || null,
        userData.password_hash,
        userData.name || null,
        userData.surname || null,
        userData.mnemonic_hash || null,
        JSON.stringify(userData.preferences || {}),
        userData.phone_number || null,
        userData.location || null,
        userData.matrix_username || null
    ]);
    return result.rows[0];
};

export const updateUser = async (id: string, updates: any) => {
    if (!id) throw new Error('User ID is required for update');
    
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== '_id');
    if (fields.length === 0) return null;

    const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = fields.map(key => {
        if (key === 'preferences' || key === 'moderation_action') return JSON.stringify(updates[key]);
        if (key === 'mnemonic_hash') return updates[key];
        return updates[key];
    });
    
    try {
        const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
        const result = await query(sql, [id, ...values]);
        return result.rows[0];
    } catch (error) {
        console.error('Error in updateUser query:', error);
        throw error;
    }
};

export const updateUserAuthFields = async (id: string, authUpdates: any) => {
    const fields = Object.keys(authUpdates);
    const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(authUpdates);
    
    const sql = `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id, ...values]);
    return result.rows[0];
};

// Articles
export const getArticles = async (filters: any = {}) => {
    let sql = `
        SELECT a.*, 
               u.username as author_name, 
               u.avatar_url as author_avatar,
               u.name as author_full_name,
               u.surname as author_surname,
               u.nickname as author_nickname,
               u.role as author_role,
               COALESCE(a.collaborators, '{}') as collaborator_ids
        FROM articles a
        JOIN users u ON a.author_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.id) {
        if (typeof filters.id === 'object' && filters.id !== null && filters.id.$in) {
            if (Array.isArray(filters.id.$in) && filters.id.$in.length > 0) {
                const startIndex = params.length + 1;
                const inPlaceholders = filters.id.$in
                    .map((_: any, i: number) => '$' + (startIndex + i))
                    .join(', ');
                conditions.push(`a.id IN (${inPlaceholders})`);
                params.push(...filters.id.$in);
            }
        } else {
            conditions.push('a.id = $' + (params.length + 1));
            params.push(filters.id);
        }
    }
    if (filters.author_id) {
        conditions.push('a.author_id = $' + (params.length + 1));
        params.push(filters.author_id);
    }
    if (filters.collaborator_id) {
        conditions.push('$' + (params.length + 1) + ' = ANY(a.collaborators)');
        params.push(filters.collaborator_id);
    }
    if (filters.is_hidden !== undefined) {
        conditions.push('a.is_hidden = $' + (params.length + 1));
        params.push(filters.is_hidden);
    }
    
    // Handle OR conditions for user permissions
    if (filters.$or && Array.isArray(filters.$or)) {
        const orConditions: string[] = [];
        filters.$or.forEach((orFilter: any, index: number) => {
            if (orFilter.status === 'published') {
                orConditions.push('a.status = $' + (params.length + 1));
                params.push('published');
            } else if (orFilter.author_id) {
                orConditions.push('a.author_id = $' + (params.length + 1));
                params.push(orFilter.author_id);
            }
        });
        if (orConditions.length > 0) {
            conditions.push(`(${orConditions.join(' OR ')})`);
        }
    }
    if (filters.status) {
        if (Array.isArray(filters.status)) {
            const placeholders = filters.status.map((_: any, i: number) => '$' + (params.length + 1 + i)).join(', ');
            conditions.push(`a.status IN (${placeholders})`);
            params.push(...filters.status);
        } else if (typeof filters.status === 'object' && filters.status.$in) {
            const placeholders = filters.status.$in.map((_: any, i: number) => '$' + (params.length + 1 + i)).join(', ');
            conditions.push(`a.status IN (${placeholders})`);
            params.push(...filters.status.$in);
        } else if (typeof filters.status === 'object' && filters.status.$ne) {
            conditions.push('a.status <> $' + (params.length + 1));
            params.push(filters.status.$ne);
        } else {
            conditions.push('a.status = $' + (params.length + 1));
            params.push(filters.status);
        }
    }
    if (filters.category) {
        conditions.push('a.category = $' + (params.length + 1));
        params.push(filters.category);
    }
    if (filters.subcategory) {
        conditions.push('a.subcategory = $' + (params.length + 1));
        params.push(filters.subcategory);
    }
    // Soft delete: by default exclude deleted articles
    if (filters.deleted_at === undefined || filters.deleted_at === false) {
        conditions.push('a.deleted_at IS NULL');
    } else if (filters.deleted_at === true) {
        conditions.push('a.deleted_at IS NOT NULL');
    }
    // Slug search in translations JSONB
    if (filters.slug && filters.language) {
        conditions.push(`a.translations->'${filters.language}'->>'slug' = $${params.length + 1}`);
        params.push(filters.slug);
    }
    // Search in title/content - prioritize selected language but include all languages
    if (filters.search) {
        const searchParam = `%${filters.search}%`;
        const searchLang = filters.search_language;
        
        if (searchLang) {
            // If search_language is provided, prioritize that language in search
            // but still include matches from other languages
            conditions.push(`(
                a.translations->'${searchLang}'->>'title' ILIKE $${params.length + 1}
                OR a.translations->'${searchLang}'->>'content' ILIKE $${params.length + 1}
                OR a.translations::text ILIKE $${params.length + 1}
                OR a.category ILIKE $${params.length + 1}
                OR a.subcategory ILIKE $${params.length + 1}
            )`);
            params.push(searchParam);
        } else {
            // No specific language - search all translations equally
            conditions.push(`(
                a.translations::text ILIKE $${params.length + 1}
                OR a.category ILIKE $${params.length + 1}
                OR a.subcategory ILIKE $${params.length + 1}
            )`);
            params.push(searchParam);
        }
    }
    // Tags filter
    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
        conditions.push(`a.tags && $${params.length + 1}`);
        params.push(filters.tags);
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sorting - design category always at bottom
    if (filters.sort_by === 'published_at') {
        sql += ` ORDER BY 
            CASE 
                WHEN a.category = 'design' THEN 2
                ELSE 1
            END,
            a.published_at DESC`;
    } else if (filters.sort_by === 'views') {
        // Hybrid sorting: same month = by likes/views, different months = by date
        sql += ` ORDER BY 
            CASE 
                WHEN a.category = 'design' THEN 2
                ELSE 1
            END,
            DATE_TRUNC('month', a.published_at) DESC,
            a.likes_count DESC,
            a.views DESC,
            a.published_at DESC`;
    } else {
        sql += ` ORDER BY 
            CASE 
                WHEN a.category = 'design' THEN 2
                ELSE 1
            END,
            a.created_at DESC`;
    }
    
    if (filters.limit) {
        sql += ' LIMIT $' + (params.length + 1);
        params.push(filters.limit);
    }
    
    if (filters.offset) {
        sql += ' OFFSET $' + (params.length + 1);
        params.push(filters.offset);
    }
    
    const result = await query(sql, params);
    return result.rows.map((row: any) => ({
        ...row,
        // Map PostgreSQL column names to match MongoDB-style for compatibility
        authorId: row.author_id,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        defaultLanguage: row.default_language,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        isHidden: row.is_hidden,
        hiddenBy: row.hidden_by,
        hiddenAt: row.hidden_at,
        hiddenReason: row.hidden_reason,
        pendingReview: row.pending_review,
        author_name: row.author_name,
        author_avatar: row.author_avatar,
        author_nickname: row.author_nickname,
        author_role: row.author_role
    }));
};

// Get article by slug - can search in specific language or across all languages
export const getArticleBySlug = async (slug: string, language?: string, options: { includeHidden?: boolean; includeDeleted?: boolean } = {}) => {
    const params: any[] = [slug];
    const conditions: string[] = [];
    
    if (!options.includeDeleted) {
        conditions.push('a.deleted_at IS NULL');
    }
    if (!options.includeHidden) {
        conditions.push('a.is_hidden = FALSE');
    }
    
    const whereClause = conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '';

    const sql = `
        SELECT a.*, 
               t.matched_lang,
               u.username as author_name, 
               u.avatar_url as author_avatar,
               u.name as author_full_name,
               u.surname as author_surname,
               u.nickname as author_nickname,
               u.role as author_role
        FROM articles a
        JOIN users u ON a.author_id = u.id
        CROSS JOIN LATERAL (
            SELECT key AS matched_lang 
            FROM jsonb_each(a.translations) 
            WHERE value->>'slug' = $1
            ${language ? `AND key = $2` : ''}
            LIMIT 1
        ) t
        WHERE 1=1 ${whereClause}
        LIMIT 1
    `;
    
    if (language) params.push(language);
    
    const result = await query(sql, params);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
        ...row,
        authorId: row.author_id,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        defaultLanguage: row.default_language,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        isHidden: row.is_hidden,
        matchedLang: row.matched_lang
    };
};

// Get article by ID
export const getArticleById = async (id: string) => {
    const sql = `
        SELECT a.*, 
               u.username as author_name, 
               u.avatar_url as author_avatar,
               u.name as author_full_name,
               u.surname as author_surname,
               u.nickname as author_nickname
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.id = $1
        LIMIT 1
    `;
    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
        ...row,
        authorId: row.author_id,
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        defaultLanguage: row.default_language,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        isHidden: row.is_hidden,
        // Explicitly include stats fields for article updates
        views: row.views,
        likes_count: row.likes_count,
        comments_count: row.comments_count
    };
};

export const createArticle = async (articleData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO articles (
            id, author_id, translations, category, subcategory, tags, thumbnail,
            status, default_language, views, likes_count, comments_count,
            is_hidden, pending_review, metadata, collaborators, created_at, updated_at, published_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), $17)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        articleData.author_id || articleData.authorId,
        JSON.stringify(articleData.translations || {}),
        articleData.category || null,
        articleData.subcategory || null,
        articleData.tags || [],
        articleData.thumbnail || null,
        articleData.status || 'draft',
        articleData.defaultLanguage || articleData.default_language || 'tr',
        articleData.views || articleData.stats?.views || 0,
        articleData.likes_count || articleData.stats?.likes || 0,
        articleData.comments_count || articleData.stats?.comments || 0,
        articleData.is_hidden || articleData.hidden || false,
        JSON.stringify(articleData.pendingReview || articleData.pending_review || null),
        JSON.stringify(articleData.metadata || {}),
        articleData.collaborators || [],
        articleData.published_at || articleData.publishedAt || null
    ]);
    return { id, ...result.rows[0] };
};

export const updateArticle = async (id: string, updates: any) => {
    // Build dynamic update for new schema
    const fieldMappings: Record<string, string> = {
        translations: 'translations',
        category: 'category',
        subcategory: 'subcategory',
        tags: 'tags',
        thumbnail: 'thumbnail',
        status: 'status',
        defaultLanguage: 'default_language',
        default_language: 'default_language',
        views: 'views',
        likes_count: 'likes_count',
        comments_count: 'comments_count',
        is_hidden: 'is_hidden',
        hidden: 'is_hidden',
        hidden_by: 'hidden_by',
        hidden_at: 'hidden_at',
        hidden_reason: 'hidden_reason',
        deleted_at: 'deleted_at',
        pendingReview: 'pending_review',
        pending_review: 'pending_review',
        metadata: 'metadata',
        collaborators: 'collaborators',
        published_at: 'published_at',
        publishedAt: 'published_at'
    };
    
    const fields: string[] = [];
    const values: any[] = [];
    
    for (const [key, value] of Object.entries(updates)) {
        if (key === 'id' || key === '_id') continue;
        
        const dbField = fieldMappings[key] || key;
        fields.push(dbField);
        
        if (key === 'translations' || key === 'metadata' || key === 'pendingReview' || key === 'pending_review') {
            values.push(JSON.stringify(value));
        } else if (key === 'tags') {
            values.push(value);
        } else {
            values.push(value);
        }
    }
    
    if (fields.length === 0) return null;
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const sql = `UPDATE articles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id, ...values]);
    return result.rows[0];
};

export const softDeleteArticle = async (id: string) => {
    const sql = `UPDATE articles SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id]);
    return result.rowCount > 0;
};

export const incrementArticleViews = async (id: string) => {
    const sql = `UPDATE articles SET views = views + 1 WHERE id = $1`;
    await query(sql, [id]);
};

// Drafts
export const getDraftsCollection = () => {
    return {
        findOne: async (filter: any) => {
            const drafts = await getDrafts(filter);
            return drafts[0] || null;
        },
        updateOne: async (filter: any, update: any, options?: any) => {
            const authorId = filter.authorId || filter.author_id;
            const articleId = filter.articleId || filter.article_id;
            const updates = update.$set || update;
            
            if (options?.upsert) {
                return await upsertDraft(articleId, authorId, updates);
            }
            return await updateDraft(articleId, authorId, updates);
        },
        deleteOne: async (filter: any) => {
            const articleId = filter.articleId || filter.article_id;
            return await deleteDraft(articleId);
        }
    };
};

export const getDrafts = async (filters: any = {}) => {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.authorId || filters.author_id) {
        conditions.push('author_id = $' + (params.length + 1));
        params.push(filters.authorId || filters.author_id);
    }
    if (filters.articleId || filters.article_id) {
        conditions.push('article_id = $' + (params.length + 1));
        params.push(filters.articleId || filters.article_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM drafts ${whereClause} ORDER BY last_saved DESC`;
    const result = await query(sql, params);
    return result.rows;
};

export const getDraft = async (articleId: string, authorId?: string) => {
    let sql = 'SELECT * FROM drafts WHERE article_id = $1';
    const params: any[] = [articleId];
    
    if (authorId) {
        sql += ' AND author_id = $2';
        params.push(authorId);
    }
    
    const result = await query(sql, params);
    return result.rows[0] || null;
};

export const createDraft = async (draftData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO drafts (id, article_id, author_id, data, last_saved, has_unpublished_changes)
        VALUES ($1, $2, $3, $4, NOW(), $5)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        draftData.article_id || draftData.articleId || null,
        draftData.author_id || draftData.authorId,
        JSON.stringify(draftData.data || {}),
        draftData.has_unpublished_changes ?? true
    ]);
    return result.rows[0];
};

export const updateDraft = async (articleId: string | null, authorId: string, updates: any) => {
    const sql = `
        UPDATE drafts 
        SET data = $3, last_saved = NOW(), has_unpublished_changes = $4, updated_at = NOW()
        WHERE article_id = $1 AND author_id = $2
        RETURNING *
    `;
    const result = await query(sql, [
        articleId,
        authorId,
        JSON.stringify(updates.data || {}),
        updates.has_unpublished_changes ?? true
    ]);
    return result.rows[0] || null;
};

export const upsertDraft = async (articleId: string | null, authorId: string, updates: any) => {
    const sql = `
        INSERT INTO drafts (id, article_id, author_id, data, last_saved, has_unpublished_changes)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4)
        ON CONFLICT (article_id, author_id) 
        DO UPDATE SET 
            data = $3, 
            last_saved = NOW(), 
            has_unpublished_changes = $4,
            updated_at = NOW()
        RETURNING *
    `;
    const result = await query(sql, [
        articleId,
        authorId,
        JSON.stringify(updates.data || {}),
        updates.has_unpublished_changes ?? true
    ]);
    return { modifiedCount: result.rows.length > 0 ? 1 : 0 };
};

export const deleteDraft = async (articleId: string) => {
    const sql = 'DELETE FROM drafts WHERE article_id = $1';
    const result = await query(sql, [articleId]);
    return result.rowCount > 0;
};

export const countDraftsByUser = async (authorId: string, since: Date) => {
    const sql = `
        SELECT COUNT(*) as count FROM drafts 
        WHERE author_id = $1 
        AND last_saved >= $2
    `;
    const result = await query(sql, [authorId, since]);
    return parseInt(result.rows[0].count);
};

// Versions
export const getVersionsCollection = () => {
    return {
        find: async (filter: any) => {
            const versions = await getVersions(filter);
            return {
                toArray: async () => versions,
                sort: () => ({ toArray: async () => versions })
            };
        },
        insertOne: async (doc: any) => {
            const result = await createVersion(doc);
            return { insertedId: result.id };
        },
        countDocuments: async (filter: any) => {
            return await countVersions(filter.articleId);
        }
    };
};

export const getVersions = async (filters: any = {}) => {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.articleId || filters.article_id) {
        conditions.push('article_id = $' + (params.length + 1));
        params.push(filters.articleId || filters.article_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM versions ${whereClause} ORDER BY created_at DESC`;
    const result = await query(sql, params);
    return result.rows;
};

export const getVersion = async (id: string) => {
    const sql = 'SELECT * FROM versions WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
};

export const createVersion = async (versionData: any) => {
    const id = uuidv4();
    
    // Get next version number
    const countResult = await query(
        'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM versions WHERE article_id = $1',
        [versionData.article_id || versionData.articleId]
    );
    const versionNumber = countResult.rows[0].next_version;
    
    const sql = `
        INSERT INTO versions (id, article_id, version_number, data, created_by, change_note)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        versionData.article_id || versionData.articleId,
        versionNumber,
        JSON.stringify(versionData.data || {}),
        versionData.created_by || versionData.authorId || versionData.author_id,
        versionData.change_note || versionData.changeNote || null
    ]);
    return result.rows[0];
};

export const countVersions = async (articleId: string) => {
    const sql = 'SELECT COUNT(*) as count FROM versions WHERE article_id = $1';
    const result = await query(sql, [articleId]);
    return parseInt(result.rows[0].count);
};

// Comments
export const getComments = async (filters: any = {}) => {
    let sql = `
        SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
        FROM comments c
        JOIN users u ON c.author_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.id) {
        if (typeof filters.id === 'object' && filters.id !== null && filters.id.$in) {
            if (Array.isArray(filters.id.$in) && filters.id.$in.length > 0) {
                const startIndex = params.length + 1;
                const inPlaceholders = filters.id.$in
                    .map((_: any, i: number) => '$' + (startIndex + i))
                    .join(', ');
                conditions.push(`c.id IN (${inPlaceholders})`);
                params.push(...filters.id.$in);
            }
        } else {
            conditions.push('c.id = $' + (params.length + 1));
            params.push(filters.id);
        }
    }
    if (filters.article_id) {
        conditions.push('c.article_id = $' + (params.length + 1));
        params.push(filters.article_id);
    }
    if (filters.parent_id !== undefined) {
        if (filters.parent_id === null) {
            conditions.push('c.parent_id IS NULL');
        } else {
            conditions.push('c.parent_id = $' + (params.length + 1));
            params.push(filters.parent_id);
        }
    }
    
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY c.created_at ASC';
    
    const result = await query(sql, params);
    return result.rows;
};

export const createComment = async (commentData: any) => {
    // Use client-provided ID if available (for pre-submission file uploads), otherwise generate new UUID
    const id = commentData.id || uuidv4();
    const content = typeof commentData.content === 'object' 
        ? JSON.stringify(commentData.content) 
        : commentData.content;
    
    const sql = `
        INSERT INTO comments (id, article_id, author_id, content, parent_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        commentData.article_id,
        commentData.author_id,
        content,
        commentData.parent_id || null
    ]);
    return result.rows[0];
};

export const updateComment = async (id: string, updates: any) => {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map((key, index) => {
        if (key === 'metadata') return `${key} = $${index + 2}::jsonb`;
        return `${key} = $${index + 2}`;
    }).join(', ');
    
    const values = fields.map(key => {
        if (key === 'metadata') return JSON.stringify(updates[key]);
        return updates[key];
    });
    
    const sql = `UPDATE comments SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id, ...values]);
    return result.rows[0];
};

export const deleteComment = async (id: string) => {
    const sql = 'DELETE FROM comments WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rowCount > 0;
};

// Article Reactions (Likes/Dislikes)
export const toggleArticleReaction = async (userId: string, articleId: string, reactionType: 'like' | 'dislike' | null) => {
    // Check for existing reaction
    const checkSql = 'SELECT id, reaction_type FROM likes WHERE user_id = $1 AND article_id = $2';
    const checkResult = await query(checkSql, [userId, articleId]);
    
    if (checkResult.rows.length > 0) {
        const existing = checkResult.rows[0];
        
        // If no new reaction (null), remove existing
        if (!reactionType) {
            const deleteSql = 'DELETE FROM likes WHERE id = $1';
            await query(deleteSql, [existing.id]);
            return { reaction: null, previous: existing.reaction_type };
        }
        
        // If same reaction, toggle off
        if (existing.reaction_type === reactionType) {
            const deleteSql = 'DELETE FROM likes WHERE id = $1';
            await query(deleteSql, [existing.id]);
            return { reaction: null, previous: reactionType };
        }
        
        // Update to new reaction type
        const updateSql = 'UPDATE likes SET reaction_type = $1 WHERE id = $2';
        await query(updateSql, [reactionType, existing.id]);
        return { reaction: reactionType, previous: existing.reaction_type };
    }
    
    // No existing reaction - add new one if specified
    if (reactionType) {
        const id = uuidv4();
        const insertSql = 'INSERT INTO likes (id, user_id, article_id, reaction_type) VALUES ($1, $2, $3, $4)';
        await query(insertSql, [id, userId, articleId, reactionType]);
        return { reaction: reactionType, previous: null };
    }
    
    return { reaction: null, previous: null };
};

export const getArticleReaction = async (userId: string, articleId: string) => {
    const sql = 'SELECT reaction_type FROM likes WHERE user_id = $1 AND article_id = $2';
    const result = await query(sql, [userId, articleId]);
    return result.rows.length > 0 ? result.rows[0].reaction_type : null;
};

export const getArticleReactionCounts = async (articleId: string) => {
    const sql = `
        SELECT 
            COUNT(*) FILTER (WHERE reaction_type = 'like') as likes,
            COUNT(*) FILTER (WHERE reaction_type = 'dislike') as dislikes
        FROM likes WHERE article_id = $1
    `;
    const result = await query(sql, [articleId]);
    return {
        likes: parseInt(result.rows[0]?.likes || '0'),
        dislikes: parseInt(result.rows[0]?.dislikes || '0')
    };
};

// Legacy toggleLike for backwards compatibility
export const toggleLike = async (userId: string, articleId: string) => {
    const result = await toggleArticleReaction(userId, articleId, 'like');
    return { liked: result.reaction === 'like' };
};

// Saves
export const getSavesCollection = () => {
    return {
        findOne: async (filter: any) => {
            const checkSql = 'SELECT * FROM saves WHERE user_id = $1 AND article_id = $2';
            const checkResult = await query(checkSql, [filter.userId, filter.articleId]);
            return checkResult.rows[0] || null;
        },
        insertOne: async (doc: any) => {
            const id = uuidv4();
            const insertSql = 'INSERT INTO saves (id, user_id, article_id, created_at) VALUES ($1, $2, $3, NOW())';
            await query(insertSql, [id, doc.userId, doc.articleId]);
            return { insertedId: id };
        },
        deleteOne: async (filter: any) => {
            const deleteSql = 'DELETE FROM saves WHERE user_id = $1 AND article_id = $2';
            const result = await query(deleteSql, [filter.userId, filter.articleId]);
            return { deletedCount: result.rowCount };
        }
    };
};

export const toggleSave = async (userId: string, articleId: string) => {
    const checkSql = 'SELECT id FROM saves WHERE user_id = $1 AND article_id = $2';
    const checkResult = await query(checkSql, [userId, articleId]);
    
    if (checkResult.rows.length > 0) {
        // Remove save
        const deleteSql = 'DELETE FROM saves WHERE user_id = $1 AND article_id = $2';
        await query(deleteSql, [userId, articleId]);
        return { saved: false };
    } else {
        // Add save
        const id = uuidv4();
        const insertSql = 'INSERT INTO saves (id, user_id, article_id) VALUES ($1, $2, $3)';
        await query(insertSql, [id, userId, articleId]);
        return { saved: true };
    }
};

// Notifications
export const createNotification = async (notificationData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO notifications (id, user_id, type, title, content, data, is_read)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        notificationData.user_id,
        notificationData.type,
        JSON.stringify(notificationData.title),
        JSON.stringify(notificationData.content),
        JSON.stringify(notificationData.data || {}),
        notificationData.is_read || false
    ]);
    return result.rows[0];
};

export const getNotifications = async (userId: string, options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) => {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;
    const offset = (page - 1) * pageSize;
    
    let sql = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (unreadOnly) {
        sql += ' AND is_read = false';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize.toString(), offset.toString());
    
    const result = await query(sql, params);
    return result.rows;
};

export const getNotificationsCount = async (userId: string, unreadOnly: boolean = false) => {
    let sql = 'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (unreadOnly) {
        sql += ' AND is_read = false';
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
};

export const getUnreadNotificationsCount = async (userId: string) => {
    return getNotificationsCount(userId, true);
};

export const markNotificationRead = async (userId: string, notificationId: string) => {
    const sql = 'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2';
    const result = await query(sql, [notificationId, userId]);
    return result.rowCount > 0;
};

export const markMultipleNotificationsRead = async (userId: string, notificationIds: string[]) => {
    if (notificationIds.length === 0) return 0;
    
    const placeholders = notificationIds.map((_, index) => '$' + (index + 3)).join(', ');
    const sql = `UPDATE notifications SET is_read = true WHERE id IN (${placeholders}) AND user_id = $1`;
    const result = await query(sql, [userId, ...notificationIds]);
    return result.rowCount;
};

export const markAllNotificationsRead = async (userId: string) => {
    const sql = 'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false';
    const result = await query(sql, [userId]);
    return result.rowCount;
};

export const deleteNotification = async (userId: string, notificationId: string) => {
    const sql = 'DELETE FROM notifications WHERE id = $1 AND user_id = $2';
    const result = await query(sql, [notificationId, userId]);
    return result.rowCount > 0;
};

export const deleteNotificationsByActor = async (userId: string, actorId: string) => {
    const sql = `DELETE FROM notifications WHERE user_id = $1 AND data->>'actor'->>'id' = $2`;
    const result = await query(sql, [userId, actorId]);
    return result.rowCount;
};

export const deleteNotificationsByTranslationStatusId = async (translationStatusId: string) => {
    const sql = `DELETE FROM notifications WHERE data->'meta'->>'translationStatusId' = $1`;
    const result = await query(sql, [translationStatusId]);
    return result.rowCount;
};

export const findExistingNotification = async (userId: string, type: string, meta: any, createdAt: Date) => {
    let sql = 'SELECT * FROM notifications WHERE user_id = $1 AND type = $2 AND created_at >= $3';
    const params = [userId, type, createdAt];
    
    if (meta.articleId) {
        sql += ' AND data->>\'articleId\' = $' + (params.length + 1);
        params.push(meta.articleId);
    }
    if (meta.commentId) {
        sql += ' AND data->>\'commentId\' = $' + (params.length + 1);
        params.push(meta.commentId);
    }
    if (meta.actorId) {
        sql += ' AND data->>\'actorId\' = $' + (params.length + 1);
        params.push(meta.actorId);
    }
    
    const result = await query(sql, params);
    return result.rows[0] || null;
};

export const updateNotification = async (notificationId: string, updates: any) => {
    const fields = Object.keys(updates).filter(key => key !== 'id');
    const setClause = fields.map((key, index) => {
        if (key === 'title' || key === 'content' || key === 'data') {
            return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
    }).join(', ');
    
    const values = fields.map(key => {
        if (key === 'title' || key === 'content' || key === 'data') {
            return JSON.stringify(updates[key]);
        }
        return updates[key];
    });
    
    const sql = `UPDATE notifications SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [notificationId, ...values]);
    return result.rows[0];
};

export const upsertNotification = async (userId: string, type: string, meta: any, updates: any) => {
    // First try to find existing notification
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existing = await findExistingNotification(userId, type, meta, today);
    
    if (existing) {
        return await updateNotification(existing.id, updates);
    } else {
        return await createNotification({
            user_id: userId,
            type,
            ...updates
        });
    }
};

// Blocked users
export const getBlockedUsers = async (userId: string) => {
    const sql = 'SELECT * FROM blocked_users WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return result.rows[0] || null;
};

export const blockUser = async (userId: string, actorId: string) => {
    const sql = `
        INSERT INTO blocked_users (user_id, blocked_actor_ids)
        VALUES ($1, ARRAY[$2])
        ON CONFLICT (user_id) 
        DO UPDATE SET blocked_actor_ids = array_append(blocked_users.blocked_actor_ids, $2), updated_at = NOW()
        RETURNING *
    `;
    const result = await query(sql, [userId, actorId]);
    return result.rows[0];
};

export const unblockUser = async (userId: string, actorId: string) => {
    const sql = `
        UPDATE blocked_users 
        SET blocked_actor_ids = array_remove(blocked_actor_ids, $2), updated_at = NOW()
        WHERE user_id = $1
        RETURNING *
    `;
    const result = await query(sql, [userId, actorId]);
    return result.rows[0];
};

export const isUserBlocked = async (userId: string, actorId: string) => {
    const sql = 'SELECT 1 FROM blocked_users WHERE user_id = $1 AND $2 = ANY(blocked_actor_ids)';
    const result = await query(sql, [userId, actorId]);
    return result.rows.length > 0;
};

// Follow relationships
export const followUser = async (followerId: string, followingId: string) => {
    const checkSql = 'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2';
    const checkResult = await query(checkSql, [followerId, followingId]);
    
    if (checkResult.rows.length > 0) {
        throw new Error('Already following');
    }
    
    const id = uuidv4();
    const sql = 'INSERT INTO follows (id, follower_id, following_id) VALUES ($1, $2, $3) RETURNING *';
    const result = await query(sql, [id, followerId, followingId]);
    return result.rows[0];
};

export const unfollowUser = async (followerId: string, followingId: string) => {
    const sql = 'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2';
    const result = await query(sql, [followerId, followingId]);
    return result.rowCount > 0;
};

export const isFollowing = async (followerId: string, followingId: string) => {
    const sql = 'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2';
    const result = await query(sql, [followerId, followingId]);
    return result.rows.length > 0;
};

export const getFollows = async (filters: { follower_id?: string; following_id?: string } = {}) => {
    const conditions: string[] = [];
    const params: any[] = [];
    
    if (filters.follower_id) {
        conditions.push('follower_id = $' + (params.length + 1));
        params.push(filters.follower_id);
    }
    if (filters.following_id) {
        conditions.push('following_id = $' + (params.length + 1));
        params.push(filters.following_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM follows ${whereClause} ORDER BY created_at DESC`;
    const result = await query(sql, params);
    return result.rows;
};

export const getFollowCounts = async (userId: string) => {
    const followersSql = 'SELECT COUNT(*) as count FROM follows WHERE following_id = $1';
    const followingSql = 'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1';
    
    const [followersResult, followingResult] = await Promise.all([
        query(followersSql, [userId]),
        query(followingSql, [userId])
    ]);
    
    return {
        followersCount: parseInt(followersResult.rows[0].count),
        followingCount: parseInt(followingResult.rows[0].count)
    };
};

// Block relationships (additional functions for user blocking)
export const blockUserRelation = async (userId: string, blockedUserId: string) => {
    const checkSql = 'SELECT id FROM user_blocks WHERE user_id = $1 AND blocked_user_id = $2';
    const checkResult = await query(checkSql, [userId, blockedUserId]);
    
    if (checkResult.rows.length > 0) {
        throw new Error('Already blocked');
    }
    
    const id = uuidv4();
    const sql = 'INSERT INTO user_blocks (id, user_id, blocked_user_id) VALUES ($1, $2, $3) RETURNING *';
    const result = await query(sql, [id, userId, blockedUserId]);
    return result.rows[0];
};

export const unblockUserRelation = async (userId: string, blockedUserId: string) => {
    const sql = 'DELETE FROM user_blocks WHERE user_id = $1 AND blocked_user_id = $2';
    const result = await query(sql, [userId, blockedUserId]);
    return result.rowCount > 0;
};

export const isUserBlockedRelation = async (userId: string, blockedUserId: string) => {
    const sql = 'SELECT id FROM user_blocks WHERE user_id = $1 AND blocked_user_id = $2';
    const result = await query(sql, [userId, blockedUserId]);
    return result.rows.length > 0;
};

// Get followers and following lists with user details
export const getFollowersList = async (userId: string, currentUserId?: string) => {
    const sql = `
        SELECT 
            u.id, u.username, u.name, u.surname, u.avatar_url, u.bio,
            f.created_at as followed_at,
            CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
                SELECT 1 FROM follows f2 
                WHERE f2.follower_id = $2::uuid AND f2.following_id = u.id
            ) THEN true ELSE false END as is_following,
            CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
                SELECT 1 FROM user_blocks ub 
                WHERE ub.user_id = $2::uuid AND ub.blocked_user_id = u.id
            ) THEN true ELSE false END as is_blocked
        FROM follows f
        JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = $1
        ORDER BY f.created_at DESC
    `;
    const result = await query(sql, [userId, currentUserId]);
    return result.rows;
};

export const getFollowingList = async (userId: string, currentUserId?: string) => {
    const sql = `
        SELECT 
            u.id, u.username, u.name, u.surname, u.avatar_url, u.bio,
            f.created_at as followed_at,
            CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
                SELECT 1 FROM follows f2 
                WHERE f2.follower_id = $2::uuid AND f2.following_id = u.id
            ) THEN true ELSE false END as is_following,
            CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
                SELECT 1 FROM user_blocks ub 
                WHERE ub.user_id = $2::uuid AND ub.blocked_user_id = u.id
            ) THEN true ELSE false END as is_blocked
        FROM follows f
        JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = $1
        ORDER BY f.created_at DESC
    `;
    const result = await query(sql, [userId, currentUserId]);
    return result.rows;
};

// Likes functions
export const getLikes = async (filters: { article_id?: string; user_id?: string } = {}) => {
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (filters.article_id) {
        conditions.push(`article_id = $${paramIndex++}`);
        values.push(filters.article_id);
    }
    if (filters.user_id) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(filters.user_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM likes ${whereClause} ORDER BY created_at DESC`;
    const result = await query(sql, values);
    return result.rows;
};

export const createLike = async (data: { article_id: string; user_id: string }) => {
    const id = uuidv4();
    const sql = 'INSERT INTO likes (id, article_id, user_id) VALUES ($1, $2, $3) RETURNING *';
    const result = await query(sql, [id, data.article_id, data.user_id]);
    return result.rows[0];
};

export const deleteLike = async (filters: { article_id: string; user_id: string }) => {
    const sql = 'DELETE FROM likes WHERE article_id = $1 AND user_id = $2';
    const result = await query(sql, [filters.article_id, filters.user_id]);
    return result.rowCount > 0;
};

// Reports
export const getReports = async (filters: any = {}) => {
    let sql = `
        SELECT r.*, 
               u.username as reporter_username, u.name as reporter_name, u.surname as reporter_surname, u.nickname as reporter_nickname,
               rev.username as reviewer_username, rev.name as reviewer_name, rev.surname as reviewer_surname, rev.nickname as reviewer_nickname
        FROM reports r
        LEFT JOIN users u ON r.reporter_id = u.id
        LEFT JOIN users rev ON r.reviewed_by = rev.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.id) {
        conditions.push('r.id = $' + (params.length + 1));
        params.push(filters.id);
    }
    if (filters.type) {
        conditions.push('r.type = $' + (params.length + 1));
        params.push(filters.type);
    }
    if (filters.status) {
        conditions.push('r.status = $' + (params.length + 1));
        params.push(filters.status);
    }
    if (filters.reporter_id) {
        conditions.push('r.reporter_id = $' + (params.length + 1));
        params.push(filters.reporter_id);
    }
    if (filters.target_id) {
        conditions.push('r.target_id = $' + (params.length + 1));
        params.push(filters.target_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    sql += ` ${whereClause} ORDER BY r.created_at DESC`;
    
    if (filters.limit) {
        sql += ` LIMIT $${params.length + 1}`;
        params.push(filters.limit);
        if (filters.offset) {
            sql += ` OFFSET $${params.length + 1}`;
            params.push(filters.offset);
        }
    }
    
    const result = await query(sql, params);
    return result.rows;
};

export const createReport = async (reportData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO reports (id, type, target_id, article_id, comment_id, profile_id, reporter_id, reason, details, url, target_data, reporter_data, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        reportData.type,
        reportData.target_id,
        reportData.article_id || null,
        reportData.comment_id || null,
        reportData.profile_id || null,
        reportData.reporter_id || null,
        reportData.reason,
        reportData.details || null,
        reportData.url || null,
        JSON.stringify(reportData.target_data || {}),
        JSON.stringify(reportData.reporter_data || {}),
        reportData.status || 'pending'
    ]);
    return result.rows[0];
};

export const updateReport = async (id: string, updates: any) => {
    const fields = Object.keys(updates).filter(key => !['id', 'created_at'].includes(key));
    const setClause = fields.map((key, index) => {
        if (['target_data', 'reporter_data', 'metadata'].includes(key)) {
            return `${key} = $${index + 2}::jsonb`;
        }
        return `${key} = $${index + 2}`;
    }).join(', ');
    
    const values = fields.map(key => {
        if (['target_data', 'reporter_data', 'metadata'].includes(key)) {
            return JSON.stringify(updates[key]);
        }
        return updates[key];
    });
    
    const sql = `UPDATE reports SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id, ...values]);
    return result.rows[0];
};

export const getReportsCount = async (filters: any = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM reports r';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.type) {
        conditions.push('r.type = $' + (params.length + 1));
        params.push(filters.type);
    }
    if (filters.status) {
        conditions.push('r.status = $' + (params.length + 1));
        params.push(filters.status);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    sql += ` ${whereClause}`;
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
};

export const checkExistingReport = async (reporterId: string, targetId: string, type: string) => {
    const sql = `
        SELECT id FROM reports 
        WHERE reporter_id = $1 AND target_id = $2 AND type = $3 
        AND status IN ('pending', 'reviewing')
        LIMIT 1
    `;
    const result = await query(sql, [reporterId, targetId, type]);
    return result.rows[0] || null;
};

export const incrementReportCount = async (type: string, targetId: string) => {
    let sql = '';
    switch (type) {
        case 'profile':
            sql = 'UPDATE users SET report_count = COALESCE(report_count, 0) + 1 WHERE id = $1';
            break;
        case 'article':
            sql = 'UPDATE articles SET report_count = COALESCE(report_count, 0) + 1 WHERE id = $1';
            break;
        case 'comment':
            sql = 'UPDATE comments SET report_count = COALESCE(report_count, 0) + 1 WHERE id = $1';
            break;
        case 'qa':
            sql = 'UPDATE questions SET report_count = COALESCE(report_count, 0) + 1 WHERE id = $1';
            break;
    }
    if (sql) {
        await query(sql, [targetId]);
    }
};

// Donations
export const getDonations = async (filters: any = {}) => {
    let sql = `
        SELECT d.*, 
               u.username, u.name as user_name, u.surname as user_surname,
               u.nickname as donor_username, u.name as donor_name, u.surname as donor_surname,
               u.avatar_url as donor_avatar
        FROM donations d
        LEFT JOIN users u ON d.user_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.id) {
        conditions.push('d.id = $' + (params.length + 1));
        params.push(filters.id);
    }
    if (filters.user_id) {
        conditions.push('d.user_id = $' + (params.length + 1));
        params.push(filters.user_id);
    }
    if (filters.status) {
        conditions.push('d.status = $' + (params.length + 1));
        params.push(filters.status);
    }
    if (filters.from_date) {
        conditions.push('d.donation_date >= $' + (params.length + 1));
        params.push(filters.from_date);
    }
    if (filters.to_date) {
        conditions.push('d.donation_date <= $' + (params.length + 1));
        params.push(filters.to_date);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    sql += ` ${whereClause} ORDER BY d.donation_date DESC`;
    
    if (filters.limit) {
        sql += ` LIMIT $${params.length + 1}`;
        params.push(filters.limit);
        if (filters.offset) {
            sql += ` OFFSET $${params.length + 1}`;
            params.push(filters.offset);
        }
    }
    
    const result = await query(sql, params);
    return result.rows;
};

export const getDonationById = async (id: string) => {
    const sql = `
        SELECT d.*, 
               u.username as donor_username, u.name as donor_name, u.surname as donor_surname
        FROM donations d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
    `;
    const result = await query(sql, [id]);
    return result.rows[0] || null;
};

export const createDonation = async (donationData: any) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO donations (id, user_id, amount, txid, donation_date, message, display_name, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `;
    const result = await query(sql, [
        id,
        donationData.user_id || null,
        donationData.amount,
        donationData.txid,
        donationData.donation_date,
        donationData.message || null,
        donationData.display_name || null,
        'pending'
    ]);
    return result.rows[0];
};

export const updateDonation = async (id: string, updates: any) => {
    const fields = Object.keys(updates).filter(key => !['id', 'created_at'].includes(key));
    const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = fields.map(key => updates[key]);
    
    const sql = `UPDATE donations SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await query(sql, [id, ...values]);
    return result.rows[0];
};

export const approveDonation = async (id: string, reviewerId: string) => {
    const sql = `
        UPDATE donations 
        SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(sql, [id, reviewerId]);
    return result.rows[0];
};

export const rejectDonation = async (id: string, reviewerId: string, reason?: string) => {
    const sql = `
        UPDATE donations 
        SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(sql, [id, reviewerId, reason || null]);
    return result.rows[0];
};

export const deleteDonation = async (id: string) => {
    const sql = 'DELETE FROM donations WHERE id = $1 RETURNING *';
    const result = await query(sql, [id]);
    return result.rows[0];
};

export const getDonationsCount = async (filters: any = {}) => {
    let sql = 'SELECT COUNT(*) as count FROM donations';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (filters.status) {
        conditions.push('status = $' + (params.length + 1));
        params.push(filters.status);
    }
    if (filters.from_date) {
        conditions.push('donation_date >= $' + (params.length + 1));
        params.push(filters.from_date);
    }
    if (filters.to_date) {
        conditions.push('donation_date <= $' + (params.length + 1));
        params.push(filters.to_date);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    sql += ` ${whereClause}`;
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
};

export const getDonationsTotal = async (filters: any = {}) => {
    let sql = 'SELECT COALESCE(SUM(amount), 0) as total FROM donations';
    const params: any[] = [];
    const conditions: string[] = ['status = $1'];
    params.push('approved');
    
    if (filters.from_date) {
        conditions.push('donation_date >= $' + (params.length + 1));
        params.push(filters.from_date);
    }
    if (filters.to_date) {
        conditions.push('donation_date <= $' + (params.length + 1));
        params.push(filters.to_date);
    }
    
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    sql += ` ${whereClause}`;
    
    const result = await query(sql, params);
    return parseFloat(result.rows[0].total);
};

export const getDonationsStats = async (groupBy: 'day' | 'month' | 'year' | 'week', filters: any = {}) => {
    let dateFormat: string;
    let interval: string;
    switch (groupBy) {
        case 'day':
            dateFormat = 'YYYY-MM-DD';
            interval = '1 day';
            break;
        case 'week':
            dateFormat = 'YYYY-"W"IW'; // Week format: 2026-W12
            interval = '1 week';
            break;
        case 'month':
            dateFormat = 'YYYY-MM';
            interval = '1 month';
            break;
        case 'year':
            dateFormat = 'YYYY';
            interval = '1 year';
            break;
    }
    
    // Get the actual donation data
    let sql = `
        SELECT 
            TO_CHAR(donation_date, '${dateFormat}') as period,
            COUNT(*) as count,
            SUM(amount) as total
        FROM donations
        WHERE status = 'approved'
    `;
    const params: any[] = [];
    
    if (filters.from_date) {
        sql += ` AND donation_date >= $${params.length + 1}`;
        params.push(filters.from_date);
    }
    if (filters.to_date) {
        sql += ` AND donation_date <= $${params.length + 1}`;
        params.push(filters.to_date);
    }
    
    sql += ` GROUP BY period ORDER BY period ASC`;
    
    const result = await query(sql, params);
    const actualData = result.rows;
    
    // If no data, return empty array
    if (actualData.length === 0) {
        return [];
    }
    
    // Generate complete time series
    const startDate = filters.from_date ? new Date(filters.from_date) : new Date(actualData[0].period);
    const endDate = filters.to_date ? new Date(filters.to_date) : new Date(actualData[actualData.length - 1].period);
    
    const completeSeries = [];
    const currentDate = new Date(startDate);
    
    // Create a map of actual data for quick lookup
    const dataMap = new Map();
    actualData.forEach((item: any) => {
        dataMap.set(item.period, { count: parseInt(item.count), total: parseFloat(item.total) || 0 });
    });
    
    // Generate all periods in the range
    while (currentDate <= endDate) {
        let period: string;
        const tempDate = new Date(currentDate);
        
        if (groupBy === 'week') {
            // For weeks, we need to get the ISO week
            const year = tempDate.getFullYear();
            const weekNumber = getISOWeek(tempDate);
            period = `${year}-W${weekNumber.toString().padStart(2, '0')}`;
            // Move to next week
            tempDate.setDate(tempDate.getDate() + 7);
        } else if (groupBy === 'month') {
            period = tempDate.toISOString().slice(0, 7); // YYYY-MM
            // Move to next month
            tempDate.setMonth(tempDate.getMonth() + 1);
        } else if (groupBy === 'year') {
            period = tempDate.getFullYear().toString();
            // Move to next year
            tempDate.setFullYear(tempDate.getFullYear() + 1);
        } else {
            period = tempDate.toISOString().slice(0, 10); // YYYY-MM-DD
            // Move to next day
            tempDate.setDate(tempDate.getDate() + 1);
        }
        
        const data = dataMap.get(period) || { count: 0, total: 0 };
        completeSeries.push({
            period,
            count: data.count,
            total: data.total.toString()
        });
        
        // Update currentDate for next iteration
        currentDate.setTime(tempDate.getTime());
    }
    
    return completeSeries;
};

// Helper function to get ISO week number
function getISOWeek(date: Date): number {
    const tempDate = new Date(date.valueOf());
    // Thursday in current week decides the year
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    // January 4 is always in week 1
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export const getTopDonors = async (limit: number = 10) => {
    const sql = `
        SELECT 
            u.username,
            u.name as user_name,
            u.surname as user_surname,
            u.nickname as donor_username,
            u.name as donor_name,
            u.surname as donor_surname,
            u.avatar_url as donor_avatar,
            CASE 
                WHEN u.name IS NOT NULL AND u.surname IS NOT NULL THEN u.name || ' ' || u.surname
                WHEN u.name IS NOT NULL THEN u.name
                ELSE COALESCE(u.username, u.nickname, 'Anonim')
            END as name,
            SUM(d.amount) as total_amount,
            COUNT(d.id) as donation_count
        FROM donations d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.status = 'approved'
        GROUP BY u.id, u.username, u.name, u.surname, u.nickname, u.avatar_url, 
            CASE 
                WHEN u.name IS NOT NULL AND u.surname IS NOT NULL THEN u.name || ' ' || u.surname
                WHEN u.name IS NOT NULL THEN u.name
                ELSE COALESCE(u.username, u.nickname, 'Anonim')
            END
        ORDER BY total_amount DESC
        LIMIT $1
    `;
    const result = await query(sql, [limit]);
    return result.rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        username: row.username,
        user_name: row.user_name,
        user_surname: row.user_surname,
        donor_username: row.donor_username,
        donor_name: row.donor_name,
        donor_surname: row.donor_surname,
        donor_avatar: row.donor_avatar,
        totalAmount: parseFloat(row.total_amount),
        donationCount: parseInt(row.donation_count)
    }));
};

// ==================== CONTACT MESSAGES QUERIES ====================

export interface ContactMessageFilters {
    status?: 'pending' | 'read' | 'responded' | 'archived';
    subject?: string;
    userId?: string;
    limit?: number;
    offset?: number;
}

export const getContactMessages = async (filters: ContactMessageFilters = {}) => {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
        conditions.push(`cm.status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
    }

    if (filters.subject) {
        conditions.push(`cm.subject = $${paramIndex}`);
        params.push(filters.subject);
        paramIndex++;
    }

    if (filters.userId) {
        conditions.push(`cm.user_id = $${paramIndex}`);
        params.push(filters.userId);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
        SELECT 
            cm.id,
            cm.user_id,
            cm.user_email,
            cm.user_nickname,
            cm.user_username,
            cm.name,
            cm.subject,
            cm.message,
            cm.status,
            cm.reviewed_by,
            cm.reviewed_at,
            cm.response,
            cm.responded_by,
            cm.responded_at,
            cm.honeypot_filled,
            cm.created_at,
            cm.updated_at,
            reviewer.username as reviewer_username,
            reviewer.nickname as reviewer_nickname,
            responder.username as responder_username,
            responder.nickname as responder_nickname
        FROM contact_messages cm
        LEFT JOIN users reviewer ON cm.reviewed_by = reviewer.id
        LEFT JOIN users responder ON cm.responded_by = responder.id
        ${whereClause}
        ORDER BY cm.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(filters.limit || 50);
    params.push(filters.offset || 0);

    const result = await query(sql, params);
    return result.rows;
};

export const getContactMessagesCount = async (filters: ContactMessageFilters = {}) => {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
        conditions.push(`status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
    }

    if (filters.subject) {
        conditions.push(`subject = $${paramIndex}`);
        params.push(filters.subject);
        paramIndex++;
    }

    if (filters.userId) {
        conditions.push(`user_id = $${paramIndex}`);
        params.push(filters.userId);
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `SELECT COUNT(*) as count FROM contact_messages ${whereClause}`;
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
};

export const createContactMessage = async (data: {
    userId: string;
    name: string;
    subject: string;
    message: string;
    honeypot?: string;
}) => {
    const sql = `
        INSERT INTO contact_messages (
            user_id, name, subject, message, honeypot_filled
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const result = await query(sql, [
        data.userId,
        data.name,
        data.subject,
        data.message,
        !!data.honeypot && data.honeypot.trim() !== ''
    ]);
    return result.rows[0];
};

export const updateContactMessageStatus = async (
    messageId: string,
    status: 'pending' | 'read' | 'responded' | 'archived',
    reviewedBy?: string
) => {
    const sql = `
        UPDATE contact_messages 
        SET 
            status = $1,
            reviewed_by = $2,
            reviewed_at = CASE WHEN $2 IS NOT NULL THEN NOW() ELSE reviewed_at END,
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
    `;
    const result = await query(sql, [status, reviewedBy || null, messageId]);
    return result.rows[0];
};

export const respondToContactMessage = async (
    messageId: string,
    response: string,
    respondedBy: string
) => {
    const sql = `
        UPDATE contact_messages 
        SET 
            response = $1,
            responded_by = $2,
            responded_at = NOW(),
            status = 'responded',
            updated_at = NOW()
        WHERE id = $3
        RETURNING *
    `;
    const result = await query(sql, [response, respondedBy, messageId]);
    return result.rows[0];
};

export const deleteContactMessage = async (messageId: string) => {
    const sql = 'DELETE FROM contact_messages WHERE id = $1 RETURNING *';
    const result = await query(sql, [messageId]);
    return result.rows[0];
};

export const getContactMessageById = async (messageId: string) => {
    const sql = `
        SELECT 
            cm.*,
            reviewer.username as reviewer_username,
            reviewer.nickname as reviewer_nickname,
            responder.username as responder_username,
            responder.nickname as responder_nickname
        FROM contact_messages cm
        LEFT JOIN users reviewer ON cm.reviewed_by = reviewer.id
        LEFT JOIN users responder ON cm.responded_by = responder.id
        WHERE cm.id = $1
    `;
    const result = await query(sql, [messageId]);
    return result.rows[0] || null;
};

// Messages (Private/DM)
export const createMessage = async (data: {
    senderId: string;
    receiverId: string;
    content: string;
}) => {
    const id = uuidv4();
    const sql = `
        INSERT INTO messages (id, sender_id, receiver_id, content, created_at, is_read)
        VALUES ($1, $2, $3, $4, NOW(), FALSE)
        RETURNING *
    `;
    const result = await query(sql, [id, data.senderId, data.receiverId, data.content]);
    return result.rows[0];
};

// ==================== ARTICLE RECOMMENDATIONS ====================

// Helper function to fetch collaborator details
const getCollaboratorDetails = async (collaboratorIds: string[]): Promise<Array<{
    id: string;
    name: string;
    nickname: string;
    avatar?: string;
}>> => {
    if (!collaboratorIds || collaboratorIds.length === 0) return [];
    
    const sql = `
        SELECT id, username, name, surname, nickname, avatar_url
        FROM users
        WHERE id = ANY($1)
    `;
    
    const result = await query(sql, [collaboratorIds]);
    return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name || row.username || 'Unknown',
        nickname: row.nickname || row.username || 'user',
        avatar: row.avatar_url
    }));
};

// Get popular articles based on engagement (likes + comments + views)
// If language is provided, prioritize that language's translation
export const getPopularArticles = async (limit: number = 3, excludeId?: string, language?: string) => {
    let sql = `
        SELECT a.*, 
               u.username as author_name, 
               u.avatar_url as author_avatar,
               u.name as author_full_name,
               u.surname as author_surname,
               u.nickname as author_nickname
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.status = 'published' 
        AND a.deleted_at IS NULL
        AND a.is_hidden = FALSE
    `;
    const params: any[] = [];
    
    if (excludeId) {
        sql += ` AND a.id <> $${params.length + 1}`;
        params.push(excludeId);
    }
    
    sql += `
        ORDER BY (COALESCE(a.likes_count, 0) + COALESCE(a.comments_count, 0) + COALESCE(a.views, 0)) DESC
        LIMIT $${params.length + 1}
    `;
    params.push(limit);
    
    const result = await query(sql, params);
    
    // Fetch collaborator details for each article
    const articlesWithCollaborators = await Promise.all(
        result.rows.map(async (row: any) => {
            const collaboratorIds = row.collaborators || [];
            const collaboratorDetails = await getCollaboratorDetails(collaboratorIds);
            
            // Determine which translation to use:
            // 1. Requested language if available
            // 2. Fallback to English if available
            // 3. Fallback to default language
            const translations = row.translations || {};
            const defaultLang = row.default_language || 'tr';
            const hasTranslation = language && translations[language] && translations[language].title;
            const hasEnglish = translations['en'] && translations['en'].title;
            
            let displayLang: string;
            if (hasTranslation) {
                displayLang = language!;
            } else if (hasEnglish) {
                displayLang = 'en';
            } else {
                displayLang = defaultLang;
            }
            
            const translation = translations[displayLang] || {};
            
            return {
                ...row,
                id: row.id,
                slug: translation.slug || row.slug || `article-${row.id}`,
                title: translation.title || row.title || 'Untitled',
                excerpt: translation.excerpt || 
                         (translation.content?.substring(0, 200) + '...') || 
                         (row.content?.substring(0, 200) + '...') || '',
                author: {
                    id: row.author_id,
                    name: row.author_full_name || row.author_name || 'Unknown',
                    surname: row.author_surname,
                    avatar: row.author_avatar,
                    nickname: row.author_nickname || row.author_name
                },
                author_nickname: row.author_nickname || row.author_name,
                publishedAt: row.published_at,
                readTime: Math.ceil((translation.content?.length || row.content?.length || 0) / 1000) || 5,
                category: row.category,
                coverImage: row.thumbnail,
                views: row.views || 0,
                likes: row.likes_count || 0,
                comments: row.comments_count || 0,
                dislikes: row.dislikes || 0,
                collaborators: collaboratorDetails,
                language: displayLang,
                translations: translations
            };
        })
    );
    
    return articlesWithCollaborators;
};

// ==================== QR ENTRY QUERIES ====================

export interface QrEntryData {
    username?: string | null;
    sourceUrl: string;
    userAgent?: string | null;
}

export const recordQrEntry = async (data: QrEntryData) => {
    const sql = `
        INSERT INTO qr_entries (username, source_url, entry_time, user_agent)
        VALUES ($1, $2, NOW(), $3)
        RETURNING *
    `;
    const result = await query(sql, [
        data.username || null,
        data.sourceUrl,
        data.userAgent || null
    ]);
    return result.rows[0];
};

export const getQrEntries = async (filters: {
    username?: string;
    sourceUrl?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
} = {}) => {
    let sql = `SELECT * FROM qr_entries WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters.username) {
        sql += ` AND username = $${paramIndex}`;
        params.push(filters.username);
        paramIndex++;
    }
    
    if (filters.sourceUrl) {
        sql += ` AND source_url = $${paramIndex}`;
        params.push(filters.sourceUrl);
        paramIndex++;
    }
    
    if (filters.fromDate) {
        sql += ` AND entry_time >= $${paramIndex}`;
        params.push(filters.fromDate);
        paramIndex++;
    }
    
    if (filters.toDate) {
        sql += ` AND entry_time <= $${paramIndex}`;
        params.push(filters.toDate);
        paramIndex++;
    }
    
    sql += ` ORDER BY entry_time DESC`;
    
    if (filters.limit) {
        sql += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
        
        if (filters.offset) {
            sql += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
        }
    }
    
    const result = await query(sql, params);
    return result.rows;
};

export const getQrEntryStats = async (fromDate?: Date, toDate?: Date) => {
    let sql = `
        SELECT 
            COUNT(*) as total_entries,
            COUNT(DISTINCT username) as unique_users,
            COUNT(DISTINCT source_url) as unique_urls
        FROM qr_entries
        WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (fromDate) {
        sql += ` AND entry_time >= $${paramIndex}`;
        params.push(fromDate);
        paramIndex++;
    }
    
    if (toDate) {
        sql += ` AND entry_time <= $${paramIndex}`;
        params.push(toDate);
    }
    
    const result = await query(sql, params);
    return {
        totalEntries: parseInt(result.rows[0]?.total_entries || '0'),
        uniqueUsers: parseInt(result.rows[0]?.unique_users || '0'),
        uniqueUrls: parseInt(result.rows[0]?.unique_urls || '0')
    };
};

// Get similar articles based on category and tags
// If language is provided, prioritize that language's translation
export const getSimilarArticles = async (articleId: string, category: string, tags: string[], limit: number = 3, language?: string) => {
    let sql = `
        SELECT a.*, 
               u.username as author_name, 
               u.avatar_url as author_avatar,
               u.name as author_full_name,
               u.surname as author_surname,
               u.nickname as author_nickname
        FROM articles a
        JOIN users u ON a.author_id = u.id
        WHERE a.status = 'published'
        AND a.deleted_at IS NULL
        AND a.is_hidden = FALSE
        AND a.id <> $1
        AND a.category <> 'design'
    `;
    const params: any[] = [articleId];

    // Category match is weighted more heavily
    if (category) {
        sql += ` AND (a.category = $${params.length + 1}`;
        params.push(category);
        
        // Also include articles with matching tags
        if (tags && tags.length > 0) {
            sql += ` OR a.tags && $${params.length + 1}`;
            params.push(tags);
        }
        sql += `)`;
    }
    
    sql += `
        ORDER BY 
            CASE WHEN a.category = $${params.length + 1} THEN 2 ELSE 0 END +
            CASE WHEN a.tags && $${params.length + 2} THEN 1 ELSE 0 END +
            (COALESCE(a.likes_count, 0) + COALESCE(a.comments_count, 0)) * 0.1
        DESC
        LIMIT $${params.length + 3}
    `;
    params.push(category);
    params.push(tags && tags.length > 0 ? tags : []);
    params.push(limit);
    
    const result = await query(sql, params);
    
    // Fetch collaborator details for each article
    const articlesWithCollaborators = await Promise.all(
        result.rows.map(async (row: any) => {
            const collaboratorIds = row.collaborators || [];
            const collaboratorDetails = await getCollaboratorDetails(collaboratorIds);
            
            // Determine which translation to use:
            // 1. Requested language if available
            // 2. Fallback to English if available
            // 3. Fallback to default language
            const translations = row.translations || {};
            const defaultLang = row.default_language || 'tr';
            const hasTranslation = language && translations[language] && translations[language].title;
            const hasEnglish = translations['en'] && translations['en'].title;
            
            let displayLang: string;
            if (hasTranslation) {
                displayLang = language!;
            } else if (hasEnglish) {
                displayLang = 'en';
            } else {
                displayLang = defaultLang;
            }
            
            const translation = translations[displayLang] || {};
            
            return {
                ...row,
                id: row.id,
                slug: translation.slug || row.slug || `article-${row.id}`,
                title: translation.title || row.title || 'Untitled',
                excerpt: translation.excerpt || 
                         (translation.content?.substring(0, 200) + '...') || 
                         (row.content?.substring(0, 200) + '...') || '',
                author: {
                    id: row.author_id,
                    name: row.author_full_name || row.author_name || 'Unknown',
                    surname: row.author_surname,
                    avatar: row.author_avatar,
                    nickname: row.author_nickname || row.author_name
                },
                author_nickname: row.author_nickname || row.author_name,
                publishedAt: row.published_at,
                readTime: Math.ceil((translation.content?.length || row.content?.length || 0) / 1000) || 5,
                category: row.category,
                coverImage: row.thumbnail,
                views: row.views || 0,
                likes: row.likes_count || 0,
                comments: row.comments_count || 0,
                dislikes: row.dislikes || 0,
                collaborators: collaboratorDetails,
                language: displayLang,
                translations: translations
            };
        })
    );
    
    return articlesWithCollaborators;
};

// Get a single question by ID (for QA reports)
export const getQuestion = async (id: string) => {
    const result = await query(`
        SELECT 
            q.id,
            q.title,
            q.slug,
            q.content,
            q.content_html,
            q.author_id,
            q.author_name,
            q.status,
            q.created_at,
            q.updated_at,
            t.id as topic_id,
            t.name as topic_name,
            t.slug as topic_slug
        FROM questions q
        LEFT JOIN topics t ON q.topic_id = t.id
        WHERE q.id = $1
    `, [id]);
    
    return result.rows[0] || null;
};
