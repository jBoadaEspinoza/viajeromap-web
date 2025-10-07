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

  // Show error state if configuration failed to load
  if (error) {
    console.error('ConfigContext error:', error);
    // Fallback to default config
    return (
      <ConfigContext.Provider value={{ config: appConfig }}>
        {children}
      </ConfigContext.Provider>
    );
  }

  return (
    <ConfigContext.Provider value={{
      config
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}; 