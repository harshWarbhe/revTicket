-- ============================================
-- Create Admin User for RevTicket
-- ============================================

USE revticket_db;

-- Insert admin user (Password: Admin@123)
INSERT INTO users (id, email, name, password, role, is_active, created_at) 
VALUES (
    UUID(),
    'admin@revticket.com',
    'Admin User',
    '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', 
    'ADMIN',
    true,
    NOW()
);

-- Verify
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'admin@revticket.com';

-- ============================================