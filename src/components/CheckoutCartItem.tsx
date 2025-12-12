import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { activitiesApi } from '../api/activities';
import { ordersItemApi } from '../api/ordersItem';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getLanguageName } from '../utils/translations';
import { convertLocalDateTimeToUTC, convertUTCToLocalDateTime } from '../utils/dateUtils';
import RatingStars from './RatingStars';

export interface CheckoutSummaryItem {
  id: string;
  activityId: string;
  bookingOptionId?: string;
  orderItemId?: number; // ID del order item para actualizaciones
  orderId?: string; // ID de la orden
  title: string;
  imageUrl: string;
  language?: string;
  languageCode?: string;
  meetingPoint?: string;
  meetingAddress?: string;
  comment?: string;
  date?: string;
  time?: string;
  travelers: {
    adults: number;
    children: number;
  };
  participants?: number; // Total de participantes (adults + children)
  unitPrice: number;
  totalPrice: number;
  currency: string;
  rating?: number | null;
  commentsCount?: number | null;
  meetingPickupPlaceId?: number | null;
  meetingPickupPointLatitude?: number | null;
  meetingPickupPointLongitude?: number | null;
  cancelUntilDate?: string | null; // Fecha límite para cancelar
  timeZone?: string; // Zona horaria de la actividad
}

