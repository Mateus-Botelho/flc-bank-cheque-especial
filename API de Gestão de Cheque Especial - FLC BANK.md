# API de Gestão de Cheque Especial - FLC BANK

## Visão Geral

Esta API foi desenvolvida para gerenciar limites de cheque especial de clientes bancários, oferecendo autenticação entre aplicações, painel administrativo e sistema completo de logs de alterações.

## Características Principais

- **Autenticação JWT**: Sistema seguro de autenticação entre aplicações
- **Validação de Documentos**: Validação completa de CPF e CNPJ
- **Painel Administrativo**: Interface web para gestão de clientes e limites
- **Sistema de Logs**: Auditoria completa de todas as alterações
- **API RESTful**: Endpoints padronizados para integração
- **Banco de Dados**: Suporte a MySQL e SQLite
- **Docker**: Containerização para fácil deployment

## Arquitetura

### Backend
- **Framework**: Flask 2.3.3
- **Banco de Dados**: MySQL 8.0 (produção) / SQLite (desenvolvimento)
- **Autenticação**: JWT (JSON Web Tokens)
- **Validação**: Marshmallow
- **CORS**: Habilitado para integração frontend

### Frontend
- **Tecnologia**: HTML5, CSS3, JavaScript (Vanilla)
- **Design**: Responsivo com gradientes modernos
- **Funcionalidades**: SPA (Single Page Application)

### Infraestrutura
- **Containerização**: Docker e Docker Compose
- **Proxy Reverso**: Nginx (opcional)
- **Monitoramento**: Logs estruturados

## Estrutura do Projeto

```
cheque-especial-api/
├── src/
│   ├── models/
│   │   └── database.py          # Modelos do banco de dados
│   ├── routes/
│   │   ├── auth.py             # Rotas de autenticação
│   │   ├── overdraft.py        # Rotas da API principal
│   │   └── admin.py            # Rotas administrativas
│   ├── static/
│   │   └── index.html          # Frontend integrado
│   └── main.py                 # Aplicação principal
├── docker-compose.yml          # Configuração Docker
├── Dockerfile                  # Imagem da aplicação
├── init.sql                    # Script de inicialização do BD
├── requirements.txt            # Dependências Python
├── .env                        # Variáveis de ambiente
└── populate_db.py             # Script para popular BD de teste
```



## Instalação e Configuração

### Pré-requisitos

- Docker e Docker Compose
- Python 3.11+ (para desenvolvimento local)
- MySQL 8.0+ (para produção)

### Instalação com Docker (Recomendado)

1. **Clone o repositório**:
```bash
git clone <repository-url>
cd cheque-especial-api
```

2. **Configure as variáveis de ambiente**:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. **Inicie os serviços**:
```bash
docker-compose up -d
```

4. **Acesse a aplicação**:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

### Instalação Local (Desenvolvimento)

1. **Crie um ambiente virtual**:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

2. **Instale as dependências**:
```bash
pip install -r requirements.txt
```

3. **Configure o banco de dados**:
```bash
# Para SQLite (desenvolvimento)
python populate_db.py

# Para MySQL (produção)
mysql -u root -p < init.sql
```

4. **Inicie a aplicação**:
```bash
python src/main.py
```

### Configuração do Banco de Dados

#### MySQL (Produção)
```env
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/cheque_especial
```

#### SQLite (Desenvolvimento)
```env
DATABASE_URL=sqlite:///app.db
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão com o banco | `sqlite:///app.db` |
| `SECRET_KEY` | Chave secreta da aplicação | - |
| `JWT_SECRET_KEY` | Chave secreta para JWT | - |
| `FLASK_ENV` | Ambiente Flask | `development` |



## Documentação da API

### Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação entre aplicações.

#### Obter Token de Acesso

**Endpoint**: `POST /api/auth/token`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "client_id": "bank_app_001",
  "client_secret": "secret_key_123"
}
```

**Resposta de Sucesso** (200):
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Resposta de Erro** (401):
```json
{
  "error": "Invalid credentials"
}
```

### Consulta de Limite de Cheque Especial

#### Consultar Limite por Documento

**Endpoint**: `POST /api/overdraft/check`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {access_token}
```

**Body**:
```json
{
  "document": "12345678901"
}
```

**Resposta de Sucesso** (200):
```json
{
  "account_limit": 5000.00,
  "updated_date": "2025-06-17T10:30:00Z",
  "status": "success"
}
```

**Resposta de Erro** (404):
```json
{
  "error": "Client not found",
  "status": "error"
}
```

**Resposta de Erro** (400):
```json
{
  "error": "Invalid document format",
  "status": "error"
}
```

