# PostgreSQL Migration Guide for LAF

## Overview
This document outlines the migration from MongoDB to PostgreSQL using direct `pg` connection.

## Files Created/Modified

### 1. Database Connection
- **Created**: `src/db/pg.ts` - PostgreSQL connection pool and query helpers
- **Created**: `src/db/schema.sql` - PostgreSQL table schemas
- **Created**: `src/db/queries.ts` - Query functions replacing MongoDB operations

### 2. Updated Files
- **Modified**: `src/hooks.server.ts` - Updated to use PostgreSQL for user authentication
- **Modified**: `src/routes/api/articles/+server.ts` - Updated to use PostgreSQL queries

## Environment Variables
Make sure your `.env` file contains:
```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

## Database Setup
1. Create a PostgreSQL database:
```sql
CREATE DATABASE laf_app;
```

2. Run the schema:
```bash
psql -d laf_app -f src/db/schema.sql
```

## Key Changes

### MongoDB to PostgreSQL Mapping
| MongoDB | PostgreSQL |
|---------|------------|
| `ObjectId` | `UUID` |
| `collection` | `table` |
| `findOne()` | `SELECT * FROM table WHERE ...` |
| `find()` | `SELECT * FROM table WHERE ...` |
| `insertOne()` | `INSERT INTO table ...` |
| `updateOne()` | `UPDATE table SET ...` |
| `deleteOne()` | `DELETE FROM table ...` |

### Data Types
- MongoDB `_id` → PostgreSQL `id` (UUID)
- MongoDB `Date` → PostgreSQL `TIMESTAMP WITH TIME ZONE`
- MongoDB `Object` → PostgreSQL `JSONB`
- MongoDB `Array` → PostgreSQL `TEXT[]` or appropriate array type

## Remaining Tasks
1. Update all remaining API routes in `src/routes/api/` to use PostgreSQL
2. Update any client-side code that expects MongoDB ObjectId format
3. Add proper error handling for PostgreSQL operations
4. Add database migrations for future schema changes
5. Update tests to work with PostgreSQL

## Query Function Examples
```typescript
// Instead of:
const user = await users.findOne({ _id: new ObjectId(id) });

// Use:
const users = await getUsers({ id });
const user = users[0];
```

## Notes
- PostgreSQL uses 1-based indexing for parameters ($1, $2, etc.)
- UUID generation is handled by the database or `uuid` package
- JSONB is used for flexible metadata storage
- Proper indexing is added for performance
