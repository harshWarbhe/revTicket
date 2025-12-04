# Email & OAuth2 Setup Guide

## 📧 Email Configuration (Gmail)

### 1. Enable Gmail SMTP

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

### 2. Update Backend Configuration

Edit `Backend/src/main/resources/application.properties`:

```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-16-char-app-password
```

### 3. Test Email

Run the backend and test forgot password:
```bash
POST http://localhost:8080/api/auth/forgot-password
{
  "email": "user@example.com"
}
```

---

## 🔐 Google OAuth2 Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API

### 2. Create OAuth2 Credentials

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized JavaScript origins:
   - `http://localhost:4200`
   - `http://localhost:8080`
5. Add authorized redirect URIs:
   - `http://localhost:4200/auth/login`
   - `http://localhost:8080/login/oauth2/code/google`
6. Copy Client ID and Client Secret

### 3. Update Backend Configuration

Edit `Backend/src/main/resources/application.properties`:

```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

### 4. Update Frontend Configuration

Edit `Frontend/src/app/auth/login/login.component.ts`:

```typescript
loginWithGoogle(): void {
  const clientId = 'YOUR_CLIENT_ID_HERE'; // Add your Google Client ID
  // ... rest of the code
}
```

---

## 🚀 Quick Start

### Backend Setup

1. Install dependencies:
```bash
cd Backend
mvn clean install
```

2. Configure email and OAuth2 in `application.properties`

3. Run the application:
```bash
mvn spring-boot:run
```

### Frontend Setup

1. Install dependencies:
```bash
cd Frontend
npm install
```

2. Update Google Client ID in login component

3. Run the application:
```bash
ng serve
```

---

## 📝 Features Implemented

### Email Features
- ✅ Password reset via email
- ✅ Email notifications
- ✅ HTML email templates (can be enhanced)

### OAuth2 Features
- ✅ Google Sign-In
- ✅ Auto-create user account
- ✅ JWT token generation
- ✅ Seamless login experience

---

## 🔧 Alternative Email Providers

### Using SendGrid

```properties
spring.mail.host=smtp.sendgrid.net
spring.mail.port=587
spring.mail.username=apikey
spring.mail.password=YOUR_SENDGRID_API_KEY
```

### Using AWS SES

```properties
spring.mail.host=email-smtp.us-east-1.amazonaws.com
spring.mail.port=587
spring.mail.username=YOUR_SMTP_USERNAME
spring.mail.password=YOUR_SMTP_PASSWORD
```

---

## 🧪 Testing

### Test Email Sending

```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Test OAuth2 Login

1. Click "Continue with Google" button
2. Select Google account
3. Verify JWT token received
4. Check user created in database

---

## 🛡️ Security Notes

- Never commit credentials to Git
- Use environment variables in production
- Rotate OAuth2 secrets regularly
- Enable rate limiting for email endpoints
- Implement CAPTCHA for production

---

## 📚 Additional Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Spring Boot Mail](https://docs.spring.io/spring-boot/docs/current/reference/html/io.html#io.email)
- [Spring Security OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)

---

**Last Updated:** December 2024
