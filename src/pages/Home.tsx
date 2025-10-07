import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { useConfig } from '../context/ConfigContext';
import { useUrlParams } from '../hooks/useUrlParams';
import ActivityGrid from '../components/ActivityGrid';
import type { ActivityCardData } from '../components/ActivityCard';
import DestinationGrid from '../components/DestinationGrid';
import DestinationCard from '../components/DestinationCard';
import type { DestinationCardData } from '../components/DestinationCard';
import { activitiesApi } from '../api/activities';
import type { Destination } from '../api/activities';


const Home: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { config } = useConfig();
  const { currency } = useUrlParams();

  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [isTravelersDropdownOpen, setIsTravelersDropdownOpen] = useState(false);
  const travelersDropdownRef = useRef<HTMLDivElement>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [activities, setActivities] = useState<ActivityCardData[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = config.business.website;
  }, [config.business.website]);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        console.log('Fetching activities with params:', { language, currency });
        const response = await activitiesApi.search({
          lang: language,
          currency: currency.toUpperCase(),
          page: 0,
          size: 50, // Obtener más actividades para mostrar
          active: true
        });
        
        if (response.success && response.data && response.data.length > 0) {
          // Mapear Activity a ActivityCardData
          const mappedActivities = response.data.map(activity => {
            const bookingOption = activity.bookingOptions?.[0];
            let price = 0;
            let currency = 'PEN';
            let isFrom = false;

            // Aplicar la lógica de precios
            if (bookingOption) {
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
            }

            return {
              id: activity.id,
              title: activity.title,
              description: Array.isArray(activity.description) ? activity.description.join(' ') : activity.description,
              imageUrl: activity.images?.[0]?.imageUrl || '',
              price: price,
              duration: `${bookingOption?.durationHours || 0}h ${bookingOption?.durationMinutes || 0}m`,
              rating: activity.rating || 0,
              reviewCount: 0, // No disponible en la interfaz Activity
              location: activity.pointsOfInterest?.[0]?.name || 'N/A',
              category: activity.categoryName || 'N/A',
              isActive: activity.isActive || true,
              includes: activity.includes || [],
              currency: currency,
              isFromPrice: isFrom
            };
          });
          
          // Debug: Verificar que los precios se mapeen correctamente
          console.log('Actividades mapeadas con precios:', mappedActivities.map(a => ({
            title: a.title,
            price: a.price,
            currency: a.currency,
            isFromPrice: a.isFromPrice
          })));
          
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
  }, [language, currency]);

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

    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);
    if (dates) params.append('date', dates);
    params.append('adults', adults.toString());
    params.append('children', children.toString());
    
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
      <div id="activities" className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold text-dark mb-3">
            Actividades Disponibles
          </h2>
          <p className="lead text-muted">
            Descubre todas las experiencias que tenemos para ti
          </p>
        </div>

        {/* Loading state para actividades */}
        {loadingActivities && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando actividades...</span>
            </div>
            <p className="text-muted">Cargando actividades disponibles...</p>
          </div>
        )}

        {/* Grid de actividades responsive */}
        {!loadingActivities && activities.length > 0 && (
          <>
            {/* Desktop/Tablet: 4 columnas en desktop, 3 en tablet */}
            <div className="row g-4 d-none d-md-flex">
              {getActivitiesToShow().map((activity, index) => (
                <div key={activity.id || index} className="col-lg-3 col-md-4">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="position-relative">
                      <img
                        src={activity.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                        className="card-img-top"
                        alt={activity.title}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="badge bg-primary">
                          {activity.duration}
                        </span>
                      </div>
                    </div>
                    <div className="card-body d-flex flex-column">
                      <h5 className="card-title fw-bold mb-2">
                        {activity.title}
                      </h5>
                      <p className="card-text text-muted flex-grow-1">
                        {activity.description?.substring(0, 100)}...
                      </p>
                      
                      {/* Información de "Que incluye" */}
                      {activity.includes && activity.includes.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold text-success mb-2">
                            <i className="fas fa-check-circle me-1"></i>
                            Incluye:
                          </h6>
                          <ul className="list-unstyled small text-muted mb-0">
                            {activity.includes.slice(0, 2).map((item, idx) => (
                              <li key={idx} className="mb-1">
                                <i className="fas fa-check text-success me-2" style={{ fontSize: '0.7rem' }}></i>
                                {item}
                              </li>
                            ))}
                            {activity.includes.length > 2 && (
                              <li className="text-primary fw-medium">
                                +{activity.includes.length - 2} más...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div className="text-primary fw-bold">
                          {getPriceValue(activity.price) > 0 ? (
                            <>
                              <span className="fs-5">
                                {activity.isFromPrice && 'desde '}
                                {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getPriceValue(activity.price))}
                              </span>
                              <small className="text-muted ms-1">por persona</small>
                            </>
                          ) : (
                            <span className="text-muted">Precio a consultar</span>
                          )}
                        </div>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/activity/${activity.id}`)}
                        >
                          Ver detalles
                        </button>
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
                    <div className="row g-0">
                      <div className="col-4">
                        <div className="position-relative">
                          <img
                            src={activity.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                            className="img-fluid rounded-start h-100"
                            alt={activity.title}
                            style={{ height: '120px', objectFit: 'cover' }}
                          />
                          <div className="position-absolute top-0 end-0 m-1">
                            <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>
                              {activity.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-8">
                        <div className="card-body p-3">
                          <h6 className="card-title fw-bold mb-1" style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                            {activity.title}
                          </h6>
                          <p className="card-text text-muted small mb-2" style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>
                            {activity.description?.substring(0, 60)}...
                          </p>
                          
                          {/* Información de "Que incluye" para móvil */}
                          {activity.includes && activity.includes.length > 0 && (
                            <div className="mb-2">
                              <div className="fw-bold text-success mb-1" style={{ fontSize: '0.75rem' }}>
                                <i className="fas fa-check-circle me-1" style={{ fontSize: '0.7rem' }}></i>
                                Incluye:
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
                                    +{activity.includes.length - 1} más...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="text-primary fw-bold">
                              {getPriceValue(activity.price) > 0 ? (
                                <>
                                  <span className="fs-6">
                                    {activity.isFromPrice && 'desde '}
                                    {activity.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getPriceValue(activity.price))}
                                  </span>
                                  <small className="text-muted ms-1" style={{ fontSize: '0.7rem' }}>por persona</small>
                                </>
                              ) : (
                                <span className="text-muted small">Precio a consultar</span>
                              )}
                            </div>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                              onClick={() => navigate(`/activity/${activity.id}`)}
                            >
                              Ver
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
                  Ver más actividades ({activities.length - 10} más)
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
              No hay actividades disponibles en este momento.
            </div>
          </div>
        )}
      </div>

      {/* Destinos como Carrusel Horizontal */}
      <div className="bg-light py-5">
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="display-6 fw-bold text-dark mb-3">
              Destinos Populares
            </h2>
            <p className="lead text-muted">
              Explora los destinos más visitados
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
            <div className="position-relative d-flex justify-content-center">
              <div className="overflow-hidden" style={{ width: '100%', maxWidth: '1200px' }}>
                <div 
                  className="d-flex flex-nowrap gap-4 justify-content-center"
                  style={{ 
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingBottom: '10px'
                  }}
                >
                  {destinations.map((destination) => (
                    <div 
                      key={destination.id} 
                      className="flex-shrink-0"
                      style={{ width: '350px' }}
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
                        detailsButtonText="Explorar destino"
                        className="mb-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              ¿Por qué elegirnos?
            </h2>
            <p className="lead text-muted">
              Especialistas en la Costa Sur de Perú
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
            ¿Listo para explorar la Costa Sur?
          </h2>
          <p className="lead">
            Únete a más de 8,000 viajeros que ya han descubierto Paracas, Ica y Nazca
          </p>
        </div>
      </div>

           </div>
   );
 };

export default Home; 