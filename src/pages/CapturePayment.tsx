import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
// Note: CapturePayment is deprecated - orders are now created via ordersItemApi in Checkout

// Función para generar un UUID corto (8 caracteres)
const generateShortUUID = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const CapturePayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { user } = useAuth();
  const clearCheckoutData = () => {
    sessionStorage.removeItem('checkoutBookingDetails');
    sessionStorage.removeItem('checkoutTimeLeft');
    sessionStorage.removeItem('checkoutCurrentStep');
    sessionStorage.removeItem('checkoutFormData');
    sessionStorage.removeItem('bookingDetails');
    sessionStorage.removeItem('checkoutActivePriceTier');
  };


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
      const bookingDetailsJson = sessionStorage.getItem('checkoutBookingDetails');
      let bookingDetails: any = null;
      
      if (bookingDetailsJson) {
        try {
          bookingDetails = JSON.parse(bookingDetailsJson);
        } catch {
          // Ignorar error de parseo, se manejará más adelante
        }
      }

      // Limpiar parámetros de URL para mantener la URL limpia
      window.history.replaceState({}, '', window.location.pathname);

      if (!bookingDetails) {
        alert(language === 'es'
          ? 'No se encontraron los detalles de la reserva. Intenta nuevamente.'
          : 'Reservation details were not found. Please try again.');
        navigate('/');
        return;
      }

      const storedPersonId = sessionStorage.getItem('checkoutPersonId');
      const personId = storedPersonId ? Number(storedPersonId) : (user?.personId ?? null);

      if (!personId || Number.isNaN(personId)) {
        alert(language === 'es'
          ? 'No se encontró la información del viajero. Por favor actualiza tus datos de contacto antes de pagar.'
          : 'Traveler information not found. Please update your contact details before paying.');
        navigate('/checkout');
        return;
      }

      const storedTier = sessionStorage.getItem('checkoutActivePriceTier');
      let activePriceTier: any = null;
      if (storedTier) {
        try {
          activePriceTier = JSON.parse(storedTier);
        } catch {
          activePriceTier = null;
        }
      }

      const totalAdults = bookingDetails?.travelers?.adults || 0;
      const totalChildren = bookingDetails?.travelers?.children || 0;
      const totalTravelers = totalAdults + totalChildren;

      if (totalTravelers <= 0) {
        alert(language === 'es'
          ? 'No se encontraron viajeros asociados a la reserva.'
          : 'No travelers were found for this reservation.');
        navigate('/');
        return;
      }

      const unitPrice = bookingDetails?.price || 0;
      const totalPrice = bookingDetails?.totalPrice || unitPrice * totalTravelers;

      const currencyCode = (bookingDetails?.currency || 'USD').toUpperCase();
      const allowedCurrencies = ['USD', 'PEN', 'EUR'];
      const orderCurrency = (allowedCurrencies.includes(currencyCode) ? currencyCode : 'USD') as 'USD' | 'PEN' | 'EUR';

      const startDatetime = bookingDetails?.date && bookingDetails?.time
        ? `${bookingDetails.date}T${bookingDetails.time}:00`
        : new Date().toISOString();

      const platformCommissionPercent = Number(
        bookingDetails?.commissionPercent ??
        activePriceTier?.commissionPercent ??
        0
      );
      const agentCommissionPercent = user?.roleCode === 'TRAVELER'
        ? 0
        : platformCommissionPercent;

      const platformCommissionAmount = platformCommissionPercent
        ? Number((totalPrice * (platformCommissionPercent / 100)).toFixed(2))
        : 0;
      const agentCommissionAmount = agentCommissionPercent
        ? Number((totalPrice * (agentCommissionPercent / 100)).toFixed(2))
        : 0;

      const meetingTypeNormalized = (bookingDetails.meetingType || '').toLowerCase();
      let meetingPickupPlaceId = bookingDetails.pickupPoint?.cityId ?? bookingDetails.meetingPointCityId ?? undefined;
      let meetingPickupPointId = bookingDetails.pickupPoint?.id ?? undefined;
      let meetingPickupPointName = bookingDetails.pickupPoint?.name ?? undefined;
      let meetingPickupPointAddress = bookingDetails.pickupPoint?.address ?? undefined;
      let meetingPickupPointLatitude = bookingDetails.pickupPoint?.latitude ?? undefined;
      let meetingPickupPointLongitude = bookingDetails.pickupPoint?.longitude ?? undefined;

      if (meetingTypeNormalized === 'meeting_point') {
        meetingPickupPlaceId = meetingPickupPlaceId ?? bookingDetails.meetingPointId ?? undefined;
        meetingPickupPointId = meetingPickupPointId ?? bookingDetails.meetingPointId ?? bookingDetails.bookingOptionId ?? undefined;
        meetingPickupPointName = meetingPickupPointName
          ?? bookingDetails.meetingPointName
          ?? bookingDetails.pickupPoint?.name
          ?? bookingDetails.meetingPointAddress
          ?? undefined;
        meetingPickupPointAddress = meetingPickupPointAddress ?? bookingDetails.meetingPointAddress ?? undefined;
        meetingPickupPointLatitude = meetingPickupPointLatitude ?? bookingDetails.meetingPointLatitude ?? undefined;
        meetingPickupPointLongitude = meetingPickupPointLongitude ?? bookingDetails.meetingPointLongitude ?? undefined;
      }

      const calculateEndDateTime = (): string | undefined => {
        if (!bookingDetails.date || !bookingDetails.time) {
          return undefined;
        }
        const [year, month, day] = bookingDetails.date.split('-').map(Number);
        const [hour, minute] = bookingDetails.time.split(':').map(Number);
        if (
          Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) ||
          Number.isNaN(hour) || Number.isNaN(minute)
        ) {
          return undefined;
        }
        const startDate = new Date(year, month - 1, day, hour, minute, 0, 0);
        if (Number.isNaN(startDate.getTime())) {
          return undefined;
        }

        const durationDays = bookingDetails.durationDays ?? 0;
        const durationHours = bookingDetails.durationHours ?? 0;
        const durationMinutes = bookingDetails.durationMinutes ?? 0;

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (durationDays || 0));
        endDate.setHours(endDate.getHours() + (durationHours || 0));
        endDate.setMinutes(endDate.getMinutes() + (durationMinutes || 0));

        if (Number.isNaN(endDate.getTime())) {
          return undefined;
        }

        const pad = (value: number) => String(value).padStart(2, '0');
        return `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:00`;
      };

      const endDatetime = calculateEndDateTime();

      // Note: This page is deprecated. Orders should be created via Checkout page.
      // For now, we'll just navigate to payment-completed with the booking details.
      // In a real scenario, the order would have been created in the Checkout page.
      
      try {
        // Generate a temporary reservation code
        const reservationCode = generateShortUUID();

        console.log('🔑 Token utilizado para crear la orden (capture):', localStorage.getItem('authToken'));

        const paymentInfo = {
          token,
          payerId,
          paymentId,
          orderId,
          paymentMethod: 'googlepay',
          status: 'PAID',
          amount: paymentInfoData?.amount || {
            value: totalPrice.toFixed(2),
            currency_code: orderCurrency
          },
          timestamp: new Date().toISOString(),
          ...paymentInfoData
        };

        const reservationData = {
          reservationCode,
          bookingDetails: {
            ...bookingDetails,
            totalPrice
          },
          paymentInfo,
          paymentStatus: 'PAID' as const,
          orderId: reservationCode, // Temporary ID
          orderMessage: 'Payment processed successfully'
        };

        sessionStorage.setItem('lastReservationData', JSON.stringify(reservationData));
        clearCheckoutData();

        navigate('/payment-completed', { 
          state: reservationData 
        });
      } catch (error: any) {
        const errorMessage = language === 'es' 
          ? (error?.message || 'Hubo un error al procesar el pago. Por favor, contacta con soporte.')
          : (error?.message || 'There was an error processing the payment. Please contact support.');
        
        alert(errorMessage);
        clearCheckoutData();
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

