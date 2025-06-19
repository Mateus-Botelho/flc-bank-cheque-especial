# 🏦 API de Gestão de Cheque Especial - FLC BANK

Uma API RESTful completa para gestão de limites de cheque especial com painel administrativo web integrado.

[![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://www.mysql.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Instalação Rápida](#-instalação-rápida)
- [Configuração](#-configuração)
- [Documentação da API](#-documentação-da-api)
- [Painel Administrativo](#-painel-administrativo)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deployment](#-deployment)
- [Testes](#-testes)
- [Contribuição](#-contribuição)
- [Suporte](#-suporte)

## 🎯 Visão Geral

Sistema completo para gestão de limites de cheque especial que oferece:

- **API RESTful** com autenticação JWT para consultas automatizadas
- **Painel Web Administrativo** para gestão manual de clientes e limites
- **Validação robusta** de CPF/CNPJ com dígitos verificadores
- **Auditoria completa** com logs de todas as operações
- **Segurança** com rate limiting, helmet e sessões seguras

### 🚀 Características

- ✅ **API RESTful** com documentação OpenAPI
- 🔐 **Autenticação JWT** para aplicações externas
- 👤 **Painel administrativo** web completo
- 📊 **Dashboard** com métricas e logs em tempo real
- 🛡️ **Validação rigorosa** de documentos (CPF/CNPJ)
- 📝 **Auditoria completa** de todas as operações
- 🔒 **Segurança robusta** com rate limiting e headers de segurança
- 🗄️ **Suporte múltiplo** para SQLite (dev) e MySQL (prod)
- 🐳 **Docker** pronto para produção
- 📱 **Interface responsiva** e moderna

## ⚡ Instalação Rápida

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### 1. Clone e Configure

```bash
# Clone o repositório
git clone <repository-url>
cd cheque-especial-nodejs

# Instale as dependências
npm install

# Configure o banco SQLite para desenvolvimento
npm run populate-db

# Inicie a aplicação
npm start
```

### 2. Acesse o Sistema

- **Painel Web**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### 3. Credenciais de Teste

```
Admin Web:
- Usuário: admin
- Senha: admin123
- Senha Operação: 12345678

API:
- Client ID: bank_app_001
- Client Secret: secret_key_123
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Banco de Dados (MySQL - Produção)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cheque_especial
DB_USER=root
DB_PASSWORD=sua-senha-mysql

# Para desenvolvimento com SQLite, use:
DATABASE_URL=sqlite:./database.sqlite

# Segurança
JWT_SECRET=sua-chave-jwt-super-secreta-256-bits
SESSION_SECRET=sua-chave-sessao-super-secreta

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Configuração do Banco

#### SQLite (Desenvolvimento)
```bash
npm run populate-db
```

#### MySQL (Produção)
```sql
CREATE DATABASE cheque_especial;
-- Execute o script src/config/init.sql
```

## 📚 Documentação da API

### Autenticação

A API utiliza autenticação JWT. Primeiro obtenha um token:

#### POST `/api/auth/token`

```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "bank_app_001",
    "client_secret": "secret_key_123"
  }'
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "status": "success"
}
```

### Endpoints Principais

#### 1. Consultar Limite de Cheque Especial

**POST** `/api/overdraft/check`

Consulta o limite de cheque especial de um cliente.

```bash
curl -X POST http://localhost:3000/api/overdraft/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "document": "12345678901"
  }'
```

**Parâmetros:**
- `document` (string, obrigatório): CPF (11 dígitos) ou CNPJ (14 dígitos)

**Resposta de Sucesso (200):**
```json
{
  "account_limit": 5000.00,
  "updated_date": "2025-06-18T10:30:00.000Z",
  "status": "success"
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Cliente não encontrado",
  "status": "error"
}
```

#### 2. Criar Novo Cliente

**POST** `/api/overdraft/client/create`

Cria um novo cliente no sistema.

```bash
curl -X POST http://localhost:3000/api/overdraft/client/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "document": "98765432100",
    "name": "Maria Silva Santos",
    "account_limit": 3000.00
  }'
```

**Parâmetros:**
- `document` (string, obrigatório): CPF ou CNPJ válido
- `name` (string, obrigatório): Nome completo do cliente
- `account_limit` (number, opcional): Limite inicial (padrão: 0)

**Resposta de Sucesso (201):**
```json
{
  "client_id": 7,
  "document": "98765432100",
  "name": "Maria Silva Santos",
  "account_limit": 3000.00,
  "created_date": "2025-06-18T10:30:00.000Z",
  "status": "success"
}
```

### Endpoints Administrativos

#### 3. Login Administrativo

**POST** `/api/admin/login`

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

#### 4. Buscar Cliente (Admin)

**POST** `/api/admin/client/search`

```bash
curl -X POST http://localhost:3000/api/admin/client/search \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "document": "12345678901"
  }'
```

#### 5. Criar Cliente (Admin)

**POST** `/api/admin/client/create`

```bash
curl -X POST http://localhost:3000/api/admin/client/create \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "document": "11122233344",
    "name": "João da Silva",
    "account_limit": 2500.00,
    "operation_password": "12345678"
  }'
```

#### 6. Atualizar Limite (Admin)

**POST** `/api/admin/client/update-limit`

```bash
curl -X POST http://localhost:3000/api/admin/client/update-limit \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=..." \
  -d '{
    "document": "12345678901",
    "new_limit": 7500.00,
    "operation_password": "12345678"
  }'
```

#### 7. Listar Clientes (Admin)

**GET** `/api/admin/clients?page=1&per_page=10`

```bash
curl -X GET "http://localhost:3000/api/admin/clients?page=1&per_page=10" \
  -H "Cookie: connect.sid=..."
```

#### 8. Consultar Logs (Admin)

**GET** `/api/admin/logs?limit=10`

```bash
curl -X GET "http://localhost:3000/api/admin/logs?limit=10" \
  -H "Cookie: connect.sid=..."
```

**Resposta:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "client_document": "12345678901",
      "client_name": "João Silva Santos",
      "previous_limit": 3000.00,
      "new_limit": 5000.00,
      "changed_by": "admin",
      "change_date": "2025-06-18T10:30:00.000Z",
      "operation_status": "success"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 1,
    "per_page": 10,
    "total": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

### Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Dados inválidos |
| 401 | Não autorizado |
| 404 | Não encontrado |
| 409 | Conflito (cliente já existe) |
| 429 | Muitas requisições |
| 500 | Erro interno do servidor |

### Formato de Erro Padrão

```json
{
  "error": "Descrição do erro",
  "status": "error"
}
```

## 🖥️ Painel Administrativo

### Funcionalidades

O painel web oferece uma interface completa para gestão:

#### 🔍 Consulta e Criação de Clientes
- Busca por CPF/CNPJ com validação em tempo real
- **Funcionalidade Especial**: Se o cliente não existir, o sistema automaticamente exibe um formulário para criação
- Criação instantânea de novos clientes com limite inicial

#### ✏️ Gestão de Limites
- Alteração de limites com validação de senha operacional
- Histórico completo de alterações
- Confirmação em duas etapas para operações críticas

#### 📊 Dashboard e Monitoramento
- Logs de alterações em tempo real
- Paginação e filtros avançados
- Métricas de uso do sistema

#### 🔐 Segurança
- Autenticação com sessão segura
- Senha operacional de 8 dígitos para operações críticas
- Logout automático por segurança

### Acesso ao Painel

1. Acesse: http://localhost:3000
2. Use as credenciais:
   - **Usuário**: admin
   - **Senha**: admin123
   - **Senha de Operação**: 12345678

### Workflow de Uso

#### Cenário 1: Cliente Existente
1. Digite o CPF/CNPJ
2. Clique em "Buscar Cliente"
3. Visualize os dados atuais
4. Altere o limite se necessário
5. Confirme com sua senha operacional

#### Cenário 2: Cliente Novo (⭐ Nova Funcionalidade)
1. Digite o CPF/CNPJ de um cliente que não existe
2. Clique em "Buscar Cliente"
3. O sistema detecta que é um cliente novo
4. Preencha o limite inicial desejado
5. Confirme com sua senha operacional
6. Cliente é criado automaticamente

## 🏗️ Estrutura do Projeto

```
cheque-especial-nodejs/
├── src/
│   ├── app.js              # Aplicação principal Express
│   ├── config/
│   │   └── database.js     # Configuração do banco de dados
│   ├── middleware/
│   │   └── auth.js         # Middlewares de autenticação
│   ├── models/
│   │   └── index.js        # Modelos Sequelize (Client, AdminUser, etc.)
│   ├── routes/
│   │   ├── auth.js         # Rotas de autenticação JWT
│   │   ├── overdraft.js    # Rotas da API de cheque especial
│   │   └── admin.js        # Rotas administrativas
│   └── utils/
│       └── validators.js   # Validadores de CPF/CNPJ
├── public/                 # Frontend (Painel Web)
│   ├── index.html         # Interface principal
│   ├── css/
│   │   └── admin.css      # Estilos do painel
│   └── js/
│       └── admin.js       # JavaScript do painel
├── init.sql               # Script de inicialização do banco
├── populate-db.js         # Script para popular dados iniciais
├── docker-compose.yml     # Configuração Docker
├── Dockerfile            # Imagem Docker
├── package.json          # Dependências e scripts
└── README.md             # Esta documentação
```

### Tecnologias Utilizadas

#### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para banco de dados
- **JWT** - Autenticação para API
- **bcryptjs** - Hash de senhas
- **express-session** - Sessões web
- **helmet** - Headers de segurança
- **express-rate-limit** - Rate limiting
- **morgan** - Logging HTTP

#### Frontend
- **HTML5/CSS3/JavaScript** - Interface web pura
- **CSS Grid/Flexbox** - Layout responsivo
- **Fetch API** - Comunicação com backend

#### Banco de Dados
- **SQLite** - Desenvolvimento
- **MySQL** - Produção

#### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nodemon** - Desenvolvimento

## 🚀 Deployment

### Docker (Recomendado)

#### Desenvolvimento
```bash
docker-compose up -d
```

#### Produção
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual

#### 1. Configurar Banco MySQL
```sql
CREATE DATABASE cheque_especial;
CREATE USER 'cheque_user'@'%' IDENTIFIED BY 'senha_segura';
GRANT ALL PRIVILEGES ON cheque_especial.* TO 'cheque_user'@'%';
```

#### 2. Configurar Variáveis
```bash
export NODE_ENV=production
export DB_HOST=mysql-server
export DB_NAME=cheque_especial
export DB_USER=cheque_user
export DB_PASSWORD=senha_segura
export JWT_SECRET=sua-chave-jwt-256-bits
export SESSION_SECRET=sua-chave-sessao-256-bits
```

#### 3. Inicializar e Executar
```bash
npm install --production
node populate-db.js
npm start
```

### PM2 (Produção)

```bash
npm install -g pm2
pm2 start src/app.js --name "cheque-especial-api"
pm2 startup
pm2 save
```

## 🧪 Testes

### Teste Manual da API

#### 1. Obter Token
```bash
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"bank_app_001","client_secret":"secret_key_123"}'
```

#### 2. Consultar Cliente
```bash
curl -X POST http://localhost:3000/api/overdraft/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"document":"12345678901"}'
```

### Teste do Painel Web

1. Acesse http://localhost:3000
2. Faça login com admin/admin123
3. Teste busca de cliente: 12345678901
4. Teste criação de cliente com CPF inexistente
5. Teste alteração de limite

### Health Check

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-18T10:30:00.000Z",
  "service": "Cheque Especial API",
  "version": "1.0.0"
}
```

