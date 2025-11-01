import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface RatingStarsProps {
  rating: number | null | undefined;
  commentsCount: number | null | undefined;
  className?: string;
  starSize?: number;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  commentsCount,
  className = '',
  starSize = 16
}) => {
  const { language } = useLanguage();
  // Si no hay rating, no mostrar nada
  if (rating === null || rating === undefined || rating === 0) {
    return null;
  }

  // Asegurar que el rating esté entre 0 y 5
  const normalizedRating = Math.max(0, Math.min(5, rating));
  
  // Calcular el número de estrellas llenas y parciales
  const fullStars = Math.floor(normalizedRating);
  const hasPartialStar = normalizedRating % 1 !== 0;
  const partialPercentage = hasPartialStar ? Math.round((normalizedRating % 1) * 100) : 0;

  // Formatear el rating con coma como separador decimal (formato europeo)
  const formattedRating = normalizedRating.toFixed(1).replace('.', ',');

  // Calcular el ancho del gap entre estrellas (2px)
  const gap = 2;
  const starWidth = starSize + gap;

  return (
    <div className={`d-flex flex-column gap-1 ${className}`} style={{ lineHeight: '1.2' }}>
      {/* Primera línea: Estrellas, rating numérico y número de comentarios */}
      <div className="d-flex align-items-center gap-2">
        {/* Contenedor de estrellas */}
        <div className="d-flex align-items-center position-relative" style={{ height: `${starSize}px`, flexShrink: 0 }}>
          {/* Estrellas de fondo (vacíos/grises) */}
          <div className="d-flex" style={{ gap: `${gap}px` }}>
            {[...Array(5)].map((_, index) => (
              <svg
                key={`empty-${index}`}
                width={starSize}
                height={starSize}
                viewBox="0 0 20 20"
                fill="none"
                style={{ color: '#e0e0e0', flexShrink: 0 }}
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="currentColor"
                />
              </svg>
            ))}
          </div>
          
          {/* Estrellas llenas (azul oscuro) - capa superior */}
          <div
            className="d-flex position-absolute top-0 start-0"
            style={{
              gap: `${gap}px`,
              overflow: 'hidden',
              width: hasPartialStar 
                ? `${fullStars * starWidth + (starSize * partialPercentage / 100)}px`
                : `${fullStars * starWidth}px`
            }}
          >
            {/* Estrellas completamente llenas */}
            {[...Array(fullStars)].map((_, index) => (
              <svg
                key={`full-${index}`}
                width={starSize}
                height={starSize}
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ color: '#191970', flexShrink: 0 }}
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  fill="currentColor"
                />
              </svg>
            ))}
            
            {/* Estrella parcial */}
            {hasPartialStar && (
              <div
                style={{
                  width: `${starSize}px`,
                  height: `${starSize}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {/* Estrella completa oculta */}
                <svg
                  width={starSize}
                  height={starSize}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  style={{ 
                    color: '#191970',
                    position: 'absolute',
                    left: 0,
                    top: 0
                  }}
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    fill="currentColor"
                  />
                </svg>
                {/* Máscara para mostrar solo el porcentaje parcial */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: `${partialPercentage}%`,
                    height: '100%',
                    overflow: 'hidden'
                  }}
                >
                  <svg
                    width={starSize}
                    height={starSize}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    style={{ 
                      color: '#191970',
                      position: 'absolute',
                      left: 0,
                      top: 0
                    }}
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating numérico y número de comentarios */}
        <div className="d-flex align-items-center gap-1">
          <span className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>
            {formattedRating}
          </span>
          {commentsCount !== null && commentsCount !== undefined && commentsCount > 0 && (
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              ({commentsCount.toLocaleString()})
            </span>
          )}
        </div>
      </div>

      {/* Segunda línea: Texto "basado en X comentarios" */}
      {commentsCount !== null && commentsCount !== undefined && commentsCount > 0 && (
        <div className="d-flex align-items-start">
          <span className="text-muted" style={{ fontSize: '0.7rem', lineHeight: '1.2' }}>
            {getTranslation('rating.basedOn', language)} {commentsCount.toLocaleString()} {getTranslation('rating.comments', language)}
          </span>
        </div>
      )}
    </div>
  );
};

export default RatingStars;
