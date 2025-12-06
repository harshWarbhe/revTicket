pipeline {
    agent any
    
    tools {
        jdk 'JDK17'
    }
    
    environment {
        DOCKER_IMAGE = 'revticket-backend'
        DOCKER_TAG = "${BUILD_NUMBER}"
        JAVA_HOME = "${tool 'JDK17'}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Clean Cache') {
            steps {
                sh 'rm -rf ~/.m2/repository/org/projectlombok'
            }
        }
        
        stage('Build') {
            steps {
                dir('Backend') {
                    sh 'java -version'
                    sh './mvnw clean install -U -DskipTests'
                }
            }
        }
        
        stage('Test') {
            steps {
                dir('Backend') {
                    sh './mvnw test'
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} -t ${DOCKER_IMAGE}:latest ./Backend"
            }
        }
        
        stage('Push to Registry') {
            steps {
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-credentials') {
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