## 🛡️ Segurança

### Medidas Implementadas

- **Rate Limiting**: 100 requests/15min por IP
- **Helmet**: Headers de segurança HTTP
- **CORS**: Configurado para domínios específicos
- **Validação Rigorosa**: CPF/CNPJ com dígitos verificadores
- **Senha Operacional**: Proteção extra para operações críticas
- **JWT**: Tokens com expiração de 1 hora
- **Hash de Senhas**: bcrypt com salt

### Configurações de Produção

```env
NODE_ENV=production
SESSION_SECRET=chave-256-bits-super-secreta
JWT_SECRET=outra-chave-256-bits-super-secreta
RATE_LIMIT_MAX_REQUESTS=50
```

## 🤝 Contribuição

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Padrões de Código

- **JavaScript**: ES6+ com async/await
- **Indentação**: 2 espaços
- **Commits**: Conventional Commits
- **Testes**: Sempre adicione testes para novas features

### Estrutura de Commit
```
feat: adiciona validação de CNPJ
fix: corrige bug na autenticação
docs: atualiza documentação da API
style: melhora formatação do código
```

## 📞 Suporte

### Problemas Comuns

#### Porta 3000 em uso
```bash
PORT=3001 npm start
```

#### Erro de conexão com banco
```bash
# Verifique se o MySQL está rodando
sudo systemctl status mysql

# Para SQLite, delete e recrie
rm database.sqlite
npm run populate-db
```

