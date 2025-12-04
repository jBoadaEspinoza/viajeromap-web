import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { useGoogleTokenValidation } from '../hooks/useGoogleTokenValidation';
import CheckoutCartSummary, { CheckoutSummaryItem } from '../components/CheckoutCartSummary';
import { ordersApi, OrderResponse } from '../api/orders';
import { activitiesApi, Activity } from '../api/activities';
import { convertUTCToLocalDateTime } from '../utils/dateUtils';

const Cart: React.FC = () => {
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { isAuthenticated, loading: authLoading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityDetails, setActivityDetails] = useState<Map<string, Activity>>(new Map());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  useGoogleTokenValidation();

  // Cargar órdenes con status DRAFT desde la API (solo si el usuario está autenticado)
  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setLoading(false);
      return;
    }

    const loadDraftOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ordersApi.getOrdersDraft({
          page: 0,
          size: 100,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
          lang: language,
          currency: currency
        });

        if (response?.data) {
          setOrders(response.data);
        } else {
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Error loading draft orders:', err);
        setError(err?.message || (language === 'es' ? 'Error al cargar el carrito' : 'Error loading cart'));
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadDraftOrders();

    // Escuchar el evento cartUpdated para recargar cuando se actualice un item
    const handleCartUpdated = () => {
      loadDraftOrders();
    };

    window.addEventListener('cartUpdated', handleCartUpdated);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
    };
  }, [language, isAuthenticated, authLoading]);

  // La API ya devuelve la actividad en item.activity, pero es una versión simplificada
  // Si necesitamos más detalles (como imágenes múltiples), los cargamos desde la API
  useEffect(() => {
    const loadActivityDetails = async () => {
      const activityIds = new Set<string>();
      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (item.activity?.id) {
            activityIds.add(item.activity.id);
          }
        });
      });

      // Cargar detalles completos de actividades desde la API
      const detailsPromises = Array.from(activityIds).map(async (activityId) => {
        try {
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
    };

    if (orders.length > 0) {
      loadActivityDetails();
    } else {
      setActivityDetails(new Map());
    }
  }, [orders, language, currency]);

  // Mapear OrderItemResponse a CheckoutSummaryItem
  const checkoutSummaryItems = useMemo<CheckoutSummaryItem[]>(() => {
    const allItems: CheckoutSummaryItem[] = [];
    
    // Recorrer todas las órdenes y sus items
    orders.forEach((order) => {
      order.items.forEach((orderItem) => {
        // Parsear startDatetime para obtener fecha y hora
        const startDatetime = convertUTCToLocalDateTime(orderItem.startDatetime, orderItem.timeZone || 'America/Lima');
        let date = '';
        let time = '';
        
        if (startDatetime) {
          try {
            const dateObj = new Date(startDatetime);
            date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
            const timeStr = startDatetime.split('T')[1] || '';
            time = timeStr.split('.')[0] || timeStr.split('+')[0] || timeStr; // HH:mm:ss o HH:mm
            if (time.length > 8) {
              time = time.substring(0, 8); // Asegurar formato HH:mm:ss
            }
          } catch (e) {
            console.error('Error parsing startDatetime:', e);
          }
        }

        // Obtener código de idioma del guía
        const guideLanguageCode = orderItem.guideLanguage || undefined;
        const guideLanguageName = guideLanguageCode
          ? getLanguageName(guideLanguageCode, language)
          : (language === 'es' ? 'No especificado' : 'Not specified');

        // Usar participantsDetails si está disponible, si no usar participants como adultos
        const travelers = {
          adults: orderItem.participantsDetails?.adults ?? orderItem.participants ?? 1,
          children: orderItem.participantsDetails?.children ?? 0,
        };

        // Obtener el total de viajeros desde participants (total de participantes)
        const totalTravelers = orderItem.participants || (travelers.adults + travelers.children) || 1;

        // Obtener detalles de la actividad
        // Primero intentar desde activityDetails (actividad completa con imágenes)
        // Si no está, usar orderItem.activity (versión simplificada)
        const activityId = orderItem.activity?.id || '';
        const activity = activityDetails.get(activityId) || null;
        const activityTitle = activity?.title || orderItem.activity?.title || '';
        
        // Obtener la imagen principal (cover) o la primera imagen disponible
        let activityImageUrl = '';
        if (activity?.images && activity.images.length > 0) {
          const coverImage = activity.images.find(img => img.isCover);
          activityImageUrl = coverImage?.imageUrl || activity.images[0]?.imageUrl || '';
        } else if (orderItem.activity?.imageUrl) {
          // Fallback a imageUrl de la actividad simplificada
          activityImageUrl = orderItem.activity.imageUrl;
        }

        allItems.push({
          id: `${orderItem.orderId}-${orderItem.id}`,
          activityId: orderItem.activity?.id || '',
          bookingOptionId: orderItem.bookingOptionId,
          orderItemId: orderItem.id, // ID del order item para actualizaciones
          orderId: orderItem.orderId, // ID de la orden
          title: activityTitle,
          imageUrl: activityImageUrl,
          language: guideLanguageName,
          languageCode: guideLanguageCode,
          meetingPoint: orderItem.meetingPickupPointAddress || '',
          meetingAddress: orderItem.meetingPickupPointAddress || '',
          comment: orderItem.specialRequest || '',
          date,
          time,
          travelers,
          participants: orderItem.participants || totalTravelers, // Pasar participants para cálculos
          unitPrice: orderItem.pricePerParticipant || 0,
          totalPrice: orderItem.totalAmount || (orderItem.pricePerParticipant || 0) * totalTravelers,
          currency: orderItem.currency || 'USD',
          meetingPickupPlaceId: orderItem.meetingPickupPlaceId ?? null,
          meetingPickupPointLatitude: orderItem.meetingPickupPointLatitude ?? null,
          meetingPickupPointLongitude: orderItem.meetingPickupPointLongitude ?? null,
          cancelUntilDate: orderItem.cancelUntilDate ?? null,
          timeZone: orderItem.timeZone || undefined,
        });
      });
    });

    return allItems;
  }, [orders, language, activityDetails]);

  // Los detalles de actividades (título, imagen) se cargarán automáticamente
  // en CheckoutCartItem, que ya tiene la lógica para obtenerlos desde la API
  const enrichedCheckoutItems = checkoutSummaryItems;

  const handleProceedToCheckout = () => {
    if (enrichedCheckoutItems.length === 0) {
      return;
    }

    try {
      sessionStorage.setItem('checkoutSource', 'cart');
      sessionStorage.setItem('checkoutCartSummary', JSON.stringify(enrichedCheckoutItems));
    } catch (error) {
      console.error('Error storing checkout cart summary:', error);
    }

    navigate('/checkout', { state: { source: 'cart', summary: enrichedCheckoutItems } });
  };

  const handleRemoveSummaryItem = async (itemId: string) => {
    // TODO: Implementar eliminación de item desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after removal:', err);
    }
  };

  const handleMeetingPointChange = async (
    itemSummary: CheckoutSummaryItem,
    pickupPoint: { id?: number | string | null; name: string; address: string; latitude?: number | null; longitude?: number | null; cityId?: number | null } | null,
    meetingPointName: string,
    meetingAddress: string
  ) => {
    // TODO: Implementar actualización de punto de encuentro desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after update:', err);
    }
  };

  const handleLanguageChange = async (itemSummary: CheckoutSummaryItem, languageCode: string, _languageName: string) => {
    // TODO: Implementar actualización de idioma desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after update:', err);
    }
  };

  const handleCommentChange = async (itemSummary: CheckoutSummaryItem, comment: string) => {
    // TODO: Implementar actualización de comentario desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after update:', err);
    }
  };

  const handleTravelersChange = async (itemSummary: CheckoutSummaryItem, travelers: { adults: number; children: number }) => {
    // TODO: Implementar actualización de viajeros desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after update:', err);
    }
  };

  const handleDateChange = async (itemSummary: CheckoutSummaryItem, payload: { date: string; time?: string }) => {
    // TODO: Implementar actualización de fecha/hora desde la API
    // Por ahora, recargamos las órdenes
    try {
      const response = await ordersApi.getOrdersDraft({
        page: 0,
        size: 100,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
        lang: language,
        currency: currency
      });

      if (response?.data) {
        setOrders(response.data);
      }
    } catch (err) {
      console.error('Error reloading orders after update:', err);
    }
  };

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

  return (
    <>
      <style>{`
        @media (max-width: 767.98px) {
          .cart-title {
            font-size: 1.5rem !important;
          }
          .cart-subtitle {
            font-size: 0.9rem !important;
          }
          .cart-icon {
            font-size: 2rem !important;
          }
          .cart-card-padding {
            padding: 1rem !important;
          }
        }
        @media (min-width: 768px) {
          .cart-icon {
            font-size: 3rem !important;
          }
        }
      `}</style>
      <div className="container py-3 py-md-5 px-3 px-md-4" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
          {authLoading ? (
            <div className="text-center py-4 py-md-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">
                  {language === 'es' ? 'Cargando...' : 'Loading...'}
                </span>
              </div>
            </div>
          ) : !isAuthenticated ? (
            <div className="text-center py-4 py-md-5">
              <div className="card shadow-sm border-0">
                <div className="card-body cart-card-padding p-md-5">
                  <i className="fas fa-lock cart-icon text-primary mb-3 mb-md-4"></i>
                  <h3 className="h5 mb-2 mb-md-3" style={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
                    {language === 'es' ? 'Inicia sesión para ver tu carrito' : 'Sign in to view your cart'}
                  </h3>
                  <p className="text-muted mb-3 mb-md-4 small" style={{ wordBreak: 'break-word' }}>
                    {language === 'es' 
                      ? 'Necesitas iniciar sesión para acceder a tu carrito de compras.'
                      : 'You need to sign in to access your shopping cart.'}
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
          ) : loading ? (
            <div className="text-center py-4 py-md-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">
                  {language === 'es' ? 'Cargando...' : 'Loading...'}
                </span>
              </div>
              <p className="mt-3 text-muted small">
                {language === 'es' ? 'Cargando carrito...' : 'Loading cart...'}
              </p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert" style={{ wordBreak: 'break-word' }}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              <span className="small">{error}</span>
            </div>
          ) : enrichedCheckoutItems.length === 0 ? (
            <div className="text-center py-4 py-md-5">
              <div className="card shadow-sm border-0">
                <div className="card-body cart-card-padding p-md-5">
                  <i className="fas fa-shopping-cart cart-icon text-muted mb-3 mb-md-4" style={{ fontSize: '3rem' }}></i>
                  <h3 className="h5 mb-2 mb-md-3" style={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
                    {language === 'es' ? 'Tu carrito está vacío' : 'Your cart is empty'}
                  </h3>
                  <p className="text-muted mb-3 mb-md-4 small" style={{ wordBreak: 'break-word' }}>
                    {language === 'es' 
                      ? 'No tienes actividades agregadas al carrito. Explora nuestras increíbles experiencias y comienza a planificar tu viaje.'
                      : 'You don\'t have any activities in your cart. Explore our amazing experiences and start planning your trip.'}
                  </p>
                  <button 
                    className="btn btn-primary btn-sm d-md-none w-100" 
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-search me-2"></i>
                    {language === 'es' ? 'Buscar actividades' : 'Search activities'}
                  </button>
                  <button 
                    className="btn btn-primary btn-lg d-none d-md-inline-block" 
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-search me-2"></i>
                    {language === 'es' ? 'Buscar actividades' : 'Search activities'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <CheckoutCartSummary
                items={enrichedCheckoutItems}
                language={language}
                onRemoveItem={handleRemoveSummaryItem}
                onEditLanguage={handleLanguageChange}
                onEditMeetingPoint={handleMeetingPointChange}
                onEditComment={handleCommentChange}
                onEditDate={handleDateChange}
                onEditTravelers={handleTravelersChange}
              />

              <div className="d-grid gap-2 gap-md-3 mt-3 mt-md-4">
                <button className="btn btn-primary btn-sm d-md-none w-100" onClick={handleProceedToCheckout}>
                  <i className="fas fa-credit-card me-2"></i>
                  {getTranslation('cart.checkout', language)}
                </button>
                <button className="btn btn-primary btn-lg d-none d-md-block" onClick={handleProceedToCheckout}>
                  <i className="fas fa-credit-card me-2"></i>
                  {getTranslation('cart.checkout', language)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default Cart;
