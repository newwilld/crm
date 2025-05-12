// Configuração do Firebase otimizada
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

// Inicialização do Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const clientsRef = database.ref('clientes');

// Variáveis globais
let clientsData = [];
let currentPage = 1;
let itemsPerPage = calculateItemsPerPage();
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

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  initMobileOptimizations();
  setupEventListeners();
  loadClients();

  // Atualiza ao mudar orientação ou tamanho da janela
  window.addEventListener('resize', () => {
    isMobile = window.matchMedia("(max-width: 768px)").matches;
    itemsPerPage = calculateItemsPerPage();
    renderClientsTable();
  }, { passive: true });
});

// ==================== OTIMIZAÇÕES MOBILE ====================
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

// ==================== CARREGAMENTO DE DADOS ====================
function loadClients() {
  showLoading(true);

  const connectionTimeout = setTimeout(() => {
    showNotification('Conexão demorando... usando cache local', 'warning');
    loadCachedData();
  }, 5000);

  const connectionRef = database.ref('.info/connected');
  connectionRef.on('value', snap => {
    clearTimeout(connectionTimeout);
    if (snap.val() === true) {
      setupRealTimeListener();
    } else {
      showNotification('Você está offline. Usando dados do cache.', 'warning');
      loadCachedData();
    }
  });
}

