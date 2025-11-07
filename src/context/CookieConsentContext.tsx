import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Cookies from 'js-cookie';

interface CookieConsentContextType {
  hasConsent: boolean;
  showBanner: boolean;
  acceptCookies: () => void;
  rejectCookies: () => void;
  canUseCookies: () => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

interface CookieConsentProviderProps {
  children: ReactNode;
}

const COOKIE_CONSENT_KEY = 'viajeromap_cookie_consent';
const COOKIE_CONSENT_EXPIRES = 365; // días

export const CookieConsentProvider: React.FC<CookieConsentProviderProps> = ({ children }) => {
  const [hasConsent, setHasConsent] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  // Verificar consentimiento al cargar
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    
    if (consent === 'accepted') {
      setHasConsent(true);
      setShowBanner(false);
    } else if (consent === 'rejected') {
      setHasConsent(false);
      setShowBanner(false);
    } else {
      // No hay decisión previa, mostrar banner
      setHasConsent(false);
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    setHasConsent(true);
    setShowBanner(false);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    
    // Guardar en cookie también para validar desde backend si es necesario
    Cookies.set(COOKIE_CONSENT_KEY, 'accepted', { 
      expires: COOKIE_CONSENT_EXPIRES,
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:'
    });
    
    console.log('✅ Usuario aceptó el uso de cookies');
  };

  const rejectCookies = () => {
    setHasConsent(false);
    setShowBanner(false);
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    
    // Limpiar todas las cookies existentes excepto las esenciales
    const allCookies = Cookies.get();
    Object.keys(allCookies).forEach(cookieName => {
      // No eliminar cookies esenciales del sistema
      if (!cookieName.includes('essential') && cookieName !== COOKIE_CONSENT_KEY) {
        Cookies.remove(cookieName);
      }
    });
    
    console.log('❌ Usuario rechazó el uso de cookies');
  };

  const canUseCookies = () => {
    return hasConsent;
  };

  const value: CookieConsentContextType = {
    hasConsent,
    showBanner,
    acceptCookies,
    rejectCookies,
    canUseCookies
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};


