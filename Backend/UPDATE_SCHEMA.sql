USE revticket_db;

-- Add new columns to screens table (ignore errors if columns exist)
ALTER TABLE screens ADD COLUMN `rows` INT;
ALTER TABLE screens ADD COLUMN seats_per_row INT;

-- Create seat_categories table
CREATE TABLE IF NOT EXISTS seat_categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DOUBLE NOT NULL,
    color VARCHAR(50) NOT NULL,
    screen_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- Create seat_data table
CREATE TABLE IF NOT EXISTS seat_data (
    seat_id VARCHAR(255) PRIMARY KEY,
    label VARCHAR(50) NOT NULL,
    row INT NOT NULL,
    col INT NOT NULL,
    category_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    screen_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- Add is_active column to users (ignore error if exists)
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
