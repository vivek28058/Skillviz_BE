pipeline {
    agent { label 'ubuntu' }  // Use the appropriate label for your agent
    
    environment {
        SONAR_TOKEN = credentials('sonar-token-id')  // Use Jenkins credentials for SonarQube token
        SNYK_TOKEN = credentials('snyk-token-id')    // Use Jenkins credentials for Snyk token
    }
    
    stages {
        stage('Checkout Code') {
            steps {
                checkout scm  // Checkout the repository
            }
        }
        
        stage('SonarQube Source Code Scan') {
            steps {
                script {
                    sh """
                    sonar-scanner \
                    -Dsonar.projectKey=my-project-key \
                    -Dsonar.organization=my-org \
                    -Dsonar.host.url=https://sonarcloud.io \
                    -Dsonar.login=${SONAR_TOKEN}
                    """
                }
            }
        }

        /* 
        stage('SonarQube Quality Gate Check') {
            steps {
                script {
                    sh 'curl -u ${SONAR_TOKEN}: https://sonarcloud.io/api/qualitygates/project_status?projectKey=my-project-key'
                }
            }
        }
        */
        
        stage('Install Snyk') {
            steps {
                script {
                    sh 'npm install -g snyk'
                }
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
            // Cleanup or notifications after the pipeline completes
        }
    }
}
