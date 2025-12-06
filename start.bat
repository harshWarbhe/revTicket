@echo off
REM RevTicket Quick Start Script for Windows
setlocal enabledelayedexpansion

echo Starting RevTicket Application...

REM Check if .env exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo Please update .env with your configuration
)

REM Build backend
echo Building Backend...
cd Backend
call mvnw.cmd clean package -DskipTests
cd ..

REM Start Docker containers
echo Starting Docker containers...
docker-compose up -d --build

REM Wait for services
echo Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

echo.
echo RevTicket is running!
echo ========================================
echo Frontend:  http://localhost:4200
echo Backend:   http://localhost:8080
echo MySQL:     localhost:3306
echo MongoDB:   localhost:27017
echo ========================================
echo.
echo Useful commands:
echo    docker-compose logs -f        # View logs
echo    docker-compose ps             # Check status
echo    docker-compose down           # Stop services
echo.
