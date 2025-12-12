import React, { useState } from 'react';
import { createOrGetChat } from '../../api/chat';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import ChatWindow from './ChatWindow';

interface ChatButtonProps {
  orderId: string;
  providerId: string;
  activityId: string;
  providerName?: string;
  activityTitle?: string;
  variant?: 'success' | 'primary' | 'outline-primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onChatOpen?: (isOpen: boolean) => void;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  orderId,
  providerId,
  activityId,
  providerName,
  activityTitle,
  variant = 'success',
  size = 'sm',
  className = '',
  onChatOpen,
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [showChat, setShowChat] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChat = async () => {
    if (!user?.uid) {
      alert(
        language === 'es'
          ? 'Debes estar autenticado para chatear'
          : 'You must be authenticated to chat'
      );
      return;
    }

    setLoading(true);
    
    // Timeout de 10 segundos para evitar que se quede cargando indefinidamente
    const timeoutId = setTimeout(() => {
      setLoading(false);
      alert(
        language === 'es'
          ? 'El chat está tardando demasiado en abrirse. Por favor, verifica tu conexión e intenta nuevamente.'
          : 'Chat is taking too long to open. Please check your connection and try again.'
      );
    }, 10000);

    try {
      console.log('Opening chat with params:', { orderId, customerId: user.uid, providerId, activityId });
      
      const newChatId = await createOrGetChat({
        orderId,
        customerId: user.uid,
        providerId,
        activityId,
      });
      
      clearTimeout(timeoutId);
      console.log('Chat created/retrieved with ID:', newChatId);
      
      if (!newChatId) {
        throw new Error('No se pudo obtener el ID del chat');
      }
      
      setChatId(newChatId);
      setShowChat(true);
      onChatOpen?.(true);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error opening chat:', error);
      
      let errorMessage = language === 'es' 
        ? 'Error al abrir el chat. ' 
        : 'Error opening chat. ';
      
      if (error instanceof Error) {
        errorMessage += error.message;
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        errorMessage += String(error);
      }
      
      alert(errorMessage + (language === 'es' ? ' Por favor, intenta nuevamente.' : ' Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setChatId(null);
    onChatOpen?.(false);
  };

  const buttonClass = `btn btn-${variant} btn-${size} ${className}`;
  const isMobile = window.innerWidth < 992;

  return (
    <>
      <button
        className={buttonClass}
        onClick={handleOpenChat}
        disabled={loading || showChat}
        title={language === 'es' ? 'Chatear con proveedor' : 'Chat with supplier'}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            <span className="d-none d-md-inline">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </span>
          </>
        ) : (
          <>
            <i className="fas fa-comments me-1"></i>
            <span className="d-none d-md-inline">
              {language === 'es' ? 'Chatear con proveedor' : 'Chat with supplier'}
            </span>
          </>
        )}
      </button>

      {showChat && chatId && (
        <>
          {console.log('ChatButton: Rendering ChatWindow with chatId:', chatId, 'showChat:', showChat)}
          <ChatWindow
            chatId={chatId}
            providerName={providerName || ''}
            activityTitle={activityTitle}
            orderId={orderId}
            onClose={handleCloseChat}
            isMobile={isMobile}
          />
        </>
      )}
    </>
  );
};

export default ChatButton;

