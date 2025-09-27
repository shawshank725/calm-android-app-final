-- Quick Database Column Fix Script
-- Run this script in your Supabase SQL Editor to add missing columns

-- Add expert_name column to book_request table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_request' AND column_name = 'expert_name') THEN
        ALTER TABLE book_request ADD COLUMN expert_name TEXT;
        RAISE NOTICE 'Added expert_name column to book_request table';
    ELSE
        RAISE NOTICE 'expert_name column already exists in book_request table';
    END IF;
END $$;

-- Add expert_id column to book_request table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_request' AND column_name = 'expert_id') THEN
        ALTER TABLE book_request ADD COLUMN expert_id INTEGER;
        RAISE NOTICE 'Added expert_id column to book_request table';
    ELSE
        RAISE NOTICE 'expert_id column already exists in book_request table';
    END IF;
END $$;

-- Add session_date column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_request' AND column_name = 'session_date') THEN
        ALTER TABLE book_request ADD COLUMN session_date DATE;
        RAISE NOTICE 'Added session_date column to book_request table';
    ELSE
        RAISE NOTICE 'session_date column already exists in book_request table';
    END IF;
END $$;

-- Add session_time column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'book_request' AND column_name = 'session_time') THEN
        ALTER TABLE book_request ADD COLUMN session_time TIME;
        RAISE NOTICE 'Added session_time column to book_request table';
    ELSE
        RAISE NOTICE 'session_time column already exists in book_request table';
    END IF;
END $$;

-- Add status column to peer_listeners if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'peer_listeners' AND column_name = 'status') THEN
        ALTER TABLE peer_listeners ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to peer_listeners table';
    ELSE
        RAISE NOTICE 'status column already exists in peer_listeners table';
    END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Quick database column fix completed!' as status;