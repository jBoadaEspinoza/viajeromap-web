import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { OrderResponse, OrderItemResponse } from '../api/orders';
import { activitiesApi, Activity } from '../api/activities';

interface PaymentCompletedState {
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'PENDING';
  paymentProvider?: string;
  paymentDetails?: any;
  orders?: OrderResponse[];
  totalAmount?: number;
  currency?: string;
}

const PaymentCompleted: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const [paymentData, setPaymentData] = useState<PaymentCompletedState | null>(null);
  const [activityDetails, setActivityDetails] = useState<Map<string, Activity>>(new Map());
  const [loading, setLoading] = useState(true);

  // Efecto para obtener datos del pago al montar el componente
  useEffect(() => {
    const stateData = location.state as PaymentCompletedState;
    
    if (stateData) {
      setPaymentData(stateData);
      sessionStorage.setItem('lastPaymentData', JSON.stringify(stateData));
    } else {
      const storedData = sessionStorage.getItem('lastPaymentData');
      if (storedData) {
        try {
          setPaymentData(JSON.parse(storedData));
        } catch (error) {
          console.error('Error parsing stored payment data:', error);
        }
      }
    }
  }, [location.state]);

  // Cargar detalles de actividades
  useEffect(() => {
    const loadActivityDetails = async () => {
      if (!paymentData?.orders) {
        setLoading(false);
      return;
    }

      // La API ya devuelve la actividad en item.activity, pero es una versión simplificada
      // Si necesitamos más detalles (como imágenes múltiples), los cargamos desde la API
      const activityIds = new Set<string>();
      paymentData.orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.activity?.id) {
            activityIds.add(item.activity.id);
          }
        });
      });

      // Cargar detalles completos de actividades desde la API
      const detailsPromises = Array.from(activityIds).map(async (activityId) => {
        try {
          const currency = paymentData.currency || 'USD';
          const activity = await activitiesApi.getById(activityId, language, currency);
          return { activityId, activity };
        } catch (err) {
          console.error(`Error loading activity ${activityId}:`, err);
          return { activityId, activity: null };
        }
      });

      const results = await Promise.all(detailsPromises);
      const detailsMap = new Map<string, Activity>();
      
      results.forEach(({ activityId, activity }) => {
        if (activity) {
          detailsMap.set(activityId, activity);
        }
      });

      setActivityDetails(detailsMap);
      setLoading(false);
    };

    if (paymentData?.orders) {
      loadActivityDetails();
    } else {
      setLoading(false);
    }
  }, [paymentData, language]);

  // Función auxiliar para formatear fecha según el idioma
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Función auxiliar para formatear hora
  const formatTime = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      // Intentar extraer hora del formato ISO
      const timeMatch = dateString.match(/T(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : dateString;
    }
  };

  // Función auxiliar para formatear precio
  const formatPrice = (price?: number, currency?: string): string => {
    if (!price) return '-';
    const currencyCode = currency || 'USD';
    return new Intl.NumberFormat(language === 'es' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: currencyCode
    }).format(price);
  };

  // Función para obtener nombre del método de pago
  const getPaymentMethodName = (provider?: string): string => {
    const methods: Record<string, string> = {
      'PAYPAL': 'PayPal',
      'GOOGLE_PAY': 'Google Pay',
      'MERCADO_PAGO': 'Mercado Pago',
      'STRIPE': 'Stripe',
      'YAPE': 'Yape',
      'NIUBIZ': 'Niubiz',
      'OTHER': language === 'es' ? 'Otro' : 'Other'
    };
    return methods[provider || ''] || (language === 'es' ? 'No especificado' : 'Not specified');
  };

  // Calcular total de todas las órdenes
  const totalAmount = paymentData?.totalAmount || 
    (paymentData?.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0);

  const currency = paymentData?.currency || paymentData?.orders?.[0]?.items?.[0]?.currency || 'USD';
  const isPendingPayment = paymentData?.paymentStatus === 'PENDING';

  // Mostrar pantalla de carga
  if (loading || !paymentData) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">
              {language === 'es' ? 'Cargando información del pago...' : 'Loading payment information...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header de éxito */}
          <div className="text-center mb-4">
            <div className="mb-3">
              <i
                className={`fas ${isPendingPayment ? 'fa-hourglass-half text-warning' : 'fa-check-circle text-success'}`}
                style={{ fontSize: '4rem' }}
              ></i>
            </div>
            <h1 className="h2 mb-3">
              {isPendingPayment
                ? (language === 'es' ? '¡Reserva Registrada!' : 'Reservation Saved!')
                : (language === 'es' ? '¡Pago Completado!' : 'Payment Completed!')}
            </h1>
            <p className="text-muted">
              {language === 'es'
                ? isPendingPayment
                  ? 'Tu reserva ha sido registrada. Recuerda completar el pago dentro del plazo indicado para confirmarla.'
                  : 'Tu pago se ha procesado exitosamente. Tu reserva ha sido confirmada.'
                : isPendingPayment
                  ? 'Your reservation has been registered. Please complete the payment within the indicated time to confirm it.'
                  : 'Your payment has been processed successfully. Your reservation has been confirmed.'}
            </p>
          </div>

          {/* Resumen de pago */}
          <div className="card mb-4">
            <div className={`card-header text-white ${isPendingPayment ? 'bg-warning' : 'bg-success'}`}>
              <h3 className="h5 mb-0">
                <i className="fas fa-receipt me-2"></i>
                {language === 'es' ? 'Resumen del Pago' : 'Payment Summary'}
              </h3>
              </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <strong>{language === 'es' ? 'Estado del pago:' : 'Payment status:'}</strong>
                  <span className={`badge ms-2 ${isPendingPayment ? 'bg-warning text-dark' : 'bg-success'}`}>
                    {language === 'es'
                      ? (isPendingPayment ? 'Pendiente' : 'Pagado')
                      : (isPendingPayment ? 'Pending' : 'Paid')}
                </span>
              </div>
                <div className="col-md-6 mb-3">
                  <strong>{language === 'es' ? 'Método de pago:' : 'Payment method:'}</strong>
                  <p className="mb-0">{getPaymentMethodName(paymentData.paymentProvider)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>{language === 'es' ? 'Total:' : 'Total:'}</strong>
                  <p className="h5 text-primary mb-0">{formatPrice(totalAmount, currency)}</p>
                </div>
                <div className="col-md-6 mb-3">
                  <strong>{language === 'es' ? 'Número de órdenes:' : 'Number of orders:'}</strong>
                  <p className="mb-0">{paymentData.orders?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de órdenes */}
          {paymentData.orders && paymentData.orders.length > 0 && (
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">
                  <i className="fas fa-list me-2"></i>
                  {language === 'es' ? 'Órdenes' : 'Orders'} ({paymentData.orders.length})
                </h3>
              </div>
              <div className="card-body">
                {paymentData.orders.map((order, orderIndex) => (
                  <div key={order.id} className={`mb-4 ${orderIndex < paymentData.orders!.length - 1 ? 'border-bottom pb-4' : ''}`}>
                    {/* Información de la orden */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="mb-1">
                          {language === 'es' ? 'Orden' : 'Order'} #{orderIndex + 1}
                        </h5>
                        <p className="text-muted small mb-0">
                          ID: {order.id}
                        </p>
                        <p className="text-muted small mb-0">
                          {language === 'es' ? 'Estado:' : 'Status:'} 
                          <span className="badge bg-info ms-2">{order.orderStatus}</span>
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="h6 mb-0">{formatPrice(order.totalAmount, order.items[0]?.currency || currency)}</p>
                        <p className="text-muted small mb-0">
                          {new Date(order.updatedAt).toLocaleString(language === 'es' ? 'es-ES' : 'en-US')}
                        </p>
                      </div>
                    </div>

                    {/* Items de la orden */}
                    <div className="row">
                      {order.items.map((item) => {
                        // Obtener detalles de la actividad
                        // Primero intentar desde activityDetails (actividad completa con imágenes)
                        // Si no está, usar item.activity (versión simplificada)
                        const activityId = item.activity?.id || '';
                        const activity = activityDetails.get(activityId) || null;
                        const activityTitle = activity?.title || item.activity?.title || '';
                        let activityImageUrl = '';
                        if (activity?.images && activity.images.length > 0) {
                          const coverImage = activity.images.find((img: any) => img.isCover);
                          activityImageUrl = coverImage?.imageUrl || activity.images[0]?.imageUrl || '';
                        } else if (item.activity?.imageUrl) {
                          // Fallback a imageUrl de la actividad simplificada
                          activityImageUrl = item.activity.imageUrl;
                        }

                        const guideLanguageCode = item.guideLanguage || undefined;
                        const guideLanguageName = guideLanguageCode
                          ? getLanguageName(guideLanguageCode, language)
                          : getTranslation('common.notSpecified', language) || (language === 'es' ? 'No especificado' : 'Not specified');

                        return (
                          <div key={item.id} className="col-12 mb-3">
                            <div className="card border">
                              <div className="card-body">
                                <div className="row">
                                  {activityImageUrl && (
                                    <div className="col-md-3 mb-3 mb-md-0">
                                      <img
                                        src={activityImageUrl}
                                        alt={activityTitle}
                      className="img-fluid rounded"
                                        style={{ maxHeight: '150px', objectFit: 'cover', width: '100%' }}
                    />
                  </div>
                )}
                                  <div className={activityImageUrl ? 'col-md-9' : 'col-12'}>
                                    <h6 className="mb-2">{activityTitle || (language === 'es' ? 'Actividad' : 'Activity')}</h6>
                                    <div className="row small">
                                      <div className="col-md-6 mb-2">
                                        <strong>{language === 'es' ? 'Fecha:' : 'Date:'}</strong> {formatDate(item.startDatetime)}
                  </div>
                                      <div className="col-md-6 mb-2">
                                        <strong>{language === 'es' ? 'Hora:' : 'Time:'}</strong> {formatTime(item.startDatetime)}
                    </div>
                                      <div className="col-md-6 mb-2">
                                        <strong>{language === 'es' ? 'Participantes:' : 'Participants:'}</strong>{' '}
                                        {item.participantsDetails?.adults || item.participants || 0} {language === 'es' ? 'adulto(s)' : 'adult(s)'}
                                        {item.participantsDetails?.children > 0 && (
                                          <>, {item.participantsDetails.children} {language === 'es' ? 'niño(s)' : 'child(ren)'}</>
                  )}
                </div>
                                      <div className="col-md-6 mb-2">
                                        <strong>{language === 'es' ? 'Idioma del guía:' : 'Guide language:'}</strong> {guideLanguageName}
                  </div>
                                      {item.meetingPickupPointAddress && (
                                        <div className="col-12 mb-2">
                                          <strong>{language === 'es' ? 'Punto de encuentro:' : 'Meeting point:'}</strong>{' '}
                                          {item.meetingPickupPointAddress}
                  </div>
                )}
                                      {item.specialRequest && (
                                        <div className="col-12 mb-2">
                                          <strong>{language === 'es' ? 'Comentario especial:' : 'Special request:'}</strong>{' '}
                                          {item.specialRequest}
                  </div>
                )}
                                      <div className="col-12 mt-2 pt-2 border-top">
                                        <div className="d-flex justify-content-between">
                                          <span>
                                            <strong>{language === 'es' ? 'Precio unitario:' : 'Unit price:'}</strong>{' '}
                                            {formatPrice(item.pricePerParticipant, item.currency)}
                                          </span>
                                          <span className="h6 mb-0">
                                            <strong>{language === 'es' ? 'Total:' : 'Total:'}</strong>{' '}
                                            {formatPrice(item.totalAmount, item.currency)}
                      </span>
                                        </div>
                </div>
                  </div>
              </div>
            </div>
              </div>
                  </div>
                  </div>
                        );
                      })}
                  </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPendingPayment && (
            <div className="alert alert-warning mb-4">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {language === 'es'
                ? 'Recibirás un correo con las instrucciones para completar el pago. Si ya realizaste el pago, te notificaremos cuando se confirme.'
                : 'You will receive an email with instructions to complete the payment. If you have already paid, we will notify you once it is confirmed.'}
            </div>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-center gap-3 mb-4">
            <button
              className="btn btn-primary btn-lg"
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
