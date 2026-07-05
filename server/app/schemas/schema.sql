-- ============================================================
-- CORE TABLES
-- ============================================================

CREATE TABLE rooms (
    room_id         CHARACTER VARYING(30) PRIMARY KEY,
    room_name       CHARACTER VARYING(100) NOT NULL,
    location        CHARACTER VARYING(100),
    capacity        INTEGER,
    status          CHARACTER VARYING(20) DEFAULT 'ACTIVE'
);

CREATE TABLE users (
    user_id         CHARACTER VARYING(30) PRIMARY KEY,
    name            CHARACTER VARYING(100) NOT NULL,
    username        CHARACTER VARYING(100) UNIQUE NOT NULL,
    email           CHARACTER VARYING(255) UNIQUE NOT NULL,
    password        CHARACTER VARYING(255) NOT NULL,
    role            CHARACTER VARYING(20) NOT NULL DEFAULT 'mahasiswa',
    avatar          TEXT,
    email_notifications BOOLEAN DEFAULT TRUE,
    system_notifications BOOLEAN DEFAULT TRUE,
    daily_digest    BOOLEAN DEFAULT FALSE
);

CREATE TABLE iot_devices (
    device_id       CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE SET NULL,
    device_name     CHARACTER VARYING(100),
    type            CHARACTER VARYING(50),
    status          CHARACTER VARYING(20) DEFAULT 'aktif',
    last_seen       TIMESTAMP WITH TIME ZONE NULL
);

CREATE TABLE cameras (
    camera_id       CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE SET NULL,
    name            CHARACTER VARYING(255),
    ip_address      TEXT,
    camera_hash     CHARACTER VARYING(64),
    resolution      CHARACTER VARYING(20),
    status          CHARACTER VARYING(20) DEFAULT 'aktif'
);

CREATE TABLE zones (
    zone_id         CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE CASCADE,
    zone_name       CHARACTER VARYING(100),
    sort_order      INTEGER DEFAULT 1,
    color           CHARACTER VARYING(20),
    zone_status     CHARACTER VARYING(20) DEFAULT 'aktif',
    x1_pct          DOUBLE PRECISION,
    y1_pct          DOUBLE PRECISION,
    x2_pct          DOUBLE PRECISION,
    y2_pct          DOUBLE PRECISION,
    skew_x          DOUBLE PRECISION DEFAULT 0,
    skew_y          DOUBLE PRECISION DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CONTROL TABLES
-- ============================================================

CREATE TABLE ac_controls (
    ac_control_id   CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) NOT NULL REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE CASCADE,
    device_id       CHARACTER VARYING(30) NOT NULL REFERENCES iot_devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
    temperature_setting DOUBLE PRECISION DEFAULT 24.0,
    ac_status       CHARACTER VARYING(20) DEFAULT 'off',
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE light_controls (
    control_id      CHARACTER VARYING(30) PRIMARY KEY,
    zone_id         CHARACTER VARYING(30) NOT NULL REFERENCES zones(zone_id) ON UPDATE CASCADE ON DELETE CASCADE,
    device_id       CHARACTER VARYING(30) NOT NULL REFERENCES iot_devices(device_id) ON UPDATE CASCADE ON DELETE CASCADE,
    relay_channel   INTEGER,
    light_status    CHARACTER VARYING(20) DEFAULT 'off',
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE automation_schedules (
    schedule_id     CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id         CHARACTER VARYING(30) REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE SET NULL,
    schedule_name   CHARACTER VARYING(100),
    start_time      TIME WITHOUT TIME ZONE,
    end_time        TIME WITHOUT TIME ZONE
);

-- ============================================================
-- LOG & SENSOR TABLES
-- ============================================================

CREATE TABLE detection_logs (
    detection_id    CHARACTER VARYING(30) PRIMARY KEY,
    zone_id         CHARACTER VARYING(30) REFERENCES zones(zone_id) ON UPDATE CASCADE ON DELETE SET NULL,
    camera_id       CHARACTER VARYING(30) REFERENCES cameras(camera_id) ON UPDATE CASCADE ON DELETE SET NULL,
    occupancy_count INTEGER DEFAULT 0,
    zone_status     CHARACTER VARYING(20),
    detection_time  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE energy_logs (
    log_id          CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE SET NULL,
    date            DATE NOT NULL,
    total_watts     DOUBLE PRECISION DEFAULT 0,
    saved_watts     DOUBLE PRECISION DEFAULT 0
);

CREATE TABLE power_sensors (
    sensor_id       CHARACTER VARYING(30) PRIMARY KEY,
    room_id         CHARACTER VARYING(30) REFERENCES rooms(room_id) ON UPDATE CASCADE ON DELETE SET NULL,
    power_watts     DOUBLE PRECISION DEFAULT 0,
    voltage_v       DOUBLE PRECISION DEFAULT 0,
    current_a       DOUBLE PRECISION DEFAULT 0,
    read_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ACTIVITY LOGS
-- Tracks all user actions in the system for audit purposes.
-- Privacy: frame/image data is never stored here (in-memory only in AI service).
-- Data that is redacted before storage: password, avatar, token, base64 data.
-- Retention: auto-cleanup after 90 days via cron job in server.js.
-- ============================================================

CREATE TABLE activity_logs (
    log_id          CHARACTER VARYING(30) NOT NULL,
    user_id         CHARACTER VARYING(30) NULL,
    action          CHARACTER VARYING(255) NOT NULL,
    details         TEXT NULL,
    ip_address      CHARACTER VARYING(45) NULL,
    status_code     SMALLINT NULL,
    resource_id     CHARACTER VARYING NULL,
    resource_type   CHARACTER VARYING NULL,
    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT activity_logs_pkey PRIMARY KEY (log_id),
    CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- ============================================================
-- INDEXES
-- Applied on high-frequency filter columns to prevent
-- full table scans when rendering dashboard charts.
-- ============================================================

-- detection_logs
CREATE INDEX idx_detection_logs_zone_id       ON detection_logs(zone_id);
CREATE INDEX idx_detection_logs_camera_id     ON detection_logs(camera_id);
CREATE INDEX idx_detection_logs_time          ON detection_logs(detection_time);

-- energy_logs
CREATE INDEX idx_energy_logs_room_id          ON energy_logs(room_id);
CREATE INDEX idx_energy_logs_date             ON energy_logs(date);
CREATE INDEX idx_energy_logs_room_date        ON energy_logs(room_id, date);

-- activity_logs
CREATE INDEX idx_activity_logs_user_id        ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp      ON activity_logs(timestamp);

-- power_sensors
CREATE INDEX idx_power_sensors_room_id        ON power_sensors(room_id);
CREATE INDEX idx_power_sensors_read_at        ON power_sensors(read_at);

-- iot_devices
CREATE INDEX idx_iot_devices_room_id          ON iot_devices(room_id);

-- zones
CREATE INDEX idx_zones_room_id                ON zones(room_id);

-- light_controls
CREATE INDEX idx_light_controls_zone_id       ON light_controls(zone_id);
CREATE INDEX idx_light_controls_device_id     ON light_controls(device_id);

-- ac_controls
CREATE INDEX idx_ac_controls_room_id          ON ac_controls(room_id);
