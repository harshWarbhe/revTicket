#!/bin/bash
# RevTicket EC2 Deployment Script

set -e

echo "========================================="
echo "RevTicket EC2 Deployment"
echo "========================================="

# Update system
echo "Updating system packages..."
sudo yum update -y || sudo apt-get update -y

# Install Docker
echo "Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo yum install -y docker || sudo apt-get install -y docker.io
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
echo "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Java 17
echo "Installing Java 17..."
if ! command -v java &> /dev/null; then
    sudo yum install -y java-17-amazon-corretto-devel || sudo apt-get install -y openjdk-17-jdk
fi

# Install Maven
echo "Installing Maven..."
if ! command -v mvn &> /dev/null; then
    sudo yum install -y maven || sudo apt-get install -y maven
fi

# Install Git
echo "Installing Git..."
if ! command -v git &> /dev/null; then
    sudo yum install -y git || sudo apt-get install -y git
fi

# Clone or pull repository
if [ ! -d "revTicket" ]; then
    echo "Cloning repository..."
    read -p "Enter GitHub repository URL: " REPO_URL
    git clone $REPO_URL revTicket
    cd revTicket
else
    echo "Updating repository..."
    cd revTicket
    git pull
fi

# Setup environment
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=Admin123
MYSQL_DATABASE=revticket
MYSQL_PORT=3307

MONGODB_PORT=27018

# Application Configuration
BACKEND_PORT=8081
FRONTEND_PORT=4200

# Production Settings
SPRING_PROFILES_ACTIVE=prod
EOF
fi

# Build backend
echo "Building backend..."
cd Backend
./mvnw clean package -DskipTests
cd ..

# Configure firewall
echo "Configuring security group ports..."
echo "Ensure these ports are open in EC2 Security Group:"
echo "  - 8081 (Backend API)"
echo "  - 4200 (Frontend)"
echo "  - 3307 (MySQL - optional, for external access)"
echo "  - 27018 (MongoDB - optional, for external access)"

# Start application
echo "Starting application with Docker Compose..."
sudo docker-compose -f docker-compose.prod.yml down -v
sudo docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services
echo "Waiting for services to start..."
sleep 30

# Check status
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
sudo docker-compose -f docker-compose.prod.yml ps

echo ""
echo "Application URLs:"
echo "  Frontend:  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4200"
echo "  Backend:   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8081"
echo ""
echo "Useful commands:"
echo "  sudo docker-compose -f docker-compose.prod.yml logs -f        # View logs"
echo "  sudo docker-compose -f docker-compose.prod.yml ps             # Check status"
echo "  sudo docker-compose -f docker-compose.prod.yml restart        # Restart services"
echo "  sudo docker-compose -f docker-compose.prod.yml down           # Stop services"
echo ""
echo "Note: If you see permission errors, logout and login again for Docker group changes to take effect"
