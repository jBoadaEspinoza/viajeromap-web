import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { LoadingProvider } from '../context/LoadingContext';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isExtranetRoute = location.pathname.startsWith('/extranet');
  const isCheckoutRoute = location.pathname === '/checkout';
  const isPayToConfirmRoute = location.pathname === '/pay-to-confirm';

  if (isExtranetRoute || isCheckoutRoute || isPayToConfirmRoute) {
    // Para rutas del extranet, checkout y pay-to-confirm, no mostrar navbar ni footer
    return <>{children}</>;
  }

  // Para rutas normales, mostrar navbar y footer con LoadingProvider
  return (
    <LoadingProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </LoadingProvider>
  );
};

export default ConditionalLayout; 