### Endpoints Administrativos

#### Login Administrativo

**Endpoint**: `POST /api/admin/login`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "user": {
    "username": "admin"
  }
}
```

#### Buscar Cliente

**Endpoint**: `POST /api/admin/client/search`

**Headers**:
```
Content-Type: application/json
Cookie: session=...
```

**Body**:
```json
{
  "document": "12345678901"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "client": {
    "document": "12345678901",
    "name": "João Silva Santos",
    "account_limit": 5000.00,
    "updated_date": "2025-06-17T10:30:00Z"
  }
}
```

#### Listar Todos os Clientes

**Endpoint**: `GET /api/admin/clients?page=1&per_page=10`

**Headers**:
```
Cookie: session=...
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "clients": [
    {
      "document": "12345678901",
      "name": "João Silva Santos",
      "account_limit": 5000.00,
      "updated_date": "2025-06-17T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "per_page": 10,
    "total": 6,
    "has_next": false,
    "has_prev": false
  }
}
```

#### Atualizar Limite do Cliente

**Endpoint**: `POST /api/admin/client/update-limit`

**Headers**:
```
Content-Type: application/json
Cookie: session=...
```

**Body**:
```json
{
  "document": "12345678901",
  "new_limit": 7500.00,
  "operation_password": "12345678"
}
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "client": {
    "document": "12345678901",
    "name": "João Silva Santos",
    "account_limit": 7500.00,
    "updated_date": "2025-06-17T11:45:00Z"
  }
}
```

#### Consultar Logs de Alterações

**Endpoint**: `GET /api/admin/logs?limit=10`

**Headers**:
```
Cookie: session=...
```

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "client_document": "12345678901",
      "client_name": "João Silva Santos",
      "previous_limit": 5000.00,
      "new_limit": 7500.00,
      "changed_by": "admin",
      "change_date": "2025-06-17T11:45:00Z",
      "operation_status": "success"
    }
  ]
}
```


## Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida |
| 401 | Não autorizado |
| 403 | Acesso negado |
| 404 | Recurso não encontrado |
| 500 | Erro interno do servidor |

## Segurança

### Autenticação JWT
- Tokens expiram em 1 hora
- Chaves secretas devem ser alteradas em produção
- Tokens são validados em todas as requisições protegidas

### Validações
- CPF/CNPJ são validados quanto ao formato
- Senhas de operação devem ter exatamente 8 dígitos
- Documentos são armazenados apenas com números

### Logs de Auditoria
- Todas as alterações de limite são registradas
- Logs incluem usuário, data/hora e status da operação
- Histórico completo para auditoria

## Painel Administrativo

### Funcionalidades

1. **Login Seguro**: Autenticação com usuário e senha
2. **Busca de Clientes**: Por CPF ou CNPJ
3. **Listagem Paginada**: Visualização de todos os clientes
4. **Edição de Limites**: Com validação de senha de operação
5. **Logs de Auditoria**: Histórico de todas as alterações
6. **Teste de API**: Ferramenta integrada para testar endpoints

### Credenciais Padrão

- **Usuário**: admin
- **Senha**: admin123
- **Senha de Operação**: 12345678

> ⚠️ **IMPORTANTE**: Altere as credenciais padrão em produção!

## Exemplos de Uso

### Exemplo 1: Consulta de Limite via cURL

```bash
# 1. Obter token
curl -X POST http://localhost:5000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "bank_app_001",
    "client_secret": "secret_key_123"
  }'

# 2. Consultar limite
curl -X POST http://localhost:5000/api/overdraft/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "document": "12345678901"
  }'
```

### Exemplo 2: Integração Python

```python
import requests

# Configuração
API_BASE = "http://localhost:5000/api"
CLIENT_ID = "bank_app_001"
CLIENT_SECRET = "secret_key_123"

# Obter token
auth_response = requests.post(f"{API_BASE}/auth/token", json={
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET
})
token = auth_response.json()["access_token"]

# Consultar limite
headers = {"Authorization": f"Bearer {token}"}
response = requests.post(f"{API_BASE}/overdraft/check", 
    headers=headers,
    json={"document": "12345678901"}
)

if response.status_code == 200:
    data = response.json()
    print(f"Limite: R$ {data['account_limit']:.2f}")
else:
    print(f"Erro: {response.json()['error']}")
```

### Exemplo 3: Integração JavaScript

