import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { getTranslation } from '../utils/translations';

const Cart: React.FC = () => {
  const { language } = useLanguage();
  const { items, removeItem, updateQuantity, getTotalPrice, updateItemDetails, getTotalTravelers, getItemTotalPrice } = useCart();
  
  // Debug: mostrar items del carrito
  useEffect(() => {
    console.log('🛒 Items en el carrito:', items);
    items.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        title: item.title,
        meetingPoint: item.activityDetails?.meetingPoint,
        pickupPoint: item.activityDetails?.pickupPoint,
        comment: item.activityDetails?.comment,
        guideLanguage: item.activityDetails?.guideLanguage
      });
    });
  }, [items]);
  
  // Calcular ahorro total de todos los items con descuento
  const getTotalSavings = () => {
    return items.reduce((total, item) => {
      if (item.activityDetails?.hasDiscount) {
        const itemSavings = (item.activityDetails.originalPrice * getTotalTravelers(item)) - (item.activityDetails.finalPrice * getTotalTravelers(item));
        return total + itemSavings;
      }
      return total;
    }, 0);
  };
  
  // Calcular precio original total
  const getTotalOriginalPrice = () => {
    return items.reduce((total, item) => {
      if (item.activityDetails?.hasDiscount) {
        return total + (item.activityDetails.originalPrice * getTotalTravelers(item));
      }
      return total + getItemTotalPrice(item);
    }, 0);
  };
  
  // Verificar si hay algún descuento en el carrito
  const hasAnyDiscount = () => {
    return items.some(item => item.activityDetails?.hasDiscount);
  };
  
  // Referencia al primer item del carrito
  const firstItemRef = useRef<HTMLDivElement>(null);
  
  // Estados para edición individual
  const [editingField, setEditingField] = useState<{itemId: string, field: string} | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLanguage, setEditLanguage] = useState('');
  const [editAdults, setEditAdults] = useState(1);
  const [editChildren, setEditChildren] = useState(0);
  const [editMeetingPoint, setEditMeetingPoint] = useState('');
  const [editComment, setEditComment] = useState('');

  // Funciones para manejar la edición individual
  const startEditingField = (itemId: string, field: string, currentValue: any) => {
    setEditingField({ itemId, field });
    
    switch (field) {
      case 'date':
        setEditDate(currentValue || '');
        break;
      case 'time':
        setEditTime(currentValue || '');
        break;
      case 'language':
        setEditLanguage(currentValue || '');
        break;
      case 'travelers':
        const item = items.find(i => i.id === itemId);
        setEditAdults(item?.travelers?.adults || 1);
        setEditChildren(item?.travelers?.children || 0);
        break;
      case 'meetingPoint':
        setEditMeetingPoint(currentValue || '');
        break;
      case 'comment':
        setEditComment(currentValue || '');
        break;
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditDate('');
    setEditTime('');
    setEditLanguage('');
    setEditAdults(1);
    setEditChildren(0);
    setEditMeetingPoint('');
    setEditComment('');
  };

  const saveFieldChange = () => {
    if (!editingField) return;

    const { itemId, field } = editingField;
    
    switch (field) {
      case 'date':
        updateItemDetails(itemId, { date: editDate });
        break;
      case 'time':
        // Para hora necesitaríamos una función específica o actualizar activityDetails
        console.log('Time update not implemented yet');
        break;
      case 'language':
        // Para idioma necesitaríamos una función específica o actualizar activityDetails
        console.log('Language update not implemented yet');
        break;
      case 'travelers':
        updateItemDetails(itemId, {
          travelers: {
            adults: editAdults,
            children: editChildren
          }
        });
        break;
      case 'meetingPoint':
        updateItemDetails(itemId, { meetingPoint: editMeetingPoint } as any);
        break;
      case 'comment':
        updateItemDetails(itemId, { comment: editComment } as any);
        break;
    }
    
    setEditingField(null);
  };

  const handleAdultsChange = (increment: boolean) => {
    if (increment) {
      setEditAdults(prev => prev + 1);
    } else {
      setEditAdults(prev => Math.max(1, prev - 1));
    }
  };

  const handleChildrenChange = (increment: boolean) => {
    if (increment) {
      setEditChildren(prev => prev + 1);
    } else {
      setEditChildren(prev => Math.max(0, prev - 1));
    }
  };

  // Effect para posicionar el foco en el primer item en móvil
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      if (items.length > 0 && firstItemRef.current) {
        // Scroll al primer item
        setTimeout(() => {
          firstItemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        // Scroll al inicio de la página si no hay items
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [items.length]);

  return (
    <div className="container py-5" style={{ paddingBottom: items.length > 0 ? '120px' : '40px' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-5 fw-bold text-dark mb-3">
              {getTranslation('cart.title', language)}
            </h1>
            <p className="lead text-muted">
              {getTranslation('cart.subtitle', language)}
            </p>
          </div>

          {/* Cart Items */}
          {items.length > 0 ? (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                {items.map((item, index) => (
                  <div 
                    key={item.id} 
                    ref={index === 0 ? firstItemRef : null}
                    className="row mb-4 pb-4 border-bottom"
                  >
                    {/* Mobile: Imagen y título en línea */}
                    <div className="col-12 d-md-none d-flex align-items-center mb-3">
                      <div className="me-3" style={{ width: '80px', height: '80px', flexShrink: 0 }}>
                        <img
                          src={item.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                          alt={item.title}
                          className="img-fluid rounded h-100"
                          style={{ 
                            objectFit: 'cover', 
                            width: '100%' 
                          }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-0">{item.title}</h5>
                      </div>
                    </div>

                    {/* Desktop: Imagen en columna lateral */}
                    <div className="col-3 col-md-2 d-none d-md-flex">
                      <img
                        src={item.imageUrl || 'https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/catalogs%2Fservices%2F1753995672651.jpg?alt=media&token=2941bfdb-3723-413b-8c12-6335eb4ece82'}
                        alt={item.title}
                        className="img-fluid rounded"
                        style={{ 
                          height: '100%', 
                          minHeight: '120px',
                          objectFit: 'cover', 
                          width: '100%' 
                        }}
                      />
                    </div>

                    {/* Desktop: Título */}
                    <div className="col-9 col-md-8 d-none d-md-block">
                      <h5 className="fw-bold mb-2">{item.title}</h5>
                    </div>

                    {/* Mobile: Contenido debajo del título */}
                    <div className="col-12 d-md-none">
                      {/* Modo de visualización */}
                      <>
                          {/* Información básica */}
                          <div className="mb-3">
                           
                            {/* Fecha de salida */}
                            {item.date && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-calendar-alt me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.departureDate', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'date' ? (
                                    <input
                                      type="date"
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="form-control form-control-sm"
                                      style={{ width: '150px' }}
                                    />
                                  ) : (
                                    new Date(item.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'date' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'date', item.date)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Hora de salida */}
                            {item.activityDetails?.departureTime && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-clock me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.departureTime', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'time' ? (
                                    <input
                                      type="time"
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      className="form-control form-control-sm"
                                      style={{ width: '120px' }}
                                    />
                                  ) : (
                                    item.activityDetails.departureTime
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'time' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'time', item.activityDetails?.departureTime)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Punto de encuentro o recogida */}
                            {item.activityDetails?.meetingPoint && (
                              <div className="mb-2 d-flex align-items-start justify-content-between">
                                <span className="text-muted small d-flex align-items-start">
                                  <i className="fas fa-map-marker-alt me-2 text-primary mt-1" style={{ fontSize: '0.8rem' }}></i>
                                  <div className="flex-grow-1">
                                    <strong className="me-1">{getTranslation('cart.meetingPoint', language)}:</strong>
                                    {editingField?.itemId === item.id && editingField?.field === 'meetingPoint' ? (
                                      <input
                                        type="text"
                                        value={editMeetingPoint}
                                        onChange={(e) => setEditMeetingPoint(e.target.value)}
                                        className="form-control form-control-sm mt-1"
                                        placeholder={language === 'es' ? 'Ingresa el punto de encuentro' : 'Enter meeting point'}
                                      />
                                    ) : (
                                      item.activityDetails.pickupPoint ? (
                                        <>
                                          <div>{item.activityDetails.pickupPoint.name}</div>
                                          {item.activityDetails.pickupPoint.address && (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                              {item.activityDetails.pickupPoint.address}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        item.activityDetails.meetingPoint
                                      )
                                    )}
                                  </div>
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'meetingPoint' ? (
                                  <div className="d-flex gap-1 ms-2">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0 ms-2"
                                    onClick={() => startEditingField(item.id, 'meetingPoint', item.activityDetails?.meetingPoint)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Comentario */}
                            {item.activityDetails?.comment && item.activityDetails.comment.trim() !== '' && (
                              <div className="mb-2 d-flex align-items-start justify-content-between">
                                <span className="text-muted small d-flex align-items-start">
                                  <i className="fas fa-comment me-2 text-primary mt-1" style={{ fontSize: '0.8rem' }}></i>
                                  <div className="flex-grow-1">
                                    <strong className="me-1">{language === 'es' ? 'Comentario' : 'Comment'}:</strong>
                                    {editingField?.itemId === item.id && editingField?.field === 'comment' ? (
                                      <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        className="form-control form-control-sm mt-1"
                                        rows={2}
                                        placeholder={language === 'es' ? 'Ingresa tu comentario' : 'Enter your comment'}
                                      />
                                    ) : (
                                      <div className="text-muted" style={{ wordBreak: 'break-word' }}>{item.activityDetails.comment}</div>
                                    )}
                                  </div>
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'comment' ? (
                                  <div className="d-flex gap-1 ms-2">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0 ms-2"
                                    onClick={() => startEditingField(item.id, 'comment', item.activityDetails?.comment)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Idioma del guía */}
                            {item.activityDetails?.guideLanguage && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-language me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.guideLanguage', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'language' ? (
                                    <select
                                      value={editLanguage}
                                      onChange={(e) => setEditLanguage(e.target.value)}
                                      className="form-control form-control-sm"
                                      style={{ width: '150px' }}
                                    >
                                      <option value="Español">Español</option>
                                      <option value="English">English</option>
                                    </select>
                                  ) : (
                                    item.activityDetails.guideLanguage
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'language' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'language', item.activityDetails?.guideLanguage)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Cantidad de viajeros */}
                            {item.travelers && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-users me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.travelers', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'travelers' ? (
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="d-flex align-items-center">
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleAdultsChange(false)}
                                          disabled={editAdults <= 1}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-minus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                        <span className="mx-2 fw-bold" style={{ minWidth: '15px', textAlign: 'center' }}>
                                          {editAdults}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleAdultsChange(true)}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                      </div>
                                      <span className="text-muted">|</span>
                                      <div className="d-flex align-items-center">
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleChildrenChange(false)}
                                          disabled={editChildren <= 0}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-minus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                        <span className="mx-2 fw-bold" style={{ minWidth: '15px', textAlign: 'center' }}>
                                          {editChildren}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleChildrenChange(true)}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {item.travelers.adults} {getTranslation('home.search.adults', language)}
                                      {item.travelers.children > 0 && (
                                        <>, {item.travelers.children} {getTranslation('home.search.children', language)}</>
                                      )}
                                    </>
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'travelers' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'travelers', item.travelers)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Información de precio */}
                            <div className="mb-2">
                              <div className="text-muted small d-flex align-items-center flex-wrap">
                                <i className="fas fa-tag me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                <strong className="me-1">{getTranslation('cart.pricePerPerson', language)}:</strong>
                                {item.activityDetails?.hasDiscount ? (
                                  <>
                                    <span className="text-decoration-line-through text-muted me-2">
                                      {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.activityDetails.originalPrice)}
                                    </span>
                                    <span className="text-danger fw-bold me-2">
                                      {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.price)}
                                    </span>
                                    <span className="badge bg-danger">
                                      -{item.activityDetails.discountPercentage}%
                                    </span>
                                  </>
                                ) : (
                                  <span>{item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.price)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-link text-danger p-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            {getTranslation('cart.remove.title', language)}
                          </button>
                        </>
                    </div>

                    {/* Desktop: Contenido */}
                    <div className="col-9 col-md-8 d-none d-md-block">
                      {/* Modo de visualización */}
                      <>
                          {/* Información básica */}
                          <div className="mb-3">
                           
                            {/* Fecha de salida */}
                            {item.date && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-calendar-alt me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.departureDate', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'date' ? (
                                    <input
                                      type="date"
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="form-control form-control-sm"
                                      style={{ width: '150px' }}
                                    />
                                  ) : (
                                    new Date(item.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'date' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'date', item.date)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Hora de salida */}
                            {item.activityDetails?.departureTime && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-clock me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.departureTime', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'time' ? (
                                    <input
                                      type="time"
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      className="form-control form-control-sm"
                                      style={{ width: '120px' }}
                                    />
                                  ) : (
                                    item.activityDetails.departureTime
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'time' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'time', item.activityDetails?.departureTime)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Idioma del guía */}
                            {item.activityDetails?.guideLanguage && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-language me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.guideLanguage', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'language' ? (
                                    <select
                                      value={editLanguage}
                                      onChange={(e) => setEditLanguage(e.target.value)}
                                      className="form-select form-select-sm"
                                      style={{ width: '150px' }}
                                    >
                                      <option value="Español">Español</option>
                                      <option value="English">English</option>
                                    </select>
                                  ) : (
                                    item.activityDetails.guideLanguage
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'language' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'language', item.activityDetails?.guideLanguage)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Punto de encuentro o recogida */}
                            {item.activityDetails?.meetingPoint && (
                              <div className="mb-2 d-flex align-items-start justify-content-between">
                                <span className="text-muted small d-flex align-items-start">
                                  <i className="fas fa-map-marker-alt me-2 text-primary mt-1" style={{ fontSize: '0.8rem' }}></i>
                                  <div className="flex-grow-1">
                                    <strong className="me-1">{getTranslation('cart.meetingPoint', language)}:</strong>
                                    {editingField?.itemId === item.id && editingField?.field === 'meetingPoint' ? (
                                      <input
                                        type="text"
                                        value={editMeetingPoint}
                                        onChange={(e) => setEditMeetingPoint(e.target.value)}
                                        className="form-control form-control-sm mt-1"
                                        placeholder={language === 'es' ? 'Ingresa el punto de encuentro' : 'Enter meeting point'}
                                      />
                                    ) : (
                                      item.activityDetails.pickupPoint ? (
                                        <>
                                          <div>{item.activityDetails.pickupPoint.name}</div>
                                          {item.activityDetails.pickupPoint.address && (
                                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                              {item.activityDetails.pickupPoint.address}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        item.activityDetails.meetingPoint
                                      )
                                    )}
                                  </div>
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'meetingPoint' ? (
                                  <div className="d-flex gap-1 ms-2">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0 ms-2"
                                    onClick={() => startEditingField(item.id, 'meetingPoint', item.activityDetails?.meetingPoint)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Comentario */}
                            {item.activityDetails?.comment && item.activityDetails.comment.trim() !== '' && (
                              <div className="mb-2 d-flex align-items-start justify-content-between">
                                <span className="text-muted small d-flex align-items-start">
                                  <i className="fas fa-comment me-2 text-primary mt-1" style={{ fontSize: '0.8rem' }}></i>
                                  <div className="flex-grow-1">
                                    <strong className="me-1">{language === 'es' ? 'Comentario' : 'Comment'}:</strong>
                                    {editingField?.itemId === item.id && editingField?.field === 'comment' ? (
                                      <textarea
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        className="form-control form-control-sm mt-1"
                                        rows={2}
                                        placeholder={language === 'es' ? 'Ingresa tu comentario' : 'Enter your comment'}
                                      />
                                    ) : (
                                      <div className="text-muted" style={{ wordBreak: 'break-word' }}>{item.activityDetails.comment}</div>
                                    )}
                                  </div>
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'comment' ? (
                                  <div className="d-flex gap-1 ms-2">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0 ms-2"
                                    onClick={() => startEditingField(item.id, 'comment', item.activityDetails?.comment)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Viajeros */}
                            {item.travelers && (
                              <div className="mb-2 d-flex align-items-center justify-content-between">
                                <span className="text-muted small d-flex align-items-center">
                                  <i className="fas fa-users me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                  <strong className="me-1">{getTranslation('cart.travelers', language)}:</strong>
                                  {editingField?.itemId === item.id && editingField?.field === 'travelers' ? (
                                    <div className="d-flex align-items-center gap-2">
                                      <div className="d-flex align-items-center">
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleAdultsChange(false)}
                                          disabled={editAdults <= 1}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-minus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                        <span className="mx-2 fw-bold" style={{ minWidth: '15px', textAlign: 'center' }}>
                                          {editAdults}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleAdultsChange(true)}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                      </div>
                                      <span className="text-muted">|</span>
                                      <div className="d-flex align-items-center">
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleChildrenChange(false)}
                                          disabled={editChildren <= 0}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-minus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                        <span className="mx-2 fw-bold" style={{ minWidth: '15px', textAlign: 'center' }}>
                                          {editChildren}
                                        </span>
                                        <button
                                          type="button"
                                          className="btn btn-outline-secondary btn-sm"
                                          onClick={() => handleChildrenChange(true)}
                                          style={{ width: '25px', height: '25px' }}
                                        >
                                          <i className="fas fa-plus" style={{ fontSize: '0.6rem' }}></i>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    `${item.travelers.adults} adulto${item.travelers.adults > 1 ? 's' : ''}, ${item.travelers.children} niño${item.travelers.children !== 1 ? 's' : ''}`
                                  )}
                                </span>
                                {editingField?.itemId === item.id && editingField?.field === 'travelers' ? (
                                  <div className="d-flex gap-1">
                                    <button className="btn btn-success btn-sm" onClick={saveFieldChange}>
                                      <i className="fas fa-check"></i>
                                    </button>
                                    <button className="btn btn-outline-secondary btn-sm" onClick={cancelEditing}>
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    className="btn btn-link btn-sm p-0"
                                    onClick={() => startEditingField(item.id, 'travelers', item.travelers)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Información de precio */}
                            <div className="mb-2">
                              <div className="text-muted small d-flex align-items-center flex-wrap">
                                <i className="fas fa-tag me-2 text-primary" style={{ fontSize: '0.8rem' }}></i>
                                <strong className="me-1">{getTranslation('cart.pricePerPerson', language)}:</strong>
                                {item.activityDetails?.hasDiscount ? (
                                  <>
                                    <span className="text-decoration-line-through text-muted me-2">
                                      {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.activityDetails.originalPrice)}
                                    </span>
                                    <span className="text-danger fw-bold me-2">
                                      {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.price)}
                                    </span>
                                    <span className="badge bg-danger">
                                      -{item.activityDetails.discountPercentage}%
                                    </span>
                                  </>
                                ) : (
                                  <span>{item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.price)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            className="btn btn-link text-danger p-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            {getTranslation('cart.remove.title', language)}
                          </button>
                        </>
                    </div>

                    <div className="col-12 col-md-2 mt-3 mt-md-0 text-end text-md-end">
                      <div className="fw-bold text-primary mb-1" style={{ fontSize: '1.1rem' }}>
                        {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getItemTotalPrice(item))}
                      </div>
                      <div className="small text-muted mb-2">
                        {item.currency === 'PEN' ? 'S/' : '$'}{Math.ceil(item.price)} {getTranslation('cart.perPerson', language)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Total & Checkout - Desktop Only - Floating */}
                {items.length > 0 && (
                  <div className="position-fixed bottom-0 start-0 end-0 d-none d-md-block bg-white border-top shadow-lg" style={{ zIndex: 1000 }}>
                    <div className="container">
                      <div className="row">
                        <div className="col-md-8"></div>
                        <div className="col-md-4">
                          <div className="p-3">
                            {hasAnyDiscount() && (
                              <div className="mb-2 p-2 bg-success bg-opacity-10 rounded">
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-success fw-bold small">
                                    <i className="fas fa-tag me-1"></i>
                                    {language === 'es' ? 'Estás ahorrando' : 'You\'re saving'}:
                                  </span>
                                  <span className="text-success fw-bold fs-6">
                                    {items.length > 0 && items[0].currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getTotalSavings())}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className="d-flex align-items-center justify-content-between pt-2 gap-3">
                              <div className="flex-grow-1">
                                <div className="small text-muted mb-0">{language === 'es' ? 'Total a pagar' : 'Total to pay'}</div>
                                <div className="fw-bold fs-5 text-danger">
                                  {items.length > 0 && items[0].currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getTotalPrice())}
                                </div>
                              </div>
                              <button className="btn btn-primary btn-lg flex-shrink-0">
                                <i className="fas fa-credit-card me-2"></i>
                                {getTranslation('cart.checkout', language)}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty Cart State */
            <div className="card shadow-sm border-0">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-shopping-cart text-muted" style={{ fontSize: '4rem' }}></i>
                </div>
                <h3 className="fw-bold text-dark mb-3">
                  {getTranslation('cart.empty.title', language)}
                </h3>
                <p className="text-muted mb-4">
                  {getTranslation('cart.empty.message', language)}
                </p>
                <button 
                  className="btn btn-primary btn-lg px-4"
                  onClick={() => window.location.href = '/'}
                >
                  <i className="fas fa-search me-2"></i>
                  {getTranslation('cart.empty.exploreActivities', language)}
                </button>
              </div>
            </div>
          )}

          {/* Floating Total & Checkout Button - Mobile Only */}
          {items.length > 0 && (
            <div className="position-fixed bottom-0 start-0 end-0 d-md-none bg-white border-top shadow-lg" style={{ zIndex: 1000 }}>
              <div className="container-fluid">
                {hasAnyDiscount() && (
                  <div className="px-3 pt-2 pb-2 bg-success bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-success fw-bold" style={{ fontSize: '0.8rem' }}>
                        <i className="fas fa-tag me-1"></i>
                        {language === 'es' ? 'Estás ahorrando' : 'You\'re saving'}:
                      </span>
                      <span className="text-success fw-bold">
                        {items[0].currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getTotalSavings())}
                      </span>
                    </div>
                  </div>
                )}
                <div className="d-flex align-items-center justify-content-between px-3 py-3 gap-3">
                  <div className="flex-grow-1">
                    <div className="small text-muted mb-0">{language === 'es' ? 'Total a pagar' : 'Total to pay'}</div>
                    <div className="fw-bold fs-5 text-danger">
                      {items[0].currency === 'PEN' ? 'S/' : '$'}{Math.ceil(getTotalPrice())}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-lg flex-shrink-0">
                    <i className="fas fa-credit-card me-2"></i>
                    {getTranslation('cart.checkout', language)}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
