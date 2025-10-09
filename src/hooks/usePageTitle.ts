import { useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { getTranslation } from '../utils/translations';

/**
 * Hook personalizado para establecer el título de la página dinámicamente
 * Formato: "dominio | Nombre de Página"
 * Ejemplo: "viajeromap.com | Home"
 * 
 * @param pageKey - Clave de traducción para el nombre de la página (ej: 'nav.home', 'nav.activities')
 * @param language - Idioma actual ('es' o 'en')
 */
export const usePageTitle = (pageKey: string, language: 'es' | 'en' = 'es') => {
  const { config } = useConfig();

  useEffect(() => {
    const domain = config.business.website || 'viajeromap.com';
    const pageName = getTranslation(pageKey, language);
    document.title = `${domain} | ${pageName}`;
  }, [config.business.website, pageKey, language]);
};

