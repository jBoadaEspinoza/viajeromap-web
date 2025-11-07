import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const CancelPayment: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Efecto que se ejecuta al montar el componente para manejar la cancelación del pago
  useEffect(() => {
    // Limpiar parámetros de URL para mantener la URL limpia
    window.history.replaceState({}, '', window.location.pathname);

    // Mostrar mensaje de cancelación al usuario
    alert(language === 'es' 
      ? 'Pago cancelado. Puedes intentar nuevamente cuando estés listo.'
      : 'Payment cancelled. You can try again when you are ready.');

    // Redirigir al checkout para que el usuario pueda intentar nuevamente
    navigate('/checkout');
  }, [navigate, language]);

  // Mostrar pantalla de carga mientras se procesa la cancelación
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          {/* Spinner de carga */}
          <div className="spinner-border text-warning mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          {/* Mensaje de cancelación */}
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

