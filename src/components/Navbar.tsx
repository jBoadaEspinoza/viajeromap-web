import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useConfig } from '../context/ConfigContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../utils/translations';
import LanguageCurrencyModal from './LanguageCurrencyModal';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();
  const { config } = useConfig();
  const { getTotalItems } = useCart();
  const { isAuthenticated, login } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguagePageViewOpen, setIsLanguagePageViewOpen] = useState(false);
  const [isCurrencyPageViewOpen, setIsCurrencyPageViewOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // Estado para el menú contextual de perfil
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false); // Estado para el modal de login (desktop)
  const [isLoginPageViewOpen, setIsLoginPageViewOpen] = useState(false); // Estado para el page view de login (mobile)
  const [loginPhone, setLoginPhone] = useState(''); // Estado para el teléfono del login
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // Estado para loading de Google
  const [firebaseUser, setFirebaseUser] = useState<any>(null); // Estado para el usuario de Firebase
  
  const cartItems = getTotalItems();

  // Leer información del usuario de Firebase desde localStorage
  useEffect(() => {
    const userData = localStorage.getItem('firebaseUser');
    console.log('🔍 Navbar - Leyendo usuario de localStorage:', userData);
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        console.log('✅ Navbar - Usuario parseado:', parsedData);
        setFirebaseUser(parsedData);
      } catch (error) {
        console.error('❌ Error parsing firebaseUser:', error);
      }
    } else {
      console.log('⚠️ Navbar - No hay usuario en localStorage');
    }
  }, []);

  // Función para validar formato de teléfono
  const isValidPhone = (phone: string): boolean => {
    // Validar formato de teléfono internacional (mínimo 10 dígitos)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    setIsLanguagePageViewOpen(false); // Cerrar language page view si está abierta
    setIsCurrencyPageViewOpen(false); // Cerrar currency page view si está abierta
    
    // Emitir evento personalizado para notificar el cambio de estado
    const event = new CustomEvent('mobileMenuToggle', { 
      detail: { isOpen: newState } 
    });
    window.dispatchEvent(event);
  };

  const openLanguagePageView = () => {
    setIsLanguagePageViewOpen(true);
    
    // Emitir evento para notificar que cualquier page view está abierta
    const event = new CustomEvent('mobileMenuToggle', { 
      detail: { isOpen: true } 
    });
    window.dispatchEvent(event);
  };

  const closeLanguagePageView = () => {
    setIsLanguagePageViewOpen(false);
    
    // Solo emitir evento de cierre si el menú principal también está cerrado
    if (!isMobileMenuOpen) {
      const event = new CustomEvent('mobileMenuToggle', { 
        detail: { isOpen: false } 
      });
      window.dispatchEvent(event);
    }
  };

  const handleLanguageSelect = (selectedLang: 'es' | 'en') => {
    setLanguage(selectedLang);
    setIsLanguagePageViewOpen(false);
    setIsMobileMenuOpen(false);
    
    // Emitir evento de cierre completo
    const event = new CustomEvent('mobileMenuToggle', { 
      detail: { isOpen: false } 
    });
    window.dispatchEvent(event);
  };

  const openCurrencyPageView = () => {
    setIsCurrencyPageViewOpen(true);
    
    // Emitir evento para notificar que cualquier page view está abierta
    const event = new CustomEvent('mobileMenuToggle', { 
      detail: { isOpen: true } 
    });
    window.dispatchEvent(event);
  };

  const closeCurrencyPageView = () => {
    setIsCurrencyPageViewOpen(false);
    
    // Solo emitir evento de cierre si el menú principal también está cerrado
    if (!isMobileMenuOpen) {
      const event = new CustomEvent('mobileMenuToggle', { 
        detail: { isOpen: false } 
      });
      window.dispatchEvent(event);
    }
  };

  const handleCurrencySelect = (selectedCurrency: 'USD' | 'PEN') => {
    setCurrency(selectedCurrency);
    setIsCurrencyPageViewOpen(false);
    setIsMobileMenuOpen(false);
    
    // Emitir evento de cierre completo
    const event = new CustomEvent('mobileMenuToggle', { 
      detail: { isOpen: false } 
    });
    window.dispatchEvent(event);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleCartClick = () => {
    // Navegar a la página del carrito
    navigate('/cart');
  };

  const handleMyBookingsClick = () => {
    // TODO: Implementar navegación a la página de mis reservas
    console.log('Mis reservas click');
    // Por ahora mostrar un mensaje
    alert(language === 'es' 
      ? 'Próximamente: Mis reservas' 
      : 'Coming soon: My bookings'
    );
  };

  const handleLoginClick = () => {
    // Determinar si es móvil o desktop basado en el ancho de pantalla
    const isMobile = window.innerWidth < 992;
    
    if (isMobile) {
      setIsLoginPageViewOpen(true);
      setIsMobileMenuOpen(false); // Cerrar el menú móvil
    } else {
      setIsLoginModalOpen(true);
      setIsProfileMenuOpen(false); // Cerrar el menú de perfil
    }
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginPhone('');
  };

  const closeLoginPageView = () => {
    setIsLoginPageViewOpen(false);
    setLoginPhone('');
  };

  const handleLoginWithGoogle = async () => {
    try {
      console.log('Iniciando login con Google...');
      
      // Activar loading
      setIsGoogleLoading(true);
      
      // Autenticar con Google usando Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('✅ Login exitoso con Google:', {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid
      });
      
      // Guardar la información del usuario en localStorage
      const userData = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid
      };
      
      console.log('💾 Guardando usuario en localStorage:', userData);
      localStorage.setItem('firebaseUser', JSON.stringify(userData));
      
      // Verificar que se guardó correctamente
      const savedData = localStorage.getItem('firebaseUser');
      console.log('✅ Usuario guardado en localStorage:', savedData);
      
      // Actualizar el estado del usuario
      setFirebaseUser(userData);
      console.log('✅ Estado firebaseUser actualizado:', userData);
      
      // Cerrar modales
      setIsLoginModalOpen(false);
      setIsLoginPageViewOpen(false);
      
      // Desactivar loading después de cerrar modales
      setIsGoogleLoading(false);
      
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      
      // Desactivar loading
      setIsGoogleLoading(false);
      
      // Mostrar mensaje de error al usuario
      alert(language === 'es' 
        ? 'Error al iniciar sesión con Google' 
        : 'Error signing in with Google'
      );
    }
  };

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    
    // Limpiar localStorage
    localStorage.removeItem('firebaseUser');
    
    // Limpiar estado
    setFirebaseUser(null);
    
    // Cerrar menús
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    
    console.log('✅ Sesión cerrada exitosamente');
  };


  const handlePhoneLogin = async () => {
    if (!isValidPhone(loginPhone)) return;
    
    try {
      // Aquí implementar la lógica de login por teléfono
      console.log('Login with phone:', loginPhone);
      setIsLoginModalOpen(false);
      setIsLoginPageViewOpen(false);
      setLoginPhone('');
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const getLanguageFlag = (lang: string) => {
    return lang === 'es' ? '🇪🇸' : '🇺🇸';
  };

  const getLanguageName = (lang: string) => {
    return lang === 'es' ? getTranslation('lang.spanish', language) : getTranslation('lang.english', language);
  };

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes slideOutLeft {
          from { transform: translateX(0); }
          to { transform: translateX(-100%); }
        }
        
        .mobile-menu-item:hover {
          background-color: #f8f9fa;
        }

        .modal-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
      
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between w-100">
          {/* Logo */}
          <Link to="/" className="navbar-brand d-flex align-items-center">
            <img
              src={config.business.urlLogo}
              alt="Viajero Map Logo"
              height="40"
              className="d-inline-block align-text-top me-2"
            />
            <span className="fw-bold">{config.business.name}</span>
          </Link>

          {/* Action Icons - Mobile Only */}
          <div className="d-flex align-items-center gap-3 d-lg-none">
            {/* Heart Icon */}
            <button 
              className="btn btn-link p-2"
              style={{ border: 'none', backgroundColor: 'transparent' }}
              aria-label="Favorites"
            >
              <i className="fas fa-heart text-muted" style={{ fontSize: '1.2rem' }}></i>
            </button>

            {/* Shopping Cart Icon */}
            <div className="position-relative">
              <button 
                className="btn btn-link p-2"
                style={{ border: 'none', backgroundColor: 'transparent' }}
                aria-label="Shopping Cart"
                onClick={handleCartClick}
              >
                <i className="fas fa-shopping-cart text-muted" style={{ fontSize: '1.2rem' }}></i>
              </button>
              {/* Cart Items Badge */}
              {cartItems > 0 && (
                <span 
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: '0.6rem', padding: '0.2rem 0.3rem' }}
                >
                  {cartItems}
                </span>
              )}
            </div>

            {/* My Bookings Icon - only show if logged in */}
            {firebaseUser && (
              <div className="position-relative">
                <button 
                  className="btn btn-link p-2"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                  aria-label="My Bookings"
                  onClick={handleMyBookingsClick}
                >
                  <i className="fas fa-calendar-check text-muted" style={{ fontSize: '1.2rem' }}></i>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="position-relative">
              <button
                className="btn btn-link p-2"
                type="button"
                onClick={toggleMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle navigation"
                style={{ border: 'none', backgroundColor: 'transparent' }}
              >
                <i className="fas fa-bars text-muted" style={{ fontSize: '1.2rem' }}></i>
              </button>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="d-none d-lg-flex align-items-center gap-3">
            {/* Shopping Cart - Desktop */}
            <div className="position-relative">
              <button
                className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
                style={{ border: 'none', backgroundColor: 'transparent' }}
                type="button"
                onClick={handleCartClick}
              >
                <i className="fas fa-shopping-cart fs-6"></i>
                <div className="d-flex align-items-center">
                  <span className="small" style={{ fontSize: '0.7rem' }}>{getTranslation('cart.title', language)}</span>
                  {cartItems > 0 && (
                    <span className="ms-1 small badge bg-danger" style={{ fontSize: '0.6rem' }}>
                      {cartItems}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* My Bookings - Desktop - only show if logged in */}
            {firebaseUser && (
              <div className="position-relative">
                <button
                  className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                  type="button"
                  onClick={handleMyBookingsClick}
                >
                  <i className="fas fa-calendar-check fs-6"></i>
                  <span className="small" style={{ fontSize: '0.7rem' }}>{language === 'es' ? 'Mis reservas' : 'My bookings'}</span>
                </button>
              </div>
            )}

            {/* Language and Currency Selector - Desktop */}
            <button
              className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
              style={{ border: 'none', backgroundColor: 'transparent' }}
              type="button"
              onClick={openModal}
            >
              <i className="fa-solid fa-globe fs-6"></i>
              <div className="d-flex align-items-center">
                <span className="small" style={{ fontSize: '0.7rem' }}>{language.toUpperCase()}</span>
                <span className="mx-1 small" style={{ fontSize: '0.7rem' }}>/</span>
                <span className="small" style={{ fontSize: '0.7rem' }}>{currency}</span>
              </div>
            </button>

            {/* Profile Context Menu - Desktop */}
            <div 
              className="position-relative"
              onMouseEnter={() => setIsProfileMenuOpen(true)}
              onMouseLeave={() => setIsProfileMenuOpen(false)}
            >
              <button
                className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
                style={{ border: 'none', backgroundColor: 'transparent' }}
                type="button"
              >
                <div className="position-relative">
                  {(() => {
                    console.log('🖼️ Botón perfil - firebaseUser:', firebaseUser);
                    console.log('🖼️ Botón perfil - photoURL:', firebaseUser?.photoURL);
                    return firebaseUser?.photoURL ? (
                      <img 
                        src={firebaseUser.photoURL} 
                        alt={firebaseUser.displayName || 'User'} 
                        style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          console.error('❌ Error cargando imagen:', e);
                        }}
                        onLoad={() => {
                          console.log('✅ Imagen cargada exitosamente');
                        }}
                      />
                    ) : (
                      <i className="fa-regular fa-circle-user fs-6"></i>
                    );
                  })()}
                </div>
                {firebaseUser?.displayName && (
                  <span className="small" style={{ fontSize: '0.7rem', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firebaseUser.displayName}
                  </span>
                )}
                <div className="d-flex align-items-center">
                  <span className="small" style={{ fontSize: '0.7rem' }}>{getTranslation('profile.title', language)}</span>
                </div>
              </button>

              {/* Profile Context Menu */}
              {isProfileMenuOpen && (
                <div 
                  className="position-absolute end-0 top-100 mt-2 bg-white rounded shadow-lg border"
                  style={{ 
                    minWidth: '280px',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-in-out'
                  }}
                >
                  {/* Title */}
                  <div className="px-4 py-3 border-bottom">
                    <h6 className="mb-0 fw-bold">{getTranslation('profile.title', language)}</h6>
                  </div>

                  {/* User info if logged in */}
                  {firebaseUser && (
                    <div className="px-4 py-3 border-bottom">
                      <div className="d-flex align-items-center">
                        {firebaseUser.photoURL && (
                          <img 
                            src={firebaseUser.photoURL} 
                            alt={firebaseUser.displayName || 'User'} 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%',
                              objectFit: 'cover',
                              marginRight: '12px'
                            }}
                          />
                        )}
                        <div className="flex-grow-1">
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                            {firebaseUser.displayName || 'Usuario'}
                          </div>
                          <div className="text-muted small">
                            {firebaseUser.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="py-2">
                    {/* Log in or sign up - only show if not logged in */}
                    {!firebaseUser && (
                      <>
                        <div 
                          className="px-4 py-2 d-flex align-items-center justify-content-between"
                          style={{ backgroundColor: '#f8f9fa', cursor: 'pointer' }}
                          onClick={handleLoginClick}
                        >
                          <div className="d-flex align-items-center">
                            <i className="fas fa-arrow-right text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                            <span className="fw-medium">{getTranslation('pageview.login.title', language)}</span>
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="border-top my-2"></div>
                      </>
                    )}

                    {/* Logout - only show if logged in */}
                    {firebaseUser && (
                      <>
                        <div 
                          className="px-4 py-2 d-flex align-items-center justify-content-between"
                          style={{ cursor: 'pointer' }}
                          onClick={handleLogout}
                        >
                          <div className="d-flex align-items-center">
                            <i className="fas fa-sign-out-alt text-danger me-3" style={{ fontSize: '1.2rem' }}></i>
                            <span className="fw-medium text-danger">{language === 'es' ? 'Cerrar sesión' : 'Logout'}</span>
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="border-top my-2"></div>
                      </>
                    )}

                    {/* Support */}
                    <div 
                      className="px-4 py-2 d-flex align-items-center justify-content-between"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <i className="fas fa-question-circle text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                        <span className="fw-medium">{getTranslation('pageview.support.title', language)}</span>
                      </div>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </div>

                    {/* Download the app */}
                    <div 
                      className="px-4 py-2 d-flex align-items-center justify-content-between"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <i className="fas fa-mobile-alt text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                        <span className="fw-medium">{getTranslation('pageview.download.title', language)}</span>
                      </div>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      
      {/* Mobile Menu - Page View */}
      {isMobileMenuOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ 
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={toggleMobileMenu}
        >
          <div 
            className="position-fixed top-0 start-0 h-100 bg-white"
            style={{ 
              width: '100%',
              zIndex: 10000,
              animation: 'slideInLeft 0.3s ease-in-out',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold"></h4>
              <button 
                className="btn btn-link text-white p-0"
                onClick={toggleMobileMenu}
                style={{ fontSize: '1.5rem' }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-0">
              {/* Profile Section */}
              <div>
                <div className="p-3">
                  <h6 className="text-muted fw-bold mb-3 text-uppercase" style={{ fontSize: '0.75rem' }}>
                    Profile
                  </h6>
                  
                  {/* User info if logged in */}
                  {firebaseUser ? (
                    <>
                      <div className="d-flex align-items-center py-2 mb-3">
                        {firebaseUser.photoURL && (
                          <img 
                            src={firebaseUser.photoURL} 
                            alt={firebaseUser.displayName || 'User'} 
                            style={{ 
                              width: '40px', 
                              height: '40px', 
                              borderRadius: '50%',
                              objectFit: 'cover',
                              marginRight: '12px'
                            }}
                          />
                        )}
                        <div className="flex-grow-1">
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                            {firebaseUser.displayName || 'Usuario'}
                          </div>
                          <div className="text-muted small">
                            {firebaseUser.email}
                          </div>
                        </div>
                      </div>
                      
                      {/* Logout button for mobile */}
                      <div 
                        className="d-flex align-items-center justify-content-between py-2 mobile-menu-item mb-3" 
                        onClick={handleLogout}
                        style={{ borderRadius: '8px', cursor: 'pointer' }}
                      >
                        <div className="d-flex align-items-center">
                          <i className="fas fa-sign-out-alt text-danger me-3" style={{ fontSize: '1.2rem' }}></i>
                          <span className="fw-medium text-danger">{language === 'es' ? 'Cerrar sesión' : 'Logout'}</span>
                        </div>
                        <i className="fas fa-chevron-right text-muted"></i>
                      </div>
                    </>
                  ) : (
                    /* Log in or sign up */
                    <div 
                      className="d-flex align-items-center justify-content-between py-2 mobile-menu-item" 
                      onClick={handleLoginClick}
                      style={{ borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center">
                        <i className="fas fa-arrow-right text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                        <span className="fw-medium">{getTranslation('pageview.login.title', language)}</span>
                      </div>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </div>
                  )}
                  
                  {/* Currency */}
                  <div className="d-flex align-items-center justify-content-between py-2 mobile-menu-item" onClick={openCurrencyPageView} style={{ borderRadius: '8px', cursor: 'pointer' }}>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}>
                        $
                      </div>
                      <span className="fw-medium">{getTranslation('pageview.currency.title', language)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="text-muted me-2">{currency}</span>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </div>
                  </div>
                  
                  {/* Language */}
                  <div className="d-flex align-items-center justify-content-between py-2 mobile-menu-item" onClick={openLanguagePageView} style={{ borderRadius: '8px', cursor: 'pointer' }}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-globe text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                      <span className="fw-medium">{getTranslation('pageview.language.title', language)}</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <span className="text-muted me-2">{language === 'es' ? 'Spanish' : 'English'}</span>
                      <i className="fas fa-chevron-right text-muted"></i>
                    </div>
                  </div>
                  
                  {/* Support */}
                  <div className="d-flex align-items-center justify-content-between py-2 mobile-menu-item" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-question-circle text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                      <span className="fw-medium">{getTranslation('pageview.support.title', language)}</span>
                    </div>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </div>
                  
                  {/* Download the app */}
                  <div className="d-flex align-items-center justify-content-between py-2 mobile-menu-item" style={{ borderRadius: '8px', cursor: 'pointer' }}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-mobile-alt text-primary me-3" style={{ fontSize: '1.2rem' }}></i>
                      <span className="fw-medium">{getTranslation('pageview.download.title', language)}</span>
                    </div>
                    <i className="fas fa-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Page View */}
      {isLanguagePageViewOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ 
            zIndex: 10002,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={closeLanguagePageView}
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
                  onClick={closeLanguagePageView}
                  style={{ fontSize: '1.2rem' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4 className="mb-0 fw-bold">{getTranslation('pageview.language.title', language)}</h4>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h6 className="text-muted fw-bold mb-3 text-uppercase" style={{ fontSize: '0.75rem' }}>
                {getTranslation('pageview.language.selectLanguage', language)}
              </h6>
              
              {/* Spanish Option */}
              <div 
                className="d-flex align-items-center justify-content-between py-3 mobile-menu-item" 
                onClick={() => handleLanguageSelect('es')}
                style={{ 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  backgroundColor: language === 'es' ? '#e3f2fd' : 'transparent',
                  border: language === 'es' ? '2px solid #007bff' : '2px solid transparent'
                }}
              >
                <div className="d-flex align-items-center">
                  <span className="me-3" style={{ fontSize: '1.5rem' }}>🇪🇸</span>
                  <div>
                    <div className="fw-medium">{getTranslation('pageview.language.spanish', language)}</div>
                    <div className="text-muted small">{language === 'es' ? 'Spanish' : 'Español'}</div>
                  </div>
                </div>
                {language === 'es' && (
                  <i className="fas fa-check text-primary" style={{ fontSize: '1.2rem' }}></i>
                )}
              </div>
              
              {/* English Option */}
              <div 
                className="d-flex align-items-center justify-content-between py-3 mobile-menu-item" 
                onClick={() => handleLanguageSelect('en')}
                style={{ 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  backgroundColor: language === 'en' ? '#e3f2fd' : 'transparent',
                  border: language === 'en' ? '2px solid #007bff' : '2px solid transparent'
                }}
              >
                <div className="d-flex align-items-center">
                  <span className="me-3" style={{ fontSize: '1.5rem' }}>🇺🇸</span>
                  <div>
                    <div className="fw-medium">{getTranslation('pageview.language.english', language)}</div>
                    <div className="text-muted small">{language === 'es' ? 'English' : 'Inglés'}</div>
                  </div>
                </div>
                {language === 'en' && (
                  <i className="fas fa-check text-primary" style={{ fontSize: '1.2rem' }}></i>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Currency Page View */}
      {isCurrencyPageViewOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ 
            zIndex: 10002,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={closeCurrencyPageView}
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
                  onClick={closeCurrencyPageView}
                  style={{ fontSize: '1.2rem' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4 className="mb-0 fw-bold">{getTranslation('pageview.currency.title', language)}</h4>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <h6 className="text-muted fw-bold mb-3 text-uppercase" style={{ fontSize: '0.75rem' }}>
                {getTranslation('pageview.currency.selectCurrency', language)}
              </h6>
              
              {/* USD Option */}
              <div 
                className="d-flex align-items-center justify-content-between py-3 mobile-menu-item" 
                onClick={() => handleCurrencySelect('USD')}
                style={{ 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  backgroundColor: currency === 'USD' ? '#e3f2fd' : 'transparent',
                  border: currency === 'USD' ? '2px solid #007bff' : '2px solid transparent'
                }}
              >
                <div className="d-flex align-items-center">
                  <span className="me-3" style={{ fontSize: '1.5rem' }}>🇺🇸</span>
                  <div>
                    <div className="fw-medium">{getTranslation('pageview.currency.usd', language)}</div>
                    <div className="text-muted small">USD</div>
                  </div>
                </div>
                {currency === 'USD' && (
                  <i className="fas fa-check text-primary" style={{ fontSize: '1.2rem' }}></i>
                )}
              </div>
              
              {/* PEN Option */}
              <div 
                className="d-flex align-items-center justify-content-between py-3 mobile-menu-item" 
                onClick={() => handleCurrencySelect('PEN')}
                style={{ 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  backgroundColor: currency === 'PEN' ? '#e3f2fd' : 'transparent',
                  border: currency === 'PEN' ? '2px solid #007bff' : '2px solid transparent'
                }}
              >
                <div className="d-flex align-items-center">
                  <span className="me-3" style={{ fontSize: '1.5rem' }}>🇵🇪</span>
                  <div>
                    <div className="fw-medium">{getTranslation('pageview.currency.pen', language)}</div>
                    <div className="text-muted small">PEN</div>
                  </div>
                </div>
                {currency === 'PEN' && (
                  <i className="fas fa-check text-primary" style={{ fontSize: '1.2rem' }}></i>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Login Page View - Mobile Only */}
      {isLoginPageViewOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{ 
            zIndex: 10002,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
          onClick={closeLoginPageView}
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
                  onClick={closeLoginPageView}
                  style={{ fontSize: '1.2rem' }}
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h4 className="mb-0 fw-bold">{getTranslation('checkout.loginModal.title', language)}</h4>
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="text-muted mb-4">
                {getTranslation('checkout.loginModal.benefits', language)}
              </p>

              {/* Social Login Buttons */}
              <div className="d-flex flex-column gap-2 mb-3">
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={handleLoginWithGoogle}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {language === 'es' ? 'Iniciando sesión...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      <i className="fab fa-google me-2"></i>
                      Google
                    </>
                  )}
                </button>
              </div>

              {/* Phone Login */}
              <div className="mb-3">
                <input
                  type="tel"
                  className="form-control"
                  placeholder={language === 'es' ? 'Ingresa tu número de celular' : 'Enter your mobile number'}
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                />
              </div>
              <button
                className={`btn w-100 ${isValidPhone(loginPhone) ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                onClick={handlePhoneLogin}
                disabled={!isValidPhone(loginPhone)}
              >
                {language === 'es' ? 'Continuar con celular' : 'Continue with mobile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Language Currency Modal */}
      <LanguageCurrencyModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />

      {/* Login Modal - Desktop Only */}
      {isLoginModalOpen && (
        <div 
          className="modal show d-block modal-fade-in d-none d-lg-block" 
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
                  onClick={handleCloseLoginModal}
                ></button>
              </div>
              <div className="modal-body text-center">
                <p className="text-muted mb-4">
                  {getTranslation('checkout.loginModal.benefits', language)}
                </p>

                {/* Social Login Buttons */}
                <div className="d-flex gap-2 mb-3">
                  <button
                    className="btn btn-outline-primary flex-fill"
                    onClick={handleLoginWithGoogle}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {language === 'es' ? 'Iniciando...' : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        <i className="fab fa-google me-2"></i>
                        Google
                      </>
                    )}
                  </button>
                </div>

                {/* Phone Login */}
                <div className="mb-3">
                  <input
                    type="tel"
                    className="form-control"
                    placeholder={language === 'es' ? 'Ingresa tu número de celular' : 'Enter your mobile number'}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                  />
                </div>
                <button
                  className={`btn w-100 ${isValidPhone(loginPhone) ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                  onClick={handlePhoneLogin}
                  disabled={!isValidPhone(loginPhone)}
                >
                  {language === 'es' ? 'Continuar con celular' : 'Continue with mobile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default Navbar; 