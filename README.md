# SQL Database Tester

A comprehensive web-based tool for testing connections to MySQL, MariaDB, PostgreSQL, and SQLite databases, with full database and user management capabilities.

![SQL Database Tester](https://img.shields.io/badge/Database-MySQL%20%7C%20MariaDB%20%7C%20PostgreSQL%20%7C%20SQLite-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14%2B-green)
![License](https://img.shields.io/badge/License-GNU%20GPL-blue)

## ✨ Features

- 🔌 **Multi-Database Support**: Connect to MySQL, MariaDB, PostgreSQL, and SQLite
- 🧪 **Connection Testing**: Verify database connections with detailed feedback
- 💾 **Database Management**: List, create, and delete databases
- 👥 **User Management**: List, create, and delete database users
- ⚡ **Query Executor**: Run custom SQL queries with formatted results
- 🎨 **Modern UI**: Beautiful dark mode interface with glassmorphism effects
- 🔒 **Secure**: Server-side credential handling, no browser storage

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Access to a database server (MySQL, MariaDB, PostgreSQL, or SQLite)

### Setup

1. **Navigate to the project directory**:
   ```bash
   cd ".\SQL-Tester"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Connecting to a Database

1. **Select Database Type**: Choose from MySQL, MariaDB, PostgreSQL, or SQLite
2. **Enter Connection Details**:
   - **Host**: Database server address (e.g., localhost)
   - **Port**: Database port (default: 3306 for MySQL/MariaDB, 5432 for PostgreSQL)
   - **Username**: Database username
   - **Password**: Database password
   - **Database**: (Optional) Specific database to connect to
3. **Click "Test Connection"**: Verify your connection

### Database Management

- **List Databases**: View all databases on the connected server
- **Create Database**: Enter a name and click "Create"
- **Delete Database**: Click the delete button next to any database (⚠️ permanent action)

### User Management

- **List Users**: View all database users
- **Create User**: Enter username, password, and host (% for all hosts)
- **Delete User**: Remove a user from the database server

### Query Execution

1. Enter your SQL query in the text area
2. Click "Execute Query"
3. View formatted results in the table below

**Example Queries**:
```sql
-- Show all tables
SHOW TABLES;

-- Select data
SELECT * FROM users LIMIT 10;

-- Create a table
CREATE TABLE test (id INT PRIMARY KEY, name VARCHAR(100));

-- Insert data
INSERT INTO test VALUES (1, 'Test User');
```

## 🗄️ Supported Databases

### MySQL / MariaDB
- Full support for all operations
- Default port: 3306
- User management with host-based permissions

### PostgreSQL
- Full support for all operations
- Default port: 5432
- User management without host specification

### SQLite
- Connection testing and query execution
- File-based or in-memory databases
- Limited user management (SQLite doesn't have built-in user system)
- Database creation/deletion not supported (use file system instead)

## 🔒 Security Best Practices

- ✅ **Never expose this tool to the public internet** - it's designed for local/internal use
- ✅ **Use strong passwords** for database users
- ✅ **Limit database user privileges** - don't use root/admin accounts unless necessary
- ✅ **Use SSL/TLS connections** in production environments
- ✅ **Regularly update dependencies** to patch security vulnerabilities
- ⚠️ **Be cautious with DELETE operations** - they cannot be undone

## 🛠️ Troubleshooting

### Connection Failed

- **Check credentials**: Ensure username and password are correct
- **Verify host/port**: Confirm the database server is running and accessible
- **Check firewall**: Ensure the database port is not blocked
- **Database permissions**: Verify the user has necessary privileges

### "Cannot connect to server" Error

- Ensure the Node.js server is running (`npm start`)
- Check that port 3000 is not in use by another application
- Verify your browser can access `http://localhost:3000`

### SQLite Errors

- For file-based databases, ensure the path is correct and accessible
- Use `:memory:` for in-memory databases (data lost on disconnect)

## 📝 Technical Details

### Backend
- **Framework**: Express.js
- **Database Drivers**:
  - `mysql2` - MySQL/MariaDB
  - `pg` - PostgreSQL
  - `sqlite3` - SQLite
- **Session Management**: express-session

### Frontend
- **HTML5** with semantic markup
- **CSS3** with custom properties and animations
- **Vanilla JavaScript** (no frameworks)
- **Responsive Design** for all screen sizes

## 📄 License

GPL - feel free to use this tool for personal or commercial projects.

## 👨‍💻 Author

**Beyond Cloud Technology**

Built with ❤️ for database administrators and developers.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**⚠️ Important**: Always use secure connections in production environments and never store sensitive credentials in your code.






