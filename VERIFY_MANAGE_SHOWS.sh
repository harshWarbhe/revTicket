#!/bin/bash

# ============================================
# Manage Shows - Verification Script
# ============================================
# This script verifies that all changes are
# properly implemented and the application
# is ready to run.
# ============================================

echo "🔍 Verifying Manage Shows Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAILED++))
        return 1
    fi
}

# Function to check if string exists in file
check_content() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found in $1: $3"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} Not found in $1: $3"
        ((FAILED++))
        return 1
    fi
}

echo "📁 Checking Backend Files..."
echo "─────────────────────────────────────────"

# Check backend files
check_file "Backend/src/main/java/com/revticket/controller/AdminShowtimeController.java"
check_file "Backend/src/main/java/com/revticket/service/ShowtimeService.java"
check_file "Backend/src/main/java/com/revticket/repository/ShowtimeRepository.java"

echo ""
echo "🔍 Checking Backend Implementation..."
echo "─────────────────────────────────────────"

# Check backend implementation
check_content "Backend/src/main/java/com/revticket/controller/AdminShowtimeController.java" \
    "search" "Search parameter in controller"

check_content "Backend/src/main/java/com/revticket/controller/AdminShowtimeController.java" \
    "toggleStatus" "Toggle status endpoint"

check_content "Backend/src/main/java/com/revticket/service/ShowtimeService.java" \
    "getShowtimesWithFilters" "Unified filter method"

check_content "Backend/src/main/java/com/revticket/service/ShowtimeService.java" \
    "toggleShowtimeStatus" "Toggle status method"

check_content "Backend/src/main/java/com/revticket/repository/ShowtimeRepository.java" \
    "findByTheaterIdAndShowDateBetween" "Theater date filter method"

check_content "Backend/src/main/java/com/revticket/repository/ShowtimeRepository.java" \
    "findByShowDateTimeBetween" "Date range filter method"

echo ""
echo "📁 Checking Frontend Files..."
echo "─────────────────────────────────────────"

# Check frontend files
check_file "Frontend/src/app/core/services/showtime.service.ts"
check_file "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.ts"
check_file "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.html"
check_file "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.css"

echo ""
echo "🔍 Checking Frontend Implementation..."
echo "─────────────────────────────────────────"

# Check frontend implementation
check_content "Frontend/src/app/core/services/showtime.service.ts" \
    "toggleShowtimeStatus" "Toggle status service method"

check_content "Frontend/src/app/core/services/showtime.service.ts" \
    "search" "Search parameter in service"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.ts" \
    "debounceTime" "Debounced search implementation"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.ts" \
    "takeUntilDestroyed" "Proper cleanup implementation"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.ts" \
    "toggleShowStatus" "Toggle status component method"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.ts" \
    "setupSearchDebounce" "Search debounce setup"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.html" \
    "onSearchChange" "Search change handler in template"

check_content "Frontend/src/app/admin/pages/manage-shows/manage-shows.component.html" \
    "toggleShowStatus" "Toggle status button in template"

echo ""
echo "📁 Checking Documentation Files..."
echo "─────────────────────────────────────────"

# Check documentation files
check_file "README_MANAGE_SHOWS_INTEGRATION.md"
check_file "MANAGE_SHOWS_TEST_GUIDE.md"
check_file "MANAGE_SHOWS_CHANGES_SUMMARY.md"
check_file "MANAGE_SHOWS_QUICK_START.md"
check_file "Backend/MANAGE_SHOWS_VERIFICATION.sql"

echo ""
echo "════════════════════════════════════════"
echo "📊 Verification Results"
echo "════════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "1. Rebuild backend: cd Backend && mvn clean install"
    echo "2. Restart backend: java -jar target/revticket-backend-1.0.0.jar"
    echo "3. Rebuild frontend: cd Frontend && npm run build"
    echo "4. Start frontend: npm start"
    echo "5. Navigate to: http://localhost:4200/admin/manage-shows"
    echo ""
    echo "📚 Documentation:"
    echo "- Quick Start: MANAGE_SHOWS_QUICK_START.md"
    echo "- Full Guide: README_MANAGE_SHOWS_INTEGRATION.md"
    echo "- Test Guide: MANAGE_SHOWS_TEST_GUIDE.md"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo ""
    echo "Please review the failed checks above and ensure all files are properly updated."
    echo ""
    exit 1
fi
