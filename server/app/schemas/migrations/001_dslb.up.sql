-- ============================================================
-- 001_dslb.up.sql — DSLB (Dynamic Space Load Balancing)
-- Idempotent: semua pernyataan menggunakan IF NOT EXISTS / IF EXISTS
-- Tanpa prefix schema — mengandalkan search_path role
-- ============================================================

-- 1. ALTER rooms: tambah kolom building, floor, is_simulated
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS building VARCHAR(100);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS floor VARCHAR(20);
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_simulated BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. room_occupancy_current: 1 baris per ruangan, di-upsert tiap siklus DSLB
CREATE TABLE IF NOT EXISTS room_occupancy_current (
    occ_id            CHARACTER VARYING(30) PRIMARY KEY,
    room_id           CHARACTER VARYING(30) NOT NULL REFERENCES rooms(room_id)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    confirmed_status  CHARACTER VARYING(30) NOT NULL
                        CHECK (confirmed_status IN (
                            'Kosong', 'Rendah', 'Sedang', 'Padat',
                            'Tidak tersedia', 'Kapasitas belum dikonfigurasi'
                        )),
    candidate_status  CHARACTER VARYING(30)
                        CHECK (candidate_status IS NULL OR candidate_status IN (
                            'Kosong', 'Rendah', 'Sedang', 'Padat',
                            'Tidak tersedia', 'Kapasitas belum dikonfigurasi'
                        )),
    candidate_count   INTEGER DEFAULT 0,
    person_count      INTEGER CHECK (person_count IS NULL OR person_count >= 0),
    capacity          INTEGER CHECK (capacity IS NULL OR capacity > 0),
    occupancy_pct_raw DOUBLE PRECISION,
    available_seats   INTEGER CHECK (available_seats IS NULL OR available_seats >= 0),
    recommendations   JSONB DEFAULT '[]'::jsonb,
    is_stale          BOOLEAN DEFAULT FALSE,
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (room_id)
);

-- 3. room_occupancy_status: riwayat perubahan status + heartbeat
CREATE TABLE IF NOT EXISTS room_occupancy_status (
    history_id        CHARACTER VARYING(30) PRIMARY KEY,
    room_id           CHARACTER VARYING(30) NOT NULL REFERENCES rooms(room_id)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    status            CHARACTER VARYING(30) NOT NULL
                        CHECK (status IN (
                            'Kosong', 'Rendah', 'Sedang', 'Padat',
                            'Tidak tersedia', 'Kapasitas belum dikonfigurasi'
                        )),
    person_count      INTEGER CHECK (person_count IS NULL OR person_count >= 0),
    occupancy_pct_raw DOUBLE PRECISION,
    reason            CHARACTER VARYING(50) NOT NULL DEFAULT 'status_change',
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. room_recommendations_log: log rekomendasi (JSONB untuk daftar berurutan)
CREATE TABLE IF NOT EXISTS room_recommendations_log (
    reco_log_id       CHARACTER VARYING(30) PRIMARY KEY,
    room_id           CHARACTER VARYING(30) NOT NULL REFERENCES rooms(room_id)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    recommendations   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. simulated_room_counts: input dari skrip simulator
CREATE TABLE IF NOT EXISTS simulated_room_counts (
    room_id           CHARACTER VARYING(30) NOT NULL REFERENCES rooms(room_id)
                        ON UPDATE CASCADE ON DELETE CASCADE,
    person_count      INTEGER NOT NULL DEFAULT 0
                        CHECK (person_count >= 0),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id)
);

-- 6. Indeks
CREATE INDEX IF NOT EXISTS idx_occ_current_room      ON room_occupancy_current(room_id);
CREATE INDEX IF NOT EXISTS idx_occ_current_updated    ON room_occupancy_current(updated_at);
CREATE INDEX IF NOT EXISTS idx_occ_status_room_time   ON room_occupancy_status(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reco_log_room_time     ON room_recommendations_log(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_simulated_counts_room  ON simulated_room_counts(room_id);
