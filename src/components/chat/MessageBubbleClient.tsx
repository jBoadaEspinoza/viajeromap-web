import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { formatTimestampToLocalTime } from '../../utils/chatUtils';

interface MessageBubbleClientProps {
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
  isCustomer: boolean;
  isSeen?: boolean; // Indica si el mensaje fue visto
}

const MessageBubbleClient: React.FC<MessageBubbleClientProps> = ({ 
  message, 
  imageUrl, 
  sentAt, 
  isCustomer,
  isSeen = false
}) => {
  const timeStr = formatTimestampToLocalTime(sentAt);

  // Colores originales: rojo primario para cliente, blanco para proveedor
  const bubbleColor = isCustomer ? '#DC143C' : '#ffffff';
  const textColor = isCustomer ? '#ffffff' : '#212529';
  const timestampColor = isCustomer ? 'rgba(255,255,255,0.8)' : '#6c757d';

  return (
    <div className={`d-flex justify-content-${isCustomer ? 'end' : 'start'} mb-1`} style={{ padding: '0 8px', marginBottom: '2px' }}>
      <div
        className="position-relative"
        style={{ 
          maxWidth: '75%', 
          minWidth: '120px',
        }}
      >
        {/* Burbuja de mensaje con cola */}
        <div
          style={{
            backgroundColor: bubbleColor,
            borderRadius: '7.5px',
            padding: '6px 7px 8px 9px',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            position: 'relative',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            marginBottom: '2px',
          }}
        >
          {/* Cola triangular - Cliente (derecha) */}
          {isCustomer && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: '-8px',
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '0 0 13px 13px',
                borderColor: `transparent transparent ${bubbleColor} transparent`,
                filter: 'drop-shadow(1px 1px 0.5px rgba(0,0,0,0.13))',
              }}
            />
          )}

          {/* Cola triangular - Proveedor (izquierda) */}
          {!isCustomer && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '-8px',
                width: 0,
                height: 0,
                borderStyle: 'solid',
                borderWidth: '0 13px 13px 0',
                borderColor: `transparent ${bubbleColor} transparent transparent`,
                filter: 'drop-shadow(-1px 1px 0.5px rgba(0,0,0,0.13))',
              }}
            />
          )}

          {/* Imagen si existe */}
          {imageUrl && (
            <div className="mb-1" style={{ borderRadius: '4px', overflow: 'hidden', marginTop: '2px' }}>
              <img
                src={imageUrl}
                alt="Mensaje"
                className="img-fluid"
                style={{
                  maxWidth: '100%',
                  maxHeight: '250px',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Mensaje de texto */}
          {message && (
            <div
              style={{
                color: textColor,
                fontSize: '14.2px',
                lineHeight: '1.4',
                marginBottom: imageUrl ? '4px' : '0',
                paddingRight: isCustomer ? '20px' : '0',
              }}
            >
              {message}
            </div>
          )}

          {/* Timestamp y checkmarks dentro de la burbuja - alineado a la derecha */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: '2px',
              paddingTop: '2px',
            }}
          >
            <small
              style={{
                fontSize: '11px',
                color: timestampColor,
                fontWeight: 'normal',
                lineHeight: '1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              {timeStr}
              {isCustomer && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '2px' }}>
                  {isSeen ? (
                    // Checkmarks dobles con color primary cuando fue visto
                    <svg width="16" height="13" viewBox="0 0 16 15" style={{ opacity: 1 }}>
                      <path
                        fill="#DC143C"
                        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.175a.366.366 0 0 0-.063-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.175a.365.365 0 0 0-.063-.51z"
                      />
                    </svg>
                  ) : (
                    // Checkmarks dobles en blanco cuando no fue visto
                    <svg width="16" height="13" viewBox="0 0 16 15" style={{ opacity: 0.8 }}>
                      <path
                        fill="rgba(255,255,255,0.9)"
                        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.175a.366.366 0 0 0-.063-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.175a.365.365 0 0 0-.063-.51z"
                      />
                    </svg>
                  )}
                </span>
              )}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubbleClient;

