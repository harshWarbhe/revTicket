# Jenkins CI/CD Setup Guide for RevTicket

## Overview
This guide will help you set up a complete CI/CD pipeline using Jenkins to automatically build, test, and deploy your RevTicket application to Docker.

## Prerequisites

### 1. Install Jenkins
```bash
# On Ubuntu/Debian
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt update
sudo apt install jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins
```

### 2. Install Docker on Jenkins Server
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add Jenkins user to Docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 3. Access Jenkins
- Open browser: `http://localhost:8080`
- Get initial password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
- Install suggested plugins

## Jenkins Configuration

### Step 1: Install Required Plugins
Go to: **Manage Jenkins > Manage Plugins > Available**

Install these plugins:
- ✅ Docker Pipeline
- ✅ Docker plugin
- ✅ Git plugin
- ✅ GitHub plugin
- ✅ Pipeline plugin
- ✅ Credentials Binding plugin

Click **Install without restart**

### Step 2: Configure Docker Hub Credentials

1. Go to: **Manage Jenkins > Manage Credentials**
2. Click **(global)** domain
3. Click **Add Credentials**
4. Fill in:
   - **Kind**: Username with password
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password or access token
   - **ID**: `dockerhub-credentials`
   - **Description**: Docker Hub Credentials
5. Click **Create**

### Step 3: Create Docker Hub Access Token (Recommended)

1. Go to: https://hub.docker.com/settings/security
2. Click **New Access Token**
3. Name: `jenkins-revticket`
4. Copy the token
5. Use this token as password in Jenkins credentials

### Step 4: Update Jenkinsfile

Edit `Jenkinsfile` and change:
```groovy
DOCKERHUB_USERNAME = 'your-dockerhub-username'  // Change to your username
```

### Step 5: Create Jenkins Pipeline Job

#### Option A: Multibranch Pipeline (Recommended)
1. Click **New Item**
2. Enter name: `RevTicket-Pipeline`
3. Select **Multibranch Pipeline**
4. Click **OK**
5. Configure:
   - **Branch Sources**: Add source > Git
   - **Project Repository**: `https://github.com/harshWarbhe/revTicket.git`
   - **Credentials**: Add your GitHub credentials (if private repo)
   - **Behaviors**: Discover branches
   - **Build Configuration**: by Jenkinsfile
   - **Script Path**: `Jenkinsfile`
6. Click **Save**

#### Option B: Pipeline (Single Branch)
1. Click **New Item**
2. Enter name: `RevTicket-Pipeline`
3. Select **Pipeline**
4. Click **OK**
5. Configure:
   - **Pipeline Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/harshWarbhe/revTicket.git`
   - **Branch**: `*/master`
   - **Script Path**: `Jenkinsfile`
6. Click **Save**

## GitHub Webhook Setup (Auto-trigger builds)

### Step 1: Configure Jenkins URL
1. Go to: **Manage Jenkins > Configure System**
2. Find **Jenkins Location**
3. Set **Jenkins URL**: `http://your-server-ip:8080/`
4. Click **Save**

### Step 2: Add Webhook in GitHub
1. Go to your GitHub repository: `https://github.com/harshWarbhe/revTicket`
2. Click **Settings > Webhooks > Add webhook**
3. Configure:
   - **Payload URL**: `http://your-jenkins-url:8080/github-webhook/`
   - **Content type**: `application/json`
   - **Which events**: Just the push event
   - **Active**: ✅ Checked
4. Click **Add webhook**

### Step 3: Test Webhook
1. Make a commit and push to GitHub
2. Jenkins should automatically trigger a build
3. Check webhook deliveries in GitHub Settings

## Pipeline Stages Explained

### 1. Checkout
- Pulls latest code from GitHub
- Runs on all branches

### 2. Build Backend
- Compiles Java code with Maven
- Creates JAR file
- Runs on all branches

### 3. Run Tests
- Executes unit tests
- Generates test reports
- Runs on all branches

### 4. Build Docker Images
- Builds Backend Docker image
- Builds Frontend Docker image
- Tags with build number and 'latest'
- **Only runs on master branch**

### 5. Push to Docker Hub
- Pushes images to Docker Hub registry
- Makes images available for deployment
- **Only runs on master branch**

### 6. Deploy with Docker Compose
- Stops existing containers
- Starts new containers with updated images
- **Only runs on master branch**

