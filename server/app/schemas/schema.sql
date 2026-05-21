-- Database Schema Translated to English

CREATE TABLE rooms (
    room_id INTEGER PRIMARY KEY,
    room_name CHARACTER VARYING,
    location CHARACTER VARYING,
    capacity INTEGER,
    status CHARACTER VARYING
);

CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    name CHARACTER VARYING,
    email CHARACTER VARYING,
    password CHARACTER VARYING,
    role CHARACTER VARYING
);

CREATE TABLE iot_devices (
    device_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    device_name CHARACTER VARYING,
    type CHARACTER VARYING,
    status CHARACTER VARYING
);

CREATE TABLE cameras (
    camera_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    ip_address CHARACTER VARYING,
    resolution CHARACTER VARYING,
    status CHARACTER VARYING
);

CREATE TABLE zones (
    zone_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    zone_name CHARACTER VARYING,
    sort_order INTEGER,
    color CHARACTER VARYING,
    zone_status CHARACTER VARYING,
    x1_pct DOUBLE PRECISION,
    y1_pct DOUBLE PRECISION,
    x2_pct DOUBLE PRECISION,
    y2_pct DOUBLE PRECISION,
    skew_x DOUBLE PRECISION DEFAULT 0,
    skew_y DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE automation_schedules (
    schedule_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    user_id INTEGER REFERENCES users(user_id),
    schedule_name CHARACTER VARYING,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE
);

CREATE TABLE ac_controls (
    ac_control_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    device_id INTEGER REFERENCES iot_devices(device_id),
    temperature_setting DOUBLE PRECISION,
    ac_status CHARACTER VARYING,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE light_controls (
    control_id INTEGER PRIMARY KEY,
    zone_id INTEGER REFERENCES zones(zone_id),
    device_id INTEGER REFERENCES iot_devices(device_id),
    relay_channel INTEGER,
    light_status CHARACTER VARYING,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE detection_logs (
    detection_id INTEGER PRIMARY KEY,
    zone_id INTEGER REFERENCES zones(zone_id),
    camera_id INTEGER REFERENCES cameras(camera_id),
    occupancy_count INTEGER,
    zone_status CHARACTER VARYING,
    detection_time TIMESTAMP WITH TIME ZONE
);

CREATE TABLE energy_logs (
    log_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    date DATE,
    total_watts DOUBLE PRECISION,
    saved_watts DOUBLE PRECISION
);

CREATE TABLE power_sensors (
    sensor_id INTEGER PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(room_id),
    power_watts DOUBLE PRECISION,
    voltage_v DOUBLE PRECISION,
    current_a DOUBLE PRECISION,
    read_at TIMESTAMP WITH TIME ZONE
);