import React from 'react';
import { useCookieConsent } from '../context/CookieConsentContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

const CookieConsentBanner: React.FC = () => {
  const { showBanner, acceptCookies, rejectCookies } = useCookieConsent();
  const { language } = useLanguage();

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)'
        }}
      />
      
      {/* Banner de consentimiento */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 9999,
          padding: '1.5rem',
          borderTop: '3px solid #007bff',
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>

        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8 mb-3 mb-lg-0">
              <div className="d-flex align-items-start">
                <i className="fas fa-cookie-bite text-primary me-3" style={{ fontSize: '2rem', marginTop: '0.25rem' }}></i>
                <div>
                  <h5 className="fw-bold mb-2">
                    {getTranslation('cookies.title', language)}
                  </h5>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.95rem' }}>
                    {getTranslation('cookies.message', language)}
                  </p>
                  <a 
                    href="#" 
                    className="text-primary text-decoration-none mt-2 d-inline-block" 
                    style={{ fontSize: '0.9rem' }}
                    onClick={(e) => {
                      e.preventDefault();
                      // Aquí podrías abrir un modal con más información
                      alert(getTranslation('cookies.moreInfoText', language));
                    }}
                  >
                    {getTranslation('cookies.learnMore', language)}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="d-flex flex-column flex-sm-row gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-fill"
                  onClick={rejectCookies}
                >
                  {getTranslation('cookies.reject', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-fill"
                  onClick={acceptCookies}
                >
                  {getTranslation('cookies.accept', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;


