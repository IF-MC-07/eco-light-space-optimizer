-- ============================================================
-- 001_dslb.down.sql — Rollback DSLB
-- Idempotent: semua pernyataan menggunakan IF EXISTS
-- Tanpa prefix schema — mengandalkan search_path role
-- ============================================================

-- 1. Drop tabel baru (urutan terbalik dari up)
DROP TABLE IF EXISTS simulated_room_counts;
DROP TABLE IF EXISTS room_recommendations_log;
DROP TABLE IF EXISTS room_occupancy_status;
DROP TABLE IF EXISTS room_occupancy_current;

-- 2. Drop kolom baru di rooms
ALTER TABLE rooms DROP COLUMN IF EXISTS is_simulated;
ALTER TABLE rooms DROP COLUMN IF EXISTS floor;
ALTER TABLE rooms DROP COLUMN IF EXISTS building;
