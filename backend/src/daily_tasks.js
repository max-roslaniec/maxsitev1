// backend/src/daily_tasks.js
require('dotenv').config();
const pool = require('./config/database');
const rankingService = require('./services/ranking.service');
const notificationService = require('./services/notification.service');

const POWER_USER_ITEM_ID = 204801;

async function checkGuildLeadersWithoutPowerUser(connection) {
    console.log('Iniciando a verificação de líderes de guilda sem Power User...');

    const [leadersWithoutPowerUser] = await connection.execute(
        `SELECT g.id as guild_id, g.name as guild_name, g.leader_id
         FROM guilds g
         LEFT JOIN chest c ON g.leader_id = c.Owner AND c.Item = ?
         WHERE c.Owner IS NULL`,
        [POWER_USER_ITEM_ID]
    );

    if (leadersWithoutPowerUser.length === 0) {
        console.log('Nenhum líder sem Power User encontrado.');
        return;
    }

    console.log(`Encontrados ${leadersWithoutPowerUser.length} líderes para processar.`);

    for (const leader of leadersWithoutPowerUser) {
        console.log(`Processando Guild: ${leader.guild_name} (Líder Nickname: ${leader.leader_id})`);

        const [candidates] = await connection.execute(
            `SELECT gm.Id, u.NickName
             FROM guild_members gm
             JOIN user u ON gm.Id = u.Id
             JOIN chest c ON gm.Id = c.Owner AND c.Item = ?
             WHERE gm.guild_id = ? AND gm.Id != ?
             ORDER BY gm.joined_at ASC
             LIMIT 1`,
            [POWER_USER_ITEM_ID, leader.guild_id, leader.leader_id]
        );

        if (candidates.length > 0) {
            const newLeader = candidates[0];
            console.log(`Sucessor encontrado: ${newLeader.NickName}. Transferindo liderança...`);
            
            await Promise.all([
                connection.execute('UPDATE guilds SET leader_id = ? WHERE id = ?', [newLeader.Id, leader.guild_id]),
                connection.execute("UPDATE guild_members SET role = 'Líder' WHERE Id = ?", [newLeader.Id]),
                connection.execute("UPDATE guild_members SET role = 'Membro' WHERE Id = ?", [leader.leader_id])
            ]);

            await Promise.all([
                notificationService.createNotification(leader.leader_id, `Você não possui um Power User ativo. A liderança da guilda "${leader.guild_name}" foi transferida para ${newLeader.NickName}.`, connection),
                notificationService.createNotification(newLeader.Id, `O líder anterior não possuía um Power User ativo. Você foi promovido a novo líder da guilda "${leader.guild_name}"!`, connection)
            ]);
        
        } else {
            console.log(`Nenhum sucessor elegível encontrado para a guilda "${leader.guild_name}". Iniciando dissolução...`);
            
            const [allMembers] = await connection.execute('SELECT Id FROM guild_members WHERE guild_id = ?', [leader.guild_id]);
            const memberIds = allMembers.map(m => m.Id);

            if (memberIds.length > 0) {
                // Limpeza básica para evitar caracteres ocultos
                const cleanedMemberIds = memberIds.map(id => (typeof id === 'string' ? id.trim() : String(id)));

                console.log(`[DEBUG] IDs limpos para a consulta: ${JSON.stringify(cleanedMemberIds)}`);

                // Construção dinâmica dos placeholders (?, ?, ?)
                const placeholders = cleanedMemberIds.map(() => '?').join(',');
                const sql = `
                    UPDATE game 
                    SET Guild = '', GuildRank = 0, MemberCount = 0 
                    WHERE Id IN (${placeholders})
                `;

                console.log("SQL:", sql);
                console.log("Params:", cleanedMemberIds);

                const [updateResult] = await connection.execute(sql, cleanedMemberIds);
                console.log(` -> ${updateResult.affectedRows} registros de usuário atualizados na tabela 'game'.`);

                const notificationPromises = memberIds.map(id => 
                    notificationService.createNotification(id, `A guilda "${leader.guild_name}" foi dissolvida por falta de um líder com Power User ativo.`, connection)
                );
                await Promise.all(notificationPromises);
            }
            
            await connection.execute('DELETE FROM guilds WHERE id = ?', [leader.guild_id]);
            console.log(` -> Guilda "${leader.guild_name}" deletada.`);
        }
    }
}

async function runDailyTasks() {
    console.log(`[${new Date().toLocaleString('pt-BR')}] Iniciando script de tarefas diárias...`);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await checkGuildLeadersWithoutPowerUser(connection);
        await connection.commit();
        console.log(`[${new Date().toLocaleString('pt-BR')}] Todas as tarefas diárias foram concluídas com sucesso.`);
    } catch (error) {
        await connection.rollback();
        console.error(`[${new Date().toLocaleString('pt-BR')}] ERRO CRÍTICO:`, error);
    } finally {
        if (connection) connection.release();
        await pool.end();
        console.log('Script finalizado.');
    }
}

runDailyTasks();
