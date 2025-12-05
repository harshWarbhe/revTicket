@echo off
echo Starting MongoDB...
echo.

REM Check if MongoDB service exists
sc query MongoDB >nul 2>&1
if %errorlevel% equ 0 (
    echo MongoDB service found. Starting...
    net start MongoDB
    echo.
    echo MongoDB is running!
    echo Connection: mongodb://localhost:27017/revticket_reviews
) else (
    echo MongoDB service not found!
    echo.
    echo Please install MongoDB from: https://www.mongodb.com/try/download/community
    echo Or start MongoDB manually with: mongod
)

echo.
pause
