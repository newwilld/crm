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
