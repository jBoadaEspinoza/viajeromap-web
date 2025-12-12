import React, { useState, useEffect, useRef } from 'react';
import { 
  Message, 
  listenMessages, 
  sendMessageAsCustomer, 
  markAsSeenByCustomer,
  getOrCreateChat 
} from '../../api/fireChatClient';
import MessageBubbleClient from './MessageBubbleClient';
import ChatInputClient from './ChatInputClient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { OrderItemResponse } from '../../api/orders';

interface ChatWindowClientProps {
  chatId: string; // orderItemId como string
  orderItem: OrderItemResponse;
  onClose: () => void;
  isMobile?: boolean;
}

const ChatWindowClient: React.FC<ChatWindowClientProps> = ({
  chatId,
  orderItem,
  onClose,
  isMobile = false,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Inicializar chat al montar
  useEffect(() => {
    const initializeChat = async () => {
      if (!chatId || chatInitialized) return;

      try {
        console.log('ChatWindowClient - Inicializando chat con orderItem:', orderItem);
        await getOrCreateChat(orderItem);
        setChatInitialized(true);
      } catch (error) {
        console.error('Error inicializando chat:', error);
        alert(
          language === 'es'
            ? 'Error al inicializar el chat. Por favor, intenta nuevamente.'
            : 'Error initializing chat. Please try again.'
        );
      }
    };

    initializeChat();
  }, [chatId, orderItem, chatInitialized, language]);

  // Auto-scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Escuchar mensajes en tiempo real y marcar como leídos
  useEffect(() => {
    if (!chatId || !chatInitialized) return;

    setLoading(true);
    const unsubscribe = listenMessages(chatId, async (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
      
      // Marcar mensajes como leídos cuando el cliente ve el chat
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
  }, [chatId, chatInitialized, user?.uid]);

  // Marcar como leído cuando se abre el chat
  useEffect(() => {
    if (chatId && user?.uid && chatInitialized) {
      markAsSeenByCustomer(chatId).catch((error) => {
        console.error('Error marking chat as seen on open:', error);
      });
    }
  }, [chatId, user?.uid, chatInitialized]);

  // Manejar envío de mensajes
  const handleSendMessage = async (text: string, imageFile?: File) => {
    if (!user?.uid) {
      alert(
        language === 'es' 
          ? 'Debes estar autenticado para enviar mensajes' 
          : 'You must be authenticated to send messages'
      );
      return;
    }

    setSending(true);
    try {
      await sendMessageAsCustomer(chatId, user.uid, text, imageFile);
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
    return message.senderType === 'customer';
  };

  // Obtener nombre del proveedor
  const providerName = orderItem.activity?.supplier?.name || 
                       orderItem.activity?.title || 
                       (language === 'es' ? 'Proveedor' : 'Provider');

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
        <div 
          className="d-flex flex-column align-items-center justify-content-center"
          style={{
            height: '100%',
            minHeight: '300px',
            padding: '40px 20px',
          }}
        >
          {/* Iconos de burbujas superpuestas */}
          <div className="position-relative mb-3" style={{ width: '80px', height: '60px' }}>
            {/* Primera burbuja (atrás) */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '10px',
                width: '50px',
                height: '50px',
                backgroundColor: '#e0e0e0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <i className="fas fa-comment" style={{ fontSize: '24px', color: '#9e9e9e' }}></i>
            </div>
            {/* Segunda burbuja (adelante) */}
            <div
              style={{
                position: 'absolute',
                right: '0',
                top: '0',
                width: '50px',
                height: '50px',
                backgroundColor: '#e0e0e0',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <i className="fas fa-comment" style={{ fontSize: '24px', color: '#9e9e9e' }}></i>
            </div>
          </div>
          
          {/* Texto */}
          <p 
            className="text-center mb-0"
            style={{
              fontSize: '14px',
              color: '#757575',
              fontWeight: 'normal',
              lineHeight: '1.5',
              maxWidth: '280px',
            }}
          >
            {language === 'es'
              ? `Inicia una conversación con ${providerName.toUpperCase()}`
              : `Start a conversation with ${providerName.toUpperCase()}`}
          </p>
        </div>
      );
    }

    return (
      <>
        {messages.map((message) => (
          <MessageBubbleClient
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
                  {orderItem.activity?.title || providerName}
                </span>
              </h6>
              <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                {language === 'es' ? 'Orden' : 'Order'} #{orderItem.orderId}
              </small>
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
              className="flex-grow-1 overflow-auto"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: `
                  url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='chatPattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='50' cy='50' r='1' fill='%23d4d4d4' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23chatPattern)'/%3E%3C/svg%3E")
                `,
                minHeight: 0,
                padding: '10px 0',
              }}
            >
              {renderMessages()}
            </div>

            {/* Input */}
            <ChatInputClient 
              onSendMessage={handleSendMessage} 
              disabled={sending || !chatInitialized} 
              language={language} 
            />
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
              {orderItem.activity?.title || providerName}
            </span>
          </h6>
          <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
            {language === 'es' ? 'Orden' : 'Order'} #{orderItem.orderId}
          </small>
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
          className="flex-grow-1 overflow-auto"
          style={{
            backgroundColor: '#efeae2',
            backgroundImage: `
              url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='chatPattern' x='0' y='0' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='50' cy='50' r='1' fill='%23d4d4d4' opacity='0.3'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23chatPattern)'/%3E%3C/svg%3E")
            `,
            minHeight: 0,
            padding: '10px 0',
          }}
        >
          {renderMessages()}
        </div>

        {/* Input */}
        <ChatInputClient 
          onSendMessage={handleSendMessage} 
          disabled={sending || !chatInitialized} 
          language={language} 
        />
      </div>
    </div>
  );
};

export default ChatWindowClient;

