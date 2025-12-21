import React, { useState, useEffect } from 'react';

// Declaración de tipos para lightGallery
declare global {
  interface Window {
    lightGallery: any;
  }
}
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { activitiesApi } from '../api/activities';
import { specialOfferApi } from '../api/specialOffer';
import { ordersItemApi } from '../api/ordersItem';
import { translationApi } from '../api/traslations';
import type { Activity, BookingOption } from '../api/activities';
import type { ActivityReview } from '../api/activityReviews';
import RatingStars from '../components/RatingStars';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getTranslationWithParams, getLanguageName } from '../utils/translations';
import { useGlobalLoading } from '../hooks/useGlobalLoading';
import { appConfig } from '../config/appConfig';
import { auth } from '../config/firebase';
import { capitalizeWords, capitalizeFirstLetter } from '../utils/helpers';
import { convertLocalDateTimeToUTC } from '../utils/dateUtils';

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency, getCurrencySymbol } = useCurrency();
  const { addItem } = useCart();
  const { isAuthenticated, loginWithGoogle, user, firebaseUser } = useAuth();
  const { withLoading } = useGlobalLoading();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showBookingOptions, setShowBookingOptions] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedMeetingPoints, setSelectedMeetingPoints] = useState<{ [key: string]: string }>({});
  const [hotelSearchResults, setHotelSearchResults] = useState<{ [key: string]: any[] }>({});
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showBookingSection, setShowBookingSection] = useState(false);
  const [showAvailabilitySection, setShowAvailabilitySection] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAllIncludes, setShowAllIncludes] = useState(window.innerWidth >= 768); // Estado para mostrar todos los items de inclusión
  const [showAllNotIncludes, setShowAllNotIncludes] = useState(window.innerWidth >= 768); // Estado para mostrar todos los items de no inclusión
  const [showAllRecommendations, setShowAllRecommendations] = useState(window.innerWidth >= 768); // Estado para mostrar todas las recomendaciones
  const [showAllRestrictions, setShowAllRestrictions] = useState(window.innerWidth >= 768); // Estado para mostrar todas las restricciones
  const [selectedBookingOption, setSelectedBookingOption] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1); // Cantidad de personas para calcular precio
  const [specialOffers, setSpecialOffers] = useState<any[]>([]); // Ofertas especiales
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Estado para loading del carrito
  const [isBooking, setIsBooking] = useState(false); // Estado para loading del botón reservar
  const [showPickupPointsModal, setShowPickupPointsModal] = useState(false); // Estado para modal de pickup points
  const [showPickupPointsPageView, setShowPickupPointsPageView] = useState(false); // Estado para pageview de pickup points (mobile)
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<any | null>(null); // Punto de recogida seleccionado (objeto con name y address)
  const [pickupComment, setPickupComment] = useState<string>(''); // Comentario para el punto de recogida
  const [showLoginModal, setShowLoginModal] = useState(false); // Estado para modal de login
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Estado para loading del login
  const [pendingAction, setPendingAction] = useState<'addToCart' | 'bookNow' | null>(null); // Acción pendiente después del login
  const [reviewsSortBy, setReviewsSortBy] = useState<'recommended' | 'newest' | 'oldest'>('recommended'); // Orden de reseñas
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(2); // Cantidad de reseñas visibles inicialmente
  const [expandedTranslations, setExpandedTranslations] = useState<Record<string, boolean>>({}); // Estado para traducciones de reseñas
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({}); // Estado para ver más/menos en reseñas largas
  const [expandedReplyTranslations, setExpandedReplyTranslations] = useState<Record<string, boolean>>({}); // Estado para traducciones de respuestas del proveedor
  const [expandedReplies, setExpandedReplies] = useState<Record<number, boolean>>({}); // Estado para ver más/menos en respuestas largas
  const [reviewTranslations, setReviewTranslations] = useState<Record<string, string>>({}); // Almacenar traducciones de reseñas
  const [replyTranslations, setReplyTranslations] = useState<Record<string, string>>({}); // Almacenar traducciones de respuestas
  const [translatingReviews, setTranslatingReviews] = useState<Record<string, boolean>>({}); // Loading para traducción de reseñas
  const [translatingReplies, setTranslatingReplies] = useState<Record<string, boolean>>({}); // Loading para traducción de respuestas
  
  // Obtener parámetros desde la URL
  const [searchParams] = useSearchParams();
  
  const [numberOfAdults, setNumberOfAdults] = useState<number>(1); // Cantidad de adultos
  const [numberOfChildren, setNumberOfChildren] = useState<number>(0); // Cantidad de niños
  
  // Fecha de salida (usar fecha actual si no se proporciona)
  const selectedDate = searchParams.get('date') || (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();
  
  // Currency y Lang desde URL (ya están disponibles desde context, pero registramos los de URL)
  const urlCurrency = searchParams.get('currency');
  const urlLang = searchParams.get('lang');


  // Función para obtener el texto completo de la descripción
  const getFullDescription = () => {
    if (!activity?.description) return '';
    if (Array.isArray(activity.description)) {
      return activity.description.join(' ');
    }
    return activity.description;
  };

  // Función para verificar si la descripción necesita truncamiento
  const needsTruncate = () => {
    const fullText = getFullDescription();
    return fullText.length > 200;
  };

  // Función para obtener texto truncado
  const getTruncatedDescription = () => {
    const fullText = getFullDescription();
    if (fullText.length <= 200) return fullText;
    return fullText.substring(0, 200) + '...';
  };

  const clampRatingValue = (value: number) => {
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(5, Number(value.toFixed(1))));
  };

  const formatReviewDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Activity Detail: error formatting review date', error);
      return dateString;
    }
  };

  const getAvatarColor = (seed: string) => {
    const palette = ['#FF6B35', '#4A90E2', '#7ED321', '#9B59B6', '#2C3E50', '#F4A261', '#1ABC9C'];
    if (!seed) {
      return palette[0];
    }
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  const getReviewerInitial = (nickname?: string) => {
    if (!nickname || nickname.trim().length === 0) return '?';
    return nickname.trim().charAt(0).toUpperCase();
  };

  const renderStarIcons = (ratingValue: number, size: number = 16) => {
    const normalized = clampRatingValue(ratingValue);
    const fullStars = Math.floor(normalized);
    const decimal = normalized - fullStars;
    const hasHalf = decimal >= 0.25 && decimal < 0.75;
    const shouldRoundUp = decimal >= 0.75 ? 1 : 0;
    const icons: React.ReactNode[] = [];

    for (let i = 0; i < fullStars; i++) {
      icons.push(
        <i
          key={`full-${i}`}
          className="fas fa-star text-warning me-1"
          style={{ fontSize: `${size}px` }}
        ></i>
      );
    }

    if (shouldRoundUp) {
      icons.push(
        <i
          key="rounded"
          className="fas fa-star text-warning me-1"
          style={{ fontSize: `${size}px` }}
        ></i>
      );
    } else if (hasHalf) {
      icons.push(
        <i
          key="half"
          className="fas fa-star-half-alt text-warning me-1"
          style={{ fontSize: `${size}px` }}
        ></i>
      );
    }

    const remaining = 5 - icons.length;
    for (let i = 0; i < remaining; i++) {
      icons.push(
        <i
          key={`empty-${i}`}
          className="far fa-star text-warning me-1"
          style={{ fontSize: `${size}px` }}
        ></i>
      );
    }

    return <div className="d-flex align-items-center flex-wrap">{icons}</div>;
  };

  // Función para traducir una reseña usando la API
  const translateReview = async (reviewId: string, reviewText: string, reviewLang: string) => {
    // Si ya tenemos la traducción, solo alternamos la visualización
    if (reviewTranslations[reviewId]) {
      setExpandedTranslations((prev) => ({
        ...prev,
        [reviewId]: !prev[reviewId]
      }));
      return;
    }

    // Si el idioma de la reseña es el mismo que el idioma actual, no traducir
    if (reviewLang === language) {
      return;
    }

    // Iniciar loading
    setTranslatingReviews((prev) => ({
      ...prev,
      [reviewId]: true
    }));

    try {
      const response = await translationApi.translate({
        text: reviewText,
        lang: language
      });

      if (response.success && response.data.translatedText) {
        // Guardar la traducción
        setReviewTranslations((prev) => ({
          ...prev,
          [reviewId]: response.data.translatedText
        }));
        // Mostrar la traducción
        setExpandedTranslations((prev) => ({
          ...prev,
          [reviewId]: true
        }));
      }
    } catch (error) {
      console.error('Error al traducir reseña:', error);
      alert(language === 'es' 
        ? 'Error al traducir la reseña. Por favor, intenta nuevamente.' 
        : 'Error translating review. Please try again.');
    } finally {
      // Finalizar loading
      setTranslatingReviews((prev) => {
        const updated = { ...prev };
        delete updated[reviewId];
        return updated;
      });
    }
  };

  const toggleReviewTranslation = (reviewId: string) => {
    setExpandedTranslations((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const toggleReviewLength = (reviewId: string) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const toggleReplyLength = (replyId: number) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  // Función para traducir una respuesta del proveedor usando la API
  const translateReply = async (replyId: number, replyText: string, replyLang: string) => {
    // Si ya tenemos la traducción, solo alternamos la visualización
    if (replyTranslations[replyId]) {
      setExpandedReplyTranslations((prev) => ({
        ...prev,
        [replyId]: !prev[replyId]
      }));
      return;
    }

    // Si el idioma de la respuesta es el mismo que el idioma actual, no traducir
    if (replyLang === language) {
      return;
    }

    // Iniciar loading
    setTranslatingReplies((prev) => ({
      ...prev,
      [replyId]: true
    }));

    try {
      const response = await translationApi.translate({
        text: replyText,
        lang: language
      });

      if (response.success && response.data.translatedText) {
        // Guardar la traducción
        setReplyTranslations((prev) => ({
          ...prev,
          [replyId]: response.data.translatedText
        }));
        // Mostrar la traducción
        setExpandedReplyTranslations((prev) => ({
          ...prev,
          [replyId]: true
        }));
      }
    } catch (error) {
      console.error('Error al traducir respuesta:', error);
      alert(language === 'es' 
        ? 'Error al traducir la respuesta. Por favor, intenta nuevamente.' 
        : 'Error translating reply. Please try again.');
    } finally {
      // Finalizar loading
      setTranslatingReplies((prev) => {
        const updated = { ...prev };
        delete updated[replyId];
        return updated;
      });
    }
  };

  const toggleReplyTranslation = (replyId: number) => {
    setExpandedReplyTranslations((prev) => ({
      ...prev,
      [replyId]: !prev[replyId]
    }));
  };

  // Función para hacer scroll a la sección de reserva
  const scrollToBookingOptions = () => {
    // Scroll automático a la sección después de un pequeño delay
    setTimeout(() => {
      const bookingSection = document.getElementById('booking-section');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Función para manejar selección de opción de reserva
  const handleBookingOptionSelect = (option: any) => {
    setSelectedBookingOption(option);
    
    // Resetear punto de recogida y comentario al cambiar de opción
    setSelectedPickupPoint(null);
    setPickupComment('');
    
    // Seleccionar automáticamente el primer idioma disponible si hay múltiples idiomas
    if (option.languages && option.languages.length > 0) {
      setSelectedLanguage(option.languages[0]);
    } else {
      setSelectedLanguage(null);
    }
    
    // Seleccionar automáticamente el primer horario disponible usando schedulesTimes
    const availableTimes = (option.schedulesTimes || []) as string[];
    
    if (availableTimes.length > 0) {
      setSelectedTimeSlot(availableTimes[0]);
    } else {
      // Si no hay horarios disponibles, limpiar la selección
      setSelectedTimeSlot(null);
    }
  };

  // Función para manejar selección de horario
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Función para calcular precio total usando priceAfterDiscount o normalPrice directamente de la API
  const calculateTotalPrice = () => {
    const totalPeople = numberOfAdults + numberOfChildren;
    if (!selectedBookingOption || !selectedTimeSlot) {
      // Si no hay opción seleccionada, usar el precio mínimo de la actividad
      const minOption = getMinPriceFromOptions();
      if (!minOption) return 0;
      const unitPrice = minOption.priceAfterDiscount ?? minOption.normalPrice ?? minOption.unitPrice ?? minOption.pricePerPerson ?? 0;
      return Math.round((unitPrice * totalPeople) * 100) / 100;
    }
    
    // Usar priceAfterDiscount si está disponible (ya incluye el descuento aplicado)
    const unitPrice = selectedBookingOption.priceAfterDiscount ?? selectedBookingOption.normalPrice ?? selectedBookingOption.unitPrice ?? selectedBookingOption.pricePerPerson ?? 0;
    
    return Math.round((unitPrice * totalPeople) * 100) / 100;
  };

  // Función para obtener precio original (antes de descuento) usando normalPrice directamente de la API
  const getOriginalPrice = () => {
    if (!selectedBookingOption) {
      // Si no hay opción seleccionada, usar el precio mínimo de la actividad
      const minOption = getMinPriceFromOptions();
      if (!minOption) return 0;
      const unitPrice = minOption.normalPrice ?? minOption.unitPrice ?? minOption.pricePerPerson ?? 0;
      return Math.round((unitPrice * numberOfPeople) * 100) / 100;
    }
    
    // Usar normalPrice directamente, fallback a unitPrice o pricePerPerson
    const unitPrice = selectedBookingOption.normalPrice ?? selectedBookingOption.unitPrice ?? selectedBookingOption.pricePerPerson ?? 0;
    
    return Math.round((unitPrice * numberOfPeople) * 100) / 100;
  };

  // Función para verificar si hay descuento activo
  const hasActiveDiscount = () => {
    return selectedBookingOption?.specialOfferPercentage && selectedBookingOption.specialOfferPercentage > 0;
  };

  // Función para obtener el porcentaje de descuento
  const getDiscountPercentage = () => {
    return selectedBookingOption?.specialOfferPercentage || 0;
  };

  // Función auxiliar para normalizar el tiempo a formato HH:mm:ss
  const normalizeTimeTo24Hour = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '00:00:00';
    
    // Remover espacios y convertir a mayúsculas
    let cleaned = timeStr.trim().toUpperCase();
    
    // Si ya está en formato 24 horas (HH:mm o HH:mm:ss), retornarlo con segundos
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleaned)) {
      return cleaned.length === 5 ? `${cleaned}:00` : cleaned;
    }
    
    // Si tiene AM/PM, convertir a formato 24 horas
    const amPmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10);
      const minutes = amPmMatch[2];
      const period = amPmMatch[3];
      
      if (period === 'AM') {
        if (hours === 12) hours = 0;
      } else { // PM
        if (hours !== 12) hours += 12;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
    // Si no coincide con ningún formato conocido, intentar parsear como fecha/hora
    try {
      const date = new Date(`2000-01-01 ${cleaned}`);
      if (!isNaN(date.getTime())) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}:00`;
      }
    } catch {
      // Si falla, retornar 00:00:00
    }
    
    return '00:00:00';
  };

  // Función para manejar login con Google
  const handleLoginWithGoogle = async () => {
    try {
      setIsLoggingIn(true);
      const success = await loginWithGoogle();
      
      if (success) {
        console.log('✅ Login con Google exitoso');
        setShowLoginModal(false);
        // La acción pendiente se ejecutará automáticamente cuando isAuthenticated cambie
      } else {
        console.error('❌ Error en login con Google');
        alert(language === 'es' 
          ? 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.'
          : 'Error signing in with Google. Please try again.');
        setPendingAction(null);
      }
    } catch (error: any) {
      console.error('❌ Error en handleLoginWithGoogle:', error);
      
      // Solo mostrar error si no fue cancelado por el usuario
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        alert(language === 'es' 
          ? 'Error al iniciar sesión con Google. Por favor, intenta nuevamente.'
          : 'Error signing in with Google. Please try again.');
      }
      setPendingAction(null);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Función para agregar al carrito (ahora envía directamente a la base de datos)
  const handleAddToCart = async () => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
      setPendingAction('addToCart');
      setShowLoginModal(true);
      return;
    }

    if (!activity || !selectedBookingOption || !selectedTimeSlot || !selectedDate) {
      return;
    }

    setIsAddingToCart(true);

    try {
      // Obtener el punto de encuentro seleccionado
      let meetingPointName = selectedBookingOption?.meetingPointAddress || 
                          'Punto de encuentro por confirmar';
      let meetingPointAddress = '';
      let meetingPickupPlaceId: number | null = null;
      let meetingPickupPointLatitude: number | null = null;
      let meetingPickupPointLongitude: number | null = null;
      
      // Si hay un punto de recogida seleccionado, usarlo
      if (selectedPickupPoint) {
        meetingPointName = selectedPickupPoint.name || selectedPickupPoint.address;
        meetingPointAddress = selectedPickupPoint.address || '';
        meetingPickupPlaceId = selectedPickupPoint.city?.id ?? null;
        meetingPickupPointLatitude = selectedPickupPoint.latitude ?? null;
        meetingPickupPointLongitude = selectedPickupPoint.longitude ?? null;
      } else if ((selectedBookingOption.meetingType || '').toLowerCase() === 'meeting_point') {
        meetingPointName = selectedBookingOption.meetingPointAddress || selectedBookingOption.meetingPointDescription?.[0] || meetingPointName;
        meetingPointAddress = selectedBookingOption.meetingPointAddress || '';
        meetingPickupPlaceId = selectedBookingOption.meetingPointId ?? null;
        meetingPickupPointLatitude = selectedBookingOption.meetingPointLatitude ?? null;
        meetingPickupPointLongitude = selectedBookingOption.meetingPointLongitude ?? null;
      }

      // Obtener el código del idioma del guía (ej: es, en, fr)
      const languageCode = selectedLanguage || 
                           (selectedBookingOption.languages && selectedBookingOption.languages.length === 1 ? 
                            selectedBookingOption.languages[0] : 'es');
      const guideLanguage = languageCode || 'es';

      // Calcular precio por persona (considerando descuentos)
      const unitPrice = selectedBookingOption.priceAfterDiscount ?? selectedBookingOption.normalPrice ?? selectedBookingOption.unitPrice ?? selectedBookingOption.pricePerPerson ?? 0;
      const pricePerParticipant = Math.ceil(unitPrice);

      // Construir startDatetime en formato UTC: YYYY-MM-DDTHH:mm:ss
      const normalizedTime = normalizeTimeTo24Hour(selectedTimeSlot);
      const timeZone = (selectedBookingOption as any)?.timeZone || 'America/Lima';
      const startDatetimeUTC = convertLocalDateTimeToUTC(`${selectedDate}T${normalizedTime}`, timeZone);
     
      // Validar moneda
      const orderCurrency = (currency === 'USD' || currency === 'PEN' || currency === 'EUR') 
        ? (currency as 'USD' | 'PEN') 
        : 'USD';

      // Preparar el request para enviar a la base de datos
      const orderItemRequest = {
        activityId: activity.id,
        bookingOptionId: selectedBookingOption.id,
        currency: orderCurrency,
        adults: numberOfAdults,
        children: numberOfChildren,
        pricePerParticipant,
        startDatetime: startDatetimeUTC,
        specialRequest: pickupComment || null,
        meetingPickupPlaceId,
        meetingPickupPointName: meetingPointName || null,
        meetingPickupPointAddress: meetingPointAddress || null,
        meetingPickupPointLatitude,
        meetingPickupPointLongitude,
        guideLanguage: guideLanguage || null,
        status: 'PENDING' as const,
      };

      // Enviar a la base de datos usando ordersItemApi
      const response = await ordersItemApi.addOrderItem(orderItemRequest);

      if (response?.success) {
        // Emitir evento para actualizar el contador del carrito en el Navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Mostrar mensaje de éxito
        alert(getTranslation('detail.booking.itemAddedToCart', language) || 
              (language === 'es' ? 'Actividad agregada al carrito exitosamente' : 'Activity added to cart successfully'));
        
        // Navegar a la página del carrito
        navigate('/cart');
      } else {
        // Mostrar mensaje de error
        alert(response?.message || 
              (language === 'es' ? 'Error al agregar la actividad al carrito' : 'Error adding activity to cart'));
      }

    } catch (error: any) {
      console.error('Error al agregar item a la orden:', error);
      // Mostrar mensaje de error
      const errorMessage = error?.message || 
                          (language === 'es' 
                            ? 'Error al agregar la actividad al carrito. Por favor, inténtalo nuevamente.' 
                            : 'Error adding activity to cart. Please try again.');
      alert(errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Función para ir directamente al checkout (agrega al carrito y redirige)
  const handleBookNow = async () => {
    // Verificar si el usuario está autenticado
    if (!isAuthenticated) {
      setPendingAction('bookNow');
      setShowLoginModal(true);
      return;
    }

    if (!activity || !selectedBookingOption || !selectedTimeSlot || !selectedDate) {
      return;
    }

    setIsBooking(true);

    try {
      // Obtener el punto de encuentro seleccionado (igual que handleAddToCart)
      let meetingPointName = selectedBookingOption?.meetingPointAddress || 
                          'Punto de encuentro por confirmar';
      let meetingPointAddress = '';
      let meetingPickupPlaceId: number | null = null;
      let meetingPickupPointLatitude: number | null = null;
      let meetingPickupPointLongitude: number | null = null;
      
      // Si hay un punto de recogida seleccionado, usarlo
      if (selectedPickupPoint) {
        meetingPointName = selectedPickupPoint.name || selectedPickupPoint.address;
        meetingPointAddress = selectedPickupPoint.address || '';
        meetingPickupPlaceId = selectedPickupPoint.city?.id ?? null;
        meetingPickupPointLatitude = selectedPickupPoint.latitude ?? null;
        meetingPickupPointLongitude = selectedPickupPoint.longitude ?? null;
      } else if ((selectedBookingOption.meetingType || '').toLowerCase() === 'meeting_point') {
        meetingPointName = selectedBookingOption.meetingPointAddress || selectedBookingOption.meetingPointDescription?.[0] || meetingPointName;
        meetingPointAddress = selectedBookingOption.meetingPointAddress || '';
        meetingPickupPlaceId = selectedBookingOption.meetingPointId ?? null;
        meetingPickupPointLatitude = selectedBookingOption.meetingPointLatitude ?? null;
        meetingPickupPointLongitude = selectedBookingOption.meetingPointLongitude ?? null;
      }

      // Obtener el código del idioma del guía (ej: es, en, fr)
      const languageCode = selectedLanguage || 
                           (selectedBookingOption.languages && selectedBookingOption.languages.length === 1 ? 
                            selectedBookingOption.languages[0] : 'es');
      const guideLanguage = languageCode || 'es';

      // Calcular precio por persona (considerando descuentos)
      const unitPrice = selectedBookingOption.priceAfterDiscount ?? selectedBookingOption.normalPrice ?? selectedBookingOption.unitPrice ?? selectedBookingOption.pricePerPerson ?? 0;
      const pricePerParticipant = Math.ceil(unitPrice);

      // Construir startDatetime en formato UTC: YYYY-MM-DDTHH:mm:ss
      const normalizedTime = normalizeTimeTo24Hour(selectedTimeSlot);
      const timeZone = (selectedBookingOption as any)?.timeZone;
      const startDatetimeUTC = convertLocalDateTimeToUTC(`${selectedDate}T${normalizedTime}`, timeZone);
      
      // Validar moneda
      const orderCurrency = (currency === 'USD' || currency === 'PEN' || currency === 'EUR') 
        ? (currency as 'USD' | 'PEN') 
        : 'USD';

      // Preparar el request para enviar a la base de datos (igual que handleAddToCart)
      const orderItemRequest = {
        activityId: activity.id,
        bookingOptionId: selectedBookingOption.id,
        currency: orderCurrency,
        adults: numberOfAdults,
        children: numberOfChildren,
        pricePerParticipant,
        startDatetime: startDatetimeUTC,
        specialRequest: pickupComment || null,
        meetingPickupPlaceId,
        meetingPickupPointName: meetingPointName || null,
        meetingPickupPointAddress: meetingPointAddress || null,
        meetingPickupPointLatitude,
        meetingPickupPointLongitude,
        guideLanguage: guideLanguage || null,
        status: 'PENDING' as const,
      };

      // Obtener token de Firebase
      let firebaseToken: string | null = null;
      try {
        if (auth.currentUser) {
          firebaseToken = await auth.currentUser.getIdToken();
        }
      } catch (error) {
        console.error('Error al obtener token Firebase:', error);
      }

      // Mostrar token y request en consola
      console.log('🔐 Firebase Token:', firebaseToken ? `${firebaseToken.substring(0, 20)}...` : 'No disponible');
      console.log('🛒 Request para reservar ahora:', JSON.stringify(orderItemRequest, null, 2));
      console.log('🛒 Request (objeto):', orderItemRequest);

      // Enviar a la base de datos usando ordersItemApi (igual que handleAddToCart)
      const response = await ordersItemApi.addOrderItem(orderItemRequest);

      if (response?.success) {
        // Emitir evento para actualizar el contador del carrito en el Navbar
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Redirigir directamente al checkout
        navigate('/checkout');
      } else {
        // Mostrar mensaje de error
        alert(response?.message || 
              (language === 'es' ? 'Error al crear la reserva' : 'Error creating reservation'));
      }

    } catch (error: any) {
      console.error('Error al crear reserva:', error);
      // Mostrar mensaje de error
      const errorMessage = error?.message || 
                          (language === 'es' 
                            ? 'Error al crear la reserva. Por favor, inténtalo nuevamente.' 
                            : 'Error creating reservation. Please try again.');
      alert(errorMessage);
    } finally {
      setIsBooking(false);
    }
  };

  // Función para parsear fecha en timezone local (America/Lima)
  const parseLocalDate = (dateString: string): Date => {
    // dateString formato: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    // Crear fecha en timezone local a las 12:00 PM para evitar cambios de día
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  // Función para obtener horarios usando schedulesTimes directamente de la API
  const getSchedulesForSelectedDate = (): string[] => {
    // Retornar schedulesTimes directamente, la API ya filtra por fecha y día
    return (selectedBookingOption?.schedulesTimes || []) as string[];
  };

  // Función para convertir día de JavaScript (0=Domingo) a sistema personalizado (0=Lunes)
  const convertToCustomDayOfWeek = (jsDayOfWeek: number): number => {
    // JavaScript: 0=Domingo, 1=Lunes, ..., 6=Sábado
    // Sistema personalizado: 0=Lunes, 1=Martes, ..., 6=Domingo
    return jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;
  };

  // Función para obtener el nombre del día según el idioma
  // Mapeo personalizado: Lunes=0, Martes=1, Miércoles=2, Jueves=3, Viernes=4, Sábado=5, Domingo=6
  const getDayName = (dayOfWeek: number) => {
    const daysES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const daysEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    const days = language === 'es' ? daysES : daysEN;
    return days[dayOfWeek] || 'Unknown';
  };
  
  // Función helper para obtener el día personalizado desde una fecha
  const getCustomDayOfWeekFromDate = (dateString: string): number => {
    const date = parseLocalDate(dateString); // Usar parseLocalDate para evitar problemas de timezone
    const jsDayOfWeek = date.getDay();
    return convertToCustomDayOfWeek(jsDayOfWeek);
  };


  // Función para manejar selección de idioma (único)
  const handleLanguageSelection = (lang: string) => {
    setSelectedLanguage(prev => prev === lang ? null : lang);
  };

  // Función para calcular la fecha límite de cancelación basada en beforeCancel
  const getCancellationDeadline = (): string | null => {
    // Verificar que tenemos los datos necesarios
    if (!selectedBookingOption || !selectedDate || !selectedTimeSlot) {
      return null;
    }

    // Obtener cancelBeforeMinutes del bookingOption
    const cancelBeforeMinutes = selectedBookingOption.cancelBeforeMinutes;
    
    // Si tenemos cancelBeforeMinutes, calcular desde fecha/hora de salida
    if (cancelBeforeMinutes !== undefined && cancelBeforeMinutes !== null && cancelBeforeMinutes > 0) {
      try {
        // Parsear fecha de salida
        const [year, month, day] = selectedDate.split('-').map(Number);
        
        // Parsear hora de salida
        const timeParts = selectedTimeSlot.split(':');
        const hours = timeParts[0] ? parseInt(timeParts[0], 10) : 0;
        const minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;
        
        // Crear fecha y hora de salida
        const departureDate = new Date(year, month - 1, day, hours, minutes, 0);
        const cancellationDeadline = new Date(departureDate.getTime() - (cancelBeforeMinutes * 60 * 1000));
        
        // Verificar que la fecha es válida
        if (isNaN(cancellationDeadline.getTime())) {
          // Si la fecha de cancelación es inválida, retornar null
          return null;
        }
        
        // Verificar si la fecha límite de cancelación es menor que hoy
        const now = new Date();
        if (cancellationDeadline < now) {
          // Si la fecha límite ya pasó, no mostrar
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
          return result;
        } else {
          const dateStr = cancellationDeadline.toLocaleDateString('en-US', dateOptions);
          const timeStr = cancellationDeadline.toLocaleTimeString('en-US', timeOptions);
          const result = `${dateStr} at ${timeStr}`;
          return result;
        }
      } catch (error) {
        // Si hay error al calcular fecha límite de cancelación, retornar null
        return null;
      }
    }

    return null;
  };

  // Función para manejar selección de punto de encuentro
  const handleMeetingPointSelection = (optionTitle: string, meetingPoint: string) => {
    setSelectedMeetingPoints(prev => ({
      ...prev,
      [optionTitle]: meetingPoint
    }));
  };

  // Función para manejar búsqueda de hotel
  const handleHotelSearch = (optionTitle: string, searchTerm: string) => {
    // Aquí se implementaría la integración con Google Maps API
    // Por ahora simulamos resultados
    const mockResults = [
      { name: 'Hotel Plaza Mayor', address: 'Plaza Mayor, Lima' },
      { name: 'Hotel Miraflores', address: 'Av. Arequipa, Miraflores' },
      { name: 'Hotel San Isidro', address: 'Av. Javier Prado, San Isidro' }
    ].filter(hotel => 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setHotelSearchResults(prev => ({
      ...prev,
      [optionTitle]: mockResults
    }));
  };

  // Función para cargar ofertas especiales
  const loadSpecialOffers = async () => {
    if (!id) return;
    
    try {
      const response = await specialOfferApi.getList({
        activityId: id,
        isActive: true,
        lang: language
      });
      
      if (response.success && response.data) {
        setSpecialOffers(response.data);
      }
    } catch (error) {
      // Si hay error al cargar ofertas especiales, continuar sin ellas
    }
  };

  // Función para aplicar ofertas especiales a las opciones de reserva
  const applySpecialOffersToBookingOptions = (bookingOptions: any[]) => {
    if (!specialOffers.length) return bookingOptions;
    
    return bookingOptions.map(option => {
      // Buscar oferta especial para esta opción de reserva
      const matchingOffer = specialOffers.find(offer => 
        offer.bookingOptionId === option.id && 
        offer.isActive &&
        new Date(offer.fromDate) <= new Date() &&
        new Date(offer.toDate) >= new Date()
      );
      
      if (matchingOffer) {
        // Aplicar oferta especial a la opción de reserva
        return {
          ...option,
          specialOfferPercentage: matchingOffer.discountPercent
        };
      }
      
      return option;
    });
  };

  // Función para obtener precio por persona usando priceAfterDiscount o normalPrice directamente de la API
  const getMinPriceForPeople = (peopleCount: number) => {
    if (!activity?.bookingOptions || activity.bookingOptions.length === 0) return { price: null, currency: 'USD', originalPrice: null, hasDiscount: false, discountPercent: 0 };
    
    const activeOptions = activity.bookingOptions.filter(option => option.isActive);
    if (activeOptions.length === 0) return { price: null, currency: 'USD', originalPrice: null, hasDiscount: false, discountPercent: 0 };
    
    let minPrice = Infinity;
    let minCurrency = 'USD';
    let minOriginalPrice = Infinity;
    let hasDiscount = false;
    let discountPercent = 0;
    
    activeOptions.forEach(option => {
      // Usar priceAfterDiscount si está disponible, si no usar normalPrice, fallback a pricePerPerson
      const optionMinPrice = option.priceAfterDiscount ?? option.normalPrice ?? option.pricePerPerson ?? 0;
      const optionOriginalPrice = option.normalPrice ?? option.pricePerPerson ?? 0;
      const optionHasDiscount = (option.specialOfferPercentage ?? 0) > 0;
      const optionDiscountPercent = option.specialOfferPercentage ?? 0;
      
      // Comparar con el precio mínimo actual
      if (optionMinPrice < minPrice) {
        minPrice = optionMinPrice;
        minOriginalPrice = optionOriginalPrice;
        minCurrency = option.currency;
        hasDiscount = optionHasDiscount;
        discountPercent = optionDiscountPercent;
      }
    });
    
    return { 
      price: minPrice === Infinity ? null : Math.round((minPrice * peopleCount) * 100) / 100,
      originalPrice: minOriginalPrice === Infinity ? null : Math.round((minOriginalPrice * peopleCount) * 100) / 100,
      currency: minCurrency,
      hasDiscount,
      discountPercent
    };
  };

  // Función para obtener el mínimo de participantes para el precio mínimo
  const getMinParticipantsForMinPrice = (): number | null => {
    if (!activity?.bookingOptions || activity.bookingOptions.length === 0) return null;
    
    const activeOptions = activity.bookingOptions.filter(option => option.isActive);
    if (activeOptions.length === 0) return null;
    
    let minPrice = Infinity;
    let minParticipants = Infinity;
    
    activeOptions.forEach(option => {
      // Usar priceAfterDiscount si está disponible, si no usar normalPrice, fallback a pricePerPerson
      const optionPrice = option.priceAfterDiscount ?? option.normalPrice ?? option.pricePerPerson ?? 0;
      const optionMinParticipants = option.groupMinSize ?? 1;
      
      // Comparar con el precio mínimo actual
      if (optionPrice < minPrice) {
        minPrice = optionPrice;
        minParticipants = optionMinParticipants;
      } else if (optionPrice === minPrice && optionMinParticipants < minParticipants) {
        // Si el precio es igual, tomar el menor número de participantes
        minParticipants = optionMinParticipants;
      }
    });
    
    return minParticipants === Infinity ? null : minParticipants;
  };

  // Función auxiliar para obtener el precio mínimo de todas las opciones activas usando directamente los campos
  const getMinPriceFromOptions = () => {
    if (!activity?.bookingOptions || activity.bookingOptions.length === 0) {
      return null;
    }
    
    const activeOptions = activity.bookingOptions.filter(option => option.isActive);
    if (activeOptions.length === 0) {
      return null;
    }
    
    // Encontrar la opción con el precio mínimo
    let minOption = activeOptions[0];
    let minPrice = minOption.priceAfterDiscount ?? minOption.normalPrice ?? minOption.unitPrice ?? minOption.pricePerPerson ?? Infinity;
    
    activeOptions.forEach(option => {
      const optionPrice = option.priceAfterDiscount ?? option.normalPrice ?? option.unitPrice ?? option.pricePerPerson ?? Infinity;
      if (optionPrice < minPrice) {
        minPrice = optionPrice;
        minOption = option;
      }
    });
    
    return minOption;
  };

  // Inicializar lightGallery cuando las imágenes estén disponibles
  useEffect(() => {
    if (activity?.images && activity.images.length > 0) {
      const galleryElement = document.getElementById('activity-gallery');
      if (galleryElement && window.lightGallery) {
        // Destruir galería anterior si existe
        const existingGallery = galleryElement.querySelector('.lg-backdrop');
        if (existingGallery) {
          existingGallery.remove();
        }
        
        // Inicializar nueva galería con transición fade
        window.lightGallery(galleryElement, {
          mode: 'lg-fade',
          speed: 500,
          easing: 'ease-in-out'
        });
      }
    }
  }, [activity]);

  

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      try {
        await withLoading(async () => {
          setError(null);
          // Obtener fecha de salida desde la URL (si existe)
          const departureDate = searchParams.get('date') || undefined;
          // Obtener datos de la actividad desde la API
          const activityData = await activitiesApi.getById(id, language, currency, departureDate);
          
          // Cargar ofertas especiales
          await loadSpecialOffers();
          
          // Aplicar ofertas especiales a las opciones de reserva
          if (activityData?.bookingOptions) {
            activityData.bookingOptions = applySpecialOffersToBookingOptions(activityData.bookingOptions);
          }
          
          setActivity(activityData);
          
          // Inicializar automáticamente las opciones de reserva
          if (activityData?.bookingOptions && activityData.bookingOptions.length > 0) {
            setShowBookingSection(true);
            const firstOption = activityData.bookingOptions[0];
            setSelectedBookingOption(firstOption);
            
            // Seleccionar automáticamente el primer idioma disponible
            if (firstOption.languages && firstOption.languages.length > 0) {
              setSelectedLanguage(firstOption.languages[0]);
            }
            
            // Seleccionar automáticamente el primer horario disponible usando schedulesTimes
            const availableTimes = (firstOption.schedulesTimes || []) as string[];
            
            if (availableTimes.length > 0) {
              // Usar el primer horario disponible
              setSelectedTimeSlot(availableTimes[0]);
            }
          }
        }, 'activity-detail');
      } catch (err) {
        // Si hay error al obtener la actividad, mostrar mensaje de error
        setError(err instanceof Error ? err.message : 'Error al cargar la actividad');
      }
    };

    fetchActivity();
  }, [id, language, currency, selectedDate, withLoading]);

  // useEffect para recargar ofertas especiales cuando cambien las dependencias
  useEffect(() => {
    if (id && language) {
      loadSpecialOffers();
    }
  }, [id, language]);

  // useEffect para detectar scroll y ocultar/mostrar sección de disponibilidad
  useEffect(() => {
    const handleScroll = () => {
      const bookingSection = document.getElementById('booking-section');
      if (bookingSection) {
        const rect = bookingSection.getBoundingClientRect();
        // Verificar si la sección de reserva está visible en la pantalla (con margen de 100px)
        const isInView = rect.top <= 100 && rect.bottom >= 100;
        // Mostrar/ocultar sección de disponibilidad según si la sección de reserva está visible
        setShowAvailabilitySection(!isInView);
      }
    };

    // Ejecutar inmediatamente para establecer el estado inicial
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showBookingSection]);

  // useEffect para escuchar eventos del menú móvil del navbar
  useEffect(() => {
    const handleMobileMenuToggle = (event: CustomEvent) => {
      const { isOpen } = event.detail;
      // Actualizar estado del menú móvil cuando cambie
      setIsMobileMenuOpen(isOpen);
    };

    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
    return () => window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
  }, []); // Dependencia agregada para ejecutar cuando cambie showBookingSection

  // useEffect para ajustar estados de expansión según el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setShowAllIncludes(isDesktop);
      setShowAllNotIncludes(isDesktop);
      setShowAllRecommendations(isDesktop);
      setShowAllRestrictions(isDesktop);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // useEffect para inicializar número de adultos y niños desde URL
  useEffect(() => {
    const adults = searchParams.get('adults');
    const children = searchParams.get('children');
    
    const adultCount = adults ? parseInt(adults) : 1;
    const childrenCount = children ? parseInt(children) : 0;
    
    setNumberOfAdults(adultCount);
    setNumberOfChildren(childrenCount);
    setNumberOfPeople(adultCount + childrenCount); // Actualizar numberOfPeople con la suma
  }, [searchParams]);

  // Reiniciar la cantidad visible de reseñas cuando cambia el orden o la actividad
  useEffect(() => {
    setVisibleReviewsCount(2);
    setExpandedTranslations({});
    setExpandedReviews({});
    setExpandedReplyTranslations({});
    setExpandedReplies({});
    setReviewTranslations({});
    setReplyTranslations({});
    setTranslatingReviews({});
    setTranslatingReplies({});
  }, [reviewsSortBy, activity?.id, language]);

  // useEffect para ejecutar acción pendiente cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && pendingAction && !showLoginModal) {
      // Ejecutar la acción pendiente después de un pequeño delay para asegurar que el estado esté actualizado
      setTimeout(() => {
        if (pendingAction === 'addToCart') {
          handleAddToCart();
        } else if (pendingAction === 'bookNow') {
          handleBookNow();
        }
        setPendingAction(null);
      }, 100);
    }
  }, [isAuthenticated, pendingAction, showLoginModal]);

  if (error) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            {getTranslation('common.back', language)}
          </button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <h2>{getTranslation('detail.notFound', language)}</h2>
          <p>ID: {id}</p>
          <p>Language: {language}</p>
          <p>Currency: {currency}</p>
          <p>Error: {error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            {getTranslation('common.back', language)}
          </button>
        </div>
      </div>
    );
  }

  const activityReviews: ActivityReview[] = Array.isArray(activity.reviews) ? activity.reviews : [];
  const totalReviews = activity.commentsCount ?? activityReviews.length;
  const fallbackAverageRating = activityReviews.length
    ? activityReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / activityReviews.length
    : 0;
  const averageRatingValue =
    activity.rating && activity.rating > 0
      ? Number(activity.rating.toFixed(1))
      : Number(fallbackAverageRating.toFixed(1));
  const normalizedAverageRating = clampRatingValue(
    Number.isNaN(averageRatingValue) ? 0 : averageRatingValue
  );
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = activityReviews.filter(
      (review) => Math.round(review.rating || 0) === star
    ).length;
    return {
      star,
      count,
      percentage: activityReviews.length ? (count / activityReviews.length) * 100 : 0
    };
  });
  const sortedReviews = (() => {
    const base = [...activityReviews];
    switch (reviewsSortBy) {
      case 'newest':
        return base.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return base.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      default:
        return base.sort((a, b) => {
          if (b.rating !== a.rating) {
            return b.rating - a.rating;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }
  })();
  const displayedReviews = sortedReviews.slice(
    0,
    Math.min(visibleReviewsCount, sortedReviews.length)
  );
  const hasMoreReviews = visibleReviewsCount < sortedReviews.length;

  return (
    <div className="min-vh-100 bg-light">
      {/* Estilos personalizados para la barra flotante móvil */}
      <style>{`
        @media (max-width: 767.98px) {
          .activity-detail-content {
            padding-bottom: 100px !important;
          }
        }
      `}</style>
      <div className="container py-5 activity-detail-content">
        {/* Title and Rating Section */}
        <div className="row mb-4">
          <div className="col-lg-12">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div className="flex-grow-1">
                <h1 className="h2 fw-bold text-dark mb-2 font-inter" style={{ 
                   color: '#1a365d',
                   fontWeight: 800
                 }}>{activity.title}</h1>
                <div 
                  className="mb-2"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    const reviewsSection = document.getElementById('reviews-section');
                    if (reviewsSection) {
                      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                >
                  <RatingStars
                    rating={activity.rating}
                    commentsCount={activity.commentsCount}
                    starSize={20}
                  />
                </div>
                {/* Información del proveedor */}
                {activity.supplier && (
                  <div className="d-flex align-items-center mb-2">
                    <span className="fw-medium text-dark me-2" style={{ fontSize: '0.875rem' }}>
                      {getTranslation('detail.booking.provider', language)}: {capitalizeWords(activity.supplier.name)}
                    </span>
                    {activity.supplier.isVerified && (
                      <span className="badge fw-semibold" style={{ fontSize: '0.7rem', backgroundColor: '#191970', color: '#fff', lineHeight: 1, padding: '0.25rem 0.4rem', display: 'inline-flex', alignItems: 'center' }}>
                        <i className="fas fa-check-circle me-1"></i>
                        {getTranslation('home.activities.verifiedProvider', language)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
         {/* Image Gallery Section */}
         {activity.images && activity.images.length > 0 && (
           <div className="row mb-5">
              <div className="col-12">
                              <div id="activity-gallery" className="activity-gallery">
                   {activity.images.map((image, index) => (
                  <a
                    key={index}
                    href={image.imageUrl}
                    className="gallery-item"
                  >
                    <img
                      src={image.imageUrl}
                      alt={`${activity.title} - Imagen ${index + 1}`}
                      className="img-fluid rounded"
                    />
                    <div className="image-overlay">
                      <i className="fas fa-expand-alt"></i>
                    </div>
                  </a>
                ))}
               </div>
              </div>
            </div>
         )}


         {/* Contenido Principal */}
         <div className="row">
            <div className={`${showAvailabilitySection ? 'col-lg-8' : 'col-12'}`}>
              {/* Descripción */}
              <div className="card mb-4">
                <div className="card-body">
                  <h4 className="fw-bold mb-3">{getTranslation('detail.description', language)}</h4>
                  
                  {/* Versión móvil con toggle */}
                  <div className="d-block d-md-none">
                    <p className="mb-3">
                      {showFullDescription || !needsTruncate() 
                        ? getFullDescription()
                        : getTruncatedDescription()
                      }
                    </p>
                    {needsTruncate() && (
                      <button 
                        className="btn btn-link text-primary p-0 text-decoration-none fw-medium"
                        onClick={() => setShowFullDescription(!showFullDescription)}
                      >
                        {showFullDescription 
                          ? getTranslation('common.showLess', language) 
                          : getTranslation('common.showMore', language)
                        }
                        <i className={`fas fa-chevron-${showFullDescription ? 'up' : 'down'} ms-1`}></i>
                      </button>
                    )}
                  </div>

                  {/* Versión desktop (sin truncamiento) */}
                  <div className="d-none d-md-block">
                  {Array.isArray(activity.description) ? (
                    activity.description.map((paragraph, index) => (
                      <p key={index} className="mb-3">{paragraph}</p>
                    ))
                  ) : (
                    <p className="mb-3">{activity.description}</p>
                  )}
                  </div>
                </div>
              </div>
              {/* Incluye */}
              {activity.includes && activity.includes.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h4 className="fw-bold mb-3">{getTranslation('detail.includes', language)}</h4>
                    <ul className="list-unstyled">
                      {activity.includes.slice(0, showAllIncludes ? activity.includes.length : 2).map((item, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-check text-success me-2"></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                    {/* Botón Ver más - Solo para móviles */}
                    {activity.includes.length > 2 && (
                      <div className="d-block d-md-none mt-2">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-bold"
                          onClick={() => setShowAllIncludes(!showAllIncludes)}
                          style={{ color: '#dc3545' }}
                        >
                          {showAllIncludes 
                            ? getTranslation('common.showLess', language)
                            : `+${activity.includes.length - 2} ${getTranslation('common.more', language)}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* No incluye */}
              {activity.notIncludes && activity.notIncludes.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h4 className="fw-bold mb-3">{getTranslation('detail.notIncludes', language)}</h4>
                    <ul className="list-unstyled">
                      {activity.notIncludes.slice(0, showAllNotIncludes ? activity.notIncludes.length : 2).map((item, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-times text-danger me-2"></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                    {/* Botón Ver más - Solo para móviles */}
                    {activity.notIncludes.length > 2 && (
                      <div className="d-block d-md-none mt-2">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-bold"
                          onClick={() => setShowAllNotIncludes(!showAllNotIncludes)}
                          style={{ color: '#dc3545' }}
                        >
                          {showAllNotIncludes 
                            ? getTranslation('common.showLess', language)
                            : `+${activity.notIncludes.length - 2} ${getTranslation('common.more', language)}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Recomendaciones */}
              {activity.recommendations && activity.recommendations.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h4 className="fw-bold mb-3">{getTranslation('detail.recommendations', language)}</h4>
                    <ul className="list-unstyled">
                      {activity.recommendations.slice(0, showAllRecommendations ? activity.recommendations.length : 2).map((item, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-lightbulb text-warning me-2"></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                    {/* Botón Ver más - Solo para móviles */}
                    {activity.recommendations.length > 2 && (
                      <div className="d-block d-md-none mt-2">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-bold"
                          onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                          style={{ color: '#dc3545' }}
                        >
                          {showAllRecommendations 
                            ? getTranslation('common.showLess', language)
                            : `+${activity.recommendations.length - 2} ${getTranslation('common.more', language)}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* restrictions */}
              {activity.restrictions && activity.restrictions.length > 0 && (
                <div className="card mb-4">
                  <div className="card-body">
                    <h4 className="fw-bold mb-3">{getTranslation('detail.restrictions', language)}</h4>
                    <ul className="list-unstyled">
                      {activity.restrictions.slice(0, showAllRestrictions ? activity.restrictions.length : 2).map((item, index) => (
                        <li key={index} className="mb-2">
                          <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                          {item}
                        </li>
                      ))}
                    </ul>
                    {/* Botón Ver más - Solo para móviles */}
                    {activity.restrictions.length > 2 && (
                      <div className="d-block d-md-none mt-2">
                        <button
                          className="btn btn-link p-0 text-decoration-none fw-bold"
                          onClick={() => setShowAllRestrictions(!showAllRestrictions)}
                          style={{ color: '#dc3545' }}
                        >
                          {showAllRestrictions 
                            ? getTranslation('common.showLess', language)
                            : `+${activity.restrictions.length - 2} ${getTranslation('common.more', language)}`
                          }
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Sidebar Desktop - Oculto en móvil */}
            {showAvailabilitySection && (
              <div className="col-lg-4 d-none d-md-block">
                {/*Sidebar de Precio y Disponibilidad*/}
                <div className="card">
                 <div className="card-body">
                  {/* Sección de Precio */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        {(() => {
                          const displayOption = selectedBookingOption || getMinPriceFromOptions();
                          if (!displayOption) {
                            return (
                              <div className="h3 fw-bold text-dark mb-0">
                                {getTranslation('detail.booking.contactForPrice', language)}
                              </div>
                            );
                          }
                          
                          const price = displayOption.priceAfterDiscount ?? displayOption.normalPrice ?? displayOption.unitPrice ?? displayOption.pricePerPerson;
                          const originalPrice = displayOption.normalPrice ?? displayOption.unitPrice ?? displayOption.pricePerPerson;
                          const hasDiscount = (displayOption.specialOfferPercentage ?? 0) > 0;
                          const discountPercent = displayOption.specialOfferPercentage ?? 0;
                          const hasMultiplePriceTiers = (displayOption.groupMinSize ?? 1) > 1;
                          const minParticipants = displayOption.groupMinSize ?? null;
                          
                          if (price === null || price === undefined) {
                            return (
                              <div className="h3 fw-bold text-dark mb-0">
                                {getTranslation('detail.booking.contactForPrice', language)}
                              </div>
                            );
                          }
                          
                          return (
                            <>
                              
                              {hasDiscount && (
                               <div className="d-flex flex-start align-items-center">
                                <span className="badge bg-danger">-{Math.round(discountPercent)}%</span>
                                <span className="text-muted text-decoration-line-through m-1" style={{ fontSize: '0.9rem' }}>
                                  {getCurrencySymbol(currency)} {Math.ceil(originalPrice || 0)?.toFixed(2)}
                                </span>
                               </div>
                              )}
                               <div className={`h4 fw-bold mb-0 ${hasDiscount ? 'text-danger' : 'text-dark'}`}>
                                 {getCurrencySymbol(currency)} {Math.ceil(price || 0)?.toFixed(2) || '0.00'}
                               </div>
                             
                              <small className="text-muted" style={{ marginTop: '-4px' }}>{getTranslation('detail.booking.perPerson', language)}</small>
                              
                              {/* Mostrar "a partir de X personas" solo si hay mínimo de participantes */}
                              {hasMultiplePriceTiers && minParticipants !== null && minParticipants !== undefined && (
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                  {getTranslationWithParams('detail.booking.fromParticipants', language, {
                                    count: minParticipants || 0,
                                    plural: minParticipants === 1 
                                      ? getTranslation('detail.booking.participantSingular', language)
                                      : getTranslation('detail.booking.participantPlural', language)
                                  })}
                                </small>
                              )}
                            </>
                          );
                        })()}
                     </div>
                      <button 
                        className="btn btn-primary btn-xs px-4"
                        onClick={scrollToBookingOptions}
                      >
                        {getTranslation('detail.booking.viewAvailability', language)}
                      </button>
                  </div>

                  {/* Línea separadora */}
                  <hr className="my-3" />

                  {/* Política de Reserva */}
                  <div className="d-flex align-items-start">
                    <i className="fas fa-wallet text-muted me-2 mt-1"></i>
                      <div className="small text-muted">
                       {getTranslation('detail.booking.bookNowPayLater', language)}
                       <a href="#" className="text-primary text-decoration-underline ms-1">{getTranslation('detail.booking.readMore', language)}</a>
                     </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sección de reseñas */}
          <div className="row mb-5" id="reviews-section">
            <div className="col-12">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4">
                <div className="mb-3 mb-md-0">
                  <h3 className="fw-bold text-dark mb-1 d-md-none" style={{ fontSize: '1.25rem' }}>
                    {language === 'es' ? 'Valoraciones de viajeros' : 'Traveler reviews'}
                  </h3>
                  <h3 className="fw-bold text-dark mb-1 d-none d-md-block" style={{ fontSize: '1.5rem' }}>
                    {language === 'es' ? 'Valoraciones de viajeros' : 'Traveler reviews'}
                  </h3>
                  <p className="text-muted mb-0 d-md-none" style={{ fontSize: '0.875rem' }}>
                    {language === 'es'
                      ? 'Descubre lo que dicen quienes ya vivieron esta experiencia.'
                      : 'See what other travelers are saying about this activity.'}
                  </p>
                  <p className="text-muted mb-0 d-none d-md-block">
                    {language === 'es'
                      ? 'Descubre lo que dicen quienes ya vivieron esta experiencia.'
                      : 'See what other travelers are saying about this activity.'}
                  </p>
                </div>
              </div>

              {totalReviews === 0 ? (
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center py-5">
                    <i className="far fa-comments text-muted mb-3" style={{ fontSize: '2.5rem' }}></i>
                    <p className="fw-semibold text-dark mb-2">
                      {language === 'es'
                        ? 'Aún no hay comentarios para esta actividad.'
                        : 'There are no reviews for this activity yet.'}
                    </p>
                    <p className="text-muted mb-0">
                      {language === 'es'
                        ? 'Reserva y comparte tu experiencia para ayudar a otros viajeros.'
                        : 'Book now and share your experience to help other travelers.'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="card border-0 shadow-sm mb-3 mb-md-4">
                    <div className="card-body p-3 p-md-4">
                      <div className="row g-3 g-md-4">
                        <div className="col-12 col-lg-3 d-flex justify-content-center justify-content-lg-start">
                          <div className="d-flex flex-column justify-content-center align-items-center align-items-lg-start">
                            <div className="display-6 display-md-4 fw-bold text-primary mb-2">
                              {normalizedAverageRating.toFixed(1)}
                            </div>
                            <div className="mb-2">{renderStarIcons(normalizedAverageRating, 16)}</div>
                            <div className="text-muted mb-0 text-center text-lg-start" style={{ fontSize: '0.875rem' }}>
                              {language === 'es'
                                ? `Basada en ${totalReviews} ${totalReviews === 1 ? 'opinión' : 'opiniones'}`
                                : `Based on ${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}`}
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-lg-9">
                        
                            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 gap-md-3 mb-3 mb-md-4">
                              <div className="d-flex align-items-center gap-2 w-100 w-md-auto">
                                <label className="fw-semibold mb-0" style={{ fontSize: '0.875rem' }}>
                                  {language === 'es' ? 'Ordenar por:' : 'Sort by:'}
                                </label>
                                <select
                                  className="form-select form-select-sm flex-grow-1 flex-md-grow-0 w-auto"
                                  value={reviewsSortBy}
                                  onChange={(event) =>
                                    setReviewsSortBy(event.target.value as 'recommended' | 'newest' | 'oldest')
                                  }
                                >
                                  <option value="recommended">
                                    {language === 'es' ? 'Recomendado' : 'Recommended'}
                                  </option>
                                  <option value="newest">
                                    {language === 'es' ? 'Más recientes' : 'Newest'}
                                  </option>
                                  <option value="oldest">
                                    {language === 'es' ? 'Más antiguos' : 'Oldest'}
                                  </option>
                                </select>
                              </div>
                            </div>

                            {displayedReviews.length === 0 ? (
                              <div className="text-center text-muted py-5">
                                <p className="mb-2">
                                  {language === 'es'
                                    ? 'Todavía no podemos mostrar comentarios en tu idioma.'
                                    : 'We cannot display any reviews in your language yet.'}
                                </p>
                                <small>
                                  {language === 'es'
                                    ? 'Intenta cambiar el idioma de la página para ver más opiniones.'
                                    : 'Try switching the site language to see more feedback.'}
                                </small>
                              </div>
                            ) : (
                              <div className="list-group list-group-flush">
                                {displayedReviews.map((review, index) => {
                                  const isCurrentUser = isAuthenticated && firebaseUser?.uid === String(review.issuedBy?.id);
                                  const reviewerName = isCurrentUser
                                    ? (language === 'es' ? 'Tu' : 'You')
                                    : review.issuedBy?.nickname ||
                                      (language === 'es' ? 'Viajero anónimo' : 'Anonymous traveler');
                                  const reviewerLanguage = review.lang
                                    ? getLanguageName(review.lang, language)
                                    : language === 'es'
                                      ? 'Idioma no especificado'
                                      : 'Language not provided';
                                  const isTranslated = Boolean(expandedTranslations[review.id]);
                                  const hasApiTranslation = Boolean(reviewTranslations[review.id]);
                                  const isTranslating = Boolean(translatingReviews[review.id]);
                                  const reviewText =
                                    (isTranslated && hasApiTranslation
                                      ? reviewTranslations[review.id]
                                      : review.comment ||
                                        (language === 'es'
                                          ? 'El viajero no dejó comentarios.'
                                          : 'The traveler did not leave any comments.')) || '';
                                  const showTranslationButton = review.lang && review.lang !== language && review.comment;
                                  const isLast = index === displayedReviews.length - 1;
                                  const normalizedReviewText = reviewText || '';
                                  const isReviewExpanded = Boolean(expandedReviews[review.id]);
                                  const shouldTruncateReview = normalizedReviewText.length > 300;
                                  const displayedReviewText = shouldTruncateReview && !isReviewExpanded
                                    ? `${normalizedReviewText.substring(0, 300)}...`
                                    : normalizedReviewText;

                                  return (
                                    <div key={review.id} className={`py-3 py-md-4 ${isLast ? '' : 'border-bottom'}`}>
                                      <div className="d-flex align-items-start">
                                        <div className="me-2 me-md-3 flex-shrink-0">
                                          {review.issuedBy?.profileImageUrl ? (
                                            <img
                                              src={review.issuedBy.profileImageUrl}
                                              alt={reviewerName}
                                              className="rounded-circle d-md-none"
                                              style={{ 
                                                width: '40px', 
                                                height: '40px', 
                                                objectFit: 'cover'
                                              }}
                                            />
                                          ) : (
                                            <div
                                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold d-md-none"
                                              style={{
                                                width: '40px',
                                                height: '40px',
                                                fontSize: '0.875rem',
                                                backgroundColor: getAvatarColor(review.issuedBy?.nickname || review.id)
                                              }}
                                            >
                                              {getReviewerInitial(review.issuedBy?.nickname)}
                                            </div>
                                          )}
                                          {review.issuedBy?.profileImageUrl ? (
                                            <img
                                              src={review.issuedBy.profileImageUrl}
                                              alt={reviewerName}
                                              className="rounded-circle d-none d-md-block"
                                              style={{ 
                                                width: '48px', 
                                                height: '48px', 
                                                objectFit: 'cover' 
                                              }}
                                            />
                                          ) : (
                                            <div
                                              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold d-none d-md-block"
                                              style={{
                                                width: '48px',
                                                height: '48px',
                                                backgroundColor: getAvatarColor(review.issuedBy?.nickname || review.id)
                                              }}
                                            >
                                              {getReviewerInitial(review.issuedBy?.nickname)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-grow-1 min-w-0">
                                          <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                                            <div className="flex-grow-1 min-w-0">
                                              <div className="d-flex flex-column flex-md-row align-items-md-center flex-wrap gap-1 gap-md-2 mb-2">
                                                <span className="fw-semibold text-dark d-md-none" style={{ fontSize: '0.875rem' }}>{reviewerName}</span>
                                                <span className="fw-semibold text-dark d-none d-md-inline">{reviewerName}</span>
                                                <span className="text-muted d-md-none" style={{ fontSize: '0.75rem' }}> {language === 'es' ? 'de' : 'from'} {capitalizeFirstLetter(review.issuedBy?.country)}</span>
                                                <span className="text-muted d-none d-md-inline"> {language === 'es' ? 'de' : 'from'} {capitalizeFirstLetter(review.issuedBy?.country)}</span>
                                              </div>
                                              <div className="d-flex flex-column flex-md-row align-items-md-center flex-wrap gap-1 gap-md-2">
                                                <div className="d-flex align-items-center gap-1">
                                                  {renderStarIcons(review.rating, 12)}
                                                </div>
                                                <small className="text-muted d-md-none" style={{ fontSize: '0.75rem' }}>{formatReviewDate(review.createdAt)}</small>
                                                <small className="text-muted d-none d-md-inline">{formatReviewDate(review.createdAt)}</small>
                                                <span
                                                  className="badge fw-semibold d-inline-flex align-items-center d-md-none"
                                                  style={{
                                                    backgroundColor: '#191970',
                                                    color: '#fff',
                                                    lineHeight: 1.2,
                                                    padding: '0.2rem 0.35rem',
                                                    fontSize: '0.65rem',
                                                    whiteSpace: 'nowrap'
                                                  }}
                                                >
                                                  {language === 'es' ? 'Comentario verificado por ' : 'Verified comment by '} {capitalizeFirstLetter(appConfig.business.name)}
                                                </span>
                                                <span
                                                  className="badge fw-semibold d-none d-md-inline-flex align-items-center"
                                                  style={{
                                                    backgroundColor: '#191970',
                                                    color: '#fff',
                                                    lineHeight: 1,
                                                    padding: '0.25rem 0.4rem'
                                                  }}
                                                >
                                                  {language === 'es' ? 'Comentario verificado por' : 'Verified comment by'} {capitalizeFirstLetter(appConfig.business.name)}
                                                </span>
                                              </div>
                                            </div>
                                            <button type="button" className="btn btn-link text-muted p-0 flex-shrink-0" style={{ fontSize: '0.875rem' }}>
                                              <i className="fas fa-ellipsis-h"></i>
                                            </button>
                                          </div>
                                          <p className="mt-2 mt-md-3 mb-2 text-dark d-md-none" style={{ whiteSpace: 'pre-line', fontSize: '0.875rem' }}>
                                            {displayedReviewText}
                                          </p>
                                          <p className="mt-2 mt-md-3 mb-2 text-dark d-none d-md-block" style={{ whiteSpace: 'pre-line' }}>
                                            {displayedReviewText}
                                          </p>
                                          {shouldTruncateReview && (
                                            <button
                                              type="button"
                                              className="btn btn-link p-0 fw-semibold"
                                              style={{ fontSize: '0.8rem' }}
                                              onClick={() => toggleReviewLength(review.id)}
                                            >
                                              {isReviewExpanded
                                                ? (language === 'es' ? 'Mostrar menos' : 'Show less')
                                                : (language === 'es' ? 'Mostrar más' : 'Show more')}
                                            </button>
                                          )}

                                          {showTranslationButton && (
                                            <div className="d-flex flex-column flex-md-row align-items-md-center gap-1 gap-md-3 mt-2">
                                              <button
                                                type="button"
                                                className="btn btn-link p-0 fw-semibold text-start text-md-center d-md-none"
                                                onClick={() => {
                                                  if (hasApiTranslation) {
                                                    toggleReviewTranslation(review.id);
                                                  } else {
                                                    translateReview(review.id, review.comment || '', review.lang || '');
                                                  }
                                                }}
                                                disabled={isTranslating}
                                                style={{ fontSize: '0.75rem' }}
                                              >
                                                {isTranslating ? (
                                                  <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    {language === 'es' ? 'Traduciendo...' : 'Translating...'}
                                                  </>
                                                ) : isTranslated ? (
                                                  language === 'es'
                                                    ? 'Ver original'
                                                    : 'Show original'
                                                ) : (
                                                  language === 'es'
                                                    ? 'Traducir'
                                                    : 'Translate'
                                                )}
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-link p-0 fw-semibold d-none d-md-block"
                                                onClick={() => {
                                                  if (hasApiTranslation) {
                                                    toggleReviewTranslation(review.id);
                                                  } else {
                                                    translateReview(review.id, review.comment || '', review.lang || '');
                                                  }
                                                }}
                                                disabled={isTranslating}
                                              >
                                                {isTranslating ? (
                                                  <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    {language === 'es' ? 'Traduciendo...' : 'Translating...'}
                                                  </>
                                                ) : isTranslated ? (
                                                  language === 'es'
                                                    ? 'Ver original'
                                                    : 'Show original'
                                                ) : (
                                                  language === 'es'
                                                    ? 'Traducir'
                                                    : 'Translate'
                                                )}
                                              </button>
                                              <small className="text-muted d-md-none" style={{ fontSize: '0.7rem' }}>
                                                {isTranslated
                                                  ? language === 'es'
                                                    ? 'Traducción automática'
                                                    : 'Automatic translation'
                                                  : language === 'es'
                                                    ? `Escrito en ${reviewerLanguage}`
                                                    : `Written in ${reviewerLanguage}`}
                                              </small>
                                              <small className="text-muted d-none d-md-inline">
                                                {isTranslated
                                                  ? language === 'es'
                                                    ? 'Traducción automática'
                                                    : 'Automatic translation'
                                                  : language === 'es'
                                                    ? `Escrito en ${reviewerLanguage}`
                                                    : `Written in ${reviewerLanguage}`}
                                              </small>
                                            </div>
                                          )}

                                          {/* Respuesta del proveedor */}
                                          {review.reply && (
                                            <div className="mt-3 mt-md-4 pt-3 pt-md-4 border-top">
                                              <div className="d-flex align-items-start">
                                                <div className="me-2 me-md-3 flex-shrink-0">
                                                  {review.reply.provider?.logoUrl ? (
                                                    <>
                                                      <img
                                                        src={review.reply.provider.logoUrl}
                                                        alt={review.reply.provider.name || (language === 'es' ? 'Proveedor' : 'Provider')}
                                                        className="rounded d-md-none"
                                                        style={{
                                                          width: '32px',
                                                          height: '32px',
                                                          objectFit: 'cover'
                                                        }}
                                                      />
                                                      <img
                                                        src={review.reply.provider.logoUrl}
                                                        alt={review.reply.provider.name || (language === 'es' ? 'Proveedor' : 'Provider')}
                                                        className="rounded d-none d-md-block"
                                                        style={{
                                                          width: '40px',
                                                          height: '40px',
                                                          objectFit: 'cover'
                                                        }}
                                                      />
                                                    </>
                                                  ) : (
                                                    <>
                                                      <div
                                                        className="rounded d-flex align-items-center justify-content-center text-white fw-bold d-md-none"
                                                        style={{
                                                          width: '32px',
                                                          height: '32px',
                                                          fontSize: '0.75rem',
                                                          backgroundColor: '#007bff'
                                                        }}
                                                      >
                                                        <i className="fas fa-building"></i>
                                                      </div>
                                                      <div
                                                        className="rounded d-flex align-items-center justify-content-center text-white fw-bold d-none d-md-block"
                                                        style={{
                                                          width: '40px',
                                                          height: '40px',
                                                          backgroundColor: '#007bff'
                                                        }}
                                                      >
                                                        <i className="fas fa-building"></i>
                                                      </div>
                                                    </>
                                                  )}
                                                </div>
                                                <div className="flex-grow-1 min-w-0">
                                                  <div className="d-flex flex-column flex-md-row align-items-md-center flex-wrap gap-1 gap-md-2 mb-2">
                                                    <span className="fw-semibold text-primary d-md-none" style={{ fontSize: '0.875rem' }}>
                                                      {review.reply.provider?.name || (language === 'es' ? 'Proveedor' : 'Provider')}
                                                    </span>
                                                    <span className="fw-semibold text-primary d-none d-md-inline">
                                                      {review.reply.provider?.name || (language === 'es' ? 'Proveedor' : 'Provider')}
                                                    </span>
                                                    <span
                                                      className="badge fw-semibold d-inline-flex align-items-center d-md-none"
                                                      style={{
                                                        backgroundColor: '#28a745',
                                                        color: '#fff',
                                                        lineHeight: 1.2,
                                                        padding: '0.2rem 0.35rem',
                                                        fontSize: '0.65rem',
                                                        whiteSpace: 'nowrap'
                                                      }}
                                                    >
                                                      <i className="fas fa-check-circle me-1"></i>
                                                      {language === 'es' ? 'Respuesta del proveedor' : 'Provider response'}
                                                    </span>
                                                    <span
                                                      className="badge fw-semibold d-none d-md-inline-flex align-items-center"
                                                      style={{
                                                        backgroundColor: '#28a745',
                                                        color: '#fff',
                                                        lineHeight: 1,
                                                        padding: '0.25rem 0.4rem'
                                                      }}
                                                    >
                                                      <i className="fas fa-check-circle me-1"></i>
                                                      {language === 'es' ? 'Respuesta del proveedor' : 'Provider response'}
                                                    </span>
                                                    <small className="text-muted d-md-none" style={{ fontSize: '0.75rem' }}>
                                                      {formatReviewDate(review.reply.createdAt)}
                                                    </small>
                                                    <small className="text-muted d-none d-md-inline">
                                                      {formatReviewDate(review.reply.createdAt)}
                                                    </small>
                                                  </div>
                                                  
                                                  {/* Texto de la respuesta */}
                                                  {(() => {
                                                    if (!review.reply) return null;
                                                    
                                                    const reply = review.reply;
                                                    const isReplyTranslated = Boolean(expandedReplyTranslations[reply.id]);
                                                    const hasApiReplyTranslation = Boolean(replyTranslations[reply.id]);
                                                    const isTranslatingReply = Boolean(translatingReplies[reply.id]);
                                                    const replyText =
                                                      (isReplyTranslated && hasApiReplyTranslation
                                                        ? replyTranslations[reply.id]
                                                        : reply.replyText) || '';
                                                    const showReplyTranslationButton = reply.lang && reply.lang !== language && reply.replyText;
                                                    const replyLanguage = reply.lang
                                                      ? getLanguageName(reply.lang, language)
                                                      : language === 'es'
                                                        ? 'Idioma no especificado'
                                                        : 'Language not provided';
                                                    
                                                    // Lógica para truncar respuestas
                                                    const normalizedReplyText = replyText || '';
                                                    const isReplyExpanded = Boolean(expandedReplies[reply.id]);
                                                    const shouldTruncateReply = normalizedReplyText.length > 300;
                                                    const displayedReplyText = shouldTruncateReply && !isReplyExpanded
                                                      ? `${normalizedReplyText.substring(0, 300)}...`
                                                      : normalizedReplyText;

                                                    return (
                                                      <>
                                                        <p className="mb-2 text-dark d-md-none" style={{ whiteSpace: 'pre-line', fontSize: '0.875rem' }}>
                                                          {displayedReplyText}
                                                        </p>
                                                        <p className="mb-2 text-dark d-none d-md-block" style={{ whiteSpace: 'pre-line' }}>
                                                          {displayedReplyText}
                                                        </p>

                                                        {shouldTruncateReply && (
                                                          <button
                                                            type="button"
                                                            className="btn btn-link p-0 fw-semibold"
                                                            style={{ fontSize: '0.8rem' }}
                                                            onClick={() => toggleReplyLength(reply.id)}
                                                          >
                                                            {isReplyExpanded
                                                              ? (language === 'es' ? 'Mostrar menos' : 'Show less')
                                                              : (language === 'es' ? 'Mostrar más' : 'Show more')}
                                                          </button>
                                                        )}

                                                        {showReplyTranslationButton && (
                                                          <div className="d-flex flex-column flex-md-row align-items-md-center gap-1 gap-md-3 mt-2">
                                                            <button
                                                              type="button"
                                                              className="btn btn-link p-0 fw-semibold text-start text-md-center d-md-none"
                                                              onClick={() => {
                                                                if (hasApiReplyTranslation) {
                                                                  toggleReplyTranslation(reply.id);
                                                                } else {
                                                                  translateReply(reply.id, reply.replyText, reply.lang || '');
                                                                }
                                                              }}
                                                              disabled={isTranslatingReply}
                                                              style={{ fontSize: '0.75rem' }}
                                                            >
                                                              {isTranslatingReply ? (
                                                                <>
                                                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                  {language === 'es' ? 'Traduciendo...' : 'Translating...'}
                                                                </>
                                                              ) : isReplyTranslated ? (
                                                                language === 'es'
                                                                  ? 'Ver original'
                                                                  : 'Show original'
                                                              ) : (
                                                                language === 'es'
                                                                  ? 'Traducir'
                                                                  : 'Translate'
                                                              )}
                                                            </button>
                                                            <button
                                                              type="button"
                                                              className="btn btn-link p-0 fw-semibold d-none d-md-block"
                                                              onClick={() => {
                                                                if (hasApiReplyTranslation) {
                                                                  toggleReplyTranslation(reply.id);
                                                                } else {
                                                                  translateReply(reply.id, reply.replyText, reply.lang || '');
                                                                }
                                                              }}
                                                              disabled={isTranslatingReply}
                                                            >
                                                              {isTranslatingReply ? (
                                                                <>
                                                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                                  {language === 'es' ? 'Traduciendo...' : 'Translating...'}
                                                                </>
                                                              ) : isReplyTranslated ? (
                                                                language === 'es'
                                                                  ? 'Ver original'
                                                                  : 'Show original'
                                                              ) : (
                                                                language === 'es'
                                                                  ? 'Traducir'
                                                                  : 'Translate'
                                                              )}
                                                            </button>
                                                            <small className="text-muted d-md-none" style={{ fontSize: '0.7rem' }}>
                                                              {isReplyTranslated
                                                                ? language === 'es'
                                                                  ? 'Traducción automática'
                                                                  : 'Automatic translation'
                                                                : language === 'es'
                                                                  ? `Escrito en ${replyLanguage}`
                                                                  : `Written in ${replyLanguage}`}
                                                            </small>
                                                            <small className="text-muted d-none d-md-inline">
                                                              {isReplyTranslated
                                                                ? language === 'es'
                                                                  ? 'Traducción automática'
                                                                  : 'Automatic translation'
                                                                : language === 'es'
                                                                  ? `Escrito en ${replyLanguage}`
                                                                  : `Written in ${replyLanguage}`}
                                                            </small>
                                                          </div>
                                                        )}
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {hasMoreReviews && (
                              <div className="text-center mt-3 mt-md-4">
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm d-md-none"
                                  onClick={() =>
                                    setVisibleReviewsCount((prev) =>
                                      Math.min(prev + 2, sortedReviews.length)
                                    )
                                  }
                                  style={{ fontSize: '0.875rem' }}
                                >
                                  {language === 'es' ? 'Mostrar más opiniones' : 'Show more reviews'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary d-none d-md-inline-block"
                                  onClick={() =>
                                    setVisibleReviewsCount((prev) =>
                                      Math.min(prev + 2, sortedReviews.length)
                                    )
                                  }
                                >
                                  {language === 'es' ? 'Mostrar más opiniones' : 'Show more reviews'}
                                </button>
                              </div>
                            )}
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sección de Reserva - Al final del contenido */}
          {showBookingSection && activity?.bookingOptions && activity.bookingOptions.length > 0 && (
            <div id="booking-section" className="row mb-5">
              <div className="col-12">
                <div className="card" style={{ borderTop: '3px solid #007bff', borderRadius: '8px' }}>
                  <div className="card-body p-0">
                    {/* Header con título y chevron */}
                    <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                      <h4 className="mb-0 fw-bold text-dark" style={{ fontSize: '1.25rem' }}>
                        {getTranslation('booking.meetingPoint', language)}
                      </h4>
                      <i className="fas fa-chevron-up text-muted" style={{ fontSize: '0.875rem' }}></i>
                    </div>

                    {/* Información de la actividad */}
                    <div className="p-3">
                      {/* Duración */}
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-clock text-primary me-2" style={{ fontSize: '0.875rem' }}></i>
                        <span className="fw-medium text-dark" style={{ fontSize: '0.875rem' }}>
                          {getTranslation('detail.booking.duration', language)} :&nbsp;
                          {selectedBookingOption ? (
                            <>
                              {selectedBookingOption.durationDays > 0 ? `${selectedBookingOption.durationDays} ${selectedBookingOption.durationDays === 1 ? getTranslation('detail.booking.duration.day', language) : getTranslation('detail.booking.duration.days', language)}` : ''}
                              {selectedBookingOption.durationHours > 0 ? `${selectedBookingOption.durationDays > 0 ? ' ' : ''}${selectedBookingOption.durationHours} ${selectedBookingOption.durationHours === 1 ? getTranslation('detail.booking.duration.hour', language) : getTranslation('detail.booking.duration.hours', language)}` : ''}
                              {selectedBookingOption.durationMinutes > 0 ? `${selectedBookingOption.durationHours > 0 || selectedBookingOption.durationDays > 0 ? ' ' : ''}${selectedBookingOption.durationMinutes} ${selectedBookingOption.durationMinutes === 1 ? getTranslation('detail.booking.duration.minute', language) : getTranslation('detail.booking.duration.minutes', language)}` : ''}
                              {!selectedBookingOption.durationHours && !selectedBookingOption.durationMinutes && !selectedBookingOption.durationDays ? getTranslation('detail.booking.duration.notSpecified', language) : ''}
                            </>
                          ) : (
                            getTranslation('detail.booking.duration.default', language)
                          )}
                        </span>
                      </div>

                      {/* Guía */}
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-user text-primary me-2" style={{ fontSize: '0.875rem' }}></i>
                        <span className="fw-medium text-dark" style={{ fontSize: '0.875rem' }}>
                          {getTranslation('detail.booking.guide', language)} :&nbsp; 
                          {getLanguageName(
                            selectedLanguage || (selectedBookingOption?.languages && selectedBookingOption.languages.length > 0 
                              ? selectedBookingOption.languages[0] 
                              : 'en'
                            ),
                            language
                          )}
                        </span>
                      </div>

                      {/* Selección de idiomas del guía */}
                      {selectedBookingOption?.languages && selectedBookingOption.languages.length > 0 && (
                        <div className="mb-3">
                          {selectedBookingOption.languages.length === 1 ? (
                            // Mostrar como texto en negrita cuando hay solo un idioma
                            <div className="d-flex align-items-center">
                              <i className="fas fa-language text-primary me-2" style={{ fontSize: '0.875rem' }}></i>
                              <span className="fw-bold text-dark" style={{ fontSize: '0.875rem' }}>
                                {getTranslation('detail.booking.guideLanguage', language)}
                                {getLanguageName(selectedBookingOption.languages[0], language)}
                              </span>
                            </div>
                          ) : (
                            // Mostrar botones cuando hay múltiples idiomas
                            <>
                              <h6 className="fw-bold mb-2 text-dark" style={{ fontSize: '0.9rem' }}>
                                {getTranslation('detail.booking.selectGuideLanguages', language)}
                              </h6>
                              <div className="d-flex gap-2 flex-wrap">
                                {selectedBookingOption.languages.map((lang: string, index: number) => (
                                  <button 
                                    key={index}
                                    className={`btn ${selectedLanguage === lang ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => handleLanguageSelection(lang)}
                                    style={{ 
                                      fontSize: '0.8rem',
                                      padding: '0.4rem 0.8rem',
                                      borderRadius: '4px',
                                      border: selectedLanguage === lang ? 'none' : '1px solid #007bff'
                                    }}
                                  >
                                    {getLanguageName(lang, language)}
                                  </button>
                                ))}
                              </div>
                              {!selectedLanguage && (
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                  {getTranslation('detail.booking.selectLanguage', language)}
                                </small>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Punto de encuentro / Pickup Locations */}
                      {selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' ? (
                        <div className="mb-3">
                          {selectedPickupPoint ? (
                            <>
                              {/* Mostrar punto seleccionado con opción de editar */}
                              <div className="d-flex align-items-start justify-content-between">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center mb-1">
                                    <i className="fas fa-map-marker-alt text-primary me-2" style={{ fontSize: '0.875rem' }}></i>
                                    <span className="fw-medium text-dark" style={{ fontSize: '0.875rem' }}>
                                      {getTranslation('detail.booking.selectedLocation', language)}
                                    </span>
                                  </div>
                                  <div style={{ marginLeft: '1.5rem' }}>
                                    <p className="fw-medium mb-0" style={{ fontSize: '0.875rem', lineHeight: '1.3' }}>
                                      {selectedPickupPoint.name || selectedPickupPoint.address}
                                    </p>
                                    {selectedPickupPoint.address && selectedPickupPoint.name && (
                                      <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                                        {selectedPickupPoint.address}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  className="btn btn-link p-0 text-primary fw-medium"
                                  style={{ fontSize: '0.875rem' }}
                                  onClick={() => {
                                    const isMobile = window.innerWidth < 768;
                                    if (isMobile) {
                                      setShowPickupPointsPageView(true);
                                    } else {
                                      setShowPickupPointsModal(true);
                                    }
                                  }}
                                >
                                  {getTranslation('detail.booking.edit', language)}
                                </button>
                              </div>
                            </>
                          ) : (
                            /* Mostrar botón para seleccionar punto */
                            <>
                              <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-bus text-primary me-2" style={{ fontSize: '0.875rem' }}></i>
                                <button 
                                  className="btn btn-link p-0 fw-medium text-dark text-decoration-underline"
                                  style={{ fontSize: '0.875rem' }}
                                  onClick={() => {
                                    const isMobile = window.innerWidth < 768;
                                    if (isMobile) {
                                      setShowPickupPointsPageView(true);
                                    } else {
                                      setShowPickupPointsModal(true);
                                    }
                                  }}
                                >
                                  {getTranslationWithParams('detail.booking.viewPickupLocations', language, {
                                    count: selectedBookingOption.pickupPoints?.length || 0
                                  })}
                                </button>
                              </div>
                              
                              {/* Descripción explicativa */}
                              <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                                {getTranslation('detail.booking.pickupAvailableDescription', language)}
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="d-flex align-items-start mb-3">
                            <i className="fas fa-map-marker-alt text-primary me-2 mt-1" style={{ fontSize: '0.875rem' }}></i>
                            <span className="fw-medium text-dark text-decoration-underline" style={{ fontSize: '0.875rem', lineHeight: '1.3' }}>
                              {selectedBookingOption?.meetingPointAddress || 
                               'Meet at Lt 8, Gral. Don José de San Martin, Av. Los Libertadores Mz C, Paracas 11550, Perú'
                              }
                            </span>
                          </div>
                        </>
                      )}

                      {/* Campo de comentario - Siempre visible */}
                      <div className="mb-3">
                        <label className="form-label mb-1" style={{ fontSize: '0.8rem' }}>
                          {getTranslation('detail.booking.specialRequests', language)}
                        </label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          maxLength={150}
                          placeholder={getTranslation('detail.booking.specialRequestsPlaceholder', language)}
                          value={pickupComment}
                          onChange={(e) => setPickupComment(e.target.value)}
                          style={{ fontSize: '0.8rem' }}
                        />
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          {pickupComment.length}/150 {getTranslation('detail.booking.characters', language)}
                        </small>
                      </div>
                    </div>

                    <hr className="my-0" />

                    {/* Selección de horario */}
                    <div className="p-3" style={{ margin: 0, padding: 0 }}>
                      <h5 className="fw-bold text-dark" style={{ fontSize: '1rem', margin: 0, padding: 0 }}>
                        {(() => {
                          const availableTimes = getSchedulesForSelectedDate();
                          if (availableTimes.length === 1) {
                            return getTranslation('detail.booking.startTime', language);
                          } else {
                            return getTranslation('detail.booking.selectStartTime', language);
                          }
                        })()}
                      </h5>
                      
                      <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0, padding: 0 }}>
                        {selectedDate ? parseLocalDate(selectedDate).toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'America/Lima'
                        }) : (language === 'es' ? 'Jueves, 23 de octubre de 2025' : 'Thursday, October 23, 2025')}
                      </p>
                      
                      {/* Mensaje si no hay horarios para el día seleccionado */}
                      {selectedDate && getSchedulesForSelectedDate().length === 0 && (
                        <div className="alert alert-warning" style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', margin: 0 }}>
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          {getTranslationWithParams('detail.booking.noSchedulesForDay', language, {
                            day: getDayName(getCustomDayOfWeekFromDate(selectedDate)),
                            date: selectedDate
                          })}
                        </div>
                      )}
                      
                      {(() => {
                        const availableTimes = getSchedulesForSelectedDate();
                        
                        if (availableTimes.length === 0) {
                          // No mostrar nada si no hay horarios disponibles
                          return (
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                              {language === 'es' 
                                ? 'No hay horarios disponibles para esta fecha.'
                                : 'No schedules available for this date.'
                              }
                            </div>
                          );
                        } else if (availableTimes.length === 1) {
                          // Mostrar como texto en negrita cuando hay solo un horario
                          return (
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-muted" style={{ fontSize: '1rem', margin: 0, padding: 0 }}>
                                {availableTimes[0]}
                              </span>
                            </div>
                          );
                        } else {
                          // Mostrar botones cuando hay múltiples horarios
                          return (
                            <div className="d-flex flex-wrap gap-2">
                              {availableTimes.map((time: string, index: number) => (
                                <button 
                                  key={index}
                                  className={`btn ${selectedTimeSlot === time ? 'btn-primary' : 'btn-outline-primary'}`}
                                  onClick={() => handleTimeSlotSelect(time)}
                                  style={{ 
                                    fontSize: '0.875rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: selectedTimeSlot === time ? 'none' : '1px solid #007bff',
                                    flexShrink: 0
                                  }}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          );
                        }
                      })()}
                    </div>

                    <hr className="my-0" />

                    {/* Política de cancelación */}
                    {selectedBookingOption && selectedBookingOption.cancelBeforeMinutes && selectedDate && selectedTimeSlot && (
                      <div className="p-3">
                        <div className="d-flex align-items-start">
                          <i className="fas fa-calendar-check text-success me-2 mt-1" style={{ fontSize: '0.875rem' }}></i>
                          <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                            {(() => {
                              const deadline = getCancellationDeadline();
                              if (deadline) {
                                return getTranslationWithParams('detail.booking.cancelBeforeDeadline', language, { deadline });
                              }
                              return null;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Precios y botones */}
                    <div className="p-3" style={{ backgroundColor: '#f8f9fa' }}>
                      <div className="row align-items-center">
                        <div className="col-md-6">
                          <div className="d-flex flex-column mb-1">
                            {hasActiveDiscount() && (
                              <div className="d-flex flex-column mb-2">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-danger" style={{ fontSize: '0.875rem' }}>
                                    -{getDiscountPercentage()}% {getTranslation('activity.discount', language)}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.9rem' }}>
                                    {getCurrencySymbol(currency)} {((Math.ceil(getOriginalPrice()))).toFixed(2)}
                                  </span>
                                  <span className="text-success fw-bold" style={{ fontSize: '0.9rem' }}>
                                    {getTranslation('activity.youSave', language)} {getCurrencySymbol(currency)} {(Math.ceil(getOriginalPrice()) - Math.ceil(calculateTotalPrice())).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <span className="h4 fw-bold text-danger me-2" style={{ fontSize: '1.5rem' }}>
                              {getCurrencySymbol(currency)} {(Math.ceil(calculateTotalPrice())).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>
                            {numberOfPeople} {language === 'es' 
                              ? (numberOfPeople === 1 ? 'Viajero' : 'Viajeros') 
                              : (numberOfPeople === 1 ? 'Traveler' : 'Travelers')
                            } x {getCurrencySymbol(currency)} {(() => {
                              if (!selectedBookingOption) return '0.00';
                              const unitPrice = selectedBookingOption.priceAfterDiscount ?? selectedBookingOption.normalPrice ?? selectedBookingOption.unitPrice ?? selectedBookingOption.pricePerPerson ?? 0;
                              return (Math.ceil(unitPrice)).toFixed(2);
                            })()}
                          </p>
                          <p className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            {getTranslation('detail.booking.allTaxesIncluded', language)}
                          </p>
                        </div>
                        <div className="col-md-6 text-end">
                          <div className="d-flex gap-2 justify-content-end">
                            <button 
                              className="btn btn-outline-primary"
                              disabled={(() => {
                                // Verificar si se necesita seleccionar punto de encuentro
                                const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                // Verificar si se necesita seleccionar idioma
                                const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                // Verificar si se necesita seleccionar horario
                                const needsTimeSlot = !selectedTimeSlot;
                                
                                return needsTimeSlot || needsLanguage || needsMeetingPoint || isBooking;
                              })()}
                              onClick={handleBookNow}
                              style={{ 
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                border: '1px solid #007bff',
                                color: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isBooking) ? '#ccc' : '#007bff';
                                })(),
                                backgroundColor: 'transparent',
                                opacity: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isBooking) ? 0.5 : 1;
                                })(),
                                cursor: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isBooking) ? 'not-allowed' : 'pointer';
                                })()
                              }}
                            >
                              {isBooking ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  {getTranslation('activity.processing', language)}
                                </>
                              ) : (
                                getTranslation('detail.booking.reserveNow', language)
                              )}
                            </button>
                            <button 
                              className="btn btn-primary"
                              disabled={(() => {
                                // Verificar si se necesita seleccionar punto de encuentro
                                const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                // Verificar si se necesita seleccionar idioma
                                const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                // Verificar si se necesita seleccionar horario
                                const needsTimeSlot = !selectedTimeSlot;
                                
                                return needsTimeSlot || needsLanguage || needsMeetingPoint || isAddingToCart;
                              })()}
                              onClick={handleAddToCart}
                              style={{ 
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                borderRadius: '4px',
                                backgroundColor: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isAddingToCart) ? '#ccc' : '#007bff';
                                })(),
                                border: 'none',
                                color: 'white',
                                opacity: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isAddingToCart) ? 0.5 : 1;
                                })(),
                                cursor: (() => {
                                  const needsMeetingPoint = selectedBookingOption?.meetingType === 'REFERENCE_CITY_WITH_LIST' && !selectedPickupPoint;
                                  const needsLanguage = selectedBookingOption?.languages && selectedBookingOption.languages.length > 1 && !selectedLanguage;
                                  const needsTimeSlot = !selectedTimeSlot;
                                  return (needsTimeSlot || needsLanguage || needsMeetingPoint || isAddingToCart) ? 'not-allowed' : 'pointer';
                                })()
                              }}
                            >
                              {isAddingToCart ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                  {getTranslation('detail.booking.savingToDatabase', language) || 
                                   (language === 'es' ? 'Guardando en la base de datos...' : 'Saving to database...')}
                                </>
                              ) : (
                                getTranslation('detail.booking.addToCart', language)
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Barra flotante móvil - Solo visible en móvil */}
        {showAvailabilitySection && !isMobileMenuOpen && (
          <div className="d-block d-md-none position-fixed bottom-0 start-0 w-100 bg-white shadow-lg border-top" style={{ zIndex: 1030 }}>
            <div className="container-fluid p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {(() => {
                    const displayOption = selectedBookingOption || getMinPriceFromOptions();
                    if (!displayOption) {
                      return null;
                    }
                    
                    const price = displayOption.priceAfterDiscount ?? displayOption.normalPrice ?? displayOption.unitPrice ?? displayOption.pricePerPerson;
                    const originalPrice = displayOption.normalPrice ?? displayOption.unitPrice ?? displayOption.pricePerPerson;
                    const hasDiscount = (displayOption.specialOfferPercentage ?? 0) > 0;
                    const discountPercent = displayOption.specialOfferPercentage ?? 0;
                    const hasMultiplePriceTiers = (displayOption.groupMinSize ?? 1) > 1;
                    const minParticipants = displayOption.groupMinSize ?? null;
                    
                    if (price === null || price === undefined) {
                      return null;
                    }
                    
                    return (
                      <>
                        <div className="d-flex flex-column gap-2 mb-1">
                          
                          {hasDiscount && (
                            <div className="d-flex flex-start align-items-center">
                              <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>-{Math.round(discountPercent)}%</span>
                              <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.75rem' }}>
                                {getCurrencySymbol(currency)} {Math.ceil(originalPrice || 0)?.toFixed(2)}
                              </span>
                            </div>
                          )}
                           <div className={`h5 fw-bold mb-0 ${hasDiscount ? 'text-danger' : 'text-dark'}`} style={{ margin: '0px', padding: '0px' }}>
                             {getCurrencySymbol(currency)} {Math.ceil(price || 0)?.toFixed(2) || '0.00'}
                           </div>
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.7rem', marginTop: '-14px' }}>
                            {getTranslation('detail.booking.perPerson', language)}
                          </small>
                          
                          {/* Mostrar "a partir de X personas" solo si hay mínimo de participantes */}
                          {hasMultiplePriceTiers && minParticipants !== null && minParticipants !== undefined && (
                            <small className="text-muted d-block" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                              {getTranslationWithParams('detail.booking.fromParticipants', language, {
                                count: minParticipants || 0,
                                plural: minParticipants === 1 
                                  ? getTranslation('detail.booking.participantSingular', language)
                                  : getTranslation('detail.booking.participantPlural', language)
                              })}
                            </small>
                          )}
                      </>
                    );
                  })()}
                </div>
                <button 
                  className="btn btn-primary px-4 py-2"
                  onClick={scrollToBookingOptions}
                >
                  {getTranslation('detail.booking.viewAvailability', language)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pickup Points Modal - Desktop Only */}
      {showPickupPointsModal && selectedBookingOption?.pickupPoints && (
        <div 
          className="modal show d-block modal-fade-in" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  {getTranslation('detail.booking.pickupLocations', language)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPickupPointsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  {getTranslation('detail.booking.selectPickupLocation', language)}
                </p>
                <div className="list-group">
                  {selectedBookingOption.pickupPoints.map((point: any, index: number) => (
                    <label 
                      key={index}
                      className="list-group-item d-flex align-items-center"
                      style={{ cursor: 'pointer' }}
                    >
                      <input
                        type="radio"
                        name="pickupPoint"
                        checked={selectedPickupPoint?.name === point.name || selectedPickupPoint?.address === point.address}
                        onChange={() => setSelectedPickupPoint(point)}
                        className="form-check-input me-3"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-medium">{point.name || point.address}</div>
                        {point.address && point.name && (
                          <small className="text-muted">{point.address}</small>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPickupPointsModal(false)}
                >
                  {getTranslation('detail.booking.close', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (selectedPickupPoint) {
                      setShowPickupPointsModal(false);
                    }
                  }}
                  disabled={!selectedPickupPoint}
                >
                  {getTranslation('detail.booking.confirm', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Points PageView - Mobile Only */}
      {showPickupPointsPageView && selectedBookingOption?.pickupPoints && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-md-none"
          style={{ 
            zIndex: 10002,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={() => setShowPickupPointsPageView(false)}
        >
          <div 
            className="position-fixed top-0 start-0 h-100 bg-white"
            style={{ 
              width: '100%',
              zIndex: 10003,
              animation: 'slideInLeft 0.3s ease-in-out',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button 
                  className="btn btn-link text-white p-0 me-3"
                  onClick={() => setShowPickupPointsPageView(false)}
                  style={{ fontSize: '1.2rem' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4 className="mb-0 fw-bold">
                  {getTranslation('detail.booking.pickupLocations', language)}
                </h4>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="text-muted mb-3">
                {language === 'es' 
                  ? 'Selecciona tu ubicación de recogida preferida:'
                  : 'Select your preferred pickup location:'
                }
              </p>
              <div className="list-group">
                {selectedBookingOption.pickupPoints.map((point: any, index: number) => (
                  <label 
                    key={index}
                    className="list-group-item d-flex align-items-center"
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="pickupPoint"
                      checked={selectedPickupPoint?.name === point.name || selectedPickupPoint?.address === point.address}
                      onChange={() => setSelectedPickupPoint(point)}
                      className="form-check-input me-3"
                    />
                    <div className="flex-grow-1">
                      <div className="fw-medium">{point.name || point.address}</div>
                      {point.address && point.name && (
                        <small className="text-muted">{point.address}</small>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="position-fixed bottom-0 start-0 end-0 bg-white border-top p-3 d-md-none">
              <button
                type="button"
                className="btn btn-primary w-100"
                onClick={() => {
                  if (selectedPickupPoint) {
                    setShowPickupPointsPageView(false);
                  }
                }}
                disabled={!selectedPickupPoint}
              >
                {language === 'es' ? 'Confirmar' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div 
          className="modal show d-block modal-fade-in" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content modal-fade-in">
              <div className="modal-header border-0 d-flex align-items-between px-4 py-3">
                <div className="d-flex align-items-center justify-content-center w-100">
                  <h4 className="fw-bold mb-0">
                    {getTranslation('checkout.loginModal.title', language) || 
                     (language === 'es' ? '¿Quieres iniciar sesión?' : 'Do you want to sign in?')}
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPendingAction(null);
                  }}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body text-center">
                <p className="text-muted mb-4 fw-medium">
                  {language === 'es' 
                    ? 'Para agregar actividades al carrito o realizar una reserva, debes iniciar sesión.'
                    : 'To add activities to cart or make a reservation, you must sign in.'}
                </p>
                
                <p className="text-muted mb-4">
                  {getTranslation('checkout.loginModal.benefits', language) || 
                   (language === 'es' 
                     ? 'Inicia sesión para guardar tus reservas, acceder a tu historial y disfrutar de una experiencia personalizada.'
                     : 'Sign in to save your reservations, access your history and enjoy a personalized experience.')}
                </p>

                {/* Google Login Button */}
                <button
                  className="btn btn-outline-primary w-100 mb-3"
                  onClick={handleLoginWithGoogle}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      {getTranslation('common.signingIn', language) || 
                       (language === 'es' ? 'Iniciando sesión...' : 'Signing in...')}
                    </>
                  ) : (
                    <>
                      <i className="fab fa-google me-2"></i>
                      {getTranslation('common.continueWithGoogle', language) || 
                       (language === 'es' ? 'Continuar con Google' : 'Continue with Google')}
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
};

export default ActivityDetail; 