import { useEffect } from 'react';
import styles from './GachaModal.module.css';

function GachaModal({ reward, onClose }) {

  useEffect(() => {
    // Trava o scroll da página ao fundo quando o modal estiver aberto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!reward) return null;

  const getRewardImage = () => {
    let imageUrl = '/images/portal/default_item.png'; // Imagem padrão

    // Prioridade 1: Se a recompensa tiver uma imagem específica, use-a.
    if (reward.image) {
      imageUrl = `${import.meta.env.VITE_API_URL}${reward.image}`;
    } 
    // Prioridade 2: Se não tiver imagem, use os placeholders para GOLD ou CASH.
    else if (reward.type === 'GOLD') {
      imageUrl = '/images/portal/gold.png'; 
    } else if (reward.type === 'CASH') {
      imageUrl = '/images/portal/cash.png';
    }

    return imageUrl;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      {/* Evita que o clique no conteúdo feche o modal */}
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.rewardCard}>

          
          <button onClick={onClose} className={styles.closeButton}>&times;</button>

          <div className={styles.rewardHeader}>
            <h2>Você Ganhou!</h2>
          </div>

          <div className={styles.rewardImageContainer}>
            <img src={getRewardImage()} alt={reward.name} className={styles.rewardImage} />
          </div>

          <div className={styles.rewardInfo}>
            <h3>{reward.name}</h3>
            {reward.type !== 'ITEM' && <p>+ {reward.value.toLocaleString('pt-BR')}</p>}
          </div>

        </div>

      </div>
    </div>
  );
}

export default GachaModal;
