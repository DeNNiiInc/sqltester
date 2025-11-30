// API Base URL
const API_BASE = 'http://localhost:3000/api';

// State
let isConnected = false;
let currentDbType = 'mysql';

// DOM Elements
const connectionForm = document.getElementById('connectionForm');
const dbTypeSelect = document.getElementById('dbType');
const hostInput = document.getElementById('host');
const portInput = document.getElementById('port');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const databaseInput = document.getElementById('database');
const disconnectBtn = document.getElementById('disconnectBtn');
const connectionStatus = document.getElementById('connectionStatus');
const connectionInfo = document.getElementById('connectionInfo');

const queryInput = document.getElementById('queryInput');
const executeBtn = document.getElementById('executeBtn');
const queryResults = document.getElementById('queryResults');

const databaseList = document.getElementById('databaseList');
const refreshDbBtn = document.getElementById('refreshDbBtn');
const newDbName = document.getElementById('newDbName');
const createDbBtn = document.getElementById('createDbBtn');

const userList = document.getElementById('userList');
const refreshUserBtn = document.getElementById('refreshUserBtn');
const newUsername = document.getElementById('newUsername');
const newUserPassword = document.getElementById('newUserPassword');
const newUserHost = document.getElementById('newUserHost');
const createUserBtn = document.getElementById('createUserBtn');
const userHostGroup = document.getElementById('userHostGroup');

const networkFields = document.getElementById('networkFields');
const credentialFields = document.getElementById('credentialFields');

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update connection status
function updateConnectionStatus(connected, info = null) {
    isConnected = connected;

    if (connected) {
        connectionStatus.classList.add('connected');
        connectionStatus.querySelector('.status-text').textContent = 'Connected';

        if (info) {
            connectionInfo.style.display = 'block';
            connectionInfo.className = 'info-box success';
            connectionInfo.innerHTML = `
                <strong>✅ ${info.message}</strong><br>
                <small>Type: ${info.info.type} | Version: ${info.info.version || info.info.database}</small>
            `;
        }

        // Enable controls
        disconnectBtn.disabled = false;
        queryInput.disabled = false;
        executeBtn.disabled = false;
        refreshDbBtn.disabled = false;
        newDbName.disabled = false;
        createDbBtn.disabled = false;
        refreshUserBtn.disabled = false;
        newUsername.disabled = false;
        newUserPassword.disabled = false;
        newUserHost.disabled = false;
        createUserBtn.disabled = false;

        // Load initial data
        loadDatabases();
        loadUsers();

    } else {
        connectionStatus.classList.remove('connected');
        connectionStatus.querySelector('.status-text').textContent = 'Not Connected';
        connectionInfo.style.display = 'none';

        // Disable controls
        disconnectBtn.disabled = true;
        queryInput.disabled = true;
        executeBtn.disabled = true;
        refreshDbBtn.disabled = true;
        newDbName.disabled = true;
        createDbBtn.disabled = true;
        refreshUserBtn.disabled = true;
        newUsername.disabled = true;
        newUserPassword.disabled = true;
        newUserHost.disabled = true;
        createUserBtn.disabled = true;

        // Clear lists
        databaseList.innerHTML = '<p class="placeholder">Connect to a database to view databases</p>';
        userList.innerHTML = '<p class="placeholder">Connect to a database to view users</p>';
        queryResults.innerHTML = '';
    }
}

// Handle database type change
dbTypeSelect.addEventListener('change', (e) => {
    currentDbType = e.target.value;

    if (currentDbType === 'sqlite') {
        networkFields.style.display = 'none';
        credentialFields.style.display = 'none';
        databaseInput.placeholder = 'Path to SQLite database file (or :memory:)';
        userHostGroup.style.display = 'none';
    } else {
        networkFields.style.display = 'grid';
        credentialFields.style.display = 'grid';
        databaseInput.placeholder = 'Leave empty to connect without selecting a database';
        userHostGroup.style.display = currentDbType === 'postgresql' ? 'none' : 'block';

        // Update default ports
        if (currentDbType === 'postgresql') {
            portInput.value = '5432';
        } else {
            portInput.value = '3306';
        }
    }
});

// Test connection
connectionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        type: currentDbType,
        host: hostInput.value,
        port: parseInt(portInput.value),
        username: usernameInput.value,
        password: passwordInput.value,
        database: databaseInput.value
    };

    try {
        const response = await fetch(`${API_BASE}/test-connection`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            updateConnectionStatus(true, result);
            showToast('Connection successful!', 'success');
        } else {
            updateConnectionStatus(false);
            showToast(result.message, 'error');
            connectionInfo.style.display = 'block';
            connectionInfo.className = 'info-box error';
            connectionInfo.innerHTML = `<strong>❌ ${result.message}</strong>`;
        }
    } catch (error) {
        updateConnectionStatus(false);
        showToast('Failed to connect to server', 'error');
        connectionInfo.style.display = 'block';
        connectionInfo.className = 'info-box error';
        connectionInfo.innerHTML = `<strong>❌ Server Error:</strong> ${error.message}`;
    }
});

