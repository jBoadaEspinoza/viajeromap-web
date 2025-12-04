import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { countriesApi, PhoneCode, Nationality } from '../api/countries';
import { activitiesApi } from '../api/activities';
import CheckoutCartSummary, { CheckoutSummaryItem } from '../components/CheckoutCartSummary';
import { ordersApi, OrderResponse } from '../api/orders';
import { useGoogleTokenValidation } from '../hooks/useGoogleTokenValidation';
import GooglePayButton from '@google-pay/button-react';
import { convertUTCToLocalDateTime } from '../utils/dateUtils';
import { authApi, UpdateTravelerContactInfoRequest } from '../api/auth';

const PayToConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { currency, getCurrencySymbol } = useCurrency();
  const { config } = useConfig();
  const { user, firebaseUser, isAuthenticated, loading: authLoading, refreshUserData } = useAuth();
  
  // Estados para órdenes y items
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityDetails, setActivityDetails] = useState<Map<string, any>>(new Map());
  
  // Estados para formulario de contacto
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phoneCode: '',
    phoneNumber: '',
    phonePostalCode: '',
    phonePostalId: 0,
    phoneCodeId: 0,
    countryBirthCode2: '',
    nationality: 'none'
  });
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [isSavingContactInfo, setIsSavingContactInfo] = useState(false);
  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loadingPhoneCodes, setLoadingPhoneCodes] = useState(true);
  const [loadingNationalities, setLoadingNationalities] = useState(true);
  
  // Estados para métodos de pago
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'googlepay' | ''>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  
  useGoogleTokenValidation();

  // Función para validar email
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Función para capitalizar nombre de país
  const capitalizeCountryName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Función para verificar si los campos obligatorios están completos
  const areRequiredFieldsComplete = (data: typeof formData): boolean => {
    return !!(
      data.name &&
      data.name.trim() !== '' &&
      data.lastName &&
      data.lastName.trim() !== '' &&
      data.email &&
      isValidEmail(data.email) &&
      data.phoneNumber &&
      data.phoneNumber.trim() !== '' &&
      data.nationality &&
      data.nationality !== 'none'
    );
  };

  // Cargar códigos telefónicos
  useEffect(() => {
    const loadPhoneCodes = async () => {
      try {
        setLoadingPhoneCodes(true);
        const response = await countriesApi.getPhoneCodes({
          lang: language,
          all: true,
          sortBy: 'countryName'
        });
        if (response?.data) {
          setPhoneCodes(response.data);
        }
      } catch (err) {
        console.error('Error loading phone codes:', err);
      } finally {
        setLoadingPhoneCodes(false);
      }
    };

    loadPhoneCodes();
  }, [language]);

  // Cargar nacionalidades
  useEffect(() => {
    const loadNationalities = async () => {
      try {
        setLoadingNationalities(true);
        const response = await countriesApi.getNationalities({
          lang: language,
          all: true,
          sortBy: 'denomination'
        });
        if (response?.data) {
          setNationalities(response.data);
        }
      } catch (err) {
        console.error('Error loading nationalities:', err);
      } finally {
        setLoadingNationalities(false);
      }
    };

    loadNationalities();
  }, [language]);

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user && phoneCodes.length > 0) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.firstname || prev.name,
        lastName: user.surname || prev.lastName,
        phoneNumber: user.phoneNumber || prev.phoneNumber,
        phonePostalCode: user.phonePostalCode || prev.phonePostalCode,
        phonePostalId: user.phonePostalId || prev.phonePostalId || 0,
        phoneCodeId: user.phoneCodeId || user.phonePostalId || prev.phoneCodeId || 0,
        countryBirthCode2: user.countryBirthCode2 || prev.countryBirthCode2,
        nationality: user.countryBirthCode2 || prev.nationality,
      }));
      
      if (user.phonePostalCode) {
        const foundPhoneCode = phoneCodes.find(pc => {
          const postalCodeClean = user.phonePostalCode!.replace(/[()]/g, '').replace('+', '').trim();
          const codeClean = pc.code?.replace(/[()]/g, '').replace('+', '').trim();
          return codeClean === postalCodeClean || pc.code === user.phonePostalCode;
        });
        
        if (foundPhoneCode) {
          setFormData(prev => ({
            ...prev,
            phoneCode: `(${foundPhoneCode!.code})`,
            phonePostalCode: foundPhoneCode!.code,
            phoneCodeId: foundPhoneCode!.id || prev.phoneCodeId || 0
          }));
        }
      }
    }
  }, [user, phoneCodes]);

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phonePostalId') {
      const selectedPhoneCode = phoneCodes.find(pc => pc.id === Number(value));
      if (selectedPhoneCode) {
        setFormData(prev => ({
          ...prev,
          phonePostalId: Number(value),
          phoneCodeId: selectedPhoneCode.id || 0,
          phoneCode: `(${selectedPhoneCode.code})`,
          phonePostalCode: selectedPhoneCode.code || '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Guardar información de contacto
  const handleSaveContactInfo = async () => {
    if (!areRequiredFieldsComplete(formData)) {
      alert(getTranslation('checkout.pleaseCompleteFields', language) || (language === 'es' 
        ? 'Por favor completa todos los campos obligatorios'
        : 'Please complete all required fields'));
      return;
    }

    if (!isAuthenticated) {
      alert(getTranslation('checkout.mustLoginToSaveContact', language) || (language === 'es' 
        ? 'Debes iniciar sesión para guardar la información de contacto'
        : 'You must log in to save contact information'));
      return;
    }

    setIsSavingContactInfo(true);
    try {
      const updateRequest: UpdateTravelerContactInfoRequest = {
        firstName: formData.name.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      };

      if (formData.phonePostalId > 0) {
        updateRequest.phonePostalId = formData.phonePostalId;
      }

      if (formData.phoneCodeId > 0) {
        updateRequest.phoneCodeId = formData.phoneCodeId;
      }

      if (formData.nationality && formData.nationality !== 'none') {
        updateRequest.countryBirthCode2 = formData.nationality;
      }

      await authApi.updateTravelerContactInfo(updateRequest);
      await refreshUserData();
      setIsEditingContactInfo(false);
      
      alert(getTranslation('checkout.contactInfoSaved', language) || (language === 'es' 
        ? 'Información de contacto guardada exitosamente'
        : 'Contact information saved successfully'));
    } catch (error: any) {
      console.error('Error saving contact info:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 
        (language === 'es' 
          ? 'Error al guardar la información de contacto'
          : 'Error saving contact information');
      alert(errorMessage);
    } finally {
      setIsSavingContactInfo(false);
    }
  };

  // Cargar orden específica
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      setLoading(false);
      setError(language === 'es' ? 'Debes iniciar sesión para continuar' : 'You must log in to continue');
      return;
    }

    const loadOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener orderId de la URL
        const orderId = searchParams.get('orderId');

        if (!orderId) {
          setError(language === 'es' ? 'No se proporcionó ID de orden' : 'Order ID not provided');
          setLoading(false);
          return;
        }

        const response = await ordersApi.getOrdersAvailables({
          orderId: orderId,
          lang: language,
          currency: currency,
          page: 0,
          size: 100
        });

        if (response?.data && response.data.length > 0) {
          setOrder(response.data[0]);
        } else {
          setError(language === 'es' ? 'Orden no encontrada' : 'Order not found');
        }
      } catch (err: any) {
        console.error('Error loading order:', err);
        setError(err?.message || (language === 'es' ? 'Error al cargar la orden' : 'Error loading order'));
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [language, currency, isAuthenticated, authLoading, searchParams]);

  // Cargar detalles de actividades
  useEffect(() => {
    const loadActivityDetails = async () => {
      if (!order) return;

      const activityIds = new Set<string>();
      order.items.forEach((item) => {
        if (item.activity?.id) {
          activityIds.add(item.activity.id);
        }
      });

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
      const detailsMap = new Map<string, any>();
      
      results.forEach(({ activityId, activity }) => {
        if (activity) {
          detailsMap.set(activityId, activity);
        }
      });

      setActivityDetails(detailsMap);
    };

    if (order) {
      loadActivityDetails();
    }
  }, [order, language, currency]);

  // Mapear OrderItemResponse a CheckoutSummaryItem
  const checkoutSummaryItems = useMemo<CheckoutSummaryItem[]>(() => {
    if (!order) return [];
    
    const allItems: CheckoutSummaryItem[] = [];
    
    order.items.forEach((orderItem) => {
      const activityId = orderItem.activity?.id || '';
      const activity = activityDetails.get(activityId) || null;

      const startDatetime = orderItem.startDatetime;
      let date = '';
      let time = '';
      
      if (startDatetime) {
        try {
          const bookingOption = activity?.bookingOptions?.find((opt: any) => opt.id === orderItem.bookingOptionId)
            || activity?.bookingOptions?.[0];
          const timeZone = bookingOption?.timeZone || orderItem.timeZone || 'America/Lima';
          
          const localDateTime = convertUTCToLocalDateTime(startDatetime, timeZone);
          const [datePart, timePart] = localDateTime.split('T');
          date = datePart || '';
          time = timePart || '';
          
          if (time.length > 8) {
            time = time.substring(0, 8);
          }
        } catch (e) {
          console.error('Error parsing startDatetime:', e);
          try {
            const dateObj = new Date(startDatetime);
            date = dateObj.toISOString().split('T')[0];
            const timeStr = startDatetime.split('T')[1] || '';
            time = timeStr.split('.')[0] || timeStr.split('+')[0] || timeStr;
            if (time.length > 8) {
              time = time.substring(0, 8);
            }
          } catch (e2) {
            console.error('Error in fallback parsing:', e2);
          }
        }
      }

      const guideLanguageCode = orderItem.guideLanguage || undefined;
      const guideLanguageName = guideLanguageCode
        ? getLanguageName(guideLanguageCode, language)
        : getTranslation('common.notSpecified', language) || (language === 'es' ? 'No especificado' : 'Not specified');

      const travelers = {
        adults: orderItem.participantsDetails?.adults ?? orderItem.participants ?? 1,
        children: orderItem.participantsDetails?.children ?? 0,
      };

      const totalTravelers = orderItem.participants || (travelers.adults + travelers.children) || 1;
      const activityTitle = activity?.title || orderItem.activity?.title || '';
      
      let activityImageUrl = '';
      if (activity?.images && activity.images.length > 0) {
        const coverImage = activity.images.find((img: any) => img.isCover);
        activityImageUrl = coverImage?.imageUrl || activity.images[0]?.imageUrl || '';
      } else if (orderItem.activity?.imageUrl) {
        activityImageUrl = orderItem.activity.imageUrl;
      }

      allItems.push({
        id: `${orderItem.orderId}-${orderItem.id}`,
        activityId: orderItem.activity?.id || '',
        bookingOptionId: orderItem.bookingOptionId,
        orderItemId: orderItem.id,
        orderId: orderItem.orderId,
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
        participants: orderItem.participants || totalTravelers,
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

    return allItems;
  }, [order, language, activityDetails]);

  // Calcular total
  const totalAmount = useMemo(() => {
    return checkoutSummaryItems.reduce((sum, item) => {
      return sum + (item.totalPrice || 0);
    }, 0);
  }, [checkoutSummaryItems]);

  const currencyForTotal = checkoutSummaryItems[0]?.currency || 'USD';

  // Función helper para actualizar la orden
  const updateOrder = useCallback(async (
    orderStatus: "CREATED" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED",
    paymentMethod: "CARD" | "CASH" | "TRANSFER" | "NONE",
    paymentProvider: "GOOGLE_PAY" | "PAYPAL" | "MERCADO_PAGO" | "STRIPE" | "YAPE" | "NIUBIZ" | "OTHER"
  ): Promise<OrderResponse> => {
    if (!order) {
      throw new Error('No order to update');
    }

    await ordersApi.updateOrder(order.id, {
      orderStatus,
      paymentStatus,
      paymentMethod,
      paymentProvider
    });

    return order;
  }, [order]);

  // Cargar script de PayPal
  useEffect(() => {
    if (paymentMethod === 'paypal' && !paypalScriptLoaded && config.paypal?.clientId) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${config.paypal.clientId}&currency=${currencyForTotal || config.paypal.currency || 'USD'}`;
      script.async = true;
      script.onload = () => {
        setPaypalScriptLoaded(true);
      };
      document.body.appendChild(script);

      return () => {
        const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [paymentMethod, paypalScriptLoaded, config.paypal, currencyForTotal]);

  // Manejar selección de método de pago
  const handlePaymentMethodSelect = (method: 'paypal' | 'googlepay') => {
    setPaymentMethod(method);
  };

  // Inicializar PayPal Buttons
  useEffect(() => {
    if (paymentMethod === 'paypal' && paypalScriptLoaded && paypalButtonRef.current && (window as any).paypal) {
      paypalButtonRef.current.innerHTML = '';

      (window as any).paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal'
        },
        createOrder: async (data: any, actions: any) => {
          try {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: totalAmount.toFixed(2),
                  currency_code: currencyForTotal || 'USD'
                },
                description: `${checkoutSummaryItems.length} ${language === 'es' ? 'actividades' : 'activities'}`
              }]
            });
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            alert(getTranslation('checkout.errorCreatingOrder', language) || (language === 'es' 
              ? 'Error al crear la orden de pago'
              : 'Error creating payment order'));
            throw error;
          }
        },
        onApprove: async (data: any, actions: any) => {
          try {
            setIsProcessingPayment(true);
            const details = await actions.order.capture();
            console.log('💳 PayPal payment approved:', details);

            const updatedOrder = await updateOrder('CONFIRMED', 'PAID', 'CARD', 'PAYPAL');

            navigate('/payment-completed', { 
              state: { 
                paymentMethod: 'paypal',
                paymentStatus: 'PAID',
                paymentProvider: 'PAYPAL',
                paymentDetails: details,
                orders: [updatedOrder],
                totalAmount: totalAmount,
                currency: currencyForTotal
              } 
            });
          } catch (error) {
            console.error('Error processing PayPal payment:', error);
            alert(getTranslation('checkout.errorProcessingPayment', language) || (language === 'es' 
              ? 'Error al procesar el pago'
              : 'Error processing payment'));
            setIsProcessingPayment(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          alert(getTranslation('checkout.paymentError', language) || (language === 'es' 
            ? 'Error en el proceso de pago'
            : 'Payment error'));
          setIsProcessingPayment(false);
        },
        onCancel: () => {
          console.log('PayPal payment cancelled');
          setIsProcessingPayment(false);
        }
      }).render(paypalButtonRef.current);
    }
  }, [paymentMethod, paypalScriptLoaded, totalAmount, currencyForTotal, checkoutSummaryItems, language, navigate, updateOrder]);

  // Manejar pago con Google Pay
  const handleGooglePayPayment = async (paymentData: any) => {
    try {
      setIsProcessingPayment(true);
      console.log('💳 Google Pay payment data:', paymentData);

      const updatedOrder = await updateOrder('CONFIRMED', 'PAID', 'CARD', 'GOOGLE_PAY');

      navigate('/payment-completed', { 
        state: { 
          paymentMethod: 'googlepay',
          paymentStatus: 'PAID',
          paymentProvider: 'GOOGLE_PAY',
          paymentDetails: paymentData,
          orders: [updatedOrder],
          totalAmount: totalAmount,
          currency: currencyForTotal
        } 
      });
    } catch (error) {
      console.error('Error processing Google Pay payment:', error);
      alert(getTranslation('checkout.errorProcessingPayment', language) || (language === 'es' 
        ? 'Error al procesar el pago'
        : 'Error processing payment'));
      setIsProcessingPayment(false);
    }
  };

  // Handlers para editar items (no permitir edición en esta página)
  const handleRemoveSummaryItem = () => {};
  const handleLanguageChange = () => {};
  const handleMeetingPointChange = () => {};
  const handleCommentChange = () => {};
  const handleDateChange = () => {};
  const handleTravelersChange = () => {};

  // Mostrar loading mientras se valida autenticación
  if (authLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
          </div>
          <h5 className="text-muted">
            {getTranslation('common.validatingAuth', language) || (language === 'es' ? 'Validando autenticación...' : 'Validating authentication...')}
          </h5>
        </div>
      </div>
    );
  }

  // Mostrar error si no está autenticado
  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow">
                <div className="card-body text-center p-5">
                  <i className="fas fa-lock fa-3x text-primary mb-4"></i>
                  <h2 className="mb-3">
                    {getTranslation('checkout.loginRequired', language) || (language === 'es' ? 'Inicio de sesión requerido' : 'Login required')}
                  </h2>
                  <p className="text-muted mb-4">
                    {getTranslation('checkout.mustLoginToContinue', language) || (language === 'es' 
                      ? 'Debes iniciar sesión para continuar con el pago.'
                      : 'You must log in to continue with payment.')}
                  </p>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate('/bookings')}
                  >
                    {language === 'es' ? 'Volver a Reservas' : 'Back to Bookings'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se cargan las órdenes
  if (loading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
          </div>
          <h5 className="text-muted">
            {getTranslation('common.loading', language)}
          </h5>
        </div>
      </div>
    );
  }

  // Mostrar error si hay
  if (error || !order) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="alert alert-danger">
                <h4>{getTranslation('common.error', language) || (language === 'es' ? 'Error' : 'Error')}</h4>
                <p>{error || (language === 'es' ? 'Orden no encontrada' : 'Order not found')}</p>
                <button className="btn btn-primary" onClick={() => navigate('/bookings')}>
                  {language === 'es' ? 'Volver a Reservas' : 'Back to Bookings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Header con Logo */}
      <div className="bg-white shadow-sm py-4">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between">
            <div 
              className="d-flex align-items-center" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              <img
                src={config.business.urlLogo}
                alt="Viajero Map Logo"
                height="50"
                className="d-inline-block align-text-top me-3"
                style={{ pointerEvents: 'none' }}
              />
              <span className="fw-bold fs-3 text-primary">{config.business.name}</span>
            </div>
            <div className="text-muted">
              {language === 'es' ? 'Pagar para Confirmar' : 'Pay to Confirm'}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row">
          {/* Columna izquierda - Items del carrito */}
          <div className="col-lg-7 mb-4 mb-lg-0">
            <CheckoutCartSummary
              items={checkoutSummaryItems}
              language={language}
              onRemoveItem={handleRemoveSummaryItem}
              onEditLanguage={handleLanguageChange}
              onEditMeetingPoint={handleMeetingPointChange}
              onEditComment={handleCommentChange}
              onEditDate={handleDateChange}
              onEditTravelers={handleTravelersChange}
              readOnly={true}
            />
          </div>

          {/* Columna derecha - Información de contacto y métodos de pago */}
          <div className="col-lg-5">
            {/* Información del cliente */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">
                    {language === 'es' ? 'Información del Cliente' : 'Customer Information'}
                  </h5>
                  {!isEditingContactInfo && (
                    <button
                      type="button"
                      className="btn btn-link text-primary p-0"
                      onClick={() => setIsEditingContactInfo(true)}
                      style={{ textDecoration: 'underline', fontSize: '0.9rem' }}
                    >
                      {getTranslation('common.edit', language) || (language === 'es' ? 'Editar' : 'Edit')}
                    </button>
                  )}
                </div>

                {/* Mostrar información si no está editando */}
                {!isEditingContactInfo && (
                  <div className="border rounded p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                    {user && (
                      <>
                        <div className="mb-2">
                          <strong>{formData.name} {formData.lastName}</strong>
                        </div>
                        <div className="mb-2">
                          <span>{formData.email}</span>
                        </div>
                        {formData.phoneCode && formData.phoneNumber && (
                          <div>
                            <span>{formData.phoneCode} {formData.phoneNumber}</span>
                          </div>
                        )}
                      </>
                    )}
                    {!user && firebaseUser && (
                      <>
                        <div className="mb-2">
                          <strong>{firebaseUser.displayName || firebaseUser.email}</strong>
                        </div>
                        <div>
                          <span>{firebaseUser.email}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Formulario de contacto */}
                {isEditingContactInfo && (
                  <form>
                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.nameRequired', language) || (language === 'es' ? 'Nombre *' : 'Name *')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={getTranslation('checkout.namePlaceholder', language) || (language === 'es' ? 'Ingresa tu nombre' : 'Enter your name')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.lastNameRequired', language) || (language === 'es' ? 'Apellido *' : 'Last name *')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder={getTranslation('checkout.lastNamePlaceholder', language) || (language === 'es' ? 'Ingresa tu apellido' : 'Enter your last name')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.emailRequired', language) || (language === 'es' ? 'Email *' : 'Email *')}
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={getTranslation('checkout.emailPlaceholder', language) || (language === 'es' ? 'tu@email.com' : 'your@email.com')}
                        disabled={!!firebaseUser}
                        style={{ backgroundColor: firebaseUser ? '#f8f9fa' : '', cursor: firebaseUser ? 'not-allowed' : 'text' }}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.phoneCodeRequired', language) || (language === 'es' ? 'Código telefónico *' : 'Phone code *')}
                      </label>
                      {loadingPhoneCodes ? (
                        <div className="text-center">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
                          </div>
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          name="phonePostalId"
                          value={formData.phonePostalId ? String(formData.phonePostalId) : ''}
                          onChange={handleInputChange}
                        >
                          <option value="">
                            {getTranslation('checkout.selectPhoneCode', language) || (language === 'es' ? 'Selecciona código' : 'Select code')}
                          </option>
                          {phoneCodes.map((phoneCode) => (
                            <option 
                              key={phoneCode.id || `${phoneCode.code2}-${phoneCode.code}`} 
                              value={phoneCode.id ? String(phoneCode.id) : ''}
                            >
                              {capitalizeCountryName(phoneCode.countryName)} ({phoneCode.code})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.phoneNumberRequired', language) || (language === 'es' ? 'Número de teléfono *' : 'Phone number *')}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder={getTranslation('checkout.phoneNumberPlaceholder', language) || (language === 'es' ? 'Ingresa tu número' : 'Enter your number')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.nationalityRequired', language) || (language === 'es' ? 'Nacionalidad *' : 'Nationality *')}
                      </label>
                      {loadingNationalities ? (
                        <div className="text-center">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
                          </div>
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          name="nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                        >
                          <option value="none">
                            {getTranslation('checkout.selectNationality', language) || (language === 'es' ? 'Selecciona nacionalidad' : 'Select nationality')}
                          </option>
                          {nationalities.map((nationality) => (
                            <option key={nationality.code2} value={nationality.code2}>
                              {capitalizeCountryName(nationality.denomination)}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-primary flex-grow-1"
                        onClick={handleSaveContactInfo}
                        disabled={isSavingContactInfo}
                      >
                        {isSavingContactInfo ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            {getTranslation('common.saving', language) || (language === 'es' ? 'Guardando...' : 'Saving...')}
                          </>
                        ) : (
                          getTranslation('common.save', language) || (language === 'es' ? 'Guardar' : 'Save')
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setIsEditingContactInfo(false);
                          // Restaurar datos originales del usuario
                          if (user && phoneCodes.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              email: user.email || prev.email,
                              name: user.firstname || prev.name,
                              lastName: user.surname || prev.lastName,
                              phoneNumber: user.phoneNumber || prev.phoneNumber,
                              phonePostalCode: user.phonePostalCode || prev.phonePostalCode,
                              phonePostalId: user.phonePostalId || prev.phonePostalId || 0,
                              phoneCodeId: user.phoneCodeId || user.phonePostalId || prev.phoneCodeId || 0,
                              countryBirthCode2: user.countryBirthCode2 || prev.countryBirthCode2,
                              nationality: user.countryBirthCode2 || prev.nationality,
                            }));
                            
                            if (user.phonePostalCode) {
                              const foundPhoneCode = phoneCodes.find(pc => {
                                const postalCodeClean = user.phonePostalCode!.replace(/[()]/g, '').replace('+', '').trim();
                                const codeClean = pc.code?.replace(/[()]/g, '').replace('+', '').trim();
                                return codeClean === postalCodeClean || pc.code === user.phonePostalCode;
                              });
                              
                              if (foundPhoneCode) {
                                setFormData(prev => ({
                                  ...prev,
                                  phoneCode: `(${foundPhoneCode!.code})`,
                                  phonePostalCode: foundPhoneCode!.code,
                                  phoneCodeId: foundPhoneCode!.id || prev.phoneCodeId || 0
                                }));
                              }
                            }
                          }
                        }}
                      >
                        {getTranslation('common.cancel', language) || (language === 'es' ? 'Cancelar' : 'Cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  {getTranslation('checkout.paymentMethod', language) || (language === 'es' ? 'Método de pago' : 'Payment method')}
                </h5>

                {/* PayPal */}
                <div className="mb-3">
                  <label className="d-flex align-items-center p-3 border rounded" style={{ cursor: 'pointer', backgroundColor: paymentMethod === 'paypal' ? '#f0f8ff' : 'white' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => handlePaymentMethodSelect('paypal')}
                      className="me-3"
                    />
                    <i className="fab fa-paypal text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                    <span className="fw-medium">PayPal</span>
                  </label>
                  {paymentMethod === 'paypal' && (
                    <div className="mt-3" ref={paypalButtonRef}>
                      {!paypalScriptLoaded && (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Google Pay */}
                <div className="mb-3">
                  <label className="d-flex align-items-center p-3 border rounded" style={{ cursor: 'pointer', backgroundColor: paymentMethod === 'googlepay' ? '#f0f8ff' : 'white' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="googlepay"
                      checked={paymentMethod === 'googlepay'}
                      onChange={() => handlePaymentMethodSelect('googlepay')}
                      className="me-3"
                    />
                    <i className="fab fa-google-pay text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                    <span className="fw-medium">Google Pay</span>
                  </label>
                  {paymentMethod === 'googlepay' && (
                    <div className="mt-3">
                      <GooglePayButton
                        environment={config.googlePay?.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'}
                        paymentRequest={{
                          apiVersion: 2,
                          apiVersionMinor: 0,
                          allowedPaymentMethods: [
                            {
                              type: 'CARD',
                              parameters: {
                                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
                              },
                              tokenizationSpecification: {
                                type: 'PAYMENT_GATEWAY',
                                parameters: {
                                  gateway: 'stripe',
                                  gatewayMerchantId: config.googlePay?.merchantId || ''
                                }
                              }
                            }
                          ],
                          merchantInfo: {
                            merchantId: config.googlePay?.merchantId || '',
                            merchantName: config.googlePay?.merchantName || config.business.name
                          },
                          transactionInfo: {
                            totalPriceStatus: 'FINAL',
                            totalPriceLabel: getTranslation('checkout.total', language) || 'Total',
                            totalPrice: totalAmount.toFixed(2),
                            currencyCode: currencyForTotal || config.googlePay?.currency || 'USD',
                            countryCode: 'PE'
                          }
                        }}
                        onLoadPaymentData={handleGooglePayPayment}
                        onError={(error: any) => {
                          console.error('Google Pay error:', error);
                          alert(getTranslation('checkout.paymentError', language) || (language === 'es' 
                            ? 'Error en el proceso de pago'
                            : 'Payment error'));
                          setIsProcessingPayment(false);
                        }}
                        buttonColor="black"
                        buttonType="pay"
                        buttonLocale={language === 'es' ? 'es' : 'en'}
                      />
                    </div>
                  )}
                </div>

                {/* Resumen de total */}
                <div className="border-top pt-3 mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted">
                      {getTranslation('checkout.total', language) || (language === 'es' ? 'Total' : 'Total')}:
                    </span>
                    <span className="fs-5 fw-bold text-danger">
                      {getCurrencySymbol(currencyForTotal)} {totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <small className="text-muted d-block mb-3">
                    {getTranslation('checkout.allTaxesIncluded', language) || (language === 'es' ? 'Todos los impuestos incluidos' : 'All taxes included')}
                  </small>
                  
                  {/* Mensaje informativo para PayPal y Google Pay */}
                  {(paymentMethod === 'paypal' || paymentMethod === 'googlepay') && (
                    <div className="alert alert-info mb-0" role="alert">
                      <small>
                        {getTranslation('checkout.useButtonBelow', language) || (language === 'es' 
                          ? 'Usa el botón de arriba para completar el pago'
                          : 'Use the button above to complete payment')}
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayToConfirm;

