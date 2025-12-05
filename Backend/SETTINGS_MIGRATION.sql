-- Settings Table Migration
USE revticket_db;

CREATE TABLE IF NOT EXISTS settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(255),
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('siteName', 'RevTicket', 'Application name'),
('siteEmail', 'support@revticket.com', 'Support email address'),
('sitePhone', '+91 1234567890', 'Support phone number'),
('currency', 'INR', 'Default currency'),
('timezone', 'Asia/Kolkata', 'Default timezone'),
('bookingCancellationHours', '2', 'Hours before showtime to allow cancellation'),
('convenienceFeePercent', '5.0', 'Convenience fee percentage'),
('gstPercent', '18.0', 'GST percentage'),
('maxSeatsPerBooking', '10', 'Maximum seats per booking'),
('enableNotifications', 'true', 'Master notification toggle'),
('enableEmailNotifications', 'true', 'Email notifications toggle'),
('enableSMSNotifications', 'false', 'SMS notifications toggle'),
('maintenanceMode', 'false', 'Maintenance mode toggle')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

SELECT 'Settings table created and initialized successfully!' as message;