function setupRealTimeListener() {
  clientsRef.on('value', snapshot => {
    clientsData = [];
    const data = snapshot.val();

    if (data) {
      Object.keys(data).forEach(key => {
        clientsData.push(parseClientData(key, data[key]));
      });
      localStorage.setItem('crmCache', JSON.stringify(clientsData));
      syncLocalData(); // Sincroniza dados locais pendentes
      applyFiltersAndSorting();
      renderClientsTable();
      calculateTotalValue();
    } else {
      showNotification('Nenhum cliente cadastrado ainda.', 'info');
      showNoResults();
    }
    showLoading(false);
  }, error => {
    console.error('Firebase error:', error);
    showNotification('Erro ao carregar dados. Usando cache local.', 'error');
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

// ==================== RENDERIZAÇÃO ====================
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
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', `Cliente ${client.name}`);
    const initials = getInitials(client.name);
    card.innerHTML = `
      <div class="card-header" role="button" tabindex="0" aria-expanded="false" onclick="toggleCardDetails(this)" onkeydown="if(event.key === 'Enter') toggleCardDetails(this)">
        <span class="client-initials" style="background-color: ${stringToColor(initials)}">${initials}</span>
        <div>
          <strong>${client.name}</strong>
          <small>${client.company}</small>
        </div>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="card-details" style="display: none;">
        <div><i class="fas fa-envelope"></i> ${client.email}</div>
        <div><i class="fas fa-phone"></i> ${formatPhone(client.phone)}</div>
        <div><i class="fas fa-dollar-sign"></i> R$ ${client.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        <div class="status-badge ${client.status === 'Entregue' ? 'status-entregue' : 'status-realizando'}">${client.status}</div>
        <div class="card-actions">
          <button class="action-btn edit-btn" data-id="${client.id}" aria-label="Editar cliente ${client.name}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn delete-btn" data-id="${client.id}" aria-label="Excluir cliente ${client.name}">
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
      <td>R$ ${client.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      <td>${formatPhone(client.phone)}</td>
      <td>${client.company}</td>
      <td><span class="service-badge">${client.serviceType}</span></td>
      <td><span class="status-badge ${statusClass}">${client.status}</span></td>
      <td class="actions-cell">
        <button class="action-btn edit-btn" data-id="${client.id}" aria-label="Editar cliente ${client.name}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${client.id}" aria-label="Excluir cliente ${client.name}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    container.appendChild(row);
  });
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
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
  addEvent(document.getElementById('importClientsBtn'), 'click', () => document.getElementById('importFileInput')?.click());
  addEvent(document.getElementById('importFileInput'), 'change', handleFileImport);

  // Busca com debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        applyFiltersAndSorting();
        renderClientsTable();
      }, isMobile ? 400 : 300);
    }, { passive: true });
  }

  // Filtros
  document.querySelectorAll('.filter-option').forEach(option => {
    option.addEventListener('click', e => {
      e.preventDefault();
      currentFilter = option.getAttribute('data-filter');
      applyFiltersAndSorting();
      renderClientsTable();
    }, { passive: true });
  });

  // Ordenação
  document.querySelectorAll('[data-sort]').forEach(icon => {
    icon.addEventListener('click', () => {
      const column = icon.getAttribute('data-sort');
      if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
      }
      applyFiltersAndSorting();
      renderClientsTable();
      updateSortIcons();
    }, { passive: true });
  });

  // Delegação de eventos para ações
  document.getElementById('clientsTableBody')?.addEventListener('click', e => {
    const target = e.target.closest('[data-id]');
    if (!target) return;
    const clientId = target.getAttribute('data-id');
    if (target.classList.contains('edit-btn')) {
      editClient(clientId);
    } else if (target.classList.contains('delete-btn')) {
      deleteClient(clientId);
    }
  }, { passive: true });

  // Fechar modal ao clicar fora
  addEvent(document.getElementById('clientModal'), 'click', e => {
    if (e.target === e.currentTarget) {
      closeClientModal();
    }
  });
}

// ==================== EXPORTAÇÃO/IMPORTAÇÃO CSV ====================
function exportClientsToCSV() {
  try {
    const dataToExport = filteredData.length > 0 ? filteredData : clientsData;
    if (!dataToExport || dataToExport.length === 0) {
      showNotification('Nenhum dado para exportar', 'warning');
      return;
    }

    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Empresa', 'Tipo de Serviço', 'Status', 'Valor', 'Notas', 'Último Contato'];
    const rows = dataToExport.map(client => [
      client.id,
      `"${client.name.replace(/"/g, '""')}"`,
      `"${client.email.replace(/"/g, '""')}"`,
      `"${client.phone.replace(/"/g, '""')}"`,
      `"${client.company.replace(/"/g, '""')}"`,
      `"${client.serviceType.replace(/"/g, '""')}"`,
      `"${client.status.replace(/"/g, '""')}"`,
      client.value,
      `"${client.notes.replace(/"/g, '""')}"`,
      `"${client.lastContact}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Exportação concluída com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    showNotification('Erro ao exportar para CSV', 'error');
  }
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  showLoading(true);
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const csvData = e.target.result;
      const clients = parseCSVData(csvData);
      if (clients.length === 0) {
        showNotification('Nenhum dado válido encontrado no arquivo', 'warning');
        showLoading(false);
        return;
      }

      if (confirm(`Deseja importar ${clients.length} clientes?`)) {
        importClients(clients);
      } else {
        showLoading(false);
      }
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      showNotification('Erro ao processar arquivo CSV', 'error');
      showLoading(false);
    }
  };
  reader.onerror = () => {
    showNotification('Erro ao ler arquivo', 'error');
    showLoading(false);
  };
  reader.readAsText(file);
  event.target.value = ''; // Limpa o input
}

function parseCSVData(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length < 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const clients = [];
  const existingEmails = new Set(clientsData.map(c => c.email.toLowerCase()));

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    const client = {};

    headers.forEach((header, index) => {
      let value = values[index] || '';
      if (header === 'valor') {
        value = parseFloat(value) || 0;
      }
      client[header] = value;
    });

    const newClient = {
      name: client.nome || '',
      email: client.email || '',
      phone: client.telefone || '',
      company: client.empresa || '',
      serviceType: client['tipo de serviço'] || 'Consultoria',
      status: client.status || 'Realizando',
      value: client.valor || 0,
      notes: client.notas || '',
      lastContact: client['último contato'] || new Date().toISOString().split('T')[0]
    };

    if (newClient.name && newClient.email && !existingEmails.has(newClient.email.toLowerCase())) {
      clients.push(newClient);
      existingEmails.add(newClient.email.toLowerCase());
    }
  }

  return clients;
}

function importClients(clients) {
  let importedCount = 0;
  const errors = [];

  const processNext = index => {
    if (index >= clients.length) {
      showLoading(false);
      const message = `Importação concluída: ${importedCount} clientes importados`;
      if (errors.length > 0) {
        console.error('Erros durante importação:', errors);
        showNotification(`${message} (${errors.length} erros)`, 'warning');
      } else {
        showNotification(message, 'success');
      }
      return;
    }

    const client = clients[index];
    clientsRef.push(client)
      .then(() => {
        importedCount++;
        processNext(index + 1);
      })
      .catch(error => {
        errors.push({ client, error });
        processNext(index + 1);
      });
  };

  processNext(0);
}

// ==================== MANIPULAÇÃO DE FORMULÁRIOS ====================
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

  const error = validateClientData(clientData);
  if (error) {
    showNotification(error, 'error');
    return;
  }

  showLoading(true);
  const operation = editingClientId ? clientsRef.child(editingClientId).update(clientData) : clientsRef.push(clientData);

  operation
    .then(() => {
      showNotification(`Cliente ${editingClientId ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
      closeClientModal();
    })
    .catch(error => {
      console.error('Firebase error:', error);
      showNotification('Erro ao salvar. Salvando localmente.', 'error');
      if (!editingClientId) {
        clientData.id = 'local_' + Date.now();
        clientsData.unshift(clientData);
        localStorage.setItem('crmCache', JSON.stringify(clientsData));
        renderClientsTable();
      }
    })
    .finally(() => showLoading(false));
}