// Disconnect
disconnectBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/disconnect`, {
            method: 'POST',
            credentials: 'include'
        });
        updateConnectionStatus(false);
        showToast('Disconnected successfully', 'success');
    } catch (error) {
        showToast('Error disconnecting', 'error');
    }
});

// Load databases
async function loadDatabases() {
    try {
        const response = await fetch(`${API_BASE}/databases`, {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
            if (result.databases.length === 0) {
                databaseList.innerHTML = '<p class="placeholder">No databases found</p>';
            } else {
                databaseList.innerHTML = result.databases.map(db => `
                    <div class="list-item">
                        <span class="list-item-name">📊 ${db}</span>
                        <button class="btn btn-danger btn-sm" onclick="deleteDatabase('${db}')">
                            <span class="btn-icon">🗑️</span>
                            Delete
                        </button>
                    </div>
                `).join('');
            }
        } else {
            databaseList.innerHTML = `<p class="placeholder">${result.message}</p>`;
        }
    } catch (error) {
        showToast('Error loading databases', 'error');
    }
}

// Create database
createDbBtn.addEventListener('click', async () => {
    const name = newDbName.value.trim();

    if (!name) {
        showToast('Please enter a database name', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/databases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            newDbName.value = '';
            loadDatabases();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error creating database', 'error');
    }
});

// Delete database
async function deleteDatabase(name) {
    if (!confirm(`Are you sure you want to delete database "${name}"? This action cannot be undone!`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/databases/${name}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadDatabases();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error deleting database', 'error');
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            credentials: 'include'
        });
        const result = await response.json();

        if (result.success) {
            if (result.users.length === 0) {
                userList.innerHTML = '<p class="placeholder">No users found</p>';
            } else {
                userList.innerHTML = result.users.map(user => `
                    <div class="list-item">
                        <div>
                            <div class="list-item-name">👤 ${user.user}</div>
                            <div class="list-item-info">Host: ${user.host}</div>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.user}', '${user.host}')">
                            <span class="btn-icon">🗑️</span>
                            Delete
                        </button>
                    </div>
                `).join('');
            }
        } else {
            userList.innerHTML = `<p class="placeholder">${result.message}</p>`;
        }
    } catch (error) {
        showToast('Error loading users', 'error');
    }
}

// Create user
createUserBtn.addEventListener('click', async () => {
    const username = newUsername.value.trim();
    const password = newUserPassword.value;
    const host = newUserHost.value.trim();

    if (!username || !password) {
        showToast('Please enter username and password', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, host }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            newUsername.value = '';
            newUserPassword.value = '';
            newUserHost.value = '%';
            loadUsers();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error creating user', 'error');
    }
});

// Delete user
async function deleteUser(username, host) {
    if (!confirm(`Are you sure you want to delete user "${username}"@"${host}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${username}?host=${encodeURIComponent(host)}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            loadUsers();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        showToast('Error deleting user', 'error');
    }
}

// Execute query
executeBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();

    if (!query) {
        showToast('Please enter a query', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            displayQueryResults(result);
            showToast(`Query executed successfully (${result.rowCount} rows)`, 'success');
        } else {
            queryResults.innerHTML = `
                <div class="info-box error">
                    <strong>❌ Query Error:</strong><br>
                    ${result.message}
                </div>
            `;
            showToast('Query failed', 'error');
        }
    } catch (error) {
        showToast('Error executing query', 'error');
    }
});

// Display query results
function displayQueryResults(result) {
    if (result.rows.length === 0) {
        queryResults.innerHTML = '<div class="info-box">Query executed successfully. No rows returned.</div>';
        return;
    }

    const fields = result.fields.length > 0 ? result.fields : Object.keys(result.rows[0]);

    const table = `
        <table class="results-table">
            <thead>
                <tr>
                    ${fields.map(field => `<th>${field}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${result.rows.map(row => `
                    <tr>
                        ${fields.map(field => `<td>${row[field] !== null ? row[field] : '<em>NULL</em>'}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    queryResults.innerHTML = table;
}

// Refresh buttons
refreshDbBtn.addEventListener('click', loadDatabases);
refreshUserBtn.addEventListener('click', loadUsers);

// Initialize
updateConnectionStatus(false);
