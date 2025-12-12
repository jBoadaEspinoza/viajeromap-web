import React, { useState, useRef, ChangeEvent } from 'react';
import { isValidImageFile, createImagePreview, revokeImagePreview } from '../../utils/chatUtils';

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File) => void;
  disabled?: boolean;
  language?: 'es' | 'en';
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, language = 'es' }) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    const trimmedMessage = message.trim();

    // Validar que haya texto o imagen
    if (!trimmedMessage && !selectedImage) {
      return;
    }

    // Enviar mensaje
    onSendMessage(trimmedMessage, selectedImage || undefined);

    // Limpiar estado
    setMessage('');
    setSelectedImage(null);
    if (imagePreview) {
      revokeImagePreview(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar archivo
    if (!isValidImageFile(file)) {
      alert(
        language === 'es'
          ? 'Por favor, selecciona una imagen válida (JPG, PNG, GIF, WEBP) de máximo 5MB'
          : 'Please select a valid image (JPG, PNG, GIF, WEBP) with a maximum size of 5MB'
      );
      return;
    }

    // Crear preview
    const preview = createImagePreview(file);
    if (preview) {
      setImagePreview(preview);
      setSelectedImage(file);
    } else {
      alert(
        language === 'es'
          ? 'Error al cargar la imagen'
          : 'Error loading image'
      );
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setImagePreview(null);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-top p-3 bg-white">
      {/* Preview de imagen */}
      {imagePreview && (
        <div className="mb-2 position-relative d-inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: '150px',
              maxHeight: '150px',
              borderRadius: '8px',
              objectFit: 'cover',
            }}
          />
          <button
            type="button"
            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
            onClick={handleRemoveImage}
            style={{
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="fas fa-times" style={{ fontSize: '0.75rem' }}></i>
          </button>
        </div>
      )}

      {/* Input y botones */}
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder={language === 'es' ? 'Escribe un mensaje...' : 'Type a message...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          style={{ backgroundColor: disabled ? '#f8f9fa' : '#fff', cursor: disabled ? 'not-allowed' : 'text' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title={language === 'es' ? 'Enviar imagen' : 'Send image'}
        >
          <i className="fas fa-image"></i>
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedImage)}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;

