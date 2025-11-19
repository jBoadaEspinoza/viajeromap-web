import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { ordersApi, OrderResponse } from '../api/orders';
import { useGoogleTokenValidation } from '../hooks/useGoogleTokenValidation';

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { isAuthenticated, loading: authLoading, loginWithGoogle } = useAuth();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useGoogleTokenValidation();

  // Cargar reservas disponibles
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setLoading(false);
      return;
    }

    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await ordersApi.getOrdersAvailables({
          lang: language,
          currency: currency,
          page: 0,
          size: 100,
          sortBy: 'id',
          sortDirection: 'DESC'
        });

        if (response?.data) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Error loading bookings:', err);
        setError(err?.message || (language === 'es' ? 'Error al cargar las reservas' : 'Error loading bookings'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [language, currency, isAuthenticated, authLoading]);

  // Función para formatear fecha
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Función para formatear precio
  const formatPrice = (price?: number, currencyCode?: string): string => {
    if (!price) return '-';
    const curr = currencyCode || currency || 'USD';
    return new Intl.NumberFormat(language === 'es' ? 'es-PE' : 'en-US', {
      style: 'currency',
      currency: curr
    }).format(price);
  };

  // Función para obtener el nombre del estado
  const getStatusName = (status: string): string => {
    const statusMap: Record<string, { es: string; en: string }> = {
      'CREATED': { es: 'Pendiente de pago', en: 'Pending payment' },
      'CONFIRMED': { es: 'Confirmada', en: 'Confirmed' },
      'CANCELLED': { es: 'Cancelada', en: 'Cancelled' },
      'COMPLETED': { es: 'Completada', en: 'Completed' }
    };
    return statusMap[status]?.[language] || status;
  };

  // Función para obtener el color del badge según el estado
  const getStatusBadgeClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'CREATED': 'bg-warning text-dark',
      'CONFIRMED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'COMPLETED': 'bg-info'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  // Función para obtener el nombre del estado del item
  const getItemStatusName = (status: string): string => {
    const statusMap: Record<string, { es: string; en: string }> = {
      'PENDING': { es: 'Pendiente', en: 'Pending' },
      'ATTENDED': { es: 'Asistido', en: 'Attended' },
      'CANCELLED': { es: 'Cancelado', en: 'Cancelled' },
      'COMPLETED': { es: 'Completado', en: 'Completed' }
    };
    return statusMap[status]?.[language] || status;
  };

  // Función para obtener el color del badge del estado del item
  const getItemStatusBadgeClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'PENDING': 'bg-warning text-dark',
      'ATTENDED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'COMPLETED': 'bg-info'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const renderActivityRating = (activity?: OrderResponse['items'][number]['activity']) => {
    if (!activity) {
      return null;
    }

    const rawRating = typeof activity.rating === 'number' ? activity.rating : null;
    const hasValidRating = rawRating !== null && !Number.isNaN(rawRating) && rawRating > 0;
    const ratingValue = hasValidRating ? rawRating : null;
    const normalizedRating = hasValidRating
      ? Math.max(0, Math.min(5, ratingValue!))
      : 0;
    const reviews =
      (activity as any)?.commentsCount ??
      (activity as any)?.numComments ??
      null;

    const stars = Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      if (normalizedRating >= starNumber) {
        return <i key={index} className="fas fa-star text-warning"></i>;
      }
      if (normalizedRating >= starNumber - 0.5) {
        return <i key={index} className="fas fa-star-half-alt text-warning"></i>;
      }
      return <i key={index} className="far fa-star text-warning"></i>;
    });

    return (
      <div className="text-muted small d-flex align-items-center gap-2 flex-wrap">
        <div className="d-flex align-items-center gap-1">
          {stars}
          {ratingValue != null ? (
            <span className="fw-semibold text-dark ms-1">{ratingValue.toFixed(1)}</span>
          ) : (
            <span className="fw-semibold text-muted ms-1">
              {language === 'es' ? 'Sin valoración' : 'No rating'}
            </span>
          )}
        </div>
        {reviews ? (
          <span>
            ({reviews} {language === 'es' ? 'reseñas' : 'reviews'})
          </span>
        ) : null}
      </div>
    );
  };

  // Función para confirmar reserva
  const handleConfirmReservation = async (orderId: string) => {
    if (!window.confirm(language === 'es' 
      ? '¿Estás seguro de que deseas confirmar esta reserva?'
      : 'Are you sure you want to confirm this reservation?')) {
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await ordersApi.updateOrder(orderId, {
        orderStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        paymentProvider: 'OTHER'
      });

      if (response?.success !== false) {
        alert(language === 'es' 
          ? 'Reserva confirmada exitosamente'
          : 'Reservation confirmed successfully');
        // Recargar las reservas
        const updatedResponse = await ordersApi.getOrdersAvailables({
          lang: language,
          currency: currency,
          page: 0,
          size: 100,
          sortBy: 'id',
          sortDirection: 'DESC'
        });
        if (updatedResponse?.data) {
          setOrders(updatedResponse.data);
        }
      } else {
        throw new Error(response?.message || (language === 'es' ? 'Error al confirmar la reserva' : 'Error confirming reservation'));
      }
    } catch (error: any) {
      console.error('Error confirming reservation:', error);
      alert(error?.message || (language === 'es' 
        ? 'Error al confirmar la reserva. Por favor, intenta nuevamente.'
        : 'Error confirming reservation. Please try again.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Función para solicitar cancelación
  const handleRequestCancellation = async (orderId: string) => {
    if (!window.confirm(language === 'es' 
      ? '¿Estás seguro de que deseas solicitar la cancelación de esta reserva?'
      : 'Are you sure you want to request cancellation of this reservation?')) {
      return;
    }

    setProcessingOrderId(orderId);
    try {
      const response = await ordersApi.updateOrder(orderId, {
        orderStatus: 'CANCELLED',
        paymentStatus: 'CANCELLED',
        paymentMethod: 'NONE',
        paymentProvider: 'OTHER'
      });

      if (response?.success !== false) {
        alert(language === 'es' 
          ? 'Solicitud de cancelación enviada exitosamente'
          : 'Cancellation request sent successfully');
        // Recargar las reservas
        const updatedResponse = await ordersApi.getOrdersAvailables({
          lang: language,
          currency: currency,
          page: 0,
          size: 100,
          sortBy: 'id',
          sortDirection: 'DESC'
        });
        if (updatedResponse?.data) {
          setOrders(updatedResponse.data);
        }
      } else {
        throw new Error(response?.message || (language === 'es' ? 'Error al solicitar la cancelación' : 'Error requesting cancellation'));
      }
    } catch (error: any) {
      console.error('Error requesting cancellation:', error);
      alert(error?.message || (language === 'es' 
        ? 'Error al solicitar la cancelación. Por favor, intenta nuevamente.'
        : 'Error requesting cancellation. Please try again.'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Función para toggle de expandir/colapsar orden
  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Función para chatear con proveedor
  const handleChatWithSupplier = (order: OrderResponse) => {
    // Obtener el primer item para acceder al proveedor
    const firstItem = order.items?.[0];
    if (firstItem?.activity?.supplier) {
      const supplier = firstItem.activity.supplier;
      // Aquí puedes implementar la lógica de chat
      // Por ahora, solo mostramos un mensaje
      alert(language === 'es' 
        ? `Iniciando chat con ${supplier.name}...`
        : `Starting chat with ${supplier.name}...`);
      // TODO: Implementar integración con sistema de chat
    } else {
      alert(language === 'es' 
        ? 'No se pudo obtener la información del proveedor'
        : 'Could not get supplier information');
    }
  };

  // Función para iniciar sesión
  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      const success = await loginWithGoogle();
      
      if (!success) {
        alert(language === 'es' 
          ? 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.'
          : 'Error signing in with Google. Please try again.');
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        alert(language === 'es' 
          ? 'Error al iniciar sesión. Por favor, intenta nuevamente.'
          : 'Error signing in. Please try again.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Mostrar pantalla de carga de autenticación
  if (authLoading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">
              {language === 'es' ? 'Cargando...' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="container py-4 py-md-5">
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card shadow-sm border-0">
              <div className="card-body cart-card-padding p-md-5 text-center">
                <i className="fas fa-lock cart-icon text-primary mb-3 mb-md-4" style={{ fontSize: '3rem' }}></i>
                <h3 className="h5 mb-2 mb-md-3" style={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
                  {language === 'es' ? 'Inicia sesión para ver tus reservas' : 'Sign in to view your bookings'}
                </h3>
                <p className="text-muted mb-3 mb-md-4 small" style={{ wordBreak: 'break-word' }}>
                  {language === 'es' 
                    ? 'Necesitas iniciar sesión para acceder a tus reservas.'
                    : 'You need to sign in to access your bookings.'}
                </p>
                <button 
                  className="btn btn-primary btn-sm d-md-none w-100" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      <span>{language === 'es' ? 'Iniciando sesión...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <i className="fab fa-google me-2"></i>
                      <span>{language === 'es' ? 'Iniciar sesión con Google' : 'Sign in with Google'}</span>
                    </>
                  )}
                </button>
                <button 
                  className="btn btn-primary btn-lg d-none d-md-inline-block" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {language === 'es' ? 'Iniciando sesión...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      <i className="fab fa-google me-2"></i>
                      {language === 'es' ? 'Iniciar sesión con Google' : 'Sign in with Google'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar pantalla de carga
  if (loading) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">
              {language === 'es' ? 'Cargando reservas...' : 'Loading bookings...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-md-5">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            {getTranslation('bookings.title', language) || (language === 'es' ? 'Mis Reservas' : 'My Bookings')}
          </h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {orders.length === 0 ? (
            <div className="card shadow-sm border-0">
              <div className="card-body cart-card-padding p-md-5 text-center">
                <i className="fas fa-calendar-check cart-icon text-muted mb-3 mb-md-4" style={{ fontSize: '3rem' }}></i>
                <h3 className="h5 mb-2 mb-md-3" style={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
                  {getTranslation('bookings.title', language)}
                </h3>
                <p className="text-muted mb-3 small">
                  {getTranslation('bookings.description', language)}
                </p>
                <p className="text-muted mb-4">
                  {getTranslation('bookings.emptyMessage', language) || (language === 'es' 
                    ? 'No hay reservas para mostrar'
                    : 'No bookings to display')}
                </p>
                <button 
                  className="btn btn-primary btn-sm d-md-none w-100" 
                  onClick={() => navigate('/search')}
                >
                  <i className="fas fa-search me-2"></i>
                  {language === 'es' ? 'Buscar actividades' : 'Search activities'}
                </button>
                <button 
                  className="btn btn-primary btn-lg d-none d-md-inline-block" 
                  onClick={() => navigate('/search')}
                >
                  <i className="fas fa-search me-2"></i>
                  {language === 'es' ? 'Buscar actividades' : 'Search activities'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card shadow-sm border-0 d-none d-md-block">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" style={{ width: '40px' }}></th>
                        <th scope="col">{language === 'es' ? 'Orden' : 'Order'}</th>
                        <th scope="col">{language === 'es' ? 'Actividades' : 'Activities'}</th>
                        <th scope="col">{language === 'es' ? 'Total' : 'Total'}</th>
                        <th scope="col">{language === 'es' ? 'Estado' : 'Status'}</th>
                        <th scope="col" className="text-end">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const isExpanded = expandedOrders.has(order.id);

                        return (
                          <React.Fragment key={order.id}>
                            {/* Fila principal de la orden */}
                            <tr className="table-active">
                              <td>
                                <button
                                  className="btn btn-sm btn-link p-0"
                                  onClick={() => toggleOrder(order.id)}
                                  title={isExpanded ? (language === 'es' ? 'Ocultar actividades' : 'Hide activities') : (language === 'es' ? 'Mostrar actividades' : 'Show activities')}
                                >
                                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                                </button>
                              </td>
                              <td>
                                <div className="fw-bold">
                                  {language === 'es' ? 'Orden' : 'Order'} #{order.id}
                                </div>
                                <small className="text-muted">
                                  {formatDate(order.createdAt)}
                                </small>
                              </td>
                              <td>
                                <div>
                                  {order.items.length} {language === 'es' ? 'actividad(es)' : 'activity(ies)'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold">
                                  {formatPrice(order.totalAmount, order.items[0]?.currency)}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                  {getStatusName(order.orderStatus)}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex justify-content-end gap-2 flex-wrap">
                                  {order.orderStatus === 'CREATED' && (
                                    <button
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handleConfirmReservation(order.id)}
                                      disabled={processingOrderId === order.id}
                                      title={language === 'es' ? 'Confirmar reserva' : 'Confirm reservation'}
                                    >
                                      {processingOrderId === order.id ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                      ) : (
                                        <>
                                          <i className="fas fa-dollar-sign me-1"></i>
                                          <span className="d-none d-md-inline">
                                            {language === 'es' ? 'Pagar para confirmar' : 'Pay to confirm'}
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
                                    <button
                                      className="btn btn-sm btn-outline-link text-primary"
                                      onClick={() => handleRequestCancellation(order.id)}
                                      disabled={processingOrderId === order.id}
                                      title={language === 'es' ? 'Solicitar cancelación' : 'Request cancellation'}
                                    >
                                      {processingOrderId === order.id ? (
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                      ) : (
                                        <>
                                          <span className="d-none d-md-inline">
                                            {language === 'es' ? 'Solicitar cancelación' : 'Request cancellation'}
                                          </span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {/* Filas de items (solo cuando está expandido) */}
                            {isExpanded && order.items.map((item) => (
                              <tr key={`${order.id}-${item.id}`} className="table-light">
                                <td></td>
                                <td colSpan={4}>
                                  <div className="d-flex align-items-start gap-3 py-2">
                                    {item.activity?.imageUrl && (
                                      <img
                                        src={item.activity.imageUrl}
                                        alt={item.activity.title}
                                        className="rounded"
                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                      />
                                    )}
                                    <div className="flex-grow-1">
                                      <div className="fw-semibold mb-1">{item.activity?.title || '-'}</div>
                                      {renderActivityRating(item.activity)}
                                      <div className="row g-2 small text-muted">
                                        <div className="col-md-4">
                                          <i className="fas fa-calendar-alt me-1"></i>
                                          <strong>{language === 'es' ? 'Fecha de salida:' : 'Departure date:'}</strong>
                                          <br />
                                          {formatDateTime(item.startDatetime)}
                                        </div>
                                        <div className="col-md-4">
                                          <div className="mb-2">
                                            <i className="fas fa-users me-1"></i>
                                            <strong>{language === 'es' ? 'Participantes:' : 'Participants:'}</strong>
                                            <div>
                                              {item.participantsDetails?.adults || item.participants || 0} {language === 'es' ? 'adulto(s)' : 'adult(s)'}
                                              {item.participantsDetails?.children > 0 && (
                                                <> · {item.participantsDetails.children} {language === 'es' ? 'niño(s)' : 'child(ren)'} </>
                                              )}
                                            </div>
                                          </div>
                                          {item.guideLanguage && (
                                            <div className="mb-0">
                                              <i className="fas fa-language me-1"></i>
                                              <strong>{language === 'es' ? 'Idioma:' : 'Language:'}</strong>{' '}
                                              {getLanguageName(item.guideLanguage, language)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="col-md-4">
                                          <div className="mb-2">
                                            <i className="fas fa-dollar-sign me-1"></i>
                                            <strong>{language === 'es' ? 'Total:' : 'Total:'}</strong> {formatPrice(item.totalAmount, item.currency)}
                                          </div>
                                          <div className="mb-2">
                                            <i className="fas fa-info-circle me-1"></i>
                                            <strong>{language === 'es' ? 'Estado:' : 'Status:'}</strong>{' '}
                                            <span className={`badge ${getItemStatusBadgeClass(item.status)} ms-1`}>
                                              {getItemStatusName(item.status)}
                                            </span>
                                          </div>
                                          {item.cancelUntilDate && (
                                            <div className="mb-0">
                                              <i className="fas fa-calendar-times me-1"></i>
                                              <strong>{language === 'es' ? 'Cancelación gratis hasta:' : 'Free cancellation until:'}</strong>{' '}
                                              {formatDateTime(item.cancelUntilDate)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => handleChatWithSupplier(order)}
                                    title={language === 'es' ? 'Chatear con proveedor' : 'Chat with supplier'}
                                  >
                                    <i className="fas fa-comments me-1"></i>
                                    <span className="d-none d-md-inline">
                                      {language === 'es' ? 'Chatear con proveedor' : 'Chat with supplier'}
                                    </span>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
              {/* Vista móvil */}
              <div className="d-md-none">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);

                  return (
                    <div key={order.id} className="card shadow-sm border-0 mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">
                              {language === 'es' ? 'Orden' : 'Order'} #{order.id}
                            </div>
                            <small className="text-muted d-block">
                              {formatDate(order.createdAt)}
                            </small>
                          </div>
                          <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                            {getStatusName(order.orderStatus)}
                          </span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <div>
                            <small className="text-muted d-block">
                              {language === 'es' ? 'Total' : 'Total'}
                            </small>
                            <div className="fw-bold">
                              {formatPrice(order.totalAmount, order.items[0]?.currency)}
                            </div>
                          </div>
                          <button
                            className="btn btn-link text-decoration-none p-0"
                            onClick={() => toggleOrder(order.id)}
                          >
                            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
                            {isExpanded
                              ? (language === 'es' ? 'Ocultar actividades' : 'Hide activities')
                              : (language === 'es' ? 'Ver actividades' : 'View activities')}
                          </button>
                        </div>

                        <div className="d-grid gap-2 mt-3">
                          {order.orderStatus === 'CREATED' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleConfirmReservation(order.id)}
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id
                                ? (language === 'es' ? 'Procesando...' : 'Processing...')
                                : (language === 'es' ? 'Pagar para confirmar' : 'Pay to confirm')}
                            </button>
                          )}
                          {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'COMPLETED' && (
                            <button
                              className="btn btn-outline-link text-primary"
                              onClick={() => handleRequestCancellation(order.id)}
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id
                                ? (language === 'es' ? 'Procesando...' : 'Processing...')
                                : (language === 'es' ? 'Solicitar cancelación' : 'Request cancellation')}
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-3">
                            {order.items.map((item) => (
                              <div key={item.id} className="border rounded p-3 mb-3">
                                <div className="d-flex align-items-start gap-3 mb-2">
                                  {item.activity?.imageUrl && (
                                    <img
                                      src={item.activity.imageUrl}
                                      alt={item.activity.title}
                                      className="rounded"
                                      style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-semibold">{item.activity?.title || '-'}</div>
                                  </div>
                                </div>
                                <div className="mb-2">
                                  {renderActivityRating(item.activity)}
                                </div>
                                <div className="small text-muted">
                                  <div className="mb-2 d-flex align-items-center gap-2">
                                    <i className="fas fa-star me-1"></i>
                                    <strong>{language === 'es' ? 'Valoración:' : 'Rating:'}</strong>
                                    <span>{item.activity?.rating || '-'}</span>
                                  </div>
                                  <div className="mb-2">
                                    <i className="fas fa-calendar-alt me-1"></i>
                                    <strong>{language === 'es' ? 'Fecha de salida:' : 'Departure date:'}</strong>{' '}
                                    {formatDateTime(item.startDatetime)}
                                  </div>
                                  {item.cancelUntilDate && (
                                    <div className="mb-2">
                                      <i className="fas fa-calendar-times me-1"></i>
                                      <strong>{language === 'es' ? 'Cancelación hasta:' : 'Cancellation until:'}</strong>{' '}
                                      {formatDateTime(item.cancelUntilDate)}
                                      <div className="small text-muted mt-1">
                                        {language === 'es'
                                          ? 'Cancelación gratis hasta esta fecha; luego se aplicarán penalidades.'
                                          : 'Free cancellation until this date; penalties may apply afterwards.'}
                                      </div>
                                    </div>
                                  )}
                                  <div className="mb-2">
                                    <i className="fas fa-users me-1"></i>
                                    <strong>{language === 'es' ? 'Participantes:' : 'Participants:'}</strong>
                                    <div>
                                      {item.participantsDetails?.adults || item.participants || 0} {language === 'es' ? 'adulto(s)' : 'adult(s)'}
                                      {item.participantsDetails?.children > 0 && (
                                        <> · {item.participantsDetails.children} {language === 'es' ? 'niño(s)' : 'child(ren)'} </>
                                      )}
                                    </div>
                                  </div>
                                  {item.guideLanguage && (
                                    <div className="mb-2">
                                      <i className="fas fa-language me-1"></i>
                                      <strong>{language === 'es' ? 'Idioma:' : 'Language:'}</strong>{' '}
                                      {getLanguageName(item.guideLanguage, language)}
                                    </div>
                                  )}
                                  <div className="mb-2">
                                    <i className="fas fa-dollar-sign me-1"></i>
                                    <strong>{language === 'es' ? 'Total:' : 'Total:'}</strong>{' '}
                                    {formatPrice(item.totalAmount, item.currency)}
                                  </div>
                                  <div>
                                    <i className="fas fa-info-circle me-1"></i>
                                    <strong>{language === 'es' ? 'Estado:' : 'Status:'}</strong>{' '}
                                    <span className={`badge ${getItemStatusBadgeClass(item.status)} ms-1`}>
                                      {getItemStatusName(item.status)}
                                    </span>
                                  </div>
                                </div>

                                <div className="d-grid mt-3">
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleChatWithSupplier(order)}
                                  >
                                    <i className="fas fa-comments me-1"></i>
                                    {language === 'es' ? 'Chatear con proveedor' : 'Chat with supplier'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bookings;
