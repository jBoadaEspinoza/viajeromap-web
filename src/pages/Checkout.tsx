import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { appConfig } from '../config/appConfig';
import { authApi, UpdateTravelerContactInfoRequest } from '../api/auth';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency, getCurrencySymbol } = useCurrency();
  const { config } = useConfig();
  const { user, firebaseUser, isAuthenticated, loading: authLoading, loginWithGoogle, refreshUserData } = useAuth();
  
  // Estados para órdenes y items
  const [orders, setOrders] = useState<OrderResponse[]>([]);
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
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(true);
  const [isSavingContactInfo, setIsSavingContactInfo] = useState(false);
  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loadingPhoneCodes, setLoadingPhoneCodes] = useState(true);
  const [loadingNationalities, setLoadingNationalities] = useState(true);
  
  // Estados para métodos de pago
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'googlepay' | 'reserve' | 'reserveLater' | ''>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paypalScriptLoaded, setPaypalScriptLoaded] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  
  // Estados para login
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
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

  // Cargar órdenes DRAFT desde la API
  useEffect(() => {
    // Si está cargando la autenticación, esperar
    if (authLoading) {
      return;
    }

    // Si no está autenticado, no cargar órdenes
    if (!isAuthenticated) {
      setLoading(false);
      setOrders([]);
      return;
    }

    const loadDraftOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🛒 Checkout: Cargando órdenes DRAFT...');
        const response = await ordersApi.getOrdersDraft({
          page: 0,
          size: 100,
          sortBy: 'createdAt',
          sortDirection: 'DESC',
          lang: language,
          currency: currency
        });

        console.log('🛒 Checkout: Respuesta de getOrdersDraft:', response);

        if (response?.data) {
          setOrders(Array.isArray(response.data) ? response.data : []);
          console.log('🛒 Checkout: Órdenes cargadas:', response.data.length);
        } else {
          console.log('🛒 Checkout: No hay órdenes o respuesta inválida');
          setOrders([]);
        }
      } catch (err: any) {
        console.error('❌ Checkout: Error loading draft orders:', err);
        const errorMessage = err?.message || err?.response?.data?.message || getTranslation('checkout.errorLoadingOrders', language) || (language === 'es' ? 'Error al cargar las órdenes' : 'Error loading orders');
        setError(errorMessage);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadDraftOrders();

    // Escuchar el evento cartUpdated para recargar cuando se actualice un item
    const handleCartUpdated = () => {
      console.log('🛒 Checkout: Evento cartUpdated recibido, recargando órdenes...');
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
      const detailsMap = new Map<string, any>();
      
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

  // Mapear OrderItemResponse a CheckoutSummaryItem (similar a Cart.tsx)
  const checkoutSummaryItems = useMemo<CheckoutSummaryItem[]>(() => {
    const allItems: CheckoutSummaryItem[] = [];
    
    orders.forEach((order) => {
      order.items.forEach((orderItem) => {
        const startDatetime = orderItem.startDatetime;
        let date = '';
        let time = '';
        
        if (startDatetime) {
          try {
            const dateObj = new Date(startDatetime);
            date = dateObj.toISOString().split('T')[0];
            const timeStr = startDatetime.split('T')[1] || '';
            time = timeStr.split('.')[0] || timeStr.split('+')[0] || timeStr;
            if (time.length > 8) {
              time = time.substring(0, 8);
            }
          } catch (e) {
            console.error('Error parsing startDatetime:', e);
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

        // Obtener detalles de la actividad
        // Primero intentar desde activityDetails (actividad completa con imágenes)
        // Si no está, usar orderItem.activity (versión simplificada)
        const activityId = orderItem.activity?.id || '';
        const activity = activityDetails.get(activityId) || null;
        const activityTitle = activity?.title || orderItem.activity?.title || '';
        
        let activityImageUrl = '';
        if (activity?.images && activity.images.length > 0) {
          const coverImage = activity.images.find((img: any) => img.isCover);
          activityImageUrl = coverImage?.imageUrl || activity.images[0]?.imageUrl || '';
        } else if (orderItem.activity?.imageUrl) {
          // Fallback a imageUrl de la actividad simplificada
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
        });
      });
    });

    return allItems;
  }, [orders, language, activityDetails]);

  // Calcular total (después de checkoutSummaryItems)
  const totalAmount = useMemo(() => {
    return checkoutSummaryItems.reduce((sum, item) => {
      return sum + (item.totalPrice || 0);
    }, 0);
  }, [checkoutSummaryItems]);

  const currencyForTotal = checkoutSummaryItems[0]?.currency || 'USD';

  // Cargar script de PayPal (después de currencyForTotal)
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
        // Limpiar script al desmontar
        const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  }, [paymentMethod, paypalScriptLoaded, config.paypal, currencyForTotal]);

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
      
      // Si los campos están completos, colapsar el formulario
      if (areRequiredFieldsComplete({
        ...formData,
        email: user.email || formData.email,
        name: user.firstname || formData.name,
        lastName: user.surname || formData.lastName,
        phoneNumber: user.phoneNumber || formData.phoneNumber,
        phonePostalCode: user.phonePostalCode || formData.phonePostalCode,
        phonePostalId: user.phonePostalId || formData.phonePostalId || 0,
        phoneCodeId: user.phoneCodeId || user.phonePostalId || formData.phoneCodeId || 0,
        countryBirthCode2: user.countryBirthCode2 || formData.countryBirthCode2,
        nationality: user.countryBirthCode2 || formData.nationality,
      })) {
        setIsEditingContactInfo(false);
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
      // Preparar el request para la API según la interfaz UpdateTravelerContactInfoRequest
      const updateRequest: UpdateTravelerContactInfoRequest = {
        firstName: formData.name.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
      };

      // Agregar phonePostalId si está disponible
      if (formData.phonePostalId > 0) {
        updateRequest.phonePostalId = formData.phonePostalId;
      }

      // Agregar phoneCodeId si está disponible
      if (formData.phoneCodeId > 0) {
        updateRequest.phoneCodeId = formData.phoneCodeId;
      }

      // Agregar countryBirthCode2 si está disponible (es un string con el código de 2 letras, ej: "PE", "US")
      if (formData.nationality && formData.nationality !== 'none') {
        updateRequest.countryBirthCode2 = formData.nationality;
      }

      // Mostrar el request completo que se enviará
      console.log('📤 Request a enviar para actualizar información de contacto:');
      console.log('📋 Datos del formulario original:', {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        phonePostalId: formData.phonePostalId,
        phoneCodeId: formData.phoneCodeId,
        phonePostalCode: formData.phonePostalCode,
        nationality: formData.nationality,
        countryBirthCode2: formData.nationality !== 'none' ? formData.nationality : undefined
      });
      console.log('📤 Request final para la API (UpdateTravelerContactInfoRequest):', JSON.stringify(updateRequest, null, 2));
      console.log('📋 Estructura del request:', {
        firstName: updateRequest.firstName,
        lastName: updateRequest.lastName,
        email: updateRequest.email,
        phoneNumber: updateRequest.phoneNumber,
        phonePostalId: updateRequest.phonePostalId,
        phoneCodeId: updateRequest.phoneCodeId,
        countryBirthCode2: updateRequest.countryBirthCode2,
        documentTypeId: updateRequest.documentTypeId,
        documentNumber: updateRequest.documentNumber
      });

      // Llamar a la API para actualizar la información de contacto
      const response = await authApi.updateTravelerContactInfo(updateRequest);
      
      console.log('✅ Información de contacto guardada:', response);

      // Refrescar los datos del usuario en el contexto
      await refreshUserData();

      // Actualizar el estado local
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

  // Manejar selección de método de pago
  const handlePaymentMethodSelect = (method: 'paypal' | 'googlepay' | 'reserve' | 'reserveLater') => {
    setPaymentMethod(method);
  };

  // Función helper para actualizar todas las órdenes
  const updateAllOrders = useCallback(async (
    orderStatus: "CREATED" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
    paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED",
    paymentMethod: "CARD" | "CASH" | "TRANSFER" | "NONE",
    paymentProvider: "GOOGLE_PAY" | "PAYPAL" | "MERCADO_PAGO" | "STRIPE" | "YAPE" | "NIUBIZ" | "OTHER"
  ): Promise<OrderResponse[]> => {
    // Mostrar el request que se enviará para cada orden
    console.log('📤 Request a enviar para actualizar órdenes:');
    orders.forEach((order, index) => {
      const request = {
        orderId: order.id,
        orderStatus,
        paymentStatus,
        paymentMethod,
        paymentProvider
      };
      console.log(`  Orden ${index + 1}/${orders.length}:`, JSON.stringify(request, null, 2));
    });

    const updatePromises = orders.map(order => 
      ordersApi.updateOrder(order.id, {
        orderStatus,
        paymentStatus,
        paymentMethod,
        paymentProvider
      })
    );

    await Promise.all(updatePromises);
    console.log(`✅ Todas las órdenes actualizadas: orderStatus=${orderStatus}, paymentStatus=${paymentStatus}, paymentMethod=${paymentMethod}, paymentProvider=${paymentProvider}`);

    // Nota: getOrdersDraft solo obtiene órdenes DRAFT, no CREATED o CONFIRMED
    // Por ahora, retornamos las órdenes originales actualizadas localmente
    // TODO: Si se necesita obtener órdenes CREATED/CONFIRMED, crear una nueva función API
    return orders;
  }, [orders]);

  // Inicializar PayPal Buttons
  useEffect(() => {
    if (paymentMethod === 'paypal' && paypalScriptLoaded && paypalButtonRef.current && (window as any).paypal) {
      // Limpiar contenido previo
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
            // Crear orden en PayPal
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
            // Capturar el pago
            const details = await actions.order.capture();
            console.log('💳 PayPal payment approved:', details);
            console.log('🔄 Iniciando actualización de órdenes con PayPal...');

            // Actualizar todas las órdenes con CONFIRMED
            const updatedOrders = await updateAllOrders('CONFIRMED', 'PAID', 'CARD', 'PAYPAL');

            // Redirigir a página de éxito
            navigate('/payment-completed', { 
              state: { 
                paymentMethod: 'paypal',
                paymentStatus: 'PAID',
                paymentProvider: 'PAYPAL',
                paymentDetails: details,
                orders: updatedOrders,
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
  }, [paymentMethod, paypalScriptLoaded, totalAmount, currencyForTotal, checkoutSummaryItems, language, navigate, orders, updateAllOrders]);

  // Procesar pago para métodos que no son PayPal/Google Pay
  const handleProcessPayment = async () => {
    if (!paymentMethod) {
      alert(getTranslation('checkout.pleaseSelectPaymentMethod', language) || (language === 'es' 
        ? 'Por favor selecciona un método de pago'
        : 'Please select a payment method'));
      return;
    }

    if (paymentMethod === 'paypal' || paymentMethod === 'googlepay') {
      // PayPal y Google Pay se manejan con sus propios botones
      return;
    }

    if (!areRequiredFieldsComplete(formData)) {
      alert(getTranslation('checkout.pleaseCompleteFields', language) || (language === 'es' 
        ? 'Por favor completa todos los campos obligatorios'
        : 'Please complete all required fields'));
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Procesar reserva sin pago inmediato
      if (paymentMethod === 'reserveLater') {
        console.log('📅 Processing reservation without immediate payment');
        console.log('🔄 Iniciando actualización de órdenes para reservar y pagar después...');
        
        // Actualizar todas las órdenes con CREATED (reservar y pagar después)
        const updatedOrders = await updateAllOrders('CREATED', 'PENDING', 'NONE', 'OTHER');

        // Redirigir a página de éxito
        navigate('/payment-completed', { 
          state: { 
            paymentMethod: 'reserve',
            paymentStatus: 'PENDING',
            paymentProvider: 'OTHER',
            orders: updatedOrders,
            totalAmount: totalAmount,
            currency: currencyForTotal
          } 
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(getTranslation('checkout.errorProcessingPayment', language) || (language === 'es' 
        ? 'Error al procesar el pago'
        : 'Error processing payment'));
      setIsProcessingPayment(false);
    }
  };

  // Manejar pago con Google Pay
  const handleGooglePayPayment = async (paymentData: any) => {
    try {
      setIsProcessingPayment(true);
      console.log('💳 Google Pay payment data:', paymentData);
      console.log('🔄 Iniciando actualización de órdenes con Google Pay...');

      // Actualizar todas las órdenes con CONFIRMED
      const updatedOrders = await updateAllOrders('CONFIRMED', 'PAID', 'CARD', 'GOOGLE_PAY');

      // Redirigir a página de éxito
      navigate('/payment-completed', { 
        state: { 
          paymentMethod: 'googlepay',
          paymentStatus: 'PAID',
          paymentProvider: 'GOOGLE_PAY',
          paymentDetails: paymentData,
          orders: updatedOrders,
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

  // Manejar login con Google
  const handleLoginWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      const success = await loginWithGoogle();
      if (success) {
        setShowLoginModal(false);
      } else {
        alert(getTranslation('checkout.errorSigningIn', language) || (language === 'es' 
          ? 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.'
          : 'Error signing in with Google. Please try again.'));
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert(getTranslation('checkout.errorSigningIn', language) || (language === 'es' 
        ? 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.'
        : 'Error signing in with Google. Please try again.'));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Función para navegar a home
  const handleLogoClick = () => {
    navigate('/');
  };

  // Handlers para editar items (ya se manejan en CheckoutCartItem, solo pasamos funciones vacías)
  const handleRemoveSummaryItem = () => {
    // La eliminación se maneja en CheckoutCartItem
  };

  const handleLanguageChange = () => {
    // Ya se maneja en CheckoutCartItem
  };

  const handleMeetingPointChange = () => {
    // Ya se maneja en CheckoutCartItem
  };

  const handleCommentChange = () => {
    // Ya se maneja en CheckoutCartItem
  };

  const handleDateChange = () => {
    // Ya se maneja en CheckoutCartItem
  };

  const handleTravelersChange = () => {
    // Ya se maneja en CheckoutCartItem
  };

  // Mostrar loading mientras se valida autenticación
  if (authLoading) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
          </div>
          <h5 className="text-muted">
            {getTranslation('common.validatingAuth', language) || getTranslation('checkout.validatingAuth', language) || (language === 'es' ? 'Validando autenticación...' : 'Validating authentication...')}
          </h5>
        </div>
      </div>
    );
  }

  // Mostrar modal de login si no está autenticado
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
                    onClick={() => setShowLoginModal(true)}
                  >
                    <i className="fab fa-google me-2"></i>
                    {getTranslation('common.continueWithGoogle', language) || (language === 'es' ? 'Continuar con Google' : 'Continue with Google')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div 
            className="modal show d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h4 className="fw-bold mb-0">
                    {getTranslation('checkout.loginModal.title', language) || (language === 'es' ? '¿Quieres iniciar sesión?' : 'Do you want to sign in?')}
                  </h4>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowLoginModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <p className="text-muted mb-4">
                    {getTranslation('checkout.mustSignInToContinue', language) || (language === 'es' 
                      ? 'Para continuar con el pago, debes iniciar sesión.'
                      : 'To continue with payment, you must sign in.')}
                  </p>
                  <button
                    className="btn btn-outline-primary w-100"
                    onClick={handleLoginWithGoogle}
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        {getTranslation('common.signingIn', language) || (language === 'es' ? 'Iniciando sesión...' : 'Signing in...')}
                      </>
                    ) : (
                      <>
                        <i className="fab fa-google me-2"></i>
                        {getTranslation('common.continueWithGoogle', language) || (language === 'es' ? 'Continuar con Google' : 'Continue with Google')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
  if (error) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="alert alert-danger">
                <h4>{getTranslation('common.error', language) || (language === 'es' ? 'Error' : 'Error')}</h4>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => navigate('/cart')}>
                  {getTranslation('common.backToCart', language) || (language === 'es' ? 'Volver al carrito' : 'Back to cart')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay items
  if (checkoutSummaryItems.length === 0) {
    return (
      <div className="min-vh-100 bg-light">
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card shadow text-center">
                <div className="card-body p-5">
                  <i className="fas fa-shopping-cart fa-3x text-muted mb-4"></i>
                  <h3 className="mb-3">
                    {getTranslation('checkout.noItemsToPay', language) || (language === 'es' ? 'No hay items para pagar' : 'No items to pay')}
                  </h3>
                  <p className="text-muted mb-4">
                    {getTranslation('checkout.emptyCartMessage', language) || (language === 'es' 
                      ? 'No tienes actividades en tu carrito. Agrega actividades antes de proceder al pago.'
                      : 'You don\'t have any activities in your cart. Add activities before proceeding to payment.')}
                  </p>
                  <button className="btn btn-primary" onClick={() => navigate('/cart')}>
                    <i className="fas fa-arrow-left me-2"></i>
                    {getTranslation('common.backToCart', language) || (language === 'es' ? 'Volver al carrito' : 'Back to cart')}
                  </button>
                </div>
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
              onClick={handleLogoClick}
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
              {getTranslation('checkout.title', language) || (language === 'es' ? 'Pago' : 'Checkout')}
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
            />
          </div>

          {/* Columna derecha - Información de contacto y métodos de pago */}
          <div className="col-lg-5">
            {/* Información de contacto */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">
                    {getTranslation('checkout.contactInfo', language)}
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
                    <div className="mb-2">
                      <strong>{formData.name} {formData.lastName}</strong>
                    </div>
                    <div className="mb-2">
                      <span>{formData.email}</span>
                    </div>
                    <div>
                      <span>{formData.phoneCode} {formData.phoneNumber}</span>
                    </div>
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
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
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
                        {getTranslation('checkout.phoneRequired', language) || (language === 'es' ? 'Teléfono *' : 'Phone *')}
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder={getTranslation('checkout.phonePlaceholder', language) || (language === 'es' ? 'Ingresa tu teléfono' : 'Enter your phone')}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-medium">
                        {getTranslation('checkout.nationalityRequired', language) || (language === 'es' ? 'Nacionalidad *' : 'Nationality *')}
                      </label>
                      {loadingNationalities ? (
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
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
                      {firebaseUser && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setIsEditingContactInfo(false)}
                        >
                          {getTranslation('common.cancel', language) || (language === 'es' ? 'Cancelar' : 'Cancel')}
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  {getTranslation('checkout.paymentMethod', language)}
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
                                  gateway: 'stripe', // Cambiar según tu gateway de pago (stripe, braintree, etc.)
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

                {/* Reservar ahora, pagar después */}
                <div className="mb-3">
                  <label className="d-flex align-items-center p-3 border rounded" style={{ cursor: 'pointer', backgroundColor: paymentMethod === 'reserveLater' ? '#f0f8ff' : 'white' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="reserveLater"
                      checked={paymentMethod === 'reserveLater'}
                      onChange={() => handlePaymentMethodSelect('reserveLater')}
                      className="me-3"
                    />
                    <i className="fas fa-calendar-check text-primary me-2" style={{ fontSize: '1.5rem' }}></i>
                    <div>
                      <div className="fw-medium">
                        {getTranslation('checkout.reserveNowPayLater', language) || (language === 'es' ? 'Reservar ahora, pagar después' : 'Reserve now, pay later')}
                      </div>
                      <small className="text-muted">
                        {getTranslation('checkout.reserveNowPayLaterDesc', language)}
                      </small>
                    </div>
                  </label>
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

                  {/* Botón de procesar pago (solo para reservar sin pago) */}
                  {paymentMethod === 'reserveLater' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-lg w-100"
                      onClick={handleProcessPayment}
                      disabled={!paymentMethod || isProcessingPayment || !areRequiredFieldsComplete(formData)}
                    >
                      {isProcessingPayment ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          {getTranslation('checkout.processing', language) || (language === 'es' ? 'Procesando...' : 'Processing...')}
                        </>
                      ) : (
                        getTranslation('checkout.reserveNow', language) || (language === 'es' ? 'Reservar ahora' : 'Reserve now')
                      )}
                    </button>
                  )}
                  
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

export default Checkout;
