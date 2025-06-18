const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { AdminUser, Client, LimitChangeLog } = require('../models');
const { verifyAdminSession } = require('../middleware/auth');
const { validateDocument, cleanDocument, formatDocument, validateOperationPassword } = require('../utils/validators');

const router = express.Router();

// Login administrativo
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar dados de entrada
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Usuário e senha são obrigatórios'
      });
    }

    // Buscar usuário no banco
    const user = await AdminUser.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Criar sessão
    req.session.admin = {
      id: user.id,
      username: user.username
    };

    res.json({
      success: true,
      user: {
        username: user.username
      }
    });

  } catch (error) {
    console.error('Erro no login administrativo:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Logout administrativo
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro no logout:', err);
      return res.status(500).json({
        success: false,
        error: 'Erro ao fazer logout'
      });
    }
    
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  });
});

// Buscar cliente por documento
router.post('/client/search', verifyAdminSession, async (req, res) => {
  try {
    const { document } = req.body;

    // Validar dados de entrada
    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Documento é obrigatório'
      });
    }

    // Limpar e validar documento
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(cleanDoc)) {
      return res.status(400).json({
        success: false,
        error: 'Documento inválido'
      });
    }

    // Buscar cliente no banco
    const client = await Client.findOne({
      where: { document: cleanDoc }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Retornar dados do cliente
    res.json({
      success: true,
      client: {
        document: client.document,
        name: client.name,
        account_limit: parseFloat(client.account_limit),
        updated_date: client.updated_date.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na busca de cliente:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Listar todos os clientes (com paginação)
router.get('/clients', verifyAdminSession, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const offset = (page - 1) * perPage;

    // Buscar clientes com paginação
    const { count, rows: clients } = await Client.findAndCountAll({
      limit: perPage,
      offset: offset,
      order: [['name', 'ASC']]
    });

    // Calcular informações de paginação
    const totalPages = Math.ceil(count / perPage);
    
    res.json({
      success: true,
      clients: clients.map(client => ({
        document: client.document,
        name: client.name,
        account_limit: parseFloat(client.account_limit),
        updated_date: client.updated_date.toISOString()
      })),
      pagination: {
        page: page,
        pages: totalPages,
        per_page: perPage,
        total: count,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro na listagem de clientes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar limite do cliente
router.post('/client/update-limit', verifyAdminSession, async (req, res) => {
  try {
    const { document, new_limit, operation_password } = req.body;

    // Validar dados de entrada
    if (!document || new_limit === undefined || !operation_password) {
      return res.status(400).json({
        success: false,
        error: 'Documento, novo limite e senha de operação são obrigatórios'
      });
    }

    // Validar novo limite
    const limit = parseFloat(new_limit);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({
        success: false,
        error: 'Limite deve ser um valor numérico positivo'
      });
    }

    // Validar senha de operação
    if (!validateOperationPassword(operation_password)) {
      return res.status(400).json({
        success: false,
        error: 'Senha de operação deve ter exatamente 8 dígitos'
      });
    }

    // Limpar e validar documento
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(cleanDoc)) {
      return res.status(400).json({
        success: false,
        error: 'Documento inválido'
      });
    }

    // Verificar senha de operação do usuário
    const adminUser = await AdminUser.findByPk(req.admin.id);
    
    if (!adminUser || adminUser.operation_password !== operation_password) {
      return res.status(401).json({
        success: false,
        error: 'Senha de operação incorreta'
      });
    }

    // Buscar cliente
    const client = await Client.findOne({
      where: { document: cleanDoc }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      });
    }

    // Salvar limite anterior para o log
    const previousLimit = parseFloat(client.account_limit);

    // Atualizar limite
    await client.update({
      account_limit: limit,
      updated_date: new Date()
    });

    // Registrar log da alteração
    await LimitChangeLog.create({
      client_document: client.document,
      client_name: client.name,
      previous_limit: previousLimit,
      new_limit: limit,
      changed_by: req.admin.username,
      operation_status: 'success'
    });

    // Retornar dados atualizados
    res.json({
      success: true,
      client: {
        document: client.document,
        name: client.name,
        account_limit: limit,
        updated_date: client.updated_date.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na atualização de limite:', error);
    
    // Registrar log de erro se possível
    try {
      if (req.body.document && req.admin) {
        await LimitChangeLog.create({
          client_document: cleanDocument(req.body.document),
          client_name: 'Erro na operação',
          previous_limit: 0,
          new_limit: parseFloat(req.body.new_limit) || 0,
          changed_by: req.admin.username,
          operation_status: 'failed'
        });
      }
    } catch (logError) {
      console.error('Erro ao registrar log de falha:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Consultar logs de alterações
router.get('/logs', verifyAdminSession, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Buscar logs com paginação
    const { count, rows: logs } = await LimitChangeLog.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['change_date', 'DESC']]
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        client_document: log.client_document,
        client_name: log.client_name,
        previous_limit: parseFloat(log.previous_limit),
        new_limit: parseFloat(log.new_limit),
        changed_by: log.changed_by,
        change_date: log.change_date.toISOString(),
        operation_status: log.operation_status
      })),
      pagination: {
        page: page,
        pages: Math.ceil(count / limit),
        per_page: limit,
        total: count,
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro na consulta de logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Cadastrar novo cliente
router.post('/client/create', verifyAdminSession, async (req, res) => {
  try {
    const { document, name, account_limit, operation_password } = req.body;

    // Validar dados obrigatórios
    if (!document || !name || !operation_password) {
      return res.status(400).json({
        success: false,
        error: 'Documento, nome e senha de operação são obrigatórios'
      });
    }

    // Validar senha de operação
    if (!validateOperationPassword(operation_password)) {
      return res.status(400).json({
        success: false,
        error: 'Senha de operação deve ter exatamente 8 dígitos'
      });
    }

    // Verificar senha de operação do usuário
    const adminUser = await AdminUser.findByPk(req.admin.id);
    
    if (!adminUser || adminUser.operation_password !== operation_password) {
      return res.status(401).json({
        success: false,
        error: 'Senha de operação incorreta'
      });
    }

    // Limpar e validar documento
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(document)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de documento inválido'
      });
    }

    // Validar limite (padrão 0 se não informado)
    let limit = 0;
    if (account_limit !== undefined && account_limit !== null) {
      limit = parseFloat(account_limit);
      if (isNaN(limit) || limit < 0) {
        return res.status(400).json({
          success: false,
          error: 'Limite deve ser um valor numérico positivo'
        });
      }
    }

    // Verificar se cliente já existe
    const existingClient = await Client.findOne({
      where: { document: cleanDoc }
    });

    if (existingClient) {
      return res.status(409).json({
        success: false,
        error: 'Cliente com este documento já existe'
      });
    }

    // Criar novo cliente
    const newClient = await Client.create({
      document: cleanDoc,
      name: name.trim(),
      account_limit: limit,
      created_date: new Date(),
      updated_date: new Date()
    });

    // Registrar log da criação
    await LimitChangeLog.create({
      client_document: newClient.document,
      client_name: newClient.name,
      previous_limit: 0,
      new_limit: limit,
      changed_by: req.admin.username,
      operation_status: 'success'
    });

    // Retornar dados do cliente criado
    res.status(201).json({
      success: true,
      client: {
        document: newClient.document,
        name: newClient.name,
        account_limit: parseFloat(newClient.account_limit),
        created_date: newClient.created_date.toISOString(),
        updated_date: newClient.updated_date.toISOString()
      }
    });

  } catch (error) {
    console.error('Erro na criação de cliente:', error);
    
    // Registrar log de erro se possível
    try {
      if (req.body.document && req.admin) {
        await LimitChangeLog.create({
          client_document: cleanDocument(req.body.document),
          client_name: req.body.name || 'Erro na operação',
          previous_limit: 0,
          new_limit: parseFloat(req.body.account_limit) || 0,
          changed_by: req.admin.username,
          operation_status: 'failed'
        });
      }
    } catch (logError) {
      console.error('Erro ao registrar log de falha:', logError);
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// Consultar logs de alterações
router.get('/logs', verifyAdminSession, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Buscar logs com paginação
    const { count, rows: logs } = await LimitChangeLog.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [['change_date', 'DESC']]
    });

    res.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        client_document: log.client_document,
        client_name: log.client_name,
        previous_limit: parseFloat(log.previous_limit),
        new_limit: parseFloat(log.new_limit),
        changed_by: log.changed_by,
        change_date: log.change_date.toISOString(),
        operation_status: log.operation_status
      })),
      pagination: {
        page: page,
        pages: Math.ceil(count / limit),
        per_page: limit,
        total: count,
        has_next: page < Math.ceil(count / limit),
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Erro na consulta de logs:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

