// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCAZJIWT5FPTshkArRs8v2U9hXAmtnlG-Q",
    authDomain: "myname22.firebaseapp.com",
    databaseURL: "https://myname22-default-rtdb.firebaseio.com",
    projectId: "myname22",
    storageBucket: "myname22.appspot.com",
    messagingSenderId: "346543194739",
    appId: "1:346543194739:web:bcb8fa36574ca5de552006"
};

// Inicialização do Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const clientsRef = database.ref('clientes');

// Variáveis globais
let clientsData = [];
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];
let currentSort = { column: 'name', direction: 'asc' };
let currentFilter = 'all';
let editingClientId = null;
let searchTimeout;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', function() {
    showLoading(true);
    setupEventListeners();
    loadClients();
});

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Carrega clientes do Firebase em tempo real
 */
function loadClients() {
    clientsRef.on('value', (snapshot) => {
        clientsData = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                clientsData.push({ 
                    id: key,
                    name: data[key].name || '',
                    email: data[key].email || '',
                    phone: data[key].phone || '',
                    company: data[key].company || '',
                    serviceType: data[key].serviceType || '',
                    status: data[key].status || 'Realizando',
                    value: parseFloat(data[key].value) || 0,
                    notes: data[key].notes || '',
                    lastContact: data[key].lastContact || new Date().toISOString().split('T')[0]
                });
            });
            
            applyFiltersAndSorting();
            renderClientsTable();
            calculateTotalValue();
        } else {
            showNoResults();
        }
        showLoading(false);
    }, (error) => {
        showNotification('Erro ao carregar clientes', 'error');
        console.error('Firebase error:', error);
        showLoading(false);
    });
}

/**
 * Renderiza a tabela de clientes com os dados filtrados
 */
function renderClientsTable() {
    const tableBody = document.getElementById('clientsTableBody');
    tableBody.innerHTML = '';

    if (filteredData.length === 0) {
        showNoResults();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    paginatedData.forEach(client => {
        const statusClass = client.status === 'Entregue' ? 'status-entregue' : 'status-realizando';
        const initials = getInitials(client.name);

        const row = document.createElement('tr');
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
                <button class="action-btn edit-btn" data-id="${client.id}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${client.id}" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updatePaginationInfo();
}

// ==================== FUNÇÕES DE FILTRO E ORDENAÇÃO ====================

/**
 * Aplica filtros, busca e ordenação aos dados
 */
function applyFiltersAndSorting() {
    // Aplica filtro de status
    filteredData = currentFilter === 'all' 
        ? [...clientsData] 
        : clientsData.filter(client => client.status === currentFilter);

    // Aplica busca
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(client => 
            (client.name?.toLowerCase().includes(searchTerm)) || 
            (client.email?.toLowerCase().includes(searchTerm)) ||
            (client.company?.toLowerCase().includes(searchTerm)) ||
            (client.phone?.includes(searchTerm)) ||
            (client.serviceType?.toLowerCase().includes(searchTerm))
        );
    }

    // Aplica ordenação
    filteredData.sort((a, b) => {
        const valA = a[currentSort.column]?.toString().toLowerCase() || '';
        const valB = b[currentSort.column]?.toString().toLowerCase() || '';
        
        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Reset para primeira página
    currentPage = 1;
}

// ==================== FUNÇÕES DE INTERFACE ====================

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Botão Novo Cliente
    document.getElementById('newClientBtn').addEventListener('click', openClientModal);
    
    // Modal
    document.querySelector('.close-modal').addEventListener('click', closeClientModal);
    document.querySelector('.cancel-btn').addEventListener('click', closeClientModal);
    document.getElementById('clientForm').addEventListener('submit', handleFormSubmit);
    
    // Paginação
    document.getElementById('prevPage').addEventListener('click', goToPrevPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
    
    // Ações
    document.getElementById('exportClientsBtn').addEventListener('click', exportClientsToCSV);
    document.getElementById('importClientsBtn').addEventListener('click', importClientsFromCSV);
    
    // Filtros
    document.querySelectorAll('.filter-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            currentFilter = e.target.getAttribute('data-filter');
            applyFiltersAndSorting();
            renderClientsTable();
        });
    });
    
    // Ordenação
    document.querySelectorAll('[data-sort]').forEach(icon => {
        icon.addEventListener('click', () => {
            const column = icon.getAttribute('data-sort');
            currentSort = {
                column,
                direction: currentSort.column === column && currentSort.direction === 'asc' ? 'desc' : 'asc'
            };
            applyFiltersAndSorting();
            renderClientsTable();
            updateSortIcons();
        });
    });
    
    // Busca com debounce
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFiltersAndSorting();
            renderClientsTable();
        }, 300);
    });
    
    // Delegação de eventos para ações na tabela
    document.getElementById('clientsTableBody').addEventListener('click', handleTableActions);
}