const capitalizeWords = (value?: string): string => {
  if (!value) return '';
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface CheckoutCartItemProps {
  item: CheckoutSummaryItem;
  language: string;
  formatCurrency: (value: number, currency: string) => string;
  formatDate: (date?: string) => string;
  formatTravelers: (item: CheckoutSummaryItem) => string;
  onRemoveItem?: (itemId: string) => void;
  onEditLanguage?: (item: CheckoutSummaryItem, languageCode: string, languageName: string) => void;
  onEditMeetingPoint?: (item: CheckoutSummaryItem, pickupPoint: { id?: number | string | null; name: string; address: string; latitude?: number | null; longitude?: number | null; cityId?: number | null } | null, meetingPoint: string, meetingAddress: string) => void;
  onEditComment?: (item: CheckoutSummaryItem, comment: string) => void;
  onEditDate?: (item: CheckoutSummaryItem, payload: { date: string; time?: string }) => void;
  onEditTravelers?: (item: CheckoutSummaryItem, travelers: { adults: number; children: number }) => void;
  onTotalsChange?: (itemId: string, totals: {
    discountedTotal: number;
    regularTotal: number;
    discountedUnitPrice: number;
    baseUnitPrice: number;
    currency: string;
    hasDiscount: boolean;
    travelerCount: number;
    specialOfferPercentage: number | null;
  }) => void;
  readOnly?: boolean; // Si es true, deshabilita todas las ediciones y oculta el mensaje de cancelación
}

const CheckoutCartItem: React.FC<CheckoutCartItemProps> = ({
  item,
  language,
  formatCurrency,
  formatDate,
  formatTravelers,
  onRemoveItem,
  onEditLanguage,
  onEditMeetingPoint,
  onEditComment,
  onEditDate,
  onEditTravelers,
  onTotalsChange,
  readOnly = false,
}) => {
  const hasChildren = (item.travelers?.children ?? 0) > 0;
  const { language: appLanguage } = useLanguage();
  const { currency } = useCurrency();
  const [enrichedDetails, setEnrichedDetails] = useState({
    language: item.language,
    meetingPoint: item.meetingPoint,
    meetingAddress: item.meetingAddress,
    imageUrl: item.imageUrl,
    comment: item.comment || '',
  });
  const [rating, setRating] = useState<number | null>(item.rating ?? null);
  const [commentsCount, setCommentsCount] = useState<number | null>(item.commentsCount ?? null);
  const [fullActivity, setFullActivity] = useState<any>(null); // Guardar la actividad completa
  const [availableLanguages, setAvailableLanguages] = useState<{ code: string; name: string }[]>([]);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string | undefined>(item.languageCode);
  const [isEditingLanguageLocal, setIsEditingLanguageLocal] = useState(false);
  const [pendingLanguageCode, setPendingLanguageCode] = useState<string | undefined>(item.languageCode);
  const [isSavingLanguageLocal, setIsSavingLanguageLocal] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isEditingCommentLocal, setIsEditingCommentLocal] = useState(false);
  const [pendingComment, setPendingComment] = useState(item.comment || '');
  const [isSavingCommentLocal, setIsSavingCommentLocal] = useState(false);
  const [meetingTypeLocal, setMeetingTypeLocal] = useState<string | undefined>(undefined);
  const [pickupOptions, setPickupOptions] = useState<{ id?: string; name: string; address: string; latitude?: number | null; longitude?: number | null; cityId?: number | null }[]>([]);
  const [isEditingMeetingPointLocal, setIsEditingMeetingPointLocal] = useState(false);
  const [pendingPickupPointId, setPendingPickupPointId] = useState<string | undefined>(undefined);
  const [isSavingMeetingPointLocal, setIsSavingMeetingPointLocal] = useState(false);
  const [isEditingTravelersLocal, setIsEditingTravelersLocal] = useState(false);
  const [pendingAdults, setPendingAdults] = useState(Number(item.travelers.adults) || 1);
  const [pendingChildren, setPendingChildren] = useState(Number(item.travelers.children) || 0);
  const [isSavingTravelersLocal, setIsSavingTravelersLocal] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isEditingDateLocal, setIsEditingDateLocal] = useState(false);
  const [isSavingDateLocal, setIsSavingDateLocal] = useState(false);
  const [pendingDate, setPendingDate] = useState(item.date || '');
  const [pendingTime, setPendingTime] = useState(item.time || '');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [displayDate, setDisplayDate] = useState(item.date || '');
  const [displayTime, setDisplayTime] = useState(item.time || '');
  const [activityTimeZone, setActivityTimeZone] = useState<string>(item.timeZone || '');
  const [pricingData, setPricingData] = useState<{ baseUnitPrice: number; discountedUnitPrice: number; specialOfferPercentage: number | null }>(() => ({
    baseUnitPrice: item.unitPrice ?? 0,
    discountedUnitPrice: item.unitPrice ?? 0,
    specialOfferPercentage: null,
  }));
  // Usar participants si está disponible, si no calcular desde travelers
  const travelerCount = Math.max(item.participants ?? ((item.travelers?.adults ?? 0) + (item.travelers?.children ?? 0)), 1);
  const hasDiscount = (pricingData.specialOfferPercentage ?? 0) > 0;
  const originalTotalPrice = pricingData.baseUnitPrice * travelerCount;
  const discountedTotalPrice = pricingData.discountedUnitPrice * travelerCount;
  const savingsAmount = hasDiscount ? Math.max(originalTotalPrice - discountedTotalPrice, 0) : 0;
  const displayedTotal = hasDiscount ? discountedTotalPrice : (item.totalPrice ?? discountedTotalPrice);

  const todayIsoString = useMemo(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().split('T')[0];
  }, []);

  // Función para convertir hora de formato 24h a AM/PM
  const formatTimeToAMPM = (time24: string): string => {
    if (!time24) return '';
    
    try {
      // Extraer horas y minutos del formato HH:mm o HH:mm:ss
      const timeParts = time24.split(':');
      if (timeParts.length < 2) return time24;
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      
      if (isNaN(hours) || hours < 0 || hours > 23) return time24;
      
      // Convertir a formato AM/PM
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${hours12}:${minutes} ${period}`;
    } catch {
      return time24;
    }
  };

  // Función para formatear la zona horaria
  const formatTimeZone = (timeZone: string): string => {
    if (!timeZone) return '';
    
    try {
      // Si tiene formato "Continent/City", mostrar de forma legible
      if (timeZone.includes('/')) {
        const parts = timeZone.split('/');
        if (parts.length >= 2) {
          // Mostrar "City, Continent" o solo "City" dependiendo del idioma
          const city = parts[parts.length - 1].replace(/_/g, ' ');
          const continent = parts[0].replace(/_/g, ' ');
          
          // Traducir nombres comunes de continentes
          const continentMap: Record<string, { es: string; en: string }> = {
            'America': { es: 'América', en: 'America' },
            'Europe': { es: 'Europa', en: 'Europe' },
            'Asia': { es: 'Asia', en: 'Asia' },
            'Africa': { es: 'África', en: 'Africa' },
            'Australia': { es: 'Australia', en: 'Australia' },
            'Pacific': { es: 'Pacífico', en: 'Pacific' },
            'Atlantic': { es: 'Atlántico', en: 'Atlantic' },
            'Indian': { es: 'Índico', en: 'Indian' },
            'Antarctica': { es: 'Antártida', en: 'Antarctica' },
          };
          
          const translatedContinent = (continentMap[continent as keyof typeof continentMap]?.[language as 'es' | 'en']) || continent;
          
          // Formatear como "City, Continent" (ej: "Lima, América")
          return `${city}, ${translatedContinent}`;
        }
      }
      
      // Si no tiene formato estándar, devolver tal cual
      return timeZone.replace(/_/g, ' ');
    } catch {
      // Si falla, devolver el timeZone original reemplazando guiones bajos por espacios
      return timeZone.replace(/_/g, ' ');
    }
  };

  // Función para verificar si aún se puede cancelar y formatear el mensaje
  const getCancellationInfo = useMemo(() => {
    if (!item.cancelUntilDate) {
      return null;
    }

    try {
      const cancelDate = new Date(item.cancelUntilDate);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      cancelDate.setHours(0, 0, 0, 0);

      const canCancel = cancelDate >= now;
      const daysUntilDeadline = Math.ceil((cancelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Formatear fecha según el idioma
      const formattedDate = cancelDate.toLocaleDateString(
        language === 'es' ? 'es-ES' : 'en-US',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }
      );

      return {
        canCancel,
        deadline: formattedDate,
        daysUntilDeadline,
        rawDate: item.cancelUntilDate
      };
    } catch (error) {
      console.error('Error parsing cancelUntilDate:', error);
      return null;
    }
  }, [item.cancelUntilDate, language]);

  const fetchSchedulesForDate = useCallback(
    async (targetDate: string, currentTime?: string) => {
      if (!item.activityId) {
        return;
      }

      const adultsForQuery = pendingAdults ?? item.travelers.adults;
      const childrenForQuery = pendingChildren ?? item.travelers.children;

      setIsLoadingSchedules(true);
      setDateError(null);

      try {
        const activity = await activitiesApi.getById(
          item.activityId,
          appLanguage,
          currency,
          targetDate,
          adultsForQuery,
          childrenForQuery
        );

        const bookingOption = activity.bookingOptions?.find((option) => option.id === item.bookingOptionId)
          || activity.bookingOptions?.[0];

        // Usar schedulesTimes directamente de la API (ya viene filtrado por fecha)
        const times = (bookingOption?.schedulesTimes || []) as string[];

        setAvailableTimes(times);

        if (times.length > 0) {
          const normalizedTime = currentTime && times.includes(currentTime) ? currentTime : times[0];
          setPendingTime(normalizedTime);
        } else if (currentTime) {
          setPendingTime(currentTime);
        } else {
          setPendingTime('');
        }

        // Actualizar el precio cuando se cambia la fecha
        if (bookingOption) {
          const priceAfterDiscount = bookingOption?.priceAfterDiscount ?? null;
          const normalPrice = bookingOption?.normalPrice ?? null;
          const unitPrice = bookingOption?.unitPrice ?? null;
          const pricePerPerson = bookingOption?.pricePerPerson ?? null;
          const specialOfferPercentage = bookingOption?.specialOfferPercentage ?? null;

          // Precio con descuento (prioridad: priceAfterDiscount > unitPrice > pricePerPerson)
          const discountedUnitPrice = priceAfterDiscount ?? unitPrice ?? pricePerPerson ?? item.unitPrice ?? 0;
          
          // Precio normal/base (prioridad: normalPrice > unitPrice > pricePerPerson)
          const baseUnitPrice = normalPrice ?? unitPrice ?? pricePerPerson ?? item.unitPrice ?? 0;

          setPricingData({
            baseUnitPrice: Math.max(baseUnitPrice, 0),
            discountedUnitPrice: Math.max(discountedUnitPrice, 0),
            specialOfferPercentage,
          });
        }
      } catch (error) {
        console.error('Error fetching schedules for date:', error);
        setAvailableTimes([]);
        setDateError(
          language === 'es'
            ? 'No se pudieron cargar los horarios para la fecha seleccionada.'
            : 'Unable to load schedules for the selected date.'
        );
      } finally {
        setIsLoadingSchedules(false);
      }
    },
    [item.activityId, item.bookingOptionId, item.travelers.adults, item.travelers.children, pendingAdults, pendingChildren, appLanguage, currency, language, item.unitPrice]
  );

  useEffect(() => {
    // Cuando recibimos item.date y item.time del backend, están en UTC
    // Debemos convertirlos a la zona horaria local para mostrarlos
    if (item.date) {
      const timeZone = activityTimeZone || 'America/Lima';
      
      // Si también hay hora, convertir fecha+hora juntas
      if (item.time) {
        const utcDateTime = `${item.date}T${item.time}`;
        try {
          const localDateTime = convertUTCToLocalDateTime(utcDateTime, timeZone);
          const [localDate, localTime] = localDateTime.split('T');
          setDisplayDate(localDate || item.date);
          setDisplayTime(localTime || item.time);
          setPendingDate(localDate || item.date);
          setPendingTime(localTime || item.time);
        } catch (error) {
          console.error('Error converting UTC to local time:', error);
          // Fallback: usar valores originales
          setDisplayDate(item.date);
          setDisplayTime(item.time || '');
          setPendingDate(item.date);
          setPendingTime(item.time || '');
        }
      } else {
        // Solo fecha, convertir solo la fecha (usar mediodía como hora de referencia)
        try {
          const utcDateTime = `${item.date}T12:00:00`;
          const localDateTime = convertUTCToLocalDateTime(utcDateTime, timeZone);
          const [localDate] = localDateTime.split('T');
          setDisplayDate(localDate || item.date);
          setPendingDate(localDate || item.date);
          setDisplayTime('');
          setPendingTime('');
        } catch (error) {
          console.error('Error converting UTC to local date:', error);
          setDisplayDate(item.date);
          setPendingDate(item.date);
          setDisplayTime('');
          setPendingTime('');
        }
      }
    } else {
      setDisplayDate('');
      setDisplayTime('');
      setPendingDate('');
      setPendingTime('');
    }
  }, [item.date, item.time, activityTimeZone]);

  useEffect(() => {
    setRating(item.rating ?? null);
    setCommentsCount(item.commentsCount ?? null);
  }, [item.rating, item.commentsCount]);

  useEffect(() => {
    if (isEditingDateLocal && pendingDate) {
      fetchSchedulesForDate(pendingDate, pendingTime || item.time || undefined);
    }
  }, [isEditingDateLocal, pendingDate, pendingAdults, pendingChildren, fetchSchedulesForDate, pendingTime, item.time]);

  useEffect(() => {
    if (!onTotalsChange) {
      return;
    }

    // Si hay descuento, usar los totales calculados
    // Si no hay descuento, preferir item.totalPrice (ya viene calculado desde la API) si está disponible
    const finalDiscountedTotal = hasDiscount ? discountedTotalPrice : (item.totalPrice ?? discountedTotalPrice);
    const finalRegularTotal = hasDiscount ? originalTotalPrice : (item.totalPrice ?? originalTotalPrice);

    onTotalsChange(item.id, {
      discountedTotal: finalDiscountedTotal,
      regularTotal: finalRegularTotal,
      discountedUnitPrice: pricingData.discountedUnitPrice,
      baseUnitPrice: pricingData.baseUnitPrice,
      currency: item.currency || currency,
      hasDiscount,
      travelerCount,
      specialOfferPercentage: pricingData.specialOfferPercentage ?? null,
    });
  }, [onTotalsChange, item.id, discountedTotalPrice, originalTotalPrice, pricingData.discountedUnitPrice, pricingData.baseUnitPrice, pricingData.specialOfferPercentage, item.currency, currency, hasDiscount, travelerCount, item.totalPrice]);

  useEffect(() => {
    let isMounted = true;

    const fetchActivityDetails = async () => {
      if (!item.activityId) {
        setIsLoadingData(false);
        return;
      }

      try {
        const activity = await activitiesApi.getById(
          item.activityId,
          appLanguage,
          currency,
          item.date,
          item.travelers.adults,
          item.travelers.children
        );
        if (!isMounted || !activity) {
          if (isMounted) {
            setIsLoadingData(false);
          }
          return;
        }

        // Guardar la actividad completa para usarla en updateOrderItem
        setFullActivity(activity);

        const bookingOption = activity.bookingOptions?.find((option) => option.id === item.bookingOptionId)
          || activity.bookingOptions?.[0];

        // Obtener la zona horaria desde bookingOption.timeZone o orderItem.timeZone
        const timeZone = (bookingOption as any)?.timeZone || item.timeZone;
        if (timeZone) {
          setActivityTimeZone(timeZone);
        }

        setMeetingTypeLocal(bookingOption?.meetingType);

        const coverImage = activity.images?.find((img) => img.isCover) || activity.images?.[0];

        // Obtener rating y commentsCount de la actividad
        setRating(activity.rating ?? null);
        setCommentsCount(activity.commentsCount ?? null);

        // Usar directamente los campos del API: priceAfterDiscount, normalPrice, unitPrice, pricePerPerson
        const priceAfterDiscount = bookingOption?.priceAfterDiscount ?? null;
        const normalPrice = bookingOption?.normalPrice ?? null;
        const unitPrice = bookingOption?.unitPrice ?? null;
        const pricePerPerson = bookingOption?.pricePerPerson ?? null;
        const specialOfferPercentage = bookingOption?.specialOfferPercentage ?? null;

        // Precio con descuento (prioridad: priceAfterDiscount > unitPrice > pricePerPerson)
        const discountedUnitPrice = priceAfterDiscount ?? unitPrice ?? pricePerPerson ?? item.unitPrice ?? 0;
        
        // Precio normal/base (prioridad: normalPrice > unitPrice > pricePerPerson)
        const baseUnitPrice = normalPrice ?? unitPrice ?? pricePerPerson ?? item.unitPrice ?? 0;

        setPricingData({
          baseUnitPrice: Math.max(baseUnitPrice, 0),
          discountedUnitPrice: Math.max(discountedUnitPrice, 0),
          specialOfferPercentage,
        });

        const languagesList = bookingOption?.languages?.map((code) => ({
          code,
          name: getLanguageName(code, appLanguage),
        })) || [];
        setAvailableLanguages(languagesList);

        let resolvedLanguageCode = item.languageCode;
        if (!resolvedLanguageCode && item.language && languagesList.length > 0) {
          const match = languagesList.find((lang) => lang.name.toLowerCase() === item.language?.toLowerCase());
          if (match) {
            resolvedLanguageCode = match.code;
          }
        }
        if (!resolvedLanguageCode && languagesList.length > 0) {
          resolvedLanguageCode = languagesList[0].code;
        }
        setSelectedLanguageCode(resolvedLanguageCode);
        setPendingLanguageCode(resolvedLanguageCode);
        const resolvedLanguage = resolvedLanguageCode
          ? getLanguageName(resolvedLanguageCode, appLanguage)
          : item.language;

        let resolvedMeetingPoint = item.meetingPoint;
        let resolvedMeetingAddress = item.meetingAddress;
        let resolvedPickupPointId: string | undefined;
        let resolvedPickupOptions: typeof pickupOptions = [];

        if (bookingOption?.pickupPoints?.length) {
          resolvedPickupOptions = bookingOption.pickupPoints.map((point) => ({
            id: point.id != null ? String(point.id) : undefined,
            name: point.name || point.address,
            address: point.address || '',
            latitude: point.latitude ?? null,
            longitude: point.longitude ?? null,
            cityId: point.city?.id ?? null,
          }));

          const pickupMatch = bookingOption.pickupPoints.find((point) => (
            point.name === item.meetingPoint ||
            point.address === item.meetingAddress
          ));

          if (pickupMatch) {
            resolvedMeetingPoint = pickupMatch.name || resolvedMeetingPoint;
            resolvedMeetingAddress = pickupMatch.address || resolvedMeetingAddress;
            resolvedPickupPointId = pickupMatch.id != null ? String(pickupMatch.id) : undefined;
          } else if (bookingOption.pickupPoints[0]) {
            const fallback = bookingOption.pickupPoints[0];
            resolvedMeetingPoint = fallback.name || fallback.address || resolvedMeetingPoint;
            resolvedMeetingAddress = fallback.address || resolvedMeetingAddress;
            resolvedPickupPointId = fallback.id != null ? String(fallback.id) : undefined;
          }
        } else {
          if (bookingOption?.meetingPointDescription?.length) {
            resolvedMeetingPoint = bookingOption.meetingPointDescription[0] || resolvedMeetingPoint;
          }

          if (bookingOption?.meetingPointAddress) {
            resolvedMeetingAddress = bookingOption.meetingPointAddress || resolvedMeetingAddress;
          }
        }

        setPickupOptions(resolvedPickupOptions);
        setPendingPickupPointId(resolvedPickupPointId);

        setEnrichedDetails({
          language: resolvedLanguage,
          meetingPoint: resolvedMeetingPoint,
          meetingAddress: resolvedMeetingAddress,
          imageUrl: coverImage?.imageUrl || item.imageUrl,
          comment: item.comment || '',
        });
        setIsLoadingData(false);
      } catch (error) {
        console.error('Error fetching activity details for checkout summary item:', error);
        if (isMounted) {
          setEnrichedDetails({
            language: item.language,
            meetingPoint: item.meetingPoint,
            meetingAddress: item.meetingAddress,
            imageUrl: item.imageUrl,
            comment: item.comment || '',
          });
          setAvailableLanguages([]);
          setSelectedLanguageCode(item.languageCode);
          setPendingLanguageCode(item.languageCode);
          setIsLoadingData(false);
          setPickupOptions([]);
          setPendingPickupPointId(undefined);
          setMeetingTypeLocal(undefined);
          setPricingData({
            baseUnitPrice: item.unitPrice ?? 0,
            discountedUnitPrice: item.unitPrice ?? 0,
            specialOfferPercentage: null,
          });
        }
      }
    };

    setEnrichedDetails({
      language: item.language,
      meetingPoint: item.meetingPoint,
      meetingAddress: item.meetingAddress,
      imageUrl: item.imageUrl,
      comment: item.comment || '',
    });
    setAvailableLanguages([]);
    setSelectedLanguageCode(item.languageCode);
    setPendingLanguageCode(item.languageCode);
    setIsLoadingData(true);
    setPendingComment(item.comment || '');
    setIsEditingCommentLocal(false);
    setIsSavingCommentLocal(false);
    setPickupOptions([]);
    setMeetingTypeLocal(undefined);
    setPendingPickupPointId(undefined);
    setPendingAdults(item.travelers.adults);
    setPendingChildren(item.travelers.children);
    setIsEditingTravelersLocal(false);
    setIsSavingTravelersLocal(false);
    setPricingData({
      baseUnitPrice: item.unitPrice ?? 0,
      discountedUnitPrice: item.unitPrice ?? 0,
      specialOfferPercentage: null,
    });
    setPendingDate(item.date || '');
    setPendingTime(item.time || '');
    setDisplayDate(item.date || '');
    setDisplayTime(item.time || '');
    setActivityTimeZone(item.timeZone || '');
    setAvailableTimes([]);
    setDateError(null);

    fetchActivityDetails();

    return () => {
      isMounted = false;
    };
  }, [item.activityId, item.bookingOptionId, item.date, item.language, item.meetingPoint, item.meetingAddress, item.travelers.adults, item.travelers.children, item.time, appLanguage, currency]);

  useEffect(() => {
    if (!isEditingCommentLocal) {
      setEnrichedDetails((prev) => ({
        ...prev,
        comment: item.comment || '',
      }));
      setPendingComment(item.comment || '');
    }
  }, [item.comment, isEditingCommentLocal]);

  // Función auxiliar para normalizar el tiempo a formato HH:mm:ss
  const normalizeTimeTo24Hour = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '00:00:00';
    
    let cleaned = timeStr.trim().toUpperCase();
    
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleaned)) {
      return cleaned.length === 5 ? `${cleaned}:00` : cleaned;
    }
    
    const amPmMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (amPmMatch) {
      let hours = parseInt(amPmMatch[1], 10);
      const minutes = amPmMatch[2];
      const period = amPmMatch[3];
      
      if (period === 'AM') {
        if (hours === 12) hours = 0;
      } else {
        if (hours !== 12) hours += 12;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
    }
    
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

  // Función para actualizar el order item usando la API
  const updateOrderItem = async (updates: {
    guideLanguage?: string;
    specialRequest?: string;
    date?: string;
    time?: string;
    adults?: number;
    children?: number;
    meetingPickupPlaceId?: number | null;
    meetingPickupPointName?: string | null;
    meetingPickupPointAddress?: string | null;
    meetingPickupPointLatitude?: number | null;
    meetingPickupPointLongitude?: number | null;
    pricePerParticipant?: number; // Precio unitario por participante (opcional)
  }) => {
    if (!item.orderItemId || !item.activityId || !item.bookingOptionId) {
      console.warn('No se puede actualizar: faltan datos del order item');
      return;
    }

    try {
      // Construir startDatetime en UTC
      // displayDate y displayTime siempre contienen valores en formato local (convertidos de UTC cuando se reciben del backend)
      // Por lo tanto, siempre debemos convertirlos a UTC antes de enviar al backend
      let startDatetimeUTC = '';
      
      // Si se está actualizando fecha/hora explícitamente, los valores ya vienen en UTC desde handleSaveDate
      if (updates.date !== undefined || updates.time !== undefined) {
        const dateToUse = updates.date !== undefined ? updates.date : (displayDate || item.date || '');
        const timeToUse = updates.time !== undefined ? updates.time : (displayTime || item.time || '');
        
        // Normalizar el tiempo
        const normalizedTime = normalizeTimeTo24Hour(timeToUse);
        
        if (dateToUse) {
          const timeForDatetime = normalizedTime || '00:00:00';
          startDatetimeUTC = `${dateToUse}T${timeForDatetime}`;
        }
      } else {
        // Si NO se está actualizando la fecha explícitamente, usar displayDate/displayTime (valores locales)
        // y convertirlos a UTC antes de enviar
        const localDateToUse = displayDate || item.date || '';
        const localTimeToUse = displayTime || item.time || '';
        
        if (localDateToUse) {
          // Normalizar el tiempo
          const normalizedTime = normalizeTimeTo24Hour(localTimeToUse);
          
          // Obtener el timeZone del bookingOption
          const bookingOption = fullActivity?.bookingOptions?.find((option: any) => option.id === item.bookingOptionId)
            || fullActivity?.bookingOptions?.[0];
          const timeZone = (bookingOption as any)?.timeZone || activityTimeZone || 'America/Lima';
          
          // Construir la fecha/hora local
          const localDateTime = `${localDateToUse}T${normalizedTime || '00:00:00'}`;
          
          // Convertir de local a UTC usando el timeZone
          const utcDateTime = convertLocalDateTimeToUTC(localDateTime, timeZone);
          
          // Extraer fecha y hora del resultado UTC (sin el +00:00)
          startDatetimeUTC = utcDateTime.replace('+00:00', '');
        }
      }
      
      // Obtener adultos y niños actualizados
      const adultsToUse = updates.adults ?? item.travelers.adults;
      const childrenToUse = updates.children ?? item.travelers.children;

      // Validar moneda
      const orderCurrency = (item.currency === 'USD' || item.currency === 'PEN' || item.currency === 'EUR') 
        ? (item.currency as 'USD' | 'PEN') 
        : 'USD';

      // Determinar el precio unitario por participante
      // Si se proporciona explícitamente en updates, usarlo
      // Si se está actualizando la fecha, usar el precio actualizado de pricingData
      // Si no, usar el precio del item
      let pricePerParticipantToUse: number;
      if (updates.pricePerParticipant !== undefined) {
        pricePerParticipantToUse = updates.pricePerParticipant;
      } else if (updates.date !== undefined) {
        // Cuando se actualiza la fecha, usar el precio actualizado de pricingData
        pricePerParticipantToUse = pricingData.discountedUnitPrice || item.unitPrice || 0;
      } else {
        // Para otras actualizaciones, usar el precio del item
        pricePerParticipantToUse = item.unitPrice || 0;
      }

      // Validar que tenemos el activityId
      if (!item.activityId) {
        throw new Error(language === 'es' ? 'No se pudo obtener el ID de la actividad' : 'Could not get activity ID');
      }

      // Construir el request
      const orderItemRequest = {
        activityId: item.activityId,
        bookingOptionId: item.bookingOptionId,
        currency: orderCurrency,
        adults: adultsToUse,
        children: childrenToUse,
        pricePerParticipant: pricePerParticipantToUse,
        startDatetime: startDatetimeUTC,
        specialRequest: updates.specialRequest !== undefined ? (updates.specialRequest || null) : (item.comment || null),
        meetingPickupPlaceId: updates.meetingPickupPlaceId !== undefined ? updates.meetingPickupPlaceId : (item.meetingPickupPlaceId ?? null),
        meetingPickupPointName: updates.meetingPickupPointName !== undefined ? updates.meetingPickupPointName : (item.meetingPoint || null),
        meetingPickupPointAddress: updates.meetingPickupPointAddress !== undefined ? updates.meetingPickupPointAddress : (item.meetingAddress || null),
        meetingPickupPointLatitude: updates.meetingPickupPointLatitude !== undefined ? updates.meetingPickupPointLatitude : (item.meetingPickupPointLatitude ?? null),
        meetingPickupPointLongitude: updates.meetingPickupPointLongitude !== undefined ? updates.meetingPickupPointLongitude : (item.meetingPickupPointLongitude ?? null),
        guideLanguage: updates.guideLanguage !== undefined ? (updates.guideLanguage || null) : (item.languageCode || null),
        status: 'PENDING' as const,
      };

      const response = await ordersItemApi.addOrderItem(orderItemRequest);

      if (response?.success) {
        console.log('✅ Order item actualizado exitosamente');
        // Emitir evento para actualizar el carrito
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        return true;
      } else {
        console.error('❌ Error al actualizar order item:', response?.message);
        throw new Error(response?.message || (language === 'es' ? 'Error desconocido' : 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error al actualizar order item:', error);
      throw error; // Re-lanzar el error para que handleSaveDate lo maneje
    }
  };

  const handleLanguageSelect = (code: string) => {
    setPendingLanguageCode(code);
  };

  const handleSaveLanguage = async () => {
    if (!pendingLanguageCode) {
      return;
    }
    setIsSavingLanguageLocal(true);
    const languageName = getLanguageName(pendingLanguageCode, appLanguage);
    
    try {
      // Actualizar usando la API
      await updateOrderItem({ guideLanguage: pendingLanguageCode });
      
      setSelectedLanguageCode(pendingLanguageCode);
      setEnrichedDetails((prev) => ({
        ...prev,
        language: languageName,
      }));
      
      if (onEditLanguage) {
        onEditLanguage(item, pendingLanguageCode, languageName);
      }
      setIsEditingLanguageLocal(false);
    } catch (error) {
      console.error('Error al guardar idioma:', error);
    } finally {
      setIsSavingLanguageLocal(false);
    }
  };

  const handleCancelLanguageEdit = () => {
    setPendingLanguageCode(selectedLanguageCode);
    setIsEditingLanguageLocal(false);
  };

  const handleSaveComment = async () => {
    setIsSavingCommentLocal(true);
    const commentToSave = pendingComment;
    
    try {
      // Actualizar usando la API
      await updateOrderItem({ specialRequest: commentToSave });
      
      setEnrichedDetails((prev) => ({
        ...prev,
        comment: commentToSave,
      }));
      
      if (onEditComment) {
        onEditComment({ ...item, comment: commentToSave }, commentToSave);
      }
      setIsEditingCommentLocal(false);
    } catch (error) {
      console.error('Error al guardar comentario:', error);
    } finally {
      setIsSavingCommentLocal(false);
    }
  };

  const handleCancelCommentEdit = () => {
    setPendingComment(item.comment || '');
    setIsEditingCommentLocal(false);
  };

  // Función para eliminar item
  const handleDeleteItem = async () => {
    if (!item.orderItemId) {
      console.error('No se puede eliminar: orderItemId no está disponible');
      alert(language === 'es' 
        ? 'Error: No se puede identificar el item a eliminar'
        : 'Error: Cannot identify item to delete');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Eliminando item con orderItemId:', item.orderItemId);
      const response = await ordersItemApi.removeItem(item.orderItemId);

      if (response?.success) {
        console.log('✅ Item eliminado exitosamente:', response.message);
        
        // Emitir evento para actualizar el carrito
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        // Cerrar el modal
        setShowDeleteConfirm(false);
        
        // Llamar al callback si existe
        if (onRemoveItem) {
          onRemoveItem(item.id);
        }
      } else {
        throw new Error(response?.message || (language === 'es' 
          ? 'Error al eliminar el item'
          : 'Error deleting item'));
      }
    } catch (error: any) {
      console.error('❌ Error al eliminar item:', error);
      const errorMessage = error?.message || error?.response?.data?.message || (language === 'es' 
        ? 'Error al eliminar el item. Por favor, inténtalo nuevamente.'
        : 'Error deleting item. Please try again.');
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartDateEdit = () => {
    const fallbackDate = displayDate || todayIsoString;
    setPendingDate(fallbackDate);
    setPendingTime(displayTime || item.time || '');
    setIsEditingDateLocal(true);
    setDateError(null);
  };

  const handleDateInputChange = (value: string) => {
    setPendingDate(value);
    setPendingTime('');
    setAvailableTimes([]);
    setDateError(null);
  };

  const handleTimeSelect = (value: string) => {
    setPendingTime(value);
    setDateError(null);
  };

  const handleSaveDate = async () => {
    if (!pendingDate) {
      setDateError(language === 'es' ? 'Selecciona una fecha válida.' : 'Please choose a valid date.');
      return;
    }

    // Si no hay horarios disponibles, no permitir guardar
    if (availableTimes.length === 0) {
      setDateError(language === 'es' ? 'No hay horarios disponibles para esta fecha. Por favor, selecciona otra fecha.' : 'No available times for this date. Please select another date.');
      return;
    }

    // Validar que se haya seleccionado un horario
    if (!pendingTime) {
      setDateError(language === 'es' ? 'Selecciona un horario disponible.' : 'Please choose an available time.');
      return;
    }

    setIsSavingDateLocal(true);

    try {
      // Obtener el timeZone del bookingOption
      const bookingOption = fullActivity?.bookingOptions?.find((option: any) => option.id === item.bookingOptionId)
        || fullActivity?.bookingOptions?.[0];
      const timeZone = (bookingOption as any)?.timeZone || activityTimeZone || 'America/Lima';
      
      // Construir la fecha/hora local
      const normalizedTime = normalizeTimeTo24Hour(pendingTime);
      const localDateTime = `${pendingDate}T${normalizedTime}`;
      
      // Convertir de local a UTC usando el timeZone
      const utcDateTime = convertLocalDateTimeToUTC(localDateTime, timeZone);
      
      // Extraer fecha y hora del resultado UTC (sin el +00:00)
      const [utcDate, utcTime] = utcDateTime.replace('+00:00', '').split('T');
      
      console.log('📅 Guardando fecha:', { 
        localDate: pendingDate, 
        localTime: normalizedTime,
        timeZone: timeZone,
        utcDate: utcDate,
        utcTime: utcTime
      });
      
      // Actualizar usando la API con la fecha/hora en UTC
      await updateOrderItem({ date: utcDate, time: utcTime });
      
      // Actualizar estado local con la fecha/hora local (para mostrar)
      setDisplayDate(pendingDate);
      setDisplayTime(normalizedTime);
      setIsEditingDateLocal(false);
      setDateError(null);

      // Notificar al componente padre si existe el callback (con fecha/hora local para mostrar)
      if (onEditDate) {
        onEditDate(item, { date: pendingDate, time: normalizedTime });
      }
      
      console.log('✅ Fecha guardada exitosamente');
    } catch (error) {
      console.error('❌ Error al guardar fecha:', error);
      setDateError(language === 'es' ? 'Error al guardar la fecha. Por favor, intenta de nuevo.' : 'Error saving date. Please try again.');
    } finally {
      setIsSavingDateLocal(false);
    }
  };

  const handleCancelDateEdit = () => {
    setPendingDate(displayDate || item.date || '');
    setPendingTime(displayTime || item.time || '');
    setIsEditingDateLocal(false);
    setDateError(null);
  };

  const handleSaveMeetingPoint = async () => {
    if (!pickupOptions.length) {
      setIsEditingMeetingPointLocal(false);
      return;
    }

    setIsSavingMeetingPointLocal(true);

    const selectedPickup = pickupOptions.find((option) => option.id === pendingPickupPointId) || null;
    const fallback = pickupOptions[0] || null;
    const resolvedPickup = selectedPickup || fallback;
    const meetingPointName = resolvedPickup?.name || enrichedDetails.meetingPoint || '';
    const meetingPointAddress = resolvedPickup?.address || enrichedDetails.meetingAddress || '';

    try {
      // Actualizar usando la API
      await updateOrderItem({
        meetingPickupPlaceId: resolvedPickup?.cityId ?? null,
        meetingPickupPointName: meetingPointName || null,
        meetingPickupPointAddress: meetingPointAddress || null,
        meetingPickupPointLatitude: resolvedPickup?.latitude ?? null,
        meetingPickupPointLongitude: resolvedPickup?.longitude ?? null,
      });
      
      setEnrichedDetails((prev) => ({
        ...prev,
        meetingPoint: meetingPointName,
        meetingAddress: meetingPointAddress,
      }));

      onEditMeetingPoint?.(
        item,
        resolvedPickup
          ? {
              id: resolvedPickup.id != null ? Number(resolvedPickup.id) : undefined,
              name: resolvedPickup.name,
              address: resolvedPickup.address,
              latitude: resolvedPickup.latitude,
              longitude: resolvedPickup.longitude,
              cityId: resolvedPickup.cityId,
            }
          : null,
        meetingPointName,
        meetingPointAddress,
      );

      setIsEditingMeetingPointLocal(false);
    } catch (error) {
      console.error('Error al guardar punto de encuentro:', error);
    } finally {
      setIsSavingMeetingPointLocal(false);
    }
  };

  const handleCancelMeetingPoint = () => {
    const existing = pickupOptions.find((option) => option.name === enrichedDetails.meetingPoint);
    setPendingPickupPointId(existing?.id ?? undefined);
    setIsEditingMeetingPointLocal(false);
  };

  useEffect(() => {
    if (!isEditingTravelersLocal) {
      setPendingAdults(Number(item.travelers.adults) || 1);
      setPendingChildren(Number(item.travelers.children) || 0);
    }
  }, [item.travelers.adults, item.travelers.children, isEditingTravelersLocal]);

  const handleSaveTravelers = async () => {
    const safeAdults = Math.max(1, pendingAdults);
    const safeChildren = Math.max(0, pendingChildren);
    setPendingAdults(safeAdults);
    setPendingChildren(safeChildren);
    setIsSavingTravelersLocal(true);

    try {
      // Actualizar usando la API
      await updateOrderItem({ adults: safeAdults, children: safeChildren });
      
      onEditTravelers?.(item, { adults: safeAdults, children: safeChildren });

      setIsEditingTravelersLocal(false);
    } catch (error) {
      console.error('Error al guardar viajeros:', error);
    } finally {
      setIsSavingTravelersLocal(false);
    }
  };

  const handleCancelTravelers = () => {
    setPendingAdults(Number(item.travelers.adults) || 1);
    setPendingChildren(Number(item.travelers.children) || 0);
    setIsEditingTravelersLocal(false);
  };

  return (
    <div className="border rounded p-2 p-md-3 mb-3 shadow-sm position-relative" style={{ overflowX: 'hidden' }}>
      {(isLoadingData || isSavingLanguageLocal || isSavingCommentLocal || isSavingMeetingPointLocal || isSavingTravelersLocal || isSavingDateLocal) && (
        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-50 rounded">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
      <div className="d-flex flex-column">
        <div className="d-flex flex-column flex-md-row">
          <img
            src={enrichedDetails.imageUrl || item.imageUrl || 'https://via.placeholder.com/80x80?text=Tour'}
            alt={item.title}
            className="rounded me-0 me-md-3 mb-2 mb-md-0 align-self-start"
            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
          />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <h5 className="fw-bold mb-2 small" style={{ wordBreak: 'break-word', fontSize: '0.95rem' }}>{capitalizeWords(item.title)}</h5>
            <RatingStars rating={rating} commentsCount={commentsCount} className="mb-2" />
          </div>
          <div className="text-start text-md-end ms-0 ms-md-3 mt-2 mt-md-0">
            {hasDiscount && (
              <div className="text-muted small text-decoration-line-through" style={{ wordBreak: 'break-word' }}>
                {formatCurrency(originalTotalPrice, item.currency)}
              </div>
            )}
            <div className="fw-bold text-primary fs-6 fs-md-5" style={{ wordBreak: 'break-word' }}>
              {formatCurrency(displayedTotal, item.currency)}
            </div>
            <div className="text-muted small" style={{ wordBreak: 'break-word' }}>
              {language === 'es' ? 'Total para este tour' : 'Total for this tour'}
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-3">
          <button
            type="button"
            className="btn btn-link px-0 text-decoration-none"
            onClick={() => setIsDetailsExpanded((prev) => !prev)}
          >
            <i className={`fas ${isDetailsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} me-2`}></i>
            {isDetailsExpanded
              ? language === 'es'
                ? 'Ocultar detalles'
                : 'Hide details'
              : language === 'es'
              ? 'Ver detalles'
              : 'View details'}
          </button>
        </div>
        {isDetailsExpanded && (
        <div className="d-flex flex-column">
          <div className="small text-muted mb-2">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-language text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Idioma:' : 'Language:'}</span>
                {!isEditingLanguageLocal && (
                  <span className="ms-1" style={{ wordBreak: 'break-word' }}>
                    {capitalizeWords(enrichedDetails.language || (language === 'es' ? 'No especificado' : 'Not specified'))}
                  </span>
                )}
              </div>
              {!isEditingLanguageLocal && availableLanguages.length > 0 && !readOnly && onEditLanguage && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none px-0 ms-2"
                  onClick={() => setIsEditingLanguageLocal(true)}
                  disabled={isLoadingData || isSavingLanguageLocal}
                >
                  <i className="fas fa-pencil-alt me-1"></i>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
              )}
            </div>
            {isEditingLanguageLocal && (
              <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                <select
                  className="form-select form-select-sm"
                  value={pendingLanguageCode || ''}
                  onChange={(event) => handleLanguageSelect(event.target.value)}
                  disabled={isSavingLanguageLocal}
                >
                  {availableLanguages.map((langOption) => (
                    <option key={langOption.code} value={langOption.code}>
                      {langOption.name}
                    </option>
                  ))}
                </select>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveLanguage} disabled={isSavingLanguageLocal}>
                    <i className="fas fa-check me-1"></i>
                    {language === 'es' ? 'Guardar' : 'Save'}
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCancelLanguageEdit} disabled={isSavingLanguageLocal}>
                    <i className="fas fa-times me-1"></i>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="small text-muted mb-2">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-map-marker-alt text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Punto de encuentro:' : 'Meeting point:'}</span>
                <span className="text-muted ms-1" style={{ wordBreak: 'break-word' }}>
                  {meetingTypeLocal === 'REFERENCE_CITY_WITH_LIST'
                    ? (enrichedDetails.meetingPoint
                        ? `${enrichedDetails.meetingPoint.substring(0, 150)}${enrichedDetails.meetingPoint.length > 150 ? '…' : ''}`
                        : language === 'es'
                        ? 'No especificado'
                        : 'Not specified')
                    : enrichedDetails.meetingPoint
                    ? enrichedDetails.meetingPoint
                    : language === 'es'
                    ? 'No especificado'
                    : 'Not specified'}
                </span>
              </div>
              {meetingTypeLocal === 'REFERENCE_CITY_WITH_LIST' && pickupOptions.length > 0 && !isEditingMeetingPointLocal && !readOnly && onEditMeetingPoint && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none px-0 ms-2"
                  onClick={() => setIsEditingMeetingPointLocal(true)}
                  disabled={isSavingMeetingPointLocal || isSavingLanguageLocal || isSavingCommentLocal || isLoadingData}
                >
                  <i className="fas fa-pencil-alt me-1"></i>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
              )}
            </div>
            {meetingTypeLocal === 'REFERENCE_CITY_WITH_LIST' && enrichedDetails.meetingAddress && (
              <div className="text-muted mt-1" style={{ wordBreak: 'break-word' }}>{enrichedDetails.meetingAddress}</div>
            )}
            {isEditingMeetingPointLocal && meetingTypeLocal === 'REFERENCE_CITY_WITH_LIST' && pickupOptions.length > 0 && (
              <div className="mt-2">
                <select
                  className="form-select form-select-sm"
                  value={pendingPickupPointId !== undefined ? String(pendingPickupPointId) : ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPendingPickupPointId(value === '' ? undefined : (value as string));
                  }}
                  disabled={isSavingMeetingPointLocal}
                >
                  {pickupOptions.map((option) => (
                    <option key={option.id ?? option.name} value={option.id ?? ''}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveMeetingPoint}
                    disabled={isSavingMeetingPointLocal}
                  >
                    <i className="fas fa-check me-1"></i>
                    {language === 'es' ? 'Guardar' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleCancelMeetingPoint}
                    disabled={isSavingMeetingPointLocal}
                  >
                    <i className="fas fa-times me-1"></i>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="small text-muted mb-2">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-comment-dots text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Solicitud especial:' : 'Special request:'}</span>
                {!isEditingCommentLocal && (
                  <span className="text-muted ms-1" style={{ wordBreak: 'break-word' }}>
                    {enrichedDetails.comment && enrichedDetails.comment.trim().length > 0
                      ? enrichedDetails.comment
                      : language === 'es'
                      ? 'Sin comentarios'
                      : 'No comments'}
                  </span>
                )}
              </div>
              {!isEditingCommentLocal && !readOnly && onEditComment && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none px-0 ms-2"
                  onClick={() => setIsEditingCommentLocal(true)}
                  disabled={isSavingCommentLocal || isSavingLanguageLocal || isLoadingData}
                >
                  <i className="fas fa-pencil-alt me-1"></i>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
              )}
            </div>
            {isEditingCommentLocal && (
              <div className="mt-2">
                <textarea
                  className="form-control"
                  rows={3}
                  maxLength={150}
                  value={pendingComment}
                  onChange={(event) => setPendingComment(event.target.value)}
                  disabled={isSavingCommentLocal}
                />
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <small className="text-muted">
                    {pendingComment.length}/150
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleSaveComment}
                      disabled={isSavingCommentLocal}
                    >
                      <i className="fas fa-check me-1"></i>
                      {language === 'es' ? 'Guardar' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelCommentEdit}
                      disabled={isSavingCommentLocal}
                    >
                      <i className="fas fa-times me-1"></i>
                      {language === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="small text-muted mb-2">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-calendar-day text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Fecha de salida:' : 'Departure date:'}</span>
                {!isEditingDateLocal && (
                  <span className="text-muted ms-1">
                    {displayDate
                      ? formatDate(displayDate)
                      : language === 'es'
                      ? 'Sin fecha'
                      : 'No date'}
                    {displayTime && (
                      <>
                        {' '}
                        {language === 'es' ? 'a las' : 'at'} {formatTimeToAMPM(displayTime)}
                        {activityTimeZone && (
                          <>
                            {' '}
                            <span className="text-muted small">
                              ({activityTimeZone})
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </span>
                )}
              </div>
              {!isEditingDateLocal && !readOnly && onEditDate && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none px-0 ms-2"
                  onClick={handleStartDateEdit}
                  disabled={isLoadingData || isSavingLanguageLocal || isSavingCommentLocal || isSavingMeetingPointLocal || isSavingTravelersLocal || isSavingDateLocal}
                >
                  <i className="fas me-1 fa-pencil-alt"></i>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
              )}
            </div>
            {isEditingDateLocal && (
              <div className="mt-2">
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1 small">{language === 'es' ? 'Fecha' : 'Date'}</label>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={pendingDate}
                      min={todayIsoString}
                      onChange={(event) => handleDateInputChange(event.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label mb-1 small">{language === 'es' ? 'Horarios disponibles' : 'Available times'}</label>
                    {isLoadingSchedules ? (
                      <div className="d-flex align-items-center gap-2">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="small text-muted">
                          {language === 'es' ? 'Cargando horarios…' : 'Loading schedules…'}
                        </span>
                      </div>
                    ) : availableTimes.length > 0 ? (
                      <select
                        className="form-select form-select-sm"
                        value={pendingTime}
                        onChange={(event) => handleTimeSelect(event.target.value)}
                      >
                        {availableTimes.map((timeOption) => (
                          <option key={timeOption} value={timeOption}>
                            {timeOption}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="alert alert-info mb-0 py-2" role="alert">
                        <small>
                          <i className="fas fa-info-circle me-1"></i>
                          {language === 'es' 
                            ? 'No hay horarios disponibles para esta fecha.'
                            : 'No available times for this date.'}
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                {dateError && <div className="text-danger small mt-2">{dateError}</div>}
                <div className="d-flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveDate}
                    disabled={isLoadingSchedules || isSavingDateLocal || availableTimes.length === 0}
                  >
                    <i className="fas fa-check me-1"></i>
                    {language === 'es' ? 'Guardar' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleCancelDateEdit}
                    disabled={isLoadingSchedules || isSavingDateLocal}
                  >
                    <i className="fas fa-times me-1"></i>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="small text-muted mb-2">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-users text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Viajeros:' : 'Travelers:'}</span>
                {!isEditingTravelersLocal && (
                  <span className="text-muted ms-1">{formatTravelers(item)}</span>
                )}
              </div>
              {!isEditingTravelersLocal && !readOnly && onEditTravelers && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-decoration-none px-0 ms-2"
                  onClick={() => setIsEditingTravelersLocal(true)}
                  disabled={isSavingTravelersLocal || isSavingLanguageLocal || isSavingCommentLocal || isSavingMeetingPointLocal || isLoadingData}
                >
                  <i className="fas fa-pencil-alt me-1"></i>
                  {language === 'es' ? 'Editar' : 'Edit'}
                </button>
              )}
            </div>
            {isEditingTravelersLocal && (
              <div className="mt-2">
                <div className="d-flex gap-3 align-items-center flex-wrap">
                  <div>
                    <label className="form-label mb-1 small">{language === 'es' ? 'Adultos' : 'Adults'}</label>
                    <div className="input-group input-group-sm">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setPendingAdults((prev) => Math.max(1, Number(prev) - 1))} disabled={Number(pendingAdults) <= 1 || isSavingTravelersLocal}>
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        min={1}
                        value={pendingAdults}
                        onChange={(event) => setPendingAdults(Math.max(1, Number(event.target.value) || 1))}
                        disabled={isSavingTravelersLocal}
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setPendingAdults((prev) => Number(prev) + 1)} disabled={isSavingTravelersLocal}>
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="form-label mb-1 small">{language === 'es' ? 'Niños' : 'Children'}</label>
                    <div className="input-group input-group-sm">
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setPendingChildren((prev) => Math.max(0, Number(prev) - 1))} disabled={Number(pendingChildren) <= 0 || isSavingTravelersLocal}>
                        <i className="fas fa-minus"></i>
                      </button>
                      <input
                        type="number"
                        className="form-control text-center"
                        min={0}
                        value={pendingChildren}
                        onChange={(event) => setPendingChildren(Math.max(0, Number(event.target.value) || 0))}
                        disabled={isSavingTravelersLocal}
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={() => setPendingChildren((prev) => Number(prev) + 1)} disabled={isSavingTravelersLocal}>
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2">
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveTravelers} disabled={isSavingTravelersLocal}>
                    <i className="fas fa-check me-1"></i>
                    {language === 'es' ? 'Guardar' : 'Save'}
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={handleCancelTravelers} disabled={isSavingTravelersLocal}>
                    <i className="fas fa-times me-1"></i>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="small text-muted">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div className="d-flex align-items-center flex-wrap gap-1">
                <i className="fas fa-tag text-primary" style={{ marginRight: '0.5rem' }}></i>
                <span className="fw-semibold">{language === 'es' ? 'Precios' : 'Pricing'}</span>
              </div>
              {hasDiscount && pricingData.specialOfferPercentage && (
                <span className="badge bg-success">
                  {language === 'es' ? 'Oferta ' : 'Offer '}
                  {Math.round(pricingData.specialOfferPercentage)}%
                </span>
              )}
            </div>
            <div className="mt-2">
              {hasDiscount ? (
                <>
                  <div className="text-muted">
                    {language === 'es' ? 'Precio normal:' : 'Regular price:'}{' '}
                    <span className="text-decoration-line-through">
                      {formatCurrency(pricingData.baseUnitPrice, item.currency)}
                    </span>
                    {' '}
                    × {travelerCount}
                  </div>
                  <div className="text-muted">
                    {language === 'es' ? 'Precio con descuento:' : 'Discounted price:'}{' '}
                    <span className="fw-semibold text-success">
                      {formatCurrency(pricingData.discountedUnitPrice, item.currency)}
                    </span>
                    {' '}
                    × {travelerCount}
                  </div>
                  <div className="text-muted mt-2">
                    {language === 'es' ? 'Total normal:' : 'Regular total:'}{' '}
                    <span className="text-decoration-line-through">
                      {formatCurrency(originalTotalPrice, item.currency)}
                    </span>
                  </div>
                  <div className="text-muted">
                    {language === 'es' ? 'Total con descuento:' : 'Discounted total:'}{' '}
                    <span className="fw-semibold text-success">
                      {formatCurrency(discountedTotalPrice, item.currency)}
                    </span>
                  </div>
                  <div className="mt-2 text-success">
                    <i className="fas fa-piggy-bank me-1"></i>
                    {language === 'es' ? 'Ahorro:' : 'You save:'}{' '}
                    <strong>{formatCurrency(savingsAmount, item.currency)}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-muted">
                    {language === 'es' ? 'Precio unitario:' : 'Unit price:'}{' '}
                    <span className="fw-semibold">
                      {formatCurrency(pricingData.baseUnitPrice, item.currency)}
                    </span>
                    {hasChildren && (
                      <span className="text-muted">
                        {' '}- {language === 'es' ? 'niños incluidos' : 'children included'}
                      </span>
                    )}
                  </div>
                  <div className="text-muted">
                    {language === 'es' ? 'Total:' : 'Total:'}{' '}
                    <span className="fw-semibold">
                      {formatCurrency(discountedTotalPrice, item.currency)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Alerta de cancelación */}
        {!readOnly && getCancellationInfo && getCancellationInfo.canCancel && (
          <div className="alert alert-info mt-3 mb-0" role="alert" style={{ wordBreak: 'break-word' }}>
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1"></i>
              <div className="flex-grow-1">
                <div>
                  <strong>{language === 'es' ? 'Política de cancelación' : 'Cancellation policy'}</strong>
                  <div className="small mt-1">
                    {language === 'es' 
                      ? `Si realizas una reserva, puedes cancelarla hasta el ${getCancellationInfo.deadline}.`
                      : `If you make a reservation, you can cancel it until ${getCancellationInfo.deadline}.`}
                    {getCancellationInfo.daysUntilDeadline > 0 && getCancellationInfo.daysUntilDeadline <= 7 && (
                      <span className="d-block mt-1 fw-semibold">
                        {language === 'es'
                          ? `Quedan ${getCancellationInfo.daysUntilDeadline} ${getCancellationInfo.daysUntilDeadline === 1 ? 'día' : 'días'} para cancelar.`
                          : `${getCancellationInfo.daysUntilDeadline} ${getCancellationInfo.daysUntilDeadline === 1 ? 'day' : 'days'} remaining to cancel.`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {onRemoveItem && (
        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSavingLanguageLocal || isSavingCommentLocal || isSavingMeetingPointLocal || isSavingTravelersLocal || isLoadingData || isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                {language === 'es' ? 'Eliminando...' : 'Deleting...'}
              </>
            ) : (
              <>
                <i className="fas fa-trash me-1"></i>
                {language === 'es' ? 'Eliminar' : 'Remove'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {language === 'es' ? 'Confirmar eliminación' : 'Confirm deletion'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteConfirm(false)}
                  aria-label="Close"
                  disabled={isDeleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  {language === 'es' 
                    ? '¿Estás seguro de que deseas eliminar este item del carrito?'
                    : 'Are you sure you want to remove this item from the cart?'}
                </p>
                {item.title && (
                  <div className="alert alert-info mb-0">
                    <strong>{item.title}</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteItem}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {language === 'es' ? 'Eliminando...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>
                      {language === 'es' ? 'Eliminar' : 'Delete'}
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

export default CheckoutCartItem;

