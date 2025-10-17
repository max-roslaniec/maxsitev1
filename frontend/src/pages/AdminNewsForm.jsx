// src/pages/AdminNewsForm.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Editor } from '@tinymce/tinymce-react';

function AdminNewsForm() {
  const { id } = useParams(); // Pega o 'id' da URL, se for uma edição
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const editorRef = useRef(null); // Referência para pegar o conteúdo do editor

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(user?.nickname || 'Admin');
  const [imageUrl, setImageUrl] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      // Se estiver editando, busca os dados da notícia para preencher o formulário
      const fetchArticle = async () => {
        try {
          const response = await api.get(`/admin/news/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const article = response.data;
          setTitle(article.title);
          setAuthor(article.author);
          setImageUrl(article.image_url || '');
          setInitialContent(article.content);
        } catch (err) {
          setError('Não foi possível carregar os dados da notícia.');
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    } else {
      setLoading(false); // Se não estiver editando, não precisa carregar nada
    }
  }, [id, isEditing, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!title || !author) {
        setError('Título e Autor são campos obrigatórios.');
        return;
    }

    const articleData = {
      title,
      author,
      image_url: imageUrl,
      content: editorRef.current ? editorRef.current.getContent() : ''
    };

    try {
      if (isEditing) {
        // Atualiza a notícia existente
        await api.put(`/admin/news/${id}`, articleData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Cria uma nova notícia
        await api.post('/admin/news', articleData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      navigate('/admin/news'); // Volta para a lista de notícias após salvar
    } catch (err) {
      setError('Ocorreu um erro ao salvar a notícia.');
      console.error(err);
    }
  };

  if (loading) {
    return <p>Carregando formulário...</p>;
  }

  return (
    <div>
      <h1>{isEditing ? 'Editar Notícia' : 'Criar Nova Notícia'}</h1>
      {error && <p className="message error">{error}</p>}
      
      <form onSubmit={handleSubmit} className="hightech-form" style={{maxWidth: '100%', alignItems: 'stretch'}}>
        <div className="form-group">
          <label htmlFor="title">Título</label>
          <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="author">Autor</label>
          <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="imageUrl">URL da Imagem de Capa (Opcional)</label>
          <input type="text" id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Conteúdo</label>
          <Editor
            apiKey="no-api-key" // Funciona localmente sem chave, mas para produção pegue uma grátis em tiny.cloud
            onInit={(evt, editor) => editorRef.current = editor}
            initialValue={initialContent}
            init={{
              height: 500,
              menubar: false,
              plugins: 'anchor autolink link lists searchreplace table wordcount',
              toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link | removeformat',
              content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
            }}
          />
        </div>
        <button type="submit" className="register-button" style={{width: 'auto', alignSelf: 'flex-end'}}>
          Salvar Notícia
        </button>
      </form>
    </div>
  );
}

export default AdminNewsForm;