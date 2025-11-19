import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ PrivateRoute:', { 
    isAuthenticated, 
    loading, 
    pathname: location.pathname
  });

  // Si aún está cargando, mostrar loading
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Verificando sesión...</span>
          </div>
          <p className="text-muted">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('❌ PrivateRoute: User not authenticated, redirecting to login');
    return <Navigate to="/extranet" state={{ from: location }} replace />;
  }

  // Si está autenticado, mostrar el contenido
  console.log('✅ PrivateRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default PrivateRoute; 