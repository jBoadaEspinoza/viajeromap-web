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
import type { Activity, BookingOption, Schedule } from '../api/activities';
import Itinerary from '../components/Itinerary';
import Reviews from '../components/Reviews';
import RatingStars from '../components/RatingStars';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import { getTranslation, getTranslationWithParams, getLanguageName } from '../utils/translations';
import { useGlobalLoading } from '../hooks/useGlobalLoading';
import { appConfig } from '../config/appConfig';

interface Review {
  id: string;
  user: {
    name: string;
    country: string;
    initial: string;
    avatarColor: string;
  };
  rating: number;
  date: string;
  verified: boolean;
  text: string;
  images?: string[];
}

const ActivityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { addItem } = useCart();
  const { withLoading } = useGlobalLoading();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showBookingOptions, setShowBookingOptions] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
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
    
    // Seleccionar automáticamente el primer horario disponible del día específico
    const availableSchedules = option.schedules?.filter((schedule: Schedule) => {
      if (!selectedDate) return schedule.isActive;
      const customDayOfWeek = getCustomDayOfWeekFromDate(selectedDate);
      return schedule.dayOfWeek === customDayOfWeek && schedule.isActive;
    }) || [];
    
    // Seleccionar automáticamente el primer horario disponible del día específico
    if (availableSchedules.length > 0) {
      setSelectedTimeSlot(availableSchedules[0].startTime);
    } else {
      // Si no hay horarios para el día seleccionado, limpiar la selección
      setSelectedTimeSlot(null);
    }
  };

  // Función para manejar selección de horario
  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Función para calcular precio total con descuentos automáticos y priceTiers
  const calculateTotalPrice = () => {
    const totalPeople = numberOfAdults + numberOfChildren;
    if (!selectedBookingOption || !selectedTimeSlot) {
      // Si no hay opción seleccionada, usar el precio mínimo de la actividad
      const minPrice = getMinPrice().price || 0;
      return minPrice * totalPeople;
    }
    
    
    let basePrice = 0;
    
    // Calcular precio por adultos
    const adultPrice = (selectedBookingOption.pricePerPerson || 0) * numberOfAdults;
    
    // Calcular precio por niños (asumiendo que niños tienen el mismo precio por ahora)
    // Si hay un precio especial para niños, se puede agregar aquí
    const childrenPrice = (selectedBookingOption.pricePerPerson || 0) * numberOfChildren;
    
    basePrice = adultPrice + childrenPrice;
    
    // Si hay priceTiers, buscar el tier que corresponde a la cantidad total de personas
    if (selectedBookingOption.priceTiers && selectedBookingOption.priceTiers.length > 0) {
      const matchingTier = selectedBookingOption.priceTiers.find((tier: any) => {
        const min = tier.minParticipants || 1;
        const max = tier.maxParticipants || Infinity;
        return totalPeople >= min && totalPeople <= max;
      });
      
      if (matchingTier) {
        // Si el tier tiene totalPrice, usarlo; si no, calcular desde pricePerParticipant
        basePrice = matchingTier.totalPrice || (matchingTier.pricePerParticipant * totalPeople);
      }
    }
    
    // Obtener porcentaje de descuento si existe
    const discountPercent = selectedBookingOption.specialOfferPercentage || 0;
    
    // Aplicar descuento automáticamente si existe specialOfferPercentage
    if (discountPercent > 0) {
      // Calcular monto de descuento y precio final
      const discountAmount = basePrice * (discountPercent / 100);
      const finalPrice = Math.round((basePrice - discountAmount) * 100) / 100;
      
      return finalPrice;
    }
    
    return Math.round(basePrice * 100) / 100;
  };

  // Función para obtener precio original (antes de descuento)
  const getOriginalPrice = () => {
    if (!selectedBookingOption) {
      // Si no hay opción seleccionada, usar el precio mínimo de la actividad
      return getMinPrice().price || 0;
    }
    
    let basePrice = 0;
    
    // Si hay priceTiers, buscar el tier que corresponde a la cantidad de personas
    if (selectedBookingOption.priceTiers && selectedBookingOption.priceTiers.length > 0) {
      const matchingTier = selectedBookingOption.priceTiers.find((tier: any) => {
        const min = tier.minParticipants || 1;
        const max = tier.maxParticipants || Infinity;
        return numberOfPeople >= min && numberOfPeople <= max;
      });
      
      if (matchingTier) {
        basePrice = matchingTier.totalPrice || (matchingTier.pricePerParticipant * numberOfPeople);
      } else {
        basePrice = selectedBookingOption.pricePerPerson * numberOfPeople;
      }
    } else {
      basePrice = (selectedBookingOption.pricePerPerson || 0) * numberOfPeople;
    }
    
    return Math.round(basePrice * 100) / 100;
  };

  // Función para verificar si hay descuento activo
  const hasActiveDiscount = () => {
    return selectedBookingOption?.specialOfferPercentage && selectedBookingOption.specialOfferPercentage > 0;
  };

  // Función para obtener el porcentaje de descuento
  const getDiscountPercentage = () => {
    return selectedBookingOption?.specialOfferPercentage || 0;
  };

  // Función para agregar al carrito
  const handleAddToCart = async () => {
    if (!activity || !selectedBookingOption || !selectedTimeSlot) {
      return;
    }

    setIsAddingToCart(true);

    try {
      // Obtener el punto de encuentro seleccionado
      let meetingPoint = selectedBookingOption?.meetingPointAddress || 
                          'Punto de encuentro por confirmar';
      
      // Si hay un punto de recogida seleccionado, usarlo
      let pickupPointInfo = undefined;
      if (selectedPickupPoint) {
        meetingPoint = selectedPickupPoint.name || selectedPickupPoint.address;
        pickupPointInfo = {
          id: selectedPickupPoint.id,
          cityId: selectedPickupPoint.city?.id ?? null,
          name: selectedPickupPoint.name || '',
          address: selectedPickupPoint.address || '',
          latitude: selectedPickupPoint.latitude ?? null,
          longitude: selectedPickupPoint.longitude ?? null
        };
      } else if ((selectedBookingOption.meetingType || '').toLowerCase() === 'meeting_point') {
        meetingPoint = selectedBookingOption.meetingPointAddress || meetingPoint;
        pickupPointInfo = {
          id: selectedBookingOption.meetingPointId ?? null,
          cityId: selectedBookingOption.meetingPointId ?? null,
          name: selectedBookingOption.meetingPointAddress || selectedBookingOption.meetingPointDescription?.[0] || '',
          address: selectedBookingOption.meetingPointAddress || '',
          latitude: selectedBookingOption.meetingPointLatitude ?? null,
          longitude: selectedBookingOption.meetingPointLongitude ?? null
        };
      }

      // Obtener el código del idioma del guía (ej: es, en, fr)
      const languageCode = selectedLanguage || 
                           (selectedBookingOption.languages && selectedBookingOption.languages.length === 1 ? 
                            selectedBookingOption.languages[0] : 'es');
      const guideLanguage = languageCode || 'es';

      // Obtener la hora de salida
      const departureTime = selectedTimeSlot;

      // Calcular precio por persona (considerando descuentos)
      const pricePerPerson = Math.ceil(calculateTotalPrice());

      // Crear el item del carrito
      const cartItem = {
        id: `${activity.id}-${selectedBookingOption.id}-${selectedTimeSlot}-${selectedDate}`,
        title: activity.title,
        price: pricePerPerson,
        currency: currency,
        quantity: numberOfAdults + numberOfChildren,
        imageUrl: activity.images?.[0]?.imageUrl || '',
        date: selectedDate,
        travelers: {
          adults: numberOfAdults,
          children: numberOfChildren
        },
        // Información adicional específica de la actividad
        activityDetails: {
          activityId: activity.id,
          bookingOptionId: selectedBookingOption.id,
          meetingPoint: meetingPoint,
          guideLanguage: guideLanguage,
          departureTime: departureTime,
          departureDate: selectedDate,
          hasDiscount: hasActiveDiscount(),
          discountPercentage: getDiscountPercentage(),
          originalPrice: getOriginalPrice(),
          finalPrice: calculateTotalPrice(),
          pickupPoint: pickupPointInfo,
          comment: pickupComment || undefined
        }
      };

      // Simular delay para mostrar loading
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Agregar al carrito
      const itemAdded = addItem(cartItem);
      
      if (!itemAdded) {
        // Si el item ya existe, mostrar alerta y no navegar
        alert(getTranslation('detail.booking.activityAlreadyInCart', language));
        return;
      }

      // Navegar a la página del carrito
      navigate('/cart');

    } catch (error) {
      // Si hay error al agregar al carrito, continuar sin navegar
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Función para ir directamente al checkout
  const handleBookNow = async () => {
    if (!activity || !selectedBookingOption || !selectedTimeSlot) {
      return;
    }

    setIsBooking(true);

    try {
      // Simular delay para mostrar loading (similar al carrito)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener el punto de encuentro seleccionado
      let meetingPoint = selectedBookingOption?.meetingPointAddress || 
                          'Punto de encuentro por confirmar';
      
      // Si hay un punto de recogida seleccionado, usarlo
      let pickupPointInfo = undefined;
      if (selectedPickupPoint) {
        meetingPoint = selectedPickupPoint.name || selectedPickupPoint.address;
        pickupPointInfo = {
          id: selectedPickupPoint.id,
          cityId: selectedPickupPoint.city?.id ?? null,
          name: selectedPickupPoint.name || '',
          address: selectedPickupPoint.address || '',
          latitude: selectedPickupPoint.latitude ?? null,
          longitude: selectedPickupPoint.longitude ?? null
        };
      }

      // Obtener el idioma del guía (traducido a nombre completo)
      const languageCode = selectedLanguage || 
                           (selectedBookingOption.languages && selectedBookingOption.languages.length === 1 ? 
                            selectedBookingOption.languages[0] : 'es');
      const guideLanguage = languageCode || 'es';

      // Obtener la hora de salida
      const departureTime = selectedTimeSlot;

      // Calcular precio por persona (considerando descuentos)
      const pricePerPerson = Math.ceil(calculateTotalPrice());

      // Crear los detalles de reserva para el checkout
      const bookingDetails = {
        activityId: activity.id,
        title: activity.title,
        imageUrl: activity.images?.[0]?.imageUrl || '',
        price: pricePerPerson,
        currency: currency,
        quantity: numberOfAdults + numberOfChildren,
        date: selectedDate,
        time: departureTime,
        meetingPoint: meetingPoint,
        meetingType: selectedBookingOption.meetingType,
        guideLanguage: guideLanguage,
        durationDays: selectedBookingOption.durationDays ?? 0,
        durationHours: selectedBookingOption.durationHours ?? 0,
        durationMinutes: selectedBookingOption.durationMinutes ?? 0,
        travelers: {
          adults: numberOfAdults,
          children: numberOfChildren
        },
        hasDiscount: hasActiveDiscount(),
        discountPercentage: getDiscountPercentage(),
        originalPrice: getOriginalPrice(),
        finalPrice: calculateTotalPrice(),
        pickupPoint: pickupPointInfo,
        meetingPointId: pickupPointInfo?.id ?? selectedBookingOption.meetingPointId ?? null,
        meetingPointAddress: pickupPointInfo?.address || selectedBookingOption.meetingPointAddress || '',
        meetingPointLatitude: pickupPointInfo?.latitude ?? selectedBookingOption.meetingPointLatitude ?? null,
        meetingPointLongitude: pickupPointInfo?.longitude ?? selectedBookingOption.meetingPointLongitude ?? null,
        meetingPointCityId: pickupPointInfo?.cityId ?? null,
        meetingPointName: pickupPointInfo?.name || selectedBookingOption.meetingPointAddress || selectedBookingOption.meetingPointDescription?.[0] || '',
        comment: pickupComment || undefined
      };

      // Guardar detalles en sessionStorage para persistencia durante la sesión
      sessionStorage.setItem('checkoutBookingDetails', JSON.stringify(bookingDetails));
      
      // Navegar al checkout con los detalles de reserva
      navigate('/checkout', { state: { bookingDetails } });

    } catch (error) {
      // Si hay error al procesar reserva, continuar sin navegar
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

  // Función para obtener horarios según el día seleccionado
  const getSchedulesForSelectedDate = () => {
    // Si no hay schedules disponibles, retornar lista vacía
    if (!selectedBookingOption?.schedules) {
      return [];
    }
    
    // Si no hay fecha seleccionada, mostrar todos los horarios activos
    if (!selectedDate) {
      return selectedBookingOption.schedules.filter((schedule: Schedule) => schedule.isActive);
    }

    // Obtener el día de la semana de la fecha seleccionada
    // JavaScript usa: 0=Domingo, 1=Lunes, ..., 6=Sábado
    // Necesitamos convertir a: 0=Lunes, 1=Martes, ..., 6=Domingo
    const selectedDateObj = parseLocalDate(selectedDate); // Usar parseLocalDate para evitar problemas de timezone
    const jsDayOfWeek = selectedDateObj.getDay(); // 0-6 (Domingo-Sábado)
    const customDayOfWeek = convertToCustomDayOfWeek(jsDayOfWeek); // 0-6 (Lunes-Domingo)

    // Filtrar horarios que coincidan con el día de la semana y estén activos
    const filteredSchedules = selectedBookingOption.schedules.filter((schedule: Schedule) => 
      schedule.dayOfWeek === customDayOfWeek && schedule.isActive
    );

    return filteredSchedules;
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

  // Función para manejar selección de idioma (único)
  const handleLanguageSelection = (lang: string) => {
    setSelectedLanguage(prev => prev === lang ? null : lang);
  };

  // Función para manejar selección de horario (único)
  const handleScheduleSelection = (scheduleId: string) => {
    setSelectedSchedule(prev => prev === scheduleId ? null : scheduleId);
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

  // Función para obtener precio mínimo y currency con descuento aplicado
  // Función para obtener precio mínimo según la cantidad de personas cuando hay priceTiers
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
      let optionMinPrice = Infinity;
      
      // Si el pricingMode es PER_PERSON y hay priceTiers, buscar el tier que corresponde a la cantidad de personas
      if (option.pricingMode === 'PER_PERSON' && option.priceTiers && option.priceTiers.length > 0) {
        // Buscar el tier que corresponde a la cantidad de personas
        const matchingTier = option.priceTiers.find((tier: any) => {
          const min = tier.minParticipants || 1;
          const max = tier.maxParticipants || Infinity;
          return peopleCount >= min && peopleCount <= max;
        });
        
        if (matchingTier) {
          // Si el tier tiene totalPrice, usarlo; si no, calcular desde pricePerParticipant
          optionMinPrice = matchingTier.totalPrice || (matchingTier.pricePerParticipant * peopleCount);
        } else {
          // Si no hay tier que coincida, usar el precio mínimo de todos los tiers
          optionMinPrice = Math.min(...option.priceTiers.map((tier: any) => tier.totalPrice || (tier.pricePerParticipant || 0) * (tier.minParticipants || 1)));
        }
      } else {
        // Para otros modos de pricing, usar pricePerPerson directamente
        optionMinPrice = option.pricePerPerson || 0;
      }
      
      // Aplicar descuento si existe specialOfferPercentage
      let finalPrice = optionMinPrice;
      if (option.specialOfferPercentage && option.specialOfferPercentage > 0) {
        const discount = optionMinPrice * (option.specialOfferPercentage / 100);
        finalPrice = optionMinPrice - discount;
        
        if (finalPrice < minPrice) {
          minPrice = finalPrice;
          minOriginalPrice = optionMinPrice;
          minCurrency = option.currency;
          hasDiscount = true;
          discountPercent = option.specialOfferPercentage;
        }
      } else {
        if (optionMinPrice < minPrice) {
          minPrice = optionMinPrice;
          minOriginalPrice = optionMinPrice;
          minCurrency = option.currency;
          hasDiscount = false;
          discountPercent = 0;
        }
      }
    });
    
    return { 
      price: minPrice === Infinity ? null : Math.round(minPrice * 100) / 100,
      originalPrice: minOriginalPrice === Infinity ? null : Math.round(minOriginalPrice * 100) / 100,
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
      // Si hay priceTiers, buscar el tier con el precio total mínimo
      if (option.pricingMode === 'PER_PERSON' && option.priceTiers && option.priceTiers.length > 0) {
        option.priceTiers.forEach((tier: any) => {
          // Usar totalPrice del tier directamente sin dividir
          const tierTotalPrice = tier.totalPrice || 0;
          const minParticipantsCount = tier.minParticipants || 1;
          
          // Aplicar descuento si existe
          let finalPrice = tierTotalPrice;
          if (option.specialOfferPercentage && option.specialOfferPercentage > 0) {
            finalPrice = tierTotalPrice - (tierTotalPrice * (option.specialOfferPercentage / 100));
          }
          
          if (finalPrice < minPrice) {
            minPrice = finalPrice;
            minParticipants = minParticipantsCount;
          } else if (finalPrice === minPrice && minParticipantsCount < minParticipants) {
            // Si el precio es igual, tomar el menor número de participantes
            minParticipants = minParticipantsCount;
          }
        });
      } else {
        // Si no hay priceTiers, el precio mínimo es para 1 persona
        const optionPrice = option.pricePerPerson || 0;
        let finalPrice = optionPrice;
        if (option.specialOfferPercentage && option.specialOfferPercentage > 0) {
          finalPrice = optionPrice - (optionPrice * (option.specialOfferPercentage / 100));
        }
        
        if (finalPrice < minPrice) {
          minPrice = finalPrice;
          minParticipants = 1;
        }
      }
    });
    
    return minParticipants === Infinity ? null : minParticipants;
  };

  const getMinPrice = () => {
    if (!activity?.bookingOptions || activity.bookingOptions.length === 0) return { price: null, currency: 'USD', originalPrice: null, hasDiscount: false, discountPercent: 0, minParticipants: null, hasMultiplePriceTiers: false };
    
    const activeOptions = activity.bookingOptions.filter(option => option.isActive);
    if (activeOptions.length === 0) return { price: null, currency: 'USD', originalPrice: null, hasDiscount: false, discountPercent: 0, minParticipants: null, hasMultiplePriceTiers: false };
    
    // Verificar si hay múltiples priceTiers en alguna opción activa
    const hasMultiplePriceTiers = activeOptions.some(option => 
      option.pricingMode === 'PER_PERSON' && option.priceTiers && option.priceTiers.length > 1
    );
    
    // Siempre calcular el precio mínimo absoluto entre todos los tiers
    let minPrice = Infinity;
    let minCurrency = 'USD';
    let minOriginalPrice = Infinity;
    let hasDiscount = false;
    let discountPercent = 0;
    
    activeOptions.forEach(option => {
      let optionMinPrice = Infinity;
      
      let optionHasDiscount = false;
      let optionDiscountPercent = 0;
      
      // Si el pricingMode es PER_PERSON y hay priceTiers, buscar el precio mínimo absoluto
      if (option.pricingMode === 'PER_PERSON' && option.priceTiers && option.priceTiers.length > 0) {
        // Calcular el precio mínimo entre todos los tiers usando totalPrice directamente
        option.priceTiers.forEach((tier: any) => {
          const tierTotalPrice = tier.totalPrice || 0;
          
          // Aplicar descuento si existe
          let finalPrice = tierTotalPrice;
          if (option.specialOfferPercentage && option.specialOfferPercentage > 0) {
            finalPrice = tierTotalPrice - (tierTotalPrice * (option.specialOfferPercentage / 100));
            optionHasDiscount = true;
            optionDiscountPercent = option.specialOfferPercentage;
          }
          
          // Comparar precio total para encontrar el mínimo
          if (finalPrice < optionMinPrice) {
            optionMinPrice = finalPrice;
          }
        });
      } else {
        // Para otros modos de pricing, usar pricePerPerson directamente
        optionMinPrice = option.pricePerPerson || 0;
        
        // Verificar descuento para opciones sin priceTiers
        if (option.specialOfferPercentage && option.specialOfferPercentage > 0) {
          optionHasDiscount = true;
          optionDiscountPercent = option.specialOfferPercentage;
        }
      }
      
      // Aplicar descuento si existe specialOfferPercentage (para casos sin priceTiers)
      let finalPrice = optionMinPrice;
      if (optionHasDiscount && (!option.priceTiers || option.priceTiers.length === 0)) {
        const discount = optionMinPrice * (optionDiscountPercent / 100);
        finalPrice = optionMinPrice - discount;
      }
      
      // Actualizar el precio mínimo global
      if (finalPrice < minPrice) {
        minPrice = finalPrice;
        minOriginalPrice = optionHasDiscount ? optionMinPrice : finalPrice;
        minCurrency = option.currency;
        hasDiscount = optionHasDiscount;
        discountPercent = optionDiscountPercent;
      }
    });
    
    return { 
      price: minPrice === Infinity ? null : Math.round(minPrice * 100) / 100,
      originalPrice: minOriginalPrice === Infinity ? null : Math.round(minOriginalPrice * 100) / 100,
      currency: minCurrency,
      hasDiscount,
      discountPercent,
      minParticipants: hasMultiplePriceTiers ? getMinParticipantsForMinPrice() : null,
      hasMultiplePriceTiers
    };
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
            
            // Seleccionar automáticamente el primer horario disponible del día específico
            const availableSchedules = firstOption.schedules?.filter((schedule: Schedule) => {
              if (!selectedDate) return schedule.isActive;
              const customDayOfWeek = getCustomDayOfWeekFromDate(selectedDate);
              return schedule.dayOfWeek === customDayOfWeek && schedule.isActive;
            }) || [];
            
            if (availableSchedules.length > 0) {
              // Si hay horarios para el día seleccionado, usar el primero
              setSelectedTimeSlot(availableSchedules[0].startTime);
            } else if (firstOption.schedules && firstOption.schedules.length > 0) {
              // Si no hay horarios para el día específico, usar el primer horario disponible como fallback
              setSelectedTimeSlot(firstOption.schedules[0].startTime);
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
                <div className="mb-2">
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
                      {getTranslation('detail.booking.provider', language)}: {activity.supplier.name}
                    </span>
                    {activity.supplier.isVerified && (
                      <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>
                        <i className="fas fa-check-circle me-1"></i>
                        {getTranslation('detail.booking.verified', language)}
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
                        {getMinPrice().price !== null ? (
                          <>
                            <small className="text-muted">{getTranslation('detail.booking.from', language)}</small>
                            
                              {getMinPrice().hasDiscount && (
                               <div className="d-flex flex-start align-items-center">
                                <span className="badge bg-danger">-{getMinPrice().discountPercent}%</span>
                                <span className="text-muted text-decoration-line-through m-1" style={{ fontSize: '0.9rem' }}>
                                  {currency === 'PEN' ? 'S/ ' : '$ '}{Math.ceil(getMinPrice().originalPrice || 0)?.toFixed(2)}
                                </span>
                               </div>
                              )}
                               <div className={`h4 fw-bold mb-0 ${getMinPrice().hasDiscount ? 'text-danger' : 'text-dark'}`}>
                                 {currency === 'PEN' ? 'S/ ' : '$ '}{Math.ceil(getMinPrice().price || 0)?.toFixed(2) || '0.00'}
                               </div>
                             
                              <small className="text-muted" style={{ marginTop: '-4px' }}>{getTranslation('detail.booking.perPerson', language)}</small>
                              
                              {/* Mostrar "a partir de X personas" solo si hay múltiples priceTiers */}
                              {getMinPrice().hasMultiplePriceTiers && getMinPrice().minParticipants !== null && getMinPrice().minParticipants !== undefined && (
                                <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                  {getTranslationWithParams('detail.booking.fromParticipants', language, {
                                    count: getMinPrice().minParticipants || 0,
                                    plural: getMinPrice().minParticipants === 1 
                                      ? getTranslation('detail.booking.participantSingular', language)
                                      : getTranslation('detail.booking.participantPlural', language)
                                  })}
                                </small>
                              )}
                          </>
                        ) : (
                          <div className="h3 fw-bold text-dark mb-0">
                            {getTranslation('detail.booking.contactForPrice', language)}
                          </div>
                        )}
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
                          const availableSchedules = getSchedulesForSelectedDate();
                          if (availableSchedules.length === 1) {
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
                        const availableSchedules = getSchedulesForSelectedDate();
                        
                        if (availableSchedules.length === 0) {
                          // No mostrar nada si no hay horarios disponibles
                          return (
                            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                              {language === 'es' 
                                ? 'No hay horarios disponibles para esta fecha.'
                                : 'No schedules available for this date.'
                              }
                            </div>
                          );
                        } else if (availableSchedules.length === 1) {
                          // Mostrar como texto en negrita cuando hay solo un horario
                          return (
                            <div className="d-flex align-items-center">
                              <span className="fw-bold text-muted" style={{ fontSize: '1rem',margin:0,padding:0 }}>
                                {convertTo12HourFormat(availableSchedules[0].startTime)}
                              </span>
                            </div>
                          );
                        } else {
                          // Mostrar botones cuando hay múltiples horarios
                          return (
                            <div className="d-flex gap-2">
                              {availableSchedules.map((schedule: Schedule, index: number) => (
                                <button 
                                  key={index}
                                  className={`btn ${selectedTimeSlot === schedule.startTime ? 'btn-primary' : 'btn-outline-primary'}`}
                                  onClick={() => handleTimeSlotSelect(schedule.startTime)}
                                  style={{ 
                                    fontSize: '0.875rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: selectedTimeSlot === schedule.startTime ? 'none' : '1px solid #007bff'
                                  }}
                                >
                                  {convertTo12HourFormat(schedule.startTime)}
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
                                    {currency === 'PEN' ? 'S/ ' : '$ '}{((Math.ceil(getOriginalPrice())*numberOfPeople)).toFixed(2)}
                                  </span>
                                  <span className="text-success fw-bold" style={{ fontSize: '0.9rem' }}>
                                    {getTranslation('activity.youSave', language)} {currency === 'PEN' ? 'S/ ' : '$ '}{(Math.ceil(getOriginalPrice())*numberOfPeople - Math.ceil(calculateTotalPrice())*numberOfPeople).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                            <span className="h4 fw-bold text-danger me-2" style={{ fontSize: '1.5rem' }}>
                              {currency === 'PEN' ? 'S/ ' : '$ '}{(Math.ceil(calculateTotalPrice())*numberOfPeople).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>
                            {numberOfPeople} {language === 'es' 
                              ? (numberOfPeople === 1 ? 'Viajero' : 'Viajeros') 
                              : (numberOfPeople === 1 ? 'Traveler' : 'Travelers')
                            } x {currency === 'PEN' ? 'S/ ' : '$ '}{(Math.ceil(calculateTotalPrice())).toFixed(2)}
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
                                  {getTranslation('cart.adding', language)}
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
                  {getMinPrice().price !== null ? (
                    <>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                        {getTranslation('detail.booking.from', language)}
                      </small>
                      <div className="d-flex flex-column gap-2 mb-1">
                        
                        {getMinPrice().hasDiscount && (
                          <div className="d-flex flex-start align-items-center">
                            <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>-{getMinPrice().discountPercent}%</span>
                            <span className="text-muted text-decoration-line-through" style={{ fontSize: '0.75rem' }}>
                              {currency === 'PEN' ? 'S/ ' : '$ '}{Math.ceil(getMinPrice().originalPrice || 0)?.toFixed(2)}
                            </span>
                          </div>
                        )}
                         <div className={`h5 fw-bold mb-0 ${getMinPrice().hasDiscount ? 'text-danger' : 'text-dark'}`} style={{ margin: '0px', padding: '0px' }}>
                           {currency === 'PEN' ? 'S/ ' : '$ '}{Math.ceil(getMinPrice().price || 0)?.toFixed(2) || '0.00'}
                         </div>
                        </div>
                        <small className="text-muted" style={{ fontSize: '0.7rem', marginTop: '-14px' }}>
                          {getTranslation('detail.booking.perPerson', language)}
                        </small>
                        
                        {/* Mostrar "a partir de X personas" solo si hay múltiples priceTiers */}
                        {getMinPrice().hasMultiplePriceTiers && getMinPrice().minParticipants !== null && getMinPrice().minParticipants !== undefined && (
                          <small className="text-muted d-block" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                            {getTranslationWithParams('detail.booking.fromParticipants', language, {
                              count: getMinPrice().minParticipants || 0,
                              plural: getMinPrice().minParticipants === 1 
                                ? getTranslation('detail.booking.participantSingular', language)
                                : getTranslation('detail.booking.participantPlural', language)
                            })}
                          </small>
                        )}
                    </>
                  ) : (
                    <div className="h6 fw-bold text-dark mb-0">
                      {getTranslation('detail.booking.contactForPrice', language)}
                    </div>
                  )}
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
    </div>
  );
};

export default ActivityDetail; 