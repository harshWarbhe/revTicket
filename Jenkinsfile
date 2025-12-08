pipeline {
    agent any
    
    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
        DOCKER_HUB_USERNAME = 'harshwarbhe'
        BACKEND_IMAGE = "${DOCKER_HUB_USERNAME}/revticket-backend"
        FRONTEND_IMAGE = "${DOCKER_HUB_USERNAME}/revticket-frontend"
        BUILD_TAG = "${env.BUILD_NUMBER}"
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('Backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }
        
        stage('Setup Buildx') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'docker buildx create --use --name multiarch-builder || docker buildx use multiarch-builder'
                        sh 'docker run --privileged --rm tonistiigi/binfmt --install all'
                        sh 'docker buildx inspect --bootstrap'
                    }
                }
            }
        }
        
        stage('Build & Push Multi-Platform Images') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        if (isUnix()) {
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                            
                            // Build and push backend
                            dir('Backend') {
                                sh "docker buildx build --platform linux/amd64,linux/arm64 -t ${BACKEND_IMAGE}:${BUILD_TAG} -t ${BACKEND_IMAGE}:latest --push ."
                            }
                            
                            // Build and push frontend
                            dir('Frontend') {
                                sh "docker buildx build --platform linux/amd64,linux/arm64 -t ${FRONTEND_IMAGE}:${BUILD_TAG} -t ${FRONTEND_IMAGE}:latest --push ."
                            }
                        } else {
                            bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                            dir('Backend') {
                                bat "docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} -t ${BACKEND_IMAGE}:latest ."
                            }
                            dir('Frontend') {
                                bat "docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} -t ${FRONTEND_IMAGE}:latest ."
                            }
                        }
                    }
                }
            }
        }
        


        stage('Verify Images Pushed') {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker buildx imagetools inspect ${BACKEND_IMAGE}:latest"
                        sh "docker buildx imagetools inspect ${FRONTEND_IMAGE}:latest"
                    }
                    echo '✅ Multi-platform images successfully pushed to DockerHub!'
                    echo 'Platforms: linux/amd64, linux/arm64'
                    echo ''
                    echo '📦 Images:'
                    echo "   - ${BACKEND_IMAGE}:latest"
                    echo "   - ${BACKEND_IMAGE}:${BUILD_TAG}"
                    echo "   - ${FRONTEND_IMAGE}:latest"
                    echo "   - ${FRONTEND_IMAGE}:${BUILD_TAG}"
                }
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                script {
                    echo ''
                    echo '🚀 Ready to Deploy on EC2!'
                    echo ''
                    echo 'Run these commands on EC2:'
                    echo '  ssh -i "revticket.pem" ubuntu@ec2-3-6-43-162.ap-south-1.compute.amazonaws.com'
                    echo '  cd ~/revticket'
                    echo '  docker-compose pull'
                    echo '  docker-compose up -d'
                    echo '  docker-compose ps'
                    echo ''
                }
            }
        }
    }
    
    post {
        always {
            script {
                if (isUnix()) {
                    sh 'docker system prune -f || true'
                } else {
                    bat 'docker system prune -f || exit 0'
                }
            }
        }
        success {
            echo ''
            echo '========================================'
            echo "✅ Pipeline completed successfully - Build #${BUILD_NUMBER}"
            echo '========================================'
            echo ''
            echo '📦 Images pushed to DockerHub:'
            echo "   - harshwarbhe/revticket-backend:latest"
            echo "   - harshwarbhe/revticket-backend:${BUILD_NUMBER}"
            echo "   - harshwarbhe/revticket-frontend:latest"
            echo "   - harshwarbhe/revticket-frontend:${BUILD_NUMBER}"
            echo ''
            echo '🌍 Platforms: linux/amd64, linux/arm64'
            echo ''
            echo '🚀 Deploy on EC2:'
            echo '   cd ~/revticket && docker-compose pull && docker-compose up -d'
            echo ''
            echo '========================================'
        }
        failure {
            echo ''
            echo '========================================'
            echo "❌ Pipeline failed - Build #${BUILD_NUMBER}"
            echo '========================================'
            echo 'Check Jenkins console output for details'
            echo ''
        }
        cleanup {
            cleanWs()
        }
    }
}
