// backend/src/services/user.service.js
const pool = require('../config/database');

const POWER_USER_ITEM_ID = 204801;

// --- Funções para o Site Público ---
exports.getUserDataById = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT 
           u.NickName, 
           IFNULL(g.TotalScore, 0) AS TotalScore, 
           IFNULL(g.Money, 0) AS Money, 
           IFNULL(g.TotalGrade, 19) AS TotalGrade,
           IFNULL(g.TotalRank, 0) AS TotalRank,
           IFNULL(c.Cash, 0) AS Cash,
           g.Guild,
           gm.guild_id,
           gm.role AS guild_role,
           c_pu.Expire AS power_user_expires_at
         FROM user u
         LEFT JOIN game g ON u.Id = g.Id
         LEFT JOIN cash c ON u.Id = c.ID
         LEFT JOIN guild_members gm ON u.Id = gm.Id
         LEFT JOIN chest c_pu ON u.Id = c_pu.Owner AND c_pu.Item = ?
         WHERE u.Id = ?`,
        [POWER_USER_ITEM_ID, userId]
    );

    if (rows.length === 0) {
        throw new Error('Dados do usuário não encontrados.');
    }

    const [inventoryRows] = await pool.execute(
        'SELECT Item FROM chest WHERE Owner = ?',
        [userId]
    );
    const inventory = inventoryRows.map(row => parseInt(row.Item, 10));

    const userData = rows[0];
    return {
        ...userData,
        TotalScore: Number(userData.TotalScore),
        Money: Number(userData.Money),
        Cash: Number(userData.Cash),
        TotalGrade: Number(userData.TotalGrade),
        TotalRank: Number(userData.TotalRank),
        inventory: inventory
    };
};




// --- Funções para o Painel de Administração ---

exports.getAdminUserIds = async (connection = pool) => {
    const [rows] = await connection.execute('SELECT Id FROM user WHERE Authority = 100');
    return rows.map(row => row.Id);
};

exports.getAllUsers = async ({ page = 1, limit = 20, searchQuery = '' }) => {
    const connection = await pool.getConnection();
    try {
        let searchedUser = null;
        if (searchQuery) {
            const [userRows] = await connection.execute(
                'SELECT Id, NickName, Status, Authority FROM user WHERE Id = ? OR NickName = ?',
                [searchQuery, searchQuery]
            );
            if (userRows.length > 0) {
                searchedUser = userRows[0];
            }
        }
        
        const [[{ totalUsers }]] = await connection.execute('SELECT COUNT(*) as totalUsers FROM user');

        const offset = (page - 1) * limit;
        const [users] = await connection.execute(
            'SELECT Id, NickName, Status, Authority FROM user ORDER BY Id ASC LIMIT ? OFFSET ?',
            [limit, offset]
        );

        return {
            users,
            searchedUser,
            totalUsers,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
        };
    } catch (error) {
        console.error('Erro ao buscar usuários no serviço:', error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.getUserForEdit = async (userId) => {
    const [rows] = await pool.execute(
        `SELECT u.Id, u.NickName, u.Password, u.Status, u.Authority, 
                IFNULL(g.Money, 0) as Money, 
                IFNULL(g.TotalScore, 0) as TotalScore,
                IFNULL(g.TotalGrade, 19) as TotalGrade,
                IFNULL(c.Cash, 0) as Cash 
         FROM user u
         LEFT JOIN game g ON u.Id = g.Id
         LEFT JOIN cash c ON u.Id = c.ID
         WHERE u.Id = ?`,
        [userId]
    );
    if (rows.length === 0) {
        throw new Error('Usuário não encontrado.');
    }
    return rows[0];
};

exports.updateUser = async (userId, data) => {
    const { NickName, Password, Status, Authority, Money, TotalScore, Cash, TotalGrade } = data;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        console.log(`Iniciando atualização para o usuário: ${userId}`);
        const finalAuthority = Authority;
        const finalStatus = Status;

        const finalAuthorityInt = parseInt(finalAuthority, 10);
        const finalAuthorityVarchar = String(finalAuthority);

        console.log(`Status recebido: ${Status}, Status final: ${finalStatus}, finalAuthority: ${finalAuthority}`);

        const [userUpdateResult] = await connection.execute(
            'UPDATE user SET NickName = ?, Status = ?, Authority = ?, Authority2 = ? WHERE Id = ?',
            [NickName, finalStatus, finalAuthorityVarchar, finalAuthorityInt, userId]
        );
        console.log(`Tabela 'user' atualizada. Linhas afetadas: ${userUpdateResult.affectedRows}`);
        
        const [gunwcUpdateResult] = await connection.execute(
            'UPDATE gunwcuser SET NickName = ?, Authority = ?, Authority2 = ?, Status = ? WHERE Id = ?',
            [NickName, finalAuthorityVarchar, finalAuthorityVarchar, finalStatus, userId]
        );
        console.log(`Tabela 'gunwcuser' atualizada. Linhas afetadas: ${gunwcUpdateResult.affectedRows}`);
        
        if (Password && Password.length > 0) {
            console.log('Atualizando senha...');
            await connection.execute('UPDATE user SET Password = ? WHERE Id = ?', [Password, userId]);
            await connection.execute('UPDATE gunwcuser SET Password = ? WHERE Id = ?', [Password, userId]);
            console.log('Senha atualizada.');
        }
        
        const noRankUpdateValue = (Number(finalAuthority) >= 99) ? 1 : 0;

        const [gameUpdateResult] = await connection.execute(
            'UPDATE game SET Money = ?, TotalScore = ?, TotalGrade = ?, SeasonGrade = ?, CountryGrade = ?, NoRankUpdate = ? WHERE Id = ?',
            [Money, TotalScore, TotalGrade, TotalGrade, TotalGrade, noRankUpdateValue, userId]
        );
        console.log(`Tabela 'game' atualizada. Linhas afetadas: ${gameUpdateResult.affectedRows}`);
        
        const [cashUpdateResult] = await connection.execute('UPDATE cash SET Cash = ? WHERE ID = ?', [Cash, userId]);
        console.log(`Tabela 'cash' atualizada. Linhas afetadas: ${cashUpdateResult.affectedRows}`);
        
        await connection.commit();
        console.log('Transação commitada com sucesso.');
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao atualizar usuário:", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteUser = async (userId) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
        await connection.execute('DELETE FROM chest WHERE Owner = ?', [userId]);
        await connection.execute('DELETE FROM cash WHERE ID = ?', [userId]);
        await connection.execute('DELETE FROM game WHERE Id = ?', [userId]);
        await connection.execute('DELETE FROM gunwcuser WHERE Id = ?', [userId]);
        await connection.execute('DELETE FROM user WHERE Id = ?', [userId]);
        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};