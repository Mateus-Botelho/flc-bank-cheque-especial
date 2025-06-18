const jwt = require('jsonwebtoken');
const { ApiApplication } = require('../models');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token de acesso requerido',
        status: 'error'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret-change-in-production');
    
    // Verificar se a aplicação ainda está ativa
    const application = await ApiApplication.findOne({
      where: { client_id: decoded.client_id, is_active: true }
    });

    if (!application) {
      return res.status(401).json({
        error: 'Aplicação não autorizada',
        status: 'error'
      });
    }

    req.application = {
      client_id: decoded.client_id,
      app_name: application.app_name
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        status: 'error'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        status: 'error'
      });
    }

    console.error('Erro na verificação do token:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      status: 'error'
    });
  }
};

// Middleware para verificar sessão administrativa
const verifyAdminSession = (req, res, next) => {
  if (!req.session || !req.session.admin) {
    return res.status(401).json({
      success: false,
      error: 'Sessão administrativa requerida'
    });
  }

  req.admin = req.session.admin;
  next();
};

module.exports = {
  verifyToken,
  verifyAdminSession
};