-- Crane Safety Monitoring Database Schema

-- Users table (login with username + password)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'viewer')),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cranes table
CREATE TABLE IF NOT EXISTS cranes (
    id SERIAL PRIMARY KEY,
    crane_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    operator_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zones table
CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    zone_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL CHECK (zone_type IN ('Red Zone', 'Yellow Zone', 'Green Zone')),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    shift_manager VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (name, start_time, end_time)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('red', 'yellow')),
    timestamp TIMESTAMP NOT NULL,
    crane_id VARCHAR(255) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    motion_type VARCHAR(50) NOT NULL CHECK (motion_type IN ('CT', 'LT')),
    shift_id INTEGER REFERENCES shifts(id),
    operator VARCHAR(255),
    ai_confidence_score DECIMAL(5, 2),
    image_reference VARCHAR(500),
    remarks TEXT,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'warning')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_crane_id ON events(crane_id);
CREATE INDEX IF NOT EXISTS idx_events_shift_id ON events(shift_id);
CREATE INDEX IF NOT EXISTS idx_events_operator ON events(operator);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_cranes_crane_id ON cranes(crane_id);
CREATE INDEX IF NOT EXISTS idx_operators_operator_id ON operators(operator_id);
CREATE INDEX IF NOT EXISTS idx_zones_zone_id ON zones(zone_id);

-- Note: Default users should be created using the seed script (scripts/seed-users.js)
-- Run: node scripts/seed-users.js after migration

-- Insert default shifts (idempotent)
INSERT INTO shifts (name, start_time, end_time, shift_manager) VALUES
('Morning Shift', '06:00:00', '14:00:00', 'Manager A'),
('Afternoon Shift', '14:00:00', '22:00:00', 'Manager B'),
('Night Shift', '22:00:00', '06:00:00', 'Manager C')
ON CONFLICT (name, start_time, end_time) DO NOTHING;

