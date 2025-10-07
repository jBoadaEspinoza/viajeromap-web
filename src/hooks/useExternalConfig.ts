import { useState, useEffect } from 'react';
import { appConfig, type AppConfig } from '../config/appConfig';

export const useExternalConfig = () => {
  const [config, setConfig] = useState<AppConfig>(appConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExternalConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar cargar configuración externa
        const response = await fetch('/config.json');
        
        if (response.ok) {
          const externalConfig = await response.json();
          // Validar que la configuración externa tenga todas las propiedades necesarias
          const mergedConfig = {
            ...appConfig,
            ...externalConfig,
            // Asegurar que loading esté presente con valores por defecto
            loading: externalConfig.loading || {
              backgroundColor: "rgba(220, 20, 60, 0.8)",
              spinnerColor: "#FFFFFF",
              textColor: "#FFFFFF",
              backdropBlur: "3px",
              zIndex: 9999
            }
          };
          setConfig(mergedConfig);
          console.log('✅ Configuración externa cargada:', mergedConfig);
        } else {
          // Si no existe el archivo externo, usar configuración por defecto
          console.warn('No se encontró config.json, usando configuración por defecto');
          setConfig(appConfig);
        }
      } catch (error) {
        console.error('Error cargando configuración externa:', error);
        setError('Error cargando configuración');
        // Usar configuración por defecto en caso de error
        setConfig(appConfig);
      } finally {
        setLoading(false);
      }
    };

    loadExternalConfig();
  }, []);

  return { config, loading, error };
}; 