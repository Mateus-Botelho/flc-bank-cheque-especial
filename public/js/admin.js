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
    // Remove alert anterior se existir
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

    // Auto remover após 5 segundos
    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

function setLoading(buttonId, loading) {
    const button = document.querySelector(`#${buttonId}`);
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
                    button.innerHTML = '🔍 Consultar Limite';
                    break;
                case 'updateBtn':
                    button.innerHTML = '💾 Alterar Limite';
                    break;
                default:
                    button.innerHTML = 'Executar';
            }
        }
    }
}

// Display client data function - VERSÃO SEGURA
function displayClient(documentValue, data) {



    
    // Usar setTimeout para garantir que o DOM esteja pronto
    setTimeout(() => {
        try {
            // Método alternativo para acessar elementos do DOM
            const getElement = (id) => {
                return document.querySelector(`#${id}`);
            };
            
            // 1. DOCUMENTO - preencher o campo com ID "clientDocument"
            const clientDocumentElement = getElement('clientDocument');
            if (clientDocumentElement) {
                clientDocumentElement.textContent = formatDocument(documentValue);

            } else {
                console.error('❌ Elemento clientDocument não encontrado');
            }
            
            // 2. LIMITE - preencher o campo com ID "currentLimit"
            const currentLimitElement = getElement('currentLimit');
            if (currentLimitElement && data.account_limit !== undefined) {
                currentLimitElement.textContent = formatCurrency(data.account_limit);

            } else {
                console.error('❌ Elemento currentLimit não encontrado ou account_limit ausente');
            }
            
            // 3. ÚLTIMA ATUALIZAÇÃO - preencher o campo com ID "lastUpdate"
            const lastUpdateElement = getElement('lastUpdate');
            if (lastUpdateElement && data.updated_date) {
                lastUpdateElement.textContent = formatDate(data.updated_date);

            } else {
                console.error('❌ Elemento lastUpdate não encontrado ou updated_date ausente');
            }
            
            // 4. PREENCHER campo "newLimit" com o valor atual para facilitar edição
            const newLimitElement = getElement('newLimit');
            if (newLimitElement && data.account_limit !== undefined) {
                newLimitElement.value = data.account_limit;

            }
            
            // 5. LIMPAR campo de senha
            const operationPasswordElement = getElement('operationPassword');
            if (operationPasswordElement) {
                operationPasswordElement.value = '';

            }
            

            
        } catch (error) {
            console.error('❌ Erro ao preencher campos:', error);
            
            // Método de fallback - tentar preencher diretamente no HTML
            tryDirectHTMLUpdate(documentValue, data);
        }
    }, 200); // Aguardar 200ms para garantir que o DOM esteja estável
}

// Função de fallback que atualiza o HTML diretamente
function tryDirectHTMLUpdate(documentValue, data) {

    
    try {
        // Encontrar a seção de resultados
        const resultSection = document.querySelector('#clientResult');
        if (!resultSection) {
            console.error('❌ Seção clientResult não encontrada');
            return;
        }
        
        // Encontrar elementos por classe ou posição
        const infoValues = resultSection.querySelectorAll('.info-value');
        
        if (infoValues.length >= 3) {
            // Primeira info-value = documento
            infoValues[0].textContent = formatDocument(documentValue);
            infoValues[0].id = 'clientDocument';

            
            // Segunda info-value = limite
            infoValues[1].textContent = formatCurrency(data.account_limit);
            infoValues[1].id = 'currentLimit';

            
            // Terceira info-value = data
            infoValues[2].textContent = formatDate(data.updated_date);
            infoValues[2].id = 'lastUpdate';

        }
        
        // Tentar preencher campos de input
        const newLimitInput = resultSection.querySelector('input[type="number"]');
        if (newLimitInput) {
            newLimitInput.value = data.account_limit;
            newLimitInput.id = 'newLimit';

        }
        
        const passwordInput = resultSection.querySelector('input[type="password"]');
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.id = 'operationPassword';

        }
        

        
    } catch (error) {
        console.error('❌ Erro no método alternativo:', error);
        showAlert('Dados recebidos mas não foi possível exibir', 'warning');
    }
}

