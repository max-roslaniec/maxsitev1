// backend/src/services/guild.service.js
const pool = require('../config/database');
const notificationService = require('./notification.service');
const userService = require('./user.service');

const GUILD_CREATION_FEE = 100000;
const POWER_USER_ITEM_ID = 204801;
const GUILD_EDIT_FEE = 100000;
const GUILD_EDIT_COOLDOWN_DAYS = 15;

// ====================================================================
// FUNÇÃO AUXILIAR DE SEGURANÇA
// ====================================================================
async function verifyGuildPermission(editorId, guildId, allowedRoles, connection = pool) {
    // Refatorado: usa a coluna 'Id' para buscar o usuário
    const [memberRows] = await connection.execute(
        'SELECT role FROM guild_members WHERE Id = ? AND guild_id = ?',
        [editorId, guildId]
    );

    if (memberRows.length === 0) {
        throw { status: 403, message: 'Você não tem permissão para realizar esta ação.' };
    }

    const userRole = memberRows[0].role;

    if (!allowedRoles.includes(userRole)) {
        throw { status: 403, message: 'Você não tem permissão para realizar esta ação.' };
    }
    return true;
}


// ====================================================================
// FUNÇÃO AUXILIAR DE RECALCULO
// ====================================================================
async function updateGuildStats(guildId, connection) {
    // Refatorado: usa a coluna 'Id' para buscar o usuário
    const [members] = await connection.execute(
        `SELECT gm.Id, g.TotalScore 
         FROM guild_members gm 
         JOIN game g ON gm.Id = g.Id 
         WHERE gm.guild_id = ? 
         ORDER BY g.TotalScore DESC`,
        [guildId]
    );
    const memberCount = members.length;
    await connection.execute('UPDATE guilds SET member_count = ? WHERE id = ?', [memberCount, guildId]);
    if (memberCount > 0) {
        const updatePromises = members.map((member, index) => {
            const newRank = index + 1;
            // Refatorado: usa member.Id
            return connection.execute(
                'UPDATE game SET MemberCount = ?, GuildRank = ? WHERE Id = ?',
                [memberCount, newRank, member.Id]
            );
        });
        await Promise.all(updatePromises);
    }
}

