const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ApiApplication } = require('../models');

const router = express.Router();

// Endpoint para obter token de autenticação
router.post('/token', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;

    // Validar dados de entrada
    if (!client_id || !client_secret) {
      return res.status(400).json({
        error: 'client_id e client_secret são obrigatórios',
        status: 'error'
      });
    }

    // Buscar aplicação no banco
    const application = await ApiApplication.findOne({
      where: { 
        client_id: client_id,
        is_active: true 
      }
    });

    if (!application) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        status: 'error'
      });
    }

    // Verificar client_secret
    const isValidSecret = await bcrypt.compare(client_secret, application.client_secret);
    
    if (!isValidSecret) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        status: 'error'
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        client_id: application.client_id,
        app_name: application.app_name
      },
      process.env.JWT_SECRET || 'your-jwt-secret-change-in-production',
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hora em segundos
      status: 'success'
    });

  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
});

// Endpoint de health check para autenticação
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Authentication API'
  });
});

module.exports = router;