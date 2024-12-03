pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token-id')  // Use Jenkins credentials for SonarQube token
        SNYK_TOKEN = credentials('snyk-token-id')    // Use Jenkins credentials for Snyk token
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', credentialsId: 'github', url: 'https://github.com/vivek28058/Skillviz_BE.git'
            }
        }

        stage('SonarQube Source Code Scan') {
            steps {
                script {
                    sh """
                    sonar-scanner \
                    -Dsonar.projectKey=vivek28058_Skillviz_BE \
                    -Dsonar.organization=vivek28058 \
                    -Dsonar.host.url=https://sonarcloud.io \
                    -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        stage('Install Snyk') {
            steps {
                sh 'npm install -g snyk'
            }
        }

        stage('Authenticate Snyk') {
            steps {
                script {
                    sh "snyk auth ${SNYK_TOKEN}"
                }
            }
        }

        stage('Run Snyk Dependencies Scan') {
            steps {
                script {
                    sh 'snyk test --all-projects || true'  // Continue on error
                }
            }
        }

        stage('Monitor Snyk SCA Scan') {
            steps {
                script {
                    sh 'snyk monitor --all-projects || true'  // Continue on error
                }
            }
        }

        stage('Debug Files in Docker') {
            steps {
                script {
                    sh 'ls -la .github/workflows/'
                }
            }
        }

        stage('ZAP Dynamic Analysis Scan') {
            steps {
                script {
                    sh """
                    docker run --rm \
                    -v \$(pwd):/zap/wrk/:rw \
                    owasp/zap2docker-stable zap-full-scan.py \
                    -t https://bwapp.hakhub.net/ \
                    -r /zap/wrk/zap_report.html
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed, performing cleanup tasks if needed.'
        }
    }
}