function validateClientData(clientData) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  if (!clientData.name) return 'Nome é obrigatório';
  if (!emailRegex.test(clientData.email)) return 'Email inválido';
  if (!phoneRegex.test(clientData.phone)) return 'Telefone inválido (formato: (XX) XXXXX-XXXX)';
  if (clientData.value <= 0) return 'Valor deve ser maior que zero';
  if (clientsData.some(c => c.email.toLowerCase() === clientData.email.toLowerCase() && c.id !== editingClientId)) {
    return 'Email já cadastrado';
  }
  return null;
}

// ==================== SINCRONIZAÇÃO OFFLINE ====================
function syncLocalData() {
  const cachedData = JSON.parse(localStorage.getItem('crmCache') || '[]');
  const localClients = cachedData.filter(client => client.id.startsWith('local_'));
  localClients.forEach(client => {
    const { id, ...clientData } = client;
    clientsRef.push(clientData).then(() => {
      cachedData.splice(cachedData.findIndex(c => c.id === id), 1);
      localStorage.setItem('crmCache', JSON.stringify(cachedData));
    });
  });
}

// ==================== INTERFACE E FEEDBACK ====================
function showNotification(message, type = 'success') {
  if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(message);
      } else {
        showFallbackNotification(message, type);
      }
    });
  } else {
    showFallbackNotification(message, type);
  }
}

