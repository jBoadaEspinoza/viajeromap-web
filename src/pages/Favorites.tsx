import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../utils/translations';
import { usePageTitle } from '../hooks/usePageTitle';
import type { ActivityCardData } from '../components/ActivityCard';
import ActivityCard from '../components/ActivityCard';
import { activitiesApi } from '../api/activities';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getCurrencySymbol } = useCurrency();
  const { isAuthenticated, firebaseUser } = useAuth();
  
  // Establecer título de página dinámicamente
  usePageTitle('nav.favorites', language);

  const [favoriteActivityIds, setFavoriteActivityIds] = useState<string[]>([]);
  const [favoriteActivities, setFavoriteActivities] = useState<ActivityCardData[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar favoritos desde localStorage
  useEffect(() => {
    if (isAuthenticated && firebaseUser) {
      const storedFavorites = localStorage.getItem(`favorites_${firebaseUser.uid}`);
      if (storedFavorites) {
        try {
          const favorites = JSON.parse(storedFavorites);
          setFavoriteActivityIds(favorites);
        } catch (error) {
          console.error('Error loading favorites:', error);
          setFavoriteActivityIds([]);
        }
      } else {
        setFavoriteActivityIds([]);
      }
    } else {
      setFavoriteActivityIds([]);
    }
  }, [isAuthenticated, firebaseUser]);

  // Cargar datos de actividades favoritas
  useEffect(() => {
    const fetchFavoriteActivities = async () => {
      if (!isAuthenticated || !firebaseUser || favoriteActivityIds.length === 0) {
        setFavoriteActivities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const activities: ActivityCardData[] = [];

        // Obtener cada actividad favorita
        for (const activityId of favoriteActivityIds) {
          try {
            const activity = await activitiesApi.getById(
              activityId,
              language,
              'PEN' // Usar PEN como moneda por defecto, se puede ajustar
            );

            const bookingOption = activity.bookingOptions?.[0];
            let price = 0;
            let originalPrice = 0;
            let currency = 'PEN';
            let isFrom = false;
            let hasActiveOffer = false;
            let discountPercent = 0;

            if (bookingOption) {
              currency = bookingOption.currency || 'PEN';
              
              // Calcular precio mínimo
              if (bookingOption.priceAfterDiscount && bookingOption.priceAfterDiscount > 0) {
                price = bookingOption.priceAfterDiscount;
                originalPrice = bookingOption.normalPrice || 0;
                hasActiveOffer = true;
                if (originalPrice > 0) {
                  discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
                }
              } else {
                price = bookingOption.normalPrice || 0;
              }

              // Determinar si es precio "desde"
              if (bookingOption.groupMinSize && bookingOption.groupMinSize > 1) {
                isFrom = true;
              }
            }

            const activityCardData: ActivityCardData = {
              id: activity.id,
              title: activity.title,
              imageUrl: activity.images?.[0]?.imageUrl,
              price: price,
              originalPrice: originalPrice > 0 ? originalPrice : undefined,
              hasActiveOffer: hasActiveOffer,
              discountPercent: discountPercent > 0 ? discountPercent : undefined,
              isFromPrice: isFrom,
              durationDays: activity.bookingOptions?.[0]?.durationDays || undefined,
              durationHours: activity.bookingOptions?.[0]?.durationHours || undefined,
              durationMinutes: activity.bookingOptions?.[0]?.durationMinutes || undefined,
              rating: activity.rating,
              commentsCount: activity.commentsCount,
              presentation: activity.presentation,
              includes: activity.includes,
              currency: currency,
              supplier: activity.supplier?.name,
              supplierVerified: activity.supplier?.isVerified || false,
              bookingOptions: activity.bookingOptions,
            };

            activities.push(activityCardData);
          } catch (error) {
            console.error(`Error fetching activity ${activityId}:`, error);
            // Continuar con las demás actividades aunque una falle
          }
        }

        setFavoriteActivities(activities);
      } catch (error) {
        console.error('Error fetching favorite activities:', error);
        setFavoriteActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteActivities();
  }, [favoriteActivityIds, isAuthenticated, firebaseUser, language]);

  const handleLoginClick = () => {
    navigate('/');
  };

  if (!isAuthenticated || !firebaseUser) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-heart" style={{ fontSize: '4rem', color: '#dc3545' }}></i>
              </div>
              <h2 className="mb-3 fw-bold">
                {getTranslation('favorites.loginRequired.title', language) || 
                 (language === 'es' ? 'Inicia sesión para ver tus favoritos' : 'Login required to view favorites')}
              </h2>
              <p className="text-muted mb-4">
                {getTranslation('favorites.loginRequired.message', language) || 
                 (language === 'es' 
                   ? 'Debes iniciar sesión para poder guardar y ver tus actividades favoritas.' 
                   : 'You must log in to save and view your favorite activities.')}
              </p>
              <button 
                className="btn btn-primary btn-lg px-5"
                onClick={handleLoginClick}
              >
                {getTranslation('pageview.login.title', language) || 
                 (language === 'es' ? 'Iniciar sesión' : 'Log in')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">
              {getTranslation('common.loading', language) || 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (favoriteActivities.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center py-4 py-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body cart-card-padding p-md-5">
              <i className="fas fa-heart cart-icon text-muted mb-3 mb-md-4" style={{ fontSize: '3rem' }}></i>
              <h3 className="h5 mb-2 mb-md-3" style={{ wordBreak: 'break-word', fontSize: '1.1rem' }}>
                {getTranslation('favorites.empty.title', language)}
              </h3>
              <p className="text-muted mb-2 mb-md-3 small" style={{ wordBreak: 'break-word' }}>
                {getTranslation('favorites.empty.message', language)}
              </p>
              <button 
                className="btn btn-primary btn-lg px-5"
                onClick={() => navigate('/search')}
              >
                {getTranslation('favorites.exploreActivities', language) || 
                 (language === 'es' ? 'Explorar actividades' : 'Explore activities')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="h2 fw-bold mb-2">
            {getTranslation('favorites.title', language) || 
             (language === 'es' ? 'Mis Favoritos' : 'My Favorites')}
          </h1>
          <p className="text-muted">
            {getTranslation('favorites.subtitle', language) || 
             (language === 'es' 
               ? `Tienes ${favoriteActivities.length} ${favoriteActivities.length === 1 ? 'actividad favorita' : 'actividades favoritas'}` 
               : `You have ${favoriteActivities.length} favorite ${favoriteActivities.length === 1 ? 'activity' : 'activities'}`)}
          </p>
        </div>
      </div>

      <div className="row">
        {favoriteActivities.map((activity) => (
          <div key={activity.id} className="col-12 col-md-6 col-lg-4 mb-4">
            <ActivityCard
              activity={activity}
              columns={4}
              variant="default"
              showDetailsButton={true}
              onDetailsClick={(id) => {
                navigate(`/activity/${id}`);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Favorites;

