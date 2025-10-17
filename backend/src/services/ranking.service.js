// backend/src/services/ranking.service.js
const pool = require('../config/database');

/**
 * Função principal que orquestra a atualização de todos os rankings.
 */
exports.updateAllRankings = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('Iniciando atualização geral de rankings...');
        await connection.beginTransaction();

        const playerSummary = await updatePlayerRankings(connection);
        console.log(playerSummary.message);

        const guildSummary = await updateGuildRankings(connection);
        console.log(guildSummary.message);
        
        await connection.commit();
        console.log('Atualização geral de rankings concluída com sucesso.');
        return { success: true, message: `${playerSummary.message} e ${guildSummary.message}` };

    } catch (error) {
        await connection.rollback();
        console.error('ERRO DURANTE A ATUALIZAÇÃO GERAL DO RANKING.', error);
        throw new Error('Falha ao atualizar os rankings no servidor.');
    } finally {
        connection.release();
    }
};

/**
 * Função interna para atualizar o ranking dos jogadores.
 */
async function updatePlayerRankings(connection) {
    const [players] = await connection.execute(
        `SELECT Id, TotalScore, TotalGrade FROM game
         WHERE NoRankUpdate = 0 
         ORDER BY CAST(TotalScore AS SIGNED) DESC`
    );

    if (players.length === 0) {
        return { message: 'Nenhum jogador para ranquear.' };
    }

    const rankUpdatePromises = players.map((player, index) => {
        const newRank = index + 1;
        return connection.execute(
            `UPDATE game SET TotalRank = ?, SeasonRank = ?, CountryRank = ? WHERE Id = ?`,
            [newRank, newRank, newRank, player.Id]
        );
    });
    await Promise.all(rankUpdatePromises);

    const totalPlayers = players.length;
    const gradeUpdatePromises = players.map((player, index) => {
        const rank = index + 1;
        let newGrade = player.TotalGrade;
        
        if (rank === 1 && player.TotalScore > 6900) newGrade = -4;
        else if (rank <= 5 && player.TotalScore > 6900) newGrade = -3;
        else if (rank <= 21 && player.TotalScore > 6900) newGrade = -2;
        else {
            if (player.TotalScore > 6900) {
                const percentage = (rank / totalPlayers) * 100;
                if (percentage <= 0.1) newGrade = -1; else if (percentage <= 1) newGrade = 0;
                else if (percentage <= 3) newGrade = 1; else if (percentage <= 6) newGrade = 2;
                else if (percentage <= 10) newGrade = 3; else if (percentage <= 20) newGrade = 4;
                else if (percentage <= 30) newGrade = 5; else if (percentage <= 50) newGrade = 6;
                else if (percentage <= 70) newGrade = 7; else newGrade = 8;
            } else {
                if (player.TotalScore >= 6000) newGrade = 9; else if (player.TotalScore >= 5100) newGrade = 10;
                else if (player.TotalScore >= 4200) newGrade = 11; else if (player.TotalScore >= 3500) newGrade = 12;
                else if (player.TotalScore >= 2800) newGrade = 13; else if (player.TotalScore >= 2300) newGrade = 14;
                else if (player.TotalScore >= 1800) newGrade = 15; else if (player.TotalScore >= 1500) newGrade = 16;
                else if (player.TotalScore >= 1200) newGrade = 17; else if (player.TotalScore >= 1100) newGrade = 18;
                else newGrade = 19;
            }
        }
        if (newGrade !== player.TotalGrade) {
            // --- CORREÇÃO APLICADA AQUI ---
            // A query agora atualiza as três colunas de nível com o mesmo valor.
            return connection.execute(`UPDATE game SET TotalGrade = ?, SeasonGrade = ?, CountryGrade = ? WHERE Id = ?`, [newGrade, newGrade, newGrade, player.Id]);
        }
        return null;
    }).filter(p => p !== null);

    if (gradeUpdatePromises.length > 0) {
        await Promise.all(gradeUpdatePromises);
    }

    return { message: `Ranking de ${players.length} jogadores atualizado` };
}

/**
 * Função interna para atualizar o ranking das guilds.
 */
async function updateGuildRankings(connection) {
    const [guildGPs] = await connection.execute(`
        SELECT g.id, SUM(ga.TotalScore) as total_gp
        FROM guilds g
        JOIN guild_members gm ON g.id = gm.guild_id
        JOIN game ga ON gm.Id = ga.Id
        GROUP BY g.id
        ORDER BY total_gp DESC
    `);

    if (guildGPs.length === 0) {
        return { message: 'Nenhuma guilda para ranquear.' };
    }

    const guildRankPromises = guildGPs.map((guild, index) => {
        const newRank = index + 1;
        return connection.execute(
            'UPDATE guilds SET `rank` = ?, total_gp = ? WHERE id = ?',
            [newRank, guild.total_gp, guild.id]
        );
    });
    await Promise.all(guildRankPromises);

    for (const guild of guildGPs) {
        const [members] = await connection.execute(
            `SELECT gm.Id FROM guild_members gm
             JOIN game g ON gm.Id = g.Id
             WHERE gm.guild_id = ?
             ORDER BY g.TotalScore DESC`,
            [guild.id]
        );
        
        const memberRankPromises = members.map((member, index) => {
            const newMemberRank = index + 1;
            return connection.execute(
                'UPDATE game SET GuildRank = ? WHERE Id = ?',
                [newMemberRank, member.Id]
            );
        });
        await Promise.all(memberRankPromises);
    }
    
    return { message: `Ranking de ${guildGPs.length} guilds atualizado` };
}