function showFallbackNotification(message, type) {
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

function showLoading(show) {
  const loader = document.getElementById('loadingOverlay');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
    if (show) setTimeout(() => loader.style.display = 'none', 10000);
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
  updatePaginationInfo();
}

// ==================== FILTROS E ORDENAÇÃO ====================
function applyFiltersAndSorting() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  filteredData = clientsData.filter(client => {
    if (currentFilter !== 'all' && client.status !== currentFilter) return false;
    return (
      client.name.toLowerCase().includes(searchTerm) ||
      client.email.toLowerCase().includes(searchTerm) ||
      client.phone.includes(searchTerm) ||
      client.company.toLowerCase().includes(searchTerm)
    );
  });

  filteredData.sort((a, b) => {
    const valueA = a[currentSort.column] || '';
    const valueB = b[currentSort.column] || '';
    if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  currentPage = 1;
}

function updateSortIcons() {
  document.querySelectorAll('[data-sort]').forEach(icon => {
    icon.className = 'fas fa-sort';
    if (icon.getAttribute('data-sort') === currentSort.column) {
      icon.classList.add(`fa-sort-${currentSort.direction}`);
    }
  });
}

// ==================== PAGINAÇÃO ====================
function updatePaginationInfo() {
  const showingFrom = document.getElementById('showingFrom');
  const showingTo = document.getElementById('showingTo');
  const totalClients = document.getElementById('totalClients');
  const pageNumbers = document.getElementById('pageNumbers');

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (showingFrom) showingFrom.textContent = startIndex;
  if (showingTo) showingTo.textContent = endIndex;
  if (totalClients) totalClients.textContent = filteredData.length;

  if (pageNumbers) {
    pageNumbers.innerHTML = '';
    const maxPagesToShow = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const btn = document.createElement('button');
      btn.className = `btn ${i === currentPage ? 'active' : ''}`;
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderClientsTable();
      }, { passive: true });
      pageNumbers.appendChild(btn);
    }
  }

  const prevPage = document.getElementById('prevPage');
  const nextPage = document.getElementById('nextPage');
  if (prevPage) prevPage.disabled = currentPage === 1;
  if (nextPage) nextPage.disabled = currentPage >= totalPages;
}

function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderClientsTable();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderClientsTable();
  }
}

// ==================== MODAL E EDIÇÃO ====================
function openClientModal() {
  editingClientId = null;
  document.getElementById('modalTitle').textContent = 'Novo Cliente';
  document.getElementById('clientForm').reset();
  document.getElementById('clientModal').style.display = 'flex';
  document.getElementById('clientName').focus();
}

function closeClientModal() {
  document.getElementById('clientModal').style.display = 'none';
}

function editClient(clientId) {
  showLoading(true);
  clientsRef.child(clientId).once('value', snapshot => {
    const client = snapshot.val();
    if (!client) {
      showNotification('Cliente não encontrado', 'error');
      showLoading(false);
      return;
    }

    editingClientId = clientId;
    document.getElementById('modalTitle').textContent = 'Editar Cliente';
    document.getElementById('clientId').value = clientId;
    document.getElementById('clientName').value = client.name || '';
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientCompany').value = client.company || '';
    document.getElementById('clientServiceType').value = client.serviceType || 'Consultoria';
    document.getElementById('clientStatus').value = client.status || 'Realizando';
    document.getElementById('clientValue').value = client.value || '';
    document.getElementById('clientNotes').value = client.notes || '';
    document.getElementById('clientModal').style.display = 'flex';
    document.getElementById('clientName').focus();
    showLoading(false);
  }, error => {
    console.error('Erro ao carregar cliente:', error);
    showNotification('Erro ao carregar dados do cliente', 'error');
    showLoading(false);
  });
}

function deleteClient(clientId) {
  if (confirm('Tem certeza que deseja excluir este cliente?')) {
    showLoading(true);
    clientsRef.child(clientId).remove()
      .then(() => {
        showNotification('Cliente excluído com sucesso!', 'success');
      })
      .catch(error => {
        console.error('Erro ao excluir cliente:', error);
        showNotification('Erro ao excluir cliente', 'error');
      })
      .finally(() => showLoading(false));
  }
}

// ==================== UTILITÁRIOS ====================
function calculateTotalValue() {
  const total = clientsData.reduce((sum, client) => sum + (parseFloat(client.value) || 0), 0);
  const totalValueElement = document.getElementById('totalValue');
  if (totalValueElement) {
    totalValueElement.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
}

function toggleCardDetails(header) {
  const card = header.parentElement;
  const details = card.querySelector('.card-details');
  const icon = header.querySelector('i');
  const isExpanded = details.style.display === 'block';

  details.style.display = isExpanded ? 'none' : 'block';
  icon.className = `fas fa-chevron-${isExpanded ? 'down' : 'up'}`;
  header.setAttribute('aria-expanded', !isExpanded);
}

function getInitials(name) {
  if (!name) return '';
  return name.split(' ')
    .filter(part => part.length > 0)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

function stringToColor(str) {
  if (!str) return '#cccccc';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 60%)`;
}

function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
