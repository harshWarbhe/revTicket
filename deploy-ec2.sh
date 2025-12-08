#!/bin/bash
# Automated EC2 Deployment Script
# This script pulls latest images and deploys on EC2

set -e

echo "========================================="
echo "🚀 Deploying RevTicket on EC2"
echo "========================================="

# Navigate to project directory
cd ~/revticket || { echo "❌ Directory ~/revticket not found"; exit 1; }

echo ""
echo "📥 Pulling latest images from DockerHub..."
docker-compose pull

echo ""
echo "🛑 Stopping existing containers..."
docker-compose down

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://${PUBLIC_IP}:4200"
echo "   Backend:  http://${PUBLIC_IP}:8081"
echo ""
echo "📝 View logs:"
echo "   docker-compose logs -f"
echo ""
echo "========================================="
