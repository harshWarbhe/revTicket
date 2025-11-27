-- ============================================
-- Online Movie Ticket Booking System Database
-- ============================================

CREATE DATABASE IF NOT EXISTS revticket_db;
USE revticket_db;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS booked_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS screens;
DROP TABLE IF EXISTS theaters;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS users;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address VARCHAR(500),
    role ENUM('USER', 'ADMIN') DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- User Preferences Table
-- ============================================
CREATE TABLE user_preferences (
    preference_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    preferred_language VARCHAR(50) DEFAULT 'english',
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    favorite_genres VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Movies Table
-- ============================================
CREATE TABLE movies (
    movie_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    language VARCHAR(50),
    duration_minutes INT NOT NULL,
    release_date DATE,
    rating VARCHAR(10),
    director VARCHAR(100),
    cast TEXT,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_genre (genre),
    INDEX idx_release_date (release_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Theaters Table
-- ============================================
CREATE TABLE theaters (
    theater_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(10),
    phone_number VARCHAR(15),
    email VARCHAR(100),
    facilities TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_city (city),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Screens Table
-- ============================================
CREATE TABLE screens (
    screen_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    theater_id BIGINT NOT NULL,
    screen_name VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL,
    screen_type VARCHAR(50),
    sound_system VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (theater_id) REFERENCES theaters(theater_id) ON DELETE CASCADE,
    INDEX idx_theater (theater_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Showtimes Table
-- ============================================
CREATE TABLE showtimes (
    showtime_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    movie_id BIGINT NOT NULL,
    screen_id BIGINT NOT NULL,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    price_standard DECIMAL(10, 2) NOT NULL,
    price_premium DECIMAL(10, 2),
    available_seats INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
    FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE,
    INDEX idx_movie (movie_id),
    INDEX idx_screen (screen_id),
    INDEX idx_show_date (show_date),
    INDEX idx_show_datetime (show_date, show_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Bookings Table
-- ============================================
CREATE TABLE bookings (
    booking_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    showtime_id BIGINT NOT NULL,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    total_seats INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_showtime (showtime_id),
    INDEX idx_booking_ref (booking_reference),
    INDEX idx_booking_status (booking_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Booked Seats Table
-- ============================================
CREATE TABLE booked_seats (
    booked_seat_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    seat_type ENUM('STANDARD', 'PREMIUM') DEFAULT 'STANDARD',
    seat_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    UNIQUE KEY unique_booking_seat (booking_id, seat_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Payments Table
-- ============================================
CREATE TABLE payments (
    payment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id BIGINT NOT NULL,
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET') NOT NULL,
    payment_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_booking (booking_id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
