// src/services/news.service.js
const pool = require('../config/database');

exports.createNews = async (newsData) => {
    const { title, content, author, image_url } = newsData;
    const [result] = await pool.execute(
        'INSERT INTO news (title, content, author, image_url) VALUES (?, ?, ?, ?)',
        [title, content, author, image_url]
    );
    return { id: result.insertId, ...newsData };
};

/**
 * FUNÇÃO REESCRITA PARA SUPORTAR BUSCA E PAGINAÇÃO NO PAINEL DE ADMIN
 * @param {object} options - Opções de paginação e busca.
 * @param {number} options.page - A página atual.
 * @param {number} options.limit - O número de itens por página.
 * @param {string} options.searchQuery - O termo de busca (título da notícia).
 */
exports.getAllNews = async ({ page = 1, limit = 20, searchQuery = '' }) => {
    let searchSql = '';
    const params = [];

    // Constrói a cláusula WHERE para a busca por título
    if (searchQuery) {
        searchSql = 'WHERE title LIKE ?';
        params.push(`%${searchQuery}%`);
    }

    // Busca o número total de notícias (respeitando a busca, se houver)
    const [[{ totalNews }]] = await pool.execute(`SELECT COUNT(*) as totalNews FROM news ${searchSql}`, params);

    // Adiciona os parâmetros de paginação
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    // Busca a lista paginada de notícias
    const [news] = await pool.execute(
        `SELECT * FROM news ${searchSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        params
    );

    return {
        news,
        totalNews,
        totalPages: Math.ceil(totalNews / limit),
        currentPage: page,
    };
};

exports.getNewsById = async (id) => {
    const [rows] = await pool.execute('SELECT * FROM news WHERE id = ?', [id]);
    if (rows.length === 0) throw new Error('Notícia não encontrada.');
    return rows[0];
};

exports.updateNews = async (id, newsData) => {
    const { title, content, author, image_url } = newsData;
    const [result] = await pool.execute(
        'UPDATE news SET title = ?, content = ?, author = ?, image_url = ? WHERE id = ?',
        [title, content, author, image_url, id]
    );
    if (result.affectedRows === 0) throw new Error('Notícia não encontrada para atualizar.');
    return { id, ...newsData };
};

exports.deleteNews = async (id) => {
    const [result] = await pool.execute('DELETE FROM news WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new Error('Notícia não encontrada para deletar.');
    return { success: true };
};