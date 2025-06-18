-- Criação do banco de dados e tabelas para API de Cheque Especial

USE cheque_especial;

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    account_limit DECIMAL(15,2) DEFAULT 0.00,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document (document)
);

-- Tabela de usuários administrativos
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    operation_password VARCHAR(8) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    active BOOLEAN DEFAULT TRUE
);

-- Tabela de aplicações autorizadas para API
CREATE TABLE IF NOT EXISTS api_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    client_secret VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Tabela de logs de alterações
CREATE TABLE IF NOT EXISTS limit_change_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_document VARCHAR(20) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    previous_limit DECIMAL(15,2) NOT NULL,
    new_limit DECIMAL(15,2) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operation_status ENUM('success', 'failed') DEFAULT 'success',
    ip_address VARCHAR(45),
    INDEX idx_client_document (client_document),
    INDEX idx_change_date (change_date)
);

-- Inserção de dados iniciais

-- Usuário administrativo padrão (admin / admin123, senha operação: 12345678)
INSERT INTO admin_users (username, password_hash, operation_password) VALUES 
('admin', 'scrypt:32768:8:1$VQzKxJGvNhEQzKxJ$46c2c9b5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5e1c8e8c5', '12345678');

-- Aplicação de exemplo para testes da API
INSERT INTO api_applications (client_id, client_secret, app_name) VALUES 
('bank_app_001', 'secret_key_123', 'Sistema Bancário Principal'),
('mobile_app_002', 'mobile_secret_456', 'App Mobile do Banco');

-- Clientes de exemplo
INSERT INTO clients (document, name, account_limit) VALUES 
('12345678901', 'João Silva Santos', 5000.00),
('98765432100', 'Maria Oliveira Costa', 3000.00),
('11122233344', 'Pedro Almeida Souza', 7500.00),
('55566677788', 'Ana Carolina Lima', 2500.00),
('12345678000195', 'Empresa ABC Ltda', 15000.00),
('98765432000123', 'Comércio XYZ S/A', 25000.00);

-- Logs de exemplo
INSERT INTO limit_change_logs (client_document, client_name, previous_limit, new_limit, changed_by, operation_status) VALUES 
('12345678901', 'João Silva Santos', 3000.00, 5000.00, 'admin', 'success'),
('98765432100', 'Maria Oliveira Costa', 2000.00, 3000.00, 'admin', 'success'),
('11122233344', 'Pedro Almeida Souza', 5000.00, 7500.00, 'admin', 'success');

