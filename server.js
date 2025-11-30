const express = require('express');
const mysql = require('mysql2/promise');
const { Client: PgClient } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
    secret: 'sql-tester-secret-key-' + Date.now(),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Store active connections in session
const connections = new Map();

// Helper function to get connection from session
function getConnection(sessionId) {
    return connections.get(sessionId);
}

// Helper function to save connection to session
function saveConnection(sessionId, connection) {
    connections.set(sessionId, connection);
}

// Helper function to close connection
async function closeConnection(sessionId) {
    const conn = connections.get(sessionId);
    if (conn) {
        try {
            if (conn.type === 'mysql' || conn.type === 'mariadb') {
                await conn.connection.end();
            } else if (conn.type === 'postgresql') {
                await conn.connection.end();
            } else if (conn.type === 'sqlite') {
                conn.connection.close();
            }
        } catch (error) {
            console.error('Error closing connection:', error);
        }
        connections.delete(sessionId);
    }
}

// Test database connection
app.post('/api/test-connection', async (req, res) => {
    const { type, host, port, username, password, database } = req.body;

    try {
        let connection;
        let testResult = { success: false, message: '', info: {} };

        if (type === 'mysql' || type === 'mariadb') {
            connection = await mysql.createConnection({
                host: host || 'localhost',
                port: port || 3306,
                user: username,
                password: password,
                database: database || undefined
            });

            const [rows] = await connection.query('SELECT VERSION() as version');
            testResult = {
                success: true,
                message: 'Connection successful!',
                info: {
                    version: rows[0].version,
                    type: type
                }
            };

            // Close test connection and create new one for session
            await connection.end();
            connection = await mysql.createConnection({
                host: host || 'localhost',
                port: port || 3306,
                user: username,
                password: password,
                database: database || undefined
            });

        } else if (type === 'postgresql') {
            connection = new PgClient({
                host: host || 'localhost',
                port: port || 5432,
                user: username,
                password: password,
                database: database || 'postgres'
            });

            await connection.connect();
            const result = await connection.query('SELECT version()');
            testResult = {
                success: true,
                message: 'Connection successful!',
                info: {
                    version: result.rows[0].version,
                    type: type
                }
            };

        } else if (type === 'sqlite') {
            const dbPath = database || ':memory:';
            connection = new sqlite3.Database(dbPath, (err) => {
                if (err) throw err;
            });

            testResult = {
                success: true,
                message: 'Connection successful!',
                info: {
                    database: dbPath,
                    type: type
                }
            };
        } else {
            return res.status(400).json({ success: false, message: 'Unsupported database type' });
        }

        // Close any existing connection for this session
        await closeConnection(req.sessionID);

        // Save new connection
        saveConnection(req.sessionID, {
            type,
            connection,
            config: { host, port, username, database }
        });

        res.json(testResult);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Connection failed: ' + error.message
        });
    }
});

