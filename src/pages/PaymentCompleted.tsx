import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface BookingDetails {
  activityId?: number;
  title?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  date?: string;
  time?: string;
  meetingPoint?: string;
  guideLanguage?: string;
  travelers?: {
    adults: number;
    children: number;
  };
  hasDiscount?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  finalPrice?: number;
  pickupPoint?: {
    name: string;
    address: string;
  };
  comment?: string;
}

interface PaymentInfo {
  orderId?: string;
  status?: string;
  payerId?: string;
  amount?: {
    value: string;
    currency_code: string;
  };
  timestamp?: string;
}

interface ReservationData {
  reservationCode?: string;
  bookingDetails?: BookingDetails;
  paymentInfo?: PaymentInfo;
}

const PaymentCompleted: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Efecto para obtener datos de la reserva al montar el componente
  useEffect(() => {
    // Intentar obtener datos de la reserva desde location.state primero
    const stateData = location.state as ReservationData;
    
    if (stateData) {
      // Si hay datos en location.state, usarlos y guardarlos en sessionStorage
      setReservationData(stateData);
      // Guardar en sessionStorage para persistencia durante la sesión
      sessionStorage.setItem('lastReservationData', JSON.stringify(stateData));
    } else {
      // Intentar obtener desde sessionStorage si no hay datos en location.state
      const storedData = sessionStorage.getItem('lastReservationData');
      if (storedData) {
        try {
          setReservationData(JSON.parse(storedData));
        } catch (error) {
          // Si hay error al parsear los datos almacenados, continuar sin ellos
        }
      }
    }
  }, [location.state]);

  // Manejar cancelación de reserva
  const handleCancelReservation = async () => {
    // Validar que exista código de reserva
    if (!reservationData?.reservationCode) {
      alert(language === 'es' 
        ? 'No se puede cancelar la reserva. Código de reserva no encontrado.'
        : 'Cannot cancel reservation. Reservation code not found.');
      return;
    }

    // Confirmar cancelación con el usuario
    const confirmMessage = language === 'es'
      ? `¿Estás seguro de que deseas cancelar la reserva ${reservationData.reservationCode}?`
      : `Are you sure you want to cancel reservation ${reservationData.reservationCode}?`;

    if (!window.confirm(confirmMessage)) {
      // Si el usuario cancela, no hacer nada
      return;
    }

    setIsCancelling(true);
    
    try {
      // Aquí iría la llamada al backend para cancelar la reserva
      // await cancelReservation(reservationData.reservationCode);
      
      // Limpiar datos de la reserva del sessionStorage
      sessionStorage.removeItem('lastReservationData');
      
      alert(language === 'es'
        ? 'Reserva cancelada exitosamente.'
        : 'Reservation cancelled successfully.');
      
      navigate('/');
    } catch (error) {
      // Si hay error al cancelar la reserva, mostrar mensaje de error
      alert(language === 'es'
        ? 'Error al cancelar la reserva. Por favor, contacta con soporte.'
        : 'Error cancelling reservation. Please contact support.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Función auxiliar para formatear fecha según el idioma
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const [year, month, day] = dateString.split('-');
      // Crear fecha y formatearla según el idioma (mes es 0-indexed, por eso month - 1)
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      // Si hay error al formatear, retornar la fecha original
      return dateString;
    }
  };

  // Función auxiliar para formatear precio según la moneda y el idioma
  const formatPrice = (price?: number, currency?: string): string => {
    if (!price) return '-';
    const currencyCode = currency || 'USD';
    return new Intl.NumberFormat(language === 'es' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price);
  };

  // Mostrar pantalla de carga si no hay datos de reserva aún
  if (!reservationData) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            {/* Spinner de carga */}
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            {/* Mensaje de carga */}
            <p className="text-muted">
              {language === 'es' ? 'Cargando información de la reserva...' : 'Loading reservation information...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { reservationCode, bookingDetails, paymentInfo } = reservationData;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header de éxito */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            <h1 className="h2 mb-3">
              {language === 'es' ? '¡Pago Completado!' : 'Payment Completed!'}
            </h1>
            <p className="text-muted">
              {language === 'es' 
                ? 'Tu pago se ha procesado exitosamente. Tu reserva ha sido confirmada.'
                : 'Your payment has been processed successfully. Your reservation has been confirmed.'}
            </p>
            {reservationCode && (
              <div className="alert alert-info d-inline-block">
                <strong>
                  {language === 'es' ? 'Código de reserva:' : 'Reservation code:'} {reservationCode}
                </strong>
              </div>
            )}
          </div>

          {/* Resumen de la reserva */}
          {bookingDetails && (
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">
                  <i className="fas fa-receipt me-2"></i>
                  {language === 'es' ? 'Resumen de la Reserva' : 'Reservation Summary'}
                </h3>
              </div>
              <div className="card-body">
                {/* Imagen y título */}
                {bookingDetails.imageUrl && (
                  <div className="mb-3">
                    <img 
                      src={bookingDetails.imageUrl} 
                      alt={bookingDetails.title || ''} 
                      className="img-fluid rounded"
                      style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                  </div>
                )}
                
                {bookingDetails.title && (
                  <h4 className="h5 mb-3">{bookingDetails.title}</h4>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong>
                    <p>{formatDate(bookingDetails.date)}</p>
                  </div>
                  {bookingDetails.time && (
                    <div className="col-md-6">
                      <strong>{language === 'es' ? 'Hora:' : 'Time:'}</strong>
                      <p>{bookingDetails.time}</p>
                    </div>
                  )}
                </div>

                {bookingDetails.travelers && (
                  <div className="mb-3">
                    <strong>{language === 'es' ? 'Viajeros:' : 'Travelers:'}</strong>
                    <p>
                      {bookingDetails.travelers.adults} {language === 'es' ? 'Adulto(s)' : 'Adult(s)'}
                      {bookingDetails.travelers.children > 0 && (
                        <>, {bookingDetails.travelers.children} {language === 'es' ? 'Niño(s)' : 'Child(ren)'}</>
                      )}
                    </p>
                  </div>
                )}

                {bookingDetails.meetingPoint && (
                  <div className="mb-3">
                    <strong>{language === 'es' ? 'Punto de encuentro:' : 'Meeting point:'}</strong>
                    <p>{bookingDetails.meetingPoint}</p>
                  </div>
                )}

                {bookingDetails.pickupPoint && (
                  <div className="mb-3">
                    <strong>{language === 'es' ? 'Punto de recogida:' : 'Pickup point:'}</strong>
                    <p>
                      <strong>{bookingDetails.pickupPoint.name}</strong><br />
                      {bookingDetails.pickupPoint.address}
                    </p>
                  </div>
                )}

                <hr />

                {/* Información de pago */}
                <div className="mb-3">
                  <strong>{language === 'es' ? 'Precio total:' : 'Total price:'}</strong>
                  <p className="h5 text-primary">
                    {formatPrice(bookingDetails.finalPrice || bookingDetails.price, bookingDetails.currency)}
                  </p>
                  {bookingDetails.hasDiscount && bookingDetails.originalPrice && (
                    <p className="text-muted small">
                      <del>{formatPrice(bookingDetails.originalPrice, bookingDetails.currency)}</del>
                      {' '}
                      <span className="text-success">
                        -{bookingDetails.discountPercentage || 0}%
                      </span>
                    </p>
                  )}
                </div>

                {paymentInfo?.orderId && (
                  <div className="small text-muted">
                    <strong>{language === 'es' ? 'ID de orden PayPal:' : 'PayPal Order ID:'}</strong> {paymentInfo.orderId}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Información de pago */}
          {paymentInfo && (
            <div className="card mb-4">
              <div className="card-header bg-success text-white">
                <h3 className="h5 mb-0">
                  <i className="fas fa-credit-card me-2"></i>
                  {language === 'es' ? 'Información de Pago' : 'Payment Information'}
                </h3>
              </div>
              <div className="card-body">
                {paymentInfo.status && (
                  <div className="mb-2">
                    <strong>{language === 'es' ? 'Estado:' : 'Status:'}</strong>
                    <span className="badge bg-success ms-2">{paymentInfo.status}</span>
                  </div>
                )}
                {paymentInfo.amount && (
                  <div className="mb-2">
                    <strong>{language === 'es' ? 'Monto pagado:' : 'Amount paid:'}</strong>
                    <p>{formatPrice(parseFloat(paymentInfo.amount.value), paymentInfo.amount.currency_code)}</p>
                  </div>
                )}
                {paymentInfo.timestamp && (
                  <div className="small text-muted">
                    <strong>{language === 'es' ? 'Fecha de pago:' : 'Payment date:'}</strong>{' '}
                    {new Date(paymentInfo.timestamp).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-between gap-3 mb-4">
            <button
              className="btn btn-outline-danger"
              onClick={handleCancelReservation}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {language === 'es' ? 'Cancelando...' : 'Cancelling...'}
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle me-2"></i>
                  {language === 'es' ? 'Cancelar Reserva' : 'Cancel Reservation'}
                </>
              )}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              <i className="fas fa-home me-2"></i>
              {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCompleted;

