import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ConfigProvider } from './context/ConfigContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { CookieConsentProvider } from './context/CookieConsentContext';
import CookieConsentBanner from './components/CookieConsentBanner';
import ConditionalLayout from './components/ConditionalLayout';
import UrlParamsSync from './components/UrlParamsSync';
import AppRoutes from './routes/AppRoutes';

function App() {

  return (
    <Provider store={store}>
      <ConfigProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <CookieConsentProvider>
              <AuthProvider>
                <CartProvider>
                  <Router>
                    <UrlParamsSync>
                      <ConditionalLayout>
                        <AppRoutes />
                      </ConditionalLayout>
                    </UrlParamsSync>
                    {/* Banner de consentimiento de cookies */}
                    <CookieConsentBanner />
                  </Router>
                </CartProvider>
              </AuthProvider>
            </CookieConsentProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </ConfigProvider>
    </Provider>
  );
}

export default App;
