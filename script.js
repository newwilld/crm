// Configuração do Firebase otimizada para mobile
const firebaseConfig = {
  apiKey: "AIzaSyCAZJIWT5FPTshkArRs8v2U9hXAmtnlG-Q",
  authDomain: "myname22.firebaseapp.com",
  databaseURL: "https://myname22-default-rtdb.firebaseio.com",
  projectId: "myname22",
  storageBucket: "myname22.firebasestorage.app",
  messagingSenderId: "346543194739",
  appId: "1:346543194739:web:bcb8fa36574ca5de552006",
  measurementId: "G-96C1LJH3MB"
};

// Inicialização otimizada do Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const clientsRef = database.ref('clientes');

// Variáveis globais otimizadas
let clientsData = [];
let currentPage = 1;
const itemsPerPage = calculateItemsPerPage();
let filteredData = [];
let currentSort = { column: 'name', direction: 'asc' };
let currentFilter = 'all';
let editingClientId = null;
let searchTimeout;
let isMobile = window.matchMedia("(max-width: 768px)").matches;

// Função para calcular itens por página baseado no tamanho da tela
function calculateItemsPerPage() {
    const screenHeight = window.innerHeight;
    if (screenHeight < 600) return 5;
    if (screenHeight < 800) return 8;
    return 10;
}

// Inicialização otimizada para mobile
document.addEventListener('DOMContentLoaded', function() {
    initMobileOptimizations();
    setupEventListeners();
  // Adicione isso dentro da função setupEventListeners()
document.getElementById('exportClientsBtn').addEventListener('click', exportClientsToCSV);
document.getElementById('importClientsBtn').addEventListener('click', importClientsFromCSV);
    loadClients();
    
    // Atualiza ao mudar orientação
    window.addEventListener('resize', function() {
        isMobile = window.matchMedia("(max-width: 768px)").matches;
        renderClientsTable();
    });
});

// ==================== FUNÇÕES DE OTIMIZAÇÃO MOBILE ====================

function initMobileOptimizations() {
    // Ajusta áreas de toque
    document.querySelectorAll('button').forEach(btn => {
        btn.style.minWidth = '44px';
        btn.style.minHeight = '44px';
        btn.style.touchAction = 'manipulation';
    });

    // Otimiza o modal
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.style.overflowY = 'auto';
        modal.style.webkitOverflowScrolling = 'touch';
    }

    // Adiciona classe mobile ao body
    if (isMobile) {
        document.body.classList.add('mobile-view');
    }
}

// ==================== FUNÇÕES PRINCIPAIS (OTIMIZADAS) ====================

function loadClients() {
    showLoading(true);
    
    // Conexão otimizada para mobile
    const connectionRef = database.ref('.info/connected');
    connectionRef.on('value', (snap) => {
        if (snap.val() === true) {
            setupRealTimeListener();
        } else {
            showNotification('Você está offline. Os dados podem não estar atualizados.', 'warning');
            loadCachedData();
        }
    });
}

function setupRealTimeListener() {
    clientsRef.on('value', (snapshot) => {
        clientsData = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                clientsData.push(parseClientData(key, data[key]));
            });
            
            // Cache local para modo offline
            localStorage.setItem('crmCache', JSON.stringify(clientsData));
            
            applyFiltersAndSorting();
            renderClientsTable();
            calculateTotalValue();
        } else {
            showNoResults();
        }
        showLoading(false);
    }, (error) => {
        console.error('Firebase error:', error);
        showLoading(false);
        loadCachedData();
    });
}

function parseClientData(id, clientData) {
    return {
        id,
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        company: clientData.company || '',
        serviceType: clientData.serviceType || 'Consultoria',
        status: clientData.status || 'Realizando',
        value: parseFloat(clientData.value) || 0,
        notes: clientData.notes || '',
        lastContact: clientData.lastContact || new Date().toISOString().split('T')[0]
    };
}

function loadCachedData() {
    const cachedData = localStorage.getItem('crmCache');
    if (cachedData) {
        clientsData = JSON.parse(cachedData);
        applyFiltersAndSorting();
        renderClientsTable();
        calculateTotalValue();
        showNotification('Dados carregados do cache offline', 'warning');
    } else {
        showNoResults();
    }
    showLoading(false);
}