### 7. Archive Artifacts
- Saves JAR files
- Saves test reports
- **Only runs on master branch**

## Manual Build Trigger

### From Jenkins UI:
1. Go to your pipeline job
2. Click **Build Now**
3. View build progress in **Build History**
4. Click build number to see **Console Output**

### From Command Line:
```bash
# Trigger build via Jenkins API
curl -X POST http://localhost:8080/job/RevTicket-Pipeline/build \
  --user username:api-token
```

## View Build Results

### Console Output:
1. Click on build number
2. Click **Console Output**
3. View real-time logs

### Docker Images:
```bash
# List local images
docker images | grep revticket

# Check Docker Hub
# Visit: https://hub.docker.com/u/your-username
```

### Running Containers:
```bash
# List running containers
docker ps

# View logs
docker logs revticket-backend
docker logs revticket-frontend
```

## Troubleshooting

### Issue: Docker permission denied
```bash
# Add Jenkins to Docker group
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Verify
sudo -u jenkins docker ps
```

### Issue: Maven not found
```bash
# Install Maven on Jenkins server
sudo apt install maven

# Or configure in Jenkins
# Manage Jenkins > Global Tool Configuration > Maven
```

### Issue: Port already in use
```bash
# Stop existing containers
docker-compose down

# Check ports
netstat -tulpn | grep :8080
netstat -tulpn | grep :80
```

### Issue: Docker Hub push fails
- Verify credentials in Jenkins
- Check Docker Hub token is valid
- Ensure repository exists or is public

### Issue: Build fails on Windows
- Ensure Docker Desktop is running
- Use PowerShell or Git Bash
- Check file paths use correct separators

## Environment-Specific Deployment

### Development Environment
```groovy
// In Jenkinsfile, add stage:
stage('Deploy to Dev') {
    when { branch 'develop' }
    steps {
        sh 'docker-compose -f docker-compose.dev.yml up -d'
    }
}
```

### Production Environment
```groovy
// In Jenkinsfile, add stage:
stage('Deploy to Production') {
    when { branch 'master' }
    steps {
        input message: 'Deploy to Production?', ok: 'Deploy'
        sh 'docker-compose -f docker-compose.prod.yml up -d'
    }
}
```

## Best Practices

### 1. Use Branches
- `master` - Production deployments
- `develop` - Development/staging
- `feature/*` - Feature branches (build only, no deploy)

### 2. Tag Docker Images
- Use build numbers: `revticket-backend:123`
- Use git commit hash: `revticket-backend:abc123`
- Always maintain `latest` tag

### 3. Secrets Management
- Never commit credentials
- Use Jenkins credentials store
- Use environment variables

### 4. Notifications
Add to Jenkinsfile:
```groovy
post {
    success {
        mail to: 'team@example.com',
             subject: "Build Success: ${env.JOB_NAME}",
             body: "Build ${env.BUILD_NUMBER} succeeded"
    }
    failure {
        mail to: 'team@example.com',
             subject: "Build Failed: ${env.JOB_NAME}",
             body: "Build ${env.BUILD_NUMBER} failed"
    }
}
```

## Monitoring

### Jenkins Dashboard
- View build history
- Check success/failure rates
- Monitor build duration

### Docker Stats
```bash
# Monitor container resources
docker stats

# View container logs
docker-compose logs -f
```

## Cleanup

### Remove Old Images
```bash
# Remove unused images
docker image prune -a

# Remove old builds (keep last 10)
docker images | grep revticket | tail -n +11 | awk '{print $3}' | xargs docker rmi
```

### Jenkins Cleanup
- **Manage Jenkins > Manage Old Data**
- Configure **Discard Old Builds** in job settings

## Next Steps

1. ✅ Set up Jenkins and install plugins
2. ✅ Configure Docker Hub credentials
3. ✅ Create pipeline job
4. ✅ Set up GitHub webhook
5. ✅ Test with a commit
6. ✅ Monitor first build
7. ✅ Verify deployment

## Support

For issues:
- Check Jenkins console output
- Review Docker logs
- Verify credentials
- Check network connectivity
- Ensure ports are available

## Additional Resources

- Jenkins Documentation: https://www.jenkins.io/doc/
- Docker Documentation: https://docs.docker.com/
- Docker Hub: https://hub.docker.com/
