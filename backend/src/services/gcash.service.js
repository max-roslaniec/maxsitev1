// backend/src/services/gcash.service.js
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const pool = require('../config/database');

const GCASH_DECIMALS = 9;

exports.verifyAndProcessTx = async (txid, userId, itemId) => {
    console.log(`[GCASH Service] Iniciando verificação para TXID: ${txid}, User: ${userId}, Item: ${itemId}`);

    const treasureWalletAddress = process.env.TREASURE_WALLET_ADDRESS;
    const gcashTokenAddress = process.env.GCASH_TOKEN_ADDRESS;

    if (!treasureWalletAddress || !gcashTokenAddress) {
        throw { status: 500, message: 'Variáveis de ambiente da loja não configuradas no servidor.' };
    }

    const dbConnection = await pool.getConnection();
    try {
        await dbConnection.beginTransaction();

        const [existingTx] = await dbConnection.execute('SELECT id FROM gcash_transactions WHERE txid = ?', [txid]);
        if (existingTx.length > 0) {
            throw { status: 409, message: 'Este pagamento já foi processado anteriormente.' };
        }

        const [itemRows] = await dbConnection.execute('SELECT name, price_gcash, duration FROM shop_items WHERE itemId = ?', [itemId]);
        if (itemRows.length === 0) {
            throw { status: 404, message: `O item com ID ${itemId} não foi encontrado na loja.` };
        }
        const item = itemRows[0];
        
        if (item.price_gcash === null || item.price_gcash === undefined) {
             throw { status: 400, message: 'Este item não está à venda por GCASH.' };
        }
        
        const expectedAmountRaw = item.price_gcash * (10 ** GCASH_DECIMALS);

        const mintPublicKey = new PublicKey(gcashTokenAddress);
        const treasurePublicKey = new PublicKey(treasureWalletAddress);
        const expectedDestinationAta = await getAssociatedTokenAddress(mintPublicKey, treasurePublicKey);

        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
        const txDetails = await connection.getParsedTransaction(txid, { maxSupportedTransactionVersion: 0 });

        if (!txDetails) {
            throw { status: 404, message: 'Transação não encontrada na blockchain. Verifique o TXID.' };
        }
        if (txDetails.meta.err) {
            throw { status: 400, message: 'A transação na blockchain falhou.' };
        }
        
        const validationResult = findAndValidateSplTransfer(txDetails, {
            expectedMint: gcashTokenAddress,
            expectedDestination: expectedDestinationAta.toBase58(),
            expectedAmount: expectedAmountRaw
        });

        if (!validationResult.isValid) {
            throw { status: 400, message: `Verificação da transação falhou: ${validationResult.reason}` };
        }

        let expireDate = null;
        let expireType = 'I';

        if (item.duration === 'Mensal') {
            expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 30);
            expireType = 'M';
        }

        const [maxNoRows] = await dbConnection.execute('SELECT MAX(`No`) as maxNo FROM chest');
        const newNo = (maxNoRows[0].maxNo || 0) + 1;
        
        await dbConnection.execute(
            'INSERT INTO chest (`No`, Item, Wearing, Acquisition, Expire, Volume, PlaceOrder, Recovered, Owner, ExpireType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [newNo, itemId, 0, 'C', expireDate, 1, 0, 0, userId, expireType]
        );

        await dbConnection.execute('INSERT INTO gcash_transactions (txid, user_id, item_id) VALUES (?, ?, ?)', [txid, userId, itemId]);

        await dbConnection.commit();

        return { success: true, message: `Pagamento confirmado! Você recebeu o item "${item.name}".` };

    } catch (error) {
        await dbConnection.rollback();
        console.error("ERRO DETALHADO no gcash.service:", error);
        throw error;
    } finally {
        dbConnection.release();
    }
};

function findAndValidateSplTransfer(txDetails, { expectedMint, expectedDestination, expectedAmount }) {
    const allInstructions = txDetails.transaction.message.instructions.slice();
    if (txDetails.meta.innerInstructions) {
        txDetails.meta.innerInstructions.forEach(inner => allInstructions.push(...inner.instructions));
    }
    const accountIndexMap = new Map();
    txDetails.transaction.message.accountKeys.forEach((key, index) => {
        accountIndexMap.set(key.pubkey.toBase58(), index);
    });

    for (const instruction of allInstructions) {
        if (instruction.parsed?.type === 'transfer' && instruction.program === 'spl-token') {
            const { source, destination, amount } = instruction.parsed.info;
            const receivedAmount = parseInt(amount, 10);
            
            const sourceAccountIndex = accountIndexMap.get(source);
            const preBalance = txDetails.meta.preTokenBalances.find(b => b.accountIndex === sourceAccountIndex);
            const foundMint = preBalance?.mint;

            console.log(`[GCASH Validator] Encontrada transferência de token:`);
            console.log(`  -> Destino (ATA) na transação: ${destination}`);
            console.log(`  -> Token (Mint) Verificado: ${foundMint}`);
            console.log(`  -> Valor (Raw): ${receivedAmount}`);

            if (foundMint !== expectedMint) {
                console.log(`  -> FALHA: O token transferido não é GCASH.`);
                continue;
            }
            if (destination !== expectedDestination) {
                console.log(`  -> FALHA: O destino está incorreto.`);
                continue;
            }
            if (receivedAmount !== expectedAmount) {
                console.log(`  -> FALHA: O valor está incorreto.`);
                continue;
            }

            console.log(`  -> SUCESSO: Todos os parâmetros correspondem.`);
            return { isValid: true };
        }
    }

    console.log(`[GCASH Validator] Nenhuma transferência válida encontrada na transação.`);
    return { isValid: false, reason: 'A transferência do token GCASH com o valor e destino corretos não foi encontrada na transação.' };
}