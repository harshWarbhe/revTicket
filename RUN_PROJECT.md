# How to Run RevTicket Project

This guide will help you run both the Angular Frontend and Spring Boot Backend.

## Prerequisites

### Required Software:

1. **Java 17+** - [Download](https://www.oracle.com/java/technologies/downloads/)
2. **Maven 3.6+** - [Download](https://maven.apache.org/download.cgi)
3. **Node.js 18+** - [Download](https://nodejs.org/)
4. **MySQL 8.0+** - [Download](https://dev.mysql.com/downloads/mysql/)
5. **Angular CLI** - Install via npm: `npm install -g @angular/cli`

## Step-by-Step Setup

### Step 1: Database Setup

1. **Start MySQL Server**

   ```bash
   # On macOS/Linux
   mysql.server start

   # On Windows, start MySQL service from Services
   ```

2. **Create Database**
   ```bash
   mysql -u root -p
   ```
   Then run:
   ```sql
   CREATE DATABASE revticket_db;
   EXIT;
   ```

### Step 2: Backend Setup (Spring Boot)

1. **Navigate to Backend directory**

   ```bash
   cd Backend
   ```

2. **Configure Database Connection**

   Edit `src/main/resources/application.properties`:

   ```properties
   spring.datasource.username=root
   spring.datasource.password=YOUR_MYSQL_PASSWORD
   ```

   Replace `YOUR_MYSQL_PASSWORD` with your actual MySQL root password.

3. **Build the Project**

   ```bash
   mvn clean install
   ```

4. **Run the Backend**

   ```bash
   mvn spring-boot:run
   ```

   Or if you prefer to run the JAR:

   ```bash
   mvn clean package
   java -jar target/revticket-backend-1.0.0.jar
   ```

5. **Verify Backend is Running**
   - Open browser: `http://localhost:8080/api/movies`
   - You should see an empty array `[]` or JSON response
   - Backend API is now running on port 8080

### Step 3: Frontend Setup (Angular)

1. **Open a NEW terminal window** (keep backend running)

2. **Navigate to Frontend directory**

   ```bash
   cd Frontend
   ```

3. **Install Dependencies**

   ```bash
   npm install
   ```

   This may take a few minutes on first run.

4. **Verify Environment Configuration**

   Check `src/environments/environment.ts`:

   ```typescript
   export const environment = {
     production: false,
     apiUrl: "http://localhost:8080/api", // Should point to Spring Boot
   };
   ```

5. **Run the Frontend**

   ```bash
   ng serve
   ```

   Or using npm:

   ```bash
   npm start
   ```

6. **Access the Application**
   - Open browser: `http://localhost:4200`
   - The Angular app should load

## Quick Start Commands

### Terminal 1 - Backend:

```bash
cd Backend
mvn spring-boot:run
```

### Terminal 2 - Frontend:

```bash
cd Frontend
npm install  # Only needed first time
ng serve
```

## Testing the Application

### 1. Create a User Account

- Go to `http://localhost:4200`
- Click "Sign Up"
- Fill in the form and create an account

### 2. Login

- Use the credentials you just created
- Or use test credentials if you've set them up

### 3. Browse Movies

- The home page should show available movies
- Click on a movie to see details

## Troubleshooting

### Backend Issues

**Port 8080 already in use:**

```bash
# Change port in Backend/src/main/resources/application.properties
server.port=8081
# Then update Frontend environment.ts to match
```

**Database connection error:**

- Verify MySQL is running: `mysql -u root -p`
- Check username/password in `application.properties`
- Ensure database exists: `SHOW DATABASES;`

**Maven build fails:**

- Check Java version: `java -version` (should be 17+)
- Check Maven: `mvn -version`
- Try: `mvn clean install -U`

### Frontend Issues

**Port 4200 already in use:**

```bash
ng serve --port 4201
```

**npm install fails:**

- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**API connection errors:**

- Verify backend is running on port 8080
- Check `environment.ts` has correct API URL
- Check browser console for CORS errors
- Verify backend CORS configuration in `SecurityConfig.java`

**Module not found errors:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Development Mode

### Backend Hot Reload

Spring Boot DevTools is included, so changes will auto-reload.

### Frontend Hot Reload

Angular CLI watches for changes and auto-reloads the browser.

## Production Build

### Backend:

```bash
cd Backend
mvn clean package
# JAR file will be in target/ directory
```

### Frontend:

```bash
cd Frontend
ng build --configuration production
# Build files will be in dist/ directory
```

## Default Ports

- **Backend API:** `http://localhost:8080`
- **Frontend:** `http://localhost:4200`
- **MySQL:** `localhost:3306`

## Next Steps

1. **Create Admin User:**

   - Sign up normally, then update role in database:

   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'your_email@example.com';
   ```

2. **Add Sample Data:**

   - Use the admin panel to add movies, theaters, and showtimes
   - Or insert directly via SQL (see `Backend/src/main/resources/schema.sql`)

3. **Test Booking Flow:**
   - Browse movies → Select showtime → Choose seats → Make payment
