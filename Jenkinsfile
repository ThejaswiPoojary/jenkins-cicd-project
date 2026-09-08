pipeline {
    agent any

    environment {
        // Container registry (Docker Hub, ECR, GCR, etc.)
        REGISTRY        = 'docker.io/thejaswikotian'
        IMAGE_NAME      = 'cicd-demo-app'
        IMAGE_TAG       = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'local'}"
        FULL_IMAGE      = "${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
        KUBE_NAMESPACE  = 'demo'
        DOCKER_CREDS_ID = 'dockerhub-credentials'   // Jenkins credential ID
        KUBECONFIG_CRED = 'kubeconfig-credentials'  // Jenkins credential ID (Secret file)
    }

    options {
        // Keep only the last 10 builds' artifacts/logs
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
    		steps {
       		 dir('app') {
            		sh 'npm install'
           		sh 'chmod +x node_modules/.bin/*'
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('app') {
                    sh 'npm test -- --ci --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'app/junit.xml'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${FULL_IMAGE} ."
            }
        }

        stage('Push to Registry') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo "\$DOCKER_PASS" | docker login -u "\$DOCKER_USER" --password-stdin
                        docker push ${FULL_IMAGE}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG')]) {
                    sh """
                        kubectl set image deployment/cicd-demo-app \
                          cicd-demo-app=${FULL_IMAGE} \
                          -n ${KUBE_NAMESPACE} --record

                        kubectl rollout status deployment/cicd-demo-app \
                          -n ${KUBE_NAMESPACE} --timeout=120s
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployed ${FULL_IMAGE} to Kubernetes namespace ${KUBE_NAMESPACE} successfully."
        }
        failure {
            echo "Pipeline failed. Consider: kubectl rollout undo deployment/cicd-demo-app -n ${KUBE_NAMESPACE}"
        }
    }
}
