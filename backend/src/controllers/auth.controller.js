// backend/src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        console.log('[DEBUG-CONTROLLER] req.body:', JSON.stringify(req.body)); // NOVO LOG
        const { id, gamePassword, sitePassword, nickname, gender, email } = req.body;
        if (!id || !gamePassword || !sitePassword || !nickname || gender === undefined || !email) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        if (id.length > 16) {
            return res.status(400).json({ message: 'O ID de Login deve ter no máximo 16 caracteres.' });
        }
        if (!/^[a-zA-Z0-9]+$/.test(id)) {
            return res.status(400).json({ message: 'O ID de Login deve conter apenas letras e números.' });
        }
        if (nickname.length > 16) {
            return res.status(400).json({ message: 'O Nickname deve ter no máximo 16 caracteres.' });
        }
        const newUser = await authService.registerUser(req.body);
        res.status(201).json({ message: 'Usuário registrado com sucesso!', user: { id: newUser.Id, nickname: newUser.NickName } });
    } catch (error) {
        if (error.message.includes('já está em uso')) {
            return res.status(409).json({ message: error.message });
        }
        console.error('Erro no registro:', error);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { id, password } = req.body;
        if (!id || !password) {
            return res.status(400).json({ message: 'ID e senha são obrigatórios.' });
        }
        const userData = await authService.loginUser(req.body);
        const payload = {
            id: userData.id,
            nickname: userData.nickname,
            authority: userData.authority,
        };
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });
        res.status(200).json({ 
            message: 'Login bem-sucedido!', 
            user: payload,
            accessToken: accessToken,
            refreshToken: userData.refreshToken
        });
    } catch (error) {
        if (error.message.includes('não encontrado') || error.message.includes('incorreta')) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
};

// --- NOVA FUNÇÃO PARA RENOVAR O ACCESS TOKEN ---
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token não fornecido.' });
        }

        // O serviço valida orefreshToken e retorna os dados do usuário
        const userData = await authService.refreshAccessToken(refreshToken);

        // Se for válido, criamos um novo accessToken de 15 minutos
        const payload = {
            id: userData.Id,
            nickname: userData.NickName,
            authority: userData.Authority,
        };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '15m',
        });

        res.status(200).json({ 
            message: 'Token de acesso renovado com sucesso!',
            accessToken: newAccessToken,
            user: payload
        });

    } catch (error) {
        res.status(error.status || 403).json({ message: error.message || 'Falha na renovação do token.' });
    }
};

// --- NOVA FUNÇÃO PARA LOGOUT ---
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token não fornecido.' });
        }
        await authService.logoutUser(refreshToken);
        res.status(200).json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao realizar o logout.' });
    }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'O e-mail é obrigatório.' });
    }
    await authService.forgotPassword(email);
    // Por segurança, sempre enviamos uma resposta de sucesso para não revelar se um e-mail existe ou não no sistema.
    res.status(200).json({ message: 'Se um usuário com este e-mail existir, um link de redefinição de senha foi enviado.' });
  } catch (error) {
    // Log do erro no servidor
    console.error('Erro no controlador forgotPassword:', error);
    // Não vazar detalhes do erro para o cliente
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar processar a solicitação.' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'O token e a nova senha são obrigatórios.' });
    }
    
    // Captura o IP do usuário para o log de auditoria
    const ipAddress = req.ip;

    await authService.resetPassword(token, newPassword, ipAddress);
    res.status(200).json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    console.error('Erro no controlador resetPassword:', error);
    // Envia uma resposta de erro mais específica se for um erro conhecido (ex: token inválido)
    if (error.message === 'Token inválido ou expirado.') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar redefinir a senha.' });
  }
};
