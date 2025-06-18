        // API Configuration
        const API_BASE_URL = '/api';
        let currentClientDocument = null;

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
                    // Restore original button text
                    switch(buttonId) {
                        case 'loginBtn':
                            button.innerHTML = '🔐 Fazer Login';
                            break;
                        case 'searchBtn':
                            button.innerHTML = '🔍 Buscar Cliente';
                            break;
                        case 'updateBtn':
                            button.innerHTML = '💾 Atualizar Limite';
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
                    
                    // Load initial data
                    refreshLogs();
                } else {
                    showAlert(data.error || 'Credenciais inválidas!', 'error');
                }
            } catch (error) {
                showAlert('Erro ao conectar com o servidor. Verifique se a API está rodando.', 'error');
                console.error('Login error:', error);
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

        // Client search
        async function searchClient() {
            const documentInput = document.getElementById('searchDocument').value.replace(/\D/g, '');
            
            if (!documentInput) {
                showAlert('Digite um CPF/CNPJ válido!', 'error');
                return;
            }

            setLoading('searchBtn', true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/admin/client/search`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ document: documentInput })
                });

                const data = await response.json();

                if (data.success) {
                    currentClientDocument = documentInput;
                    displayClient(data.client);
                    document.getElementById('clientResult').style.display = 'block';
                    document.getElementById('clientsList').style.display = 'none';
                    showAlert('Cliente encontrado!', 'success');
                } else {
                    document.getElementById('clientResult').style.display = 'none';
                    showAlert(data.error || 'Cliente não encontrado!', 'error');
                }
            } catch (error) {
                showAlert('Erro ao buscar cliente!', 'error');
                console.error('Search error:', error);
            } finally {
                setLoading('searchBtn', false);
            }
        }

        function displayClient(client) {
            document.getElementById('clientDocument').textContent = formatDocument(client.document);
            document.getElementById('clientName').textContent = client.name;
            document.getElementById('currentLimit').textContent = formatCurrency(client.account_limit);
            document.getElementById('lastUpdate').textContent = formatDate(client.updated_date);
            document.getElementById('newLimit').value = client.account_limit;
        }

        // Show all clients
        async function showAllClients(page = 1) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/clients?page=${page}&per_page=10`, {
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    displayClientsList(data.clients, data.pagination);
                    document.getElementById('clientResult').style.display = 'none';
                    document.getElementById('clientsList').style.display = 'block';
                } else {
                    showAlert(data.error || 'Erro ao carregar clientes!', 'error');
                }
            } catch (error) {
                showAlert('Erro ao carregar clientes!', 'error');
                console.error('Load clients error:', error);
            }
        }

        function displayClientsList(clients, pagination) {
            const container = document.getElementById('clientsContainer');
            container.innerHTML = '';

            clients.forEach(client => {
                const clientCard = document.createElement('div');
                clientCard.className = 'client-card';
                clientCard.onclick = () => selectClient(client);
                
                clientCard.innerHTML = `
                    <div class="client-card-info">
                        <div class="client-card-name">${client.name}</div>
                        <div class="client-card-document">${formatDocument(client.document)}</div>
                    </div>
                    <div class="client-card-limit">${formatCurrency(client.account_limit)}</div>
                `;
                
                container.appendChild(clientCard);
            });

            // Update pagination
            updatePagination(pagination);
        }

        function selectClient(client) {
            currentClientDocument = client.document;
            displayClient(client);
            document.getElementById('clientResult').style.display = 'block';
            document.getElementById('clientsList').style.display = 'none';
            document.getElementById('searchDocument').value = client.document;
        }

        function updatePagination(pagination) {
            const paginationContainer = document.getElementById('pagination');
            paginationContainer.innerHTML = '';

            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.textContent = 'Anterior';
            prevBtn.disabled = !pagination.has_prev;
            prevBtn.onclick = () => showAllClients(pagination.page - 1);
            paginationContainer.appendChild(prevBtn);

            // Page info
            const pageInfo = document.createElement('span');
            pageInfo.className = 'pagination-info';
            pageInfo.textContent = `Página ${pagination.page} de ${pagination.pages} (${pagination.total} clientes)`;
            paginationContainer.appendChild(pageInfo);

            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.textContent = 'Próxima';
            nextBtn.disabled = !pagination.has_next;
            nextBtn.onclick = () => showAllClients(pagination.page + 1);
            paginationContainer.appendChild(nextBtn);
        }

        // Update limit
        async function updateLimit() {
            const newLimit = parseFloat(document.getElementById('newLimit').value);
            const operationPassword = document.getElementById('operationPassword').value;

            if (!currentClientDocument) {
                showAlert('Cliente não selecionado!', 'error');
                return;
            }

            if (!newLimit || newLimit < 0) {
                showAlert('Limite inválido!', 'error');
                return;
            }

            if (!operationPassword || operationPassword.length !== 8) {
                showAlert('Senha de operação deve ter 8 dígitos!', 'error');
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
                    displayClient(data.client);
                    document.getElementById('operationPassword').value = '';
                    showAlert('Limite atualizado com sucesso!', 'success');
                    refreshLogs();
                } else {
                    showAlert(data.error || 'Erro ao atualizar limite!', 'error');
                }
            } catch (error) {
                showAlert('Erro ao atualizar limite!', 'error');
                console.error('Update limit error:', error);
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
                    showAlert(data.error || 'Erro ao carregar logs!', 'error');
                }
            } catch (error) {
                showAlert('Erro ao carregar logs!', 'error');
                console.error('Load logs error:', error);
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
                // First get token
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

                // Test overdraft check
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
                console.error('API test error:', error);
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
        function showModal(title, message, confirmCallback = null) {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').innerHTML = message;
            document.getElementById('confirmModal').style.display = 'block';
            
            if (confirmCallback) {
                document.getElementById('confirmButton').onclick = confirmCallback;
            }
        }

        function closeModal() {
            document.getElementById('confirmModal').style.display = 'none';
        }

        // Event listeners
        document.getElementById('loginForm').addEventListener('submit', login);

        // Close modal when clicking outside
        window.onclick = function(event) {
            const modal = document.getElementById('confirmModal');
            if (event.target === modal) {
                closeModal();
            }
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            // Check if already logged in (for development)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                document.getElementById('currentUser').textContent = savedUser;
            }
        });

