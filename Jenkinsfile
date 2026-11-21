pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Deploy da Vinheria Agnello - Iniciando build...'
                echo 'Validando estrutura dos microsserviços (ms-catalogo e ms-pedidos)...'
            }
        }

        stage('Testes') {
            steps {
                echo 'Executando verificações simples (simulação de testes automatizados)...'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Copiando arquivos para a pasta de publicação (simulando produção)...'
                sh '''
                    mkdir -p /tmp/vinheria_deploy
                    cp -r ./ms-catalogo /tmp/vinheria_deploy/
                    cp -r ./ms-pedidos /tmp/vinheria_deploy/
                '''
                echo 'Deploy da Vinheria Agnello realizado com sucesso!'
            }
        }
    }

    post {
        success {
            echo 'Pipeline executado com sucesso!'
        }
        failure {
            echo 'Falha na execução do pipeline.'
        }
    }
}
