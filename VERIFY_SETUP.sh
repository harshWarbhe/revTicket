#!/bin/bash

# ============================================
# RevTicket - Manage Movies Setup Verification
# ============================================

echo "=========================================="
echo "RevTicket Setup Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check MySQL
echo -n "Checking MySQL connection... "
if mysql -uroot -pAdmin123 -e "USE revticket_db; SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
    echo "  Please ensure MySQL is running and credentials are correct"
fi

# Check movies table
echo -n "Checking movies table... "
MOVIE_COUNT=$(mysql -uroot -pAdmin123 -se "USE revticket_db; SELECT COUNT(*) FROM movies;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Found $MOVIE_COUNT movies${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Check movie_genres table
echo -n "Checking movie_genres table... "
GENRE_COUNT=$(mysql -uroot -pAdmin123 -se "USE revticket_db; SELECT COUNT(*) FROM movie_genres;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Found $GENRE_COUNT genre entries${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Check movie_crew table
echo -n "Checking movie_crew table... "
CREW_COUNT=$(mysql -uroot -pAdmin123 -se "USE revticket_db; SELECT COUNT(*) FROM movie_crew;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Found $CREW_COUNT crew entries${NC}"
else
    echo -e "${RED}✗ Failed${NC}"
fi

# Check rating column type
echo -n "Checking rating column type... "
RATING_TYPE=$(mysql -uroot -pAdmin123 -se "USE revticket_db; SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='movies' AND COLUMN_NAME='rating';" 2>/dev/null)
if [ "$RATING_TYPE" = "double" ]; then
    echo -e "${GREEN}✓ DOUBLE${NC}"
else
    echo -e "${YELLOW}⚠ $RATING_TYPE (expected DOUBLE)${NC}"
fi

# Check director column
echo -n "Checking director column... "
DIRECTOR_EXISTS=$(mysql -uroot -pAdmin123 -se "USE revticket_db; SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='movies' AND COLUMN_NAME='director';" 2>/dev/null)
if [ "$DIRECTOR_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓ Exists${NC}"
else
    echo -e "${RED}✗ Missing${NC}"
fi

echo ""
echo "=========================================="
echo "Service Status"
echo "=========================================="
echo ""

# Check Backend
echo -n "Backend (port 8080)... "
if lsof -i :8080 | grep -q LISTEN; then
    echo -e "${GREEN}✓ Running${NC}"
    # Test API
    echo -n "  Testing API... "
    if curl -s http://localhost:8080/api/movies &> /dev/null; then
        echo -e "${GREEN}✓ Responding${NC}"
    else
        echo -e "${YELLOW}⚠ Not responding${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    echo "  Start with: cd Backend && java -jar target/revticket-backend-1.0.0.jar"
fi

# Check Frontend
echo -n "Frontend (port 4200)... "
if lsof -i :4200 | grep -q LISTEN; then
    echo -e "${GREEN}✓ Running${NC}"
    # Test frontend
    echo -n "  Testing frontend... "
    if curl -s http://localhost:4200 | grep -q "RevTicket"; then
        echo -e "${GREEN}✓ Responding${NC}"
    else
        echo -e "${YELLOW}⚠ Not responding${NC}"
    fi
else
    echo -e "${RED}✗ Not running${NC}"
    echo "  Start with: cd Frontend && ng serve"
fi

echo ""
echo "=========================================="
echo "Sample Data Check"
echo "=========================================="
echo ""

# Show sample movies
echo "Sample movies with ratings and directors:"
mysql -uroot -pAdmin123 -se "
USE revticket_db;
SELECT 
    SUBSTRING(title, 1, 30) as Title,
    rating as Rating,
    SUBSTRING(director, 1, 25) as Director,
    IF(is_active, 'Active', 'Inactive') as Status
FROM movies 
LIMIT 5;
" 2>/dev/null | column -t

echo ""
echo "=========================================="
echo "Access URLs"
echo "=========================================="
echo ""
echo "Frontend:        http://localhost:4200"
echo "Admin Login:     http://localhost:4200/auth/login"
echo "Manage Movies:   http://localhost:4200/admin/manage-movies"
echo "Backend API:     http://localhost:8080/api"
echo ""
echo "=========================================="
echo "Verification Complete"
echo "=========================================="
echo ""

# Final status
if mysql -uroot -pAdmin123 -e "USE revticket_db; SELECT 1;" &> /dev/null && \
   lsof -i :8080 | grep -q LISTEN && \
   lsof -i :4200 | grep -q LISTEN; then
    echo -e "${GREEN}✓ All systems operational!${NC}"
    echo ""
    echo "You can now access the Manage Movies page at:"
    echo "http://localhost:4200/admin/manage-movies"
else
    echo -e "${YELLOW}⚠ Some services are not running${NC}"
    echo ""
    echo "Please check the status above and start missing services."
fi

echo ""
