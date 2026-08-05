pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'school-erp-backend'
        REGISTRY = 'my-registry:5000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lints & Type Checks') {
            steps {
                sh 'npx tsc --noEmit'
            }
        }

        stage('Unit Testing') {
            steps {
                sh 'npm run test'
            }
        }

        stage('Integration & E2E') {
            steps {
                sh 'npm run test:e2e'
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER} ."
                sh "docker push ${REGISTRY}/${DOCKER_IMAGE}:${BUILD_NUMBER}"
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose up -d --no-deps --build backend"
            }
        }
    }
}
