// backend/src/services/payment.service.js
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const pool = require('../config/database');
const { getSettings } = require('./settings.service');

const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

exports.createMercadoPagoPreference = async (userId, cashAmount) => {
    const settings = await getSettings();
    const rate = parseFloat(settings.BRL_TO_CASH_RATE);

    if (!rate || rate <= 0) {
        throw { status: 500, message: 'A cotação para CASH não está configurada no servidor.' };
    }

    const finalPriceBRL = parseFloat((cashAmount / rate).toFixed(2));

    // ======================================================================
    // CERTIFIQUE-SE DE QUE ESTA PARTE ESTÁ CORRETA
    // A variável 'publicUrl' é declarada aqui, antes de ser usada.
    const publicUrl = process.env.PUBLIC_URL;
    if (!publicUrl) {
        throw { status: 500, message: 'PUBLIC_URL não está configurada no arquivo .env do servidor.' };
    }
    // ======================================================================

    const preferenceData = {
        items: [
            {
                id: `CASH-${cashAmount}-${userId}`,
                title: `${cashAmount.toLocaleString('pt-BR')} de CASH para Gunbound`,
                description: `Recarga de CASH para o usuário: ${userId}`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: finalPriceBRL,
            },
        ],
        back_urls: {
            success: `${publicUrl}/topup/success`,
            failure: `${publicUrl}/topup/failure`,
            pending: `${publicUrl}/topup/pending`,
        },
        auto_return: 'approved',
        notification_url: `${publicUrl}/api/v1/payments/mercado-pago-webhook`,
        external_reference: JSON.stringify({ userId, cashAmount }),
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceData });
    
    return result;
};

exports.handleMercadoPagoNotification = async (notification) => {
    if (notification.type === 'payment') {
        const paymentId = notification.data.id;
        console.log(`[MP Webhook] Recebida notificação para o pagamento ID: ${paymentId}`);

        const payment = new Payment(client);
        const paymentDetails = await payment.get({ id: paymentId });
        
        if (paymentDetails.status === 'approved' && paymentDetails.status_detail !== 'refunded') {
            const dbConnection = await pool.getConnection();
            try {
                await dbConnection.beginTransaction();

                const [existingPayment] = await dbConnection.execute('SELECT id FROM mercado_pago_payments WHERE payment_id = ?', [paymentId]);
                if (existingPayment.length > 0) {
                    console.log(`[MP Webhook] Pagamento ${paymentId} já processado. Ignorando.`);
                    await dbConnection.commit();
                    return { success: true, message: 'Pagamento já processado.' };
                }

                const { userId, cashAmount } = JSON.parse(paymentDetails.external_reference);

                if (!userId || !cashAmount) {
                    throw new Error(`External reference inválida para o pagamento ${paymentId}`);
                }
                
                console.log(`[MP Webhook] Creditando ${cashAmount} de CASH para o usuário ${userId}`);
                await dbConnection.execute(
                    'UPDATE cash SET Cash = Cash + ? WHERE ID = ?',
                    [cashAmount, userId]
                );

                await dbConnection.execute(
                    'INSERT INTO mercado_pago_payments (payment_id, user_id, cash_amount, status) VALUES (?, ?, ?, ?)',
                    [paymentId, userId, cashAmount, 'approved']
                );

                await dbConnection.commit();
                console.log(`[MP Webhook] Processamento do pagamento ${paymentId} concluído com sucesso.`);
                return { success: true };

            } catch (error) {
                await dbConnection.rollback();
                console.error(`[MP Webhook] Erro CRÍTICO ao processar pagamento ${paymentId}:`, error);
                throw error;
            } finally {
                dbConnection.release();
            }
        }
    }
    return { success: true, message: 'Notificação recebida, mas nenhuma ação necessária.' };
};