-- Migration 002: Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
    holiday_id VARCHAR(50) PRIMARY KEY,
    holiday_date DATE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('nasional', 'cuti_bersama', 'kampus')),
    suspend_rules BOOLEAN NOT NULL DEFAULT true,
    source_ref TEXT,
    CONSTRAINT uq_holiday_date_name UNIQUE (holiday_date, name)
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays (holiday_date);
