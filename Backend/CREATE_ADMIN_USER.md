# Create Admin User - Quick Guide

## Quick Setup

### Option 1: Using SQL Script (Recommended)

```bash
cd Backend
mysql -u root -p revticket_db < CREATE_ADMIN_USER.sql
```

### Option 2: Manual SQL

```bash
mysql -u root -p
```

Then run:

```sql
USE revticket_db;

INSERT INTO users (
    id, email, name, password, role, created_at
) VALUES (
    UUID(),
    'admin@revticket.com',
    'Admin User',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ADMIN',
    NOW()
);
```

## Admin Credentials

- **Email:** `admin@revticket.com`
- **Password:** `admin123`
- **Role:** `ADMIN`

## Verify Admin User

```sql
SELECT id, email, name, role FROM users WHERE email = 'admin@revticket.com';
```

Should return:
```
+--------------------------------------+----------------------+------------+-------+
| id                                   | email                | name        | role  |
+--------------------------------------+----------------------+------------+-------+
| [UUID]                               | admin@revticket.com  | Admin User  | ADMIN |
+--------------------------------------+----------------------+------------+-------+
```

## Create Additional Admin Users

To create another admin user, modify the email and name:

```sql
INSERT INTO users (
    id, email, name, password, role, created_at
) VALUES (
    UUID(),
    'your-admin@example.com',
    'Your Admin Name',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- admin123
    'ADMIN',
    NOW()
);
```

## Convert Existing User to Admin

To make an existing user an admin:

```sql
UPDATE users 
SET role = 'ADMIN' 
WHERE email = 'user@example.com';
```

## Password Hash

The password hash `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` 
corresponds to the plain text password: **admin123**

To generate a new password hash, you can:
1. Use Spring Boot's BCryptPasswordEncoder
2. Use online BCrypt generator
3. Let Spring Boot encode it during signup, then update role to ADMIN

## Security Note

⚠️ **Important:** Change the default admin password in production!

To change password:
1. Login as admin
2. Use the profile update feature
3. Or update directly in database (requires new BCrypt hash)

