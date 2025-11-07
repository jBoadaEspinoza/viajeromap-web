import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface PublicProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // Si es true, bloquea el render hasta que esté autenticado
}

/**
 * Componente para proteger rutas públicas que requieren autenticación
 * (como Cart y Checkout)
 * 
 * A diferencia de ProtectedRoute (extranet), este componente:
 * - Muestra un modal de login en lugar de redirigir
 * - Permite que la página se renderice pero con funcionalidad limitada
 * - No redirige, solo bloquea acciones hasta que el usuario se autentique
 */
const PublicProtectedRoute: React.FC<PublicProtectedRouteProps> = ({ children, requireAuth = false }) => {
  const { isAuthenticated, loading, firebaseUser } = useAuth();
  const { language } = useLanguage();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Si requireAuth es true y no está autenticado después de cargar, mostrar prompt
    if (requireAuth && !loading && !isAuthenticated && !firebaseUser) {
      setShowLoginPrompt(true);
    } else if (isAuthenticated || firebaseUser) {
      setShowLoginPrompt(false);
    }
  }, [requireAuth, loading, isAuthenticated, firebaseUser]);

  // Mostrar loading mientras se valida la autenticación
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">{getTranslation('common.validating', language)}</span>
          </div>
          <h5 className="text-muted">
            {getTranslation('common.validatingAuth', language)}
          </h5>
        </div>
      </div>
    );
  }

  // Si requireAuth es true y no está autenticado, mostrar mensaje
  // Pero no bloquear el render del componente hijo (el componente decide qué mostrar)
  return <>{children}</>;
};

export default PublicProtectedRoute;


