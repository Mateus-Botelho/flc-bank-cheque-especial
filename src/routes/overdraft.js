const express = require('express');
const { Client } = require('../models');
const { verifyToken } = require('../middleware/auth');
const { validateDocument, cleanDocument } = require('../utils/validators');

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

    // Limpar e validar documento
    const cleanDoc = cleanDocument(document);
    
    if (!validateDocument(cleanDoc)) {
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

// Endpoint de health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Overdraft API'
  });
});

module.exports = router;

