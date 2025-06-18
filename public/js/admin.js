// API Configuration
const API_BASE_URL = '/api';
let currentClientDocument = null;

// Document validation functions
function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(1))) return false;
    
    return true;
}

function validateDocument(document) {
    if (!document) return false;
    const cleanDocument = document.replace(/\D/g, '');
    
    if (cleanDocument.length === 11) {
        return validateCPF(cleanDocument);
    } else if (cleanDocument.length === 14) {
        return validateCNPJ(cleanDocument);
    }
    
    return false;
}

function cleanDocument(document) {
    return document ? document.replace(/\D/g, '') : '';
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleString('pt-BR');
}

function formatDocument(doc) {
    const cleanDoc = doc.replace(/\D/g, '');
    if (cleanDoc.length <= 11) {
        return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
        return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
}

function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    const icon = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alert.innerHTML = `${icon[type] || ''} ${message}`;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function setLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = loading;
        if (loading) {
            button.innerHTML = '<div class="loading"></div> Carregando...';
        } else {
            switch(buttonId) {
                case 'loginBtn':
                    button.innerHTML = '🔐 Fazer Login';
                    break;
                case 'searchBtn':
                    button.innerHTML = '🔍 Buscar Cliente';
                    break;
                case 'updateBtn':
                    button.innerHTML = '💾 Alterar Limite';
                    break;
            }
        }
    }
}

// Authentication
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    setLoading('loginBtn', true);

    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            document.getElementById('currentUser').textContent = data.user.username;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboardSection').classList.add('active');
            
            showAlert('Login realizado com sucesso!', 'success');
            
            // Load initial logs
            refreshLogs();
        } else {
            showAlert(data.error || 'Credenciais inválidas!', 'error');
        }
    } catch (error) {
        showAlert('Erro ao conectar com o servidor!', 'error');
    } finally {
        setLoading('loginBtn', false);
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('loginForm').reset();
    showAlert('Logout realizado com sucesso!', 'success');
}

// Real-time document validation
function validateDocumentInput() {
    const input = document.getElementById('searchDocument');
    const document = input.value.trim();

    if (!document) {
        input.classList.remove('error', 'success');
        return;
    }

    const cleanDoc = cleanDocument(document);
    
    if (cleanDoc.length < 11) {
        input.classList.remove('error', 'success');
        return;
    }

    const isValid = validateDocument(document);
    
    if (isValid) {
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        input.classList.remove('success');
        input.classList.add('error');
    }
}

// Client search
async function searchClient() {
    const documentInput = document.getElementById('searchDocument').value.trim();
    
    if (!documentInput) {
        showAlert('Digite um CPF/CNPJ!', 'error');
        return;
    }

    // Validate document format first
    if (!validateDocument(documentInput)) {
        showAlert('CPF/CNPJ inválido! Verifique os dígitos verificadores.', 'error');
        return;
    }

    const cleanDoc = cleanDocument(documentInput);
    setLoading('searchBtn', true);
    
    try {
        console.log('🔍 Iniciando busca para documento:', cleanDoc);
        
        // Get API token first
        const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: 'bank_app_001',
                client_secret: 'secret_key_123'
            })
        });

        if (!tokenResponse.ok) {
            throw new Error(`Erro no token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        console.log('🔑 Token obtido:', tokenData.access_token ? 'Sucesso' : 'Falha');

        if (!tokenData.access_token) {
            throw new Error('Token não recebido');
        }

        // Search client using existing API
        const clientResponse = await fetch(`${API_BASE_URL}/overdraft/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
                document: cleanDoc
            })
        });

        console.log('📡 Status da busca:', clientResponse.status);

        if (!clientResponse.ok) {
            throw new Error(`Erro na busca: ${clientResponse.status}`);
        }

        const clientData = await clientResponse.json();
        console.log('📦 JSON recebido da API:', clientData);
        console.log('📊 Campos disponíveis:', Object.keys(clientData));

        if (clientData.status === 'success') {
            console.log('✅ Status success - iniciando exibição...');
            
            // Salvar documento atual
            currentClientDocument = cleanDoc;
            
            // PRIMEIRO: Mostrar a seção de resultados
            const resultSection = document.getElementById('clientResult');
            if (resultSection) {
                resultSection.style.display = 'block';
                console.log('✅ Seção clientResult exibida PRIMEIRO');
            } else {
                console.error('❌ Elemento clientResult não encontrado!');
            }
            
            // SEGUNDO: Mapear dados para os campos
            displayClient(cleanDoc, clientData);
            
            // Confirmar sucesso
            showAlert('Cliente encontrado!', 'success');
            console.log('🎯 Processo completo - seção deve estar visível');
            
        } else {
            console.log('❌ Status não é success:', clientData.status);
            document.getElementById('clientResult').style.display = 'none';
            currentClientDocument = null;
            showAlert('Cliente não encontrado!', 'error');
        }

    } catch (error) {
        console.error('❌ Erro na busca:', error);
        
        // Não mostrar erro se conseguiu obter dados
        if (error.message.includes('Erro na busca') && !error.message.includes('404')) {
            showAlert('Erro de conexão, mas dados podem ter sido obtidos', 'warning');
        } else {
            showAlert(`Erro ao buscar cliente: ${error.message}`, 'error');
        }
        
        document.getElementById('clientResult').style.display = 'none';
        currentClientDocument = null;
    } finally {
        setLoading('searchBtn', false);
        console.log('🔄 Busca finalizada');
    }
}