function renderClientsTable() {
    const tableBody = document.getElementById('clientsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (filteredData.length === 0) {
        showNoResults();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    if (isMobile) {
        renderMobileCards(tableBody, paginatedData);
    } else {
        renderDesktopTable(tableBody, paginatedData);
    }

    updatePaginationInfo();
}

function renderMobileCards(container, data) {
    data.forEach(client => {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
            <div class="card-header" onclick="toggleCardDetails(this)">
                <span class="client-initials" style="background-color: ${stringToColor(getInitials(client.name))}">
                    ${getInitials(client.name)}
                </span>
                <div>
                    <strong>${client.name}</strong>
                    <small>${client.company}</small>
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="card-details">
                <div><i class="fas fa-envelope"></i> ${client.email}</div>
                <div><i class="fas fa-phone"></i> ${formatPhone(client.phone)}</div>
                <div><i class="fas fa-dollar-sign"></i> R$ ${client.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="status-badge ${client.status === 'Entregue' ? 'status-entregue' : 'status-realizando'}">
                    ${client.status}
                </div>
                <div class="card-actions">
                    <button class="action-btn edit-btn" data-id="${client.id}" aria-label="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${client.id}" aria-label="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderDesktopTable(container, data) {
    data.forEach(client => {
        const row = document.createElement('tr');
        const statusClass = client.status === 'Entregue' ? 'status-entregue' : 'status-realizando';
        const initials = getInitials(client.name);

        row.innerHTML = `
            <td>
                <div class="client-info">
                    <span class="client-initials" style="background-color: ${stringToColor(initials)}">${initials}</span>
                    <div>
                        <strong>${client.name}</strong>
                        <small>${client.email}</small>
                    </div>
                </div>
            </td>
            <td>R$ ${client.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td>${formatPhone(client.phone)}</td>
            <td>${client.company}</td>
            <td><span class="service-badge">${client.serviceType}</span></td>
            <td><span class="status-badge ${statusClass}">${client.status}</span></td>
            <td class="actions-cell">
                <button class="action-btn edit-btn" data-id="${client.id}" aria-label="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${client.id}" aria-label="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        container.appendChild(row);
    });
}

// ==================== FUNÇÕES DE INTERFACE (OTIMIZADAS) ====================

function setupEventListeners() {
    // Eventos otimizados para touch
    const addEvent = (element, event, handler) => {
        if (element && handler) {
            element.addEventListener(event, handler, { passive: true });
          // Adicione isso dentro da função setupEventListeners()
document.getElementById('exportClientsBtn').addEventListener('click', exportClientsToCSV);
document.getElementById('importClientsBtn').addEventListener('click', importClientsFromCSV);
        }
      // ==================== FUNÇÕES DE EXPORTAR/IMPORTAR ====================

function exportClientsToCSV() {
    showLoading(true);
    
    try {
        // Cabeçalho do CSV
        let csvContent = "Nome,Email,Telefone,Empresa,Tipo de Serviço,Situação,Valor,Último Contato,Observações\n";
        
        // Adiciona os dados dos clientes
        clientsData.forEach(client => {
            csvContent += `"${client.name}","${client.email}","${client.phone}","${client.company}","${client.serviceType}","${client.status}",${client.value},"${client.lastContact}","${client.notes.replace(/"/g, '""')}"\n`;
        });
        
        // Cria o blob e o link para download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Clientes exportados com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        showNotification('Erro ao exportar clientes', 'error');
    } finally {
        showLoading(false);
    }
}

function importClientsFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        showLoading(true);
        
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const csvData = event.target.result;
                const lines = csvData.split('\n');
                const headers = lines[0].replace(/"/g, '').split(',');
                
                // Verifica se o CSV tem o formato esperado
                if (headers.length < 8) {
                    throw new Error('Formato de arquivo inválido');
                }
                
                const clientsToImport = [];
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    // Processa linha do CSV (considerando campos entre aspas)
                    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (!values || values.length < 8) continue;
                    
                    const client = {
                        name: values[0].replace(/"/g, ''),
                        email: values[1].replace(/"/g, ''),
                        phone: values[2].replace(/"/g, ''),
                        company: values[3].replace(/"/g, ''),
                        serviceType: values[4].replace(/"/g, ''),
                        status: values[5].replace(/"/g, ''),
                        value: parseFloat(values[6].replace(/"/g, '')) || 0,
                        lastContact: values[7].replace(/"/g, '') || new Date().toISOString().split('T')[0],
                        notes: values[8] ? values[8].replace(/"/g, '') : ''
                    };
                    
                    clientsToImport.push(client);
                }
                
                if (clientsToImport.length === 0) {
                    throw new Error('Nenhum cliente válido encontrado no arquivo');
                }
                
                // Confirmação antes de importar
                if (confirm(`Deseja importar ${clientsToImport.length} clientes?`)) {
                    showLoading(true);
                    const importPromises = clientsToImport.map(client => 
                        clientsRef.push(client).catch(error => {
                            console.error('Erro ao importar cliente:', error);
                            return null;
                        })
                    );
                    
                    Promise.all(importPromises)
                        .then(() => {
                            showNotification(`${clientsToImport.length} clientes importados com sucesso!`, 'success');
                        })
                        .catch(error => {
                            console.error('Erro na importação:', error);
                            showNotification('Erro ao importar alguns clientes', 'warning');
                        })
                        .finally(() => showLoading(false));
                }
            } catch (error) {
                console.error('Erro ao processar arquivo:', error);
                showNotification('Erro ao importar: ' + error.message, 'error');
                showLoading(false);
            }
        };
        
        reader.onerror = () => {
            showNotification('Erro ao ler arquivo', 'error');
            showLoading(false);
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}
    };

    addEvent(document.getElementById('newClientBtn'), 'click', openClientModal);
    addEvent(document.querySelector('.close-modal'), 'click', closeClientModal);
    addEvent(document.querySelector('.cancel-btn'), 'click', closeClientModal);
    addEvent(document.getElementById('clientForm'), 'submit', handleFormSubmit);
    addEvent(document.getElementById('prevPage'), 'click', goToPrevPage);
    addEvent(document.getElementById('nextPage'), 'click', goToNextPage);
    addEvent(document.getElementById('exportClientsBtn'), 'click', exportClientsToCSV);
    addEvent(document.getElementById('importClientsBtn'), 'click', importClientsFromCSV);

    // Busca com debounce otimizado
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFiltersAndSorting();
                renderClientsTable();
            }, isMobile ? 400 : 300); // Debounce maior para mobile
        }, { passive: true });
    }

    // Delegação de eventos otimizada
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-id]');
        if (!target) return;

        const clientId = target.getAttribute('data-id');
        if (target.classList.contains('edit-btn')) {
            editClient(clientId);
        } else if (target.classList.contains('delete-btn')) {
            deleteClient(clientId);
        }
    }, { passive: true });
}

