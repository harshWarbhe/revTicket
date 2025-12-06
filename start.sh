#!/bin/bash

# RevTicket Quick Start Script (macOS/Linux)
set -e

echo "🚀 Starting RevTicket Application..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration"
fi

# Build backend
echo "🔨 Building Backend..."
cd Backend
./mvnw clean package -DskipTests
cd ..

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check health
echo "🏥 Checking application health..."
for i in {1..10}; do
    if curl -s http://localhost:8081/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    echo "   Attempt $i/10..."
    sleep 5
done

echo ""
echo "✨ RevTicket is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend:  http://localhost:4200"
echo "🔧 Backend:   http://localhost:8080"
echo "💾 MySQL:     localhost:3306"
echo "📊 MongoDB:   localhost:27017"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Useful commands:"
echo "   docker-compose logs -f        # View logs"
echo "   docker-compose ps             # Check status"
echo "   docker-compose down           # Stop services"
echo ""
