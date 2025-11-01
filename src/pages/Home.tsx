import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { getTranslation } from '../utils/translations';
import { useConfig } from '../context/ConfigContext';
import { useUrlParams } from '../hooks/useUrlParams';
import { usePageTitle } from '../hooks/usePageTitle';
import ActivityGrid from '../components/ActivityGrid';
import type { ActivityCardData } from '../components/ActivityCard';
import DestinationGrid from '../components/DestinationGrid';
import DestinationCard from '../components/DestinationCard';
import type { DestinationCardData } from '../components/DestinationCard';
import { activitiesApi } from '../api/activities';
import type { Destination } from '../api/activities';
import RatingStars from '../components/RatingStars';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  const { config } = useConfig();
  const { currency } = useUrlParams();

  // Estados del formulario (lo que el usuario está escribiendo)
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isTravelersDropdownOpen, setIsTravelersDropdownOpen] = useState(false);
  
  // Estados de búsqueda activa (lo que se está filtrando actualmente)
  const [activeDestination, setActiveDestination] = useState(searchParams.get('destination') || '');
  const [activeDates, setActiveDates] = useState(searchParams.get('date') || '');
  const [activeAdults, setActiveAdults] = useState(parseInt(searchParams.get('adults') || '1'));
  const [activeChildren, setActiveChildren] = useState(parseInt(searchParams.get('children') || '0'));
  const travelersDropdownRef = useRef<HTMLDivElement>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [activities, setActivities] = useState<ActivityCardData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  // Ref para el carrusel de destinos
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Set page title dynamically
  usePageTitle('nav.home', language);

  // Debug: Verificar currency al cargar
  useEffect(() => {
    console.log('🏠 Home - Currency desde URL:', {
      currencyFromURL: searchParams.get('currency'),
      currencyFromHook: currency,
      language
    });
  }, [currency, searchParams, language]);

  // Helper function to parse date in local timezone (America/Lima)
  const parseLocalDate = (dateString: string): Date => {
    // dateString formato: "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-').map(Number);
    // Crear fecha en timezone local (mes es 0-indexed)
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  };

  // Helper function to format date for display
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

  // Manejadores para arrastre del carrusel con mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carouselRef.current) return;
    // Solo iniciar drag si no es un click en un elemento interactivo
    if ((e.target as HTMLElement).closest('button, a')) return;
    
    setIsDown(true);
    setHasMoved(false);
    const slider = carouselRef.current;
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
    setHasMoved(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
    // Si no hubo movimiento, es un click
    if (!hasMoved) {
      // Permitir que el click llegue al elemento
    }
    setHasMoved(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDown || !carouselRef.current) return;
    e.preventDefault();
    setHasMoved(true); // Marcar que hubo movimiento
    const slider = carouselRef.current;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // Velocidad del scroll
    slider.scrollLeft = scrollLeft - walk;
  };

  // Efecto para carrusel infinito
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || destinations.length === 0) return;

    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return;
      
      clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const scrollWidth = carousel.scrollWidth;
        const clientWidth = carousel.clientWidth;
        const scrollLeft = carousel.scrollLeft;
        const halfWidth = scrollWidth / 2;

        // Si estamos en el último cuarto del scroll, volver al inicio (sutilmente)
        if (scrollLeft >= scrollWidth - clientWidth - 50) {
          isScrolling = true;
          const offset = scrollLeft - halfWidth;
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = halfWidth + (offset % halfWidth);
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isScrolling = false;
          }, 50);
        }
        
        // Si estamos muy al inicio, saltar al medio
        if (scrollLeft <= 50) {
          isScrolling = true;
          const offset = halfWidth - scrollLeft;
          carousel.style.scrollBehavior = 'auto';
          carousel.scrollLeft = halfWidth - (offset % halfWidth);
          setTimeout(() => {
            carousel.style.scrollBehavior = 'smooth';
            isScrolling = false;
          }, 50);
        }
      }, 150); // Esperar que el usuario termine de scrollear
    };

    carousel.addEventListener('scroll', handleScroll);
    
    // Inicializar en la posición del medio (inicio del segundo set)
    setTimeout(() => {
      const halfWidth = carousel.scrollWidth / 2;
      carousel.scrollLeft = halfWidth;
    }, 100);

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [destinations]);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await activitiesApi.search({
          lang: language,
          currency: currency.toUpperCase(),
          departureDate: activeDates || undefined, // Fecha de salida activa
          destinationCity: activeDestination || undefined, // Filtrar por destino activo
          page: 0,
          size: 50, // Obtener más actividades para mostrar
          active: true
        });
        
        // LOG 1: Verificar datos crudos del API
        if (response.success && response.data && response.data.length > 0) {
          const activitiesWithOfferFromAPI = response.data.filter(activity => {
            const bookingOption = activity.bookingOptions?.[0];
            return bookingOption?.specialOfferPercentage && bookingOption.specialOfferPercentage > 0;
          });
          
          if (activitiesWithOfferFromAPI.length > 0) {
            activitiesWithOfferFromAPI.forEach(activity => {
              const bookingOption = activity.bookingOptions?.[0];
            });
          }
          // Mapear Activity a ActivityCardData
          const mappedActivities = response.data.map(activity => {
            const bookingOption = activity.bookingOptions?.[0];
            let price = 0;
            let originalPrice = 0;
            let currency = 'PEN';
            let isFrom = false;
            let hasActiveOffer = false;
            let discountPercent = 0;

            // Aplicar la lógica de precios
            if (bookingOption) {
              // Obtener el precio base (el API ya devuelve precios en la moneda solicitada)
              if (bookingOption.pricingMode === 'PER_PERSON' && bookingOption.priceTiers && bookingOption.priceTiers.length > 0) {
                // Usar la moneda del priceTier (asumiendo que todos tienen la misma moneda)
                currency = bookingOption.priceTiers[0].currency || 'PEN';
                
                if (bookingOption.priceTiers.length > 1) {
                  price = Math.min(...bookingOption.priceTiers.map((tier: any) => tier.totalPrice));
                  isFrom = true;
                } else {
                  price = bookingOption.priceTiers[0].totalPrice;
                  isFrom = false;
                }
              } else {
                // Fallback al precio por persona y su moneda
                currency = bookingOption.currency || 'PEN';
                price = bookingOption.pricePerPerson || 0;
                isFrom = false;
              }
              // Aplicar descuento si existe specialOfferPercentage
              if (bookingOption.specialOfferPercentage && bookingOption.specialOfferPercentage > 0) {
                hasActiveOffer = true;
                originalPrice = price; // Guardar precio original
                discountPercent = bookingOption.specialOfferPercentage;
                
                // Calcular precio con descuento
                const discountAmount = price * (bookingOption.specialOfferPercentage / 100);
                price = price - discountAmount;
              } else {
                console.log(`   ❌ Sin descuento`);
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
              supplierName: activity.supplier?.name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') || '',
              supplierVerified: Boolean(activity.supplier?.isVerified),
              hasActiveOffer: hasActiveOffer,
              originalPrice: originalPrice > 0 ? originalPrice : undefined,
              discountPercent: discountPercent > 0 ? discountPercent : undefined,
              isNew: activity.isNew || false
            };
          });
          
          
          const withDiscount = mappedActivities.filter(a => a.hasActiveOffer);
          const withoutDiscount = mappedActivities.filter(a => !a.hasActiveOffer);
          
          if (withDiscount.length > 0) {
            console.log('\n🎁 Actividades con descuento (final):');
            withDiscount.forEach(a => {
              console.log(`   - ${a.title}: ${a.discountPercent}% OFF`);
            });
          }
          
          setActivities(mappedActivities);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [language, currency, activeDestination, activeDates]); // Depende de los filtros ACTIVOS, no del formulario

  // Fetch destinations from API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        setError(null);
        const response = await activitiesApi.getDestinations();
        
        if (!response.success || !response.data || response.data.length === 0) {
          setError('No se encontraron destinos disponibles en este momento.');
          setDestinations([]);
        } else {
          setDestinations(response.data);
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
        setError('Error al cargar los destinos. Por favor, inténtelo de nuevo.');
        setDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, []);

  // Inicializar formulario con valores de URL si existen
  useEffect(() => {
    const urlDestination = searchParams.get('destination');
    const urlDate = searchParams.get('date');
    const urlAdults = searchParams.get('adults');
    const urlChildren = searchParams.get('children');
    
    if (urlDestination) setDestination(urlDestination);
    if (urlDate) setDates(urlDate);
    if (urlAdults) setAdults(parseInt(urlAdults));
    if (urlChildren) setChildren(parseInt(urlChildren));
  }, []); // Solo al montar el componente

  // Hacer scroll a actividades si hay filtros en la URL (viene desde enlace externo)
  useEffect(() => {
    const hasFilters = searchParams.get('destination') || searchParams.get('date');
    if (hasFilters && window.location.hash === '#activities') {
      setTimeout(() => {
        const activitiesSection = document.getElementById('activities');
        if (activitiesSection) {
          activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
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

  const handleAdultsChange = (increment: boolean) => {
    if (increment) {
      setAdults(prev => prev + 1);
    } else {
      setAdults(prev => Math.max(1, prev - 1));
    }
  };

  const handleChildrenChange = (increment: boolean) => {
    if (increment) {
      setChildren(prev => prev + 1);
    } else {
      setChildren(prev => Math.max(0, prev - 1));
    }
  };

  const handleSearch = () => {
    // Validar que se haya seleccionado una fecha
    if (!dates) {
      setShowDateTooltip(true);
      // Ocultar el tooltip después de 3 segundos
      setTimeout(() => setShowDateTooltip(false), 3000);
      return;
    }

    // Navegar a la página de búsqueda con los parámetros
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (dates) params.set('date', dates);
    if (adults > 1) params.set('adults', adults.toString());
    if (children > 0) params.set('children', children.toString());
    
    // Navegar a /search con los parámetros
    navigate(`/search?${params.toString()}`);
  };

  const getTravelersText = () => {
    const total = adults + children;
    if (total === 1) return `1 ${getTranslation('home.search.travelers', language).toLowerCase()}`;
    return `${total} ${getTranslation('home.search.travelers', language).toLowerCase()}`;
  };

  const getActivitiesToShow = () => {
    if (showAllActivities || activities.length <= 10) {
      return activities;
    }
    return activities.slice(0, 10);
  };

  const getPriceValue = (price: number | string): number => {
    return typeof price === 'string' ? parseFloat(price) : price;
  };




  const features = [
    {
      icon: (
        <svg className="text-warning" width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
      title: 'Especialistas en Costa Sur',
      description: 'Más de 10 años de experiencia en Paracas, Ica y Nazca'
    },
    {
      icon: (
        <svg className="text-primary" width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      ),
      title: 'Guías Certificados',
      description: 'Expertos locales en arqueología, naturaleza y gastronomía'
    },
    {
      icon: (
        <svg className="text-success" width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Destinos Únicos',
      description: 'Líneas de Nazca, Islas Ballestas, Huacachina y más'
    },
    {
      icon: (
        <svg className="text-info" width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      ),
      title: 'Flexibilidad Total',
      description: 'Cancelación gratuita hasta 24h antes del viaje'
    }
  ];

  const stats = [
    { number: '8,000+', label: 'Viajeros Satisfechos' },
    { number: '15+', label: 'Actividades Especializadas' },
    { number: '99%', label: 'Tasa de Satisfacción' },
    { number: '24/7', label: 'Soporte en Español' }
  ];

  return (
    <div className="min-vh-100 bg-white">
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
      {/* Hero Section con Buscador */}
      <div 
        className="position-relative text-white py-5"
        style={{
          backgroundImage: 'url(https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh'
        }}
      >
        {/* Overlay oscuro para mejorar legibilidad */}
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-50"></div>
        
        <div className="container position-relative py-5">
          <div className="text-center mb-5">
            <h1 className="display-3 fw-bold mb-4">
              {getTranslation('home.hero.title', language)}
            </h1>
            <p className="lead mb-4">
              {getTranslation('home.hero.subtitle', language)}
            </p>
          </div>

          {/* Buscador Principal */}
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow-lg border-0">
                <div className="card-body p-4">
                  <div className="row g-3">
                    {/* Destino */}
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        {getTranslation('home.search.where', language)}
                      </label>
                      <div className="position-relative">
                        <svg className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <select
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="form-select ps-5"
                          disabled={loadingDestinations}
                        >
                          <option value="">
                            {loadingDestinations ? getTranslation('common.loading', language) : getTranslation('home.search.where', language)}
                          </option>
                          {destinations.map((dest) => (
                            <option key={dest.id} value={dest.cityName}>
                              {getTranslation(`destination.${dest.cityName}`, language)} ({dest.activityCount} actividades)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Fecha */}
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        {getTranslation('home.search.date', language)}
                      </label>
                      <div className="position-relative">
                        <svg className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                        <input
                          type="date"
                          value={dates}
                          onChange={(e) => {
                            setDates(e.target.value);
                            // Ocultar tooltip cuando se selecciona una fecha
                            if (e.target.value) {
                              setShowDateTooltip(false);
                            }
                          }}
                          onFocus={() => setShowDateTooltip(false)}
                          className={`form-control ps-5 ${showDateTooltip ? 'border-danger' : ''}`}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {/* Tooltip de error */}
                        {showDateTooltip && (
                          <div className="position-absolute top-100 start-0 mt-1 p-2 bg-danger text-white rounded shadow-sm" style={{ zIndex: 1000, fontSize: '0.875rem' }}>
                            <div className="d-flex align-items-center">
                              <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Seleccione fecha de salida
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Viajeros - Selector desplegable */}
                    <div className="col-md-4">
                      <label className="form-label fw-bold">
                        {getTranslation('home.search.travelers', language)}
                      </label>
                      <div className="position-relative" ref={travelersDropdownRef}>
                        <button
                          type="button"
                          className="form-select text-start d-flex align-items-center justify-content-between"
                          onClick={() => setIsTravelersDropdownOpen(!isTravelersDropdownOpen)}
                        >
                          <div className="d-flex align-items-center">
                            <svg className="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                            </svg>
                            <span>{getTravelersText()}</span>
                          </div>
                        </button>
                        
                        {/* Dropdown de viajeros */}
                        {isTravelersDropdownOpen && (
                          <div className="position-absolute top-100 start-0 w-100 mt-1 bg-white border rounded shadow-lg p-3 z-3">
                            {/* Adultos */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold mb-0">{getTranslation('home.search.adults', language)}</label>
                                <small className="text-muted">18+ años</small>
                              </div>
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleAdultsChange(false)}
                                  disabled={adults <= 1}
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            {/* Niños */}
                            <div className="mb-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="form-label fw-bold mb-0">{getTranslation('home.search.children', language)}</label>
                                <small className="text-muted">0-17 años</small>
                              </div>
                              <div className="d-flex align-items-center">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm"
                                  onClick={() => handleChildrenChange(false)}
                                  disabled={children <= 0}
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
                                  style={{ width: '40px', height: '40px' }}
                                >
                                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button 
                      className="btn btn-primary btn-lg w-100"
                      onClick={handleSearch}
                    >
                      <svg className="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                      {getTranslation('home.search.button', language)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="row g-4">
            {stats.map((stat, index) => (
              <div key={index} className="col-6 col-md-3 text-center">
                <div className="h2 fw-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-muted fw-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividades Disponibles */}
      <div id="activities" className="bg-light py-5">
        <div className="container">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold text-dark mb-3">
            {getTranslation('home.activities.available.title', language)}
          </h2>
          <p className="lead text-muted">
            {getTranslation('home.activities.available.subtitle', language)}
          </p>
          
          {/* Mostrar filtros aplicados (ACTIVOS) */}
          {(activeDestination || activeDates) && (
            <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
              {activeDestination && (
                <span className="badge bg-primary px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {getTranslation(`destination.${activeDestination}`, language)}
                </span>
              )}
              {activeDates && (
                <span className="badge bg-info px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {formatDateForDisplay(activeDates)}
                </span>
              )}
              {(activeAdults > 1 || activeChildren > 0) && (
                <span className="badge bg-secondary px-3 py-2">
                  <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                  {activeAdults} {getTranslation('home.search.adults', language)}, {activeChildren} {getTranslation('home.search.children', language)}
                </span>
              )}
              <button 
                className="badge bg-danger px-3 py-2 border-0" 
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // Limpiar formulario
                  setDestination('');
                  setDates('');
                  setAdults(1);
                  setChildren(0);
                  // Limpiar búsqueda activa
                  setActiveDestination('');
                  setActiveDates('');
                  setActiveAdults(1);
                  setActiveChildren(0);
                  // Limpiar URL
                  navigate('/');
                }}
              >
                <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {getTranslation('common.clearFilters', language) || 'Limpiar filtros'}
              </button>
            </div>
          )}
        </div>

        {/* Loading state para actividades */}
        {loadingActivities && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">{getTranslation('common.loading', language)}</span>
            </div>
            <p className="text-muted">{getTranslation('home.activities.loading', language)}</p>
          </div>
        )}

        {/* Grid de actividades responsive */}
        {!loadingActivities && activities.length > 0 && (
          <>
            {/* Desktop/Tablet: 4 columnas en desktop, 3 en tablet */}
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
                            {language === 'es' ? 'Nueva Actividad' : 'New Activity'}
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
                                aria-label={language === 'es' ? 'Proveedor verificado' : 'Verified provider'}
                              >
                                <i className="fas fa-check-circle me-1"></i>{language === 'es' ? 'Verificado' : 'Verified'}
                              </span>
                              <span className="verified-tooltip">
                                {language === 'es' 
                                  ? 'Proveedor verificado: cuenta con toda su documentación del gobierno local y del Ministerio de Turismo.'
                                  : 'Verified provider: holds all documentation from the local government and the Ministry of Tourism.'}
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
                      {/* Información de "Que incluye" */}
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
                                      {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(activity.originalPrice)}
                                    </span>
                                  </div>
                                )}
                                <span className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0px' }}>
                                  {activity.isFromPrice && `${getTranslation('home.activities.priceFrom', language)} `}
                                </span>
                                <div style={{ margin: '0px', padding: '0px' }}>
                                  <span className="fs-5 fw-bold" style={{ fontSize: '1rem', margin: '0px', padding: '0px' }}>
                                    {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getPriceValue(activity.price))}
                                  </span>
                                   <small className="text-muted" style={{ fontSize: '0.6rem', marginLeft: '0.25rem' , margin: '0px', padding: '0px' }}>
                                      {getTranslation('home.activities.perPerson', language)}
                                   </small>
                                </div>
                              </>
                            ) : (
                              <span className="text-muted">{getTranslation('home.activities.priceOnRequest', language)}</span>
                            )}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              const params = new URLSearchParams();
                              params.append('date', activeDates || (() => {
                                const today = new Date();
                                return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                              })());
                              params.append('currency', currency.toUpperCase());
                              params.append('lang', language);
                              if (activeDestination) params.append('destination', activeDestination);
                              if (activeAdults) params.append('adults', String(activeAdults));
                              if (activeChildren) params.append('children', String(activeChildren));
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
                </div>
              ))}
            </div>

            {/* Móvil: 1 columna con formato horizontal */}
            <div className="d-md-none">
              {getActivitiesToShow().map((activity, index) => (
                <div key={activity.id || index} className="mb-4">
                  <div className="card border-0 shadow-sm">
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
                                {language === 'es' ? 'Nueva Actividad' : 'New Activity'}
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
                                      aria-label={language === 'es' ? 'Proveedor verificado' : 'Verified provider'}
                                    >
                                      <i className="fas fa-check-circle me-1"></i>{language === 'es' ? 'Verificado' : 'Verified'}
                                    </span>
                                    <span className="verified-tooltip">
                                      {language === 'es' 
                                        ? 'Proveedor verificado: cuenta con toda su documentación del gobierno local y del Ministerio de Turismo.'
                                        : 'Verified provider: holds all documentation from the local government and the Ministry of Tourism.'}
                                    </span>
                                  </span>
                                )}
                              </p>
                            )}
                          <p className="card-text text-muted small mb-2" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                            {activity.presentation && activity.presentation.length > 100 ? `${activity.presentation?.substring(0, 100)}...` : activity.presentation}
                          </p>
                          
                          {/* Información de "Que incluye" para móvil */}
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
                                          {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(activity.originalPrice)}
                                        </span>
                                      </div>
                                    )}
                                    <span className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0px' }}>
                                      {activity.isFromPrice && `${getTranslation('home.activities.priceFrom', language)} `}
                                    </span>
                                    <div style={{ margin: '0px', padding: '0px' }}> 
                                      <span className="fs-6 fw-bold" style={{ fontSize: '1rem', margin: '0px', padding: '0px' }}>
                                        {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getPriceValue(activity.price))}
                                      </span>
                                      <small className="text-muted" style={{ fontSize: '0.55rem', marginLeft: '0.25rem' , margin: '0px', padding: '0px' }}>
                                        {getTranslation('home.activities.perPerson', language)}
                                      </small>
                                    </div>
                                  </>
                                ) : (
                                  <span className="text-muted small">{getTranslation('home.activities.priceOnRequest', language)}</span>
                                )}
                              </div>
                            </div>
                            <div className="d-flex gap-1">
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', whiteSpace: 'normal', lineHeight: '1.2' }}
                                onClick={() => {
                                  const params = new URLSearchParams();
                                  params.append('date', activeDates || (() => {
                                    const today = new Date();
                                    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                  })());
                                  params.append('currency', currency.toUpperCase());
                                  params.append('lang', language);
                                  if (activeDestination) params.append('destination', activeDestination);
                                  if (activeAdults) params.append('adults', String(activeAdults));
                                  if (activeChildren) params.append('children', String(activeChildren));
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

      {/* Destinos como Carrusel Horizontal */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="display-6 fw-bold text-dark mb-3">
              {getTranslation('home.destinations.title', language)}
            </h2>
            <p className="lead text-muted">
              {getTranslation('home.destinations.subtitle', language)}
            </p>
          </div>

          {/* Alert de error para destinos */}
          {error && (
            <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setError(null)}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Loading state para destinos */}
          {loadingDestinations && (
            <div className="text-center py-4">
              <div className="spinner-border text-primary mb-2" role="status">
                <span className="visually-hidden">Cargando destinos...</span>
              </div>
              <p className="text-muted">Cargando destinos...</p>
            </div>
          )}

          {/* Carrusel horizontal de destinos usando DestinationGrid */}
          {!loadingDestinations && destinations.length > 0 && (
            <>
              {/* Estilos para el carrusel */}
              <style>{`
                .destination-carousel-container {
                  overflow-x: auto !important;
                  overflow-y: hidden !important;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                  -webkit-overflow-scrolling: touch;
                  touch-action: pan-x !important;
                  cursor: grab;
                  user-select: none;
                }
                .destination-carousel-container:active {
                  cursor: grabbing;
                  scroll-behavior: auto;
                }
                .destination-carousel-container::-webkit-scrollbar {
                  display: none;
                }
                .destination-carousel-item {
                  pointer-events: auto;
                }
                .destination-carousel-item button,
                .destination-carousel-item a {
                  pointer-events: auto !important;
                  cursor: pointer !important;
                }
                .destination-carousel-container.dragging .destination-carousel-item {
                  pointer-events: none;
                }
                .destination-carousel-container.dragging .destination-carousel-item button,
                .destination-carousel-container.dragging .destination-carousel-item a {
                  pointer-events: none !important;
                }
                .destination-carousel-container.dragging .destination-card-hover {
                  transform: none !important;
                }
                /* Móvil: Primera card completa + segunda a la mitad */
                @media (max-width: 767px) {
                  .destination-carousel-item {
                    width: 75vw !important;
                  }
                }
                /* Tablet */
                @media (min-width: 768px) and (max-width: 991px) {
                  .destination-carousel-item {
                    width: 45vw !important;
                  }
                }
                /* Desktop */
                @media (min-width: 992px) {
                  .destination-carousel-item {
                    width: 350px !important;
                  }
                }
              `}</style>
              
              <div className="position-relative" style={{ width: '100%', overflowX: 'hidden' }}>
                <div 
                  ref={carouselRef}
                  className={`destination-carousel-container d-flex gap-3 px-3 ${isDown ? 'dragging' : ''}`}
                  style={{ 
                    paddingBottom: '10px',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: isDown ? 'auto' : 'smooth'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                >
                  {/* Duplicar destinos para efecto infinito */}
                  {[...destinations, ...destinations].map((destination, index) => (
                    <div 
                      key={`${destination.id}-${index}`} 
                      className="destination-carousel-item flex-shrink-0"
                    >
            <DestinationGrid
                        destinations={[{
                id: destination.id,
                cityName: destination.cityName,
                countryId: destination.countryId,
                latitude: destination.latitude,
                longitude: destination.longitude,
                activityCount: destination.activityCount,
                          imageUrl: destination.imageUrl,
                          active: true
                        }]}
                        columns={12}
              variant="default"
              showDetailsButton={true}
                        detailsButtonText={getTranslation('destination.exploreDestination', language)}
                        className="mb-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* No destinations message */}
          {!loadingDestinations && !error && destinations.length === 0 && (
            <div className="text-center py-4">
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                No hay destinos disponibles en este momento.
              </div>
            </div>
          )}
        </div>
        </div>

      {/* Características */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">
              {getTranslation('home.whyChooseUs.title', language)}
            </h2>
            <p className="lead text-muted">
              {getTranslation('home.whyChooseUs.subtitle', language)}
            </p>
          </div>

          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-3 text-center">
                <div className="mb-3">
                  {feature.icon}
                </div>
                <h5 className="fw-bold mb-2">
                  {feature.title}
                </h5>
                <p className="text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary text-white py-5">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-3">
            {getTranslation('home.readyToExplore.title', language)}
          </h2>
          <p className="lead">
            {getTranslation('home.readyToExplore.subtitle', language)}
          </p>
        </div>
      </div>

           </div>
   );
 };

export default Home; 