import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Currency = 'PEN' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  getCurrencySymbol: (currency: Currency | string | undefined) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  // Get currency from localStorage or default to USD
  const getInitialCurrency = (): Currency => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && (savedCurrency === 'PEN' || savedCurrency === 'USD')) {
      return savedCurrency;
    }
    return 'USD';
  };

  const [currency, setCurrency] = useState<Currency>(getInitialCurrency);

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  const getCurrencySymbol = (curr: Currency | string | undefined) => {
    if (!curr) return '$'; // Default to USD symbol if undefined
    
    // Normalizar a mayúsculas para comparación case-insensitive y eliminar espacios
    const normalizedCurr = typeof curr === 'string' ? curr.toUpperCase().trim() : String(curr).toUpperCase().trim();
    
    // Comparación explícita para cada currency
    if (normalizedCurr === 'PEN') {
      return 'S/';
    } else if (normalizedCurr === 'USD') {
      return '$';
    } else if (normalizedCurr === 'EUR') {
      return '€';
    }
    
    // Default to USD symbol si no coincide
    return '$';
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency: handleSetCurrency,
      getCurrencySymbol 
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}; 