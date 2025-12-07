# RevTicket Setup Guide

## Prerequisites
- Java 17+
- Maven
- Docker & Docker Compose
- Jenkins (for CI/CD)

## Local Development

### Quick Start

```bash
cd Backend
./mvnw clean package -DskipTests
cd ..
docker-compose up --build
```

### Port Configuration

- **Backend API**: http://localhost:8081 (container port 8080 mapped to host 8081)
- **Frontend**: http://localhost:4200
- **MySQL**: localhost:3307 (container port 3306 mapped to host 3307)
- **MongoDB**: localhost:27018 (container port 27017 mapped to host 27018)
- **Jenkins**: http://localhost:8080 (no conflict with backend)

Note: Backend uses host port 8081 to avoid conflict with Jenkins running on port 8080.

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f backend
```

## CI/CD Pipeline

### Jenkins Setup

1. **Install Jenkins plugins:**
   - Docker Pipeline
   - Git
   - Maven Integration

2. **Configure Docker credentials:**
   - Go to Jenkins → Credentials
   - Add Docker Hub credentials with ID: `docker-credentials`

3. **Create Pipeline:**
   - New Item → Pipeline
   - Pipeline script from SCM
   - Repository URL: your-github-repo
   - Script Path: `Jenkinsfile`

### Pipeline Stages

1. **Checkout** - Clone repository
2. **Build** - Compile with Maven
3. **Test** - Run unit tests
4. **Build Docker Image** - Create container image
5. **Push to Registry** - Push to Docker Hub
6. **Deploy** - Deploy with docker-compose

## Database Configuration

Databases run in Docker containers with persistent volumes:
- MySQL: `mysql_data` volume
- MongoDB: `mongo_data` volume

Default credentials (change in production):
- MySQL: root/Admin123
- MongoDB: No authentication

## Troubleshooting

### Port Already in Use
```bash
docker-compose down
# Backend runs on 8081, MySQL on 3307, Jenkins on 8080
lsof -ti:8081 | xargs kill -9
lsof -ti:3307 | xargs kill -9
```

### Database Connection Issues
```bash
docker-compose logs mysql
docker-compose logs mongodb
```

### Rebuild Everything
```bash
docker-compose down -v
docker-compose up --build
```
