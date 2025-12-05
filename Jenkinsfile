pipeline {
    agent any

    stages {

        stage('checkout') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: "*/${BRANCH_NAME}"]],
                    userRemoteConfigs: [[url: 'https://github.com/harshWarbhe/revTicket.git']]
                ])
            }
        }

        stage('build') {
            steps {
                echo "Building branch: ${BRANCH_NAME}"
                dir('Backend') {
                    bat "mvn clean install -DskipTests=false"
                }
            }
        }
        stage('Docker Build & Tag') {
    when { branch 'master' }
    steps {
        dir('Backend') {
            script {
                dockerImage = docker.build("revticket:latest")
            }
        }
    }
}


                stage('archive artifacts') {
            when { expression { env.BRANCH_NAME == 'master' } }
            steps {
                archiveArtifacts artifacts: 'Backend/target/*.jar', fingerprint: true
                junit allowEmptyResults: true, testResults: 'Backend/target/surefire-reports/*.xml'
            }
        }

    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Build success on branch: ${BRANCH_NAME}"
        }
        failure {
            echo "Build failed on branch: ${BRANCH_NAME}"
        }
    }
}
