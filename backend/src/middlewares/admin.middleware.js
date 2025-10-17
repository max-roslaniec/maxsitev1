// src/middlewares/admin.middleware.js

const isAdmin = (req, res, next) => {
    // Usamos o req.user que foi definido pelo middleware 'protect'
    
    // ===== CORREÇÃO DEFINITIVA AQUI =====
    // Usamos a comparação frouxa (==) exatamente como no seu site original.
    // Isso compara "100" == 100 e retorna verdadeiro.
    if (req.user && req.user.authority == 100) {
        next(); // Permissão concedida.
    } else {
        res.status(403).json({ message: 'Acesso negado. Requer privilégios de administrador.' });
    }
};

const isLocalhost = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (ip === '::1' || ip === '127.0.0.1') {
        next();
    } else {
        res.status(403).json({ message: 'Acesso negado. Este recurso só pode ser acessado localmente.' });
    }
}

module.exports = { isAdmin, isLocalhost };