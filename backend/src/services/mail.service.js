// src/services/mail.service.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configura o 'transporter' do nodemailer usando as credenciais do .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true para a porta 465, false para outras
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Adicionando configuração de depuração
  logger: true,
  debug: true 
});

/**
 * Envia um e-mail de redefinição de senha.
 * @param {string} to - O e-mail do destinatário.
 * @param {string} token - O token de redefinição de senha (não hasheado).
 */
const sendPasswordResetEmail = async (to, token) => {
  // O ideal é que a URL base do frontend também venha de uma variável de ambiente
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: `"Gunbound Contas" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: 'Redefinição de Senha - Gunbound',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Redefinição de Senha</h2>
        <p>Olá,</p>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez esta solicitação, pode ignorar este e-mail.</p>
        <p>Para redefinir sua senha, clique no link abaixo:</p>
        <p style="text-align: center;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
        </p>
        <p>O link irá expirar em 15 minutos.</p>
        <p>Atenciosamente,<br>Equipe Gunbound</p>
      </div>
    `,
  };

  try {
    console.log(`[MAIL-DEBUG] Tentando enviar e-mail para: ${to}`);
    console.log(`[MAIL-DEBUG] Opções de envio:`, JSON.stringify(mailOptions, null, 2));
    let info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL-DEBUG] E-mail de redefinição de senha enviado para: ${to}`);
    console.log(`[MAIL-DEBUG] Resposta do servidor: ${info.response}`);
    console.log(`[MAIL-DEBUG] Message ID: ${info.messageId}`);

  } catch (error) {
    console.error(`[MAIL-ERROR] Erro detalhado ao enviar e-mail para ${to}:`, error);
    throw new Error('Falha ao enviar o e-mail de redefinição de senha.');
  }
};

module.exports = {
  sendPasswordResetEmail,
};
