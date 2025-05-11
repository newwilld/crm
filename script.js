// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAZJIWT5FPTshkArRs8v2U9hXAmtnlG-Q",
    authDomain: "myname22.firebaseapp.com",
    databaseURL: "https://myname22-default-rtdb.firebaseio.com",
    projectId: "myname22",
    storageBucket: "myname22.appspot.com",
    messagingSenderId: "346543194739",
    appId: "1:346543194739:web:bcb8fa36574ca5de552006"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const clientsRef = database.ref('clientes');

// Global Variables
let clientsData = [];
let currentPage = 1;
const itemsPerPage = 10;
let filteredData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadClients();
    setupEventListeners();
    initCharts();
});

// Load clients from Firebase
function loadClients() {
    clientsRef.on('value', (snapshot) => {
        clientsData = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                clientsData.push({ id: key, ...data[key] });
            });
            applyFilters();
            renderClientsTable();
            calculateTotalValue();
        } else {
            showNoResults();
        }
    });
}

// Render clients table
function renderClientsTable() {
    const tableBody = document.querySelector('#clientsTable tbody');
    tableBody.innerHTML = '';

    if (filteredData.length === 0) {
        showNoResults();
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    paginatedData.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <!-- Seu template de linha aqui -->
        `;
        tableBody.appendChild(row);
    });

    updatePaginationInfo();
}