function displayClient(document, data) {
    console.log('📝 Preenchendo campos com dados da API...');
    console.log('📄 Documento:', document);
    console.log('📊 Dados da API:', data);
    
    try {
        // 1. PREENCHER documento formatado
        const documentElement = document.getElementById('clientDocument');
        if (documentElement) {
            documentElement.textContent = formatDocument(document);
            console.log('✅ Documento PREENCHIDO:', formatDocument(document));
        } else {
            console.error('❌ Elemento clientDocument não encontrado');
        }
        
        // 2. PREENCHER limite atual com dados da API
        const limitElement = document.getElementById('currentLimit');
        if (limitElement && data.account_limit !== undefined) {
            limitElement.textContent = formatCurrency(data.account_limit);
            console.log('✅ Limite PREENCHIDO:', formatCurrency(data.account_limit));
        } else {
            console.error('❌ Elemento currentLimit não encontrado ou account_limit ausente');
        }
        
        // 3. PREENCHER data com dados da API
        const updateElement = document.getElementById('lastUpdate');
        if (updateElement && data.updated_date) {
            updateElement.textContent = formatDate(data.updated_date);
            console.log('✅ Data PREENCHIDA:', formatDate(data.updated_date));
        } else {
            console.error('❌ Elemento lastUpdate não encontrado ou updated_date ausente');
        }
        
        // 4. PREENCHER campo novo limite com valor atual da API
        const newLimitElement = document.getElementById('newLimit');
        if (newLimitElement && data.account_limit !== undefined) {
            newLimitElement.value = data.account_limit;
            console.log('✅ Campo newLimit PREENCHIDO com:', data.account_limit);
        } else {
            console.error('❌ Elemento newLimit não encontrado');
        }
        
        // 5. LIMPAR campo senha
        const passwordElement = document.getElementById('operationPassword');
        if (passwordElement) {
            passwordElement.value = '';
            console.log('✅ Campo senha LIMPO');
        } else {
            console.error('❌ Elemento operationPassword não encontrado');
        }
        
        console.log('🎉 Todos os campos PREENCHIDOS com dados da API!');
        
    } catch (error) {
        console.error('❌ Erro ao PREENCHER campos:', error);
    }
}

// Update limit
async function updateLimit() {
    const newLimit = parseFloat(document.getElementById('newLimit').value);
    const operationPassword = document.getElementById('operationPassword').value;

    if (!currentClientDocument) {
        showAlert('Nenhum cliente selecionado!', 'error');
        return;
    }

    if (isNaN(newLimit) || newLimit < 0) {
        showAlert('Limite deve ser um valor positivo!', 'error');
        return;
    }

    if (!operationPassword || operationPassword.length !== 8 || !/^\d{8}$/.test(operationPassword)) {
        showAlert('Senha de operação deve ter exatamente 8 dígitos!', 'error');
        return;
    }

    setLoading('updateBtn', true);

    try {
        const response = await fetch(`${API_BASE_URL}/admin/client/update-limit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                document: currentClientDocument,
                new_limit: newLimit,
                operation_password: operationPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            // Update display with new data
            displayClient(currentClientDocument, {
                account_limit: newLimit,
                updated_date: new Date().toISOString()
            });
            document.getElementById('operationPassword').value = '';
            showAlert('Limite alterado com sucesso!', 'success');
            
            // Refresh logs
            refreshLogs();
        } else {
            if (data.error.includes('senha')) {
                showAlert('Senha de operação incorreta!', 'error');
            } else {
                showAlert(data.error || 'Erro ao alterar limite!', 'error');
            }
        }
    } catch (error) {
        showAlert('Erro ao alterar limite!', 'error');
    } finally {
        setLoading('updateBtn', false);
    }
}

// Logs
async function refreshLogs() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/logs?limit=10`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            displayLogs(data.logs);
        } else {
            console.error('Erro ao carregar logs:', data.error);
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
    }
}

function displayLogs(logs) {
    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999;">Nenhum log encontrado</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(log.change_date)}</td>
            <td>${formatDocument(log.client_document)}</td>
            <td>${log.client_name}</td>
            <td>${formatCurrency(log.previous_limit)}</td>
            <td>${formatCurrency(log.new_limit)}</td>
            <td>${log.changed_by}</td>
            <td><span class="status-badge status-${log.operation_status}">${log.operation_status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// API Testing
async function testAPI() {
    try {
        const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                client_id: 'bank_app_001',
                client_secret: 'secret_key_123'
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.access_token) {
            showAlert('Erro ao obter token de API!', 'error');
            return;
        }

        const testResponse = await fetch(`${API_BASE_URL}/overdraft/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenData.access_token}`
            },
            body: JSON.stringify({
                document: '12345678901'
            })
        });

        const testData = await testResponse.json();

        if (testData.status === 'success') {
            showAlert(`API funcionando! Limite: ${formatCurrency(testData.account_limit)}`, 'success');
        } else {
            showAlert('Erro no teste da API!', 'error');
        }
    } catch (error) {
        showAlert('Erro ao testar API!', 'error');
    }
}

