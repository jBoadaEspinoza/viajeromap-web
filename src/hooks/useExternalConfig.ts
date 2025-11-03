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
          // Asegurar que paypal esté presente
          let paypalConfig = appConfig.paypal;
          if (externalConfig.paypal) {
            paypalConfig = {
              ...appConfig.paypal,
              ...externalConfig.paypal,
              // Si el clientId externo está vacío, usar el de appConfig
              clientId: externalConfig.paypal.clientId || appConfig.paypal.clientId,
              secretKey: externalConfig.paypal.secretKey || appConfig.paypal.secretKey,
              // Si las URLs están vacías, usar las de appConfig o window.location.origin
              baseUrl: externalConfig.paypal.baseUrl || appConfig.paypal.baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
              redirectBaseUrl: externalConfig.paypal.redirectBaseUrl || appConfig.paypal.redirectBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
            };
          }

          const mergedConfig: AppConfig = {
            ...appConfig,
            ...externalConfig,
            paypal: paypalConfig,
            // Asegurar que loading esté presente con valores por defecto
            loading: externalConfig.loading || appConfig.loading,
            // Asegurar que api esté presente
            api: externalConfig.api || appConfig.api,
            // Asegurar que pricing esté presente
            pricing: externalConfig.pricing || appConfig.pricing
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
        // Siempre establecer loading a false
        setLoading(false);
      }
    };

    // Cargar configuración con timeout para evitar bloqueos
    const timeoutId = setTimeout(() => {
      loadExternalConfig();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return { config, loading, error };
}; 