-- ============================================================
-- SAFE DATABASE RESET SCRIPT
-- Paste and run this in your Neon SQL Editor
--
-- What this does:
-- 1. Automatically finds all tables in the 'public' schema
-- 2. Wipes all rows from all existing tables (TRUNCATE ... CASCADE)
-- 3. Resets all auto-increment IDs / sequences
-- 4. Never fails on missing tables (like event_attachments)
-- 5. Preserves all table structures, schemas, and columns
-- ============================================================

DO $$ 
DECLARE 
    tbl_list TEXT;
BEGIN 
    -- Collect all tables that actually exist in the database
    SELECT string_agg(quote_ident(schemaname) || '.' || quote_ident(tablename), ', ')
    INTO tbl_list
    FROM pg_tables 
    WHERE schemaname = 'public';

    -- Truncate all tables in a single command if any exist
    IF tbl_list IS NOT NULL AND tbl_list <> '' THEN
        EXECUTE 'TRUNCATE TABLE ' || tbl_list || ' RESTART IDENTITY CASCADE;';
        RAISE NOTICE 'Successfully wiped all tables: %', tbl_list;
    ELSE
        RAISE NOTICE 'No tables found in public schema.';
    END IF;
END $$;

-- Verification: Check row count across all existing tables
SELECT 
    schemaname,
    tablename,
    n_live_tup AS remaining_rows
FROM pg_stat_user_tables
ORDER BY tablename;