// ==================== FUNÇÕES UTILITÁRIAS (OTIMIZADAS) ====================

function showNotification(message, type = 'success') {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(message);
    } else {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
        // Evita bloqueio de UI em mobile
        if (show) setTimeout(() => { loader.style.display = 'none'; }, 10000);
    }
}

// ==================== FUNÇÕES DE CLIENTE (OTIMIZADAS) ====================

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const clientData = {
        name: formData.get('clientName')?.trim() || '',
        email: formData.get('clientEmail')?.trim() || '',
        phone: formData.get('clientPhone')?.trim() || '',
        company: formData.get('clientCompany')?.trim() || '',
        serviceType: formData.get('clientServiceType') || 'Consultoria',
        status: formData.get('clientStatus') || 'Realizando',
        value: parseFloat(formData.get('clientValue')) || 0,
        notes: formData.get('clientNotes')?.trim() || '',
        lastContact: new Date().toISOString().split('T')[0]
    };

    // Validação otimizada
    if (!clientData.name || clientData.value <= 0) {
        showNotification('Preencha os campos obrigatórios', 'error');
        return;
    }

    showLoading(true);
    
    const operation = editingClientId 
        ? clientsRef.child(editingClientId).update(clientData)
        : clientsRef.push(clientData);
    
    operation
        .then(() => {
            showNotification(`Cliente ${editingClientId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
            closeClientModal();
        })
        .catch(error => {
            console.error('Firebase error:', error);
            showNotification('Erro ao salvar. Tente novamente.', 'error');
            
            // Fallback para cache local
            if (!editingClientId) {
                clientData.id = 'local_' + Date.now();
                clientsData.unshift(clientData);
                localStorage.setItem('crmCache', JSON.stringify(clientsData));
                renderClientsTable();
            }
        })
        .finally(() => showLoading(false));
}

// ==================== FUNÇÕES ADICIONAIS ====================

// [Restante das funções permanece igual, mas com otimizações mobile]
// ...

// Função para alternar detalhes no modo mobile
function toggleCardDetails(header) {
    const card = header.parentElement;
    const details = card.querySelector('.card-details');
    const icon = header.querySelector('i');
    
    if (details.style.display === 'block') {
        details.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    } else {
        details.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
    }
}

// Inicializa quando carregado no mobile
if (isMobile) {
    document.querySelectorAll('.mobile-card .card-details').forEach(el => {
        el.style.display = 'none';
    });
}
function loadClients() {
    showLoading(true);
    
    // Timeout para conexão
    const connectionTimeout = setTimeout(() => {
        showNotification('Conexão demorando... usando cache local', 'warning');
        loadCachedData();
    }, 5000); // 5 segundos de timeout

    const connectionRef = database.ref('.info/connected');
    connectionRef.on('value', (snap) => {
        clearTimeout(connectionTimeout); // Cancela o timeout se conectar
        if (snap.val() === true) {
            setupRealTimeListener();
        } else {
            showNotification('Você está offline. Usando dados do cache.', 'warning');
            loadCachedData();
        }
    });
}
function setupRealTimeListener() {
    clientsRef.on('value', (snapshot) => {
        clientsData = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                clientsData.push(parseClientData(key, data[key]));
            });
            
            localStorage.setItem('crmCache', JSON.stringify(clientsData));
            applyFiltersAndSorting();
            renderClientsTable();
            calculateTotalValue();
        } else {
            showNotification('Nenhum cliente cadastrado ainda.', 'info');
            showNoResults();
        }
        showLoading(false);
    }, (error) => {
        console.error('Firebase error:', error);
        showNotification('Erro ao carregar dados. Usando cache local.', 'error');
        showLoading(false);
        loadCachedData();
    });
}
function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    } else {
        console.error('Elemento loadingOverlay não encontrado!');
        // Cria um loading overlay dinâmico se não existir
        if (show) {
            const newLoader = document.createElement('div');
            newLoader.id = 'loadingOverlay';
            newLoader.innerHTML = 'Carregando...';
            newLoader.style.position = 'fixed';
            newLoader.style.top = '0';
            newLoader.style.left = '0';
            newLoader.style.width = '100%';
            newLoader.style.height = '100%';
            newLoader.style.background = 'rgba(0,0,0,0.5)';
            newLoader.style.color = 'white';
            newLoader.style.display = 'flex';
            newLoader.style.justifyContent = 'center';
            newLoader.style.alignItems = 'center';
            newLoader.style.zIndex = '1000';
            document.body.appendChild(newLoader);
        }
    }
}
function showNoResults() {
    const tableBody = document.getElementById('clientsTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="no-results">
                <td colspan="7">
                    <i class="fas fa-info-circle"></i>
                    Nenhum cliente encontrado
                </td>
            </tr>
        `;
    }
    showLoading(false);
}

function applyFiltersAndSorting() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    filteredData = clientsData.filter(client => {
        return (
            client.name.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm) ||
            client.phone.includes(searchTerm) ||
            client.company.toLowerCase().includes(searchTerm)
        );
    });

    // Ordenação
    filteredData.sort((a, b) => {
        if (a[currentSort.column] < b[currentSort.column]) {
            return currentSort.direction === 'asc' ? -1 : 1;
        }
        if (a[currentSort.column] > b[currentSort.column]) {
            return currentSort.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });
}
