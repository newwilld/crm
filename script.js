// Dados de exemplo para o CRM
const clientsData = [
    {
        id: 1,
        initials: 'CU',
        name: 'CRISTOVÃO USSACA',
        email: 'crist@gmail.com',
        project: 'Site Institucional',
        status: 'active',
        value: 4500.00,
        payment: 'paid',
        lastContact: '2023-05-15',
        notes: 'Cliente solicitou alterações no layout'
    },
    {
        id: 2,
        initials: 'RP',
        name: 'RAFAEL PANDA',
        email: 'grupopanda@gmail.com',
        project: 'E-commerce',
        status: 'active',
        value: 8900.00,
        payment: 'pending',
        lastContact: '2023-05-10',
        notes: 'Aguardando aprovação do protótipo'
    },
    {
        id: 3,
        initials: 'JV',
        name: 'JOÃO VINICIUS',
        email: 'jose@vinicus.com',
        project: 'App Mobile',
        status: 'negotiation',
        value: 12500.00,
        payment: 'overdue',
        lastContact: '2023-05-05',
        notes: 'Reunião agendada para 20/05'
    },
    {
        id: 4,
        initials: 'DT',
        name: 'DAVID TDS',
        email: 'tdsrendering@gmail.com',
        project: 'Identidade Visual',
        status: 'completed',
        value: 3200.00,
        payment: 'paid',
        lastContact: '2023-04-28',
        notes: 'Projeto entregue com sucesso'
    },
    {
        id: 5,
        initials: 'MV',
        name: 'MARCELIA VMZ',
        email: 'acompanhamento@rebroo.com',
        project: 'SEO Website',
        status: 'paused',
        value: 2200.00,
        payment: 'paid',
        lastContact: '2023-04-15',
        notes: 'Cliente pediu para pausar temporariamente'
    },
    {
        id: 6,
        initials: 'RS',
        name: 'RAFAEL SANTOS ALPINISMO',
        email: 'rafael@alphismo.com',
        project: 'Blog Corporativo',
        status: 'prospect',
        value: 1800.00,
        payment: 'pending',
        lastContact: '2023-05-12',
        notes: 'Enviar proposta até sexta-feira'
    },
    {
        id: 7,
        initials: 'AB',
        name: 'AMA BARROS CAPITAL UP',
        email: 'amabarros@capitalup.com',
        project: 'Sistema ERP',
        status: 'active',
        value: 25000.00,
        payment: 'paid',
        lastContact: '2023-05-14',
        notes: 'Fase 2 em desenvolvimento'
    },
    {
        id: 8,
        initials: 'LF',
        name: 'LUCAS FERNANDES',
        email: 'lucas@techsolutions.com',
        project: 'Redesign de Logo',
        status: 'completed',
        value: 1500.00,
        payment: 'paid',
        lastContact: '2023-04-20',
        notes: 'Cliente satisfeito com o resultado'
    },
    {
        id: 9,
        initials: 'PM',
        name: 'PATRICIA MENDES',
        email: 'patricia@consultoriapm.com',
        project: 'Site WordPress',
        status: 'active',
        value: 3800.00,
        payment: 'pending',
        lastContact: '2023-05-08',
        notes: 'Aguardando conteúdo do cliente'
    },
    {
        id: 10,
        initials: 'TC',
        name: 'THIAGO COSTA',
        email: 'thiago@digitalmarketing.com',
        project: 'Campanha Ads',
        status: 'active',
        value: 5200.00,
        payment: 'paid',
        lastContact: '2023-05-16',
        notes: 'Campanha performando acima da média'
    }
];

// Variáveis globais
let currentPage = 1;
const itemsPerPage = 25;
let filteredData = [...clientsData];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    renderClientsTable();
    setupEventListeners();
    initCharts();
});

