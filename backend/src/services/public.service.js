// backend/src/services/public.service.js
const pool = require('../config/database');

exports.getHomepageData = async () => {
    const [news] = await pool.execute(
        'SELECT * FROM news ORDER BY created_at DESC LIMIT 4'
    );
    const [ranking] = await pool.execute(
        `SELECT TotalRank, TotalGrade, TotalScore, NickName FROM game
         WHERE NoRankUpdate = 0
         ORDER BY TotalRank ASC LIMIT 10`
    );
    const [settingsRows] = await pool.execute(
        "SELECT setting_key, setting_value FROM settings WHERE setting_key = ?",
        ['isSwapEnabled']
    );
    
    const settings = settingsRows.reduce((acc, { setting_key, setting_value }) => {
        acc[setting_key] = setting_value;
        return acc;
    }, {});

    return { news, ranking, settings };
};

exports.getAllNews = async () => {
    const [news] = await pool.execute('SELECT * FROM news ORDER BY created_at DESC');
    return news;
};

exports.getNewsById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (rows.length === 0) {
        throw new Error('Notícia não encontrada.');
    }
    return rows[0];
};

exports.getRanking = async (searchNick) => {
    let searchedPlayer = null;
    if (searchNick) {
        const [rows] = await pool.execute(
            `SELECT TotalRank, TotalGrade, TotalScore, NickName FROM game
             WHERE NickName = ? AND NoRankUpdate = 0`,
            [searchNick]
        );
        if (rows.length > 0) {
            searchedPlayer = rows[0];
        }
    }
    const [topPlayers] = await pool.execute(
        `SELECT TotalRank, TotalGrade, TotalScore, NickName FROM game
         WHERE NoRankUpdate = 0
         ORDER BY TotalRank ASC LIMIT 20`
    );
    return { topPlayers, searchedPlayer };
};

exports.getShopItems = async (queryParams) => {
    const { page = 1, searchName, gender, type } = queryParams;
    const itemsPerPage = 10;
    const offset = (parseInt(page, 10) - 1) * itemsPerPage;

    let whereClauses = [];
    let queryParamsList = [];
    if (searchName) { whereClauses.push("name LIKE ?"); queryParamsList.push(`%${searchName}%`); }
    if (gender) { whereClauses.push("gender LIKE ?"); queryParamsList.push(`%${gender}%`); }
    if (type) { whereClauses.push("type = ?"); queryParamsList.push(type); }
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [items] = await pool.execute(
        `SELECT 
            itemId, name, image, duration, gender, type, content, price_cash, price_gcash 
         FROM shop_items 
         ${whereSql} 
         ORDER BY name ASC 
         LIMIT ? OFFSET ?`,
        [...queryParamsList, itemsPerPage, offset]
    );

    const formattedItems = items.map(item => ({
        ...item,
        itemId: parseInt(item.itemId, 10),
        imageUrl: `/images/avatars/${item.image}`
    }));

    const [countRows] = await pool.execute(`SELECT COUNT(*) as total FROM shop_items ${whereSql}`, queryParamsList);
    const totalItems = countRows[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return { items: formattedItems, totalPages, currentPage: parseInt(page, 10) };
};

// --- FUNÇÃO DE BUSCAR COTAÇÕES MODIFICADA ---
exports.getAllRates = async () => {
    const [rows] = await pool.execute(
        // Adicionamos 'GCASH_TO_BRL_RATE' à lista de chaves a serem buscadas
        "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('BRL_TO_CASH_RATE', 'SOL_TO_GCASH_RATE', 'GOLD_TO_GCASH_RATE', 'GCASH_TO_BRL_RATE')"
    );
    const rates = rows.reduce((acc, { setting_key, setting_value }) => {
        acc[setting_key] = parseFloat(setting_value);
        return acc;
    }, {});
    return rates;
};