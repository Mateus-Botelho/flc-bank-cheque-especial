#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { sequelize } = require('./src/config/database');
const { Client, AdminUser, ApiApplication, LimitChangeLog } = require('./src/models');

async function populateDatabase() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida com sucesso.');

    // Sincronizar modelos (criar tabelas se não existirem)
    await sequelize.sync({ force: false });
    console.log('✅ Tabelas sincronizadas.');

    // Verificar se já existem dados
    const existingAdmin = await AdminUser.findOne();
    if (existingAdmin) {
      console.log('ℹ️ Dados já existem no banco. Pulando população inicial.');
      return;
    }

    console.log('🔄 Populando banco de dados com dados iniciais...');

    // Hash das senhas
    const passwordHash = await bcrypt.hash('admin123', 12);
    const secretHash = await bcrypt.hash('secret_key_123', 12);

    // Inserir usuário administrativo
    await AdminUser.create({
      username: 'admin',
      password_hash: passwordHash,
      operation_password: '12345678'
    });

    // Inserir aplicações de API
    await ApiApplication.bulkCreate([
      {
        client_id: 'bank_app_001',
        client_secret: secretHash,
        app_name: 'Sistema Bancário Principal',
        is_active: true
      },
      {
        client_id: 'mobile_app_002',
        client_secret: secretHash,
        app_name: 'App Mobile do Banco',
        is_active: true
      }
    ]);

    // Inserir clientes de exemplo
    await Client.bulkCreate([
      {
        document: '12345678901',
        name: 'João Silva Santos',
        account_limit: 5000.00
      },
      {
        document: '98765432100',
        name: 'Maria Oliveira Costa',
        account_limit: 3000.00
      },
      {
        document: '11122233344',
        name: 'Pedro Almeida Souza',
        account_limit: 7500.00
      },
      {
        document: '55566677788',
        name: 'Ana Carolina Lima',
        account_limit: 2500.00
      },
      {
        document: '12345678000195',
        name: 'Empresa ABC Ltda',
        account_limit: 15000.00
      },
      {
        document: '98765432000123',
        name: 'Comércio XYZ S/A',
        account_limit: 25000.00
      }
    ]);

    // Inserir logs de exemplo
    await LimitChangeLog.bulkCreate([
      {
        client_document: '12345678901',
        client_name: 'João Silva Santos',
        previous_limit: 3000.00,
        new_limit: 5000.00,
        changed_by: 'admin',
        operation_status: 'success'
      },
      {
        client_document: '98765432100',
        client_name: 'Maria Oliveira Costa',
        previous_limit: 2000.00,
        new_limit: 3000.00,
        changed_by: 'admin',
        operation_status: 'success'
      },
      {
        client_document: '11122233344',
        client_name: 'Pedro Almeida Souza',
        previous_limit: 5000.00,
        new_limit: 7500.00,
        changed_by: 'admin',
        operation_status: 'success'
      }
    ]);

    console.log('✅ Banco de dados populado com sucesso!');
    console.log('\n📋 Dados criados:');
    console.log('👤 Admin: admin / admin123');
    console.log('🔑 Senha Operação: 12345678');
    console.log('🔗 API: bank_app_001 / secret_key_123');
    console.log('👥 6 clientes de exemplo');
    console.log('📝 3 logs de exemplo');

  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error);
  } finally {
    await sequelize.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  populateDatabase();
}

module.exports = populateDatabase;

