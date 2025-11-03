import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CancelPayment: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  useEffect(() => {
    console.log('❌ Cancel Payment - PayPal payment cancelled');

    // Limpiar parámetros de URL
    window.history.replaceState({}, '', window.location.pathname);

    // Mostrar mensaje de cancelación
    alert(language === 'es' 
      ? 'Pago cancelado. Puedes intentar nuevamente cuando estés listo.'
      : 'Payment cancelled. You can try again when you are ready.');

    // Redirigir al checkout para que el usuario pueda intentar nuevamente
    navigate('/checkout');
  }, [navigate, language]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="spinner-border text-warning mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">
            {language === 'es' 
              ? 'Cancelando pago...'
              : 'Cancelling payment...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancelPayment;

