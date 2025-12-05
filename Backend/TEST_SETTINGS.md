# Settings API Testing Guide

## Prerequisites
- Backend running on http://localhost:8080
- Database with settings table populated
- Admin user credentials for protected endpoints

## Test 1: Get Settings (Public)
```bash
curl -X GET http://localhost:8080/api/settings
```

**Expected Response:**
```json
{
  "siteName": "RevTicket",
  "siteEmail": "support@revticket.com",
  "sitePhone": "+91 1234567890",
  "currency": "INR",
  "timezone": "Asia/Kolkata",
  "bookingCancellationHours": 2,
  "convenienceFeePercent": 5.0,
  "gstPercent": 18.0,
  "maxSeatsPerBooking": 10,
  "enableNotifications": true,
  "enableEmailNotifications": true,
  "enableSMSNotifications": false,
  "maintenanceMode": false
}
```

## Test 2: Update Settings (Admin Only)

### Step 1: Login as Admin
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@revticket.com",
    "password": "admin123"
  }'
```

**Save the token from response**

### Step 2: Update Settings
```bash
curl -X PUT http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "MyTickets",
    "siteEmail": "support@mytickets.com",
    "sitePhone": "+91 9876543210",
    "currency": "USD",
    "timezone": "America/New_York",
    "bookingCancellationHours": 4,
    "convenienceFeePercent": 7.5,
    "gstPercent": 20.0,
    "maxSeatsPerBooking": 8,
    "enableNotifications": true,
    "enableEmailNotifications": true,
    "enableSMSNotifications": true,
    "maintenanceMode": false
  }'
```

**Expected Response:**
```json
{
  "siteName": "MyTickets",
  "siteEmail": "support@mytickets.com",
  ...
}
```

## Test 3: Verify Booking with Max Seats

### Try booking more than max seats
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "showtimeId": "some-showtime-id",
    "seats": ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"],
    "totalAmount": 1800,
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "customerPhone": "1234567890"
  }'
```

**Expected Response (if max is 8):**
```json
{
  "error": "Maximum 8 seats can be booked at once"
}
```

## Test 4: Verify Cancellation Window

### Try canceling booking within cancellation window
```bash
curl -X POST http://localhost:8080/api/bookings/{bookingId}/request-cancellation \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Change of plans"
  }'
```

**Expected Response (if within window):**
```json
{
  "status": "CANCELLATION_REQUESTED",
  ...
}
```

**Expected Response (if outside window):**
```json
{
  "error": "Cancellation not allowed. Must cancel at least 4 hours before showtime"
}
```

## Test 5: Enable Maintenance Mode

```bash
curl -X PUT http://localhost:8080/api/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "siteName": "RevTicket",
    "siteEmail": "support@revticket.com",
    "sitePhone": "+91 1234567890",
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "bookingCancellationHours": 2,
    "convenienceFeePercent": 5.0,
    "gstPercent": 18.0,
    "maxSeatsPerBooking": 10,
    "enableNotifications": true,
    "enableEmailNotifications": true,
    "enableSMSNotifications": false,
    "maintenanceMode": true
  }'
```

**Then visit frontend**: http://localhost:4200
- Should redirect to maintenance page
- Admin should still access admin panel

## Database Verification

```sql
-- Check settings in database
USE revticket_db;
SELECT * FROM settings;

-- Update a setting directly
UPDATE settings SET setting_value = 'false' WHERE setting_key = 'maintenanceMode';

-- Check cache invalidation (settings should reload)
```

## Frontend Testing

1. **Open browser**: http://localhost:4200
2. **Login as admin**: admin@revticket.com / admin123
3. **Navigate to**: http://localhost:4200/admin/settings
4. **Change currency** to USD
5. **Save settings**
6. **Navigate to user pages** and verify $ symbol everywhere
7. **Change max seats** to 5
8. **Try booking 6 seats** - should show error
9. **Enable maintenance mode**
10. **Logout and try accessing user pages** - should show maintenance page
11. **Login as admin** - should still access admin panel

## Success Criteria

✅ Settings API returns correct data
✅ Admin can update settings
✅ Cache invalidates on update
✅ Max seats enforced in booking
✅ Cancellation window enforced
✅ Currency symbol updates everywhere
✅ Fee percentages apply correctly
✅ Maintenance mode blocks users
✅ Maintenance mode allows admins
✅ Email notifications sent when enabled
✅ Email notifications not sent when disabled

## Common Issues

### Issue: Settings not updating
**Solution**: Check cache configuration, restart backend

### Issue: Maintenance mode not working
**Solution**: Clear browser cache, verify guard is applied

### Issue: Currency not updating
**Solution**: Verify settings service is injected in components

### Issue: Email not sending
**Solution**: Check email configuration in application.properties
