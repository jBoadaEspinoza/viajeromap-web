import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';
import { countriesApi, PhoneCode, Nationality } from '../api/countries';
import { activitiesApi } from '../api/activities';
import { useCart } from '../context/CartContext';
import type { CartItem } from '../context/CartContext';

interface BookingDetails {
  activityId: string;
  title: string;
  imageUrl: string;
  price: number; // Precio FINAL (con descuento si existe)
  currency: string;
  quantity: number;
  date: string;
  time: string;
  meetingPoint: string;
  guideLanguage: string;
  travelers: {
    adults: number;
    children: number;
  };
  hasDiscount: boolean; // Indica si tiene descuento
  discountPercentage: number; // Porcentaje de descuento (0 si no hay)
  originalPrice: number; // Precio original sin descuento (para mostrar tachado)
  pickupPoint?: {
    name: string;
    address: string;
  };
  comment?: string;
  cancelBefore?: string;
  cancelBeforeMinutes?: number;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { config } = useConfig();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  
  // Función para navegar a home
  const handleLogoClick = () => {
    navigate('/');
  };

  // Función para convertir BookingDetails a CartItem
  // Esta función incluye todos los datos actualizados (comentario, idioma, fecha/hora, viajeros)
  const convertBookingDetailsToCartItem = (details: BookingDetails): CartItem => {
    const totalTravelers = details.travelers.adults + details.travelers.children;
    return {
      id: `${details.activityId}-${details.date}-${details.time}`,
      title: details.title,
      price: details.price, // Usar details.price (precio FINAL)
      currency: details.currency,
      quantity: totalTravelers, // Se actualiza con los viajeros editados
      imageUrl: details.imageUrl,
      date: details.date, // Fecha actualizada
      travelers: details.travelers, // Viajeros actualizados (adults/children)
      activityDetails: {
        activityId: details.activityId,
        bookingOptionId: '', // No disponible en BookingDetails, se puede dejar vacío o obtener si es necesario
        meetingPoint: details.meetingPoint,
        guideLanguage: details.guideLanguage, // Idioma del guía actualizado
        departureTime: details.time, // Hora de salida actualizada
        departureDate: details.date, // Fecha de salida actualizada
        finalPrice: details.price, // Usar details.price como precio final
        pickupPoint: details.pickupPoint,
        comment: details.comment // Comentario actualizado
      }
    };
  };

  // Función para convertir formato de 24 horas a AM/PM
  const convertTo12HourFormat = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return time24;
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const min = minutes || '00';
    
