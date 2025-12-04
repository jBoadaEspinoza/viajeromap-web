import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { activityReviewsApi, ActivityReviewRequest } from '../api/activityReviews';

interface ActivityReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  orderItemId: number;
  activityTitle?: string;
  onReviewCreated?: () => void;
}

const ActivityReviewModal: React.FC<ActivityReviewModalProps> = ({
  isOpen,
  onClose,
  activityId,
  orderItemId,
  activityTitle,
  onReviewCreated
}) => {
  const { language } = useLanguage();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStarClick = (starValue: number, isHalf: boolean = false) => {
    const finalRating = isHalf ? starValue - 0.5 : starValue;
    setRating(finalRating);
    setError(null);
  };

  const handleStarHover = (starValue: number, isHalf: boolean = false) => {
    const finalRating = isHalf ? starValue - 0.5 : starValue;
    setHoveredRating(finalRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  // Función para renderizar una estrella con soporte para medias estrellas
  const renderStar = (starValue: number) => {
    // Usar hoveredRating si existe, sino usar rating
    const displayRating = hoveredRating > 0 ? hoveredRating : rating;
    const isFull = displayRating >= starValue;
    const isHalf = displayRating >= starValue - 0.5 && displayRating < starValue;

    return (
      <div
        key={starValue}
        className="position-relative d-inline-block"
        style={{ width: '2rem', height: '2rem' }}
        onMouseLeave={handleStarLeave}
      >
        {/* Estrella de fondo (gris) */}
        <i
          className="fas fa-star text-muted position-absolute"
          style={{ 
            fontSize: '2rem',
            left: 0,
            top: 0,
            zIndex: 1
          }}
        ></i>
        
        {/* Estrella activa (amarilla) - puede ser completa o media */}
        {(isFull || isHalf) && (
          <div
            className="position-absolute"
            style={{
              left: 0,
              top: 0,
              width: isHalf ? '50%' : '100%',
              height: '100%',
              overflow: 'hidden',
              zIndex: 2
            }}
          >
            <i
              className="fas fa-star text-warning"
              style={{ fontSize: '2rem' }}
            ></i>
          </div>
        )}

        {/* Área clickeable izquierda (media estrella) */}
        <button
          type="button"
          className="position-absolute border-0 bg-transparent p-0"
          style={{
            left: 0,
            top: 0,
            width: '50%',
            height: '100%',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            zIndex: 3
          }}
          onClick={() => handleStarClick(starValue, true)}
          onMouseEnter={() => handleStarHover(starValue, true)}
          disabled={isSubmitting}
          aria-label={`${starValue - 0.5} stars`}
        ></button>

        {/* Área clickeable derecha (estrella completa) */}
        <button
          type="button"
          className="position-absolute border-0 bg-transparent p-0"
          style={{
            left: '50%',
            top: 0,
            width: '50%',
            height: '100%',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            zIndex: 3
          }}
          onClick={() => handleStarClick(starValue, false)}
          onMouseEnter={() => handleStarHover(starValue, false)}
          disabled={isSubmitting}
          aria-label={`${starValue} stars`}
        ></button>
      </div>
    );
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 1000) {
      setComment(value);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    // Validar que el rating sea obligatorio
    if (rating === 0) {
      setError(language === 'es' 
        ? 'Por favor, selecciona una valoración con estrellas' 
        : 'Please select a star rating');
      return;
    }

    // Validar longitud del comentario
    if (comment.length > 1000) {
      setError(language === 'es' 
        ? 'El comentario no puede superar los 1000 caracteres' 
        : 'Comment cannot exceed 1000 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: ActivityReviewRequest = {
        activityId,
        orderItemId,
        rating,
        comment: comment.trim() || undefined,
        lang: language as 'es' | 'en'
      };

      const response = await activityReviewsApi.createActivityReview(request);

      if (response?.success !== false) {
        // Reset form
        setRating(0);
        setComment('');
        setHoveredRating(0);
        
        // Callback opcional para refrescar datos
        if (onReviewCreated) {
          onReviewCreated();
        }
        
        // Cerrar modal
        onClose();
      } else {
        throw new Error(response?.message || (language === 'es' 
          ? 'Error al crear la valoración' 
          : 'Error creating review'));
      }
    } catch (error: any) {
      console.error('Error creating review:', error);
      setError(error?.message || (language === 'es' 
        ? 'Error al crear la valoración. Por favor, intenta nuevamente.' 
        : 'Error creating review. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      setHoveredRating(0);
      setError(null);
      onClose();
    }
  };

  const commentLength = comment.length;
  const maxLength = 1000;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold">
              {language === 'es' ? 'Dejar valoración' : 'Leave rating'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
              disabled={isSubmitting}
            ></button>
          </div>

          <div className="modal-body pt-0">
            {activityTitle && (
              <p className="text-muted mb-3">
                <strong>{language === 'es' ? 'Actividad:' : 'Activity:'}</strong> {activityTitle}
              </p>
            )}

            {/* Star Rating */}
            <div className="mb-4">
              <label className="form-label fw-semibold mb-2">
                {language === 'es' ? 'Valoración' : 'Rating'} <span className="text-danger">*</span>
              </label>
              <div className="d-flex align-items-center gap-1">
                {[1, 2, 3, 4, 5].map((starValue) => renderStar(starValue))}
                {rating > 0 && (
                  <span className="text-muted ms-2">
                    ({rating.toFixed(1).replace('.', ',')} {language === 'es' ? 'estrella(s)' : 'star(s)'})
                  </span>
                )}
              </div>
              <small className="text-muted d-block mt-1">
                {language === 'es' 
                  ? 'Haz clic en la mitad izquierda de una estrella para .5 o en la mitad derecha para el valor completo' 
                  : 'Click on the left half of a star for .5 or on the right half for the full value'}
              </small>
            </div>

            {/* Comment */}
            <div className="mb-3">
              <label className="form-label fw-semibold mb-2">
                {language === 'es' ? 'Comentario' : 'Comment'} <span className="text-muted small">({language === 'es' ? 'opcional' : 'optional'})</span>
              </label>
              <textarea
                className="form-control"
                rows={5}
                value={comment}
                onChange={handleCommentChange}
                placeholder={language === 'es' 
                  ? 'Escribe tu comentario aquí (máximo 1000 caracteres)...' 
                  : 'Write your comment here (max 1000 characters)...'}
                disabled={isSubmitting}
                maxLength={maxLength}
              />
              <div className="d-flex justify-content-between align-items-center mt-1">
                <small className="text-muted">
                  {commentLength} / {maxLength} {language === 'es' ? 'caracteres' : 'characters'}
                </small>
                {commentLength > maxLength * 0.9 && (
                  <small className={commentLength >= maxLength ? 'text-danger' : 'text-warning'}>
                    {language === 'es' ? 'Casi alcanzaste el límite' : 'Near limit'}
                  </small>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
          </div>

          <div className="modal-footer border-0 pt-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  {language === 'es' ? 'Guardando...' : 'Saving...'}
                </>
              ) : (
                <>
                  <i className="fas fa-check me-2"></i>
                  {language === 'es' ? 'Aceptar' : 'Accept'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityReviewModal;

