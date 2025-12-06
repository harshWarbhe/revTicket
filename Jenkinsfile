// ============================================
// RevTicket CI/CD Pipeline with Docker
// ============================================
// Prerequisites:
// 1. Jenkins with Docker plugin installed
// 2. Docker installed on Jenkins server
// 3. Docker Hub credentials added to Jenkins (ID: 'dockerhub-credentials')
// 4. GitHub webhook configured for automatic builds
// ============================================

pipeline {
    agent any
    
    environment {
        // Docker Hub Configuration
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USERNAME = 'your-dockerhub-username'  // Change this
        BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/revticket-backend"
        FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/revticket-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {
        
        stage('Checkout') {
            steps {
                echo "Checking out branch: ${BRANCH_NAME}"
                checkout([$class: 'GitSCM',
                    branches: [[name: "*/${BRANCH_NAME}"]],
                    userRemoteConfigs: [[url: 'https://github.com/harshWarbhe/revTicket.git']]
                ])
            }
        }

        stage('Build Backend') {
            steps {
                echo "Building Backend on branch: ${BRANCH_NAME}"
                dir('Backend') {
                    script {
                        if (isUnix()) {
                            sh 'mvn clean package -DskipTests'
                        } else {
                            bat 'mvn clean package -DskipTests'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                echo "Running Backend Tests"
                dir('Backend') {
                    script {
                        if (isUnix()) {
                            sh 'mvn test'
                        } else {
                            bat 'mvn test'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            when { branch 'master' }
            steps {
                script {
                    echo "Building Docker Images..."
                    
                    // Build Backend Image
                    dir('Backend') {
                        backendImage = docker.build("${BACKEND_IMAGE}:${IMAGE_TAG}")
                        docker.build("${BACKEND_IMAGE}:latest")
                    }
                    
                    // Build Frontend Image
                    dir('Frontend') {
                        frontendImage = docker.build("${FRONTEND_IMAGE}:${IMAGE_TAG}")
                        docker.build("${FRONTEND_IMAGE}:latest")
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            when { branch 'master' }
            steps {
                script {
                    echo "Pushing images to Docker Hub..."
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        // Push Backend Images
                        docker.image("${BACKEND_IMAGE}:${IMAGE_TAG}").push()
                        docker.image("${BACKEND_IMAGE}:latest").push()
                        
                        // Push Frontend Images
                        docker.image("${FRONTEND_IMAGE}:${IMAGE_TAG}").push()
                        docker.image("${FRONTEND_IMAGE}:latest").push()
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            when { branch 'master' }
            steps {
                script {
                    echo "Deploying application..."
                    if (isUnix()) {
                        sh 'docker-compose down'
                        sh 'docker-compose up -d --build'
                    } else {
                        bat 'docker-compose down'
                        bat 'docker-compose up -d --build'
                    }
                }
            }
        }

        stage('Archive Artifacts') {
            when { branch 'master' }
            steps {
                archiveArtifacts artifacts: 'Backend/target/*.jar', fingerprint: true
                junit allowEmptyResults: true, testResults: 'Backend/target/surefire-reports/*.xml'
            }
        }
    }

    post {
        always {
            echo "Cleaning up workspace..."
            script {
                // Clean up Docker images to save space
                if (isUnix()) {
                    sh 'docker system prune -f'
                } else {
                    bat 'docker system prune -f'
                }
            }
            cleanWs()
        }
        success {
            echo "✅ Build and Deployment SUCCESS on branch: ${BRANCH_NAME}"
            echo "Backend Image: ${BACKEND_IMAGE}:${IMAGE_TAG}"
            echo "Frontend Image: ${FRONTEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ Build FAILED on branch: ${BRANCH_NAME}"
        }
    }
}

// ============================================
// Setup Instructions:
// ============================================
// 1. Install Jenkins Plugins:
//    - Docker Pipeline
//    - Docker plugin
//    - Git plugin
//
// 2. Add Docker Hub Credentials:
//    Jenkins > Manage Jenkins > Credentials
//    - ID: dockerhub-credentials
//    - Username: your Docker Hub username
//    - Password: your Docker Hub password/token
//
// 3. Configure Jenkins Job:
//    - New Item > Multibranch Pipeline
//    - Branch Sources > Git
//    - Repository URL: https://github.com/harshWarbhe/revTicket.git
//
// 4. GitHub Webhook (Optional):
//    GitHub Repo > Settings > Webhooks
//    - Payload URL: http://your-jenkins-url/github-webhook/
//    - Content type: application/json
//    - Events: Push events
// ============================================
