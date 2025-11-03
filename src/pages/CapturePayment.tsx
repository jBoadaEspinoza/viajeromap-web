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
    
    // Obtener todos los parámetros disponibles
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    console.log('✅ Capture Payment - PayPal redirect detected:', {
      token,
      payerId,
      paymentId,
      orderId,
      search: window.location.search,
      allParams,
      fullUrl: window.location.href
    });
    
    // Función para procesar el pago con los datos obtenidos
    const processPayment = async (paymentInfoData: any = {}) => {
      // Obtener detalles de reserva antes de limpiarlos
      const bookingDetailsJson = sessionStorage.getItem('checkoutBookingDetails');
      let bookingDetails = null;
      
      if (bookingDetailsJson) {
        try {
          bookingDetails = JSON.parse(bookingDetailsJson);
        } catch (error) {
          console.error('Error parsing booking details:', error);
        }
      }

      // Limpiar parámetros de URL
      window.history.replaceState({}, '', window.location.pathname);

      // Procesar el pago exitoso
      console.log('✅ Procesando pago exitoso de PayPal...');
      
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
      
      console.log('📤 ' + sendToBackendMessage);
      console.log('📋 Reservation Data to send to backend:', reservationData);
      
      // Capturar el pago y enviar datos al backend
      try {
        // Aquí iría la llamada al backend para registrar la reserva
        // await sendReservationToBackend(reservationData);
        
        console.log('📤 ' + sendToBackendMessage);
        
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
        console.error('❌ Error al procesar el pago:', error);
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

    // Si tenemos un orderID, intentar obtener los detalles de la orden
    if (orderId && (window as any).paypal) {
      try {
        const paypal = (window as any).paypal;
        paypal.orders().get(orderId).then((order: any) => {
          console.log('📦 PayPal Order Details Retrieved:', {
            orderId: order.id,
            status: order.status,
            createTime: order.create_time,
            updateTime: order.update_time,
            intent: order.intent,
            purchaseUnits: order.purchase_units?.map((unit: any) => ({
              referenceId: unit.reference_id,
              amount: unit.amount,
              payee: unit.payee,
              paymentStatus: unit.payments,
              captures: unit.payments?.captures
            })),
            payer: order.payer,
            links: order.links,
            fullOrder: order
          });
          
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
          console.warn('⚠️ Could not retrieve order details:', error);
          // Procesar el pago sin los detalles completos
          processPayment();
        });
      } catch (error) {
        console.warn('⚠️ PayPal SDK not available for order retrieval:', error);
        // Procesar el pago sin los detalles completos
        processPayment();
      }
    } else {
      // Si no hay orderId o PayPal SDK no está disponible, procesar directamente
      processPayment();
    }

  }, [searchParams, navigate, language]);

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
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

