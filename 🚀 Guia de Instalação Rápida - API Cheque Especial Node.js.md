# 🚀 Guia de Instalação Rápida - API Cheque Especial Node.js

## ⚡ Início Rápido (5 minutos)

### 1. Pré-requisitos
- Node.js 18+
- npm ou yarn

### 2. Instalação
```bash
# Clone o projeto
git clone <repository-url>
cd cheque-especial-nodejs

# Instale dependências
npm install

# Configure banco SQLite (desenvolvimento)
npm run populate-db

# Inicie a aplicação
npm start
```

### 3. Acesso
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health**: http://localhost:3000/health

### 4. Credenciais de Teste
- **Admin**: admin / admin123
- **Senha Operação**: 12345678
- **API**: bank_app_001 / secret_key_123

## 🐳 Com Docker (Recomendado)

```bash
# Inicie todos os serviços
docker-compose up -d

# Acesse: http://localhost:3000
```

## 🧪 Teste Rápido da API

```bash
# 1. Obter token
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"client_id":"bank_app_001","client_secret":"secret_key_123"}'

# 2. Consultar limite (substitua {TOKEN})
curl -X POST http://localhost:3000/api/overdraft/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{"document":"12345678901"}'
```

## 📱 Teste do Painel Admin

1. Acesse: http://localhost:3000
2. Login: admin / admin123
3. Busque cliente: 12345678901
4. Teste as funcionalidades

## 🔧 Configuração de Produção

### MySQL
```bash
# 1. Configure .env
DB_HOST=mysql-server
DB_NAME=cheque_especial
DB_USER=root
DB_PASSWORD=sua-senha-segura

# 2. Inicie com Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Variáveis Importantes
```bash
NODE_ENV=production
JWT_SECRET=sua-chave-jwt-256-bits
SESSION_SECRET=sua-chave-sessao-256-bits
```

## 🆘 Problemas Comuns

### Porta 3000 em uso
```bash
# Mude a porta no .env
PORT=3001
```

### Erro de banco
```bash
# Recrie o banco SQLite
rm database.sqlite
npm run populate-db
```

### Token inválido
- Verifique se o token não expirou (1 hora)
- Gere um novo token

## 📞 Suporte

- **Documentação completa**: README.md
- **Logs**: `npm start` mostra logs detalhados
- **Health check**: http://localhost:3000/health

---

**✅ Pronto! Sua API está funcionando!**

