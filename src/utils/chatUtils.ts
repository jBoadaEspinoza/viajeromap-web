import { Timestamp } from 'firebase/firestore';

/**
 * Formatea un timestamp de Firestore a hora local en formato AM/PM
 * @param timestamp - Timestamp de Firestore
 * @returns String con la hora formateada (ej: "2:30 PM")
 */
export const formatTimestampToLocalTime = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return '';

  try {
    const date = timestamp.toDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${displayHours}:${displayMinutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
};

/**
 * Formatea un timestamp a fecha y hora completa
 * @param timestamp - Timestamp de Firestore
 * @returns String con fecha y hora (ej: "15 Ene, 2:30 PM")
 */
export const formatTimestampToDateTime = (
  timestamp: Timestamp | null | undefined,
  language: 'es' | 'en' = 'es'
): string => {
  if (!timestamp) return '';

  try {
    const date = timestamp.toDate();
    const locale = language === 'es' ? 'es-ES' : 'en-US';

    const dateStr = date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
    });

    const timeStr = formatTimestampToLocalTime(timestamp);

    return `${dateStr}, ${timeStr}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
};

/**
 * Sanitiza un mensaje de texto removiendo HTML y scripts maliciosos
 * @param text - Texto a sanitizar
 * @returns Texto sanitizado (solo texto plano)
 */
export const sanitizeMessage = (text: string | null | undefined): string => {
  if (!text) return '';

  try {
    // Crear un elemento temporal para extraer solo el texto
    const div = document.createElement('div');
    div.textContent = text;
    
    // Obtener el texto plano y escapar caracteres HTML
    return div.textContent || div.innerText || ''
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } catch (error) {
    console.error('Error sanitizing message:', error);
    // Fallback: escape básico
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

/**
 * Valida si un archivo es una imagen válida
 * @param file - Archivo a validar
 * @returns true si es una imagen válida
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};

/**
 * Crea una URL de preview para una imagen antes de subirla
 * @param file - Archivo de imagen
 * @returns URL del objeto o null si hay error
 */
export const createImagePreview = (file: File): string | null => {
  try {
    if (!isValidImageFile(file)) {
      return null;
    }

    return URL.createObjectURL(file);
  } catch (error) {
    console.error('Error creating image preview:', error);
    return null;
  }
};

/**
 * Revoca una URL de preview para liberar memoria
 * @param url - URL a revocar
 */
export const revokeImagePreview = (url: string | null): void => {
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error revoking image preview:', error);
    }
  }
};

/**
 * Trunca un texto a una longitud máxima
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns Texto truncado con "..." si es necesario
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

