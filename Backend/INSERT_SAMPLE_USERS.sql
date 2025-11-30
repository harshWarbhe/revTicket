-- ============================================
-- Insert Sample Users for Testing
-- ============================================

USE revticket_db;

-- Insert sample users (Password for all: User@123)
INSERT INTO users (id, email, name, password, phone, role, is_active, created_at) VALUES
(UUID(), 'john.doe@example.com', 'John Doe', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543210', 'USER', true, NOW()),
(UUID(), 'jane.smith@example.com', 'Jane Smith', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543211', 'USER', true, NOW()),
(UUID(), 'mike.wilson@example.com', 'Mike Wilson', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543212', 'USER', true, NOW()),
(UUID(), 'sarah.johnson@example.com', 'Sarah Johnson', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543213', 'ADMIN', true, NOW()),
(UUID(), 'david.brown@example.com', 'David Brown', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543214', 'USER', false, NOW()),
(UUID(), 'emily.davis@example.com', 'Emily Davis', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543215', 'USER', true, NOW()),
(UUID(), 'robert.miller@example.com', 'Robert Miller', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543216', 'USER', true, NOW()),
(UUID(), 'lisa.anderson@example.com', 'Lisa Anderson', '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', '9876543217', 'USER', false, NOW());

-- Verify users were created
SELECT id, email, name, phone, role, is_active, created_at 
FROM users 
ORDER BY created_at DESC;

-- ============================================
-- Sample Users Created!
-- ============================================
-- All passwords: User@123
-- ============================================
