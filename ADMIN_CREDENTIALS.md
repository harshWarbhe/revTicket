# Admin Login Credentials

## Static Admin Credentials

Use these credentials to login as admin:

### Admin Account

- **Email:** `admin@revticket.com`
- **Password:** `Admin@123`
- **Role:** `ADMIN`

---

## How to Login as Admin

1. Go to: http://localhost:4200
2. Click "Login"
3. Enter credentials:
   - Email: `admin@revticket.com`
   - Password: `Admin@123`
4. Click "Login"
5. You will be automatically redirected to `/admin/dashboard`

---

## Create Admin User in Database

If admin user doesn't exist, run:

```bash
cd Backend
mysql -u root -p revticket_db < CREATE_ADMIN_USER.sql
```

Or manually:

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

---

## Verify Admin User

```sql
USE revticket_db;
SELECT email, name, role FROM users WHERE email = 'admin@revticket.com';
```

Should show:

```
+----------------------+------------+-------+
| email                | name       | role  |
+----------------------+------------+-------+
| admin@revticket.com  | Admin User | ADMIN |
+----------------------+------------+-------+
```

---

## Notes

- The login page is now static - no special admin UI
- Just enter the admin credentials to login
- System automatically routes to admin dashboard if role is ADMIN
- System routes to user home if role is USER
