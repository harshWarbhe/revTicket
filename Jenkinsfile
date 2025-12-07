pipeline {
    agent any
    
    environment {
        PATH = "/usr/local/bin:${env.PATH}"
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
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        if (isUnix()) {
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                            sh "docker push ${BACKEND_IMAGE}:${BUILD_TAG}"
                            sh "docker push ${BACKEND_IMAGE}:latest"
                            sh "docker push ${FRONTEND_IMAGE}:${BUILD_TAG}"
                            sh "docker push ${FRONTEND_IMAGE}:latest"
                        } else {
                            bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
                            bat "docker push ${BACKEND_IMAGE}:${BUILD_TAG}"
                            bat "docker push ${BACKEND_IMAGE}:latest"
                            bat "docker push ${FRONTEND_IMAGE}:${BUILD_TAG}"
                            bat "docker push ${FRONTEND_IMAGE}:latest"
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'docker-compose down || true'
                        sh 'docker stop revticket-mysql revticket-mongodb revticket-backend revticket-frontend || true'
                        sh 'docker rm revticket-mysql revticket-mongodb revticket-backend revticket-frontend || true'
                        sh 'lsof -ti:8081 | xargs kill -9 || true'
                        sh 'lsof -ti:3307 | xargs kill -9 || true'
                        sh 'lsof -ti:27018 | xargs kill -9 || true'
                        sh 'docker-compose up -d'
                    } else {
                        bat 'docker-compose down || exit 0'
                        bat 'docker stop revticket-mysql revticket-mongodb revticket-backend revticket-frontend || exit 0'
                        bat 'docker rm revticket-mysql revticket-mongodb revticket-backend revticket-frontend || exit 0'
                        bat 'for /f "tokens=5" %%a in (\'netstat -aon ^| find ":8081" ^| find "LISTENING"\') do taskkill /F /PID %%a || exit 0'
                        bat 'for /f "tokens=5" %%a in (\'netstat -aon ^| find ":3307" ^| find "LISTENING"\') do taskkill /F /PID %%a || exit 0'
                        bat 'for /f "tokens=5" %%a in (\'netstat -aon ^| find ":27018" ^| find "LISTENING"\') do taskkill /F /PID %%a || exit 0'
                        bat 'docker-compose up -d'
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
