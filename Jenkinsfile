pipeline {
    agent any
    
    environment {
        PATH = "/usr/local/bin:${env.PATH}"
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_CREDENTIALS_ID = 'docker-credentials'
        BACKEND_IMAGE = 'revticket-backend'
        FRONTEND_IMAGE = 'revticket-frontend'
        BUILD_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'latest'}"
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
                    script {
                        if (isUnix()) {
                            sh './mvnw clean package -DskipTests'
                        } else {
                            bat 'mvnw.cmd clean package -DskipTests'
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'Backend/target/*.jar', fingerprint: true
                }
            }
        }
        

        
        stage('Build Frontend') {
            steps {
                dir('Frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm ci && npm run build'
                        } else {
                            bat 'npm ci && npm run build'
                        }
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'Frontend/dist/**/*', fingerprint: true
                }
            }
        }
        

        
        stage('Build Docker Images') {
            parallel {
                stage('Backend Image') {
                    steps {
                        script {
                            dir('Backend') {
                                if (isUnix()) {
                                    sh "docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} -t ${BACKEND_IMAGE}:latest ."
                                } else {
                                    bat "docker build -t ${BACKEND_IMAGE}:${BUILD_TAG} -t ${BACKEND_IMAGE}:latest ."
                                }
                            }
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        script {
                            dir('Frontend') {
                                if (isUnix()) {
                                    sh "docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                } else {
                                    bat "docker build -t ${FRONTEND_IMAGE}:${BUILD_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                }
                            }
                        }
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                branch 'main'
            }
            steps {
                script {
                    docker.withRegistry("https://${DOCKER_REGISTRY}", DOCKER_CREDENTIALS_ID) {
                        if (isUnix()) {
                            sh "docker push ${BACKEND_IMAGE}:${BUILD_TAG} && docker push ${BACKEND_IMAGE}:latest"
                            sh "docker push ${FRONTEND_IMAGE}:${BUILD_TAG} && docker push ${FRONTEND_IMAGE}:latest"
                        } else {
                            bat "docker push ${BACKEND_IMAGE}:${BUILD_TAG} && docker push ${BACKEND_IMAGE}:latest"
                            bat "docker push ${FRONTEND_IMAGE}:${BUILD_TAG} && docker push ${FRONTEND_IMAGE}:latest"
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'docker-compose up -d --build'
                    } else {
                        bat 'docker-compose up -d --build'
                    }
                }
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    timeout(time: 3, unit: 'MINUTES') {
                        waitUntil {
                            script {
                                def status
                                if (isUnix()) {
                                    status = sh(
                                        script: 'curl -s -o /dev/null -w "%{http_code}" http://localhost:8081/actuator/health || echo 000',
                                        returnStdout: true
                                    ).trim()
                                } else {
                                    status = bat(
                                        script: '@curl -s -o nul -w "%%{http_code}" http://localhost:8081/actuator/health || echo 000',
                                        returnStdout: true
                                    ).trim()
                                }
                                return status == '200'
                            }
                        }
                    }
                    echo 'Application is healthy!'
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
            echo "✅ Pipeline completed successfully - Build #${BUILD_NUMBER}"
        }
        failure {
            echo "❌ Pipeline failed - Check logs for details"
            script {
                if (isUnix()) {
                    sh 'docker-compose logs --tail=50 || true'
                } else {
                    bat 'docker-compose logs --tail=50 || exit 0'
                }
            }
        }
        cleanup {
            cleanWs()
        }
    }
}
