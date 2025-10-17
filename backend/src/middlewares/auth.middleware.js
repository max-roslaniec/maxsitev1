// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Verifica se o token está no cabeçalho 'Authorization'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extrai o token do cabeçalho (formato: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verifica se o token é válido usando a nossa chave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Anexa os dados do usuário decodificados ao objeto 'req'
            // Assim, todas as rotas protegidas saberão quem fez a requisição
            req.user = decoded;

            // Libera o acesso para a próxima etapa (o controller)
            next();
        } catch (error) {
            console.error('Erro de autenticação:', error);
            res.status(401).json({ message: 'Não autorizado, token falhou.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token encontrado.' });
    }
};

module.exports = { protect };