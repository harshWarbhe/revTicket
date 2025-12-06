pipeline {
    agent any
    
    environment {
        BACKEND_IMAGE = 'revticket-backend'
        FRONTEND_IMAGE = 'revticket-frontend'
        DOCKER_TAG = "${BUILD_NUMBER}"
        GIT_COMMIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
        JAVA_HOME = '/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home'
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.JAVA_HOME}/bin:${env.PATH}"
        BACKEND_HOST_PORT = '8081'
        FRONTEND_HOST_PORT = '4200'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build & Test Backend') {
            steps {
                dir('Backend') {
                    sh 'java -version'
                    sh './mvnw clean package'
                }
            }
            post {
                always {
                    dir('Backend') {
                        junit allowEmptyResults: true, testResults: 'target/surefire-reports/*.xml'
                        archiveArtifacts artifacts: 'target/*.jar', fingerprint: true, allowEmptyArchive: true
                    }
                }
            }
        }
        
        stage('Build & Test Frontend') {
            steps {
                dir('Frontend') {
                    sh 'node --version'
                    sh 'npm --version'
                    sh 'npm ci'
                    sh 'npm run test || true'
                    sh 'npm run build'
                }
            }
            post {
                always {
                    dir('Frontend') {
                        archiveArtifacts artifacts: 'dist/**/*', fingerprint: true, allowEmptyArchive: true
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:${GIT_COMMIT_HASH} -t ${BACKEND_IMAGE}:latest ./Backend"
                    }
                }
                stage('Build Frontend Image') {
                    steps {
                        sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:${GIT_COMMIT_HASH} -t ${FRONTEND_IMAGE}:latest ./Frontend"
                    }
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                allOf {
                    anyOf {
                        branch 'main'
                        branch 'master'
                    }
                    expression { 
                        return env.PUSH_TO_REGISTRY == 'true'
                    }
                }
            }
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-credentials') {
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:${GIT_COMMIT_HASH}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:${GIT_COMMIT_HASH}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'docker-compose down || true'
                sh "BACKEND_HOST_PORT=${BACKEND_HOST_PORT} FRONTEND_HOST_PORT=${FRONTEND_HOST_PORT} docker-compose up -d"
                sh 'sleep 30'
                sh 'docker-compose ps'
            }
        }
        
        stage('Health Check') {
            steps {
                script {
                    retry(10) {
                        sleep 10
                        sh "curl -f http://localhost:${BACKEND_HOST_PORT}/actuator/health"
                    }
                }
                echo 'Application is healthy and ready!'
            }
        }
    }
    
    post {
        always {
            sh 'docker system prune -f || true'
        }
        success {
            echo 'Pipeline succeeded! Application deployed successfully.'
        }
        failure {
            echo 'Pipeline failed! Check logs for details.'
            sh 'docker-compose logs || true'
        }
        cleanup {
            cleanWs()
        }
    }
}
