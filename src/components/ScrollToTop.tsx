import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que hace scroll al top de la página cuando cambia la ruta
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Hacer scroll al top cuando cambia la ruta
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Usar 'instant' para un scroll inmediato sin animación
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

