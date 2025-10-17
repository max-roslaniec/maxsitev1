// backend/src/services/swap.service.js
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const pool = require('../config/database');
const { getSettings } = require('./settings.service');
const userService = require('./user.service');
const notificationService = require('./notification.service');

const GCASH_DECIMALS = 9; // GCash tem 9 casas decimais

// ====================================================================
// FUNÇÕES PARA O JOGADOR
// ====================================================================

exports.createSwapRequest = async (userId, goldAmount, solanaWallet) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const settings = await getSettings();
        const rate = parseFloat(settings.GOLD_TO_GCASH_RATE);
        if (!rate || rate <= 0) {
            throw { status: 500, message: 'A cotação para GOLD -> GCASH não está configurada.' };
        }
        const [userGameRows] = await connection.execute('SELECT Money FROM game WHERE Id = ? FOR UPDATE', [userId]);
        if (userGameRows.length === 0) {
            throw { status: 404, message: 'Dados de jogo do usuário não encontrados.' };
        }
        const currentUserGold = userGameRows[0].Money;
        if (currentUserGold < goldAmount) {
            throw { status: 400, message: 'Você não tem GOLD suficiente para realizar esta troca.' };
        }
        const gcashAmount = Math.floor(goldAmount / rate);
        if (gcashAmount <= 0) {
            throw { status: 400, message: 'A quantidade de GOLD é muito baixa para gerar ao menos 1 GCASH.' };
        }
        await connection.execute(
            'UPDATE game SET Money = Money - ? WHERE Id = ?',
            [goldAmount, userId]
        );
        await connection.execute(
            `INSERT INTO swap_requests (user_id, gold_amount, gcash_amount, solana_wallet, status, type)
             VALUES (?, ?, ?, ?, 'Pendente', 'gold_to_gcash')`,
            [userId, goldAmount, gcashAmount, solanaWallet]
        );

        const [userRows] = await connection.execute('SELECT NickName FROM user WHERE Id = ?', [userId]);
        const userNickName = userRows.length > 0 ? userRows[0].NickName : userId;

        const adminIds = await userService.getAdminUserIds(connection);
        const notificationPromises = adminIds.map(adminId =>
            notificationService.createNotification(
                adminId,
                `Novo SWAP (Gold->GCash) de ${userNickName}: ${goldAmount} Gold.`,
                connection
            )
        );
        await Promise.all(notificationPromises);

        await connection.commit();
        return { success: true, message: `Sua solicitação para trocar ${goldAmount.toLocaleString('pt-BR')} GOLD por ${gcashAmount.toLocaleString('pt-BR')} GCASH foi enviada com sucesso! O valor de GOLD já foi debitado da sua conta.` };
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao criar solicitação de SWAP (Gold->GCash):", error);
        throw error;
    } finally {
        connection.release();
    }
};

exports.verifyAndCreateGcashToBrlSwap = async (userId, txid, pixKey) => {
    console.log(`[SWAP Service] Iniciando verificação de SWAP (GCASH->BRL) para TXID: ${txid}, User: ${userId}`);

    const treasureWalletAddress = process.env.TREASURE_WALLET_ADDRESS;
    const gcashTokenAddress = process.env.GCASH_TOKEN_ADDRESS;

    if (!treasureWalletAddress || !gcashTokenAddress) {
        throw { status: 500, message: 'Variáveis de ambiente da loja não configuradas no servidor.' };
    }

    const dbConnection = await pool.getConnection();
    try {
        await dbConnection.beginTransaction();

        const solConnection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const txDetails = await solConnection.getParsedTransaction(txid, { maxSupportedTransactionVersion: 0 });

        if (!txDetails) {
            throw { status: 404, message: 'Transação não encontrada na blockchain. Verifique o TXID.' };
        }
        if (txDetails.meta.err) {
            throw { status: 400, message: 'A transação na blockchain falhou.' };
        }

        const mintPublicKey = new PublicKey(gcashTokenAddress);
        const treasurePublicKey = new PublicKey(treasureWalletAddress);
        const expectedDestinationAta = await getAssociatedTokenAddress(mintPublicKey, treasurePublicKey);

        const validationResult = findAndValidateSwapTransfer(txDetails, {
            expectedMint: gcashTokenAddress,
            expectedDestination: expectedDestinationAta.toBase58(),
        });

        if (!validationResult.isValid) {
            throw { status: 400, message: `Verificação da transação falhou: ${validationResult.reason}` };
        }
        
        const transferredAmount = validationResult.amount / (10 ** GCASH_DECIMALS);
        console.log(`[SWAP Service] Verificação da blockchain CONCLUÍDA. Valor transferido: ${transferredAmount} GCASH.`);

        const settings = await getSettings();
        const rate = parseFloat(settings.GCASH_TO_BRL_RATE);
        if (!rate || rate <= 0) {
            throw { status: 500, message: 'A cotação para GCASH -> BRL não está configurada.' };
        }
        const brlAmount = (transferredAmount * rate).toFixed(2);

        await dbConnection.execute(
            `INSERT INTO swap_requests (user_id, gcash_amount_brl, brl_amount, pix_key, status, type, transaction_id)
             VALUES (?, ?, ?, ?, 'Pendente', 'gcash_to_brl', ?)`,
            [userId, transferredAmount, brlAmount, pixKey, txid]
        );

        const [userRows] = await dbConnection.execute('SELECT NickName FROM user WHERE Id = ?', [userId]);
        const userNickName = userRows.length > 0 ? userRows[0].NickName : userId;

        const adminIds = await userService.getAdminUserIds(dbConnection);
        const notificationPromises = adminIds.map(adminId =>
            notificationService.createNotification(
                adminId,
                `Novo SWAP (GCash->BRL) de ${userNickName}: ${transferredAmount} GCash.`,
                dbConnection
            )
        );
        await Promise.all(notificationPromises);

        await dbConnection.commit();
        return { success: true, message: `Sua solicitação para trocar ${transferredAmount.toLocaleString('pt-BR')} GCASH por R$ ${brlAmount} foi enviada com sucesso!` };

    } catch (error) {
        await dbConnection.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
             throw { status: 409, message: 'Esta transação já foi processada para um swap.' };
        }
        console.error("ERRO DETALHADO no verifyAndCreateGcashToBrlSwap:", error);
        throw error;
    } finally {
        dbConnection.release();
    }
};