#### Token JWT expirado
- Tokens expiram em 1 hora
- Gere um novo token usando `/api/auth/token`

### Logs e Debug

```bash
# Ativar logs detalhados
DEBUG=* npm start

# Verificar logs do Docker
docker-compose logs -f
```

### Contato

- **Desenvolvedor**: Mateus Botelho
- **Email**: mateusbtheboss@gmail.com
- **Issues**: [GitHub Issues](link-do-repositorio/issues)
- **Documentação**: Este README.md

---

## 📄 Licença

Este projeto foi desenvolvido por **Mateus Botelho** (mateusbtheboss@gmail.com).  
**© 2025 - Todos os direitos reservados.**

O uso deste software é permitido apenas com autorização expressa do desenvolvedor.

## 👨‍💻 Desenvolvedor

**Mateus Botelho**  
📧 mateusbtheboss@gmail.com  
© 2025 - Todos os direitos reservados
---

**✅ API de Cheque Especial FLC BANK - Desenvolvida com ❤️ Mateus Botelho**

---

### 📊 Status do Projeto

- ✅ API RESTful funcionando
- ✅ Painel administrativo completo
- ✅ Autenticação e autorização
- ✅ Validação de documentos
- ✅ Auditoria completa
- ✅ Docker configurado
- ✅ Documentação completa