/**
 * Navega para a página anterior
 */
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderClientsTable();
    }
}

/**
 * Navega para a próxima página
 */
function goToNextPage() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderClientsTable();
    }
}

/**
 * Manipula ações na tabela (editar/excluir)
 */
function handleTableActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const clientId = btn.getAttribute('data-id');
    
    if (btn.classList.contains('edit-btn')) {
        editClient(clientId);
    } else if (btn.classList.contains('delete-btn')) {
        deleteClient(clientId);
    }
}

/**
 * Atualiza os ícones de ordenação
 */
function updateSortIcons() {
    document.querySelectorAll('[data-sort]').forEach(icon => {
        icon.className = 'fas fa-sort';
        if (icon.getAttribute('data-sort') === currentSort.column) {
            icon.classList.add(`fa-sort-${currentSort.direction}`);
        }
    });
}

/**
 * Atualiza as informações de paginação
 */
function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Atualiza contadores
    document.getElementById('showingFrom').textContent = startIndex;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalClients').textContent = filteredData.length;
    
    // Atualiza botões
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    // Atualiza números das páginas
    const pageNumbers = document.getElementById('pageNumbers');
    pageNumbers.innerHTML = '';
    
    const maxPagesToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Ajusta se não estiver mostrando páginas suficientes
    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Cria botões de paginação
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `btn ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            renderClientsTable();
        });
        pageNumbers.appendChild(btn);
    }
}

// ==================== FUNÇÕES DE CRUD ====================

/**
 * Abre o modal para adicionar novo cliente
 */
function openClientModal() {
    editingClientId = null;
    document.getElementById('modalTitle').textContent = 'Novo Cliente';
    document.getElementById('clientForm').reset();
    document.getElementById('clientModal').style.display = 'flex';
}

/**
 * Fecha o modal de cliente
 */
function closeClientModal() {
    document.getElementById('clientModal').style.display = 'none';
}

/**
 * Manipula o envio do formulário (cria/atualiza cliente)
 */
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validação básica
    const clientName = document.getElementById('clientName').value.trim();
    const clientValue = parseFloat(document.getElementById('clientValue').value);
    
    if (!clientName || isNaN(clientValue)) {
        showNotification('Preencha os campos obrigatórios corretamente', 'error');
        return;
    }
    
    const clientData = {
        name: clientName,
        email: document.getElementById('clientEmail').value.trim(),
        phone: document.getElementById('clientPhone').value.trim(),
        company: document.getElementById('clientCompany').value.trim(),
        serviceType: document.getElementById('clientServiceType').value,
        status: document.getElementById('clientStatus').value,
        value: clientValue,
        notes: document.getElementById('clientNotes').value.trim(),
        lastContact: new Date().toISOString().split('T')[0]
    };

    showLoading(true);
    
    const operation = editingClientId 
        ? clientsRef.child(editingClientId).update(clientData)
        : clientsRef.push(clientData);
    
    operation
        .then(() => {
            showNotification(
                `Cliente ${editingClientId ? 'atualizado' : 'adicionado'} com sucesso!`, 
                'success'
            );
            closeClientModal();
        })
        .catch(error => {
            showNotification(
                `Erro ao ${editingClientId ? 'atualizar' : 'adicionar'} cliente`, 
                'error'
            );
            console.error('Firebase error:', error);
        })
        .finally(() => showLoading(false));
}

/**
 * Carrega os dados de um cliente para edição
 */
function editClient(clientId) {
    showLoading(true);
    clientsRef.child(clientId).once('value', (snapshot) => {
        const client = snapshot.val();
        if (!client) {
            showNotification('Cliente não encontrado', 'error');
            return;
        }
        
        editingClientId = clientId;
        document.getElementById('modalTitle').textContent = 'Editar Cliente';
        
        // Preenche o formulário
        document.getElementById('clientId').value = clientId;
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientCompany').value = client.company || '';
        document.getElementById('clientServiceType').value = client.serviceType || '';
        document.getElementById('clientStatus').value = client.status || 'Realizando';
        document.getElementById('clientValue').value = client.value || '';
        document.getElementById('clientNotes').value = client.notes || '';
        
        document.getElementById('clientModal').style.display = 'flex';
    }, (error) => {
        showNotification('Erro ao carregar cliente', 'error');
        console.error('Firebase error:', error);
    })
    .finally(() => showLoading(false));
}

/**
 * Exclui um cliente após confirmação
 */
function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente permanentemente?')) {
        return;
    }
    
    showLoading(true);
    clientsRef.child(clientId).remove()
        .then(() => {
            showNotification('Cliente excluído com sucesso!', 'success');
        })
        .catch(error => {
            showNotification('Erro ao excluir cliente', 'error');
            console.error('Firebase error:', error);
        })
        .finally(() => showLoading(false));
}

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Mostra uma notificação na tela
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Mostra/oculta o overlay de loading
 */
function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

/**
 * Mostra mensagem quando não há resultados
 */
function showNoResults() {
    document.getElementById('clientsTableBody').innerHTML = `
        <tr>
            <td colspan="7" class="no-results">
                <i class="fas fa-info-circle"></i>
                Nenhum cliente encontrado
            </td>
        </tr>
    `;
    document.getElementById('totalValue').textContent = 'R$ 0,00';
}

/**
 * Calcula e exibe o valor total dos clientes
 */
function calculateTotalValue() {
    const total = filteredData.reduce((sum, client) => sum + (client.value || 0), 0);
    document.getElementById('totalValue').textContent = 
        `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