function findAndValidateSwapTransfer(txDetails, { expectedMint, expectedDestination }) {
    const signer = txDetails.transaction.message.accountKeys[0].pubkey.toBase58();

    const allInstructions = txDetails.transaction.message.instructions.slice();
    if (txDetails.meta.innerInstructions) {
        txDetails.meta.innerInstructions.forEach(inner => allInstructions.push(...inner.instructions));
    }

    for (const instruction of allInstructions) {
        if (instruction.parsed?.type === 'transfer' && instruction.program === 'spl-token') {
            const { source, destination, amount, authority } = instruction.parsed.info;
            
            if (authority !== signer) {
                continue; 
            }

            if (destination !== expectedDestination) {
                return { isValid: false, reason: 'O destino da transferência não é a carteira do site.' };
            }

            const accountIndexMap = new Map();
            txDetails.transaction.message.accountKeys.forEach((key, index) => {
                accountIndexMap.set(key.pubkey.toBase58(), index);
            });
            const sourceAccountIndex = accountIndexMap.get(source);
            const preBalance = txDetails.meta.preTokenBalances.find(b => b.accountIndex === sourceAccountIndex);
            const foundMint = preBalance?.mint;

            if (foundMint !== expectedMint) {
                return { isValid: false, reason: 'O token transferido não é GCASH.' };
            }
            
            const receivedAmount = parseInt(amount, 10);
            console.log(`[SWAP Validator] Transferência de ${receivedAmount} de ${foundMint} para ${destination} validada.`);
            return { isValid: true, amount: receivedAmount };
        }
    }

    return { isValid: false, reason: 'Nenhuma transferência de token válida para o swap foi encontrada na transação.' };
}


// ====================================================================
// FUNÇÕES PARA O PAINEL DE ADMIN (ATUALIZADAS)
// ====================================================================

exports.getSwapRequests = async ({ page = 1, limit = 20, searchQuery = '', status = 'Pendente', type = 'Todos' }) => {
    const connection = await pool.getConnection();
    try {
        let whereConditions = [];
        const params = [];

        if (status && status !== 'Todos') {
            whereConditions.push('s.status = ?');
            params.push(status);
        }
        
        if (type && type !== 'Todos') {
            whereConditions.push('s.type = ?');
            params.push(type);
        }

        if (searchQuery) {
            whereConditions.push('(s.id = ? OR s.user_id LIKE ? OR u.NickName LIKE ? OR s.solana_wallet LIKE ? OR s.pix_key LIKE ?)');
            const searchTerm = `%${searchQuery}%`;
            params.push(searchQuery, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        const whereSql = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const countQuery = `SELECT COUNT(*) as totalRequests FROM swap_requests s JOIN user u ON s.user_id = u.Id ${whereSql}`;
        const [[{ totalRequests }]] = await connection.execute(countQuery, params);

        const offset = (page - 1) * limit;
        const mainQuery = `
            SELECT 
                s.id, s.user_id, u.NickName, s.status, s.created_at, s.type,
                s.gold_amount, s.gcash_amount, s.solana_wallet,
                s.gcash_amount_brl, s.brl_amount, s.pix_key
            FROM swap_requests s
            JOIN user u ON s.user_id = u.Id
            ${whereSql}
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?`;
        
        const [requests] = await connection.execute(mainQuery, [...params, limit, offset]);

        return {
            requests,
            totalRequests,
            totalPages: Math.ceil(totalRequests / limit),
            currentPage: page,
        };
    } finally {
        connection.release();
    }
};

/**
 * Atualiza o status de uma solicitação de SWAP.
 */
exports.updateSwapRequestStatus = async (requestId, newStatus) => {
    // TODO: Implementar lógica de devolução de fundos se o status for 'Rejeitado'
    const [result] = await pool.execute(
        'UPDATE swap_requests SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, requestId]
    );
    if (result.affectedRows === 0) {
        throw { status: 404, message: 'Solicitação de SWAP não encontrada.' };
    }
    return { success: true, message: `Solicitação #${requestId} marcada como ${newStatus}.` };
};