// List databases
app.get('/api/databases', async (req, res) => {
    const conn = getConnection(req.sessionID);

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    try {
        let databases = [];

        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            const [rows] = await conn.connection.query('SHOW DATABASES');
            databases = rows.map(row => row.Database);

        } else if (conn.type === 'postgresql') {
            const result = await conn.connection.query(
                "SELECT datname FROM pg_database WHERE datistemplate = false"
            );
            databases = result.rows.map(row => row.datname);

        } else if (conn.type === 'sqlite') {
            databases = [conn.config.database || ':memory:'];
        }

        res.json({ success: true, databases });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create database
app.post('/api/databases', async (req, res) => {
    const conn = getConnection(req.sessionID);
    const { name } = req.body;

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid database name. Use only letters, numbers, and underscores.'
        });
    }

    try {
        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            await conn.connection.query(`CREATE DATABASE \`${name}\``);
        } else if (conn.type === 'postgresql') {
            await conn.connection.query(`CREATE DATABASE "${name}"`);
        } else if (conn.type === 'sqlite') {
            return res.status(400).json({
                success: false,
                message: 'SQLite does not support CREATE DATABASE. Use a file path instead.'
            });
        }

        res.json({ success: true, message: `Database '${name}' created successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete database
app.delete('/api/databases/:name', async (req, res) => {
    const conn = getConnection(req.sessionID);
    const { name } = req.params;

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid database name'
        });
    }

    try {
        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            await conn.connection.query(`DROP DATABASE \`${name}\``);
        } else if (conn.type === 'postgresql') {
            await conn.connection.query(`DROP DATABASE "${name}"`);
        } else if (conn.type === 'sqlite') {
            return res.status(400).json({
                success: false,
                message: 'SQLite does not support DROP DATABASE'
            });
        }

        res.json({ success: true, message: `Database '${name}' deleted successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// List users
app.get('/api/users', async (req, res) => {
    const conn = getConnection(req.sessionID);

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    try {
        let users = [];

        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            const [rows] = await conn.connection.query('SELECT User, Host FROM mysql.user');
            users = rows.map(row => ({ user: row.User, host: row.Host }));

        } else if (conn.type === 'postgresql') {
            const result = await conn.connection.query('SELECT usename FROM pg_user');
            users = result.rows.map(row => ({ user: row.usename, host: 'N/A' }));

        } else if (conn.type === 'sqlite') {
            return res.status(400).json({
                success: false,
                message: 'SQLite does not have a user management system'
            });
        }

        res.json({ success: true, users });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create user
app.post('/api/users', async (req, res) => {
    const conn = getConnection(req.sessionID);
    const { username, password, host } = req.body;

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid username. Use only letters, numbers, and underscores.'
        });
    }

    try {
        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            const userHost = host || '%';
            await conn.connection.query(
                `CREATE USER '${username}'@'${userHost}' IDENTIFIED BY '${password}'`
            );
        } else if (conn.type === 'postgresql') {
            await conn.connection.query(
                `CREATE USER "${username}" WITH PASSWORD '${password}'`
            );
        } else if (conn.type === 'sqlite') {
            return res.status(400).json({
                success: false,
                message: 'SQLite does not support user management'
            });
        }

        res.json({ success: true, message: `User '${username}' created successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete user
app.delete('/api/users/:username', async (req, res) => {
    const conn = getConnection(req.sessionID);
    const { username } = req.params;
    const { host } = req.query;

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    if (!username || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid username'
        });
    }

    try {
        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            const userHost = host || '%';
            await conn.connection.query(`DROP USER '${username}'@'${userHost}'`);
        } else if (conn.type === 'postgresql') {
            await conn.connection.query(`DROP USER "${username}"`);
        } else if (conn.type === 'sqlite') {
            return res.status(400).json({
                success: false,
                message: 'SQLite does not support user management'
            });
        }

        res.json({ success: true, message: `User '${username}' deleted successfully` });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Execute custom query
app.post('/api/query', async (req, res) => {
    const conn = getConnection(req.sessionID);
    const { query } = req.body;

    if (!conn) {
        return res.status(400).json({ success: false, message: 'No active connection' });
    }

    if (!query || query.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Query cannot be empty' });
    }

    try {
        let result;

        if (conn.type === 'mysql' || conn.type === 'mariadb') {
            const [rows, fields] = await conn.connection.query(query);
            result = {
                success: true,
                rows: Array.isArray(rows) ? rows : [rows],
                rowCount: Array.isArray(rows) ? rows.length : 1,
                fields: fields ? fields.map(f => f.name) : []
            };

        } else if (conn.type === 'postgresql') {
            const pgResult = await conn.connection.query(query);
            result = {
                success: true,
                rows: pgResult.rows,
                rowCount: pgResult.rowCount,
                fields: pgResult.fields ? pgResult.fields.map(f => f.name) : []
            };

        } else if (conn.type === 'sqlite') {
            result = await new Promise((resolve, reject) => {
                conn.connection.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve({
                        success: true,
                        rows: rows || [],
                        rowCount: rows ? rows.length : 0,
                        fields: rows && rows.length > 0 ? Object.keys(rows[0]) : []
                    });
                });
            });
        }

        res.json(result);

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Disconnect
app.post('/api/disconnect', async (req, res) => {
    await closeConnection(req.sessionID);
    res.json({ success: true, message: 'Disconnected successfully' });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 SQL Database Tester Server Running!`);
    console.log(`📍 Open your browser to: http://localhost:${PORT}`);
    console.log(`\n✨ Supported databases: MySQL, MariaDB, PostgreSQL, SQLite\n`);
});

// Cleanup on exit
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Shutting down server...');
    for (const [sessionId] of connections) {
        await closeConnection(sessionId);
    }
    process.exit(0);
});
