import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTranslation } from '../utils/translations';
import { useConfig } from '../context/ConfigContext';
import { activitiesApi, type Destination } from '../api/activities';

const Footer: React.FC = () => {
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { config } = useConfig();
  const businessInfo = config.business;
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);
  
  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Función para capitalizar la primera letra de un string
  const firstLetterToUpperCase = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  // Función para construir la URL de búsqueda con parámetros de destino
  const buildSearchUrl = (destination: string) => {
    const params = new URLSearchParams();
    params.set('destination', destination);
    params.set('date', getCurrentDate());
    params.set('lang', language);
    params.set('currency', currency.toUpperCase());
    return `/search?${params.toString()}`;
  };

  // Cargar destinos desde la API
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        const response = await activitiesApi.getDestinations(0, 10, 'cityName', 'ASC');
        if (response.success && response.data) {
          // Filtrar solo destinos activos y limitar a los primeros 3
          const activeDestinations = response.data
            .filter((dest: Destination) => dest.active)
            .slice(0, 3);
          setDestinations(activeDestinations);
        }
      } catch (error) {
        console.error('Error loading destinations:', error);
        setDestinations([]);
      } finally {
        setLoadingDestinations(false);
      }
    };

    fetchDestinations();
  }, []);
  
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* Trabaja con nosotros */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">{getTranslation('footer.workWithUs', language)}</h6>
            <ul className="list-unstyled">
              <li className="mb-3">
                {/* Como proveedor de actividades */}
                <Link to="/#como-proveedor-de-actividades" className="text-light text-decoration-none" style={{ fontWeight: 300 }}>{getTranslation('footer.comoProveedorDeActividades', language)}</Link>
              </li>
              <li className="mb-3">
                {/* Como creador de contenido */}
                <Link to="/#como-creador-de-contenido" className="text-light text-decoration-none" style={{ fontWeight: 300 }}>{getTranslation('footer.comoCreadorDeContenido', language)}</Link>
              </li>
              <li className="mb-3">
                {/* Como afiliado */}
                <Link to="/#como-afiliado" className="text-light text-decoration-none" style={{ fontWeight: 300 }}>{getTranslation('footer.comoAfiliado', language)}</Link>
              </li>
            </ul>
          </div>

          {/* Principales destinos */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">{getTranslation('footer.destinations', language)}</h6>
            {loadingDestinations ? (
              <ul className="list-unstyled">
                <li className="mb-2">
                  <span className="text-light" style={{ fontWeight: 300 }}>Cargando...</span>
                </li>
              </ul>
            ) : destinations.length > 0 ? (
              <ul className="list-unstyled">
                {destinations.map((destination) => (
                  <li key={destination.id} className="mb-2">
                    <Link 
                      to={buildSearchUrl(destination.cityName)} 
                      className="text-light text-decoration-none" 
                      style={{ fontWeight: 300 }}
                    >
                      {firstLetterToUpperCase(destination.cityName)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="list-unstyled">
                <li className="mb-2">
                  <span className="text-light" style={{ fontWeight: 300 }}>No hay destinos disponibles</span>
                </li>
              </ul>
            )}
          </div>

          {/* Contact & Extranet */}
          <div className="col-lg-4 col-md-6 mb-4">
            {/* Redes Sociales */}
            <div className="mb-3">
              <h6 className="fw-bold mb-3">{getTranslation('footer.socialMedia', language) || (language === 'es' ? 'Síguenos' : 'Follow us')}</h6>
              <div className="d-flex gap-3">
                <a href="#" className="text-light text-decoration-none">
                  <i className="fab fa-facebook fs-5"></i>
                </a>
                <a href="#" className="text-light text-decoration-none">
                  <i className="fab fa-instagram fs-5"></i>
                </a>
                <a href="#" className="text-light text-decoration-none">
                  <i className="fab fa-twitter fs-5"></i>
                </a>
                <a href="#" className="text-light text-decoration-none">
                  <i className="fab fa-youtube fs-5"></i>
                </a>
                <a href="#" className="text-light text-decoration-none">
                  <i className="fab fa-tiktok fs-5"></i>
                </a>
              </div>
            </div>
            
            {/* Extranet Section */}
            <div className="border-top pt-3">
              <h6 className="fw-bold mb-2">Acceso Interno</h6>
              <button 
                onClick={() => {
                  window.location.href = 'https://supplier.viajeromap.com';
                }}
                className="btn btn-outline-primary btn-sm"
              >
                <i className="fas fa-shield-alt me-2"></i>
                {getTranslation('nav.extranet', language)}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-top border-secondary pt-4 mt-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="text-light mb-0">
                {getTranslation('footer.copyright', language)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 