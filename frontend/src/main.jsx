// src/main.jsx
import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// --- NOVAS IMPORTAÇÕES PARA A CARTEIRA SOLANA ---
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// --- CORREÇÃO APLICADA AQUI ---
// Alterado de 'require' para 'import' para manter o padrão do projeto (ES Modules)
import '@solana/wallet-adapter-react-ui/styles.css';


const Main = () => {
  // Configurando a rede da Solana. Usaremos 'devnet' para testes.
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Lista de carteiras que nosso site irá suportar. Começaremos com a Phantom.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [network]
  );

  return (
    <React.StrictMode>
      <BrowserRouter>
        {/* Provedor de Conexão com a Blockchain */}
        <ConnectionProvider endpoint={endpoint}>
          {/* Provedor que gerencia as carteiras */}
          <WalletProvider wallets={wallets} autoConnect>
            {/* Provedor para os componentes visuais (ex: modal de seleção de carteira) */}
            <WalletModalProvider>
              {/* Nosso provedor de autenticação original continua aqui */}
              <AuthProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </AuthProvider>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
};

// A renderização foi movida para dentro de um componente Main para seguir as boas práticas do React
ReactDOM.createRoot(document.getElementById('root')).render(<Main />);