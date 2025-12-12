import React from 'react';
import { Timestamp } from 'firebase/firestore';
import { formatTimestampToLocalTime } from '../../utils/chatUtils';

interface MessageBubbleProps {
  message: string | null;
  imageUrl: string | null;
  sentAt: Timestamp;
  isCustomer: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, imageUrl, sentAt, isCustomer }) => {
  const timeStr = formatTimestampToLocalTime(sentAt);

  return (
    <div className={`d-flex justify-content-${isCustomer ? 'end' : 'start'} mb-3`}>
      <div
        className={`d-flex flex-column ${
          isCustomer ? 'align-items-end' : 'align-items-start'
        }`}
        style={{ maxWidth: '70%' }}
      >
        {/* Imagen si existe */}
        {imageUrl && (
          <div className="mb-2">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <img
                src={imageUrl}
                alt="Mensaje"
                className="img-fluid"
                style={{
                  maxWidth: '300px',
                  maxHeight: '300px',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Mensaje de texto */}
        {message && (
          <div
            className={`p-2 rounded-3 ${
              isCustomer
                ? 'bg-primary text-white'
                : 'bg-light text-dark border'
            }`}
            style={{
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message}
          </div>
        )}

        {/* Timestamp */}
        <small
          className={`text-muted mt-1 ${isCustomer ? 'text-end' : 'text-start'}`}
          style={{ fontSize: '0.75rem' }}
        >
          {timeStr}
        </small>
      </div>
    </div>
  );
};

export default MessageBubble;

