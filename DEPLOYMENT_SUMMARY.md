# RevTicket Deployment Summary

## ✅ What's Configured

### Jenkins Pipeline
- ✅ **Builds multi-platform images** (linux/amd64 + linux/arm64)
- ✅ **Pushes to DockerHub** automatically
- ✅ **Tags images** with build number and latest
- ✅ **Verifies push** to registry
- ✅ **Compatible with**: Mac, Windows, Linux, Ubuntu, EC2

### Docker Images on DockerHub
- `harshwarbhe/revticket-backend:latest`
- `harshwarbhe/revticket-backend:<BUILD_NUMBER>`
- `harshwarbhe/revticket-frontend:latest`
- `harshwarbhe/revticket-frontend:<BUILD_NUMBER>`

### EC2 Deployment
- ✅ **docker-compose.yml** configured to pull from DockerHub
- ✅ **Automated deployment script** (deploy-ec2.sh)
- ✅ **Multi-platform support** (automatically pulls correct architecture)

---

## 🚀 Complete Workflow

### 1. Developer Makes Changes (Your Mac)
```bash
cd /Users/harshwarbhe/Downloads/Project/revTicket
# Make code changes
git add .
git commit -m "Your changes"
git push origin main
```

### 2. Jenkins Automatically Builds & Pushes
- Jenkins detects GitHub push
- Builds multi-platform Docker images
- Pushes to DockerHub
- Images available for all platforms

### 3. Deploy on EC2

#### Option A: Manual Deployment
```bash
ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com
cd ~/revticket
docker-compose pull
docker-compose up -d
```

#### Option B: Automated Deployment
```bash
ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com
cd ~/revticket
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

---

## 📋 Files Overview

| File | Purpose |
|------|---------|
| `Jenkinsfile` | CI/CD pipeline - builds & pushes multi-platform images |
| `docker-compose.yml` | Local development (builds from source) |
| `docker-compose.ec2.yml` | EC2 production (pulls from DockerHub) |
| `deploy-ec2.sh` | Automated EC2 deployment script |
| `ec2-deploy.sh` | Initial EC2 setup script |

---

## 🔄 Jenkins Pipeline Stages

1. **Checkout** - Clone repository from GitHub
2. **Setup Buildx** - Configure multi-platform builder
3. **Build & Push Multi-Platform Images** - Build for amd64 & arm64, push to DockerHub
4. **Verify Images Pushed** - Confirm images in registry
5. **Deploy to EC2** - Display deployment instructions

---

## 🌍 Platform Compatibility

| Platform | Architecture | Status |
|----------|-------------|--------|
| Mac M1/M2/M3 | linux/arm64 | ✅ Supported |
| Mac Intel | linux/amd64 | ✅ Supported |
| Windows | linux/amd64 | ✅ Supported |
| Linux | linux/amd64 | ✅ Supported |
| Ubuntu | linux/amd64 | ✅ Supported |
| EC2 (Intel/AMD) | linux/amd64 | ✅ Supported |
| EC2 (ARM/Graviton) | linux/arm64 | ✅ Supported |

---

## 🔧 Quick Commands

### Check Images on DockerHub
```bash
docker buildx imagetools inspect harshwarbhe/revticket-backend:latest
docker buildx imagetools inspect harshwarbhe/revticket-frontend:latest
```

### EC2 Management
```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update to latest
docker-compose pull && docker-compose up -d
```

### Jenkins
- **URL**: http://localhost:8080
- **Pipeline**: revticket-pipeline
- **Credentials ID**: docker-credentials

---

## ✅ Verification Checklist

- [ ] Jenkins pipeline runs successfully
- [ ] Images pushed to DockerHub
- [ ] Multi-platform support verified
- [ ] EC2 can pull images
- [ ] Application running on EC2
- [ ] Frontend accessible at http://EC2-IP:4200
- [ ] Backend accessible at http://EC2-IP:8081

---

## 🆘 Troubleshooting

### Jenkins Build Fails
```bash
# On Jenkins server
docker buildx ls
docker buildx inspect --bootstrap
```

### EC2 Cannot Pull Images
```bash
# On EC2
docker login
docker-compose pull
```

### Check Application Health
```bash
# On EC2
docker-compose ps
docker-compose logs -f backend
curl http://localhost:8081/actuator/health
```

---

## 📞 Support

- Jenkins Console: Check build logs
- DockerHub: https://hub.docker.com/u/harshwarbhe
- EC2 Logs: `docker-compose logs -f`
