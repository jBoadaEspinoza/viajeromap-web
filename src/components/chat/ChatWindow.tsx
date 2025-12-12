import React, { useState, useEffect, useRef } from 'react';
import { Message, listenMessages, sendMessage, markAsSeenByCustomer } from '../../api/chat';
import { Timestamp } from 'firebase/firestore';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface ChatWindowProps {
  chatId: string;
  providerName: string;
  activityTitle?: string;
  orderId: string;
  onClose: () => void;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  chatId,
  providerName,
  activityTitle,
  orderId,
  onClose,
  isMobile = false,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Log cuando el componente se monta
  useEffect(() => {
    console.log('ChatWindow mounted with chatId:', chatId, 'isMobile:', isMobile);
  }, [chatId, isMobile]);

  // Log cuando el componente se monta
  useEffect(() => {
    console.log('ChatWindow mounted with chatId:', chatId);
  }, [chatId]);

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Escuchar mensajes en tiempo real y marcar como leídos
  useEffect(() => {
    if (!chatId) return;

    setLoading(true);
    const unsubscribe = listenMessages(chatId, async (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      
      // Marcar mensajes como leídos cuando el cliente ve el chat
      // Solo si hay mensajes y el usuario está autenticado
      if (newMessages.length > 0 && user?.uid) {
        try {
          await markAsSeenByCustomer(chatId);
        } catch (error) {
          console.error('Error marking messages as seen:', error);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, user?.uid]);

  // Marcar como leído cuando se abre el chat
  useEffect(() => {
    if (chatId && user?.uid) {
      markAsSeenByCustomer(chatId).catch((error) => {
        console.error('Error marking chat as seen on open:', error);
      });
    }
  }, [chatId, user?.uid]);

  // Manejar envío de mensajes
  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!user?.uid) {
      alert(language === 'es' ? 'Debes estar autenticado para enviar mensajes' : 'You must be authenticated to send messages');
      return;
    }

    setSending(true);
    try {
      await sendMessage({
        chatId,
        customerId: user.uid,
        text,
        imageFile,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      alert(
        language === 'es'
          ? 'Error al enviar el mensaje. Por favor, intenta nuevamente.'
          : 'Error sending message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const isCustomer = (message: Message) => {
    // Usar senderType para determinar si es cliente o proveedor
    return message.senderType === 'customer';
  };

  // Renderizar mensajes
  const renderMessages = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">
              {language === 'es' ? 'Cargando mensajes...' : 'Loading messages...'}
            </span>
          </div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="text-center text-muted py-5">
          <i className="fas fa-comments fa-2x mb-2"></i>
          <p className="mb-0 small">
            {language === 'es'
              ? `Inicia una conversación con ${providerName || 'el proveedor'}`
              : `Start a conversation with ${providerName || 'the provider'}`}
          </p>
        </div>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.message}
            imageUrl={message.imageUrl}
            sentAt={message.sentAt}
            isCustomer={isCustomer(message)}
          />
        ))}
        <div ref={messagesEndRef} />
      </>
    );
  };

  // Versión Desktop: Panel lateral
  if (!isMobile) {
    return (
      <div
        className="d-none d-lg-block position-fixed"
        style={{
          right: 0,
          top: '70px',
          width: '350px',
          height: 'calc(100vh - 70px)',
          backgroundColor: '#fff',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="card h-100 border-0 rounded-0 shadow-none" style={{ borderRadius: '0 !important' }}>
          {/* Header */}
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center border-0 rounded-0">
            <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
              <h6 className="mb-0 fw-bold d-flex align-items-center" style={{ overflow: 'hidden' }}>
                <i className="fas fa-comments me-2 flex-shrink-0"></i>
                <span className="text-truncate" style={{ maxWidth: '220px' }}>
                  {activityTitle || providerName || (language === 'es' ? 'Chat' : 'Chat')}
                </span>
              </h6>
              {orderId && (
                <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                  {language === 'es' ? 'Orden' : 'Order'} #{orderId}
                </small>
              )}
            </div>
            <button
              type="button"
              className="btn btn-link text-white p-0 flex-shrink-0"
              onClick={onClose}
              style={{ fontSize: '1.2rem', lineHeight: '1' }}
              aria-label={language === 'es' ? 'Cerrar chat' : 'Close chat'}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          {/* Mensajes */}
          <div className="card-body d-flex flex-column p-0" style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            <div
              ref={messagesContainerRef}
              className="flex-grow-1 overflow-auto p-3"
              style={{
                backgroundColor: '#f8f9fa',
                minHeight: 0,
              }}
            >
              {renderMessages()}
            </div>

            {/* Input */}
            <ChatInput onSendMessage={handleSendMessage} disabled={sending} language={language} />
          </div>
        </div>
      </div>
    );
  }

  // Versión Móvil: Pantalla completa
  return (
    <div
      className="d-lg-none position-fixed"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
          <h6 className="mb-0 fw-bold d-flex align-items-center" style={{ overflow: 'hidden' }}>
            <i className="fas fa-comments me-2 flex-shrink-0"></i>
            <span className="text-truncate" style={{ maxWidth: 'calc(100vw - 120px)' }}>
              {activityTitle || providerName || (language === 'es' ? 'Chat' : 'Chat')}
            </span>
          </h6>
          {orderId && (
            <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
              {language === 'es' ? 'Orden' : 'Order'} #{orderId}
            </small>
          )}
        </div>
        <button
          type="button"
          className="btn btn-link text-white p-0 flex-shrink-0"
          onClick={onClose}
          style={{ fontSize: '1.5rem', lineHeight: '1' }}
          aria-label={language === 'es' ? 'Cerrar chat' : 'Close chat'}
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
        <div
          ref={messagesContainerRef}
          className="flex-grow-1 overflow-auto p-3"
          style={{
            backgroundColor: '#f8f9fa',
            minHeight: 0,
          }}
        >
          {renderMessages()}
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} disabled={sending} language={language} />
      </div>
    </div>
  );
};

export default ChatWindow;

