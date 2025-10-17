// src/config/database.js
const mysql = require('mysql2/promise');

// Cria um pool de conexões. Em vez de abrir e fechar uma conexão a cada query,
// nós pegamos uma emprestada do pool, o que é muito mais rápido.
const pool = mysql.createPool({
    host: '127.0.0.1', // IP direto para evitar problemas de socket
    user: 'root',
    password: '',      // Sua senha, se houver
    database: 'gunbound',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('✅ Pool de conexões com o MySQL criado com sucesso!');

module.exports = pool;