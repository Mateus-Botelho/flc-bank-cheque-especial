const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Modelo de Cliente
const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  document: {
    type: DataTypes.STRING(14),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [11, 14]
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  account_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_date'
  },
  updated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_date'
  }
}, {
  tableName: 'clients',
  timestamps: false,
  indexes: [
    {
      fields: ['document']
    }
  ]
});

// Modelo de Usuário Administrativo
const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  operation_password: {
    type: DataTypes.STRING(8),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [8, 8],
      isNumeric: true
    }
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_date'
  },
  updated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_date'
  }
}, {
  tableName: 'admin_users',
  timestamps: false
});

// Modelo de Aplicação de API
const ApiApplication = sequelize.define('ApiApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  client_secret: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  app_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_date'
  },
  updated_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_date'
  }
}, {
  tableName: 'api_applications',
  timestamps: false
});

// Modelo de Log de Alterações
const LimitChangeLog = sequelize.define('LimitChangeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  client_document: {
    type: DataTypes.STRING(14),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  previous_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  new_limit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  changed_by: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  change_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'change_date'
  },
  operation_status: {
    type: DataTypes.ENUM('success', 'failed'),
    defaultValue: 'success'
  }
}, {
  tableName: 'limit_change_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['client_document']
    },
    {
      fields: ['change_date']
    }
  ]
});

module.exports = {
  Client,
  AdminUser,
  ApiApplication,
  LimitChangeLog
};