// Renderiza a tabela de clientes
function renderClientsTable() {
    const tableBody = document.querySelector('#clientsTable tbody');
    tableBody.innerHTML = '';

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    paginatedData.forEach(client => {
        const row = document.createElement('tr');
        
        // Formata o status
        let statusClass, statusText;
        switch(client.status) {
            case 'active':
                statusClass = 'status-active';
                statusText = 'Ativo';
                break;
            case 'completed':
                statusClass = 'status-active';
                statusText = 'Concluído';
                break;
            case 'negotiation':
                statusClass = 'status-pending';
                statusText = 'Em Negociação';
                break;
            case 'prospect':
                statusClass = 'status-pending';
                statusText = 'Prospect';
                break;
            case 'paused':
                statusClass = 'status-inactive';
                statusText = 'Pausado';
                break;
            default:
                statusClass = 'status-inactive';
                statusText = 'Inativo';
        }

        // Formata o pagamento
        let paymentClass, paymentText, paymentIcon;
        switch(client.payment) {
            case 'paid':
                paymentClass = 'payment-paid';
                paymentText = 'Pago';
                paymentIcon = 'fa-check-circle';
                break;
            case 'pending':
                paymentClass = 'payment-pending';
                paymentText = 'Pendente';
                paymentIcon = 'fa-clock';
                break;
            case 'overdue':
                paymentClass = 'payment-overdue';
                paymentText = 'Atrasado';
                paymentIcon = 'fa-exclamation-circle';
                break;
            default:
                paymentClass = 'payment-pending';
                paymentText = 'Pendente';
                paymentIcon = 'fa-clock';
        }

        // Formata a data
        const formattedDate = formatDate(client.lastContact);

        row.innerHTML = `
            <td>
                <div class="client-info">
                    <span class="client-initials">${client.initials}</span>
                    <div>
                        <strong>${client.name}</strong>
                        <small>${client.email}</small>
                    </div>
                </div>
            </td>
            <td>${client.project}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>R$ ${client.value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td>
                <span class="payment-badge ${paymentClass}">
                    <i class="fas ${paymentIcon}"></i> ${paymentText}
                </span>
            </td>
            <td>${formattedDate}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" data-id="${client.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit-btn" data-id="${client.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" data-id="${client.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Atualiza informações de paginação
    updatePaginationInfo();
}

// Formata a data para o formato brasileiro
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Atualiza as informações de paginação
function updatePaginationInfo() {
    const showingFrom = document.getElementById('showingFrom');
    const showingTo = document.getElementById('showingTo');
    const totalItems = document.getElementById('totalItems');
    
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);
    
    showingFrom.textContent = startIndex;
    showingTo.textContent = endIndex;
    totalItems.textContent = filteredData.length;
    
    // Atualiza botões de paginação
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = endIndex >= filteredData.length;
}

// Configura os event listeners
function setupEventListeners() {
    // Botão Novo Projeto
    document.getElementById('newProjectBtn').addEventListener('click', openProjectModal);
    
    // Botão Fechar Modal
    document.querySelector('.close-modal').addEventListener('click', closeProjectModal);
    
    // Botão Cancelar Modal
    document.querySelector('.cancel-btn').addEventListener('click', closeProjectModal);
    
    // Submissão do Formulário
    document.getElementById('projectForm').addEventListener('submit', handleFormSubmit);
	localStorage.setItem('crmClients', JSON.stringify(clientsData));
let clientsData = JSON.parse(localStorage.getItem('crmClients')) || [

    function saveClientsToLocalStorage() {
    localStorage.setItem('crmClients', JSON.stringify(clientsData));
}
    // Paginação
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderClientsTable();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderClientsTable();
        }
    });
    
    // Botão Exportar
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Botão Importar
    document.getElementById('importBtn').addEventListener('click', () => {
        alert('Funcionalidade de importação será implementada em breve!');
    });
    
    // Delegation para botões de ação na tabela
    document.querySelector('#clientsTable tbody').addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const clientId = parseInt(target.getAttribute('data-id'));
        const client = clientsData.find(c => c.id === clientId);
        
        if (target.classList.contains('view-btn')) {
            viewClientDetails(client);
        } else if (target.classList.contains('edit-btn')) {
            editClient(client);
        } else if (target.classList.contains('delete-btn')) {
            deleteClient(clientId);
        }
    });
}

// Abre o modal de novo projeto
function openProjectModal() {
    document.getElementById('projectModal').style.display = 'flex';
}

// Fecha o modal
function closeProjectModal() {
    document.getElementById('projectModal').style.display = 'none';
    document.getElementById('projectForm').reset();
}

// Manipula o envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();
    
    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const projectName = document.getElementById('projectName').value;
    const projectValue = parseFloat(document.getElementById('projectValue').value);
    const projectStatus = document.getElementById('projectStatus').value;
    const projectNotes = document.getElementById('projectNotes').value;
    saveClientsToLocalStorage(); // Esta linha salva os dados
    // Cria um novo cliente/projeto (simulação)
    const newClient = {
        id: clientsData.length + 1,
        initials: getInitials(clientName),
        name: clientName,
        email: clientEmail,
        project: projectName,
        status: projectStatus,
        value: projectValue,
        payment: 'pending',
        lastContact: new Date().toISOString().split('T')[0],
        notes: projectNotes
    };
    
    clientsData.unshift(newClient);
    filteredData = [...clientsData];
    currentPage = 1;
    renderClientsTable();
    closeProjectModal();
    
    alert('Projeto cadastrado com sucesso!');
}

// Gera iniciais a partir do nome
function getInitials(name) {
    return name.split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Visualiza detalhes do cliente
function viewClientDetails(client) {
    alert(`Detalhes do Cliente:\n\nNome: ${client.name}\nEmail: ${client.email}\nProjeto: ${client.project}\nValor: R$ ${client.value.toFixed(2)}\nStatus: ${client.status}\nÚltimo Contato: ${formatDate(client.lastContact)}\n\nObservações:\n${client.notes}`);
}

// Edita cliente
function editClient(client) {
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientEmail').value = client.email;
    document.getElementById('projectName').value = client.project;
    document.getElementById('projectValue').value = client.value;
    document.getElementById('projectStatus').value = client.status;
    document.getElementById('projectNotes').value = client.notes;
    
    openProjectModal();
}

// Exclui cliente
function deleteClient(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        const index = clientsData.findIndex(c => c.id === clientId);
        if (index !== -1) {
            clientsData.splice(index, 1);
            filteredData = [...clientsData];
            
            // Ajusta a página atual se necessário
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage > totalPages && totalPages > 0) {
                currentPage = totalPages;
            } else if (totalPages === 0) {
                currentPage = 1;
            }
            
            renderClientsTable();
            alert('Cliente excluído com sucesso!');
        }
    }
}

// Exporta dados para CSV
function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Cabeçalhos
    csvContent += "Cliente,Email,Projeto,Status,Valor,Pagamento,Último Contato\n";
    
    // Dados
    clientsData.forEach(client => {
        const row = [
            client.name,
            client.email,
            client.project,
            client.status,
            client.value,
            client.payment,
            formatDate(client.lastContact)
        ].join(',');
        
        csvContent += row + "\n";
    });
    
    // Cria link de download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_crm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Inicializa os gráficos
function initCharts() {
    // Gráfico de status dos projetos
    const statusCtx = document.getElementById('projectsChart').getContext('2d');
    const statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Ativos', 'Concluídos', 'Em Negociação', 'Prospects', 'Pausados'],
            datasets: [{
                data: [4, 2, 1, 1, 1],
                backgroundColor: [
                    '#4361ee',
                    '#4bb543',
                    '#ffcc00',
                    '#6c757d',
                    '#f44336'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Gráfico de receita mensal
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    const revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Receita (R$)',
                data: [12000, 19000, 15000, 18000, 25000, 22000],
                backgroundColor: '#4361ee',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}
const clientData = {
    name: clientName,
    email: clientEmail,
    phone: clientPhone,
    company: clientCompany,
    status: clientStatus,
    serviceType: document.getElementById('clientServiceType').value,
    value: parseFloat(document.getElementById('clientValue').value),
    notes: clientNotes,
    projects: 0,
    lastContact: new Date().toISOString().split('T')[0]
};

// Atualize a função que renderiza as linhas da tabela
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
    <td>R$ ${client.value.toFixed(2)}</td>
    <td>${client.phone}</td>
    <td>${client.company}</td>
    <td><span class="service-badge">${client.serviceType}</span></td>
    <td><span class="status-badge ${client.status === 'Entregue' ? 'status-entregue' : 'status-realizando'}">${client.status}</span></td>
    <td class="actions-cell">
        <button class="action-btn edit-btn" data-id="${client.id}">
            <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" data-id="${client.id}">
            <i class="fas fa-trash"></i>
        </button>
    </td>
`;

// Adicione esta função para calcular o valor total
function calculateTotalValue() {
    const total = clientsData.reduce((sum, client) => sum + (client.value || 0), 0);
    document.getElementById('totalValue').textContent = 
        `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// Chame esta função sempre que atualizar a tabela
function renderClientsTable() {
    // ... código existente ...
    calculateTotalValue();
}
function saveClientsToLocalStorage() {
    localStorage.setItem('crmClients', JSON.stringify(clientsData));
}