pipeline {
    agent any

    environment {
        AWS_ACCOUNT_ID = credentials('ACCOUNT_ID')
        AWS_DEFAULT_REGION = "ap-south-1"
        IMAGE_REPO_NAME = "ecr-backend"
        IMAGE_TAG = "latest"
        REPOSITORY_URI = "${AWS_ACCOUNT_ID}.dkr.ecr-backend.${AWS_DEFAULT_REGION}.amazonaws.com/${IMAGE_REPO_NAME}"
        IMAGE_NAME = "${REPOSITORY_URI}:${IMAGE_TAG}"
    }

    stages {

        stage('Logging into AWS ECR') {
            steps {
                script {
                    sh """
                        aws ecr-backend get-login-password --region ${AWS_DEFAULT_REGION} | \
                        docker login --username AWS --password-stdin ${REPOSITORY_URI}
                    """
                }
            }
        }

        stage('Cloning Git') {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[
                        credentialsId: 'github-creds',
                        url: 'https://github.com/DeveloperHemvant/erpbackend.git'
                    ]]
                ])
            }
        }

        stage('Copy env file') {
            steps {
                sh 'rm -f .env'
                withCredentials([file(credentialsId: 'BACKEND_ENV_FILE', variable: 'ENV_FILE')]) {
                    sh '''
                        cp "$ENV_FILE" .env
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_REPO_NAME}:${IMAGE_TAG} .'
            }
        }

        stage('Tag & Push to ECR') {
            steps {
                sh '''
                    docker tag ${IMAGE_REPO_NAME}:${IMAGE_TAG} ${IMAGE_NAME}
                    docker push ${IMAGE_NAME}
                '''
            }
        }

        stage('Start Container') {
            steps {
                script {
                    sh """
                        docker compose down
                        docker compose up -d --force-recreate
                    """
                }
            }
        }

        stage('Clean up workspace') {
            steps {
                script {
                    echo 'Cleaning up Docker images...'
                    sh 'docker image prune -f'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline run succeeded.'
        }
        failure {
            echo 'Pipeline run failed.'
        }
    }
}
