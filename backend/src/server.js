// backend/src/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', true);

// --- Middlewares Essenciais ---
app.use(cors());
app.use(express.json());

// --- SERVIR ARQUIVOS ESTÁTICOS ---
app.use(express.static('public'));

// --- Rotas da API ---
const authRoutes = require('./routes/auth.routes');
const publicRoutes = require('./routes/public.routes');
const shopRoutes = require('./routes/shop.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const gcashRoutes = require('./routes/gcash.routes');
const paymentRoutes = require('./routes/payment.routes');
const swapRoutes = require('./routes/swap.routes');
const guildRoutes = require('./routes/guild.routes');
const notificationRoutes = require('./routes/notification.routes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/gcash', gcashRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/swap', swapRoutes);
app.use('/api/v1/guilds', guildRoutes);
app.use('/api/v1/notifications', notificationRoutes); // <-- Rota de notificações
app.use('/api/v1', publicRoutes);

app.get('/api/v1', (req, res) => {
  res.json({ message: 'API do Servidor GunBound está no ar!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor da API rodando em http://localhost:${PORT}`);
});