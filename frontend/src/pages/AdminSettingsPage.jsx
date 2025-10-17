// frontend/src/pages/AdminSettingsPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import styles from '../admin.module.css';

function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        BRL_TO_CASH_RATE: '',
        SOL_TO_GCASH_RATE: '',
        GOLD_TO_GCASH_RATE: '',
        GCASH_TO_BRL_RATE: '', // Adicionado
        isRankingEnabled: 'true',
        isShopEnabled: 'true',
        isGuildDirectoryEnabled: 'true',
        isGuildRankingEnabled: 'true',
        isTopUpEnabled: 'true',
        isSwapEnabled: 'true',
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const { accessToken } = useAuth(); // Alterado de 'token' para 'accessToken'

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // CORREÇÃO: Header de autorização removido
                const response = await api.get('/admin/settings');
                setSettings(prev => ({ ...prev, ...response.data }));
            } catch (error) {
                setMessage('Erro: Não foi possível carregar as configurações.');
                console.error("Erro ao buscar configurações:", error);
            } finally {
                setLoading(false);
            }
        };

        if (accessToken) {
            fetchSettings();
        }
    }, [accessToken]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: type === 'checkbox' ? checked.toString() : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            // CORREÇÃO: Header de autorização removido
            const response = await api.post('/admin/settings', settings);
            setMessage(response.data.message);
        } catch (error) {
            setMessage('Erro: Falha ao salvar as configurações.');
            console.error("Erro ao salvar configurações:", error);
        }
    };

    if (loading) {
        return <p>Carregando configurações...</p>;
    }

    return (
        <div>
            <h1>Configurações da Loja e SWAP</h1>
            <p>Defina as taxas de conversão para as moedas do jogo.</p>
            
            <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
                <div className={styles.adminFormContainer} style={{gridTemplateColumns: '1fr'}}>
                    <div className={styles.formGroup}>
                        <label htmlFor="BRL_TO_CASH_RATE">Valor de CASH por 1 BRL</label>
                        <input
                            type="number"
                            id="BRL_TO_CASH_RATE"
                            name="BRL_TO_CASH_RATE"
                            value={settings.BRL_TO_CASH_RATE || ''}
                            onChange={handleChange}
                            placeholder="Ex: 10000"
                        />
                        <small>Exemplo: Se 1 BRL compra 10,000 CASH, digite 10000.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="SOL_TO_GCASH_RATE">Valor de GCASH por 1 SOL</label>
                        <input
                            type="number"
                            id="SOL_TO_GCASH_RATE"
                            name="SOL_TO_GCASH_RATE"
                            value={settings.SOL_TO_GCASH_RATE || ''}
                            onChange={handleChange}
                            placeholder="Ex: 500000"
                        />
                        <small>Exemplo: Se 1 SOL compra 500,000 GCASH, digite 500000.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="GOLD_TO_GCASH_RATE">Quantidade de GOLD para 1 GCASH</label>
                        <input
                            type="number"
                            id="GOLD_TO_GCASH_RATE"
                            name="GOLD_TO_GCASH_RATE"
                            value={settings.GOLD_TO_GCASH_RATE || ''}
                            onChange={handleChange}
                            placeholder="Ex: 1000"
                        />
                        <small>Exemplo: Se 1,000 GOLD é trocado por 1 GCASH, digite 1000.</small>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="GCASH_TO_BRL_RATE">Valor em BRL para 1 GCASH</label>
                        <input
                            type="number"
                            step="0.01"
                            id="GCASH_TO_BRL_RATE"
                            name="GCASH_TO_BRL_RATE"
                            value={settings.GCASH_TO_BRL_RATE || ''}
                            onChange={handleChange}
                            placeholder="Ex: 0.05"
                        />
                        <small>Exemplo: Se 1 GCASH vale R$ 0,05, digite 0.05.</small>
                    </div>
                </div>

                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <button type="submit" className={styles.buttonSave}>
                        Salvar Configurações
                    </button>
                </div>
            </form>

            <h2 style={{marginTop: '3rem'}}>Ativar/Desativar Páginas Públicas</h2>
            <form onSubmit={handleSubmit} style={{marginTop: '2rem'}}>
                <div className={styles.adminFormContainer} style={{gridTemplateColumns: '1fr'}}>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isRankingEnabled"
                                checked={settings.isRankingEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Página de Ranking
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isShopEnabled"
                                checked={settings.isShopEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Página da Loja
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isGuildDirectoryEnabled"
                                checked={settings.isGuildDirectoryEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Diretório de Guilds
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isGuildRankingEnabled"
                                checked={settings.isGuildRankingEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Ranking de Guilds
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isTopUpEnabled"
                                checked={settings.isTopUpEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Página de Top-Up
                        </label>
                    </div>
                    <div className={styles.formGroup}>
                        <label>
                            <input
                                type="checkbox"
                                name="isSwapEnabled"
                                checked={settings.isSwapEnabled === 'true'}
                                onChange={handleChange}
                            />
                            Ativar Página de Troca (SWAP)
                        </label>
                    </div>
                </div>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                    <button type="submit" className={styles.buttonSave}>
                        Salvar Configurações das Páginas
                    </button>
                </div>
            </form>

            {message && (
                <div 
                    className="message success"
                    style={{ marginTop: '1.5rem', textAlign: 'center' }}
                >
                    {message}
                </div>
            )}
        </div>
    );
}

export default AdminSettingsPage;