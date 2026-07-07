-- =============================================================================
-- Eco-Light Space Optimizer — Database Migration
-- File: migration_energy_pipeline_fix.sql
-- Purpose: Ensure the energy pipeline works correctly end-to-end
-- Run this in: Supabase SQL Editor (or psql)
-- =============================================================================

-- =============================================================================
-- STEP 1: Verify power_sensors table schema
-- The Python subscriber inserts: sensor_id, room_id, voltage_v, current_a,
-- power_watts, read_at
-- =============================================================================
DO $$
BEGIN
    -- Check power_sensors columns
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'power_sensors' AND column_name = 'sensor_id'
    ) THEN
        RAISE EXCEPTION 'Table power_sensors does not have expected schema. Please check your schema.';
    END IF;
    RAISE NOTICE '✅ power_sensors table schema looks correct.';
END $$;

-- =============================================================================
-- STEP 2: Verify energy_logs table schema
-- The Python subscriber upserts: log_id, room_id, date, voltage, current,
-- power, energy, frequency, power_factor, total_watts, saved_watts
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'energy_logs' AND column_name = 'log_id'
    ) THEN
        RAISE EXCEPTION 'Table energy_logs does not have expected schema.';
    END IF;
    RAISE NOTICE '✅ energy_logs table schema looks correct.';
END $$;

-- =============================================================================
-- STEP 3: Add power_factor column to energy_logs if it doesn't exist
-- (Older schema may have 'pf' instead of 'power_factor')
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'energy_logs' AND column_name = 'power_factor'
    ) THEN
        -- Try to rename 'pf' to 'power_factor' if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'energy_logs' AND column_name = 'pf'
        ) THEN
            ALTER TABLE energy_logs RENAME COLUMN pf TO power_factor;
            RAISE NOTICE '✅ Renamed energy_logs.pf → power_factor';
        ELSE
            ALTER TABLE energy_logs ADD COLUMN power_factor FLOAT DEFAULT NULL;
            RAISE NOTICE '✅ Added energy_logs.power_factor column';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️  energy_logs.power_factor already exists.';
    END IF;
END $$;

-- =============================================================================
-- STEP 4: Add energy column to energy_logs if it doesn't exist
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'energy_logs' AND column_name = 'energy'
    ) THEN
        ALTER TABLE energy_logs ADD COLUMN energy FLOAT DEFAULT NULL;
        RAISE NOTICE '✅ Added energy_logs.energy column';
    ELSE
        RAISE NOTICE 'ℹ️  energy_logs.energy already exists.';
    END IF;
END $$;

-- =============================================================================
-- STEP 5: Add frequency column to energy_logs if it doesn't exist
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'energy_logs' AND column_name = 'frequency'
    ) THEN
        ALTER TABLE energy_logs ADD COLUMN frequency FLOAT DEFAULT NULL;
        RAISE NOTICE '✅ Added energy_logs.frequency column';
    ELSE
        RAISE NOTICE 'ℹ️  energy_logs.frequency already exists.';
    END IF;
END $$;

-- =============================================================================
-- STEP 6: CRITICAL — Add UNIQUE constraint on (room_id, date) for energy_logs
-- This is REQUIRED for the ON CONFLICT (room_id, date) upsert to work.
-- Without this, every INSERT to energy_logs will create a duplicate row
-- and the upsert will never trigger.
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'energy_logs_room_date_unique'
    ) THEN
        -- Convert date column to DATE type if it's TIMESTAMP (to allow proper deduplication)
        -- Only alter if column is timestamp type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'energy_logs'
              AND column_name = 'date'
              AND data_type IN ('timestamp without time zone', 'timestamp with time zone')
        ) THEN
            -- First, we need to truncate any existing timestamp values to date
            -- This ensures the UNIQUE constraint works on date-only values
            ALTER TABLE energy_logs ALTER COLUMN date TYPE DATE USING date::DATE;
            RAISE NOTICE '✅ Converted energy_logs.date from TIMESTAMP to DATE type';
        END IF;

        ALTER TABLE energy_logs
        ADD CONSTRAINT energy_logs_room_date_unique UNIQUE (room_id, date);
        RAISE NOTICE '✅ Added UNIQUE constraint energy_logs_room_date_unique (room_id, date)';
    ELSE
        RAISE NOTICE 'ℹ️  UNIQUE constraint energy_logs_room_date_unique already exists.';
    END IF;
END $$;

-- =============================================================================
-- STEP 7: Ensure the 'date' column in energy_logs defaults to CURRENT_DATE
-- =============================================================================
DO $$
BEGIN
    BEGIN
        ALTER TABLE energy_logs ALTER COLUMN date SET DEFAULT CURRENT_DATE;
        RAISE NOTICE '✅ Set energy_logs.date DEFAULT to CURRENT_DATE';
    EXCEPTION WHEN others THEN
        RAISE NOTICE 'ℹ️  Could not set DEFAULT on date column: %', SQLERRM;
    END;
END $$;

-- =============================================================================
-- STEP 8: Verify that the rooms table exists and has a room_id column
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'rooms'
    ) THEN
        RAISE EXCEPTION '❌ Table "rooms" does not exist! Check your schema.';
    END IF;
    RAISE NOTICE '✅ rooms table exists.';
END $$;

-- =============================================================================
-- STEP 9: Create indexes for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_power_sensors_room_id
ON power_sensors(room_id);

CREATE INDEX IF NOT EXISTS idx_power_sensors_read_at
ON power_sensors(read_at DESC);

CREATE INDEX IF NOT EXISTS idx_energy_logs_room_id
ON energy_logs(room_id);

CREATE INDEX IF NOT EXISTS idx_energy_logs_date
ON energy_logs(date DESC);

DO $$
BEGIN
    RAISE NOTICE 'Performance indexes created/verified.';
END $$;

-- =============================================================================
-- STEP 10: Final verification — list current structure
-- =============================================================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'power_sensors'
ORDER BY ordinal_position;

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'energy_logs'
ORDER BY ordinal_position;

-- Done!
-- After running this migration, test with:
-- INSERT INTO power_sensors (sensor_id, room_id, voltage_v, current_a, power_watts, read_at)
-- VALUES ('PWR-TEST-001', 'ROM-1464452b', 220.0, 0.45, 98.0, NOW());
-- SELECT * FROM power_sensors WHERE room_id = 'ROM-1464452b' ORDER BY read_at DESC LIMIT 5;
