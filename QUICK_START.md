# 🚀 RevTicket Quick Start Guide

## ✅ What's Ready

- ✅ Jenkins builds multi-platform images (Mac, Windows, Linux, Ubuntu, EC2)
- ✅ Images automatically pushed to DockerHub
- ✅ EC2 deployment configured

---

## 📝 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
cd /Users/harshwarbhe/Downloads/Project/revTicket

git add .
git commit -m "Configure multi-platform Docker builds"
git push origin main
```

### Step 2: Configure Jenkins (One-Time Setup)

1. **Add DockerHub Credentials**:
   - Jenkins → Manage Jenkins → Credentials → Global → Add Credentials
   - Type: Username with password
   - Username: `harshwarbhe`
   - Password: Your DockerHub password
   - ID: `docker-credentials`

2. **Create Pipeline**:
   - Jenkins → New Item
   - Name: `revticket-pipeline`
   - Type: Pipeline
   - Pipeline from SCM → Git
   - Repository URL: Your GitHub repo
   - Script Path: `Jenkinsfile`
   - Save

3. **Setup Buildx on Jenkins Server** (SSH to Jenkins server):
   ```bash
   docker buildx create --name multiarch-builder --use
   docker run --privileged --rm tonistiigi/binfmt --install all
   docker buildx inspect --bootstrap
   ```

### Step 3: Run Jenkins Build

1. Go to Jenkins → revticket-pipeline
2. Click "Build Now"
3. Wait for build to complete (~5-10 minutes)
4. Verify success message shows images pushed to DockerHub

### Step 4: Setup EC2 (One-Time)

```bash
# SSH to EC2
ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com

# Create project directory
mkdir -p ~/revticket
cd ~/revticket

# Upload docker-compose.yml (from your Mac)
# In a new terminal on Mac:
scp -i ~/Downloads/revticket.pem /Users/harshwarbhe/Downloads/Project/revTicket/docker-compose.yml ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com:~/revticket/

# Upload deployment script
scp -i ~/Downloads/revticket.pem /Users/harshwarbhe/Downloads/Project/revTicket/deploy-ec2.sh ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com:~/revticket/
```

### Step 5: Deploy on EC2

```bash
# On EC2
cd ~/revticket
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### Step 6: Access Application

```bash
# Get EC2 IP
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
```

Open in browser:
- **Frontend**: `http://YOUR-EC2-IP:4200`
- **Backend**: `http://YOUR-EC2-IP:8081`

---

## 🔄 Future Updates

When you make code changes:

1. **Commit and push**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

2. **Jenkins automatically builds and pushes** to DockerHub

3. **Deploy on EC2**:
   ```bash
   ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com
   cd ~/revticket
   ./deploy-ec2.sh
   ```

---

## 📊 Verify Everything Works

### Check Jenkins
- Build status: ✅ Success
- Console output shows: "Images pushed to DockerHub"

### Check DockerHub
```bash
docker buildx imagetools inspect harshwarbhe/revticket-backend:latest
docker buildx imagetools inspect harshwarbhe/revticket-frontend:latest
```
Should show: `linux/amd64` and `linux/arm64`

### Check EC2
```bash
docker-compose ps
```
All services should be "Up" and "healthy"

---

## 🆘 Troubleshooting

### Jenkins Build Fails
- Check Docker credentials in Jenkins
- Verify buildx is installed: `docker buildx ls`

### EC2 Cannot Pull Images
- Login to DockerHub: `docker login`
- Check image exists: `docker pull harshwarbhe/revticket-backend:latest`

### Application Not Accessible
- Check security group ports: 4200, 8081
- Check services: `docker-compose ps`
- Check logs: `docker-compose logs -f`

---

## 📞 Need Help?

- Jenkins logs: Check console output
- EC2 logs: `docker-compose logs -f backend`
- DockerHub: https://hub.docker.com/u/harshwarbhe
