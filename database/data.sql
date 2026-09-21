-- Sample Seed Data for EV Charging Platform (Vijayawada Region)

-- 1. Grid Zones Seed Data
INSERT INTO grid_zones (id, zone_name, current_load_kw, max_capacity_kw, status) VALUES
(1, 'Zone 1 - Vijayawada Central', 210.0, 500.0, 'NORMAL'),
(2, 'Zone 2 - Benz Circle Hub', 320.0, 500.0, 'HIGH_LOAD'),
(3, 'Zone 3 - Gollapudi West', 180.0, 500.0, 'NORMAL'),
(4, 'Zone 4 - Auto Nagar Industrial', 260.0, 500.0, 'NORMAL'),
(5, 'Zone 5 - Mangalagiri South', 175.0, 500.0, 'NORMAL');

-- 2. Charging Stations Seed Data (5 Stations)
INSERT INTO charging_stations (id, name, location, grid_zone_id, price_per_kwh, total_ports, available_ports, status, latitude, longitude) VALUES
(1, 'Vijayawada Central EV Station', 'MG Road, Vijayawada Central', 1, 14.50, 6, 4, 'AVAILABLE', 16.5062, 80.6480),
(2, 'Benz Circle EV Charging Hub', 'Near Benz Circle Flyover, Vijayawada', 2, 16.00, 6, 2, 'AVAILABLE', 16.5008, 80.6542),
(3, 'Gollapudi EV Power Station', 'NH65, Gollapudi Bypass, Vijayawada', 3, 11.50, 4, 3, 'AVAILABLE', 16.5412, 80.5821),
(4, 'Auto Nagar EV Fast Station', '100 Feet Road, Auto Nagar, Vijayawada', 4, 13.00, 4, 3, 'AVAILABLE', 16.4950, 80.6720),
(5, 'Mangalagiri EV Station', 'Near AIIMS, Mangalagiri', 5, 10.50, 4, 4, 'AVAILABLE', 16.4410, 80.5580);

-- 3. Charging Ports Seed Data
-- Station 1 (6 Ports)
INSERT INTO charging_ports (id, station_id, port_number, port_type, kw_capacity, status) VALUES
(1, 1, 1, 'CCS2', 60.0, 'OCCUPIED'),
(2, 1, 2, 'CCS2', 60.0, 'OCCUPIED'),
(3, 1, 3, 'Type 2 AC', 22.0, 'AVAILABLE'),
(4, 1, 4, 'Type 2 AC', 22.0, 'AVAILABLE'),
(5, 1, 5, 'CHAdeMO', 50.0, 'AVAILABLE'),
(6, 1, 6, 'CCS2', 60.0, 'AVAILABLE');

-- Station 2 (6 Ports)
INSERT INTO charging_ports (id, station_id, port_number, port_type, kw_capacity, status) VALUES
(7, 2, 1, 'CCS2', 120.0, 'OCCUPIED'),
(8, 2, 2, 'CCS2', 120.0, 'OCCUPIED'),
(9, 2, 3, 'CCS2', 60.0, 'OCCUPIED'),
(10, 2, 4, 'CCS2', 60.0, 'OCCUPIED'),
(11, 2, 5, 'Type 2 AC', 22.0, 'AVAILABLE'),
(12, 2, 6, 'Type 2 AC', 22.0, 'AVAILABLE');

-- Station 3 (4 Ports)
INSERT INTO charging_ports (id, station_id, port_number, port_type, kw_capacity, status) VALUES
(13, 3, 1, 'CCS2', 50.0, 'OCCUPIED'),
(14, 3, 2, 'CCS2', 50.0, 'AVAILABLE'),
(15, 3, 3, 'Type 2 AC', 22.0, 'AVAILABLE'),
(16, 3, 4, 'Type 2 AC', 22.0, 'AVAILABLE');

-- Station 4 (4 Ports)
INSERT INTO charging_ports (id, station_id, port_number, port_type, kw_capacity, status) VALUES
(17, 4, 1, 'CCS2', 60.0, 'OCCUPIED'),
(18, 4, 2, 'CCS2', 60.0, 'AVAILABLE'),
(19, 4, 3, 'Type 2 AC', 22.0, 'AVAILABLE'),
(20, 4, 4, 'CHAdeMO', 50.0, 'AVAILABLE');

-- Station 5 (4 Ports)
INSERT INTO charging_ports (id, station_id, port_number, port_type, kw_capacity, status) VALUES
(21, 5, 1, 'CCS2', 60.0, 'AVAILABLE'),
(22, 5, 2, 'CCS2', 60.0, 'AVAILABLE'),
(23, 5, 3, 'Type 2 AC', 22.0, 'AVAILABLE'),
(24, 5, 4, 'Type 2 AC', 22.0, 'AVAILABLE');

-- 4. Users Seed Data (Pass: password123)
INSERT INTO users (id, username, email, password, full_name, role) VALUES
(1, 'user', 'user@evcharging.com', '$2a$10$e7q9eA/0L7oYxP.1D0vL1.5vO7Z0J5D9J/rP.qg01N3xL1G8Z7J9K', 'Ravi Kumar', 'ROLE_USER'),
(2, 'admin', 'admin@evcharging.com', '$2a$10$e7q9eA/0L7oYxP.1D0vL1.5vO7Z0J5D9J/rP.qg01N3xL1G8Z7J9K', 'Grid Administrator', 'ROLE_ADMIN');

-- 5. Vehicles Seed Data
INSERT INTO vehicles (id, user_id, model, battery_capacity_kwh, registration_number) VALUES
(1, 1, 'Tata Nexon EV Max', 40.5, 'AP16 EV 1001'),
(2, 1, 'MG ZS EV', 50.3, 'AP16 EV 2002');

-- 6. Initial Active & Past Charging Sessions
INSERT INTO charging_sessions (id, user_id, station_id, port_id, start_time, end_time, energy_consumed_kwh, total_cost, status) VALUES
(1, 1, 1, 1, CURRENT_TIMESTAMP - INTERVAL '25 MINUTE', NULL, 14.5, 210.25, 'ACTIVE'),
(2, 1, 3, 13, CURRENT_TIMESTAMP - INTERVAL '2 HOUR', CURRENT_TIMESTAMP - INTERVAL '1 HOUR', 28.0, 322.00, 'COMPLETED');

-- 7. Initial Notifications
INSERT INTO notifications (id, user_id, title, message, timestamp, is_read, type) VALUES
(1, 1, 'Charging Started', 'Your charging session #1 at Vijayawada Central EV Station has started on Port 1.', CURRENT_TIMESTAMP - INTERVAL '25 MINUTE', true, 'SESSION_START'),
(2, 1, 'Charging Completed', 'Session #2 completed. Total energy: 28.0 kWh, Total cost: ₹322.00.', CURRENT_TIMESTAMP - INTERVAL '1 HOUR', false, 'SESSION_STOP');
