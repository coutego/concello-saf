import { invoke } from '@tauri-apps/api/tauri';
import { save, open } from '@tauri-apps/api/dialog';
import { appDataDir } from '@tauri-apps/api/path';

// App state
let currentView = 'dashboard';
let selectedUser = null;
let selectedItems = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
});

async function initApp() {
    try {
        // Load initial data
        await loadDashboard();
        
        // Setup navigation
        setupNavigation();
        
        // Hide loading screen
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Render app structure
        renderApp();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        alert('Erro ao iniciar a aplicación: ' + error);
    }
}

function renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="app-container">
            ${renderSidebar()}
            <main class="main-content">
                ${renderDashboardView()}
                ${renderNewLoanView()}
                ${renderUsersView()}
                ${renderInventoryView()}
                ${renderLoansView()}
                ${renderReportsView()}
                ${renderEventsView()}
                ${renderBackupView()}
            </main>
        </div>
        ${renderModal()}
    `;
    
    // Setup event listeners
    setupEventListeners();
    
    // Show default view
    showView('dashboard');
}

function renderSidebar() {
    return `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <div class="logo-icon">
                        <i class="fas fa-hands-helping"></i>
                    </div>
                    <div class="logo-text">
                        <h1>SAF Barreiros</h1>
                        <p>Xestión de Préstamos</p>
                    </div>
                </div>
            </div>

            <nav class="nav-menu">
                <div class="nav-section">
                    <div class="nav-section-title">Principal</div>
                    <a href="#" class="nav-item active" data-view="dashboard">
                        <i class="fas fa-home"></i>
                        <span>Panel de Control</span>
                    </a>
                    <a href="#" class="nav-item" data-view="new-loan">
                        <i class="fas fa-plus-circle"></i>
                        <span>Novo Préstamo</span>
                    </a>
                    <a href="#" class="nav-item" data-view="loans">
                        <i class="fas fa-hand-holding"></i>
                        <span>Préstamos</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Xestión</div>
                    <a href="#" class="nav-item" data-view="users">
                        <i class="fas fa-users"></i>
                        <span>Usuarios</span>
                    </a>
                    <a href="#" class="nav-item" data-view="inventory">
                        <i class="fas fa-boxes"></i>
                        <span>Inventario</span>
                    </a>
                </div>

                <div class="nav-section">
                    <div class="nav-section-title">Sistema</div>
                    <a href="#" class="nav-item" data-view="reports">
                        <i class="fas fa-chart-bar"></i>
                        <span>Informes</span>
                    </a>
                    <a href="#" class="nav-item" data-view="events">
                        <i class="fas fa-stream"></i>
                        <span>Rexistro de Eventos</span>
                    </a>
                    <a href="#" class="nav-item" data-view="backup">
                        <i class="fas fa-database"></i>
                        <span>Backup e Exportar</span>
                    </a>
                </div>
            </nav>

            <div class="sidebar-footer">
                <div class="user-info">
                    <div class="user-avatar">SA</div>
                    <div class="user-details">
                        <h4>Administrador</h4>
                        <p>SAF Barreiros</p>
                    </div>
                </div>
            </div>
        </aside>
    `;
}

function renderDashboardView() {
    return `
        <div class="view" id="dashboard">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Panel de Control</h2>
                    <p>Benvida de novo. Aquí está o resumo de hoxe.</p>
                </div>
                <div class="top-actions">
                    <button class="btn btn-secondary" id="currentDate">
                        <i class="fas fa-calendar"></i>
                        ${new Date().toLocaleDateString('gl-ES')}
                    </button>
                    <button class="btn btn-primary" onclick="showView('new-loan')">
                        <i class="fas fa-plus"></i>
                        Novo Préstamo
                    </button>
                </div>
            </div>

            <div class="stats-grid" id="statsGrid">
                <!-- Stats will be loaded dynamically -->
            </div>

            <div class="quick-actions">
                <div class="quick-action-card" onclick="showView('new-loan')">
                    <div class="quick-action-icon" style="background: #dbeafe; color: #2563eb;">
                        <i class="fas fa-plus"></i>
                    </div>
                    <h3>Novo Préstamo</h3>
                    <p>Rexistrar un novo préstamo</p>
                </div>
                <div class="quick-action-card" onclick="showView('users')">
                    <div class="quick-action-icon" style="background: #d1fae5; color: #10b981;">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <h3>Novo Usuario</h3>
                    <p>Rexistrar un novo usuario</p>
                </div>
                <div class="quick-action-card" onclick="showView('inventory')">
                    <div class="quick-action-icon" style="background: #fef3c7; color: #f59e0b;">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3>Xestionar Stock</h3>
                    <p>Actualizar inventario</p>
                </div>
            </div>

            <div class="content-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Últimos Préstamos</h3>
                        <button class="btn btn-secondary" onclick="showView('loans')">
                            Ver Todos
                        </button>
                    </div>
                    <div class="card-body">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Artigo</th>
                                    <th>Data</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody id="recentLoansTable">
                                <!-- Will be populated dynamically -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Actividade Recente</h3>
                    </div>
                    <div class="card-body">
                        <div class="activity-list" id="recentActivity">
                            <!-- Will be populated dynamically -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderNewLoanView() {
    return `
        <div class="view" id="new-loan">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Novo Préstamo</h2>
                    <p>Crear un novo préstamo seleccionando primeiro o usuario e despois os artigos.</p>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="loan-flow">
                        <div class="flow-step active" id="step1">
                            <div class="flow-step-header">
                                <div class="step-number">1</div>
                                <h4>Seleccionar Usuario</h4>
                            </div>
                            <div class="search-bar">
                                <div class="search-input">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="userSearch" placeholder="Buscar usuario por nome, DNI ou dirección...">
                                </div>
                                <button class="btn btn-secondary" onclick="showNewUserModal()">
                                    <i class="fas fa-plus"></i>
                                    Novo Usuario
                                </button>
                            </div>
                            <div class="fuzzy-results" id="userResults" style="display: none;"></div>
                            <div id="selectedUserDisplay" style="margin-top: 16px; display: none;">
                                <div class="selected-item">
                                    <i class="fas fa-user"></i>
                                    <span id="selectedUserName"></span>
                                    <button onclick="clearSelectedUser()"><i class="fas fa-times"></i></button>
                                </div>
                            </div>
                        </div>

                        <div class="flow-step" id="step2">
                            <div class="flow-step-header">
                                <div class="step-number">2</div>
                                <h4>Seleccionar Artigos</h4>
                            </div>
                            <div class="search-input">
                                <i class="fas fa-search"></i>
                                <input type="text" id="itemSearch" placeholder="Buscar artigos...">
                            </div>
                            <div class="fuzzy-results" id="itemResults" style="margin-top: 12px; display: none;"></div>
                            <div class="selected-items" id="selectedItems"></div>
                        </div>

                        <div class="flow-step" id="step3">
                            <div class="flow-step-header">
                                <div class="step-number">3</div>
                                <h4>Confirmar Préstamo</h4>
                            </div>
                            <div class="form-group">
                                <label>Data de Inicio</label>
                                <input type="date" id="loanStartDate" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div class="form-group">
                                <label>Data Estimada de Devolución</label>
                                <input type="date" id="loanEndDate" value="${getDefaultEndDate()}">
                            </div>
                            <div class="form-group">
                                <label>Notas Adicionais</label>
                                <textarea id="loanNotes" rows="3" placeholder="Observacións sobre o préstamo..."></textarea>
                            </div>
                            <div style="display: flex; gap: 12px; margin-top: 24px;">
                                <button class="btn btn-primary btn-lg" onclick="createLoan()">
                                    <i class="fas fa-check"></i>
                                    Confirmar Préstamo
                                </button>
                                <button class="btn btn-secondary btn-lg" onclick="resetLoanForm()">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderUsersView() {
    return `
        <div class="view" id="users">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Xestión de Usuarios</h2>
                    <p>Rexistrar e xestionar usuarios do servizo.</p>
                </div>
                <div class="top-actions">
                    <button class="btn btn-primary" onclick="showNewUserModal()">
                        <i class="fas fa-plus"></i>
                        Novo Usuario
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="search-bar" style="flex: 1; margin: 0;">
                        <div class="search-input" style="max-width: 400px;">
                            <i class="fas fa-search"></i>
                            <input type="text" id="usersSearchInput" placeholder="Buscar usuarios...">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>DNI</th>
                                <th>Dirección</th>
                                <th>Teléfono</th>
                                <th>Accións</th>
                            </tr>
                        </thead>
                        <tbody id="usersTable">
                            <!-- Will be populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderInventoryView() {
    return `
        <div class="view" id="inventory">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Xestión de Inventario</h2>
                    <p>Xestionar o stock de artigos dispoñibles.</p>
                </div>
                <div class="top-actions">
                    <button class="btn btn-primary" onclick="showAddItemModal()">
                        <i class="fas fa-plus"></i>
                        Engadir Artigos
                    </button>
                </div>
            </div>

            <div class="items-grid" id="itemsGrid">
                <!-- Will be populated dynamically -->
            </div>
        </div>
    `;
}

function renderLoansView() {
    return `
        <div class="view" id="loans">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Xestión de Préstamos</h2>
                    <p>Ver e xestionar todos os préstamos.</p>
                </div>
                <div class="top-actions">
                    <button class="btn btn-primary" onclick="showView('new-loan')">
                        <i class="fas fa-plus"></i>
                        Novo Préstamo
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="search-bar" style="flex: 1; margin: 0;">
                        <div class="search-input" style="max-width: 400px;">
                            <i class="fas fa-search"></i>
                            <input type="text" id="loansSearchInput" placeholder="Buscar préstamos...">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Artigos</th>
                                <th>Data Inicio</th>
                                <th>Data Fin</th>
                                <th>Estado</th>
                                <th>Accións</th>
                            </tr>
                        </thead>
                        <tbody id="loansTable">
                            <!-- Will be populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderReportsView() {
    return `
        <div class="view" id="reports">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Informes e Estatísticas</h2>
                    <p>Xerar informes detallados do servizo.</p>
                </div>
            </div>

            <div class="reports-grid">
                <div class="report-card" onclick="exportReport('loans')">
                    <div class="report-icon" style="background: #dbeafe; color: #2563eb;">
                        <i class="fas fa-hand-holding"></i>
                    </div>
                    <h3>Préstamos Activos</h3>
                    <p>Lista de todos os préstamos actualmente activos</p>
                    <button class="btn btn-primary">Exportar Excel</button>
                </div>

                <div class="report-card" onclick="exportReport('inventory')">
                    <div class="report-icon" style="background: #d1fae5; color: #10b981;">
                        <i class="fas fa-boxes"></i>
                    </div>
                    <h3>Estado do Inventario</h3>
                    <p>Resumo completo do stock dispoñible</p>
                    <button class="btn btn-success">Exportar Excel</button>
                </div>

                <div class="report-card" onclick="exportReport('users')">
                    <div class="report-icon" style="background: #e0e7ff; color: #6366f1;">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>Usuarios</h3>
                    <p>Lista completa de usuarios rexistrados</p>
                    <button class="btn btn-secondary">Exportar Excel</button>
                </div>
            </div>
        </div>
    `;
}

function renderEventsView() {
    return `
        <div class="view" id="events">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Rexistro de Eventos</h2>
                    <p>Historial completo de todas as accións (Event Sourcing).</p>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <div class="event-log" id="eventsLog">
                        <!-- Will be populated dynamically -->
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderBackupView() {
    return `
        <div class="view" id="backup">
            <div class="top-bar">
                <div class="page-title">
                    <h2>Backup e Exportar</h2>
                    <p>Crear copias de seguridade e exportar datos.</p>
                </div>
            </div>

            <div class="content-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Copias de Seguridade</h3>
                    </div>
                    <div class="card-body">
                        <div class="activity-list" id="backupList">
                            <!-- Will be populated dynamically -->
                        </div>
                        <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="createBackup()">
                            <i class="fas fa-plus"></i>
                            Crear Backup Agora
                        </button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Exportar a Excel</h3>
                    </div>
                    <div class="card-body">
                        <div class="form-group">
                            <label>Seleccionar datos a exportar</label>
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                                    <input type="checkbox" id="exportUsers" checked> Usuarios
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                                    <input type="checkbox" id="exportLoans" checked> Préstamos
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; font-weight: normal; cursor: pointer;">
                                    <input type="checkbox" id="exportInventory" checked> Inventario
                                </label>
                            </div>
                        </div>
                        <button class="btn btn-success" style="width: 100%;" onclick="exportToExcel()">
                            <i class="fas fa-file-excel"></i>
                            Exportar a Excel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderModal() {
    return `
        <div class="modal-overlay" id="modalOverlay">
            <div class="modal">
                <div class="modal-header">
                    <h2 id="modalTitle">Título</h2>
                    <button class="modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="modalBody"></div>
            </div>
        </div>
    `;
}

// Navigation
function setupNavigation() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-item')) {
            e.preventDefault();
            const view = e.target.closest('.nav-item').getAttribute('data-view');
            showView(view);
        }
    });
}

function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
    
    // Show selected view
    const view = document.getElementById(viewName);
    if (view) {
        view.classList.add('active');
    }
    
    // Load data for the view
    loadViewData(viewName);
}

async function loadViewData(viewName) {
    try {
        switch (viewName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'users':
                await loadUsers();
                break;
            case 'inventory':
                await loadInventory();
                break;
            case 'loans':
                await loadLoans();
                break;
            case 'events':
                await loadEvents();
                break;
            case 'backup':
                await loadBackups();
                break;
            case 'new-loan':
                await loadItemsForLoan();
                break;
        }
    } catch (error) {
        console.error('Error loading view data:', error);
    }
}

// Data loading functions
async function loadDashboard() {
    try {
        const stats = await invoke('get_dashboard_stats');
        
        // Update stats grid
        const statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            statsGrid.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <i class="fas fa-hand-holding"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.active_loans}</h3>
                        <p>Préstamos Activos</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon orange">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.pending_returns}</h3>
                        <p>Pendentes de Devolución</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.total_items_available}</h3>
                        <p>Artigos Dispoñibles</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${stats.total_users}</h3>
                        <p>Usuarios Rexistrados</p>
                    </div>
                </div>
            `;
        }
        
        // Update recent loans table
        const recentLoansTable = document.getElementById('recentLoansTable');
        if (recentLoansTable && stats.recent_loans) {
            recentLoansTable.innerHTML = stats.recent_loans.slice(0, 5).map(loan => `
                <tr>
                    <td><strong>${loan.user_name}</strong></td>
                    <td>${loan.items.map(i => i.item_name).join(', ')}</td>
                    <td>${loan.start_date}</td>
                    <td>${getStatusBadge(loan.status)}</td>
                </tr>
            `).join('');
        }
        
        // Update recent activity
        const recentActivity = document.getElementById('recentActivity');
        if (recentActivity && stats.recent_events) {
            recentActivity.innerHTML = stats.recent_events.slice(0, 5).map(event => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: ${getEventColor(event.event_type)};">
                        <i class="fas ${getEventIcon(event.event_type)}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${getEventTitle(event.event_type)}</h4>
                        <p>${JSON.stringify(event.data).substring(0, 50)}...</p>
                        <span class="activity-time">${event.created_at}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadUsers() {
    try {
        const users = await invoke('get_users');
        const usersTable = document.getElementById('usersTable');
        if (usersTable) {
            usersTable.innerHTML = users.map(user => `
                <tr>
                    <td><strong>${user.name}</strong></td>
                    <td>${user.dni}</td>
                    <td>${user.address}</td>
                    <td>${user.phone || '-'}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 6px 12px;" onclick="showEditUserModal('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadInventory() {
    try {
        const items = await invoke('get_items');
        const itemsGrid = document.getElementById('itemsGrid');
        if (itemsGrid) {
            // Filtrar só artigos que teñan unidades (stock > 0 ou en préstamo > 0)
            const itemsWithUnits = items.filter(item => item.total_stock > 0 || (item.total_stock - item.available_stock) > 0);
            
            if (itemsWithUnits.length === 0) {
                // Mostrar mensaxe cando non hai artigos con unidades
                itemsGrid.innerHTML = `
                    <div class="empty-inventory" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                        <div style="font-size: 64px; margin-bottom: 20px;">📦</div>
                        <h3 style="font-size: 20px; margin-bottom: 12px; color: var(--text);">Sen Artigos con Unidades</h3>
                        <p style="color: var(--text-light); margin-bottom: 24px;">Non hai artigos con stock ou en préstamo. Podes engadir artigos desde a lista por defecto ou crear artigos personalizados.</p>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-primary" onclick="showAddDefaultItemsModal()">
                                <i class="fas fa-list"></i>
                                Engadir da Lista
                            </button>
                            <button class="btn btn-secondary" onclick="showCreateCustomItemModal()">
                                <i class="fas fa-plus"></i>
                                Crear Artigo
                            </button>
                        </div>
                    </div>
                `;
            } else {
                itemsGrid.innerHTML = itemsWithUnits.map(item => `
                    <div class="item-card">
                        <div class="item-card-header">
                            <div class="item-image">${item.icon}</div>
                            <div>
                                <h4>${item.name}</h4>
                                <p style="color: var(--text-light); font-size: 13px;">${item.description || ''}</p>
                            </div>
                        </div>
                        <div class="item-stock">
                            <span>Total: ${item.total_stock}</span>
                            <span style="color: ${item.available_stock > 3 ? 'var(--success)' : item.available_stock > 0 ? 'var(--warning)' : 'var(--danger)'}; font-weight: 600;">
                                Dispoñibles: ${item.available_stock}
                            </span>
                            <span style="color: var(--warning); font-weight: 600;">
                                En préstamo: ${item.total_stock - item.available_stock}
                            </span>
                        </div>
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                            <button class="btn btn-secondary" style="width: 100%;" onclick="showUpdateStockModal('${item.id}', '${item.name}', ${item.total_stock})">
                                <i class="fas fa-edit"></i>
                                Actualizar Stock
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
    }
}

async function loadLoans() {
    try {
        const loans = await invoke('get_loans');
        const loansTable = document.getElementById('loansTable');
        if (loansTable) {
            loansTable.innerHTML = loans.map(loan => `
                <tr>
                    <td>${loan.id}</td>
                    <td><strong>${loan.user_name}</strong></td>
                    <td>${loan.items.map(i => i.item_name).join(', ')}</td>
                    <td>${loan.start_date}</td>
                    <td>${loan.expected_end_date}</td>
                    <td>${getStatusBadge(loan.status)}</td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 6px 12px;" onclick="showLoanDetails('${loan.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${loan.status === 'active' || loan.status === 'overdue' ? `
                            <button class="btn btn-success" style="padding: 6px 12px;" onclick="returnLoan('${loan.id}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading loans:', error);
    }
}

async function loadEvents() {
    try {
        const events = await invoke('get_events', { limit: 50 });
        const eventsLog = document.getElementById('eventsLog');
        if (eventsLog) {
            eventsLog.innerHTML = events.map(event => `
                <div class="event-item">
                    <span class="event-time">${event.created_at}</span>
                    <span class="event-type">${event.event_type}</span>
                    <span class="event-data">${JSON.stringify(event.data)}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

async function loadBackups() {
    try {
        const backupDir = await appDataDir();
        const backups = await invoke('get_backup_list', { backupDir: backupDir + '/backups' });
        const backupList = document.getElementById('backupList');
        if (backupList) {
            backupList.innerHTML = backups.slice(0, 5).map(backup => `
                <div class="activity-item">
                    <div class="activity-icon" style="background: #dbeafe; color: #2563eb;">
                        <i class="fas fa-file-archive"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${backup.filename}</h4>
                        <p>Tamaño: ${formatFileSize(backup.size)}</p>
                        <span class="activity-time">${backup.created_at}</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading backups:', error);
    }
}

async function loadItemsForLoan() {
    try {
        const items = await invoke('get_items');
        const itemResults = document.getElementById('itemResults');
        if (itemResults) {
            itemResults.innerHTML = items.filter(item => item.available_stock > 0).map(item => `
                <div class="fuzzy-item" onclick="toggleItemSelection('${item.id}', '${item.name}', this)">
                    <div class="fuzzy-item-icon">${item.icon}</div>
                    <div class="fuzzy-item-info">
                        <h5>${item.name}</h5>
                        <p>${item.description || ''}</p>
                    </div>
                    <div class="fuzzy-item-stock">
                        <span class="${item.available_stock > 3 ? 'stock-available' : 'stock-low'}">${item.available_stock} disp.</span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Helper functions
function getStatusBadge(status) {
    const statusMap = {
        'active': { class: 'active', text: 'Activo', icon: 'fa-circle' },
        'pending': { class: 'pending', text: 'Pendente', icon: 'fa-clock' },
        'returned': { class: 'returned', text: 'Devolto', icon: 'fa-check' },
        'overdue': { class: 'overdue', text: 'Atrasado', icon: 'fa-exclamation-circle' }
    };
    const s = statusMap[status] || statusMap['active'];
    return `<span class="status-badge ${s.class}"><i class="fas ${s.icon}"></i> ${s.text}</span>`;
}

function getEventColor(eventType) {
    const colors = {
        'USER_CREATED': '#dbeafe',
        'LOAN_CREATED': '#d1fae5',
        'LOAN_RETURNED': '#dbeafe',
        'STOCK_RESERVED': '#fef3c7',
        'STOCK_RELEASED': '#d1fae5'
    };
    return colors[eventType] || '#f3f4f6';
}

function getEventIcon(eventType) {
    const icons = {
        'USER_CREATED': 'fa-user-plus',
        'LOAN_CREATED': 'fa-plus',
        'LOAN_RETURNED': 'fa-check',
        'STOCK_RESERVED': 'fa-box',
        'STOCK_RELEASED': 'fa-box-open'
    };
    return icons[eventType] || 'fa-info';
}

function getEventTitle(eventType) {
    const titles = {
        'USER_CREATED': 'Novo usuario rexistrado',
        'LOAN_CREATED': 'Novo préstamo creado',
        'LOAN_RETURNED': 'Préstamo devolto',
        'STOCK_RESERVED': 'Stock reservado',
        'STOCK_RELEASED': 'Stock liberado'
    };
    return titles[eventType] || eventType;
}

function getDefaultEndDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Search functionality
function setupEventListeners() {
    // User search in new loan
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        let searchTimeout;
        userSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value;
                if (query.length >= 2) {
                    try {
                        const users = await invoke('search_users', { query });
                        const userResults = document.getElementById('userResults');
                        if (userResults) {
                            userResults.style.display = 'block';
                            userResults.innerHTML = users.map(user => `
                                <div class="fuzzy-item" onclick="selectUser('${user.id}', '${user.name}', '${user.dni}')">
                                    <div class="fuzzy-item-icon" style="background: #dbeafe; color: #2563eb;">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="fuzzy-item-info">
                                        <h5>${user.name}</h5>
                                        <p>DNI: ${user.dni} • ${user.address}</p>
                                    </div>
                                </div>
                            `).join('');
                        }
                    } catch (error) {
                        console.error('Error searching users:', error);
                    }
                }
            }, 300);
        });
    }
    
    // Item search
    const itemSearch = document.getElementById('itemSearch');
    if (itemSearch) {
        itemSearch.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const itemResults = document.getElementById('itemResults');
            if (itemResults) {
                const items = itemResults.querySelectorAll('.fuzzy-item');
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? 'flex' : 'none';
                });
                itemResults.style.display = query.length > 0 ? 'block' : 'none';
            }
        });
    }
}

// User selection for loan
window.selectUser = function(userId, name, dni) {
    selectedUser = { id: userId, name, dni };
    document.getElementById('selectedUserName').textContent = `${name} (${dni})`;
    document.getElementById('selectedUserDisplay').style.display = 'block';
    document.getElementById('userResults').style.display = 'none';
    document.getElementById('userSearch').value = '';
    
    // Activate step 2
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
};

window.clearSelectedUser = function() {
    selectedUser = null;
    document.getElementById('selectedUserDisplay').style.display = 'none';
    document.getElementById('step1').classList.add('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step2').classList.remove('active');
};

// Item selection
window.toggleItemSelection = function(itemId, itemName, element) {
    const index = selectedItems.findIndex(i => i.id === itemId);
    if (index > -1) {
        selectedItems.splice(index, 1);
        element.classList.remove('selected');
    } else {
        selectedItems.push({ id: itemId, name: itemName });
        element.classList.add('selected');
    }
    updateSelectedItemsDisplay();
    
    if (selectedItems.length > 0) {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step2').classList.add('completed');
        document.getElementById('step3').classList.add('active');
    }
};

function updateSelectedItemsDisplay() {
    const container = document.getElementById('selectedItems');
    if (container) {
        container.innerHTML = selectedItems.map(item => `
            <div class="selected-item">
                <i class="fas fa-box"></i>
                <span>${item.name}</span>
                <button onclick="removeItem('${item.id}')"><i class="fas fa-times"></i></button>
            </div>
        `).join('');
    }
}

window.removeItem = function(itemId) {
    const index = selectedItems.findIndex(i => i.id === itemId);
    if (index > -1) {
        selectedItems.splice(index, 1);
        updateSelectedItemsDisplay();
        
        // Update visual selection
        document.querySelectorAll('.fuzzy-item').forEach(item => {
            if (item.getAttribute('onclick')?.includes(itemId)) {
                item.classList.remove('selected');
            }
        });
    }
};

// Create loan
window.createLoan = async function() {
    if (!selectedUser) {
        alert('Selecciona un usuario primeiro');
        return;
    }
    if (selectedItems.length === 0) {
        alert('Selecciona polo menos un artigo');
        return;
    }
    
    try {
        const loan = await invoke('create_loan', {
            req: {
                user_id: selectedUser.id,
                item_ids: selectedItems.map(i => i.id),
                start_date: document.getElementById('loanStartDate').value,
                expected_end_date: document.getElementById('loanEndDate').value,
                notes: document.getElementById('loanNotes').value || null
            }
        });
        
        alert('Préstamo creado con éxito!');
        resetLoanForm();
        showView('dashboard');
    } catch (error) {
        alert('Erro ao crear o préstamo: ' + error);
    }
};

window.resetLoanForm = function() {
    selectedUser = null;
    selectedItems = [];
    document.getElementById('selectedUserDisplay').style.display = 'none';
    document.getElementById('selectedItems').innerHTML = '';
    document.querySelectorAll('.fuzzy-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('step1').classList.add('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step2').classList.remove('active', 'completed');
    document.getElementById('step3').classList.remove('active');
    document.getElementById('loanNotes').value = '';
};

// Return loan
window.returnLoan = async function(loanId) {
    if (confirm('Confirmas a devolución deste préstamo?')) {
        try {
            await invoke('return_loan', { id: loanId, condition: null, notes: null });
            alert('Préstamo devolto con éxito!');
            loadLoans();
        } catch (error) {
            alert('Erro ao devolver o préstamo: ' + error);
        }
    }
};

// Modal functions
window.showModal = function(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalOverlay').classList.add('active');
};

window.closeModal = function() {
    document.getElementById('modalOverlay').classList.remove('active');
};

// New user modal
window.showNewUserModal = function() {
    const content = `
        <div class="form-group">
            <label>Nome Completo</label>
            <input type="text" id="newUserName" placeholder="Nome e apelidos">
        </div>
        <div class="form-group">
            <label>DNI</label>
            <input type="text" id="newUserDni" placeholder="12345678A">
        </div>
        <div class="form-group">
            <label>Dirección</label>
            <input type="text" id="newUserAddress" placeholder="Rúa, número, piso...">
        </div>
        <div class="form-group">
            <label>Teléfono</label>
            <input type="tel" id="newUserPhone" placeholder="612 345 678">
        </div>
        <div class="form-group">
            <label>Email</label>
            <input type="email" id="newUserEmail" placeholder="usuario@email.com">
        </div>
        <div class="form-group">
            <label>Notas</label>
            <textarea id="newUserNotes" rows="3" placeholder="Información adicional..."></textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="createUser()">Gardar Usuario</button>
        </div>
    `;
    showModal('Novo Usuario', content);
};

window.createUser = async function() {
    try {
        await invoke('create_user', {
            req: {
                name: document.getElementById('newUserName').value,
                dni: document.getElementById('newUserDni').value,
                address: document.getElementById('newUserAddress').value,
                phone: document.getElementById('newUserPhone').value || null,
                email: document.getElementById('newUserEmail').value || null,
                notes: document.getElementById('newUserNotes').value || null
            }
        });
        closeModal();
        alert('Usuario creado con éxito!');
        loadUsers();
    } catch (error) {
        alert('Erro ao crear usuario: ' + error);
    }
};

// Export to Excel
window.exportToExcel = async function() {
    try {
        const filePath = await save({
            filters: [{ name: 'Excel', extensions: ['xlsx'] }],
            defaultPath: 'SAF_Export.xlsx'
        });
        
        if (filePath) {
            await invoke('export_to_excel', { path: filePath });
            alert('Exportación completada con éxito!');
        }
    } catch (error) {
        alert('Erro ao exportar: ' + error);
    }
};

// Create backup
window.createBackup = async function() {
    try {
        const backupDir = await appDataDir();
        await invoke('create_backup', { backupDir: backupDir + '/backups' });
        alert('Backup creado con éxito!');
        loadBackups();
    } catch (error) {
        alert('Erro ao crear backup: ' + error);
    }
};

// Export functions for views
window.showView = showView;

// Inventory Management Functions
window.showAddItemModal = function() {
    const content = `
        <div style="text-align: center; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Engadir Artigos ao Inventario</h3>
            <p style="color: var(--text-light); margin-bottom: 30px;">Selecciona como queres engadir artigos:</p>
            <div style="display: flex; gap: 20px; justify-content: center;">
                <button class="btn btn-primary btn-lg" onclick="closeModal(); showAddDefaultItemsModal();">
                    <i class="fas fa-list"></i>
                    <div>Lista por Defecto</div>
                    <small style="font-size: 12px; opacity: 0.8;">Engadir artigos predefinidos</small>
                </button>
                <button class="btn btn-secondary btn-lg" onclick="closeModal(); showCreateCustomItemModal();">
                    <i class="fas fa-plus"></i>
                    <div>Artigo Personalizado</div>
                    <small style="font-size: 12px; opacity: 0.8;">Crear un artigo novo</small>
                </button>
            </div>
        </div>
    `;
    showModal('Engadir Artigos', content);
};

window.showAddDefaultItemsModal = async function() {
    try {
        const defaultItems = await invoke('get_default_items');
        
        const content = `
            <div style="display: flex; flex-direction: column; max-height: 70vh;">
                <p style="margin-bottom: 16px; color: var(--text-light); flex-shrink: 0;">
                    Selecciona os artigos e indica a cantidade inicial. 
                    Os artigos seleccionados con cantidade > 0 aparecerán no inventario.
                </p>
                <div class="default-items-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 8px;">
                    ${defaultItems.map((item, index) => `
                        <div class="default-item-option" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; transition: all 0.2s;">
                            <input type="checkbox" id="defaultItem${index}" value="${index}" style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 24px;">${item.icon}</span>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600;">${item.name}</div>
                                <div style="font-size: 12px; color: var(--text-light);">${item.description}</div>
                                <div style="font-size: 11px; color: var(--primary); margin-top: 4px;">Categoría: ${item.category}</div>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
                                <label style="font-size: 12px; color: var(--text-light); white-space: nowrap;">Cantidade:</label>
                                <input type="number" id="defaultItemQty${index}" value="0" min="0" style="width: 70px; text-align: center; padding: 6px;" onfocus="document.getElementById('defaultItem${index}').checked = true">
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding-top: 20px; border-top: 2px solid var(--border); flex-shrink: 0; background: white;">
                    <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                    <button class="btn btn-primary" onclick="addSelectedDefaultItems()">
                        <i class="fas fa-plus"></i>
                        Engadir Seleccionados
                    </button>
                </div>
            </div>
        `;
        showModal('Engadir Artigos Predefinidos', content);
    } catch (error) {
        alert('Erro ao cargar artigos por defecto: ' + error);
    }
};

window.addSelectedDefaultItems = async function() {
    try {
        // Primeiro engadimos todos os artigos á BD (se non existen)
        await invoke('add_default_items');
        
        // Agora actualizamos o stock dos seleccionados
        const defaultItems = await invoke('get_default_items');
        let updatedCount = 0;
        
        for (let i = 0; i < defaultItems.length; i++) {
            const checkbox = document.getElementById(`defaultItem${i}`);
            const qtyInput = document.getElementById(`defaultItemQty${i}`);
            
            if (checkbox && qtyInput) {
                const qty = parseInt(qtyInput.value) || 0;
                if (checkbox.checked && qty > 0) {
                    // Obter o ID do artigo pola súa descrición
                    const items = await invoke('get_items');
                    const item = items.find(it => it.name === defaultItems[i].name);
                    if (item) {
                        await invoke('update_item_stock', { 
                            itemId: item.id, 
                            newTotalStock: qty 
                        });
                        updatedCount++;
                    }
                }
            }
        }
        
        closeModal();
        if (updatedCount > 0) {
            alert(`${updatedCount} artigo(s) engadido(s) con éxito!`);
        } else {
            alert('Artigos engadidos á lista. Lembra indicar unha cantidade maior que 0 para que aparezan no inventario.');
        }
        loadInventory();
    } catch (error) {
        alert('Erro ao engadir artigos: ' + error);
    }
};

window.showCreateCustomItemModal = function() {
    const content = `
        <div class="form-group">
            <label>Nome do Artigo *</label>
            <input type="text" id="customItemName" placeholder="Ex: Cama hospitalaria">
        </div>
        <div class="form-group">
            <label>Descripción</label>
            <input type="text" id="customItemDescription" placeholder="Descrición do artigo...">
        </div>
        <div class="form-group">
            <label>Categoría *</label>
            <select id="customItemCategory">
                <option value="mobility">Mobilidade</option>
                <option value="bathroom">Baño</option>
                <option value="transfer">Transferencia</option>
                <option value="care">Coidados</option>
                <option value="bed">Cama/Descanso</option>
                <option value="respiratory">Respiración</option>
                <option value="feeding">Alimentación</option>
                <option value="dressing">Vestir</option>
                <option value="communication">Comunicación</option>
                <option value="other">Outros</option>
            </select>
        </div>
        <div class="form-group">
            <label>Icona (emoji) *</label>
            <input type="text" id="customItemIcon" placeholder="Ex: 🛏️" value="📦" maxlength="2">
            <small style="color: var(--text-light);">Pega un emoji ou deixa o valor por defecto 📦</small>
        </div>
        <div class="form-group">
            <label>Stock Inicial</label>
            <input type="number" id="customItemStock" value="0" min="0">
        </div>
        <div class="form-group">
            <label>Notas</label>
            <textarea id="customItemNotes" rows="2" placeholder="Notas adicionais..."></textarea>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="createCustomItem()">Crear Artigo</button>
        </div>
    `;
    showModal('Crear Artigo Personalizado', content);
};

window.createCustomItem = async function() {
    try {
        const name = document.getElementById('customItemName').value.trim();
        if (!name) {
            alert('O nome do artigo é obrigatorio');
            return;
        }
        
        await invoke('create_item', {
            req: {
                name: name,
                description: document.getElementById('customItemDescription').value || null,
                category: document.getElementById('customItemCategory').value,
                icon: document.getElementById('customItemIcon').value || '📦',
                total_stock: parseInt(document.getElementById('customItemStock').value) || 0,
                notes: document.getElementById('customItemNotes').value || null
            }
        });
        closeModal();
        alert('Artigo creado con éxito!');
        loadInventory();
    } catch (error) {
        alert('Erro ao crear artigo: ' + error);
    }
};

window.showUpdateStockModal = function(itemId, itemName, currentStock) {
    const content = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h3>${itemName}</h3>
        </div>
        <div class="form-group">
            <label>Stock Total Actual: <strong>${currentStock}</strong></label>
            <input type="number" id="newStockValue" value="${currentStock}" min="0" style="font-size: 18px; text-align: center;">
            <small style="color: var(--text-light);">Introduce o novo stock total. O stock dispoñible actualizarase automaticamente.</small>
        </div>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="updateItemStock('${itemId}')">Actualizar Stock</button>
        </div>
    `;
    showModal('Actualizar Stock', content);
};

window.updateItemStock = async function(itemId) {
    try {
        const newStock = parseInt(document.getElementById('newStockValue').value);
        if (isNaN(newStock) || newStock < 0) {
            alert('O stock debe ser un número positivo');
            return;
        }
        
        await invoke('update_item_stock', { itemId, newTotalStock: newStock });
        closeModal();
        alert('Stock actualizado con éxito!');
        loadInventory();
    } catch (error) {
        alert('Erro ao actualizar stock: ' + error);
    }
};

// Export to Excel with type selection
window.exportReport = async function(type) {
    try {
        const filePath = await save({
            filters: [{ name: 'Excel', extensions: ['xlsx'] }],
            defaultPath: `SAF_${type}_${new Date().toISOString().split('T')[0]}.xlsx`
        });
        
        if (filePath) {
            await invoke('export_to_excel', { path: filePath });
            alert('Exportación completada con éxito!');
        }
    } catch (error) {
        alert('Erro ao exportar: ' + error);
    }
};

// Edit User Functions
window.showEditUserModal = async function(userId) {
    try {
        // Obter datos do usuario
        const users = await invoke('get_users');
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            alert('Usuario non atopado');
            return;
        }
        
        const content = `
            <div class="form-group">
                <label>Nome Completo *</label>
                <input type="text" id="editUserName" value="${user.name}" placeholder="Nome e apelidos">
            </div>
            <div class="form-group">
                <label>DNI *</label>
                <input type="text" id="editUserDni" value="${user.dni}" placeholder="12345678A">
            </div>
            <div class="form-group">
                <label>Dirección *</label>
                <input type="text" id="editUserAddress" value="${user.address}" placeholder="Rúa, número, piso...">
            </div>
            <div class="form-group">
                <label>Teléfono</label>
                <input type="tel" id="editUserPhone" value="${user.phone || ''}" placeholder="612 345 678">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" id="editUserEmail" value="${user.email || ''}" placeholder="usuario@email.com">
            </div>
            <div class="form-group">
                <label>Notas</label>
                <textarea id="editUserNotes" rows="3" placeholder="Información adicional...">${user.notes || ''}</textarea>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="updateUser('${userId}')">Gardar Cambios</button>
            </div>
        `;
        showModal('Editar Usuario', content);
    } catch (error) {
        alert('Erro ao cargar datos do usuario: ' + error);
    }
};

window.updateUser = async function(userId) {
    try {
        const name = document.getElementById('editUserName').value.trim();
        const dni = document.getElementById('editUserDni').value.trim();
        const address = document.getElementById('editUserAddress').value.trim();
        
        if (!name || !dni || !address) {
            alert('Nome, DNI e Dirección son obrigatorios');
            return;
        }
        
        await invoke('update_user', {
            id: userId,
            req: {
                name: name,
                dni: dni,
                address: address,
                phone: document.getElementById('editUserPhone').value || null,
                email: document.getElementById('editUserEmail').value || null,
                notes: document.getElementById('editUserNotes').value || null
            }
        });
        closeModal();
        alert('Usuario actualizado con éxito!');
        loadUsers();
    } catch (error) {
        alert('Erro ao actualizar usuario: ' + error);
    }
};