-- ============================================
-- Create Admin User for RevTicket
-- ============================================

USE revticket_db;

-- Delete existing admin user if exists (optional)
DELETE FROM users WHERE email = 'admin@revticket.com';

-- Insert admin user
-- Password: Admin@123 (BCrypt encoded)
INSERT INTO users (
    id, email, name, password, role, created_at
) VALUES (
    UUID(),
    'admin@revticket.com',
    'Admin User',
    '$2a$10$7U3KBCwRggl3eMil/GYfX.noVD79w5oZbALDag0AM56QniJwLSQa2', 
    'ADMIN', 
    NOW()
);

-- Verify admin user was created
SELECT id, email, name, role, created_at 
FROM users 
WHERE email = 'admin@revticket.com';

-- ============================================
-- Admin User Created Successfully!
-- ============================================
-- Email: admin@revticket.com
-- Password: Admin@123
-- Role: ADMIN
-- ============================================

-- Step 3: Verify the user was created correctly
SELECT 
    id,
    email,
    name,
    role,
    CASE 
        WHEN UPPER(role) = 'ADMIN' THEN '✓ Role is correct'
        ELSE '✗ Role needs fixing'
    END AS role_status,
    CASE 
        WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✓ Password is BCrypt'
        ELSE '✗ Password is NOT BCrypt'
    END AS password_status,
    created_at
FROM users 
WHERE email = 'admin@revticket.com';

-- ============================================