function showApiCredentials() {
    showModal('Credenciais da API', `
        <p><strong>Client ID:</strong> bank_app_001</p>
        <p><strong>Client Secret:</strong> secret_key_123</p>
        <br>
        <p><strong>Endpoint de Token:</strong></p>
        <code>POST /api/auth/token</code>
        <br><br>
        <p><strong>Endpoint de Consulta:</strong></p>
        <code>POST /api/overdraft/check</code>
    `);
}

// Função de teste para preencher com dados reais da API
function testFillData() {
    console.log('🧪 Teste: Preenchendo com dados da API...');
    
    // Dados exatos que você recebeu da API
    const apiData = {
        account_limit: 1000,
        updated_date: "2025-06-18T16:11:32.517Z",
        status: "success"
    };
    
    const documento = '02496347243';
    
    // 1. Mostrar seção primeiro
    const resultSection = document.getElementById('clientResult');
    if (resultSection) {
        resultSection.style.display = 'block';
        console.log('✅ Seção exibida');
    }
    
    // 2. Preencher campos com dados da API
    console.log('📝 Preenchendo campos...');
    
    // Documento
    document.getElementById('clientDocument').textContent = formatDocument(documento);
    console.log('📄 Documento preenchido:', formatDocument(documento));
    
    // Limite
    document.getElementById('currentLimit').textContent = formatCurrency(apiData.account_limit);
    console.log('💰 Limite preenchido:', formatCurrency(apiData.account_limit));
    
    // Data
    document.getElementById('lastUpdate').textContent = formatDate(apiData.updated_date);
    console.log('📅 Data preenchida:', formatDate(apiData.updated_date));
    
    // Campo novo limite
    document.getElementById('newLimit').value = apiData.account_limit;
    console.log('🔢 Campo preenchido com:', apiData.account_limit);
    
    // Limpar senha
    document.getElementById('operationPassword').value = '';
    console.log('🔐 Senha limpa');
    
    console.log('✅ Teste completo - dados da API preenchidos!');
}

window.testFill = testFillData;

// Função para verificar se elementos HTML existem
function checkHtmlElements() {
    console.log('🔍 Verificando elementos HTML...');
    
    const elements = [
        'clientResult',
        'clientDocument', 
        'currentLimit',
        'lastUpdate',
        'newLimit',
        'operationPassword'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '✅ Existe' : '❌ Não existe');
    });
}

// Adicionar funções globais para debug
// Adicionar funções globais para debug
window.testFill = testFillData;
window.checkElements = checkHtmlElements;
function showModal(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').innerHTML = message;
    document.getElementById('confirmModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', login);
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Search document input validation
    document.getElementById('searchDocument').addEventListener('input', validateDocumentInput);
    
    // Search client button
    document.getElementById('searchBtn').addEventListener('click', searchClient);
    
    // Update limit button
    document.getElementById('updateBtn').addEventListener('click', updateLimit);
    
    // API test buttons
    document.getElementById('testApiBtn').addEventListener('click', testAPI);
    document.getElementById('showCredentialsBtn').addEventListener('click', showApiCredentials);
    
    // Refresh logs button
    document.getElementById('refreshLogsBtn').addEventListener('click', refreshLogs);
    
    // Modal close buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('closeModalFooterBtn').addEventListener('click', closeModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('confirmModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});