import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTranslation, getTranslationWithParams } from '../utils/translations';
import { useConfig } from '../context/ConfigContext';
import { useUrlParams } from '../hooks/useUrlParams';
import { usePageTitle } from '../hooks/usePageTitle';
import type { ActivityCardData } from '../components/ActivityCard';
import { activitiesApi } from '../api/activities';
import type { Destination } from '../api/activities';
import RatingStars from '../components/RatingStars';
import { useGoogleTokenValidation } from '../hooks/useGoogleTokenValidation';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { config } = useConfig();
  const { currency } = useUrlParams();
  
  // Validar token de Google si el usuario está conectado con Google
  useGoogleTokenValidation();

  // Estados del formulario de búsqueda
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [dates, setDates] = useState(searchParams.get('date') || '');
  const [adults, setAdults] = useState(parseInt(searchParams.get('adults') || '1'));
  const [children, setChildren] = useState(parseInt(searchParams.get('children') || '0'));
  const [isTravelersDropdownOpen, setIsTravelersDropdownOpen] = useState(false);
  const travelersDropdownRef = useRef<HTMLDivElement>(null);

  // Estados de datos
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [activities, setActivities] = useState<ActivityCardData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Establecer título de página dinámicamente
  usePageTitle('nav.search', language);

  // Función auxiliar para parsear fecha en timezone local (America/Lima)
  const parseLocalDate = (dateString: string): Date => {
    // dateString formato: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    // Crear fecha en timezone local (mes es 0-indexed, por eso month - 1)
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  // Función auxiliar para formatear fecha para mostrar
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString('es-PE', { 
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Obtener actividades desde la API basado en los parámetros de búsqueda
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        
        // Realizar búsqueda de actividades con los filtros aplicados
        const response = await activitiesApi.search({
          lang: language,
          currency: currency.toUpperCase(),
          departureDate: dates || undefined,
          destinationCity: destination || undefined,
          page: 0,
          size: 50,
          active: true
        });
        
        // Verificar que la respuesta sea exitosa y contenga datos
        if (response.success && response.data && response.data.length > 0) {
          // Filtrar actividades que tienen ofertas especiales desde la API
          const activitiesWithOfferFromAPI = response.data.filter(activity => {
            const bookingOption = activity.bookingOptions?.[0];
            return bookingOption?.specialOfferPercentage && bookingOption.specialOfferPercentage > 0;
          });
          
          // Mapear Activity a ActivityCardData para mostrar en la interfaz
          const mappedActivities = response.data.map(activity => {
            const bookingOption = activity.bookingOptions?.[0];
            let price = 0;
            let originalPrice = 0;
            let currency = 'PEN';
            let isFrom = false;
            let hasActiveOffer = false;
            let discountPercent = 0;

            // Aplicar la lógica de precios usando normalPrice, specialOfferPercentage y priceAfterDiscount
            let minParticipants: number | null = null;
            
            if (bookingOption) {
              // Obtener la moneda del bookingOption
              currency = bookingOption.currency || 'PEN';
              
              // Usar priceAfterDiscount si está disponible (ya incluye el descuento aplicado)
              if (bookingOption.priceAfterDiscount != null && bookingOption.priceAfterDiscount > 0) {
                price = bookingOption.priceAfterDiscount;
                // Si hay precio normal, usarlo como precio original
                if (bookingOption.normalPrice != null && bookingOption.normalPrice > 0) {
                  originalPrice = bookingOption.normalPrice;
                }
              } else if (bookingOption.normalPrice != null && bookingOption.normalPrice > 0) {
                // Si no hay priceAfterDiscount, usar normalPrice
                price = bookingOption.normalPrice;
              } else if (bookingOption.pricePerPerson != null && bookingOption.pricePerPerson > 0) {
                // Fallback: usar pricePerPerson si no hay normalPrice ni priceAfterDiscount
                price = bookingOption.pricePerPerson;
              } else {
                price = 0;
              }
              
              // Verificar si hay oferta especial activa
              if (bookingOption.specialOfferPercentage != null && bookingOption.specialOfferPercentage > 0) {
                hasActiveOffer = true;
                discountPercent = bookingOption.specialOfferPercentage;
                
                // Si no tenemos originalPrice pero tenemos specialOfferPercentage, calcularlo
                if (originalPrice === 0 && price > 0) {
                  // Calcular precio original desde el precio con descuento
                  originalPrice = price / (1 - (bookingOption.specialOfferPercentage / 100));
                }
              }
              
              // Obtener minParticipants del bookingOption si está disponible
              if (bookingOption.groupMinSize != null && bookingOption.groupMinSize > 0) {
                minParticipants = bookingOption.groupMinSize;
                // Mostrar "Desde" si hay un mínimo de participantes
                isFrom = true;
              } else {
                isFrom = false;
                minParticipants = null;
              }
            }

            return {
              id: activity.id,
              title: activity.title,
              presentation: activity.presentation,
              description: Array.isArray(activity.description) ? activity.description.join(' ') : activity.description,
              imageUrl: activity.images?.find(img => img.isCover)?.imageUrl || activity.images?.[0]?.imageUrl || '',
              price: price,
              duration: (() => {
                const days = bookingOption?.durationDays || 0;
                const hours = bookingOption?.durationHours || 0;
                const minutes = bookingOption?.durationMinutes || 0;
                const parts = [];
                
                if (days > 0) parts.push(`${days}d`);
                if (hours > 0) parts.push(`${hours}h`);
                if (minutes > 0) parts.push(`${minutes}min`);
                
                return parts.length > 0 ? parts.join(' ') : 'N/A';
              })(),
              rating: activity.rating || 0,
              reviewCount: activity.commentsCount || 0,
              commentsCount: activity.commentsCount || 0,
              location: activity.pointsOfInterest?.[0]?.name || 'N/A',
              category: activity.categoryName || 'N/A',
              isActive: activity.isActive || true,
              includes: activity.includes || [],
              currency: currency,
              isFromPrice: isFrom,
              minParticipants: minParticipants,
              supplierName: activity.supplier?.name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || '',
              supplierVerified: Boolean(activity.supplier?.isVerified),
              hasActiveOffer: hasActiveOffer,
              originalPrice: originalPrice > 0 ? originalPrice : undefined,
              discountPercent: discountPercent > 0 ? discountPercent : undefined,
              isNew: activity.isNew || false
            };
          });
          
          // Filtrar actividades con y sin descuento para referencia
          const withDiscount = mappedActivities.filter(a => a.hasActiveOffer);
          const withoutDiscount = mappedActivities.filter(a => !a.hasActiveOffer);
          
          // Establecer las actividades mapeadas en el estado
          setActivities(mappedActivities);
        } else {
          setActivities([]);
        }
      } catch (error) {
        // Si hay error al obtener actividades, establecer lista vacía
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [language, currency, destination, dates]);

  // Obtener destinos desde la API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        const response = await activitiesApi.getDestinations();
        
        if (!response.success || !response.data || response.data.length === 0) {
          setDestinations([]);
        } else {
          setDestinations(response.data);
        }
      } catch (error) {
        // Si hay error al obtener destinos, establecer lista vacía
        setDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, []);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (travelersDropdownRef.current && !travelersDropdownRef.current.contains(event.target as Node)) {
        setIsTravelersDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Manejar cambio en número de adultos (incrementar o decrementar)
  const handleAdultsChange = (increment: boolean) => {
    if (increment) {
      setAdults(prev => prev + 1);
    } else {
      // No permitir menos de 1 adulto
      setAdults(prev => Math.max(1, prev - 1));
    }
  };

  // Manejar cambio en número de niños (incrementar o decrementar)
  const handleChildrenChange = (increment: boolean) => {
    if (increment) {
      setChildren(prev => prev + 1);
    } else {
      // No permitir menos de 0 niños
      setChildren(prev => Math.max(0, prev - 1));
    }
  };

  // Manejar búsqueda: validar y actualizar parámetros de búsqueda en la URL
  const handleSearch = () => {
    // Validar que se haya seleccionado una fecha (obligatorio)
    if (!dates) {
      setShowDateTooltip(true);
      // Ocultar el tooltip después de 3 segundos
      setTimeout(() => setShowDateTooltip(false), 3000);
      return;
    }

    // Construir parámetros de búsqueda para la URL
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (dates) params.set('date', dates);
    if (adults > 1) params.set('adults', adults.toString());
    if (children > 0) params.set('children', children.toString());
    
    // Actualizar los parámetros de búsqueda en la URL (esto disparará el useEffect que obtiene actividades)
    setSearchParams(params);
  };

  // Limpiar todos los filtros de búsqueda
  const handleClearFilters = () => {
    setDestination('');
    setDates('');
    setAdults(1);
    setChildren(0);
    setSearchParams({});
  };

  // Obtener texto formateado para mostrar número de viajeros
  const getTravelersText = () => {
    const total = adults + children;
    if (total === 1) return `1 ${getTranslation('home.search.travelers', language).toLowerCase()}`;
    return `${total} ${getTranslation('home.search.travelers', language).toLowerCase()}`;
  };

  // Obtener actividades a mostrar (limitar a 10 inicialmente, mostrar todas si showAllActivities es true)
  const getActivitiesToShow = () => {
    if (showAllActivities || activities.length <= 10) {
      return activities;
    }
    return activities.slice(0, 10);
  };

  // Convertir precio a número si es string
  const getPriceValue = (price: number | string): number => {
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* CSS personalizado para mejorar la línea tachada */}
      <style>{`
        .strikethrough-price {
          position: relative;
          display: inline-block;
        }
        .strikethrough-price::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          top: 40%;
          height: 0.3px;
          background-color: currentColor;
        }
        /* Verified tooltip */
        .verified-badge { position: relative; display: inline-flex; align-items: center; }
        .verified-tooltip {
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.85);
          color: #fff;
          padding: 6px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          line-height: 1.2;
          white-space: normal;
          text-align: center;
          width: 220px;
          max-width: 260px;
          visibility: hidden;
          opacity: 0;
          transition: opacity 0.15s ease, visibility 0.15s ease;
          z-index: 1000;
        }
        .verified-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 6px;
          border-style: solid;
          border-color: rgba(0,0,0,0.85) transparent transparent transparent;
        }
        .verified-badge:hover .verified-tooltip { visibility: visible; opacity: 1; }
      `}</style>

      {/* Barra de búsqueda superior */}
      <div className="bg-white shadow-sm py-4">
        <div className="container">
          <div className="d-flex align-items-center mb-3">
            <button 
              className="btn btn-link text-decoration-none text-dark me-3"
              onClick={() => navigate('/')}
            >
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h4 className="mb-0 fw-bold">{getTranslation('nav.search', language) || 'Buscar Actividades'}</h4>
          </div>

          {/* Formulario de búsqueda compacto */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-3">
              <div className="row g-2 align-items-end">
                {/* Destino */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold mb-1">
                    {getTranslation('home.search.where', language)}
                  </label>
                  <div className="position-relative">
                    <svg className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="form-select form-select-sm ps-4"
                      disabled={loadingDestinations}
                    >
                      <option value="">
                        {loadingDestinations ? getTranslation('common.loading', language) : getTranslation('home.search.where', language)}
                      </option>
                      {destinations.map((dest) => (
                        <option key={dest.id} value={dest.cityName}>
                          {getTranslation(`destination.${dest.cityName}`, language)} ({dest.activityCount})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Fecha */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold mb-1">
                    {getTranslation('home.search.date', language)}
                  </label>
                  <div className="position-relative">
                    <svg className="position-absolute top-50 start-0 translate-middle-y ms-2 text-muted" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <input
                      type="date"
                      value={dates}
                      onChange={(e) => {
                        setDates(e.target.value);
                        if (e.target.value) {
                          setShowDateTooltip(false);
                        }
                      }}
                      onFocus={() => setShowDateTooltip(false)}
                      className={`form-control form-control-sm ps-4 ${showDateTooltip ? 'border-danger' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {showDateTooltip && (
                      <div className="position-absolute top-100 start-0 mt-1 p-2 bg-danger text-white rounded shadow-sm" style={{ zIndex: 1000, fontSize: '0.75rem' }}>
                        Seleccione fecha de salida
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Viajeros */}
                <div className="col-md-3">
                  <label className="form-label small fw-bold mb-1">
                    {getTranslation('home.search.travelers', language)}
                  </label>
                  <div className="position-relative" ref={travelersDropdownRef}>
                    <button
                      type="button"
                      className="form-select form-select-sm text-start d-flex align-items-center justify-content-between"
                      onClick={() => setIsTravelersDropdownOpen(!isTravelersDropdownOpen)}
                    >
                      <div className="d-flex align-items-center">
                        <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        <span style={{ fontSize: '0.875rem' }}>{getTravelersText()}</span>
                      </div>
                    </button>
                    
                    {isTravelersDropdownOpen && (
                      <div className="position-absolute top-100 start-0 w-100 mt-1 bg-white border rounded shadow-lg p-3 z-3">
                        {/* Adultos */}
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0 small">{getTranslation('home.search.adults', language)}</label>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>18+ años</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleAdultsChange(false)}
                              disabled={adults <= 1}
                              style={{ width: '32px', height: '32px' }}
                            >
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                              </svg>
                            </button>
                            <span className="mx-3 fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                              {adults}
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleAdultsChange(true)}
                              style={{ width: '32px', height: '32px' }}
                            >
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Niños */}
                        <div className="mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <label className="form-label fw-bold mb-0 small">{getTranslation('home.search.children', language)}</label>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>0-17 años</small>
                          </div>
                          <div className="d-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleChildrenChange(false)}
                              disabled={children <= 0}
                              style={{ width: '32px', height: '32px' }}
                            >
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
                              </svg>
                            </button>
                            <span className="mx-3 fw-bold" style={{ minWidth: '30px', textAlign: 'center' }}>
                              {children}
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => handleChildrenChange(true)}
                              style={{ width: '32px', height: '32px' }}
                            >
                              <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Botones */}
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm flex-grow-1"
                      onClick={handleSearch}
                    >
                      <svg className="me-1" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      {getTranslation('home.search.button', language)}
                    </button>
                    {(destination || dates || adults > 1 || children > 0) && (
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleClearFilters}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados de búsqueda */}
      <div className="container py-5">
        {/* Filtros activos */}
        <div className="mb-4">
          <h5 className="fw-bold mb-3">
            {loadingActivities ? (
              <>{getTranslation('common.loading', language)}...</>
            ) : (
              <>
                {activities.length} {activities.length === 1 ? 'actividad encontrada' : 'actividades encontradas'}
              </>
            )}
          </h5>
          
          {(destination || dates) && (
            <div className="d-flex gap-2 flex-wrap">
              {destination && (
                <span className="badge bg-primary px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {getTranslation(`destination.${destination}`, language)}
                </span>
              )}
              {dates && (
                <span className="badge bg-info px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {formatDateForDisplay(dates)}
                </span>
              )}
              {(adults > 1 || children > 0) && (
                <span className="badge bg-secondary px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  {adults} {getTranslation('home.search.adults', language)}, {children} {getTranslation('home.search.children', language)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loadingActivities && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
            </div>
            <p className="text-muted">{getTranslation('home.activities.loading', language)}</p>
          </div>
        )}

        {/* Grid de actividades - Desktop/Tablet */}
        {!loadingActivities && activities.length > 0 && (
          <>
            <div className="row g-4 d-none d-md-flex">
              {getActivitiesToShow().map((activity, index) => (
                <div key={activity.id || index} className="col-lg-3 col-md-4">
                  <div className="card h-100 shadow-sm border border-light">
                    <div className="position-relative">
                      <img
                        src={activity.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                        className="card-img-top"
                        alt={activity.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      {activity.isNew && (
                        <div className="position-absolute top-0 start-0 m-2">
                          <span className="badge bg-light text-dark">
                            {getTranslation('home.activities.newActivity', language)}
                          </span>
                        </div>
                      )}
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-primary">
                          <i className="fas fa-clock me-1"></i>{activity.duration}
                        </span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <div className="mb-2">
                        <span className="badge bg-secondary text-white mb-2">
                          {activity.category}
                        </span>
                      </div>
                      <h5 className="card-title fw-bold mb-2">
                        {activity.title.length > 80 ? `${activity.title.substring(0, 80)}...` : activity.title}
                      </h5>
                      <div className="mb-2">
                        <RatingStars
                          rating={activity.rating ?? null}
                          commentsCount={activity.commentsCount ?? null}
                          starSize={16}
                        />
                      </div>
                      {activity.supplierName && (
                        <p className="small text-muted mb-2 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.8rem', padding: '0px', margin: '0px' }}>
                          <span>
                            {getTranslation('home.activities.provider', language)} {activity.supplierName.length > 30 ? `${activity.supplierName.substring(0, 30)}...` : activity.supplierName}
                          </span>
                          {activity.supplierVerified && (
                            <span className="verified-badge">
                              <span 
                                className="badge fw-semibold"
                                style={{ fontSize: '0.6rem', backgroundColor: '#191970', color: '#fff', lineHeight: 1, padding: '0.25rem 0.4rem', display: 'inline-flex', alignItems: 'center' }}
                                aria-label={getTranslation('home.activities.verifiedProvider', language)}
                              >
                                <i className="fas fa-check-circle me-1"></i>{getTranslation('detail.booking.verified', language)}
                              </span>
                              <span className="verified-tooltip">
                                {getTranslation('home.activities.verifiedProviderTooltip', language)}
                              </span>
                            </span>
                          )}
                        </p>
                      )}
                      {activity.presentation && (
                        <p className="card-text text-muted flex-grow-1" style={{ fontSize: '0.9rem', padding: '0px', margin: '0px' }}>
                          {activity.presentation && activity.presentation.length > 100 ? `${activity.presentation?.substring(0, 100)}...` : activity.presentation}
                        </p>
                      )}
                      {activity.includes && activity.includes.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold text-success mb-2">
                            <i className="fas fa-check-circle me-1"></i>
                            {getTranslation('home.activities.includes', language)}:
                          </h6>
                          <ul className="list-unstyled small text-muted mb-0">
                            {activity.includes.slice(0, 2).map((item, idx) => (
                              <li key={idx} className="mb-1">
                                <i className="fas fa-check text-success me-2" style={{ fontSize: '0.9rem', padding: '0px', margin: '0px' }}></i>
                                {item}
                              </li>
                            ))}
                            {activity.includes.length > 2 && (
                              <li className="text-primary fw-medium">
                                +{activity.includes.length - 2} {getTranslation('home.activities.more', language)}...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-end mt-auto">
                        <div>
                          <div className={activity.hasActiveOffer ? "text-danger" : "text-primary"}>
                            {getPriceValue(activity.price) > 0 ? (
                              <>
                                {activity.hasActiveOffer && activity.originalPrice && activity.discountPercent && (
                                  <div className="d-flex align-items-center gap-2 mb-1">
                                    <span className="badge bg-danger" style={{ fontSize: '0.65rem' }}>-{activity.discountPercent}%</span>
                                    <span className="text-muted strikethrough-price" style={{ fontSize: '0.75rem' }}>
                                      {getCurrencySymbol(activity.currency)}{Math.ceil(activity.originalPrice)}
                                    </span>
                                  </div>
                                )}
                                <div style={{ margin: '0px', padding: '0px' }}>
                                  <span className="fs-5 fw-bold" style={{ fontSize: '1rem', margin: '0px', padding: '0px' }}>
                                    {getCurrencySymbol(activity.currency)}{Math.ceil(getPriceValue(activity.price))}
                                  </span>
                                  &nbsp;
                                    <small className="text-muted" style={{ fontSize: '0.6rem', marginLeft: '0.25rem', margin: '0px', padding: '0px' }}>
                                      {getTranslation('home.activities.perPerson', language)}
                                    </small>
                                </div>
                              </>
                            ) : (
                              <span className="text-muted">{getTranslation('home.activities.priceOnRequest', language)}</span>
                            )}
                          </div>
                        </div>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.append('date', dates || (() => {
                              const today = new Date();
                              return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                            })());
                            params.append('currency', currency.toUpperCase());
                            params.append('lang', language);
                            if (destination) params.append('destination', destination);
                            if (adults) params.append('adults', String(adults));
                            if (children) params.append('children', String(children));
                            navigate(`/activity/${activity.id}?${params.toString()}`);
                          }}
                          style={{ whiteSpace: 'normal', lineHeight: '1.2' }}
                        >
                          {getTranslation('home.activities.viewDetails', language)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid de actividades - Móvil */}
            <div className="d-md-none">
              {getActivitiesToShow().map((activity, index) => (
                <div key={activity.id || index} className="mb-4">
                  <div className="card border-0 shadow-sm" style={{ cursor: 'pointer' }} onClick={() => {
                    const params = new URLSearchParams();
                    params.append('date', dates || (() => {
                      const today = new Date();
                      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    })());
                    
                    params.append('currency', currency.toUpperCase());
                    params.append('lang', language);
                    if (destination) params.append('destination', destination);
                    if (adults) params.append('adults', String(adults));
                    if (children) params.append('children', String(children));
                    navigate(`/activity/${activity.id}?${params.toString()}`);
                  }}>
                    <div className="row g-0" style={{ minHeight: '180px' }}>
                      <div className="col-4">
                        <div className="position-relative h-100">
                          <img
                            src={activity.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                            className="rounded-start"
                            alt={activity.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '180px' }}
                          />
                          <div className="position-absolute top-0 start-0 m-1">
                            <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                              <i className="fas fa-clock me-1"></i>{activity.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-8">
                        <div className="card-body p-3">
                          <div className="mb-1">
                            <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>
                              {activity.category}
                            </span>
                          </div>
                          <h6 className="card-title fw-bold mb-1" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                            {activity.title.length > 80 ? `${activity.title.substring(0, 80)}...` : activity.title}
                          </h6>
                          {activity.isNew && (
                            <div className="mb-1">
                              <span className="badge bg-light text-dark" style={{ fontSize: '0.65rem' }}>
                                {getTranslation('home.activities.newActivity', language)}
                              </span>
                            </div>
                          )}
                          <div className="mb-1">
                            <RatingStars
                              rating={activity.rating ?? null}
                              commentsCount={activity.commentsCount ?? null}
                              starSize={14}
                            />
                          </div>
                          {activity.supplierName && (
                            <p className="small text-muted mb-1 fw-bold d-flex align-items-center gap-2" style={{ fontSize: '0.7rem' }}>
                              <span>
                                {getTranslation('home.activities.provider', language)} {activity.supplierName.length > 30 ? `${activity.supplierName.substring(0, 30)}...` : activity.supplierName}
                              </span>
                              {activity.supplierVerified && (
                                <span className="verified-badge">
                                  <span 
                                    className="badge"
                                    style={{ fontSize: '0.55rem', backgroundColor: '#191970', color: '#fff', lineHeight: 1, padding: '0.2rem 0.35rem', display: 'inline-flex', alignItems: 'center' }}
                                    aria-label={getTranslation('home.activities.verifiedProvider', language)}
                                  >
                                    <i className="fas fa-check-circle me-1"></i>{getTranslation('detail.booking.verified', language)}
                                  </span>
                                  <span className="verified-tooltip">
                                    {getTranslation('home.activities.verifiedProviderTooltip', language)}
                                  </span>
                                </span>
                              )}
                            </p>
                          )}
                          <p className="card-text text-muted small mb-2" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                            {activity.presentation && activity.presentation.length > 100 ? `${activity.presentation?.substring(0, 100)}...` : activity.presentation}
                          </p>
                          
                          {activity.includes && activity.includes.length > 0 && (
                            <div className="mb-2">
                              <div className="fw-bold text-success mb-1" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-check-circle me-1" style={{ fontSize: '0.7rem' }}></i>
                                {getTranslation('home.activities.includes', language)}:
                              </div>
                              <div className="small text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
                                {activity.includes.slice(0, 1).map((item, idx) => (
                                  <div key={idx} className="mb-1">
                                    <i className="fas fa-check text-success me-1" style={{ fontSize: '0.6rem' }}></i>
                                    {item}
                                  </div>
                                ))}
                                {activity.includes.length > 1 && (
                                  <div className="text-primary fw-medium">
                                    +{activity.includes.length - 1} {getTranslation('home.activities.more', language)}...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-end">
                            <div>
                              <div className={activity.hasActiveOffer ? "text-danger" : "text-primary"}>
                                {getPriceValue(activity.price) > 0 ? (
                                  <>
                                    {activity.hasActiveOffer && activity.originalPrice && activity.discountPercent && (
                                      <div className="d-flex align-items-center gap-1 mb-1">
                                        <span className="badge bg-danger" style={{ fontSize: '0.6rem' }}>-{activity.discountPercent}%</span>
                                        <span className="text-muted strikethrough-price" style={{ fontSize: '0.7rem' }}>
                                          {getCurrencySymbol(activity.currency)}{Math.ceil(activity.originalPrice)}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0px' }}>
                                      {activity.isFromPrice && `${getTranslation('home.activities.priceFrom', language)} `}
                                    </span>
                                    <div style={{ margin: '0px', padding: '0px' }}>
                                      <span className="fs-6 fw-bold" style={{ fontSize: '1rem', margin: '0px', padding: '0px' }}>
                                        {getCurrencySymbol(activity.currency)}{Math.ceil(getPriceValue(activity.price))}
                                      </span>
                                      &nbsp;
                                      <small className="text-muted" style={{ fontSize: '0.55rem', marginLeft: '0.25rem', margin: '0px', padding: '0px' }}>
                                        {getTranslation('home.activities.perPerson', language)}
                                      </small>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted small">{getTranslation('home.activities.priceOnRequest', language)}</span>
                                )}
                              </div>
                            </div>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', whiteSpace: 'normal', lineHeight: '1.2' }}
                              onClick={() => {
                                const params = new URLSearchParams();
                                params.append('date', dates || (() => {
                                  const today = new Date();
                                  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                })());
                                
                                params.append('currency', currency.toUpperCase());
                                params.append('lang', language);
                                if (destination) params.append('destination', destination);
                                if (adults) params.append('adults', String(adults));
                                if (children) params.append('children', String(children));
                                navigate(`/activity/${activity.id}?${params.toString()}`);
                              }}
                            >
                              {getTranslation('common.viewDetails', language)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Ver más */}
            {activities.length > 10 && !showAllActivities && (
              <div className="text-center mt-5">
                <button 
                  className="btn btn-primary btn-lg px-5"
                  onClick={() => setShowAllActivities(true)}
                >
                  {getTranslation('home.activities.viewMore', language)} ({activities.length - 10} {getTranslation('home.activities.more', language)})
                </button>
              </div>
            )}
          </>
        )}

        {/* No activities message */}
        {!loadingActivities && activities.length === 0 && (
          <div className="text-center py-5">
            <div className="alert alert-info">
              <i className="fas fa-info-circle me-2"></i>
              {getTranslation('home.activities.noActivities', language)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

