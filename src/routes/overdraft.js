const express = require('express');
const { Client } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { validateDocument, cleanDocument, testDocumentValidation } = require('../utils/validators');

const router = express.Router();

// Endpoint para consultar limite de cheque especial
router.post('/check', verifyToken, async (req, res) => {
  try {
    const { document } = req.body;

    // Validar dados de entrada
    if (!document) {
      return res.status(400).json({
        error: 'Documento é obrigatório',
        status: 'error'
      });
    }

    // Limpar e validar documento (aceita com ou sem máscara)
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(document)) {
      return res.status(400).json({
        error: 'Formato de documento inválido',
        status: 'error'
      });
    }

    // Buscar cliente no banco
    const client = await Client.findOne({
      where: { document: cleanDoc }
    });

    if (!client) {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        status: 'error'
      });
    }

    // Retornar dados do limite
    res.json({
      account_limit: parseFloat(client.account_limit),
      updated_date: client.updated_date.toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Erro na consulta de limite:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
});

// Endpoint de debug para testar validação de documentos
router.post('/debug/validate', verifyToken, (req, res) => {
  try {
    const { document } = req.body;
    
    if (!document) {
      return res.status(400).json({
        error: 'Documento é obrigatório',
        status: 'error'
      });
    }

    const cleanDoc = cleanDocument(document);
    const isValid = validateDocument(cleanDoc);

    res.json({
      original: document,
      cleaned: cleanDoc,
      length: cleanDoc.length,
      is_valid: isValid,
      status: 'success'
    });

  } catch (error) {
    console.error('Erro no debug de validação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
});

// Endpoint para listar todos os clientes (para debug)
router.get('/debug/clients', verifyToken, async (req, res) => {
  try {
    const clients = await Client.findAll({
      limit: 10,
      order: [['name', 'ASC']]
    });

    res.json({
      clients: clients.map(client => ({
        document: client.document,
        name: client.name,
        account_limit: parseFloat(client.account_limit)
      })),
      total: clients.length,
      status: 'success'
    });

  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
});

// Endpoint para cadastrar novo cliente (API pública)
router.post('/client/create', verifyToken, async (req, res) => {
  try {
    const { document, name, account_limit } = req.body;

    // Validar dados obrigatórios
    if (!document || !name) {
      return res.status(400).json({
        error: 'Documento e nome são obrigatórios',
        status: 'error'
      });
    }

    // Limpar e validar documento
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(document)) {
      return res.status(400).json({
        error: 'Formato de documento inválido',
        status: 'error'
      });
    }

    // Validar limite (padrão 0 se não informado)
    let limit = 0;
    if (account_limit !== undefined && account_limit !== null) {
      limit = parseFloat(account_limit);
      if (isNaN(limit) || limit < 0) {
        return res.status(400).json({
          error: 'Limite deve ser um valor numérico positivo',
          status: 'error'
        });
      }
    }

    // Verificar se cliente já existe
    const existingClient = await Client.findOne({
      where: { document: cleanDoc }
    });

    if (existingClient) {
      return res.status(409).json({
        error: 'Cliente com este documento já existe',
        status: 'error'
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
      changed_by: req.application.app_name,
      operation_status: 'success'
    });

    // Retornar dados do cliente criado
    res.status(201).json({
      client_id: newClient.id,
      document: newClient.document,
      name: newClient.name,
      account_limit: parseFloat(newClient.account_limit),
      created_date: newClient.created_date.toISOString(),
      status: 'success'
    });

  } catch (error) {
    console.error('Erro na criação de cliente via API:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
});

// Endpoint de health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Overdraft API'
  });
});

module.exports = router;