// ====================================================================
// FUNÇÕES PARA O JOGADOR
// ====================================================================
exports.createGuildRequest = async (userId, guildData) => {
    const { guild_name, guild_description, discord_url, guild_image_url } = guildData;
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Refatorado: usa a coluna 'Id' para buscar o usuário
        const [memberRows] = await connection.execute('SELECT membership_id FROM guild_members WHERE Id = ?', [userId]);
        if (memberRows.length > 0) {
            throw { status: 400, message: 'Você já pertence a uma guilda e não pode criar outra.' };
        }
        const [powerUserRows] = await connection.execute('SELECT No FROM chest WHERE Owner = ? AND Item = ?', [userId, POWER_USER_ITEM_ID]);
        if (powerUserRows.length === 0) {
            throw { status: 403, message: 'Você precisa ter o item Power User ativo para criar uma guilda.' };
        }
        const [nameCheckRows] = await connection.execute(
            `(SELECT name FROM guilds WHERE name = ?) UNION (SELECT guild_name as name FROM guild_creation_requests WHERE guild_name = ? AND status = 'Pendente')`,
            [guild_name, guild_name]
        );
        if (nameCheckRows.length > 0) {
            throw { status: 409, message: 'Este nome de guilda já está em uso ou em uma solicitação pendente.' };
        }
        const [userGameRows] = await connection.execute('SELECT Money FROM game WHERE Id = ? FOR UPDATE', [userId]);
        if (userGameRows.length === 0 || userGameRows[0].Money < GUILD_CREATION_FEE) {
            throw { status: 403, message: `Você precisa de ${GUILD_CREATION_FEE.toLocaleString('pt-BR')} de Gold para criar uma guilda.` };
        }
        await connection.execute('UPDATE game SET Money = Money - ? WHERE Id = ?', [GUILD_CREATION_FEE, userId]);
        await connection.execute(
            `INSERT INTO guild_creation_requests (user_id, guild_name, guild_description, discord_url, guild_image_url) VALUES (?, ?, ?, ?, ?)`,
            [userId, guild_name, guild_description, discord_url, guild_image_url]
        );

        // Notify admins
        const adminIds = await userService.getAdminUserIds(connection);
        const notificationPromises = adminIds.map(adminId => 
            notificationService.createNotification(
                adminId, 
                `Novo pedido de criação de guilda: "${guild_name}" por ${userId}.`,
                connection
            )
        );
        await Promise.all(notificationPromises);

        await connection.commit();
        return { success: true, message: `Sua solicitação para criar a guilda "${guild_name}" foi enviada para aprovação! A taxa de ${GUILD_CREATION_FEE.toLocaleString('pt-BR')} de Gold foi debitada.` };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao criar solicitação de guilda:", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.createJoinRequest = async (userId, guildId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Refatorado: usa a coluna 'Id'
        const [memberRows] = await connection.execute('SELECT membership_id FROM guild_members WHERE Id = ?', [userId]);
        if (memberRows.length > 0) {
            throw { status: 400, message: 'Você já pertence a uma guilda.' };
        }
        const [existingRequest] = await connection.execute('SELECT id FROM guild_join_requests WHERE user_id = ? AND status = "Pendente"', [userId]);
        if (existingRequest.length > 0) {
            throw { status: 409, message: 'Você já tem um pedido pendente para entrar em uma guilda.' };
        }
        await connection.execute('INSERT INTO guild_join_requests (user_id, guild_id) VALUES (?, ?)', [userId, guildId]);
        
        // Refatorado: usa a coluna 'Id'
        const [officers] = await connection.execute("SELECT Id FROM guild_members WHERE guild_id = ? AND role IN ('Líder', 'Moderador')", [guildId]);
        const [requester] = await connection.execute("SELECT NickName FROM user WHERE Id = ?", [userId]);
        const notificationPromises = officers.map(officer => 
            // Refatorado: usa officer.Id
            notificationService.createNotification(officer.Id, `O jogador "${requester[0].NickName}" pediu para entrar na sua guilda.`, connection)
        );
        await Promise.all(notificationPromises);

        await connection.commit();
        return { success: true, message: 'Seu pedido para participar da guilda foi enviado com sucesso!' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.leaveGuild = async (userId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Refatorado: usa a coluna 'Id'
        const [memberRows] = await connection.execute('SELECT gm.guild_id, g.leader_id FROM guild_members gm JOIN guilds g ON gm.guild_id = g.id WHERE gm.Id = ?', [userId]);
        if (memberRows.length === 0) {
            throw { status: 404, message: 'Você não é membro de nenhuma guilda.' };
        }
        const { guild_id, leader_id } = memberRows[0];
        if (leader_id === userId) {
            throw { status: 400, message: 'O líder não pode sair da guilda. A liderança deve ser transferida ou a guilda deletada.' };
        }
        
        // Refatorado: usa a coluna 'Id'
        await connection.execute('DELETE FROM guild_members WHERE Id = ?', [userId]);
        await connection.execute("UPDATE game SET Guild = '', GuildRank = 0, MemberCount = 0 WHERE Id = ?", [userId]);
        
        await updateGuildStats(guild_id, connection);

        await connection.commit();
        return { success: true, message: 'Você saiu da guilda.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// ====================================================================
// FUNÇÕES PARA O LÍDER E MODERADOR DA GUILD
// ====================================================================
exports.getGuildManagementData = async (userId) => {
    // Refatorado: usa a coluna 'Id'
    const [guildMemberRows] = await pool.execute(`SELECT guild_id FROM guild_members WHERE Id = ? AND role IN ('Líder', 'Moderador')`, [userId]);
    if (guildMemberRows.length === 0) throw { status: 403, message: 'Você não tem permissão para gerenciar uma guilda.' };
    const guildId = guildMemberRows[0].guild_id;

    const [guildRows] = await pool.execute(`SELECT *, DATE_ADD(last_name_change, INTERVAL ? DAY) as name_change_available_at, DATE_ADD(last_image_change, INTERVAL ? DAY) as image_change_available_at FROM guilds WHERE id = ?`, [GUILD_EDIT_COOLDOWN_DAYS, GUILD_EDIT_COOLDOWN_DAYS, guildId]);
    if (guildRows.length === 0) throw { status: 404, message: 'A guilda que você gerencia não foi encontrada.' };
    const guild = guildRows[0];

    // Refatorado: usa a coluna 'Id'
    const [members] = await pool.execute('SELECT gm.Id, u.NickName, gm.role, gm.joined_at, g.TotalGrade FROM guild_members gm JOIN user u ON gm.Id = u.Id JOIN game g ON u.Id = g.Id WHERE gm.guild_id = ? ORDER BY gm.role, gm.joined_at ASC', [guild.id]);
    const [joinRequests] = await pool.execute('SELECT jr.id, jr.user_id, u.NickName, jr.created_at, g.TotalGrade FROM guild_join_requests jr JOIN user u ON jr.user_id = u.Id JOIN game g ON u.Id = g.Id WHERE jr.guild_id = ? AND jr.status = "Pendente" ORDER BY jr.created_at ASC', [guild.id]);

    return { guild, members, joinRequests };
};

exports.processJoinRequest = async (editorId, requestId, action) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [requestRows] = await connection.execute(`SELECT jr.id, jr.user_id, jr.guild_id, g.name as guild_name FROM guild_join_requests jr JOIN guilds g ON jr.guild_id = g.id WHERE jr.id = ? AND jr.status = 'Pendente' FOR UPDATE`, [requestId]);
        if (requestRows.length === 0) throw { status: 404, message: 'Pedido não encontrado ou já processado.' };
        const request = requestRows[0];
        await verifyGuildPermission(editorId, request.guild_id, ['Líder', 'Moderador'], connection);

        if (action === 'accept') {
            // Refatorado: usa a coluna 'Id'
            await connection.execute('INSERT INTO guild_members (guild_id, Id, role) VALUES (?, ?, "Membro")', [request.guild_id, request.user_id]);
            await connection.execute('UPDATE game SET Guild = ? WHERE Id = ?', [request.guild_name, request.user_id]);
            await connection.execute('DELETE FROM guild_join_requests WHERE id = ?', [requestId]);
            await updateGuildStats(request.guild_id, connection);
            await notificationService.createNotification(request.user_id, `Seu pedido para entrar na guilda "${request.guild_name}" foi aceito!`, connection);
        } else { // 'reject'
            await connection.execute('DELETE FROM guild_join_requests WHERE id = ?', [requestId]);
            await notificationService.createNotification(request.user_id, `Seu pedido para entrar na guilda "${request.guild_name}" foi recusado.`, connection);
        }
        await connection.commit();
        return { success: true, message: `Pedido #${requestId} processado com sucesso.` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.kickGuildMember = async (editorId, memberToKickId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // Refatorado: usa a coluna 'Id'
        const [memberRows] = await connection.execute(`SELECT gm.guild_id, g.name as guild_name FROM guild_members gm JOIN guilds g ON gm.guild_id = g.id WHERE gm.Id = ?`, [memberToKickId]);
        if (memberRows.length === 0) throw { status: 404, message: 'O jogador a ser expulso não foi encontrado.' };
        const { guild_id, guild_name } = memberRows[0];
        await verifyGuildPermission(editorId, guild_id, ['Líder', 'Moderador'], connection);
        if (editorId === memberToKickId) throw { status: 400, message: 'Você não pode expulsar a si mesmo.' };
        // Refatorado: usa a coluna 'Id'
        const [targetMemberRows] = await connection.execute('SELECT role FROM guild_members WHERE Id = ? AND guild_id = ?', [memberToKickId, guild_id]);
        if (targetMemberRows[0].role === 'Líder') throw { status: 400, message: 'O líder não pode ser expulso.' };
        // Refatorado: usa a coluna 'Id'
        await connection.execute('DELETE FROM guild_members WHERE Id = ?', [memberToKickId]);
        await connection.execute("UPDATE game SET Guild = '', GuildRank = 0, MemberCount = 0 WHERE Id = ?", [memberToKickId]);
        await updateGuildStats(guild_id, connection);
        await notificationService.createNotification(memberToKickId, `Você foi expulso da guilda "${guild_name}".`, connection);
        await connection.commit();
        return { success: true, message: 'Membro expulso com sucesso.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.updateMemberRole = async (leaderId, guildId, memberId, newRole) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await verifyGuildPermission(leaderId, guildId, ['Líder'], connection);
        if (leaderId === memberId) throw { status: 400, message: 'O líder não pode alterar o próprio cargo.' };
        if (newRole === 'Moderador') {
            const [powerUserRows] = await connection.execute('SELECT No FROM chest WHERE Owner = ? AND Item = ?', [memberId, POWER_USER_ITEM_ID]);
            if (powerUserRows.length === 0) throw { status: 400, message: 'O membro precisa ter Power User ativo para ser promovido a Moderador.' };
        }
        // Refatorado: usa a coluna 'Id'
        await connection.execute('UPDATE guild_members SET role = ? WHERE Id = ? AND guild_id = ?', [newRole, memberId, guildId]);
        await notificationService.createNotification(memberId, `Seu cargo na guilda foi alterado para ${newRole}.`, connection);
        await connection.commit();
        return { success: true, message: 'Cargo do membro atualizado com sucesso.' };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.changeGuildName = async (editorId, guildId, newName) => {
    await verifyGuildPermission(editorId, guildId, ['Líder', 'Moderador']);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [guildRows] = await connection.execute('SELECT name, last_name_change FROM guilds WHERE id = ? FOR UPDATE', [guildId]);
        if (guildRows.length === 0) throw { status: 404, message: 'Guilda não encontrada.' };
        const guild = guildRows[0];
        if (guild.last_name_change) {
            const lastChange = new Date(guild.last_name_change);
            const availableDate = new Date(lastChange.setDate(lastChange.getDate() + GUILD_EDIT_COOLDOWN_DAYS));
            if (new Date() < availableDate) throw { status: 429, message: `Você só pode alterar o nome novamente em ${availableDate.toLocaleDateString('pt-BR')}.` };
        }
        const [nameCheckRows] = await connection.execute('SELECT id FROM guilds WHERE name = ?', [newName]);
        if (nameCheckRows.length > 0) throw { status: 409, message: 'Este nome de guilda já está em uso.' };
        const [userGameRows] = await connection.execute('SELECT Money FROM game WHERE Id = ? FOR UPDATE', [editorId]);
        if (userGameRows.length === 0 || userGameRows[0].Money < GUILD_EDIT_FEE) throw { status: 403, message: `Você precisa de ${GUILD_EDIT_FEE.toLocaleString('pt-BR')} de Gold para alterar o nome.` };
        await connection.execute('UPDATE game SET Money = Money - ? WHERE Id = ?', [GUILD_EDIT_FEE, editorId]);
        await connection.execute('UPDATE guilds SET name = ?, last_name_change = CURDATE() WHERE id = ?', [newName, guildId]);
        await connection.execute('UPDATE game SET Guild = ? WHERE Guild = ?', [newName, guild.name]);
        await connection.commit();
        return { success: true, message: `Nome da guilda alterado para "${newName}" com sucesso!` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.changeGuildImage = async (editorId, guildId, newImageFilename) => {
    await verifyGuildPermission(editorId, guildId, ['Líder', 'Moderador']);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [guildRows] = await connection.execute('SELECT last_image_change FROM guilds WHERE id = ? FOR UPDATE', [guildId]);
        if (guildRows.length === 0) throw { status: 404, message: 'Guilda não encontrada.' };
        const guild = guildRows[0];
        if (guild.last_image_change) {
            const lastChange = new Date(guild.last_image_change);
            const availableDate = new Date(lastChange.setDate(lastChange.getDate() + GUILD_EDIT_COOLDOWN_DAYS));
            if (new Date() < availableDate) throw { status: 429, message: `Você só pode alterar a imagem novamente em ${availableDate.toLocaleDateString('pt-BR')}.` };
        }
        const [userGameRows] = await connection.execute('SELECT Money FROM game WHERE Id = ? FOR UPDATE', [editorId]);
        if (userGameRows.length === 0 || userGameRows[0].Money < GUILD_EDIT_FEE) throw { status: 403, message: `Você precisa de ${GUILD_EDIT_FEE.toLocaleString('pt-BR')} de Gold para alterar a imagem.` };
        await connection.execute('UPDATE game SET Money = Money - ? WHERE Id = ?', [GUILD_EDIT_FEE, editorId]);
        await connection.execute('UPDATE guilds SET image_url = ?, last_image_change = CURDATE() WHERE id = ?', [newImageFilename, guildId]);
        await connection.commit();
        return { success: true, message: `Imagem da guilda alterada com sucesso!` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

exports.deleteGuild = async (leaderId, guildId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Verifica a permissão DENTRO da transação
        await verifyGuildPermission(leaderId, guildId, ['Líder'], connection);

        // 2. Busca o nome da guilda para as notificações
        const [guildRows] = await connection.execute('SELECT name FROM guilds WHERE id = ?', [guildId]);
        if (guildRows.length === 0) {
            throw { status: 404, message: 'Guilda não encontrada.' };
        }
        const guildName = guildRows[0].name;

        // 3. Busca todos os membros da guilda
        const [members] = await connection.execute('SELECT Id FROM guild_members WHERE guild_id = ?', [guildId]);
        const memberIds = members.map(m => m.Id);

        if (memberIds.length > 0) {
            // 4. Limpa as informações da guilda na tabela `game` para todos os membros
            const placeholders = memberIds.map(() => '?').join(',');
            const updateGameSql = `UPDATE game SET Guild = '', GuildRank = 0, MemberCount = 0 WHERE Id IN (${placeholders})`;
            await connection.execute(updateGameSql, memberIds);

            // 5. Envia notificação para cada membro
            const notificationMessage = `A sua guilda "${guildName}" foi dissolvida pelo líder.`;
            const notificationPromises = memberIds.map(id =>
                notificationService.createNotification(id, notificationMessage, connection)
            );
            await Promise.all(notificationPromises);

            // 6. Deleta todos os registros da tabela `guild_members`
            await connection.execute('DELETE FROM guild_members WHERE guild_id = ?', [guildId]);
        }

        // 7. Deleta a guilda da tabela `guilds`
        await connection.execute('DELETE FROM guilds WHERE id = ?', [guildId]);

        await connection.commit();
        return { success: true, message: 'Sua guilda foi deletada permanentemente.' };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao deletar guilda:", error);
        throw error;
    } finally {
        connection.release();
    }
};

// ====================================================================
// FUNÇÕES PARA O PAINEL DE ADMIN
// ====================================================================
exports.getGuildCreationRequests = async ({ status = 'Pendente' }) => {
    const [rows] = await pool.execute(`SELECT r.*, u.NickName FROM guild_creation_requests r JOIN user u ON r.user_id = u.Id WHERE r.status = ? ORDER BY r.created_at ASC`,[status]);
    return rows;
};

exports.approveGuildCreation = async (requestId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [requestRows] = await connection.execute('SELECT * FROM guild_creation_requests WHERE id = ? AND status = "Pendente" FOR UPDATE', [requestId]);
        if (requestRows.length === 0) {
            throw { status: 404, message: 'Solicitação não encontrada ou já processada.' };
        }
        const request = requestRows[0];
        
        const [guildInsertResult] = await connection.execute(
            `INSERT INTO guilds (name, description, leader_id, image_url, discord_url, last_name_change, member_count) VALUES (?, ?, ?, ?, ?, CURDATE(), 1)`,
            [request.guild_name, request.guild_description, request.user_id, request.guild_image_url, request.discord_url]
        );
        const newGuildId = guildInsertResult.insertId;
        // Refatorado: usa a coluna 'Id'
        await connection.execute('INSERT INTO guild_members (guild_id, Id, role) VALUES (?, ?, "Líder")', [newGuildId, request.user_id]);
        
        await connection.execute('UPDATE game SET Guild = ?, GuildRank = 1, MemberCount = 1 WHERE Id = ?', [request.guild_name, request.user_id]);
        
        await connection.execute("UPDATE guild_creation_requests SET status = 'Aprovado', processed_at = CURRENT_TIMESTAMP WHERE id = ?", [requestId]);
        await notificationService.createNotification(request.user_id, `Parabéns! Sua guilda "${request.guild_name}" foi aprovada e criada com sucesso.`, connection);
        
        await connection.commit();
        return { success: true, message: `Guilda "${request.guild_name}" aprovada e criada com sucesso!` };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao aprovar criação de guilda:", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.rejectGuildCreation = async (requestId, reason) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.execute("UPDATE guild_creation_requests SET status = 'Reprovado', rejection_reason = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?", [reason, requestId]);
        if (result.affectedRows === 0) {
            throw { status: 404, message: 'Solicitação não encontrada ou já processada.' };
        }

        const [requestRows] = await connection.execute('SELECT user_id, guild_name FROM guild_creation_requests WHERE id = ?', [requestId]);
        if (requestRows.length > 0) {
            const { user_id, guild_name } = requestRows[0];
            await notificationService.createNotification(user_id, `Sua solicitação para criar a guilda "${guild_name}" foi reprovada. Motivo: ${reason}`, connection);
        }
        await connection.commit();
        return { success: true, message: `Solicitação #${requestId} reprovada com sucesso.` };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};