// backend/src/services/auth.service.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mailService = require('./mail.service'); // Importando o novo serviço de e-mail
const saltRounds = 10;

function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < 8) {
        throw new Error('A senha do site deve ter no mínimo 8 caracteres.');
    }
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
        throw new Error('A senha do site deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.');
    }
}

exports.registerUser = async (userData) => {
    const { id, gamePassword, sitePassword, nickname, gender, email } = userData;
    const genderValue = parseInt(gender, 10);
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [existingUsers] = await pool.execute(
            'SELECT Id FROM user WHERE Id = ? OR NickName = ?',
            [id, nickname]
        );
        if (existingUsers.length > 0) {
            throw new Error('ID de usuário ou Nickname já está em uso.');
        }

        const hashedPassword = await bcrypt.hash(sitePassword, saltRounds);

        await connection.execute(
            `INSERT INTO user 
              (Id, user, NickName, password_hash, Password, Status, Authority, E_Mail, Gender, Country, User_Level, Authority2) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [id, id, nickname, hashedPassword, gamePassword, 1, 1, email, genderValue, '28', 1, 1]
        );

        await connection.execute(
            `INSERT INTO gunwcuser 
              (Id, user, NickName, Password, Gender, Status, Authority, Authority2, User_Level, Country, AuthorityBackup, E_Mail) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [id, id, nickname, gamePassword, genderValue, 1, 1, 1, 1, '28', 1, email]
        );

        await connection.execute(
            'INSERT INTO cash (ID, Cash) VALUES (?, ?)',
            [id, 999999]
        );

        const [rankRows] = await connection.execute('SELECT TotalRank FROM `game` ORDER BY `TotalRank` DESC LIMIT 1');
        const newRank = rankRows.length > 0 ? rankRows[0].TotalRank + 1 : 1;

        await connection.execute(
            `INSERT INTO game 
              (Id, NickName, TotalRank, SeasonRank, Money, TotalScore, TotalGrade, SeasonGrade, Country, CountryGrade, CountryRank) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [id, nickname, newRank, newRank, 10000, 0, 19, 19, '28', 19, newRank]
        );
        
        await connection.commit();
        return { Id: id, NickName: nickname };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.loginUser = async (credentials) => {
    const { id, password } = credentials;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute(
          `SELECT Id, NickName, password_hash, Password, IFNULL(Authority, 1) as Authority 
           FROM user WHERE Id = ? FOR UPDATE`,
          [id]
        );

        if (rows.length === 0) {
            throw new Error('Usuário não encontrado.');
        }

        const user = rows[0];
        let isMatch = false;

        if (user.password_hash) {
            isMatch = await bcrypt.compare(password, user.password_hash.toString());
        } else {
            isMatch = (password === user.Password);
            if (isMatch) {
                const newHashedPassword = await bcrypt.hash(password, saltRounds);
                await connection.execute(
                    'UPDATE user SET password_hash = ? WHERE Id = ?',
                    [newHashedPassword, user.Id]
                );
            }
        }

        if (!isMatch) {
            throw new Error('Senha incorreta.');
        }
        
        const refreshToken = await generateAndStoreRefreshToken(user.Id, connection);

        await connection.commit();

        return {
            id: user.Id,
            nickname: user.NickName,
            authority: user.Authority,
            refreshToken: refreshToken,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.refreshAccessToken = async (token) => {
    const connection = await pool.getConnection();
    try {
        const [tokenRows] = await connection.execute(
            'SELECT * FROM refresh_tokens WHERE token = ?',
            [token]
        );

        if (tokenRows.length === 0) {
            throw { status: 403, message: 'Sessão inválida. Por favor, faça o login novamente.' };
        }

        const storedToken = tokenRows[0];
        if (new Date() > new Date(storedToken.expires_at)) {
            // Se o token expirou, remove-o do banco
            await connection.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
            throw { status: 403, message: 'Sua sessão expirou. Por favor, faça o login novamente.' };
        }

        const [userRows] = await connection.execute(
            'SELECT Id, NickName, Authority FROM user WHERE Id = ?',
            [storedToken.user_id]
        );

        if (userRows.length === 0) {
            throw { status: 404, message: 'Usuário associado à sessão não encontrado.' };
        }

        return userRows[0];

    } catch (error) {
        // Garante que tokens inválidos sejam sempre removidos
        if (error.status !== 403) { // 403 já lida com a remoção de tokens expirados
             await connection.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
        }
        throw error;
    } finally {
        connection.release();
    }
};

exports.logoutUser = async (token) => {
    await pool.execute('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    return { success: true, message: 'Logout bem-sucedido.' };
};

/**
 * Inicia o processo de redefinição de senha para um usuário.
 * @param {string} email O e-mail do usuário.
 */
exports.forgotPassword = async (email) => {
  const connection = await pool.getConnection();
  try {
    const [users] = await connection.execute('SELECT Id, E_Mail FROM user WHERE E_Mail = ?', [email]);

    // Se o usuário existir, inicie o processo.
    if (users.length > 0) {
      const user = users[0];
      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Token válido por 15 minutos

      // Remove tokens antigos para este usuário antes de inserir um novo
      await connection.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.Id]);

      // Insere o novo token
      await connection.execute(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.Id, hashedToken, expiresAt]
      );

      // Envia o e-mail com o token NÃO hasheado
      await mailService.sendPasswordResetEmail(user.E_Mail, token);
    }
    // Se o usuário não for encontrado, a função simplesmente termina.
    // Isso evita que um atacante descubra quais e-mails estão cadastrados.

  } catch (error) {
    console.error('Erro no serviço forgotPassword:', error);
    // Lança o erro para ser tratado pelo controlador
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Reseta a senha do usuário usando um token válido.
 * @param {string} token O token recebido do cliente.
 * @param {string} newPassword A nova senha.
 * @param {string} ipAddress O endereço de IP do cliente.
 */
exports.resetPassword = async (token, newPassword, ipAddress) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [tokens] = await connection.execute(
      'SELECT * FROM password_reset_tokens WHERE token = ?',
      [hashedToken]
    );

    if (tokens.length === 0) {
      throw new Error('Token inválido ou expirado.');
    }

    const storedToken = tokens[0];

    if (new Date() > new Date(storedToken.expires_at)) {
      // Limpa o token expirado do banco
      await connection.execute('DELETE FROM password_reset_tokens WHERE id = ?', [storedToken.id]);
      await connection.commit(); // Comita a remoção do token expirado
      throw new Error('Token inválido ou expirado.');
    }

    // Valida a força da nova senha
    validatePassword(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualiza a senha na tabela de usuários
    await connection.execute(
      'UPDATE user SET password_hash = ? WHERE Id = ?',
      [hashedPassword, storedToken.user_id]
    );

    // Insere um registro no log de alteração de senha
    await connection.execute(
      'INSERT INTO password_change_logs (user_id, ip_address, change_source) VALUES (?, ?, ?)',
      [storedToken.user_id, ipAddress, 'password_reset']
    );

    // Remove o token que acabou de ser usado
    await connection.execute('DELETE FROM password_reset_tokens WHERE id = ?', [storedToken.id]);

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('Erro no serviço resetPassword:', error);
    throw error; // Lança o erro para ser tratado pelo controlador
  } finally {
    connection.release();
  }
};


/**
 * Função auxiliar para gerar e armazenar o refresh token.
 */
async function generateAndStoreRefreshToken(userId, connection) {
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Medida de segurança: remove tokens antigos do mesmo usuário antes de inserir um novo.
    await connection.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

    await connection.execute(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, refreshToken, expiresAt]
    );

    return refreshToken;
}
