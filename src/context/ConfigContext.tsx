import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { appConfig, type AppConfig } from '../config/appConfig';
import { updateAppColors } from '../utils/configUtils';
import { useExternalConfig } from '../hooks/useExternalConfig';

interface ConfigContextType {
  config: AppConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const { config, loading, error } = useExternalConfig();

  // Update colors and loading styles when config changes
  useEffect(() => {
    if (!loading) {
      try {
        updateAppColors(config);
      } catch (error) {
        console.error('Error updating app colors:', error);
      }
    }
  }, [config, loading]);

  // Show loading state while configuration is being loaded
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando configuración...</span>
          </div>
          <p className="text-muted">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  // Show error state if configuration failed to load - usar appConfig por defecto
  if (error) {
    console.error('ConfigContext error:', error);
    // Fallback to default config
    try {
      return (
        <ConfigContext.Provider value={{ config: appConfig }}>
          {children}
        </ConfigContext.Provider>
      );
    } catch (fallbackError) {
      console.error('Error in fallback config:', fallbackError);
      // Último recurso: devolver children sin provider
      return <>{children}</>;
    }
  }

  // Validar que config tenga todas las propiedades requeridas
  try {
    const validatedConfig: AppConfig = {
      ...appConfig,
      ...config,
      // Asegurar que paypal esté presente
      paypal: config.paypal || appConfig.paypal
    };

    return (
      <ConfigContext.Provider value={{
        config: validatedConfig
      }}>
        {children}
      </ConfigContext.Provider>
    );
  } catch (configError) {
    console.error('Error validating config:', configError);
    // Fallback a appConfig
    return (
      <ConfigContext.Provider value={{ config: appConfig }}>
        {children}
      </ConfigContext.Provider>
    );
  }
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}; 