import Cookies from 'js-cookie';
import type { CookieAttributes } from 'js-cookie';

const COOKIE_CONSENT_KEY = 'viajeromap_cookie_consent';

/**
 * Verifica si el usuario ha dado consentimiento para usar cookies
 */
export const hasUserConsent = (): boolean => {
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  return consent === 'accepted';
};

/**
 * Establece una cookie solo si el usuario ha dado su consentimiento
 * @param name Nombre de la cookie
 * @param value Valor de la cookie
 * @param options Opciones adicionales de la cookie
 * @returns true si se estableció la cookie, false si no hay consentimiento
 */
export const setCookie = (
  name: string, 
  value: string, 
  options?: CookieAttributes
): boolean => {
  if (!hasUserConsent()) {
    console.warn(`⚠️ No se puede establecer cookie "${name}" sin consentimiento del usuario`);
    return false;
  }
  
  // Establecer cookie con opciones seguras por defecto
  const defaultOptions: CookieAttributes = {
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
    expires: 7, // 7 días por defecto
    ...options
  };
  
  Cookies.set(name, value, defaultOptions);
  console.log(`✅ Cookie "${name}" establecida con consentimiento`);
  return true;
};

/**
 * Obtiene una cookie
 * @param name Nombre de la cookie
 * @returns Valor de la cookie o undefined
 */
export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

/**
 * Elimina una cookie
 * @param name Nombre de la cookie
 * @param options Opciones adicionales
 */
export const removeCookie = (name: string, options?: CookieAttributes): void => {
  Cookies.remove(name, options);
  console.log(`🗑️ Cookie "${name}" eliminada`);
};

/**
 * Elimina todas las cookies (excepto el consentimiento)
 */
export const removeAllCookies = (): void => {
  const allCookies = Cookies.get();
  if (allCookies && typeof allCookies === 'object') {
    Object.keys(allCookies).forEach(cookieName => {
      if (cookieName !== COOKIE_CONSENT_KEY) {
        Cookies.remove(cookieName);
      }
    });
  }
  console.log('🗑️ Todas las cookies eliminadas (excepto consentimiento)');
};

/**
 * Guarda el token de autenticación
 * Si hay consentimiento: guarda en cookie
 * Siempre guarda en localStorage como fallback
 */
export const saveAuthToken = (token: string): void => {
  // Siempre guardar en localStorage
  localStorage.setItem('authToken', token);
  
  // Si hay consentimiento, también guardar en cookie
  if (hasUserConsent()) {
    setCookie('authToken', token, {
      expires: 7, // 7 días
      sameSite: 'lax',
      secure: window.location.protocol === 'https:'
      // Nota: httpOnly no se puede establecer desde JavaScript
      // Solo se puede establecer desde el servidor
    });
  }
};

/**
 * Obtiene el token de autenticación
 * Prioridad: cookie > localStorage
 */
export const getAuthToken = (): string | null => {
  // Intentar obtener de cookie primero
  const cookieToken = getCookie('authToken');
  if (cookieToken) {
    return cookieToken;
  }
  
  // Fallback a localStorage
  return localStorage.getItem('authToken');
};

/**
 * Elimina el token de autenticación de todos lados
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  removeCookie('authToken');
  console.log('🗑️ Token de autenticación eliminado');
};


