-- Distributed EV Charging Station & Grid Load Balancing Platform
-- PostgreSQL Database Schema

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS charging_ports CASCADE;
DROP TABLE IF EXISTS charging_stations CASCADE;
DROP TABLE IF EXISTS grid_zones CASCADE;

-- 1. Grid Zones Table
CREATE TABLE grid_zones (
    id BIGSERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    current_load_kw DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    max_capacity_kw DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
);

-- 2. Charging Stations Table
CREATE TABLE charging_stations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    grid_zone_id BIGINT NOT NULL REFERENCES grid_zones(id) ON DELETE CASCADE,
    price_per_kwh DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    total_ports INT NOT NULL DEFAULT 4,
    available_ports INT NOT NULL DEFAULT 4,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    latitude DOUBLE PRECISION DEFAULT 16.5062,
    longitude DOUBLE PRECISION DEFAULT 80.6480
);

-- 3. Charging Ports Table
CREATE TABLE charging_ports (
    id BIGSERIAL PRIMARY KEY,
    station_id BIGINT NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    port_number INT NOT NULL,
    port_type VARCHAR(50) NOT NULL DEFAULT 'CCS2',
    kw_capacity DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
);

-- 4. Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER'
);

-- 5. Vehicles Table
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    battery_capacity_kwh DOUBLE PRECISION NOT NULL DEFAULT 60.0,
    registration_number VARCHAR(50) NOT NULL UNIQUE
);

-- 6. Charging Sessions Table
CREATE TABLE charging_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    station_id BIGINT NOT NULL,
    port_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    energy_consumed_kwh DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

-- 7. Notifications Table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(30) DEFAULT 'INFO'
);
