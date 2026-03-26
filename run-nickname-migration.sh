#!/bin/bash

# Run nickname migration for LAF database
echo "Running nickname migration..."

# Check if PostgreSQL is running
if ! pgrep -x "postgres" > /dev/null; then
    echo "PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Run the migration
echo "Adding nickname columns to database..."
psql -d laf -f src/db/migrations/add_nicknames_to_articles_and_reports.sql

if [ $? -eq 0 ]; then
    echo "Migration completed successfully!"
    echo "Nickname columns have been added to users, articles, and reports tables."
else
    echo "Migration failed. Please check the error above."
    exit 1
fi