/**
 * Exporta os clientes para CSV
 */
function exportClientsToCSV() {
    if (clientsData.length === 0) {
        showNotification('Nenhum dado para exportar', 'error');
        return;
    }

    const headers = [
        'Nome', 'Email', 'Telefone', 'Empresa', 
        'Tipo de Serviço', 'Situação', 'Valor', 
        'Último Contato', 'Observações'
    ];
    
    const rows = clientsData.map(client => [
        `"${client.name}"`,
        client.email,
        client.phone,
        `"${client.company}"`,
        client.serviceType,
        client.status,
        client.value.toFixed(2),
        client.lastContact,
        `"${client.notes || ''}"`
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Exportação concluída com sucesso', 'success');
}

/**
 * Importa clientes de um arquivo CSV (simplificado)
 */
function importClientsFromCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const csvData = event.target.result;
                const lines = csvData.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                // Validação básica do CSV
                const requiredFields = ['Nome', 'Email', 'Valor'];
                if (!requiredFields.every(field => headers.includes(field))) {
                    throw new Error('Formato de arquivo inválido');
                }
                
                const clientsToImport = [];
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const values = lines[i].split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
                        .map(v => v.trim().replace(/"/g, ''));
                    
                    const client = {
                        name: values[headers.indexOf('Nome')] || '',
                        email: values[headers.indexOf('Email')] || '',
                        phone: values[headers.indexOf('Telefone')] || '',
                        company: values[headers.indexOf('Empresa')] || '',
                        serviceType: values[headers.indexOf('Tipo de Serviço')] || 'Consultoria',
                        status: values[headers.indexOf('Situação')] || 'Realizando',
                        value: parseFloat(values[headers.indexOf('Valor')]) || 0,
                        notes: values[headers.indexOf('Observações')] || '',
                        lastContact: values[headers.indexOf('Último Contato')] || new Date().toISOString().split('T')[0]
                    };
                    
                    if (client.name && client.email) {
                        clientsToImport.push(client);
                    }
                }
                
                if (clientsToImport.length > 0) {
                    if (confirm(`Deseja importar ${clientsToImport.length} cliente(s)?`)) {
                        showLoading(true);
                        const importPromises = clientsToImport.map(client => 
                            clientsRef.push(client)
                        );
                        
                        Promise.all(importPromises)
                            .then(() => {
                                showNotification(`${clientsToImport.length} clientes importados com sucesso!`, 'success');
                            })
                            .catch(error => {
                                showNotification('Erro ao importar alguns clientes', 'error');
                                console.error('Import error:', error);
                            })
                            .finally(() => showLoading(false));
                    }
                } else {
                    showNotification('Nenhum cliente válido encontrado no arquivo', 'error');
                }
            } catch (error) {
                showNotification('Erro ao processar arquivo CSV', 'error');
                console.error('CSV processing error:', error);
            }
        };
        
        reader.onerror = () => {
            showNotification('Erro ao ler arquivo', 'error');
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// ==================== UTILITÁRIOS ====================

/**
 * Gera iniciais a partir do nome
 */
function getInitials(name) {
    if (!name) return '';
    return name.split(/\s+/)
        .filter(part => part.length > 0)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Gera uma cor única a partir de uma string
 */
function stringToColor(str) {
    if (!str) return '#4361ee';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 70%, 60%)`;
}

/**
 * Formata número de telefone
 */
function formatPhone(phone) {
    if (!phone) return '';
    // Remove tudo que não é dígito
    const cleaned = phone.replace(/\D/g, '');
    // Aplica a máscara (XX) XXXXX-XXXX
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
}