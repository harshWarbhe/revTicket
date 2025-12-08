# Jenkins CI/CD Deployment Guide

## Step 1: Setup Jenkins Server

### Install Required Tools on Jenkins Server

```bash
# Install Docker
sudo yum install -y docker || sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker jenkins

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Setup Docker Buildx for multi-platform builds
docker buildx install
docker buildx create --name multiarch-builder --use
docker run --privileged --rm tonistiigi/binfmt --install all
docker buildx inspect --bootstrap

# Restart Jenkins
sudo systemctl restart jenkins
```

## Step 2: Configure Jenkins

### Add DockerHub Credentials

1. Go to Jenkins → Manage Jenkins → Credentials
2. Click "Global" → "Add Credentials"
3. Select "Username with password"
4. Enter:
   - **Username**: `harshwarbhe`
   - **Password**: Your DockerHub password/token
   - **ID**: `docker-credentials`
5. Click "Create"

### Create Pipeline Job

1. Jenkins Dashboard → New Item
2. Enter name: `revticket-pipeline`
3. Select "Pipeline"
4. Click "OK"

### Configure Pipeline

1. Under "Pipeline" section:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: Your GitHub repo URL
   - **Branch**: `*/main` or `*/master`
   - **Script Path**: `Jenkinsfile`
2. Click "Save"

## Step 3: Commit and Push Updated Jenkinsfile

On your Mac:

```bash
cd /Users/harshwarbhe/Downloads/Project/revTicket

# Add and commit changes
git add Jenkinsfile docker-compose.ec2.yml
git commit -m "Add multi-platform Docker build support"
git push origin main
```

## Step 4: Run Jenkins Pipeline

1. Go to Jenkins → revticket-pipeline
2. Click "Build Now"
3. Watch the build progress

### Pipeline Stages:
1. ✅ Checkout - Clone repository
2. ✅ Setup Buildx - Configure multi-platform builder
3. ✅ Build & Push Multi-Platform Images - Build for linux/amd64 and linux/arm64
4. ✅ Deploy to EC2 - Instructions displayed
5. ✅ Health Check - Skipped (manual EC2 deployment)

## Step 5: Deploy on EC2

After Jenkins build completes successfully:

### SSH to EC2:

```bash
ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com
```

### Deploy Application:

```bash
cd ~/revticket

# Pull latest images from DockerHub
docker-compose pull

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Get Application URL:

```bash
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
```

Access:
- **Frontend**: `http://YOUR-EC2-IP:4200`
- **Backend**: `http://YOUR-EC2-IP:8081`

## Step 6: Verify Multi-Platform Support

```bash
docker buildx imagetools inspect harshwarbhe/revticket-backend:latest
docker buildx imagetools inspect harshwarbhe/revticket-frontend:latest
```

You should see:
- `linux/amd64` - For Windows, Linux, Ubuntu, EC2
- `linux/arm64` - For Mac M1/M2/M3

## Continuous Deployment Workflow

1. **Make code changes** on your Mac
2. **Commit and push** to GitHub
3. **Jenkins automatically builds** multi-platform images
4. **Images pushed** to DockerHub
5. **SSH to EC2** and run:
   ```bash
   cd ~/revticket
   docker-compose pull
   docker-compose up -d
   ```

## Troubleshooting

### Jenkins Build Fails

```bash
# On Jenkins server
docker buildx ls
docker buildx inspect --bootstrap
```

### EC2 Pull Fails

```bash
# On EC2
docker login
docker-compose pull
```

### Check Logs

```bash
# Jenkins
cat /var/log/jenkins/jenkins.log

# EC2
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Auto-Deploy to EC2 (Optional)

To automatically deploy to EC2 after Jenkins build, add SSH credentials to Jenkins and update the "Deploy to EC2" stage in Jenkinsfile.