// Authentication functions
async function login(event) {
    event.preventDefault();
    
    const usernameElement = document.querySelector('#username');
    const passwordElement = document.querySelector('#password');
    
    if (!usernameElement || !passwordElement) {
        showAlert('Erro: Campos de login não encontrados', 'error');
        return;
    }
    
    const username = usernameElement.value;
    const password = passwordElement.value;

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
            const currentUserElement = document.querySelector('#currentUser');
            if (currentUserElement) {
                currentUserElement.textContent = data.user.username;
            }
            
            const loginSection = document.querySelector('#loginSection');
            const dashboardSection = document.querySelector('#dashboardSection');
            
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.classList.add('active');
            
            showAlert('Login realizado com sucesso!', 'success');
            
            // Load initial logs
            refreshLogs();
        } else {
            showAlert(data.error || 'Credenciais inválidas!', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
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
    
    const loginSection = document.querySelector('#loginSection');
    const dashboardSection = document.querySelector('#dashboardSection');
    const loginForm = document.querySelector('#loginForm');
    
    if (loginSection) loginSection.style.display = 'block';
    if (dashboardSection) dashboardSection.classList.remove('active');
    if (loginForm) loginForm.reset();
    
    showAlert('Logout realizado com sucesso!', 'success');
}

// Client search functions
function validateDocumentInput() {
    const input = document.querySelector('#searchDocument');
    if (!input) return;
    
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

async function searchClient() {

    
    // Usar querySelector em vez de getElementById
    const documentInput = document.querySelector('#searchDocument');
    if (!documentInput) {
        console.error('❌ Campo searchDocument não encontrado');
        showAlert('Erro: Campo de busca não encontrado', 'error');
        return;
    }
    
    const documentValue = documentInput.value.trim();
    
    if (!documentValue) {
        showAlert('Digite um CPF/CNPJ!', 'error');
        return;
    }

    // Validar formato do documento
    if (!validateDocument(documentValue)) {
        showAlert('CPF/CNPJ inválido! Verifique os dígitos verificadores.', 'error');
        return;
    }

    const cleanDoc = cleanDocument(documentValue);
    setLoading('searchBtn', true);
    
    try {

        
        // 1. Obter token da API
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
            throw new Error(`Erro ao obter token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();


        if (!tokenData.access_token) {
            throw new Error('Token não recebido da API');
        }

        // 2. Consultar limite do cliente
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



        if (!clientResponse.ok) {
            if (clientResponse.status === 404) {
                throw new Error('Cliente não encontrado');
            }
            throw new Error(`Erro na consulta: ${clientResponse.status}`);
        }

        const clientData = await clientResponse.json();


        // 3. Verificar se a consulta foi bem-sucedida
        if (clientData.status === 'success') {
            // Salvar documento atual para operações futuras
            currentClientDocument = cleanDoc;
            
            // 4. MOSTRAR a seção de resultados
            const resultSection = document.querySelector('#clientResult');
            if (resultSection) {
                resultSection.style.display = 'block';

            } else {
                console.error('❌ Seção clientResult não encontrada no HTML');
            }
            
            // 5. PREENCHER os dados nos campos HTML
            displayClient(cleanDoc, clientData);
            
            showAlert('Cliente encontrado com sucesso!', 'success');
            
        } else {

            hideClientResultSafe();
            currentClientDocument = null;
            showAlert('Cliente não encontrado!', 'error');
        }

    } catch (error) {
        console.error('❌ Erro na busca:', error);
        showAlert(`Erro: ${error.message}`, 'error');
        hideClientResultSafe();
        currentClientDocument = null;
    } finally {
        setLoading('searchBtn', false);

    }
}

// Função auxiliar segura para esconder resultados
function hideClientResultSafe() {
    const resultSection = document.querySelector('#clientResult');
    if (resultSection) {
        resultSection.style.display = 'none';

    }
}

// Função updateLimit simples para conectar com a API existente
async function updateLimit() {

    
    // Obter valores dos campos
    const newLimitElement = document.querySelector('#newLimit');
    const operationPasswordElement = document.querySelector('#operationPassword');
    
    if (!newLimitElement || !operationPasswordElement) {
        showAlert('Erro: Campos não encontrados', 'error');
        return;
    }
    
    const newLimit = parseFloat(newLimitElement.value);
    const operationPassword = operationPasswordElement.value;

    // Validações básicas
    if (!currentClientDocument) {
        showAlert('Nenhum cliente selecionado!', 'error');
        return;
    }

    if (isNaN(newLimit) || newLimit < 0) {
        showAlert('Digite um valor válido para o limite!', 'error');
        return;
    }

    if (!operationPassword || operationPassword.length !== 8) {
        showAlert('Senha de operação deve ter 8 dígitos!', 'error');
        return;
    }

    // Mostrar loading
    setLoading('updateBtn', true);

    try {
        // Fazer requisição para API
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
            // Sucesso - atualizar a tela
            const currentLimitElement = document.querySelector('#currentLimit');
            if (currentLimitElement) {
                currentLimitElement.textContent = formatCurrency(newLimit);
            }
            
            // Limpar senha
            operationPasswordElement.value = '';
            
            showAlert('Limite alterado com sucesso!', 'success');
            
            // Atualizar logs
            refreshLogs();
            
        } else {
            // Erro da API
            showAlert(data.error || 'Erro ao alterar limite!', 'error');
        }

    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de comunicação com o servidor!', 'error');
    } finally {
        setLoading('updateBtn', false);
    }
}

// Garantir que o event listener está configurado
function ensureUpdateButtonListener() {
    const updateBtn = document.querySelector('#updateBtn');
    if (updateBtn && !updateBtn.hasAttribute('data-listener-added')) {
        updateBtn.addEventListener('click', updateLimit);
        updateBtn.setAttribute('data-listener-added', 'true');

    }
}

// Logs functions
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
    const tbody = document.querySelector('#logTableBody');
    if (!tbody) {
        console.warn('⚠️ Elemento logTableBody não encontrado');
        return;
    }
    
    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum log encontrado</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(log.change_date)}</td>
            <td>${formatDocument(log.client_document)}</td>
            <td>${formatCurrency(log.previous_limit)}</td>
            <td>${formatCurrency(log.new_limit)}</td>
            <td>${log.changed_by}</td>
            <td><span class="status-badge status-${log.operation_status}">${log.operation_status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// API Testing functions
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
        console.error('Erro ao testar API:', error);
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

// Modal functions
function showModal(title, message) {
    const modalTitle = document.querySelector('#modalTitle');
    const modalMessage = document.querySelector('#modalMessage');
    const modal = document.querySelector('#confirmModal');
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.innerHTML = message;
    if (modal) modal.style.display = 'block';
}

function closeModal() {
    const modal = document.querySelector('#confirmModal');
    if (modal) modal.style.display = 'none';
}

// Event listeners setup - VERSÃO SEGURA
function setupEventListeners() {

    
    // Login form
    const loginForm = document.querySelector('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', login);

    }
    
    // Search document input validation
    const searchDocument = document.querySelector('#searchDocument');
    if (searchDocument) {
        searchDocument.addEventListener('input', validateDocumentInput);

    }
    
    // Search button
    const searchBtn = document.querySelector('#searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchClient);

    }
    
    // API test buttons
    const testApiBtn = document.querySelector('#testApiBtn');
    if (testApiBtn) {
        testApiBtn.addEventListener('click', testAPI);

    }
    
    const showCredentialsBtn = document.querySelector('#showCredentialsBtn');
    if (showCredentialsBtn) {
        showCredentialsBtn.addEventListener('click', showApiCredentials);

    }
    
    // Refresh logs button
    const refreshLogsBtn = document.querySelector('#refreshLogsBtn');
    if (refreshLogsBtn) {
        refreshLogsBtn.addEventListener('click', refreshLogs);

    }
    
    // Modal close buttons
    const closeModalBtn = document.querySelector('#closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    const closeModalFooterBtn = document.querySelector('#closeModalFooterBtn');
    if (closeModalFooterBtn) {
        closeModalFooterBtn.addEventListener('click', closeModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.querySelector('#confirmModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Update button (adicionar após um delay para garantir que existe)
    setTimeout(() => {
        const updateBtn = document.querySelector('#updateBtn');
        if (updateBtn && !updateBtn.hasAttribute('data-listener-added')) {
            updateBtn.addEventListener('click', updateLimit);
            updateBtn.setAttribute('data-listener-added', 'true');

        }
    }, 1000);
    

}

// Initialize when DOM is ready
function initializeApp() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeApp);
        return;
    }
    

    setupEventListeners();
}

// Função de teste para verificar exibição
function testDisplaySafe() {

    
    const testData = {
        account_limit: 1000,
        updated_date: "2025-06-18T16:11:32.517Z",
        status: "success"
    };
    
    const testDocument = "02496347243";
    
    // Mostrar seção
    const resultSection = document.querySelector('#clientResult');
    if (resultSection) {
        resultSection.style.display = 'block';

    }
    
    // Testar preenchimento
    displayClient(testDocument, testData);
}

// Função para verificar elementos HTML
function checkHtmlElements() {

    
    const requiredElements = [
        'clientResult',     // Seção principal
        'clientDocument',   // Campo documento
        'currentLimit',     // Campo limite
        'lastUpdate',       // Campo última atualização
        'newLimit',         // Campo novo limite
        'operationPassword' // Campo senha
    ];
    
    requiredElements.forEach(id => {
        const element = document.querySelector(`#${id}`);

    });
    
    return requiredElements.every(id => document.querySelector(`#${id}`) !== null);
}

// Global functions
window.logout = logout;
window.testDisplaySafe = testDisplaySafe;
window.checkElements = checkHtmlElements;

// Initialize app
initializeApp();