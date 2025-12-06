# RevTicket Docker Setup Guide

## Overview
This project uses Docker and Docker Compose to containerize the entire application stack including:
- MySQL Database (Port 3306)
- MongoDB Database (Port 27017)
- Spring Boot Backend (Port 8080)
- Angular Frontend (Port 80)

## Prerequisites
- Docker Desktop installed
- Docker Compose installed
- Ports 80, 8080, 3306, 27017 available

## Quick Start

### Option 1: Docker Volumes (Recommended for Production)
```bash
# Start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services (data persists)
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Option 2: Local Database (For Development)
1. Edit `docker-compose.yml`
2. Comment out `mysql` and `mongodb` services (lines 8-36)
3. Uncomment OPTION 2 section at the bottom
4. Start your local MySQL and MongoDB
5. Run: `docker-compose up -d --build`

## Access Points
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **MySQL**: localhost:3306
  - Database: `revticket_db`
  - Username: `root`
  - Password: `Admin123`
- **MongoDB**: localhost:27017
  - Database: `revticket_reviews`

## Docker Commands

### Build and Run
```bash
# Build images
docker-compose build

# Start services in background
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# Start specific service
docker-compose up -d backend
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f mongodb
```

### Stop and Remove
```bash
# Stop services (data persists)
docker-compose down

# Stop and remove volumes (delete all data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Manage Containers
```bash
# List running containers
docker-compose ps

# Restart service
docker-compose restart backend

# Execute command in container
docker-compose exec backend sh
docker-compose exec mysql mysql -uroot -pAdmin123
```

## Data Persistence

### Docker Volumes (Current Setup)
- Data stored in Docker volumes: `mysql-data` and `mongo-data`
- Data persists even when containers are stopped
- Data removed only with `docker-compose down -v`

### View Volumes
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect revticket_mysql-data
docker volume inspect revticket_mongo-data

# Remove unused volumes
docker volume prune
```

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :8080
lsof -i :3306
lsof -i :27017

# Kill the process or change port in docker-compose.yml
```

### Database Connection Failed
```bash
# Check if databases are healthy
docker-compose ps

# View database logs
docker-compose logs mysql
docker-compose logs mongodb

# Restart databases
docker-compose restart mysql mongodb
```

### Frontend Can't Connect to Backend
```bash
# Check backend logs
docker-compose logs backend

# Verify network
docker network inspect revticket_revticket-network

# Restart services
docker-compose restart backend frontend
```

### Clean Start
```bash
# Remove everything and start fresh
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## File Structure
```
revTicket/
├── docker-compose.yml          # Orchestrates all services
├── .dockerignore               # Global exclusions
├── Backend/
│   ├── Dockerfile              # Backend container config
│   └── .dockerignore           # Backend exclusions
└── Frontend/
    ├── Dockerfile              # Frontend container config
    └── .dockerignore           # Frontend exclusions
```

## Environment Variables

### Backend (in docker-compose.yml)
- `SPRING_DATASOURCE_URL`: MySQL connection URL
- `SPRING_DATASOURCE_USERNAME`: MySQL username
- `SPRING_DATASOURCE_PASSWORD`: MySQL password
- `SPRING_DATA_MONGODB_URI`: MongoDB connection URI

### MySQL
- `MYSQL_ROOT_PASSWORD`: Root password
- `MYSQL_DATABASE`: Database name

## Production Deployment

### AWS/Cloud Deployment
1. Push images to container registry (ECR, Docker Hub)
2. Use docker-compose.yml as reference for ECS/Kubernetes
3. Update environment variables for production
4. Use managed databases (RDS, DocumentDB) instead of containers

### Build for Production
```bash
# Build optimized images
docker-compose build --no-cache

# Tag images
docker tag revticket-backend:latest your-registry/revticket-backend:v1.0
docker tag revticket-frontend:latest your-registry/revticket-frontend:v1.0

# Push to registry
docker push your-registry/revticket-backend:v1.0
docker push your-registry/revticket-frontend:v1.0
```

## Health Checks
- MySQL: Checks database connectivity every 5 seconds
- MongoDB: Checks database connectivity every 5 seconds
- Backend: Waits for databases to be healthy before starting

## Notes
- First startup may take 2-3 minutes for database initialization
- Backend automatically creates database schema on first run
- Data persists in Docker volumes between restarts
- Use `docker-compose down -v` only if you want to delete all data