```javascript
class ChequeEspecialAPI {
    constructor(baseUrl, clientId, clientSecret) {
        this.baseUrl = baseUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.token = null;
    }

    async authenticate() {
        const response = await fetch(`${this.baseUrl}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret
            })
        });
        
        const data = await response.json();
        this.token = data.access_token;
        return this.token;
    }

    async checkLimit(document) {
        if (!this.token) await this.authenticate();
        
        const response = await fetch(`${this.baseUrl}/overdraft/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({ document })
        });
        
        return response.json();
    }
}

// Uso
const api = new ChequeEspecialAPI(
    'http://localhost:5000/api',
    'bank_app_001',
    'secret_key_123'
);

api.checkLimit('12345678901').then(result => {
    console.log(`Limite: R$ ${result.account_limit}`);
});
```


## Deployment em Produção

### Docker Compose (Recomendado)

1. **Configure as variáveis de produção**:
```env
DATABASE_URL=mysql+pymysql://user:password@mysql:3306/cheque_especial
SECRET_KEY=your-super-secret-key-change-this
JWT_SECRET_KEY=your-jwt-secret-key-change-this
FLASK_ENV=production
```

2. **Inicie os serviços**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Configure proxy reverso** (Nginx):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Considerações de Segurança em Produção

1. **Altere todas as credenciais padrão**
2. **Use HTTPS com certificados SSL**
3. **Configure firewall adequadamente**
4. **Implemente rate limiting**
5. **Configure backup automático do banco**
6. **Monitore logs de segurança**

## Monitoramento e Logs

### Logs da Aplicação
```bash
# Visualizar logs em tempo real
docker-compose logs -f app

# Logs do banco de dados
docker-compose logs -f mysql
```

### Métricas Importantes
- Taxa de requisições por minuto
- Tempo de resposta médio
- Erros de autenticação
- Alterações de limite por período

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```
Error: Can't connect to MySQL server
```
**Solução**: Verifique se o MySQL está rodando e as credenciais estão corretas.

#### 2. Token JWT Inválido
```
Error: Invalid token
```
**Solução**: Gere um novo token através do endpoint `/api/auth/token`.

#### 3. Documento Inválido
```
Error: Invalid document format
```
**Solução**: Verifique se o CPF/CNPJ está no formato correto (apenas números).

#### 4. Senha de Operação Incorreta
```
Error: Invalid operation password
```
**Solução**: Verifique se a senha tem exatamente 8 dígitos numéricos.

### Comandos Úteis

```bash
# Reiniciar aplicação
docker-compose restart app

# Backup do banco
docker exec mysql mysqldump -u root -p cheque_especial > backup.sql

# Restaurar backup
docker exec -i mysql mysql -u root -p cheque_especial < backup.sql

# Verificar logs de erro
docker-compose logs app | grep ERROR

# Monitorar performance
docker stats
```

## Estrutura do Banco de Dados

### Tabela: clients
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| document | VARCHAR(14) | CPF/CNPJ (apenas números) |
| name | VARCHAR(255) | Nome do cliente |
| account_limit | DECIMAL(15,2) | Limite de cheque especial |
| created_date | DATETIME | Data de criação |
| updated_date | DATETIME | Data da última atualização |

### Tabela: admin_users
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| username | VARCHAR(50) | Nome de usuário |
| password_hash | VARCHAR(255) | Hash da senha |
| operation_password | VARCHAR(8) | Senha de operação |
| created_date | DATETIME | Data de criação |

### Tabela: api_applications
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| client_id | VARCHAR(50) | ID da aplicação |
| client_secret | VARCHAR(255) | Chave secreta |
| app_name | VARCHAR(255) | Nome da aplicação |
| created_date | DATETIME | Data de criação |

### Tabela: limit_change_logs
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT | Chave primária |
| client_document | VARCHAR(14) | Documento do cliente |
| client_name | VARCHAR(255) | Nome do cliente |
| previous_limit | DECIMAL(15,2) | Limite anterior |
| new_limit | DECIMAL(15,2) | Novo limite |
| changed_by | VARCHAR(50) | Usuário que fez a alteração |
| change_date | DATETIME | Data da alteração |
| operation_status | VARCHAR(20) | Status da operação |

## Licença

Este projeto é propriedade do FLC BANK e está protegido por direitos autorais.

## Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento:

- **Email**: dev@flcbank.com
- **Telefone**: (11) 1234-5678
- **Horário**: Segunda a Sexta, 9h às 18h

## Changelog

### v1.0.0 (2025-06-17)
- Lançamento inicial
- API de consulta de limite
- Painel administrativo
- Sistema de logs
- Autenticação JWT
- Suporte a Docker

---

**Desenvolvido por**: Equipe de Desenvolvimento FLC BANK  
**Data**: Junho 2025  
**Versão**: 1.0.0

