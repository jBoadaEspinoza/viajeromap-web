import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { ordersApi, OrderResponse } from '../api/orders';
import { useGoogleTokenValidation } from '../hooks/useGoogleTokenValidation';
import ActivityReviewModal from '../components/ActivityReviewModal';
import { capitalizeWords } from '../utils/helpers';
import ChatButton from '../components/chat/ChatButton';
import ChatWindowClient from '../components/chat/ChatWindowClient';
import { OrderItemResponse } from '../api/orders';

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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReviewActivity, setSelectedReviewActivity] = useState<{
    activityId: string;
    orderItemId: number;
    activityTitle?: string;
  } | null>(null);
  // Estados para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderIdToConfirm, setOrderIdToConfirm] = useState<string | null>(null);
  // Estado para rastrear si el chat está abierto
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Estado para el chat del cliente (nuevo sistema basado en orderItemId)
  const [openChatOrderItem, setOpenChatOrderItem] = useState<OrderItemResponse | null>(null);
  // Filtros avanzados
  const [orderStatusFilter, setOrderStatusFilter] = useState<string[]>([]);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [sortBy, setSortBy] = useState<'startDateTime' | 'createdAt'>('startDateTime'); // Por defecto fecha de salida
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Estados temporales para los filtros (usados tanto en desktop como móvil)
  const [tempOrderStatusFilter, setTempOrderStatusFilter] = useState<string[]>([]);
  const [tempPaymentStatusFilter, setTempPaymentStatusFilter] = useState<string>('');
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [tempReferenceCode, setTempReferenceCode] = useState<string>('');
  const [tempSortBy, setTempSortBy] = useState<'startDateTime' | 'createdAt'>('startDateTime');
  const [tempSortDirection, setTempSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [showTempStatusDropdown, setShowTempStatusDropdown] = useState(false);
  // Estados para el nuevo filtro de fecha
  const [initialDate, setInitialDate] = useState<string>('');
  const [dateType, setDateType] = useState<'start' | 'end' | ''>('');
  const [tempInitialDate, setTempInitialDate] = useState<string>('');
  const [tempDateType, setTempDateType] = useState<'start' | 'end' | ''>('');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  // Estado para controlar qué bottom sheet de acciones está abierto
  const [showActionsBottomSheet, setShowActionsBottomSheet] = useState(false);
  const [orderIdForActions, setOrderIdForActions] = useState<string | null>(null);

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
          orderStatus: orderStatusFilter.length > 0 ? orderStatusFilter.join(',') : undefined,
          paymentStatus: paymentStatusFilter || undefined,
          orderId: referenceCode || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sortBy: sortBy,
          sortDirection: sortDirection
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
  }, [language, currency, isAuthenticated, authLoading, orderStatusFilter, paymentStatusFilter, fromDate, toDate, referenceCode, sortBy, sortDirection]);
  
  // Inicializar estados temporales con los filtros actuales al montar
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      setTempOrderStatusFilter([...orderStatusFilter]);
      setTempPaymentStatusFilter(paymentStatusFilter);
      setTempFromDate(fromDate);
      setTempToDate(toDate);
      setTempReferenceCode(referenceCode);
      setTempSortBy(sortBy);
      setTempSortDirection(sortDirection);
      // Convertir fromDate/toDate a initialDate/dateType si existen
      if (fromDate) {
        setTempInitialDate(fromDate);
        setTempDateType('start');
      } else if (toDate) {
        setTempInitialDate(toDate);
        setTempDateType('end');
      } else {
        setTempInitialDate('');
        setTempDateType('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]);

  // Cerrar dropdown de fecha al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePickerModal && !target.closest('.date-picker-dropdown-container')) {
        setShowDatePickerModal(false);
      }
    };

    if (showDatePickerModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePickerModal]);


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
      const day = date.getDate();
      const monthNames = language === 'es' 
        ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? (language === 'es' ? 'p. m.' : 'P. M.') : (language === 'es' ? 'a. m.' : 'A. M.');
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      return `${day} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    } catch {
      return dateString;
    }
  };

  // Función para formatear fecha y hora en formato AM/PM desde UTC
  // dateString debe estar en formato UTC (ISO 8601)
  const formatDateTimeAMPM = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      // Asegurar que el string se interprete como UTC
      // Si no tiene 'Z' o offset, agregar 'Z' para indicar UTC
      let utcString = dateString.trim();
      const hasTimezone = utcString.endsWith('Z') || utcString.match(/[+-]\d{2}:\d{2}$/);
      
      if (!hasTimezone) {
        // Remover milisegundos si existen y agregar 'Z' para indicar UTC
        utcString = utcString.replace(/\.\d{3,}$/, '') + 'Z';
      }
      
      // Crear fecha interpretando el string como UTC
      const date = new Date(utcString);
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const day = date.getUTCDate();
      const monthNames = language === 'es' 
        ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getUTCMonth()];
      const year = date.getUTCFullYear();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const ampm = hours >= 12 ? (language === 'es' ? 'p. m.' : 'P. M.') : (language === 'es' ? 'a. m.' : 'A. M.');
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      return `${day} ${month} ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting date:', error);
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

  // Función para calcular el total de la orden excluyendo items cancelados
  const calculateOrderTotal = (order: OrderResponse): number => {
    return order.items
      .filter(item => item.status !== 'CANCELLED')
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
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
      'ATTENDING': { es: 'En curso', en: 'Attending' },
      'ATTENDED': { es: 'Atendido', en: 'Attended' },
      'CANCELLED': { es: 'Cancelado', en: 'Cancelled' },
      'NO_SHOW': { es: 'No asistió', en: 'No Show' }
    };
    return statusMap[status]?.[language] || status;
  };

  // Función para obtener el color del badge del estado del item
  const getItemStatusBadgeClass = (status: string): string => {
    const statusClasses: Record<string, string> = {
      'PENDING': 'bg-warning text-dark',
      'ATTENDING': 'bg-info',
      'ATTENDED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'NO_SHOW': 'bg-secondary'
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

  // Función para abrir modal de confirmación
  const handleConfirmReservation = (orderId: string) => {
    setOrderIdToConfirm(orderId);
    setShowConfirmModal(true);
  };

  // Función para confirmar y navegar
  const handleConfirmAndNavigate = () => {
    if (orderIdToConfirm) {
      setShowConfirmModal(false);
      // Navegar a la página de pago para confirmar con orderId en la URL
      navigate(`/pay-to-confirm?orderId=${orderIdToConfirm}`);
      setOrderIdToConfirm(null);
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
          sortBy: 'startDateTime',
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


  // Función para dejar valoración o comentario
  const handleLeaveReview = (activityId: string, orderItemId: number, activityTitle?: string) => {
    setSelectedReviewActivity({
      activityId,
      orderItemId,
      activityTitle
    });
    setReviewModalOpen(true);
  };

  // Función para cerrar el modal de valoración
  const handleCloseReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedReviewActivity(null);
  };

  // Función para refrescar las reservas después de crear una valoración
  const handleReviewCreated = async () => {
    try {
      const response = await ordersApi.getOrdersAvailables({
        lang: language,
        currency: currency,
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC'
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err: any) {
      console.error('Error refreshing bookings after review:', err);
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

  // Función para calcular fecha + 7 días
  const addDays = (dateString: string, days: number): string => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  // Función para formatear fecha de YYYY-MM-DD a dd/mm/yyyy
  const formatDateDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Función para obtener el texto a mostrar en el input de fecha
  const getDateInputText = (): string => {
    if (tempFromDate && tempToDate) {
      return `${formatDateDisplay(tempFromDate)} - ${formatDateDisplay(tempToDate)}`;
    }
    return language === 'es' ? 'Desde - Hasta' : 'From - To';
  };

  // Función para manejar selección de fecha inicial (desktop)
  const handleInitialDateChange = (date: string) => {
    setInitialDate(date);
    if (date && !dateType) {
      // Si hay fecha pero no tipo, no hacer nada (esperar a que seleccione tipo)
    }
  };

  // Función para manejar selección de tipo de fecha (desktop)
  const handleDateTypeChange = (type: 'start' | 'end') => {
    setDateType(type);
    if (type === 'start' && initialDate) {
      // Si selecciona start, auto-completar end con +7 días
      setToDate(addDays(initialDate, 7));
      setFromDate(initialDate);
    } else if (type === 'end' && initialDate) {
      // Si selecciona end, validar que sea >= start
      if (fromDate && initialDate < fromDate) {
        // Si end es menor que start, ajustar a start
        setToDate(fromDate);
      } else {
        setToDate(initialDate);
      }
    }
  };

  // Función para manejar cambio de fecha end (desktop) con validación
  const handleEndDateChange = (date: string) => {
    if (fromDate && date < fromDate) {
      // No permitir que end sea menor que start
      return;
    }
    setToDate(date);
  };

  // Función para manejar selección de fecha inicial (temporal)
  const handleTempInitialDateChange = (date: string) => {
    setTempInitialDate(date);
    if (date && !tempDateType) {
      // Si hay fecha pero no tipo, no hacer nada (esperar a que seleccione tipo)
    }
  };

  // Función para manejar selección de tipo de fecha (temporal)
  const handleTempDateTypeChange = (type: 'start' | 'end') => {
    setTempDateType(type);
    if (type === 'start' && tempInitialDate) {
      // Si selecciona start, auto-completar end con +7 días
      setTempToDate(addDays(tempInitialDate, 7));
      setTempFromDate(tempInitialDate);
    } else if (type === 'end' && tempInitialDate) {
      // Si selecciona end, establecer toDate
      // Si ya hay fromDate y end es menor, ajustar
      if (tempFromDate && tempInitialDate < tempFromDate) {
        setTempToDate(tempFromDate);
      } else {
        setTempToDate(tempInitialDate);
        // Si no hay fromDate, establecerlo también
        if (!tempFromDate) {
          setTempFromDate(tempInitialDate);
        }
      }
    }
  };

  // Función para manejar cambio de fecha end (temporal) con validación
  const handleTempEndDateChange = (date: string) => {
    if (tempFromDate && date < tempFromDate) {
      // No permitir que end sea menor que start
      return;
    }
    setTempToDate(date);
  };

  // Función para abrir el bottomSheet y cargar los filtros actuales
  const handleOpenMobileFilters = () => {
    setTempOrderStatusFilter([...orderStatusFilter]);
    setTempPaymentStatusFilter(paymentStatusFilter);
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setTempReferenceCode(referenceCode);
    setTempSortBy(sortBy);
    setTempSortDirection(sortDirection);
    // Convertir fromDate/toDate a initialDate/dateType si existen
    if (fromDate) {
      setTempInitialDate(fromDate);
      setTempDateType('start');
    } else if (toDate) {
      setTempInitialDate(toDate);
      setTempDateType('end');
    } else {
      setTempInitialDate('');
      setTempDateType('');
    }
    setShowMobileFilters(true);
  };

  // Función para aplicar los filtros (desde bottomSheet o desktop)
  const handleApplyFilters = () => {
    setOrderStatusFilter([...tempOrderStatusFilter]);
    setPaymentStatusFilter(tempPaymentStatusFilter);
    setReferenceCode(tempReferenceCode);
    setSortBy(tempSortBy);
    setSortDirection(tempSortDirection);
    
    // Convertir tempInitialDate/tempDateType a fromDate/toDate si existen
    if (tempInitialDate && tempDateType === 'start') {
      setFromDate(tempInitialDate);
      // Si no hay toDate, usar +7 días
      if (!tempToDate) {
        setToDate(addDays(tempInitialDate, 7));
      } else {
        setToDate(tempToDate);
      }
    } else if (tempInitialDate && tempDateType === 'end') {
      setToDate(tempInitialDate);
      // Si no hay fromDate, usar la misma fecha
      if (!tempFromDate) {
        setFromDate(tempInitialDate);
      } else {
        setFromDate(tempFromDate);
      }
    } else {
      // Si no hay initialDate, limpiar fechas
      setFromDate(tempFromDate);
      setToDate(tempToDate);
    }
    
    // También actualizar estados activos desde temporales
    if (tempInitialDate && tempDateType) {
      setInitialDate(tempInitialDate);
      setDateType(tempDateType);
    } else {
      setInitialDate('');
      setDateType('');
    }
    
    setShowMobileFilters(false);
  };

  // Función para limpiar los filtros temporales (usado en el modal)
  const handleClearFilters = () => {
    setTempOrderStatusFilter([]);
    setTempPaymentStatusFilter('');
    setTempFromDate('');
    setTempToDate('');
    setTempReferenceCode('');
    setTempSortBy('startDateTime');
    setTempSortDirection('DESC');
    setTempInitialDate('');
    setTempDateType('');
  };

  // Función para obtener la ubicación del usuario
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(language === 'es' ? 'Geolocalización no está disponible en este navegador' : 'Geolocation is not available in this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Función para abrir Google Maps con la ruta
  const handleOpenDirections = async (item: OrderItemResponse) => {
    if (!item.meetingPickupPointAddress) return;

    let userLocation: { lat: number; lng: number } | null = null;

    // Intentar obtener la ubicación del usuario
    try {
      userLocation = await getUserLocation();
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Continuar sin la ubicación del usuario
    }

    // Construir la URL de Google Maps
    const destination = item.meetingPickupPointLatitude && item.meetingPickupPointLongitude
      ? `${item.meetingPickupPointLatitude},${item.meetingPickupPointLongitude}`
      : encodeURIComponent(item.meetingPickupPointAddress);

    let mapsUrl: string;
    if (userLocation) {
      const origin = `${userLocation.lat},${userLocation.lng}`;
      mapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
    }

    // Abrir Google Maps en una nueva pestaña
    window.open(mapsUrl, '_blank');
  };

  // Función para contar filtros activos
  const getActiveFiltersCount = (): number => {
    // Si el bottom sheet está abierto, usar filtros temporales para mostrar el contador en tiempo real
    const statusFilter = showMobileFilters ? tempOrderStatusFilter : orderStatusFilter;
    const paymentFilter = showMobileFilters ? tempPaymentStatusFilter : paymentStatusFilter;
    const fromDateFilter = showMobileFilters ? tempFromDate : fromDate;
    const toDateFilter = showMobileFilters ? tempToDate : toDate;
    const referenceFilter = showMobileFilters ? tempReferenceCode : referenceCode;
    
    let count = 0;
    if (statusFilter.length > 0) count++;
    if (paymentFilter) count++;
    if (fromDateFilter || toDateFilter) count++;
    if (referenceFilter) count++;
    return count;
  };

  // Función para limpiar todos los filtros (activos y temporales)
  const handleClearAllFilters = () => {
    // Limpiar filtros activos
    setOrderStatusFilter([]);
    setPaymentStatusFilter('');
    setFromDate('');
    setToDate('');
    setReferenceCode('');
    setSortBy('startDateTime');
    setSortDirection('DESC');
    setInitialDate('');
    setDateType('');
    
    // Limpiar filtros temporales
    setTempOrderStatusFilter([]);
    setTempPaymentStatusFilter('');
    setTempFromDate('');
    setTempToDate('');
    setTempReferenceCode('');
    setTempSortBy('startDateTime');
    setTempSortDirection('DESC');
    setTempInitialDate('');
    setTempDateType('');
  };

  return (
    <>
    <div className="container py-4 py-md-5" style={{ marginRight: isChatOpen ? '350px' : 'auto', marginLeft: 'auto', maxWidth: '1200px' }}>
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              {getTranslation('bookings.title', language) || (language === 'es' ? 'Mis Reservas' : 'My Bookings')}
            </h2>
            {/* Botón de filtros para móvil */}
            <button
              className="btn btn-link p-0 d-md-none"
              onClick={handleOpenMobileFilters}
              style={{ 
                textDecoration: 'none',
                color: '#1a365d',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <i className="fas fa-filter" style={{ color: '#1a365d', fontSize: '1.1rem' }}></i>
              <span style={{ color: '#1a365d', marginLeft: '8px', fontWeight: '500' }}>
                {language === 'es' ? 'Filtros' : 'Filters'} ({getActiveFiltersCount()})
              </span>
            </button>
          </div>

          {/* Filtros avanzados según diseño */}
          <div className="d-none d-md-block mb-3">
            <div className="row g-2 align-items-end">
              {/* Estado de la orden */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {language === 'es' ? 'Estado' : 'Status'}
                </label>
                <div className="position-relative">
                  <div
                    className="form-control form-control-sm d-flex justify-content-between align-items-center"
                    style={{
                      cursor: 'pointer',
                      border: showStatusDropdown ? '1px solid #dc3545' : '1px solid #ced4da',
                      minHeight: '31px',
                      width: '150px'
                    }}
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  >
                    <span className="small text-truncate">
                      {tempOrderStatusFilter.length === 0
                        ? (language === 'es' ? 'Todos' : 'All')
                        : tempOrderStatusFilter.length === 1
                        ? getStatusName(tempOrderStatusFilter[0])
                        : `${tempOrderStatusFilter.length} ${language === 'es' ? 'sel.' : 'sel.'}`}
                    </span>
                    <i className={`fas fa-chevron-${showStatusDropdown ? 'up' : 'down'} small ms-1`}></i>
                  </div>
                  {showStatusDropdown && (
                    <>
                      <div
                        className="position-fixed top-0 start-0 end-0 bottom-0"
                        style={{ zIndex: 1040 }}
                        onClick={() => setShowStatusDropdown(false)}
                      />
                      <div
                        className="position-absolute bg-white border rounded shadow-sm"
                        style={{
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1050,
                          marginTop: '4px',
                          border: '1px solid #dc3545',
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {['CREATED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((status) => (
                          <div 
                            key={status} 
                            className="d-flex align-items-center p-2" 
                            style={{ 
                              borderBottom: '1px solid #f0f0f0',
                              cursor: 'pointer',
                              backgroundColor: tempOrderStatusFilter.includes(status) ? '#f8f9fa' : 'transparent',
                              minHeight: '38px'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (tempOrderStatusFilter.includes(status)) {
                                setTempOrderStatusFilter(tempOrderStatusFilter.filter(s => s !== status));
                              } else {
                                setTempOrderStatusFilter([...tempOrderStatusFilter, status]);
                              }
                            }}
                          >
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`status-${status}`}
                              checked={tempOrderStatusFilter.includes(status)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setTempOrderStatusFilter([...tempOrderStatusFilter, status]);
                                } else {
                                  setTempOrderStatusFilter(tempOrderStatusFilter.filter(s => s !== status));
                                }
                              }}
                              style={{ 
                                cursor: 'pointer', 
                                marginTop: '0',
                                marginRight: '8px',
                                width: '18px',
                                height: '18px',
                                flexShrink: 0
                              }}
                            />
                            <label 
                              className="small flex-grow-1 mb-0" 
                              htmlFor={`status-${status}`} 
                              style={{ cursor: 'pointer' }}
                            >
                              {getStatusName(status)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Estado del pago */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {language === 'es' ? 'Estado del pago' : 'Payment status'}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={tempPaymentStatusFilter}
                  onChange={(e) => setTempPaymentStatusFilter(e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
                  <option value="PENDING">{language === 'es' ? 'Pendiente' : 'Pending'}</option>
                  <option value="PAID">{language === 'es' ? 'Pagado' : 'Paid'}</option>
                  <option value="CANCELLED">{language === 'es' ? 'Cancelado' : 'Cancelled'}</option>
                  <option value="REFUNDED">{language === 'es' ? 'Reembolsado' : 'Refunded'}</option>
                </select>
              </div>

              {/* Fecha de la actividad */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {language === 'es' ? 'Fecha de la actividad' : 'Activity date'}
                </label>
                <div className="position-relative date-picker-dropdown-container">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={getDateInputText()}
                    onClick={() => setShowDatePickerModal(!showDatePickerModal)}
                    readOnly
                    style={{ cursor: 'pointer', width: '180px' }}
                  />
                  <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted" style={{ pointerEvents: 'none' }}></i>
                  
                  {/* Dropdown de fechas */}
                  {showDatePickerModal && (
                    <div 
                      className="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg p-3"
                      style={{ 
                        zIndex: 1000, 
                        minWidth: '300px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="row g-3 mb-3">
                        <div className="col-6">
                          <label className="form-label small text-muted mb-1">
                            {language === 'es' ? 'Desde' : 'From'}
                          </label>
                          <div className="position-relative">
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={tempFromDate}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                setTempFromDate(selectedDate);
                                // Automáticamente establecer "Hasta" con 7 días después
                                if (selectedDate) {
                                  setTempToDate(addDays(selectedDate, 7));
                                } else {
                                  setTempToDate('');
                                }
                              }}
                              max={tempToDate || undefined}
                            />
                            <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted small" style={{ pointerEvents: 'none' }}></i>
                          </div>
                        </div>
                        <div className="col-6">
                          <label className="form-label small text-muted mb-1">
                            {language === 'es' ? 'Hasta' : 'To'}
                          </label>
                          <div className="position-relative">
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={tempToDate}
                              onChange={(e) => handleTempEndDateChange(e.target.value)}
                              min={tempFromDate || undefined}
                            />
                            <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted small" style={{ pointerEvents: 'none' }}></i>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botones */}
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setTempFromDate('');
                            setTempToDate('');
                            setTempInitialDate('');
                            setTempDateType('');
                          }}
                        >
                          {language === 'es' ? 'Limpiar' : 'Clear'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setShowDatePickerModal(false);
                          }}
                        >
                          {language === 'es' ? 'Aplicar' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Código de referencia */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {language === 'es' ? 'Código de referencia' : 'Reference code'}
                </label>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light" style={{ padding: '0.25rem 0.5rem' }}>
                    <i className="fas fa-file-alt"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    value={tempReferenceCode}
                    onChange={(e) => setTempReferenceCode(e.target.value)}
                    placeholder={language === 'es' ? 'Orden #...' : 'Order #...'}
                    style={{ width: '120px' }}
                  />
                </div>
              </div>

              {/* Ordenar por */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {language === 'es' ? 'Ordenar por' : 'Order by'}
                </label>
                <select
                  className="form-select form-select-sm"
                  value={`${tempSortBy}-${tempSortDirection}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDirection] = e.target.value.split('-');
                    if (newSortBy === 'startDateTime' || newSortBy === 'createdAt') {
                      setTempSortBy(newSortBy);
                    }
                    setTempSortDirection(newSortDirection as 'ASC' | 'DESC');
                  }}
                  style={{ width: '160px' }}
                >
                  <option value="startDateTime-DESC">
                    {language === 'es' ? 'Salida (Desc)' : 'Departure (Desc)'}
                  </option>
                  <option value="startDateTime-ASC">
                    {language === 'es' ? 'Salida (Asc)' : 'Departure (Asc)'}
                  </option>
                  <option value="createdAt-DESC">
                    {language === 'es' ? 'Compra (Desc)' : 'Purchase (Desc)'}
                  </option>
                  <option value="createdAt-ASC">
                    {language === 'es' ? 'Compra (Asc)' : 'Purchase (Asc)'}
                  </option>
                </select>
              </div>

              {/* Botones aplicar y limpiar */}
              <div className="col-auto">
                <label className="form-label small fw-semibold text-dark mb-1" style={{ fontSize: '0.75rem', visibility: 'hidden' }}>
                  &nbsp;
                </label>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleApplyFilters}
                  >
                    <i className="fas fa-check me-1"></i>
                    {language === 'es' ? 'Aplicar' : 'Apply'}
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleClearAllFilters}
                  >
                    <i className="fas fa-times me-1"></i>
                    {language === 'es' ? 'Limpiar' : 'Clear'}
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                            <tr 
                              className="table-active"
                              style={order.orderStatus === 'CANCELLED' ? { 
                                filter: 'grayscale(100%)',
                                opacity: 0.6
                              } : {}}
                            >
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
                                  <i className="fas fa-shopping-cart me-1"></i>
                                  {formatDateTimeAMPM(order.createdAt)}
                                </small>
                              </td>
                              <td>
                                <div>
                                  {order.items.filter(item => item.status !== 'CANCELLED').length} {language === 'es' ? 'actividad(es)' : 'activity(ies)'}
                                </div>
                              </td>
                              <td>
                                <div className="fw-bold">
                                  {formatPrice(calculateOrderTotal(order), order.items[0]?.currency)}
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
                                          <button className="btn btn-sm btn-primary" onClick={() => handleConfirmReservation(order.id)} disabled={processingOrderId === order.id}>
                                            <i className="fas fa-dollar-sign me-1"></i>{language === 'es' ? 'Pagar para confirmar' : 'Pay to confirm'}
                                          </button>
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
                              <tr 
                                key={`${order.id}-${item.id}`} 
                                className="table-light"
                                style={item.status === 'CANCELLED' ? { 
                                  filter: 'grayscale(100%)',
                                  opacity: 0.6
                                } : {}}
                              >
                                <td></td>
                                <td colSpan={4}>
                                  <div className="d-flex align-items-start gap-3 py-2">
                                    {item.activity?.imageUrl && (
                                      <img
                                        src={item.activity.imageUrl}
                                        alt={item.activity.title}
                                        className="rounded"
                                        style={{ 
                                          width: '60px', 
                                          height: '60px', 
                                          objectFit: 'cover',
                                          ...(item.status === 'CANCELLED' ? { 
                                            filter: 'grayscale(100%)',
                                            opacity: 0.6
                                          } : {})
                                        }}
                                      />
                                    )}
                                    <div className="flex-grow-1">
                                      <div className="fw-bold mb-1" style={{ fontSize: '0.95rem' }}>{item.activity?.title || '-'}</div>
                                      {item.bookingOptionId && (
                                        <div className="text-muted small mb-1" style={{ fontSize: '0.8rem' }}>
                                          {language === 'es' ? 'Opción:' : 'Option:'} {item.bookingOptionId} | {item.activity?.title || '-'}
                                        </div>
                                      )}
                                      {renderActivityRating(item.activity)}
                                      <div className="row g-2" style={{ fontSize: '0.875rem' }}>
                                        <div className="col-md-4">
                                          <div className="mb-1">
                                            <i className="fas fa-calendar-alt me-1 text-muted"></i>
                                            <span className="text-muted">{language === 'es' ? 'Inicio:' : 'Start:'}</span>{' '}
                                            <span>{formatDateTime(item.startDatetime)} ({item.timeZone})</span>
                                          </div>
                                          {item.endDatetime && (
                                            <div className="mb-1">
                                              <i className="fas fa-clock me-1 text-muted"></i>
                                              <span className="text-muted">{language === 'es' ? 'Fin:' : 'End:'}</span>{' '}
                                              <span>{formatDateTime(item.endDatetime)} ({item.timeZone})</span>
                                            </div>
                                          )}
                                          
                                        </div>
                                        <div className="col-md-4">
                                          <div className="mb-1">
                                            <i className="fas fa-file-alt me-1 text-muted"></i>
                                            <span className="text-muted">{language === 'es' ? 'Código de reserva:' : 'Booking code:'}</span>{' '}
                                            <span className="fw-semibold">{order.id}</span>
                                          </div>
                                          <div className="mb-1">
                                            <i className="fas fa-users me-1 text-muted"></i>
                                            <span className="text-muted">{language === 'es' ? 'Participantes:' : 'Participants:'}</span>{' '}
                                            <span>
                                              {item.participantsDetails?.adults || item.participants || 0} {language === 'es' ? 'adultos' : 'adults'}
                                              {item.participantsDetails?.children > 0 && (
                                                <> · {item.participantsDetails.children} {language === 'es' ? 'niño' : 'child'} </>
                                              )}
                                              {' - '}
                                              {formatPrice(item.totalAmount, item.currency)}
                                            </span>
                                          </div>
                                          {item.guideLanguage && (
                                            <div className="mb-1">
                                              <i className="fas fa-language me-1 text-muted"></i>
                                              <span className="text-muted">{language === 'es' ? 'Idioma:' : 'Language:'}</span>{' '}
                                              <span>{getLanguageName(item.guideLanguage, language)}</span>
                                            </div>
                                          )}
                                          
                                        </div>
                                        <div className="col-md-4">
                                          {/* Punto de encuentro */}
                                          {item.meetingPickupPointAddress && (
                                            <div className="mb-1">
                                              <i className="fas fa-map-marker-alt me-1 text-muted"></i>
                                              <span className="text-muted">{language === 'es' ? 'Punto de encuentro:' : 'Meeting point:'}</span>{' '}
                                              <span>{item.meetingPickupPointAddress}</span>
                                              <div className="mt-1">
                                                <button
                                                  className="btn btn-sm btn-outline-primary"
                                                  onClick={() => handleOpenDirections(item)}
                                                  style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                                                >
                                                  <i className="fas fa-directions me-1"></i>
                                                  {language === 'es' ? 'Cómo llegar' : 'Get directions'}
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                          {/* Proveedor */}
                                          {item.activity?.supplier && (
                                            <div className="mb-1">
                                              <i className="fas fa-store me-1 text-muted"></i>
                                              <span className="text-muted">{language === 'es' ? 'Proveedor:' : 'Supplier:'}</span>{' '}
                                              <span>
                                                {item.activity.supplier.name}
                                                {item.activity.supplier.isVerified && (
                                                  <i className="fas fa-check-circle text-success ms-1" title={language === 'es' ? 'Verificado' : 'Verified'}></i>
                                                )}
                                              </span>
                                            </div>
                                          )}
                                          {/* Estado */}
                                          <div className="mb-1">
                                            <i className="fas fa-info-circle me-1 text-muted"></i>
                                            <span className="text-muted">{language === 'es' ? 'Estado:' : 'Status:'}</span>{' '}
                                            <span className={`badge ${getItemStatusBadgeClass(item.status)}`}>
                                              {getItemStatusName(item.status)}
                                            </span>
                                          </div>
                                          {/* Cancelación gratis hasta */}
                                          {item.cancelUntilDate && new Date(item.cancelUntilDate) > new Date() && (
                                            <div className="mb-1">
                                              <i className="fas fa-calendar-times me-1 text-muted"></i>
                                              <span className="text-muted">{language === 'es' ? 'Cancelación gratis hasta:' : 'Free cancellation until:'}</span>{' '}
                                              <span>{formatDateTime(item.cancelUntilDate)}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end">
                                  {order.orderStatus !== 'CANCELLED' && item.status !== 'CANCELLED' && (
                                    <>
                                      {item.status === 'ATTENDED' && !item.isReviewed ? (
                                        <button
                                          className="btn btn-sm btn-warning"
                                          onClick={() => item.activity?.id && handleLeaveReview(item.activity.id, item.id, item.activity.title)}
                                          title={language === 'es' ? 'Dejar valoración o comentario' : 'Leave rating or comment'}
                                        >
                                          <i className="fas fa-star me-1"></i>
                                          <span className="d-none d-md-inline">
                                            {language === 'es' ? 'Dejar valoración' : 'Leave rating'}
                                          </span>
                                        </button>
                                      ) : (
                                        item.activity?.id && item.activity?.supplier && (
                                          <button
                                            className="btn btn-sm btn-outline-link" style={{ color: '#0d6efd', textDecoration: 'none', fontSize: '0.9rem' }}
                                            onClick={() => setOpenChatOrderItem(item)}
                                            title={language === 'es' ? 'Chatear con proveedor' : 'Chat with provider'}
                                          >
                                            <i className="fas fa-comments me-1"></i>
                                            <span>
                                              {language === 'es' ? 'Chatear con proveedor' : 'Chat with provider'}
                                            </span>
                                          </button>
                                        )
                                      )}
                                    </>
                                  )}
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
                    <div 
                      key={order.id} 
                      className="card border shadow-sm mb-3"
                      style={order.orderStatus === 'CANCELLED' ? { 
                        filter: 'grayscale(100%)',
                        opacity: 0.6
                      } : {}}
                    >
                      <div className="card-body">
                        <div className="d-flex flex-column">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">{language === 'es' ? 'Orden' : 'Order'} #{order.id}</span>
                              {/* More actions */}
                              <div className="position-relative">
                                <button 
                                  className="btn btn-link p-0 border-0" 
                                  style={{ color: '#718096' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOrderIdForActions(order.id);
                                    setShowActionsBottomSheet(true);
                                  }}
                                >
                                  <i className="fas fa-ellipsis-h"></i>
                                </button>
                              </div>
                            </div>
                            <small className="d-flex flex-start">
                              <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '4px', marginRight: '4px' }}>
                                <i className="fas fa-shopping-cart me-1"></i>
                                {language === 'es' ? 'Emitido:' : 'Created at:'}
                              </div>
                              <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatDateTimeAMPM(order.createdAt) + ' (UTC)'}</span>
                            </small>
                            <small className="d-flex flex-start">
                              <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '4px', marginRight: '4px' }}>
                                <i className="fas fa-money-bill me-1"></i>
                                {language === 'es' ? 'Total:' : 'Total:'}
                              </div>
                              <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatPrice(calculateOrderTotal(order), order.items[0]?.currency)}</span>
                            </small>
                            {/*Status*/}
                            <small className="d-flex flex-start">
                              <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '4px', marginRight: '4px' }}>
                                <i className="fas fa-info-circle me-1"></i>
                                {language === 'es' ? 'Estado:' : 'Status:'}
                              </div>
                              <span className={`badge ${getStatusBadgeClass(order.orderStatus)}`}>
                                {getStatusName(order.orderStatus)}
                              </span>
                            </small>
                        </div>
                        {/* Ver actividades */}
                        <div className="mb-3">
                          <div onClick={() => toggleOrder(order.id)} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center mt-2 pt-2  border-top">
                            <small className="fw-bold text-muted" style={{ fontSize: '1rem'}}>{language === 'es' ? 'Ver actividades' : 'View activities'} ({order.items.length})</small>
                            <button className="btn btn-link p-0 border-0" style={{ color: '#718096' }}>
                              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: '0.85rem' }}></i>
                            </button>
                          </div>
                          
                        </div>
                        {isExpanded && (
                          <div className="mt-2 pt-2 border-top">
                            {order.items.map((item, index) => (
                              <div 
                                key={item.id} 
                                className="mt-3"
                                style={{
                                  ...(item.status === 'CANCELLED' ? { 
                                    filter: 'grayscale(100%)',
                                    opacity: 0.6
                                  } : {}),
                                  ...(order.items.length > 2 && index > 0 ? {
                                    borderTop: '1px solid #dee2e6',
                                    paddingTop: '1rem'
                                  } : {})
                                }}
                              >
                                
                                <div className={`d-flex align-items-start gap-3 mb-2 ${index > 0 ? 'border-top pt-3' : ''}`}>
                                  {item.activity?.imageUrl && (
                                    <img
                                      src={item.activity.imageUrl}
                                      alt={item.activity.title}
                                      className="rounded"
                                      style={{ 
                                        width: '60px', 
                                        height: '60px', 
                                        objectFit: 'cover',
                                        ...(item.status === 'CANCELLED' ? { 
                                          filter: 'grayscale(100%)',
                                          opacity: 0.6
                                        } : {})
                                      }}
                                    />
                                  )}
                                  <div className="flex-grow-1">
                                    <div className="fw-bold mb-1" style={{ fontSize: '0.95rem', color: '#2d3748' }}>{item.activity?.title || '-'}</div>
                                    {item.bookingOptionId && (
                                      <div className="mb-1" style={{ fontSize: '0.8rem' }}>
                                       {renderActivityRating(item.activity)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div style={{ fontSize: '0.875rem' }}>
                                  <div className="mb-3">
                                    <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                      <i className="fas fa-calendar-alt me-1 text-muted"></i>
                                      {language === 'es' ? 'Inicio:' : 'Start:'}
                                    </div>
                                    <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatDateTime(item.startDatetime)} ({item.timeZone})</span>
                                  </div>
                                  {item.endDatetime && (
                                    <div className="mb-3">
                                      <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <i className="fas fa-clock me-1 text-muted"></i>
                                        {language === 'es' ? 'Fin:' : 'End:'}
                                      </div>
                                      <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatDateTime(item.endDatetime)} ({item.timeZone})</span>
                                    </div>
                                  )}
                                  
                                  <div className="mb-3">
                                    <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                      <i className="fas fa-users me-1 text-muted"></i>
                                      {language === 'es' ? 'Participantes:' : 'Participants:'}
                                    </div>
                                    <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>
                                      {item.participantsDetails?.adults || item.participants || 0} {language === 'es' ? 'adultos' : 'adults'}
                                      {item.participantsDetails?.children > 0 && (
                                        <> · {item.participantsDetails.children} {language === 'es' ? 'niño' : 'child'} </>
                                      )}
                                      
                                      
                                    </span>
                                  </div>
                                  {/* Total */}
                                  <div className="mb-3">
                                    <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                      <i className="fas fa-money-bill me-1 text-muted"></i>
                                      {language === 'es' ? 'Total:' : 'Total:'}
                                    </div>
                                    <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatPrice(item.totalAmount, item.currency)}</span>
                                  </div>
                                  {item.meetingPickupPointAddress && (
                                    <div className="mb-3">
                                      <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <i className="fas fa-map-marker-alt me-1 text-muted"></i>
                                        {language === 'es' ? 'Punto de encuentro:' : 'Meeting point:'}
                                      </div>
                                      <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{item.meetingPickupPointAddress}</span>
                                      <div className="mt-1">
                                        <button
                                          className="btn btn-sm btn-outline-primary"
                                          onClick={() => handleOpenDirections(item)}
                                          style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}
                                        >
                                          <i className="fas fa-directions me-1"></i>
                                          {language === 'es' ? 'Cómo llegar' : 'Get directions'}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {item.guideLanguage && (
                                    <div className="mb-3">
                                      <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <i className="fas fa-language me-1 text-muted"></i>
                                        {language === 'es' ? 'Idioma:' : 'Language:'}
                                      </div>
                                      <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{getLanguageName(item.guideLanguage, language)}</span>
                                    </div>
                                  )}
                                  {item.activity?.supplier && (
                                    <div className="mb-3">
                                      <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <i className="fas fa-store me-1 text-muted"></i>
                                        {language === 'es' ? 'Proveedor:' : 'Supplier:'}
                                      </div>
                                      <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>
                                        {item.activity.supplier.name}
                                        {item.activity.supplier.isVerified && (
                                          <i className="fas fa-check-circle text-success ms-1" title={language === 'es' ? 'Verificado' : 'Verified'}></i>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  {item.cancelUntilDate && new Date(item.cancelUntilDate) > new Date() && (
                                    <div className="mb-3">
                                      <div style={{ color: '#1a365d', fontWeight: '500', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        <i className="fas fa-calendar-times me-1 text-muted"></i>
                                        {language === 'es' ? 'Cancelación gratis hasta:' : 'Free cancellation until:'}
                                      </div>
                                      <span style={{ color: '#2d3748', fontSize: '0.9rem' }}>{formatDateTime(item.cancelUntilDate)}</span>
                                    </div>
                                  )}
                                </div>

                                {order.orderStatus !== 'CANCELLED' && item.status !== 'CANCELLED' && (
                                  <div className="d-grid mt-3">
                                    {item.status === 'ATTENDED' && !item.isReviewed ? (
                                      <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => item.activity?.id && handleLeaveReview(item.activity.id, item.id, item.activity.title)}
                                      >
                                        <i className="fas fa-star me-1"></i>
                                        {language === 'es' ? 'Dejar valoración' : 'Leave rating'}
                                      </button>
                                    ) : (
                                      item.activity?.id && item.activity?.supplier && (
                                        <button
                                        className="btn btn-sm btn-outline-link" style={{ color: '#0d6efd', textDecoration: 'none', fontSize: '0.9rem' }}
                                          onClick={() => setOpenChatOrderItem(item)}
                                          title={language === 'es' ? 'Chatear con proveedor' : 'Chat with provider'}
                                        >
                                          <i className="fas fa-comments me-1"></i>
                                          <span>
                                            {language === 'es' ? 'Chatear con proveedor' : 'Chat with provider'}
                                          </span>
                                        </button>
                                      )
                                    )}
                                  </div>
                                )}
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

      {/* Modal de valoración */}
      {selectedReviewActivity && (
        <ActivityReviewModal
          isOpen={reviewModalOpen}
          onClose={handleCloseReviewModal}
          activityId={selectedReviewActivity.activityId}
          orderItemId={selectedReviewActivity.orderItemId}
          activityTitle={selectedReviewActivity.activityTitle}
          onReviewCreated={handleReviewCreated}
        />
      )}

      {/* Overlay - debe estar antes del bottomSheet */}
      {showMobileFilters && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark d-md-none"
          style={{
            opacity: 0.5,
            zIndex: 1049,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onClick={() => setShowMobileFilters(false)}
        />
      )}

      {/* Bottom Sheet Dialog para filtros móvil */}
      <div
        className={`d-md-none position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-lg`}
        style={{
          transform: showMobileFilters ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1050,
          maxHeight: '90vh',
          borderTopLeftRadius: '1rem',
          borderTopRightRadius: '1rem',
          backgroundColor: '#ffffff'
        }}
      >
        
        {/* Contenido del bottom sheet */}
        <div className="p-4 bg-white" style={{ maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="mb-0 fw-bold">
              {language === 'es' ? 'Filtros' : 'Filters'}
            </h5>
            <button
              className="btn btn-link p-0"
              onClick={() => setShowMobileFilters(false)}
              style={{ fontSize: '1.5rem', lineHeight: '1' }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Estado de la orden */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-3" style={{ fontSize: '0.95rem' }}>
              {language === 'es' ? 'Estado' : 'Status'}
            </label>
            <div className="d-flex flex-column gap-2">
              {['CREATED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map((status) => (
                <div 
                  key={status} 
                  className="d-flex align-items-center" 
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px 0'
                  }}
                  onClick={() => {
                    if (tempOrderStatusFilter.includes(status)) {
                      setTempOrderStatusFilter(tempOrderStatusFilter.filter(s => s !== status));
                    } else {
                      setTempOrderStatusFilter([...tempOrderStatusFilter, status]);
                    }
                  }}
                >
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`temp-status-${status}`}
                    checked={tempOrderStatusFilter.includes(status)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempOrderStatusFilter([...tempOrderStatusFilter, status]);
                      } else {
                        setTempOrderStatusFilter(tempOrderStatusFilter.filter(s => s !== status));
                      }
                    }}
                    style={{ 
                      cursor: 'pointer', 
                      marginTop: '0',
                      marginRight: '12px',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0
                    }}
                  />
                  <label 
                    className="mb-0 flex-grow-1" 
                    htmlFor={`temp-status-${status}`} 
                    style={{ cursor: 'pointer', fontSize: '0.95rem' }}
                  >
                    {getStatusName(status)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Estado del pago */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-3" style={{ fontSize: '0.95rem' }}>
              {language === 'es' ? 'Estado del pago' : 'Payment status'}
            </label>
            <select
              className="form-select"
              value={tempPaymentStatusFilter}
              onChange={(e) => setTempPaymentStatusFilter(e.target.value)}
            >
              <option value="">{language === 'es' ? 'Todos' : 'All'}</option>
              <option value="PENDING">{language === 'es' ? 'Pendiente' : 'Pending'}</option>
              <option value="PAID">{language === 'es' ? 'Pagado' : 'Paid'}</option>
              <option value="CANCELLED">{language === 'es' ? 'Cancelado' : 'Cancelled'}</option>
              <option value="REFUNDED">{language === 'es' ? 'Reembolsado' : 'Refunded'}</option>
            </select>
          </div>

          {/* Fecha de la actividad */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-3" style={{ fontSize: '0.95rem' }}>
              {language === 'es' ? 'Fecha de la actividad' : 'Activity date'}
            </label>
            <div className="position-relative date-picker-dropdown-container">
              <input
                type="text"
                className="form-control"
                value={getDateInputText()}
                onClick={() => setShowDatePickerModal(!showDatePickerModal)}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted" style={{ pointerEvents: 'none' }}></i>
              
              {/* Dropdown de fechas */}
              {showDatePickerModal && (
                <div 
                  className="position-absolute top-100 start-0 mt-1 bg-white border rounded shadow-lg p-3 w-100"
                  style={{ 
                    zIndex: 1000, 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">
                        {language === 'es' ? 'Desde' : 'From'}
                      </label>
                      <div className="position-relative">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={tempFromDate}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            setTempFromDate(selectedDate);
                            // Automáticamente establecer "Hasta" con 7 días después
                            if (selectedDate) {
                              setTempToDate(addDays(selectedDate, 7));
                            } else {
                              setTempToDate('');
                            }
                          }}
                          max={tempToDate || undefined}
                        />
                        <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted small" style={{ pointerEvents: 'none' }}></i>
                      </div>
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted mb-1">
                        {language === 'es' ? 'Hasta' : 'To'}
                      </label>
                      <div className="position-relative">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={tempToDate}
                          onChange={(e) => handleTempEndDateChange(e.target.value)}
                          min={tempFromDate || undefined}
                        />
                        <i className="fas fa-calendar-alt position-absolute end-0 top-50 translate-middle-y me-2 text-muted small" style={{ pointerEvents: 'none' }}></i>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones */}
                  <div className="d-flex gap-2 justify-content-end">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setTempFromDate('');
                        setTempToDate('');
                        setTempInitialDate('');
                        setTempDateType('');
                      }}
                    >
                      {language === 'es' ? 'Limpiar' : 'Clear'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setShowDatePickerModal(false);
                      }}
                    >
                      {language === 'es' ? 'Aplicar' : 'Apply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Código de referencia */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-3" style={{ fontSize: '0.95rem' }}>
              {language === 'es' ? 'Código de referencia' : 'Reference code'}
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="fas fa-file-alt text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                value={tempReferenceCode}
                onChange={(e) => setTempReferenceCode(e.target.value)}
                placeholder={language === 'es' ? 'Código...' : 'Code...'}
              />
            </div>
          </div>

          {/* Ordenar por */}
          <div className="mb-4">
            <label className="form-label fw-semibold text-dark mb-3" style={{ fontSize: '0.95rem' }}>
              {language === 'es' ? 'Ordenar por' : 'Order by'}
            </label>
            <select
              className="form-select"
              value={`${tempSortBy}-${tempSortDirection}`}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const [newSortBy, newSortDirection] = e.target.value.split('-');
                if (newSortBy === 'startDateTime' || newSortBy === 'createdAt') {
                  setTempSortBy(newSortBy);
                }
                setTempSortDirection(newSortDirection as 'ASC' | 'DESC');
              }}
            >
              <option value="startDateTime-DESC">
                {language === 'es' ? 'Fecha de salida (Desc)' : 'Departure date (Desc)'}
              </option>
              <option value="startDateTime-ASC">
                {language === 'es' ? 'Fecha de salida (Asc)' : 'Departure date (Asc)'}
              </option>
              <option value="createdAt-DESC">
                {language === 'es' ? 'Fecha de compra (Desc)' : 'Purchase date (Desc)'}
              </option>
              <option value="createdAt-ASC">
                {language === 'es' ? 'Fecha de compra (Asc)' : 'Purchase date (Asc)'}
              </option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="d-grid gap-2 mt-4">
            <button
              className="btn btn-primary"
              onClick={handleApplyFilters}
            >
              {language === 'es' ? 'Aplicar filtros' : 'Apply filters'}
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                handleClearAllFilters();
                setShowMobileFilters(false);
              }}
            >
              {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
              setOrderIdToConfirm(null);
            }
          }}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {language === 'es' ? 'Confirmar Reserva' : 'Confirm Reservation'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setOrderIdToConfirm(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {language === 'es' 
                    ? '¿Estás seguro que deseas confirmar esta reserva?'
                    : 'Are you sure you want to confirm this reservation?'}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setOrderIdToConfirm(null);
                  }}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmAndNavigate}
                >
                  {language === 'es' ? 'Sí, Confirmar' : 'Yes, Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window Client - Nuevo sistema basado en orderItemId */}
      {openChatOrderItem && (
        <ChatWindowClient
          chatId={openChatOrderItem.id.toString()}
          orderItem={openChatOrderItem}
          onClose={() => setOpenChatOrderItem(null)}
          isMobile={window.innerWidth < 992}
        />
      )}

      {/* Overlay para bottom sheet de acciones */}
      {showActionsBottomSheet && (
        <div
          className="position-fixed top-0 start-0 end-0 bottom-0 bg-dark d-md-none"
          style={{
            opacity: 0.5,
            zIndex: 1049,
            transition: 'opacity 0.3s ease-in-out'
          }}
          onClick={() => {
            setShowActionsBottomSheet(false);
            setOrderIdForActions(null);
          }}
        />
      )}

      {/* Bottom Sheet Dialog para acciones móvil */}
      {showActionsBottomSheet && orderIdForActions && (() => {
        const currentOrder = orders.find(o => o.id === orderIdForActions);
        if (!currentOrder) return null;
        
        return (
          <div
            className="d-md-none position-fixed bottom-0 start-0 end-0 bg-white border-top shadow-lg"
            style={{
              transform: showActionsBottomSheet ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.3s ease-in-out',
              zIndex: 1050,
              maxHeight: '50vh',
              borderTopLeftRadius: '1rem',
              borderTopRightRadius: '1rem',
              backgroundColor: '#ffffff'
            }}
          >
            <div className="p-4 bg-white" style={{ maxHeight: '50vh', overflowY: 'auto', backgroundColor: '#ffffff' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0 fw-bold">
                  {language === 'es' ? 'Acciones' : 'Actions'}
                </h5>
                <button
                  className="btn btn-link p-0"
                  onClick={() => {
                    setShowActionsBottomSheet(false);
                    setOrderIdForActions(null);
                  }}
                  style={{ fontSize: '1.5rem', lineHeight: '1' }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="d-grid gap-2">
                {/* Botón Pagar para confirmar - siempre visible */}
                <button
                  className="btn btn-primary w-100"
                  style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                  onClick={() => {
                    if (currentOrder.orderStatus === 'CREATED' && !processingOrderId) {
                      setShowActionsBottomSheet(false);
                      setOrderIdForActions(null);
                      handleConfirmReservation(currentOrder.id);
                    }
                  }}
                  disabled={currentOrder.orderStatus !== 'CREATED' || processingOrderId === currentOrder.id}
                >
                  {processingOrderId === currentOrder.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {language === 'es' ? 'Procesando...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-dollar-sign me-2"></i>
                      {language === 'es' ? 'Pagar para confirmar' : 'Pay to confirm'}
                    </>
                  )}
                </button>
                {/* Botón Solicitar cancelación - siempre visible */}
                <button
                  className="btn btn-outline-danger w-100"
                  style={{ fontSize: '0.95rem', padding: '0.75rem' }}
                  onClick={() => {
                    if (currentOrder.orderStatus !== 'CANCELLED' && currentOrder.orderStatus !== 'COMPLETED' && !processingOrderId) {
                      setShowActionsBottomSheet(false);
                      setOrderIdForActions(null);
                      handleRequestCancellation(currentOrder.id);
                    }
                  }}
                  disabled={currentOrder.orderStatus === 'CANCELLED' || currentOrder.orderStatus === 'COMPLETED' || processingOrderId === currentOrder.id}
                >
                  {processingOrderId === currentOrder.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {language === 'es' ? 'Procesando...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-times-circle me-2"></i>
                      {language === 'es' ? 'Solicitar cancelación' : 'Request cancellation'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
    </>
  );
};

export default Bookings;

