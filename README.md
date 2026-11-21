# Vinheria Agnello - Simulação de Infraestrutura e DevOps

Projeto de simulação de parte da arquitetura de microsserviços da Vinheria Agnello,
com foco em infraestrutura, rede, deploy (Jenkins) e comunicação segura (JWT).

## Estrutura

```
vinheria-agnello/
├── ms-catalogo/        # Microsserviço de Catálogo e Produtos (porta 3001)
├── ms-pedidos/         # Microsserviço de Pedidos e Estoque (porta 3000)
├── bruno-collection/   # Requisições prontas para testar as APIs (Bruno)
├── docker-compose.yml  # Sobe os dois serviços na mesma rede Docker
├── Jenkinsfile         # Pipeline de build e deploy
└── README.md
```

## 1. Rodando os microsserviços (Docker)

Na pasta raiz do projeto, execute:

```bash
docker compose up --build
```

Isso vai:
- Criar a rede `vinheria-net` (o Docker atribui IPs automaticamente - simula o DHCP).
- Subir o `ms-catalogo` e o `ms-pedidos`, que se enxergam pelo nome do serviço
  (o DNS interno do Docker resolve `http://ms-catalogo:3001` automaticamente).

Para conferir a rede e os IPs atribuídos (print para o PDF):

```bash
docker network inspect vinheria-net
```

## 2. Testando as APIs

Abra o Bruno, importe a pasta `bruno-collection/` como uma coleção e execute
nesta ordem:

1. **1 - Login** → retorna um token JWT (usuário: `cliente`, senha: `123456`) e já
   salva o token automaticamente para as próximas chamadas.
2. **2 - Listar Vinhos** → consulta direta no `ms-catalogo` (não exige token).
3. **3 - Criar Pedido** → chama o `ms-pedidos`, que internamente consulta o
   `ms-catalogo` via REST antes de confirmar o pedido. Exige o token do login.
4. **4 - Listar Pedidos** → lista os pedidos já confirmados. Exige o token.

Também é possível testar via `curl`:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"cliente","senha":"123456"}'
```

## 3. Capturando o tráfego no Wireshark

1. Abra o Wireshark e selecione a interface **Loopback** (tráfego em `localhost`).
2. Aplique o filtro: `http`
3. Faça as requisições do passo 2 (login e criação de pedido) pelo Bruno ou `curl`.
4. Clique no pacote do `POST /login` e observe que o corpo da requisição
   (usuário e senha) e a resposta (token JWT) aparecem em **texto puro**.
5. Para o relatório: isso demonstra por que, em produção, essa comunicação
   deveria ocorrer via **HTTPS/TLS**, cifrando o conteúdo do pacote.

## 4. Pipeline Jenkins

1. Suba o Jenkins via Docker:

```bash
docker run -d -p 8080:8080 -p 50000:50000 --name jenkins \
  -v jenkins_home:/var/jenkins_home \
  jenkins/jenkins:lts
```

2. Acesse `http://localhost:8080` e finalize a configuração inicial
   (a senha inicial pode ser obtida com `docker logs jenkins`).
3. Crie um novo item do tipo **Pipeline**.
4. Em "Pipeline", aponte para o repositório Git do projeto (ou cole o conteúdo
   do `Jenkinsfile` diretamente na opção "Pipeline script").
5. Execute o build e tire prints do console de saída (stages Build, Testes e Deploy).

## 5. Encerrando o ambiente

```bash
docker compose down
docker stop jenkins
```

## Observações

- O segredo do JWT (`JWT_SECRET`) está fixo no código apenas para fins didáticos.
  Em um ambiente real, deveria vir de uma variável de ambiente ou de um
  cofre de segredos (ex: Vault, AWS Secrets Manager).
- Os dados de vinhos e pedidos ficam em memória (reiniciam ao reiniciar o container),
  o que é suficiente para a simulação proposta.
