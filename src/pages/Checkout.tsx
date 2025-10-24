import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation, getLanguageName } from '../utils/translations';

interface BookingDetails {
  activityId: string;
  title: string;
  imageUrl: string;
  price: number;
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
  hasDiscount: boolean;
  discountPercentage: number;
  originalPrice: number;
  finalPrice: number;
  pickupPoint?: {
    name: string;
    address: string;
  };
  comment?: string;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { config } = useConfig();
  const { user, isAuthenticated } = useAuth();
  
  // Función para navegar a home
  const handleLogoClick = () => {
    navigate('/');
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
    return savedTime ? parseInt(savedTime) : 30 * 60; // 30 minutes por defecto
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: 'Perú (+51)',
    phone: ''
  });

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
      } else {
        console.log('⚠️ Checkout: No hay bookingDetails, pero manteniendo en checkout y mostrando modal');
        // En lugar de redirigir, mostrar modal de login
        setShowLoginModal(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [location.state, navigate]);

  // Show login modal if user is not authenticated OR if no booking details
  useEffect(() => {
    if ((bookingDetails && !isAuthenticated) || (!bookingDetails && !isAuthenticated)) {
      setShowLoginModal(true);
    }
  }, [bookingDetails, isAuthenticated]);

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
      // Tiempo expirado, limpiar datos y redirigir
      sessionStorage.removeItem('checkoutBookingDetails');
      sessionStorage.removeItem('checkoutTimeLeft');
      navigate('/cart');
    }
  }, [timeLeft, navigate]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContinueWithoutLogin = () => {
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
    if (!formData.name || !formData.email || !formData.phone) {
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
                    onClick={() => setShowLoginModal(false)}
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
                  {getTranslation('checkout.reservationTimer', language)} {formatTime(timeLeft)} {getTranslation('checkout.minutes', language)}.
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
                      placeholder="Ingresa tu nombre completo"
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
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-medium">
                      {getTranslation('checkout.countryRequired', language)}
                    </label>
                    <select
                      className="form-select"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    >
                      <option value="Perú (+51)">Perú (+51)</option>
                      <option value="Estados Unidos (+1)">Estados Unidos (+1)</option>
                      <option value="España (+34)">España (+34)</option>
                      <option value="México (+52)">México (+52)</option>
                    </select>
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
                      placeholder="123456789"
                    />
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
                    <div className="d-flex align-items-center">
                      <i className="fas fa-check text-success me-2"></i>
                      <span className="fw-medium">{getTranslation('checkout.easyCancellation', language)} - Hasta las 8:00 del 31 de octubre</span>
                    </div>
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
                    alt={bookingDetails.title}
                    className="rounded me-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{bookingDetails.title}</h5>
                    <div className="d-flex align-items-center mb-2">
                      <div className="d-flex align-items-center me-3">
                        {[...Array(5)].map((_, i) => (
                          <i key={i} className="fas fa-star text-warning me-1" style={{ fontSize: '0.8rem' }}></i>
                        ))}
                        <span className="fw-medium me-1">4.7</span>
                        <small className="text-muted">(641)</small>
                      </div>
                    </div>
                    <span className="badge bg-primary">{getTranslation('checkout.bestRated', language)}</span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="mb-4">
                  {/* Idioma del guía */}
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-language text-primary me-2"></i>
                    <span className="small">
                      {getTranslation('checkout.language', language)}: {bookingDetails.guideLanguage}
                    </span>
                  </div>
                  
                  {/* Punto de encuentro o recogida */}
                  <div className="d-flex align-items-start mb-2">
                    <i className="fas fa-map-marker-alt text-primary me-2 mt-1"></i>
                    <div className="flex-grow-1">
                      <span className="small fw-medium d-block">
                        {getTranslation('checkout.meetingPoint', language)}:
                      </span>
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
                    </div>
                  </div>
                  
                  {/* Comentario si existe */}
                  {bookingDetails.comment && (
                    <div className="d-flex align-items-start mb-2">
                      <i className="fas fa-comment text-primary me-2 mt-1"></i>
                      <div className="flex-grow-1">
                        <span className="small fw-medium d-block">
                          {language === 'es' ? 'Solicitud especial' : 'Special request'}:
                        </span>
                        <span className="small text-muted">
                          {bookingDetails.comment}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Fecha y hora */}
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-clock text-primary me-2"></i>
                    <span className="small">
                      {new Date(bookingDetails.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}, {convertTo12HourFormat(bookingDetails.time)}
                    </span>
                  </div>
                  
                  {/* Viajeros */}
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-user text-primary me-2"></i>
                    <span className="small">
                      {bookingDetails.travelers.adults} {language === 'es' ? 'adulto' : 'adult'} {bookingDetails.travelers.adults > 1 ? (language === 'es' ? 'adultos' : 'adults') : ''}
                      {bookingDetails.travelers.children > 0 && (
                        <> • {bookingDetails.travelers.children} {language === 'es' ? 'niño' : 'child'} {bookingDetails.travelers.children > 1 ? (language === 'es' ? 'niños' : 'children') : ''}</>
                      )}
                    </span>
                  </div>
                  
                  {/* Opción de cambio */}
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-pencil-alt text-primary me-2"></i>
                    <a href="#" className="text-primary text-decoration-none small">
                      {getTranslation('checkout.changeDateParticipants', language)}
                    </a>
                  </div>
                </div>

                {/* Cancellation & Quality */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-check text-success me-2"></i>
                    <span className="small">{getTranslation('checkout.easyCancellation', language)} - Hasta las 8:00 del 31 de octubre</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <i className="fas fa-thumbs-up text-success me-2"></i>
                    <span className="small">{getTranslation('checkout.goodValue', language)} - La actividad ha recibido un 4.4/5 por su relación calidad-precio</span>
                  </div>
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
                      {bookingDetails.hasDiscount && (
                        <div className="text-muted text-decoration-line-through small">
                          {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{bookingDetails.originalPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="fw-bold text-danger fs-5">
                        {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{bookingDetails.finalPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-muted small">
                    {getTranslation('checkout.allTaxesIncluded', language)}
                  </div>
                  {bookingDetails.hasDiscount && (
                    <div className="text-success small mt-2">
                      <i className="fas fa-check me-1"></i>
                      {getTranslation('checkout.saveWithOffer', language)} {bookingDetails.currency === 'PEN' ? 'S/ ' : '$ '}{(bookingDetails.originalPrice - bookingDetails.finalPrice).toFixed(2)}
                    </div>
                  )}
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
                  onClick={() => setShowLoginModal(false)}
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
