import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Función para generar un UUID corto (8 caracteres)
const generateShortUUID = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const CapturePayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  useEffect(() => {
    // Obtener todos los parámetros de la URL
    const token = searchParams.get('token');
    const payerId = searchParams.get('PayerID');
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('token'); // PayPal puede usar 'token' como orderId
    
    // Obtener todos los parámetros disponibles de la URL
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    
    // Función para procesar el pago con los datos obtenidos de PayPal
    const processPayment = async (paymentInfoData: any = {}) => {
      // Obtener detalles de reserva antes de limpiarlos
      const bookingDetailsJson = sessionStorage.getItem('checkoutBookingDetails');
      let bookingDetails = null;
      
      if (bookingDetailsJson) {
        try {
          bookingDetails = JSON.parse(bookingDetailsJson);
        } catch (error) {
          // Si hay error al parsear los detalles de reserva, continuar sin ellos
        }
      }

      // Limpiar parámetros de URL para mantener la URL limpia
      window.history.replaceState({}, '', window.location.pathname);

      // Generar código de reserva UUID corto
      const reservationCode = generateShortUUID();
      
      // Mensaje sobre envío de datos al backend
      const sendToBackendMessage = language === 'es' 
        ? 'Se procede enviar la data del detalle de la reserva al backend para su registro.'
        : 'Proceeding to send reservation detail data to backend for registration.';
      
      // Estructura de datos de reserva a enviar al backend
      const reservationData = {
        reservationCode,
        bookingDetails,
        paymentInfo: {
          token,
          payerId,
          paymentId,
          orderId,
          timestamp: new Date().toISOString(),
          ...paymentInfoData
        }
      };
      
      // Capturar el pago y enviar datos al backend
      try {
        // Aquí iría la llamada al backend para registrar la reserva
        // await sendReservationToBackend(reservationData);
        
        // Guardar datos de reserva en sessionStorage antes de limpiar (para que PaymentCompleted pueda acceder)
        sessionStorage.setItem('lastReservationData', JSON.stringify(reservationData));
        
        // Limpiar datos de checkout (pero mantener reservationData en sessionStorage)
        sessionStorage.removeItem('checkoutBookingDetails');
        sessionStorage.removeItem('checkoutTimeLeft');
        sessionStorage.removeItem('checkoutCurrentStep');
        sessionStorage.removeItem('checkoutFormData');

        // Redirigir a la página de pago completado con los datos de la reserva
        navigate('/payment-completed', { 
          state: reservationData 
        });
      } catch (error) {
        // Si hay error al procesar el pago, mostrar mensaje y redirigir
        const errorMessage = language === 'es' 
          ? 'Hubo un error al procesar el pago. Por favor, contacta con soporte.'
          : 'There was an error processing the payment. Please contact support.';
        
        alert(errorMessage);
        
        // Limpiar datos de checkout
        sessionStorage.removeItem('checkoutBookingDetails');
        sessionStorage.removeItem('checkoutTimeLeft');
        sessionStorage.removeItem('checkoutCurrentStep');
        sessionStorage.removeItem('checkoutFormData');
        
        // Redirigir a home
        navigate('/');
      }
    };

    // Si tenemos un orderID, intentar obtener los detalles de la orden desde PayPal
    if (orderId && (window as any).paypal) {
      try {
        const paypal = (window as any).paypal;
        // Obtener detalles completos de la orden desde PayPal
        paypal.orders().get(orderId).then((order: any) => {
          // Procesar el pago con los detalles de la orden
          processPayment({
            orderId: order.id,
            status: order.status,
            payerId: order.payer?.payer_id,
            amount: order.purchase_units?.[0]?.amount,
            payer: order.payer,
            fullOrder: order
          });
        }).catch((error: any) => {
          // Si no se pueden obtener los detalles de la orden, procesar el pago sin ellos
          processPayment();
        });
      } catch (error) {
        // Si el SDK de PayPal no está disponible, procesar el pago sin los detalles completos
        processPayment();
      }
    } else {
      // Si no hay orderId o PayPal SDK no está disponible, procesar directamente
      processPayment();
    }

  }, [searchParams, navigate, language]);

  // Mostrar pantalla de carga mientras se procesa el pago
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          {/* Spinner de carga */}
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          {/* Mensaje de procesamiento */}
          <p className="text-muted">
            {language === 'es' 
              ? 'Procesando pago...'
              : 'Processing payment...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CapturePayment;

