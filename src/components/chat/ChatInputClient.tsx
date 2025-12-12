import React, { useState, useRef, ChangeEvent } from 'react';
import { isValidImageFile, createImagePreview, revokeImagePreview } from '../../utils/chatUtils';

interface ChatInputClientProps {
  onSendMessage: (text: string, imageFile?: File) => void;
  disabled?: boolean;
  language?: 'es' | 'en';
}

const ChatInputClient: React.FC<ChatInputClientProps> = ({ 
  onSendMessage, 
  disabled = false, 
  language = 'es' 
}) => {
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    // Resetear altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = '38px';
      textareaRef.current.style.overflowY = 'hidden';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Permitir salto de línea con Enter
    // El mensaje solo se envía con el botón
    // No prevenir el comportamiento por defecto de Enter
  };

  // Ajustar altura del textarea automáticamente
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Resetear altura para calcular correctamente
    textarea.style.height = 'auto';
    
    // Calcular altura basada en scrollHeight
    const lineHeight = 24; // Aproximadamente 1.5 * 16px (line-height)
    const maxLines = 5;
    const minHeight = 38; // Altura mínima (1 línea)
    const maxHeight = minHeight + (lineHeight * (maxLines - 1)); // Altura máxima (5 líneas)
    
    const scrollHeight = textarea.scrollHeight;
    
    if (scrollHeight <= maxHeight) {
      // Si el contenido cabe en 5 líneas, ajustar altura
      textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`;
      textarea.style.overflowY = 'hidden';
    } else {
      // Si excede 5 líneas, fijar altura y mostrar scroll
      textarea.style.height = `${maxHeight}px`;
      textarea.style.overflowY = 'auto';
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Ajustar altura después de actualizar el valor
    setTimeout(adjustTextareaHeight, 0);
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
      <div className="d-flex align-items-end gap-2">
        {/* Botón imagen a la izquierda */}
        <button
          type="button"
          className="btn btn-outline-secondary flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          title={language === 'es' ? 'Enviar imagen' : 'Send image'}
          style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            padding: 0,
          }}
        >
          <i className="fas fa-image"></i>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        {/* Input en el centro con borde redondeado */}
        <textarea
          ref={textareaRef}
          className="form-control flex-grow-1"
          placeholder={language === 'es' ? 'Escribe un mensaje...' : 'Type a message...'}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          style={{ 
            backgroundColor: disabled ? '#f8f9fa' : '#fff', 
            cursor: disabled ? 'not-allowed' : 'text',
            resize: 'none',
            minHeight: '38px',
            overflowY: 'hidden',
            lineHeight: '1.5',
            transition: 'height 0.1s ease',
            borderRadius: '20px',
            padding: '8px 16px',
            border: '1px solid #dee2e6',
          }}
        />
        
        {/* Botón enviar a la derecha */}
        <button
          type="button"
          className="btn btn-primary flex-shrink-0"
          onClick={handleSend}
          disabled={disabled || (!message.trim() && !selectedImage)}
          style={{
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            padding: 0,
          }}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatInputClient;

