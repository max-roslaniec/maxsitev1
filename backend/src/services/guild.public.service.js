// backend/src/services/guild.public.service.js
const pool = require('../config/database');

exports.getAllPublicGuilds = async (page = 1, searchQuery = '') => {
    const itemsPerPage = 10;
    const offset = (parseInt(page, 10) - 1) * itemsPerPage;

    let query = `
        SELECT 
            g.id, 
            g.name, 
            g.description, 
            g.image_url, 
            g.discord_url,
            u.NickName AS leader_nickname,
            g.member_count
        FROM 
            guilds g
        JOIN 
            user u ON g.leader_id = u.Id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM guilds g';
    const params = [];
    const countParams = [];

    if (searchQuery) {
        query += ' WHERE g.name LIKE ?';
        countQuery += ' WHERE g.name LIKE ?';
        params.push(`%${searchQuery}%`);
        countParams.push(`%${searchQuery}%`);
    }

    query += ' ORDER BY g.member_count DESC, g.name ASC LIMIT ? OFFSET ?';
    params.push(itemsPerPage, offset);

    const [guilds] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, countParams);
    
    const totalPages = Math.ceil(total / itemsPerPage);

    const guildsWithDetails = guilds.map(guild => ({
        ...guild,
        imageUrl: guild.image_url ? `http://localhost:3001/images/guilds/${guild.image_url}` : null
    }));

    return {
        guilds: guildsWithDetails,
        totalPages,
        currentPage: parseInt(page, 10)
    };
};

// --- FUNÇÃO ATUALIZADA PARA SUPORTAR BUSCA ---
exports.getGuildRanking = async (searchQuery = '') => {
    const connection = await pool.getConnection();
    try {
        let searchedGuild = null;

        // 1. Busca a guilda específica, se um termo de busca for fornecido
        if (searchQuery) {
            const [rows] = await connection.execute(
                `SELECT g.rank, g.name, g.image_url, g.total_gp, g.member_count, u.NickName as leader_nickname
                 FROM guilds g
                 JOIN user u ON g.leader_id = u.Id
                 WHERE g.name = ? AND g.rank IS NOT NULL`,
                [searchQuery]
            );
            if (rows.length > 0) {
                searchedGuild = rows[0];
            }
        }

        // 2. Busca a lista principal do ranking (TOP 20, por exemplo)
        const [topGuilds] = await connection.execute(`
            SELECT g.rank, g.name, g.image_url, g.total_gp, g.member_count, u.NickName as leader_nickname
            FROM guilds g
            JOIN user u ON g.leader_id = u.Id
            WHERE g.rank IS NOT NULL
            ORDER BY g.rank ASC
            LIMIT 20
        `);

        // Adiciona a URL completa para as imagens
        const rankedGuilds = topGuilds.map(guild => ({
            ...guild,
            imageUrl: guild.image_url ? `http://localhost:3001/images/guilds/${guild.image_url}` : null
        }));
        if (searchedGuild) {
            searchedGuild.imageUrl = searchedGuild.image_url ? `http://localhost:3001/images/guilds/${searchedGuild.image_url}` : null;
        }

        return { rankedGuilds, searchedGuild };
    } finally {
        connection.release();
    }
};