    if (hour === 0) {
      return `12:${min} AM`;
    } else if (hour === 12) {
      return `12:${min} PM`;
    } else if (hour < 12) {
      return `${hour}:${min} AM`;
    } else {
      return `${hour - 12}:${min} PM`;
    }
  };
  
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    // Intentar recuperar el tiempo restante desde sessionStorage
    const savedTime = sessionStorage.getItem('checkoutTimeLeft');
    return savedTime ? parseInt(savedTime) : 15 * 60; // 15 minutes por defecto
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginDismissed, setLoginDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('checkoutLoginDismissed') === '1';
  });
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    phoneCode: '',
    phone: '',
    nationality: 'none'
  });
  const [phoneCodes, setPhoneCodes] = useState<PhoneCode[]>([]);
  const [loadingPhoneCodes, setLoadingPhoneCodes] = useState(true);
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [loadingNationalities, setLoadingNationalities] = useState(true);
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [activityRating, setActivityRating] = useState<number | null>(null);
  const [bookingOptionCancelInfo, setBookingOptionCancelInfo] = useState<{
    cancelBefore?: string;
    cancelBeforeMinutes?: number;
  } | null>(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [editedComment, setEditedComment] = useState('');
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [editedLanguage, setEditedLanguage] = useState('');
  const [availableGuideLanguages, setAvailableGuideLanguages] = useState<string[]>([]);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editedDate, setEditedDate] = useState('');
  const [editedTime, setEditedTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [currentBookingOption, setCurrentBookingOption] = useState<any>(null);
  const [isEditingTravelers, setIsEditingTravelers] = useState(false);
  const [editedAdults, setEditedAdults] = useState<number>(1);
  const [editedChildren, setEditedChildren] = useState<number>(0);
  const [isEditingPickupPoint, setIsEditingPickupPoint] = useState(false);
  const [selectedPickupPointId, setSelectedPickupPointId] = useState<number | ''>('');

  // Get booking details from location state, localStorage, or sessionStorage
  useEffect(() => {
    console.log('📍 Checkout: location.state recibido:', location.state);
    
    // Pequeño delay para asegurar que el estado esté disponible
    const timer = setTimeout(() => {
      let details = null;
      
      // Intentar obtener desde location.state primero
      if (location.state?.bookingDetails) {
        console.log('✅ Checkout: bookingDetails encontrados en location.state:', location.state.bookingDetails);
        details = location.state.bookingDetails;
        // Guardar en sessionStorage para persistencia
        sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(details));
      } 
      // Si no hay en location.state, intentar desde sessionStorage (persistente)
      else {
        const sessionDetails = sessionStorage.getItem('checkoutBookingDetails');
        if (sessionDetails) {
          console.log('✅ Checkout: bookingDetails encontrados en sessionStorage:', sessionDetails);
          details = JSON.parse(sessionDetails);
        }
        // Si tampoco hay en sessionStorage, intentar desde localStorage (respaldo)
        else {
          const storedDetails = localStorage.getItem('checkoutBookingDetails');
          if (storedDetails) {
            console.log('✅ Checkout: bookingDetails encontrados en localStorage:', storedDetails);
            details = JSON.parse(storedDetails);
            // Mover a sessionStorage para mejor persistencia
            sessionStorage.setItem('checkoutBookingDetails', storedDetails);
            // Limpiar localStorage después de migrar
            localStorage.removeItem('checkoutBookingDetails');
          }
        }
      }
      
      if (details) {
        setBookingDetails(details);
        // Prefill travelers edit fields
        try {
          const ad = Number(details?.travelers?.adults ?? 1);
          const ch = Number(details?.travelers?.children ?? 0);
          setEditedAdults(isNaN(ad) ? 1 : ad);
          setEditedChildren(isNaN(ch) ? 0 : ch);
        } catch {}
        // Prefill pickup point selector if available
        try {
          if (details?.pickupPoint && Array.isArray(currentBookingOption?.pickupPoints)) {
            const found = currentBookingOption.pickupPoints.find((p: any) => p?.name === details.pickupPoint?.name);
            if (found?.id != null) {
              setSelectedPickupPointId(found.id);
            }
          }
        } catch {}
      } else {
        console.log('⚠️ Checkout: No hay bookingDetails, pero manteniendo en checkout y mostrando modal');
        // Mostrar modal de login solo si no fue descartado previamente
        if (!loginDismissed) {
          setShowLoginModal(true);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.state, navigate, loginDismissed]);

  // Show login modal if user is not authenticated OR if no booking details
  useEffect(() => {
    if (!isAuthenticated && !loginDismissed) {
      setShowLoginModal(true);
    }
  }, [bookingDetails, isAuthenticated, loginDismissed]);

  // Load phone codes
  useEffect(() => {
    const loadPhoneCodes = async () => {
      setLoadingPhoneCodes(true);
      try {
        const response = await countriesApi.getPhoneCodes({
          lang: language,
          all: true,
          sortBy: 'countryName'
        });
        
        if (response.success && response.data.length > 0) {
          setPhoneCodes(response.data);
          // Buscar Perú específicamente y establecerlo como valor por defecto
          setFormData(prev => {
            // Buscar Perú por código (51, +51) o por código ISO (PE)
            const peruCode = response.data.find(
              (pc) => {
                const codeWithoutPlus = pc.code?.replace('+', '').trim();
                return (
                  codeWithoutPlus === '51' || 
                  pc.code === '51' ||
                  pc.code === '+51' ||
                  pc.code2?.toLowerCase() === 'pe' || 
                  pc.countryName?.toLowerCase().includes('peru') ||
                  pc.countryName?.toLowerCase().includes('perú')
                );
              }
            );
            
            // Priorizar Perú, si no se encuentra usar el primer país
            const defaultCode = peruCode || response.data[0];
            
            // Establecer Perú como valor por defecto
            if (defaultCode) {
              // Si ya hay un phoneCode seleccionado, mantenerlo; si no, establecer el defecto (Perú)
              const phoneCodeValue = prev.phoneCode || `(${defaultCode.code})`;
              return {
                ...prev,
                phoneCode: phoneCodeValue
              };
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error loading phone codes:', error);
      } finally {
        setLoadingPhoneCodes(false);
      }
    };

    loadPhoneCodes();
  }, [language]);

  // Load nationalities
  useEffect(() => {
    const loadNationalities = async () => {
      setLoadingNationalities(true);
      try {
        const response = await countriesApi.getNationalities({
          lang: language,
          all: true,
          sortBy: 'denomination'
        });
        
        if (response.success && response.data.length > 0) {
          setNationalities(response.data);
        }
      } catch (error) {
        console.error('Error loading nationalities:', error);
      } finally {
        setLoadingNationalities(false);
      }
    };

    loadNationalities();
  }, [language]);

  // Load activity title by language
  useEffect(() => {
    if (!bookingDetails) {
      // Si no hay bookingDetails, limpiar el título y rating
      setActivityTitle('');
      setActivityRating(null);
      return;
    }

    const loadActivityTitle = async () => {
      // Si no hay activityId, usar el título del bookingDetails como fallback
      if (!bookingDetails.activityId) {
        if (bookingDetails.title) {
          setActivityTitle(bookingDetails.title);
        }
        setActivityRating(null);
        return;
      }

      try {
        const activity = await activitiesApi.getById(
          bookingDetails.activityId,
          language,
          currency || 'PEN',
          bookingDetails.date
        );
        
        if (activity) {
          if (activity.title) {
            setActivityTitle(activity.title);
          } else if (bookingDetails.title) {
            // Fallback al título del bookingDetails si la API no retorna título
            setActivityTitle(bookingDetails.title);
          }
          
          // Guardar el rating de la actividad (puede ser null)
          setActivityRating(activity.rating);

          // Buscar información de cancelación y lenguajes del bookingOption
          if (activity.bookingOptions && activity.bookingOptions.length > 0) {
            const bookingOption = activity.bookingOptions[0];
            if (bookingOption) {
              // Guardar el bookingOption completo para acceder a schedules
              setCurrentBookingOption(bookingOption);
              
              setBookingOptionCancelInfo({
                cancelBefore: bookingOption.cancelBefore ? String(bookingOption.cancelBefore) : undefined,
                cancelBeforeMinutes: bookingOption.cancelBeforeMinutes || undefined
              });
              console.log('📋 Información de cancelación obtenida:', {
                cancelBefore: bookingOption.cancelBefore,
                cancelBeforeMinutes: bookingOption.cancelBeforeMinutes
              });

              // Establecer lenguajes disponibles del guía si existen en el bookingOption
              if (Array.isArray((bookingOption as any).languages) && (bookingOption as any).languages.length > 0) {
                const langs = (bookingOption as any).languages as string[];
                setAvailableGuideLanguages(langs);
                // Si no hay valor de edición establecido, prefijar con el actual o el primero
                setEditedLanguage(prev => prev || bookingDetails.guideLanguage || langs[0]);
              }

              // Calcular y persistir precio unitario (basado en priceTiers.totalPrice) y descuento
              try {
                const totalTravelers = (bookingDetails.travelers?.adults || 0) + (bookingDetails.travelers?.children || 0);
                let matchingTier: any | null = null;
                if (Array.isArray((bookingOption as any).priceTiers) && (bookingOption as any).priceTiers.length > 0) {
                  matchingTier = (bookingOption as any).priceTiers.find((tier: any) => {
                    const min = tier.minParticipants || 1;
                    const max = tier.maxParticipants || Infinity;
                    return totalTravelers >= min && totalTravelers <= max;
                  }) || null;
                }

                const baseUnitPrice = matchingTier?.totalPrice != null && !isNaN(matchingTier.totalPrice)
                  ? Number(matchingTier.totalPrice)
                  : Number((bookingOption as any).pricePerPerson) || 0;
                const resolvedCurrency = matchingTier?.currency || (bookingOption as any).currency || 'PEN';

                const offer = (bookingOption as any).specialOfferPercentage;
                const hasDiscount = offer != null && offer > 0;
                const originalUnitPrice = Math.ceil(baseUnitPrice);
                const finalUnitPrice = hasDiscount
                  ? Math.ceil(baseUnitPrice - (baseUnitPrice * (offer / 100)))
                  : originalUnitPrice;

                const updated: BookingDetails = {
                  ...bookingDetails,
                  price: finalUnitPrice,
                  originalPrice: originalUnitPrice,
                  hasDiscount: !!hasDiscount,
                  discountPercentage: hasDiscount ? Number(offer) : 0,
                  currency: resolvedCurrency
                };
                setBookingDetails(updated);
                sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updated));
                sessionStorage.setItem('bookingDetails', JSON.stringify(updated));
              } catch (e) {
                console.warn('No se pudo calcular el precio unitario desde priceTiers:', e);
              }
            }
          }
        } else if (bookingDetails.title) {
          // Fallback al título del bookingDetails si la API no retorna nada
          setActivityTitle(bookingDetails.title);
          setActivityRating(null);
        }
      } catch (error) {
        console.error('Error loading activity title:', error);
        // En caso de error, usar el título del bookingDetails como fallback
        if (bookingDetails.title) {
          setActivityTitle(bookingDetails.title);
        }
        setActivityRating(null);
      }
    };

    loadActivityTitle();
  }, [bookingDetails?.activityId, bookingDetails?.date, language, currency]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        // Guardar el tiempo restante en sessionStorage
        sessionStorage.setItem('checkoutTimeLeft', newTimeLeft.toString());
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Tiempo expirado, enviar actividad al cart y limpiar datos
      if (bookingDetails) {
        try {
          const cartItem = convertBookingDetailsToCartItem(bookingDetails);
          const itemAdded = addItem(cartItem);
          
          if (itemAdded) {
            console.log('✅ Actividad enviada al carrito después de expirar el tiempo');
          } else {
            console.log('⚠️ La actividad ya estaba en el carrito');
          }
        } catch (error) {
          console.error('❌ Error al enviar actividad al carrito:', error);
        }
      }
      
      // Limpiar datos del checkout
      sessionStorage.removeItem('checkoutBookingDetails');
      sessionStorage.removeItem('checkoutTimeLeft');
      
      // Redirigir al carrito
      navigate('/cart');
    }
  }, [timeLeft, navigate, bookingDetails, addItem]);

  const formatTime = (seconds: number, lang: string = 'es'): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0 && remainingSeconds > 0) {
      const minutesText = minutes === 1 
        ? (lang === 'es' ? 'minuto' : 'minute')
        : (lang === 'es' ? 'minutos' : 'minutes');
      const secondsText = remainingSeconds === 1
        ? (lang === 'es' ? 'segundo' : 'second')
        : (lang === 'es' ? 'segundos' : 'seconds');
      const connector = lang === 'es' ? 'y' : 'and';
      return `${minutes} ${minutesText} ${connector} ${remainingSeconds} ${secondsText}`;
    } else if (minutes > 0) {
      const minutesText = minutes === 1 
        ? (lang === 'es' ? 'minuto' : 'minute')
        : (lang === 'es' ? 'minutos' : 'minutes');
      return `${minutes} ${minutesText}`;
    } else {
      const secondsText = remainingSeconds === 1
        ? (lang === 'es' ? 'segundo' : 'second')
        : (lang === 'es' ? 'segundos' : 'seconds');
      return `${remainingSeconds} ${secondsText}`;
    }
  };

  // Función para capitalizar la primera letra del nombre del país
  const capitalizeCountryName = (countryName: string): string => {
    if (!countryName) return countryName;
    return countryName.charAt(0).toUpperCase() + countryName.slice(1).toLowerCase();
  };

  // Función para capitalizar la denominación de nacionalidad
  const capitalizeDenomination = (denomination: string): string => {
    if (!denomination) return denomination;
    return denomination.charAt(0).toUpperCase() + denomination.slice(1).toLowerCase();
  };

  // Calcular el total de viajeros
  const getTotalTravelers = (): number => {
    if (!bookingDetails) return 0;
    return bookingDetails.travelers.adults + bookingDetails.travelers.children;
  };

  // Calcular precio total considerando la cantidad de viajeros
  // IMPORTANTE: bookingDetails.price es el precio FINAL (con descuento si existe)
  const calculateTotalPrice = (): { originalTotal: number; finalTotal: number } => {
    if (!bookingDetails) return { originalTotal: 0, finalTotal: 0 };
    
    const totalTravelers = getTotalTravelers();
    // Redondear solo los precios unitarios con ceil
    const ceilOriginalPrice = Math.ceil(bookingDetails.originalPrice);
    const ceilFinalPrice = Math.ceil(bookingDetails.price); // Usar bookingDetails.price (precio FINAL)
    // Calcular totales multiplicando el precio unitario redondeado por la cantidad de viajeros
    const originalTotal = ceilOriginalPrice * totalTravelers;
    const finalTotal = ceilFinalPrice * totalTravelers;
    
    return { originalTotal, finalTotal };
  };

  // Función para obtener el dayOfWeek (Lunes=0, Martes=1, etc.)
  const getDayOfWeek = (dateString: string): number => {
    const date = new Date(dateString);
    const day = date.getDay(); // 0=Domingo, 1=Lunes, ..., 6=Sábado
    // Convertir a: 0=Lunes, 1=Martes, ..., 6=Domingo
    return day === 0 ? 6 : day - 1;
  };

  // Función para obtener horarios disponibles según el día de la semana
  const getAvailableTimesForDate = (dateString: string): string[] => {
    if (!currentBookingOption || !currentBookingOption.schedules || !Array.isArray(currentBookingOption.schedules)) {
      return [];
    }

    const dayOfWeek = getDayOfWeek(dateString);
    const schedulesForDay = currentBookingOption.schedules.filter(
      (schedule: any) => schedule.dayOfWeek === dayOfWeek && schedule.isActive
    );

    // Extraer los startTime únicos y ordenarlos
    const times: string[] = schedulesForDay
      .map((schedule: any) => schedule.startTime)
      .filter((time: any): time is string => typeof time === 'string' && time !== null && time !== undefined)
      .sort();

    return Array.from(new Set(times)); // Eliminar duplicados
  };

  // Función para formatear la fecha de salida (fecha original que no cambia)
  const getDepartureDateFormatted = (): string | null => {
    if (!bookingDetails?.date || !bookingDetails?.time) {
      return null;
    }

    try {
      const [year, month, day] = bookingDetails.date.split('-').map(Number);
      const timeParts = bookingDetails.time.split(':');
      const hours = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
      const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
      
      const departureDate = new Date(year, month - 1, day, hours, minutes, 0);
      
      if (isNaN(departureDate.getTime())) {
        return null;
      }
      
      const dateOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      
      if (language === 'es') {
        const dateStr = departureDate.toLocaleDateString('es-ES', dateOptions);
        const timeStr = departureDate.toLocaleTimeString('es-ES', timeOptions);
        return `${dateStr} a las ${timeStr}`;
      } else {
        const dateStr = departureDate.toLocaleDateString('en-US', dateOptions);
        const timeStr = departureDate.toLocaleTimeString('en-US', timeOptions);
        return `${dateStr} at ${timeStr}`;
      }
    } catch (error) {
      console.error('Error formatting departure date:', error);
      return null;
    }
  };

  // Verificar si la fecha límite de cancelación ya pasó
  const isCancellationDeadlinePassed = (): boolean => {
    if (!bookingDetails) {
      return false;
    }

    const cancelBeforeMinutes = bookingDetails.cancelBeforeMinutes ?? bookingOptionCancelInfo?.cancelBeforeMinutes;
    
    if (cancelBeforeMinutes === undefined || cancelBeforeMinutes === null || cancelBeforeMinutes <= 0) {
      return false;
    }

    if (!bookingDetails.date || !bookingDetails.time) {
      return false;
    }

    try {
      // Parsear fecha y hora de salida
      const [year, month, day] = bookingDetails.date.split('-').map(Number);
      const timeParts = bookingDetails.time.split(':');
      const hours = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
      const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
      
      // Crear fecha y hora de salida
      const departureDate = new Date(year, month - 1, day, hours, minutes, 0);
      
      // Calcular fecha límite de cancelación
      const cancellationDeadline = new Date(departureDate.getTime() - (cancelBeforeMinutes * 60 * 1000));
      
      // Comparar con la fecha/hora actual
      const now = new Date();
      
      // Si la fecha límite es anterior a la fecha actual, significa que ya pasó
      return cancellationDeadline < now;
    } catch (error) {
      console.error('Error verificando fecha límite de cancelación:', error);
      return false;
    }
  };

  // Calcular fecha límite de cancelación
  const getCancellationDeadline = (): string | null => {
    // Verificar que tenemos los datos necesarios
    if (!bookingDetails) {
      return null;
    }

    // Obtener cancelBeforeMinutes de bookingDetails o de bookingOptionCancelInfo
    const cancelBeforeMinutes = bookingDetails.cancelBeforeMinutes ?? bookingOptionCancelInfo?.cancelBeforeMinutes;
    
    // Si tenemos cancelBeforeMinutes, calcular desde fecha/hora de salida
    if (cancelBeforeMinutes !== undefined && cancelBeforeMinutes !== null && cancelBeforeMinutes > 0) {
      if (!bookingDetails.date || !bookingDetails.time) {
        console.warn('No hay fecha o hora de salida para calcular la cancelación', {
          date: bookingDetails.date,
          time: bookingDetails.time
        });
        return null;
      }

      console.log('📅 Calculando fecha límite de cancelación:', {
        cancelBeforeMinutes: cancelBeforeMinutes,
        date: bookingDetails.date,
        time: bookingDetails.time
      });

      try {
        // Parsear fecha y hora de salida de la actividad
        const [year, month, day] = bookingDetails.date.split('-').map(Number);
        const timeParts = bookingDetails.time.split(':');
        const hours = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
        const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
        
        // Crear fecha y hora de salida de la actividad
        const departureDate = new Date(year, month - 1, day, hours, minutes, 0);
        const cancellationDeadline = new Date(departureDate.getTime() - (cancelBeforeMinutes * 60 * 1000));
        
        // Verificar que la fecha es válida
        if (isNaN(cancellationDeadline.getTime())) {
          console.error('Fecha de cancelación inválida');
          return null;
        }
        
        // Formatear según el idioma con formato más legible
        const dateOptions: Intl.DateTimeFormatOptions = {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        };
        
        const timeOptions: Intl.DateTimeFormatOptions = {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        };
        
        if (language === 'es') {
          const dateStr = cancellationDeadline.toLocaleDateString('es-ES', dateOptions);
          const timeStr = cancellationDeadline.toLocaleTimeString('es-ES', timeOptions);
          const result = `${dateStr} a las ${timeStr}`;
          console.log('✅ Fecha límite calculada (ES):', result);
          return result;
        } else {
          const dateStr = cancellationDeadline.toLocaleDateString('en-US', dateOptions);
          const timeStr = cancellationDeadline.toLocaleTimeString('en-US', timeOptions);
          const result = `${dateStr} at ${timeStr}`;
          console.log('✅ Fecha límite calculada (EN):', result);
          return result;
        }
      } catch (error) {
        console.error('Error calculating cancellation deadline:', error);
        return null;
      }
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinueWithoutLogin = () => {
    sessionStorage.setItem('checkoutLoginDismissed', '1');
    setLoginDismissed(true);
    setShowLoginModal(false);
  };

  const handleLoginWithGoogle = () => {
    // Implement Google login
    console.log('Login with Google');
  };

  const handleLoginWithApple = () => {
    // Implement Apple login
    console.log('Login with Apple');
  };

  const handleLoginWithFacebook = () => {
    // Implement Facebook login
    console.log('Login with Facebook');
  };

  const handleEmailLogin = () => {
    // Implement email login
    console.log('Login with email:', formData.email);
  };

  const handleContinueToPayment = () => {
    // Validate form
    if (!formData.name || !formData.lastName || !formData.email || !formData.phone || !formData.nationality || formData.nationality === 'none') {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Process payment
    console.log('Proceeding to payment with:', formData);
    
    // Limpiar datos de reserva después del pago exitoso
    sessionStorage.removeItem('checkoutBookingDetails');
    sessionStorage.removeItem('checkoutTimeLeft');
    
    // Here you would typically redirect to payment gateway
    // Por ahora simulamos éxito
    alert('¡Pago procesado exitosamente!');
  };

  // Función para limpiar datos de reserva (útil para otros casos)
  const clearBookingData = () => {
    sessionStorage.removeItem('checkoutBookingDetails');
    sessionStorage.removeItem('checkoutTimeLeft');
    localStorage.removeItem('checkoutBookingDetails');
  };

  if (!bookingDetails) {
    return (
      <div className="min-vh-100 bg-light">
        {/* CSS para animaciones */}
        <style>{`
          @keyframes fadeIn {
            from { 
              opacity: 0; 
              transform: scale(0.95);
            }
            to { 
              opacity: 1; 
              transform: scale(1);
            }
          }
          
          @keyframes fadeOut {
            from { 
              opacity: 1; 
              transform: scale(1);
            }
            to { 
              opacity: 0; 
              transform: scale(0.95);
            }
          }
          
          .modal-fade-in {
            animation: fadeIn 0.3s ease-in-out;
          }
          
          .modal-fade-out {
            animation: fadeOut 0.3s ease-in-out;
          }
          
          .step-line {
            width: 60px;
            height: 2px;
            background-color: #dee2e6;
            margin: 0 15px;
          }
          
          .step-line.active {
            background-color: #007bff;
          }
        `}</style>
        
        {/* Header con Logo y Progress Steps */}
        <div className="bg-white shadow-sm py-4">
          <div className="container">
            {/* Desktop Layout */}
            <div className="d-none d-lg-flex align-items-center justify-content-between w-100">
              {/* Logo */}
              <div 
                className="d-flex align-items-center" 
                style={{ cursor: 'pointer' }}
                onClick={handleLogoClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
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

              {/* Progress Steps centrados */}
              <div className="d-flex align-items-center">
                <div className="d-flex align-items-center">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                    1
                  </div>
                  <span className="fw-medium text-primary ms-2">Contacto</span>
                </div>
                
                {/* Línea conectora */}
                <div className="step-line active"></div>
                
                <div className="d-flex align-items-center">
                  <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                    2
                  </div>
                  <span className="fw-medium text-muted ms-2">Pago</span>
                </div>
              </div>

              {/* Espacio vacío para balancear el layout */}
              <div style={{ width: '200px' }}></div>
            </div>

            {/* Mobile Layout */}
            <div className="d-lg-none">
              {/* Logo y nombre centrados */}
              <div 
                className="d-flex align-items-center justify-content-center mb-3"
                style={{ cursor: 'pointer' }}
                onClick={handleLogoClick}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.7';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <img
                  src={config.business.urlLogo}
                  alt="Viajero Map Logo"
                  height="45"
                  className="d-inline-block align-text-top me-3"
                  style={{ pointerEvents: 'none' }}
                />
                <span className="fw-bold fs-4 text-primary">{config.business.name}</span>
              </div>

              {/* Progress Steps centrados */}
              <div className="d-flex align-items-center justify-content-center">
                <div className="d-flex align-items-center">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                    1
                  </div>
                  <span className="fw-medium text-primary ms-2" style={{ fontSize: '0.9rem' }}>Contacto</span>
                </div>
                
                {/* Línea conectora */}
                <div className="step-line active" style={{ width: '40px', height: '2px' }}></div>
                
                <div className="d-flex align-items-center">
                  <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                    2
                  </div>
                  <span className="fw-medium text-muted ms-2" style={{ fontSize: '0.9rem' }}>Pago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="text-center">
                <h2 className="mb-4">Cargando detalles de reserva...</h2>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Login Modal con fade */}
        {showLoginModal && (
          <div 
            className="modal show d-block modal-fade-in" 
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content modal-fade-in">
                <div className="modal-header border-0 d-flex align-items-between px-4 py-3">
                  <div className="d-flex align-items-center justify-content-center w-100">
                    <h4 className="fw-bold mb-0">{getTranslation('checkout.loginModal.title', language)}</h4>
                  </div>
                  <button
                    type="button"
                    className="btn-close ms-auto"
                    onClick={() => {
                      sessionStorage.setItem('checkoutLoginDismissed', '1');
                      setLoginDismissed(true);
                      setShowLoginModal(false);
                    }}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  
                  <button
                    className="btn btn-primary btn-lg w-100 mb-3"
                    onClick={handleContinueWithoutLogin}
                  >
                    {getTranslation('checkout.loginModal.continueWithoutLogin', language)}
                  </button>

                  <div className="d-flex align-items-center mb-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-3 text-muted small">o</span>
                    <hr className="flex-grow-1" />
                  </div>

                  <p className="text-muted mb-4">
                    {getTranslation('checkout.loginModal.benefits', language)}
                  </p>

                  {/* Social Login Buttons */}
                  <div className="d-flex gap-2 mb-3">
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={handleLoginWithGoogle}
                    >
                      <i className="fab fa-google me-2"></i>
                      Google
                    </button>
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={handleLoginWithApple}
                    >
                      <i className="fab fa-apple me-2"></i>
                      Apple
                    </button>
                    <button
                      className="btn btn-outline-secondary flex-fill"
                      onClick={handleLoginWithFacebook}
                    >
                      <i className="fab fa-facebook me-2"></i>
                      Facebook
                    </button>
                  </div>

                  {/* Email Login */}
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder={getTranslation('checkout.loginModal.emailPlaceholder', language)}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <button
                    className="btn btn-secondary w-100"
                    onClick={handleEmailLogin}
                    disabled={!formData.email}
                  >
                    {getTranslation('checkout.loginModal.continueWithEmail', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* CSS para animaciones */}
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: scale(0.95);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        @keyframes fadeOut {
          from { 
            opacity: 1; 
            transform: scale(1);
          }
          to { 
            opacity: 0; 
            transform: scale(0.95);
          }
        }
        
        .modal-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        .modal-fade-out {
          animation: fadeOut 0.3s ease-in-out;
        }
        
        .step-line {
          width: 60px;
          height: 2px;
          background-color: #dee2e6;
          margin: 0 15px;
        }
        
        .step-line.active {
          background-color: #007bff;
        }
      `}</style>
      
      {/* Header con Logo y Progress Steps */}
      <div className="bg-white shadow-sm py-4">
        <div className="container">
          {/* Desktop Layout */}
          <div className="d-none d-lg-flex align-items-center justify-content-between w-100">
            {/* Logo */}
            <div 
              className="d-flex align-items-center" 
              style={{ cursor: 'pointer' }}
              onClick={handleLogoClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
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

            {/* Progress Steps centrados */}
            <div className="d-flex align-items-center">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                  1
                </div>
                <span className="fw-medium text-primary ms-2">Contacto</span>
              </div>
              
              {/* Línea conectora */}
              <div className="step-line active"></div>
              
              <div className="d-flex align-items-center">
                <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                  2
                </div>
                <span className="fw-medium text-muted ms-2">Pago</span>
              </div>
            </div>

            {/* Espacio vacío para balancear el layout */}
            <div style={{ width: '200px' }}></div>
          </div>

          {/* Mobile Layout */}
          <div className="d-lg-none">
            {/* Logo y nombre centrados */}
            <div 
              className="d-flex align-items-center justify-content-center mb-3"
              style={{ cursor: 'pointer' }}
              onClick={handleLogoClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <img
                src={config.business.urlLogo}
                alt="Viajero Map Logo"
                height="45"
                className="d-inline-block align-text-top me-3"
                style={{ pointerEvents: 'none' }}
              />
              <span className="fw-bold fs-4 text-primary">{config.business.name}</span>
            </div>

            {/* Progress Steps centrados */}
            <div className="d-flex align-items-center justify-content-center">
              <div className="d-flex align-items-center">
                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                  1
                </div>
                <span className="fw-medium text-primary ms-2" style={{ fontSize: '0.9rem' }}>Contacto</span>
              </div>
              
              {/* Línea conectora */}
              <div className="step-line active" style={{ width: '40px', height: '2px' }}></div>
              
              <div className="d-flex align-items-center">
                <div className="bg-light text-muted rounded-circle d-flex align-items-center justify-content-center" 
                     style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                  2
                </div>
                <span className="fw-medium text-muted ms-2" style={{ fontSize: '0.9rem' }}>Pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row">
          {/* Left Column - Personal Data */}
          <div className="col-lg-6">
            {/* Reservation Timer */}
            <div className="alert alert-warning mb-4" style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}>
              <div className="d-flex align-items-center">
                <i className="fas fa-clock me-2"></i>
                <span className="fw-medium">
                  {getTranslation('checkout.reservationTimer', language)} {formatTime(timeLeft, language)}.
                </span>
              </div>
            </div>

            {/* Personal Data Form */}
            <div className="card">
              <div className="card-body">
                <h2 className="fw-bold mb-3">{getTranslation('checkout.reviewPersonalData', language)}</h2>
                <div className="d-flex align-items-center mb-4">
                  <i className="fas fa-lock text-success me-2"></i>
                  <span className="text-success fw-medium">{getTranslation('checkout.fastSecureReservation', language)}</span>
                </div>

                <form>
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.nameRequired', language)}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={getTranslation('checkout.namePlaceholder', language)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.lastNameRequired', language)}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder={getTranslation('checkout.lastNamePlaceholder', language)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.emailRequired', language)}
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder={getTranslation('checkout.emailPlaceholder', language)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.phoneCodeRequired', language)}
                    </label>
                    {loadingPhoneCodes ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
                        </div>
                    <select
                      className="form-select"
                          disabled
                        >
                          <option>{getTranslation('common.loading', language)}...</option>
                        </select>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        name="phoneCode"
                        value={formData.phoneCode}
                      onChange={handleInputChange}
                    >
                        {phoneCodes.length === 0 ? (
                          <option value="">{getTranslation('checkout.noPhoneCodesAvailable', language)}</option>
                        ) : (
                          phoneCodes.map((phoneCode) => {
                            const countryNameCapitalized = capitalizeCountryName(phoneCode.countryName);
                            return (
                              <option 
                                key={`${phoneCode.code2}-${phoneCode.code}`} 
                                value={`(${phoneCode.code})`}
                              >
                                {countryNameCapitalized} ({phoneCode.code})
                              </option>
                            );
                          })
                        )}
                    </select>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.phoneRequired', language)}
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder={getTranslation('checkout.phonePlaceholder', language)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.nationalityRequired', language)}
                    </label>
                    {loadingNationalities ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
                        </div>
                        <select
                          className="form-select"
                          disabled
                        >
                          <option>{getTranslation('common.loading', language)}...</option>
                        </select>
                      </div>
                    ) : (
                    <select
                      className="form-select"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                    >
                        <option value="none">
                          {getTranslation('checkout.selectNationality', language) || 'Seleccione una nacionalidad'}
                        </option>
                        {nationalities.length === 0 ? (
                          <option value="">{getTranslation('checkout.noNationalitiesAvailable', language) || 'No hay nacionalidades disponibles'}</option>
                        ) : (
                          nationalities.map((nationality) => {
                            const denominationCapitalized = capitalizeDenomination(nationality.denomination);
                            return (
                              <option 
                                key={nationality.code2} 
                                value={nationality.code2}
                              >
                                {denominationCapitalized}
                              </option>
                            );
                          })
                        )}
                    </select>
                    )}
                  </div>
                  <div className="mb-4">
                    <small className="text-muted">
                      {getTranslation('checkout.contactDisclaimer', language)}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleContinueToPayment}
                  >
                    {getTranslation('checkout.continuePayment', language)}
                  </button>

                  {/* Booking Policies */}
                  <div className="mt-4">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      <span className="fw-medium">{getTranslation('checkout.noPayToday', language)}</span>
                    </div>
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-check text-success me-2"></i>
                      <span className="fw-medium">{getTranslation('checkout.bookNowPayLater', language)}</span>
                    </div>
                    {!isCancellationDeadlinePassed() && (
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check text-success me-2"></i>
                        <span className="fw-medium">
                          {(() => {
                            const deadline = getCancellationDeadline();
                            const cancelBefore = bookingDetails?.cancelBefore || bookingOptionCancelInfo?.cancelBefore;
                            
                            if (deadline) {
                              return (
                                <>
                                  {getTranslation('checkout.easyCancellation', language)} {deadline}
                                </>
                              );
                            } else if (cancelBefore) {
                              return `${getTranslation('checkout.easyCancellation', language)} - ${cancelBefore}`;
                            }
                            return getTranslation('checkout.easyCancellation', language);
                          })()}
                        </span>
                    </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="col-lg-6">
            <div className="card">
              <div className="card-body">
                <h2 className="fw-bold mb-4">{getTranslation('checkout.orderSummary', language)}</h2>

                {/* Activity Card */}
                <div className="d-flex mb-4">
                  <img
                    src={bookingDetails.imageUrl}
                    alt={activityTitle || bookingDetails.title}
                    className="rounded me-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{activityTitle || bookingDetails.title}</h5>
                    {bookingDetails?.hasDiscount && bookingDetails?.discountPercentage > 0 && (
                      <span className="badge bg-success small">-{bookingDetails.discountPercentage}%</span>
                    )}
                    {activityRating !== null && activityRating !== undefined && typeof activityRating === 'number' && (
                    <div className="d-flex align-items-center mb-2">
                      <div className="d-flex align-items-center me-3">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star text-warning me-1" style={{ fontSize: '0.8rem' }}></i>
                        ))}
                          <span className="fw-medium me-1">{activityRating.toFixed(1)}</span>
                    </div>
                    <span className="badge bg-primary">{getTranslation('checkout.bestRated', language)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="mb-4">
                  {/* Idioma del guía */}
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center flex-grow-1">
                      <i className="fas fa-language text-primary me-2"></i>
                      {isEditingLanguage ? (
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto', maxWidth: '200px' }}
                          value={editedLanguage}
                          onChange={(e) => setEditedLanguage(e.target.value)}
                          disabled={availableGuideLanguages.length === 0}
                        >
                          {availableGuideLanguages.length === 0 ? (
                            <option value="">{language === 'es' ? 'Sin opciones' : 'No options'}</option>
                          ) : (
                            availableGuideLanguages.map((langOpt) => (
                              <option key={langOpt} value={langOpt}>
                                {getLanguageName(langOpt, language)}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <span className="small">
                          {getTranslation('checkout.language', language)}: {getLanguageName(bookingDetails.guideLanguage, language)}
                        </span>
                      )}
                    </div>
                    {isEditingLanguage ? (
                      <div className="d-flex gap-2 ms-2" style={{ alignSelf: 'center' }}>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            if (bookingDetails) {
                              setBookingDetails({
                                ...bookingDetails,
                                guideLanguage: editedLanguage
                              });
                              // Guardar en sessionStorage (usar la misma clave que se usa al cargar)
                              const updatedDetails = {
                                ...bookingDetails,
                                guideLanguage: editedLanguage
                              };
                              sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updatedDetails));
                              // También guardar en bookingDetails para compatibilidad
                              sessionStorage.setItem('bookingDetails', JSON.stringify(updatedDetails));
                            }
                            setIsEditingLanguage(false);
                          }}
                        >
                          <i className="fas fa-check me-1"></i>
                          {getTranslation('common.save', language)}
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setEditedLanguage(bookingDetails?.guideLanguage || '');
                            setIsEditingLanguage(false);
                          }}
                        >
                          <i className="fas fa-times me-1"></i>
                          {getTranslation('common.cancel', language)}
                        </button>
                      </div>
                    ) : (
                      <a href="#" className="text-primary text-decoration-none small ms-2" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }} onClick={(e) => {
                        e.preventDefault();
                        setEditedLanguage(bookingDetails?.guideLanguage || '');
                        setIsEditingLanguage(true);
                      }}>
                        <i className="fas fa-pencil-alt me-1"></i>
                        {getTranslation('common.edit', language)}
                      </a>
                    )}
                  </div>
                  
                  {/* Punto de encuentro o recogida */}
                  <div className="d-flex align-items-start mb-2">
                    <i className="fas fa-map-marker-alt text-primary me-2 mt-1"></i>
                    <div className="flex-grow-1 d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <span className="small fw-medium d-block">
                          {getTranslation('checkout.meetingPoint', language)}:
                        </span>
                        {!isEditingPickupPoint ? (
                          <span className="small">
                            {bookingDetails.pickupPoint ? (
                              <>
                                {bookingDetails.pickupPoint.name}
                                {bookingDetails.pickupPoint.address && (
                                  <span className="text-muted d-block mt-1">
                                    {bookingDetails.pickupPoint.address}
                                  </span>
                                )}
                              </>
                            ) : (
                              bookingDetails.meetingPoint
                            )}
                          </span>
                        ) : (
                          <div className="d-flex align-items-center gap-2">
                            <select
                              className="form-select form-select-sm"
                              style={{ maxWidth: '360px' }}
                              value={selectedPickupPointId}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSelectedPickupPointId(v === '' ? '' : Number(v));
                              }}
                            >
                              <option value="">
                                {language === 'es' ? 'Seleccione un punto de encuentro' : 'Select a meeting point'}
                              </option>
                              {Array.isArray(currentBookingOption?.pickupPoints) && currentBookingOption.pickupPoints.map((p: any) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  if (!Array.isArray(currentBookingOption?.pickupPoints)) {
                                    setIsEditingPickupPoint(false);
                                    return;
                                  }
                                  const chosen = currentBookingOption.pickupPoints.find((p: any) => p.id === selectedPickupPointId) || null;
                                  const newPickup = chosen ? { name: chosen.name, address: chosen.address } : undefined;
                                  const updated: BookingDetails = {
                                    ...bookingDetails,
                                    pickupPoint: newPickup
                                  };
                                  setBookingDetails(updated);
                                  sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updated));
                                  sessionStorage.setItem('bookingDetails', JSON.stringify(updated));
                                  setIsEditingPickupPoint(false);
                                }}
                              >
                                <i className="fas fa-check me-1"></i>
                                {getTranslation('common.save', language)}
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  // Restaurar selección según bookingDetails actual
                                  if (bookingDetails?.pickupPoint && Array.isArray(currentBookingOption?.pickupPoints)) {
                                    const found = currentBookingOption.pickupPoints.find((p: any) => p?.name === bookingDetails.pickupPoint?.name);
                                    if (found?.id != null) setSelectedPickupPointId(found.id);
                                  } else {
                                    setSelectedPickupPointId('');
                                  }
                                  setIsEditingPickupPoint(false);
                                }}
                              >
                                <i className="fas fa-times me-1"></i>
                                {getTranslation('common.cancel', language)}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {!isEditingPickupPoint && currentBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && Array.isArray(currentBookingOption?.pickupPoints) && currentBookingOption.pickupPoints.length > 0 && (
                        <a
                          href="#"
                          className="text-primary text-decoration-none small ms-2"
                          style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}
                          onClick={(e) => {
                            e.preventDefault();
                            // Prefill selected id con la selección actual si existe
                            try {
                              if (bookingDetails?.pickupPoint && Array.isArray(currentBookingOption?.pickupPoints)) {
                                const found = currentBookingOption.pickupPoints.find((p: any) => p?.name === bookingDetails.pickupPoint?.name);
                                if (found?.id != null) {
                                  setSelectedPickupPointId(found.id);
                                } else {
                                  setSelectedPickupPointId('');
                                }
                              } else {
                                setSelectedPickupPointId('');
                              }
                            } catch {}
                            setIsEditingPickupPoint(true);
                          }}
                        >
                          <i className="fas fa-pencil-alt me-1"></i>
                          {getTranslation('common.edit', language)}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Comentario */}
                  <div className="d-flex align-items-start mb-2">
                    <i className="fas fa-comment text-primary me-2 mt-1"></i>
                    <div className="flex-grow-1 d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <span className="small fw-medium d-block mb-2">
                          {language === 'es' ? 'Solicitud especial' : 'Special request'}:
                        </span>
                        {isEditingComment ? (
                          <div>
                            <textarea
                              className="form-control form-control-sm mb-2"
                              rows={3}
                              value={editedComment}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Limitar a 150 caracteres
                                if (value.length <= 150) {
                                  setEditedComment(value);
                                }
                              }}
                              placeholder={language === 'es' ? 'Escribe tu solicitud especial...' : 'Write your special request...'}
                              maxLength={150}
                              style={{ fontSize: '0.875rem' }}
                            />
                            <div className="text-muted small text-end">
                              {editedComment.length}/150 {language === 'es' ? 'caracteres' : 'characters'}
                            </div>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  if (bookingDetails) {
                                    setBookingDetails({
                                      ...bookingDetails,
                                      comment: editedComment.trim() || undefined
                                    });
                                    // Guardar en sessionStorage (usar la misma clave que se usa al cargar)
                                    const updatedDetails = {
                                      ...bookingDetails,
                                      comment: editedComment.trim() || undefined
                                    };
                                    sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updatedDetails));
                                    // También guardar en bookingDetails para compatibilidad
                                    sessionStorage.setItem('bookingDetails', JSON.stringify(updatedDetails));
                                  }
                                  setIsEditingComment(false);
                                }}
                              >
                                <i className="fas fa-check me-1"></i>
                                {getTranslation('common.save', language) || 'Guardar'}
                              </button>
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => {
                                  setEditedComment(bookingDetails?.comment || '');
                                  setIsEditingComment(false);
                                }}
                              >
                                <i className="fas fa-times me-1"></i>
                                {getTranslation('common.cancel', language) || (language === 'es' ? 'Cancelar' : 'Cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {bookingDetails.comment ? (
                              <span className="small text-muted">
                                {bookingDetails.comment}
                              </span>
                            ) : (
                              <span className="small text-muted">
                                {getTranslation('checkout.noComment', language)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isEditingComment && (
                        <a href="#" className="text-primary text-decoration-none small ms-2" style={{ alignSelf: 'flex-start', whiteSpace: 'nowrap', marginTop: '20px' }} onClick={(e) => {
                          e.preventDefault();
                          setEditedComment(bookingDetails?.comment || '');
                          setIsEditingComment(true);
                        }}>
                          <i className="fas fa-pencil-alt me-1"></i>
                          {getTranslation('common.edit', language)}
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Fecha y hora de salida */}
                  <div className="d-flex align-items-start justify-content-between mb-2">
                    <div className="d-flex align-items-start flex-grow-1">
                      <i className="fas fa-calendar-alt text-primary me-2 mt-1"></i>
                      {isEditingDateTime ? (
                        <div className="flex-grow-1">
                          <div className="mb-2">
                            <label className="form-label small fw-medium d-block mb-1">
                              {getTranslation('checkout.departureDate', language)}:
                            </label>
                            <input
                              type="date"
                              className="form-control form-control-sm"
                              value={editedDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => {
                                const newDate = e.target.value;
                                setEditedDate(newDate);
                                // Actualizar horarios disponibles según la nueva fecha
                                const times = getAvailableTimesForDate(newDate);
                                setAvailableTimes(times);
                                // Si hay horarios disponibles y no hay uno seleccionado, seleccionar el primero
                                if (times.length > 0 && !editedTime) {
                                  setEditedTime(times[0]);
                                } else if (times.length > 0 && !times.includes(editedTime)) {
                                  // Si el horario actual no está disponible, seleccionar el primero
                                  setEditedTime(times[0]);
                                } else if (times.length === 0) {
                                  setEditedTime('');
                                }
                              }}
                              style={{ fontSize: '0.875rem' }}
                            />
                          </div>
                          <div className="mb-2">
                            <label className="form-label small fw-medium d-block mb-1">
                              {language === 'es' ? 'Horario de salida' : 'Departure time'}:
                            </label>
                            <select
                              className="form-select form-select-sm"
                              value={editedTime}
                              onChange={(e) => setEditedTime(e.target.value)}
                              disabled={availableTimes.length === 0}
                              style={{ fontSize: '0.875rem' }}
                            >
                              {availableTimes.length === 0 ? (
                                <option value="">{language === 'es' ? 'No hay horarios disponibles para este día' : 'No schedules available for this day'}</option>
                              ) : (
                                availableTimes.map((time) => (
                                  <option key={time} value={time}>
                                    {convertTo12HourFormat(time)}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={async () => {
                                if (!bookingDetails || !editedDate || !editedTime) {
                                  return;
                                }

                                try {
                                  // Llamar a la API con la nueva fecha para obtener precios actualizados
                                  const activity = await activitiesApi.getById(
                                    bookingDetails.activityId,
                                    language,
                                    currency || 'PEN',
                                    editedDate
                                  );

                                  if (activity && activity.bookingOptions && activity.bookingOptions.length > 0) {
                                    const bookingOption = activity.bookingOptions[0];
                                    
                                    // Calcular nuevos precios en base a priceTiers.totalPrice
                                    const totalTravelers = bookingDetails.travelers.adults + bookingDetails.travelers.children;
                                    let matchingTier: any | null = null;
                                    if (bookingOption.priceTiers && bookingOption.priceTiers.length > 0) {
                                      matchingTier = bookingOption.priceTiers.find((tier: any) => {
                                        const min = tier.minParticipants || 1;
                                        const max = tier.maxParticipants || Infinity;
                                        return totalTravelers >= min && totalTravelers <= max;
                                      }) || null;
                                    }

                                    const baseUnitPrice = matchingTier?.totalPrice != null && !isNaN(matchingTier.totalPrice)
                                      ? Number(matchingTier.totalPrice)
                                      : Number(bookingOption.pricePerPerson) || 0;
                                    const currencyResolved = matchingTier?.currency || bookingOption.currency || 'PEN';

                                    const specialOfferPercentage = bookingOption.specialOfferPercentage;
                                    const hasDiscount = specialOfferPercentage != null && specialOfferPercentage > 0;
                                    const originalUnitPrice = Math.ceil(baseUnitPrice);
                                    const finalUnitPrice = hasDiscount
                                      ? Math.ceil(baseUnitPrice - (baseUnitPrice * (specialOfferPercentage! / 100)))
                                      : originalUnitPrice;

                                    // Actualizar bookingDetails con nueva fecha, hora y precios
                                    const updatedDetails: BookingDetails = {
                                      ...bookingDetails,
                                      date: editedDate,
                                      time: editedTime,
                                      currency: currencyResolved,
                                      price: finalUnitPrice,
                                      originalPrice: originalUnitPrice,
                                      hasDiscount: !!hasDiscount,
                                      discountPercentage: hasDiscount ? Number(specialOfferPercentage) : 0
                                    };

                                    setBookingDetails(updatedDetails);
                                    
                                    // Actualizar bookingOption con schedules actualizados
                                    setCurrentBookingOption(bookingOption);

                                    // Guardar en sessionStorage
                                    sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updatedDetails));
                                    sessionStorage.setItem('bookingDetails', JSON.stringify(updatedDetails));

                                    setIsEditingDateTime(false);
                                  } else {
                                    console.error('No se pudo obtener la actividad actualizada');
                                  }
                                } catch (error) {
                                  console.error('Error al actualizar fecha y hora:', error);
                                }
                              }}
                              disabled={!editedDate || !editedTime || availableTimes.length === 0}
                            >
                              <i className="fas fa-check me-1"></i>
                              {getTranslation('common.save', language)}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => {
                                setEditedDate(bookingDetails?.date || '');
                                setEditedTime(bookingDetails?.time || '');
                                setIsEditingDateTime(false);
                              }}
                            >
                              <i className="fas fa-times me-1"></i>
                              {getTranslation('common.cancel', language)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="small">
                          <span className="fw-medium">{getTranslation('checkout.departureDate', language)}: </span>
                          {(() => {
                            const formattedDate = getDepartureDateFormatted();
                            if (formattedDate) {
                              return formattedDate;
                            }
                            // Fallback al formato anterior si hay error
                            return `${new Date(bookingDetails.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}, ${convertTo12HourFormat(bookingDetails.time)}`;
                          })()}
                        </span>
                      )}
                    </div>
                    {!isEditingDateTime && (
                      <a href="#" className="text-primary text-decoration-none small ms-2" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }} onClick={(e) => {
                        e.preventDefault();
                        setEditedDate(bookingDetails?.date || '');
                        setEditedTime(bookingDetails?.time || '');
                        // Obtener horarios disponibles para la fecha actual
                        const times = getAvailableTimesForDate(bookingDetails?.date || '');
                        setAvailableTimes(times);
                        if (times.length > 0 && bookingDetails?.time && times.includes(bookingDetails.time)) {
                          setEditedTime(bookingDetails.time);
                        } else if (times.length > 0) {
                          setEditedTime(times[0]);
                        }
                        setIsEditingDateTime(true);
                      }}>
                        <i className="fas fa-pencil-alt me-1"></i>
                        {getTranslation('common.edit', language)}
                      </a>
                    )}
                  </div>
                  
                  {/* Viajeros */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center flex-grow-1">
                        <i className="fas fa-user text-primary me-2"></i>
                        {!isEditingTravelers ? (
                          <span className="small">
                            {bookingDetails.travelers.adults} {language === 'es' ? 'adulto' : 'adult'} {bookingDetails.travelers.adults > 1 ? (language === 'es' ? 'adultos' : 'adults') : ''}
                            {bookingDetails.travelers.children > 0 && (
                              <> • {bookingDetails.travelers.children} {language === 'es' ? 'niño' : 'child'} {bookingDetails.travelers.children > 1 ? (language === 'es' ? 'niños' : 'children') : ''}</>
                            )}
                          </span>
                        ) : (
                          <div className="d-flex gap-2">
                            <div className="d-flex align-items-center">
                              <label className="small me-2">{language === 'es' ? 'Adultos' : 'Adults'}</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                min={Math.max(1, currentBookingOption?.groupMinSize || 1)}
                                max={currentBookingOption?.groupMaxSize || undefined}
                                value={editedAdults}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value || '0', 10);
                                  setEditedAdults(isNaN(v) ? 1 : v);
                                }}
                              />
                            </div>
                            <div className="d-flex align-items-center">
                              <label className="small me-2">{language === 'es' ? 'Niños' : 'Children'}</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                style={{ width: '80px' }}
                                min={0}
                                max={currentBookingOption?.groupMaxSize || undefined}
                                value={editedChildren}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value || '0', 10);
                                  setEditedChildren(isNaN(v) ? 0 : v);
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {!isEditingTravelers ? (
                        <a href="#" className="text-primary text-decoration-none small ms-2" style={{ alignSelf: 'center', whiteSpace: 'nowrap' }} onClick={(e) => {
                          e.preventDefault();
                          setEditedAdults(bookingDetails.travelers.adults || 1);
                          setEditedChildren(bookingDetails.travelers.children || 0);
                          setIsEditingTravelers(true);
                        }}>
                          <i className="fas fa-pencil-alt me-1"></i>
                          {getTranslation('common.edit', language)}
                        </a>
                      ) : (
                        <div className="d-flex gap-2 ms-2" style={{ alignSelf: 'center' }}>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                              if (!bookingDetails) return;
                              // Validaciones básicas
                              const min = Math.max(1, currentBookingOption?.groupMinSize || 1);
                              const max = currentBookingOption?.groupMaxSize || Infinity;
                              const newAdults = Math.max(min, Math.min(editedAdults || 1, max));
                              const newChildren = Math.max(0, Math.min(editedChildren || 0, max));
                              const newTotal = newAdults + newChildren;

                              // Recalcular precios usando currentBookingOption
                              try {
                                let matchingTier: any | null = null;
                                if (currentBookingOption?.priceTiers && currentBookingOption.priceTiers.length > 0) {
                                  matchingTier = currentBookingOption.priceTiers.find((tier: any) => {
                                    const tmin = tier.minParticipants || 1;
                                    const tmax = tier.maxParticipants || Infinity;
                                    return newTotal >= tmin && newTotal <= tmax;
                                  }) || null;
                                }

                                const baseUnitPrice = matchingTier?.totalPrice != null && !isNaN(matchingTier.totalPrice)
                                  ? Number(matchingTier.totalPrice)
                                  : Number(currentBookingOption?.pricePerPerson) || 0;
                                const resolvedCurrency = matchingTier?.currency || currentBookingOption?.currency || 'PEN';
                                const offer = currentBookingOption?.specialOfferPercentage;
                                const hasDiscount = offer != null && offer > 0;
                                const originalUnitPrice = Math.ceil(baseUnitPrice);
                                const finalUnitPrice = hasDiscount
                                  ? Math.ceil(baseUnitPrice - (baseUnitPrice * (offer / 100)))
                                  : originalUnitPrice;

                                const updatedDetails: BookingDetails = {
                                  ...bookingDetails,
                                  travelers: { adults: newAdults, children: newChildren },
                                  price: finalUnitPrice,
                                  originalPrice: originalUnitPrice,
                                  hasDiscount: !!hasDiscount,
                                  discountPercentage: hasDiscount ? Number(offer) : 0,
                                  currency: resolvedCurrency
                                };
                                setBookingDetails(updatedDetails);
                                sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(updatedDetails));
                                sessionStorage.setItem('bookingDetails', JSON.stringify(updatedDetails));
                              } catch (e) {
                                console.warn('No se pudo recalcular precio al editar pasajeros:', e);
                                setBookingDetails({
                                  ...bookingDetails,
                                  travelers: { adults: newAdults, children: newChildren }
                                });
                              }

                              setIsEditingTravelers(false);
                            }}
                          >
                            <i className="fas fa-check me-1"></i>
                            {getTranslation('common.save', language)}
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setEditedAdults(bookingDetails.travelers.adults || 1);
                              setEditedChildren(bookingDetails.travelers.children || 0);
                              setIsEditingTravelers(false);
                            }}
                          >
                            <i className="fas fa-times me-1"></i>
                            {getTranslation('common.cancel', language)}
                          </button>
                        </div>
                      )}
                    </div>
                    {currentBookingOption?.groupMaxSize && (
                      <div className="small text-muted mt-1">
                        {language === 'es' ? 'Capacidad máx. del grupo: ' : 'Max group size: '}{currentBookingOption.groupMaxSize}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancellation & Quality */}
                <div className="mb-4">
                  {!isCancellationDeadlinePassed() && (
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-check text-success me-2"></i>
                      <span className="small">
                        {getTranslation('checkout.easyCancellation', language)}
                        {(() => {
                          const deadline = getCancellationDeadline();
                          if (deadline) {
                            return (
                              <>
                                {deadline}
                              </>
                            );
                          } else if (bookingDetails?.cancelBefore) {
                            return ` - ${bookingDetails.cancelBefore}`;
                          }
                          return '';
                        })()}
                      </span>
                  </div>
                  )}
                  {activityRating !== null && activityRating !== undefined && typeof activityRating === 'number' && (
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-thumbs-up text-success me-2"></i>
                      <span className="small">{getTranslation('checkout.goodValue', language)} - {getTranslation('checkout.activityReceivedRating', language).replace('{rating}', activityRating.toFixed(1))}</span>
                  </div>
                  )}
                </div>

                {/* Promotional Code */}
                <div className="mb-4">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-gift text-primary me-2"></i>
                    <a href="#" className="text-primary text-decoration-none small">
                      {getTranslation('checkout.promotionalCode', language)}
                    </a>
                  </div>
                </div>

                {/* Total Price */}
                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">{getTranslation('checkout.total', language)}</span>
                    <div className="text-end">
                      {(() => {
                        const { originalTotal, finalTotal } = calculateTotalPrice();
                        const totalTravelers = getTotalTravelers();
                        const safeOriginalTotal = typeof originalTotal === 'number' ? originalTotal : 0;
                        const safeFinalTotal = typeof finalTotal === 'number' ? finalTotal : 0;
                        const ceilFinalPrice = Math.ceil(bookingDetails.price);
                        const showDiscount = !!bookingDetails.hasDiscount && safeOriginalTotal > safeFinalTotal;

                        return (
                          <>
                            {showDiscount && (
                              <div className="text-muted small">
                                {(language === 'es' ? 'Total sin descuento: ' : 'Total without discount: ')}
                                <span className="text-decoration-line-through">
                                  {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{safeOriginalTotal}
                                </span>
                              </div>
                            )}
                            <div className="fw-bold fs-5" style={{ color: showDiscount ? '#dc3545' : 'inherit' }}>
                              {(language === 'es' ? 'Total a pagar' : 'Total to pay')}{showDiscount ? (language === 'es' ? ' con descuento: ' : ' with discount: ') : ': '}
                              {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{safeFinalTotal}
                            </div>
                            {showDiscount && bookingDetails.discountPercentage > 0 && (
                              <div className="text-success small">
                                {(language === 'es' ? 'Descuento aplicado: ' : 'Discount applied: ')}-{bookingDetails.discountPercentage}%
                              </div>
                            )}
                            {totalTravelers > 1 && (
                              <div className="text-muted small mt-1">
                                {(language === 'es' ? 'Unitario' : 'Unit price')}{showDiscount ? (language === 'es' ? ' con descuento' : ' with discount') : ''}: {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{ceilFinalPrice} × {totalTravelers} {getTranslation('checkout.travelers', language) || 'viajeros'}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-muted small">
                    {getTranslation('checkout.allTaxesIncluded', language)}
                  </div>
                  {bookingDetails.hasDiscount && (() => {
                    const { originalTotal, finalTotal } = calculateTotalPrice();
                    const safeOriginalTotal = typeof originalTotal === 'number' ? originalTotal : 0;
                    const safeFinalTotal = typeof finalTotal === 'number' ? finalTotal : 0;
                    // El ahorro se calcula de los totales (que ya vienen de precios unitarios redondeados)
                    const savings = safeOriginalTotal - safeFinalTotal;
                    return (
                    <div className="text-success small mt-2">
                      <i className="fas fa-check me-1"></i>
                        {getTranslation('checkout.saveWithOffer', language)} {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{savings}
                    </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="modal show d-block modal-fade-in" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-fade-in">
              <div className="modal-header border-0 d-flex align-items-between px-4 py-3">
                <div className="d-flex align-items-center justify-content-center w-100">
                  <h4 className="fw-bold mb-0">{getTranslation('checkout.loginModal.title', language)}</h4>
                </div>
                <button
                  type="button"
                  className="btn-close ms-auto"
                  onClick={() => {
                    sessionStorage.setItem('checkoutLoginDismissed', '1');
                    setLoginDismissed(true);
                    setShowLoginModal(false);
                  }}
                ></button>
              </div>
              <div className="modal-body text-center">
                
                <button
                  className="btn btn-primary btn-lg w-100 mb-3"
                  onClick={handleContinueWithoutLogin}
                >
                  {getTranslation('checkout.loginModal.continueWithoutLogin', language)}
                </button>

                <div className="d-flex align-items-center mb-3">
                  <hr className="flex-grow-1" />
                  <span className="mx-3 text-muted small">o</span>
                  <hr className="flex-grow-1" />
                </div>

                <p className="text-muted mb-4">
                  {getTranslation('checkout.loginModal.benefits', language)}
                </p>

                {/* Social Login Buttons */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    className="btn btn-outline-secondary flex-fill"
                    onClick={handleLoginWithGoogle}
                  >
                    <i className="fab fa-google me-2"></i>
                    Google
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-fill"
                    onClick={handleLoginWithApple}
                  >
                    <i className="fab fa-apple me-2"></i>
                    Apple
                  </button>
                  <button
                    className="btn btn-outline-secondary flex-fill"
                    onClick={handleLoginWithFacebook}
                  >
                    <i className="fab fa-facebook me-2"></i>
                    Facebook
                  </button>
                </div>

                {/* Email Login */}
                <div className="mb-3">
                  <input
                    type="email"
                    className="form-control"
                    placeholder={getTranslation('checkout.loginModal.emailPlaceholder', language)}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleEmailLogin}
                  disabled={!formData.email}
                >
                  {getTranslation('checkout.loginModal.continueWithEmail', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
