export interface Translations {
  [key: string]: {
    es: string;
    en: string;
  };
}

// Language mapping
export const getLanguageName = (langCode: string, currentLang: 'es' | 'en' = 'es'): string => {
  // Normalizar el código a minúsculas para comparación
  const normalizedCode = langCode.toLowerCase();
  
  const languageMap: { [key: string]: { es: string; en: string } } = {
    'es': { es: 'Español', en: 'Spanish' },
    'sp': { es: 'Español', en: 'Spanish' },
    'esp': { es: 'Español', en: 'Spanish' },
    'español': { es: 'Español', en: 'Spanish' },
    'spanish': { es: 'Español', en: 'Spanish' },
    
    'en': { es: 'Inglés', en: 'English' },
    'english': { es: 'Inglés', en: 'English' },
    'inglés': { es: 'Inglés', en: 'English' },
    
    'fr': { es: 'Francés', en: 'French' },
    'french': { es: 'Francés', en: 'French' },
    'francés': { es: 'Francés', en: 'French' },
    
    'de': { es: 'Alemán', en: 'German' },
    'german': { es: 'Alemán', en: 'German' },
    'alemán': { es: 'Alemán', en: 'German' },
    
    'it': { es: 'Italiano', en: 'Italian' },
    'italian': { es: 'Italiano', en: 'Italian' },
    'italiano': { es: 'Italiano', en: 'Italian' },
    
    'pt': { es: 'Portugués', en: 'Portuguese' },
    'portuguese': { es: 'Portugués', en: 'Portuguese' },
    'portugués': { es: 'Portugués', en: 'Portuguese' },
    
    'ru': { es: 'Ruso', en: 'Russian' },
    'russian': { es: 'Ruso', en: 'Russian' },
    'ruso': { es: 'Ruso', en: 'Russian' },
    
    'zh': { es: 'Chino', en: 'Chinese' },
    'chinese': { es: 'Chino', en: 'Chinese' },
    'chino': { es: 'Chino', en: 'Chinese' },
    
    'ja': { es: 'Japonés', en: 'Japanese' },
    'japanese': { es: 'Japonés', en: 'Japanese' },
    'japonés': { es: 'Japonés', en: 'Japanese' },
    
    'ko': { es: 'Coreano', en: 'Korean' },
    'korean': { es: 'Coreano', en: 'Korean' },
    'coreano': { es: 'Coreano', en: 'Korean' },
  };
  
  return languageMap[normalizedCode]?.[currentLang] || langCode;
};

export const translations: Translations = {
  
  // Navigation
  'nav.home': {
    es: 'Inicio',
    en: 'Home'
  },
  'nav.activities': {
    es: 'Actividades',
    en: 'Activities'
  },
  'nav.about': {
    es: 'Nosotros',
    en: 'About'
  },
  'nav.contact': {
    es: 'Contacto',
    en: 'Contact'
  },
  'nav.extranet': {
    es: 'Extranet',
    en: 'Extranet'
  },
  'nav.search': {
    es: 'Buscar Actividades',
    en: 'Search Activities'
  },

  // Language selector
  'lang.spanish': {
    es: 'Español',
    en: 'Spanish'
  },
  'lang.english': {
    es: 'Inglés',
    en: 'English'
  },

  // Currency selector
  'currency.pen': {
    es: 'Soles (PEN)',
    en: 'Soles (PEN)'
  },
  'currency.usd': {
    es: 'Dólares (USD)',
    en: 'Dollars (USD)'
  },

  // Bookings
  'bookings.title': {
    es: 'Mis Reservas',
    en: 'My Bookings'
  },
  'bookings.emptyMessage': {
    es: 'No hay reservas',
    en: 'No bookings'
  },
  'bookings.description': {
    es: 'Gestiona y visualiza todas tus reservas de actividades en un solo lugar.',
    en: 'Manage and view all your activity bookings in one place.'
  },
  'bookings.searchActivities': {
    es: 'Buscar Actividades',
    en: 'Search Activities'
  },

  // Cart
  'cart.title': {
    es: 'Carrito',
    en: 'Cart'
  },
  'cart.items': {
    es: 'items',
    en: 'items'
  },
  'cart.empty': {
    es: 'Carrito vacío',
    en: 'Empty cart'
  },
  'cart.addToCart': {
    es: 'Añadir al carrito',
    en: 'Add to cart'
  },
  'cart.removeFromCart': {
    es: 'Eliminar del carrito',
    en: 'Remove from cart'
  },
  'cart.viewCart': {
    es: 'Ver carrito',
    en: 'View cart'
  },
  'cart.checkout': {
    es: 'Proceder al pago',
    en: 'Checkout'
  },
  'checkout.title': {
    es: 'Checkout',
    en: 'Checkout'
  },
  'checkout.contactInfo': {
    es: 'Información de contacto',
    en: 'Contact information'
  },
  'checkout.paymentMethod': {
    es: 'Método de pago',
    en: 'Payment method'
  },
  'checkout.contactInfoSaved': {
    es: 'Información de contacto guardada',
    en: 'Contact information saved'
  },
  'checkout.phoneNumberRequired': {
    es: 'Número de móvil*',
    en: 'Mobile number*'
  },
  'checkout.reserveNowPayLaterDesc': {
    es: 'Puedes pagar más tarde',
    en: 'You can pay later'
  },
  'checkout.useButtonBelow': {
    es: 'Usa el botón de abajo para continuar con el pago',
    en: 'Use the button below to continue with payment'
  },
  'checkout.noItemsToPay': {
    es: 'No hay items para pagar',
    en: 'No items to pay'
  },
  'checkout.emptyCartMessage': {
    es: 'No hay items para pagar',
    en: 'No items to pay'
  },
  'checkout.reservationTimer': {
    es: 'Tu plaza está reservada durante',
    en: 'Your spot is reserved for'
  },
  'checkout.minutes': {
    es: 'minutos',
    en: 'minutes'
  },
  'checkout.reviewPersonalData': {
    es: 'Revisa tus datos personales',
    en: 'Review your personal data'
  },
  'checkout.fastSecureReservation': {
    es: 'Reserva rápida y segura',
    en: 'Fast and secure reservation'
  },
  'checkout.documentTypeRequired': {
    es: 'Tipo de documento*',
    en: 'Document type*'
  },
  'checkout.documentNumberRequired': {
    es: 'Número de documento*',
    en: 'Document number*'
  },
  'checkout.nameRequired': {
    es: 'Nombres*',
    en: 'Name*'
  },
  'checkout.lastNameRequired': {
    es: 'Apellidos*',
    en: 'Last name*'
  },
  'checkout.emailRequired': {
    es: 'E-mail*',
    en: 'E-mail*'
  },
  'checkout.phoneCodeRequired': {
    es: 'Código telefónico*',
    en: 'Phone code*'
  },
  'checkout.phoneRequired': {
    es: 'Número de móvil*',
    en: 'Mobile number*'
  },
  'checkout.nationalityRequired': {
    es: 'Nacionalidad*',
    en: 'Nationality*'
  },
  'checkout.selectNationality': {
    es: 'Seleccione una nacionalidad',
    en: 'Select a nationality'
  },
  'checkout.noNationalitiesAvailable': {
    es: 'No hay nacionalidades disponibles',
    en: 'No nationalities available'
  },
  'checkout.requiredFields': {
    es: '* Campos obligatorios',
    en: '* Required fields'
  },
  'checkout.contactDisclaimer': {
    es: 'Solo te contactaremos en caso de que haya notificaciones importantes o cambios en tu reserva.',
    en: 'We will only contact you in case of important notifications or changes to your reservation.'
  },
  'checkout.namePlaceholder': {
    es: 'Ingresa tu nombre completo',
    en: 'Enter your full name'
  },
  'checkout.lastNamePlaceholder': {
    es: 'Ingresa tu apellido',
    en: 'Enter your last name'
  },
  'checkout.emailPlaceholder': {
    es: 'tu@email.com',
    en: 'your@email.com'
  },
  'checkout.phonePlaceholder': {
    es: '123456789',
    en: '123456789'
  },
  'checkout.selectPhoneCode': {
    es: 'Seleccione un código telefónico',
    en: 'Select a phone code'
  },
  'checkout.noPhoneCodesAvailable': {
    es: 'No hay códigos disponibles',
    en: 'No phone codes available'
  },
  'checkout.emailNotEditable': {
    es: 'No editable - autenticado con Google',
    en: 'Not editable - authenticated with Google'
  },
  'checkout.continuePayment': {
    es: 'Continuar con el pago',
    en: 'Continue with payment'
  },
  'checkout.noPayToday': {
    es: 'No pagues nada hoy',
    en: 'Don\'t pay anything today'   
  },
  'checkout.bookNowPayLater': {
    es: 'Reserva ahora y paga después.',
    en: 'Book now and pay later.'
  },
  'checkout.cancelBefore': {
    es: 'Hasta',
    en: 'Until'
  },
  'checkout.departureDate': {
    es: 'Fecha de salida',
    en: 'Departure date'
  },
  'checkout.cancellationDeadline': {
    es: 'Fecha límite de cancelación',
    en: 'Cancellation deadline'
  },
  'checkout.easyCancellation': {
    es: 'Cancelación fácil hasta el ',
    en: 'Easy cancellation until the '
  },
  'checkout.cancellationNotAvailable': {
    es: 'La cancelación no está disponible. El plazo de cancelación ha expirado.',
    en: 'Cancellation is not available. The cancellation deadline has expired.'
  },
  'checkout.orderSummary': {
    es: 'Resumen del pedido',
    en: 'Order summary'
  },
  'checkout.bestRated': {
    es: 'Mejor valorados',
    en: 'Best rated'
  },
  'checkout.meetingPoint': {
    es: 'Punto de encuentro',
    en: 'Meeting point'
  },
  'checkout.noComment': {
    es: 'No hay comentario',
    en: 'No comment'
  },
  'checkout.language': {
    es: 'Idioma',
    en: 'Language'
  },
  'checkout.changeDateParticipants': {
    es: 'Cambiar fecha o número de participantes',
    en: 'Change date or number of participants'
  },
  'checkout.activityReceivedRating': {
    es: 'La actividad ha recibido un {rating}/5 por su relación calidad-precio',
    en: 'The activity has received a {rating}/5 for its quality-price ratio'
  },
  'checkout.goodValue': {
    es: 'Buena relación calidad-precio',
    en: 'Good value for money'
  },
  'checkout.promotionalCode': {
    es: 'Introduce un código promocional, de crédito o de regalo',
    en: 'Enter a promotional, credit, or gift code'
  },
  'checkout.total': {
    es: 'Total',
    en: 'Total'
  },
  'checkout.allTaxesIncluded': {
    es: 'Todas las tasas e impuestos incluidos',
    en: 'All taxes and fees included'
  },
  'checkout.travelers': {
    es: '{count} viajeros',
    en: '{count} travelers'
  },
  'checkout.traveler': {
    es: '1 viajero',
    en: '1 traveler'
  },
  'checkout.saveWithOffer': {
    es: 'Ahorra con esta oferta especial',
    en: 'Save with this special offer'
  },
  'checkout.pleaseCompleteFields': {
    es: 'Por favor completa todos los campos obligatorios',
    en: 'Please complete all required fields'
  },
  'checkout.pleaseSelectPaymentMethod': {
    es: 'Por favor selecciona un método de pago',
    en: 'Please select a payment method'
  },
  'checkout.reservationSuccess': {
    es: '¡Reserva realizada exitosamente! Pagarás más tarde.',
    en: 'Reservation completed successfully! You will pay later.'
  },
  'checkout.paymentSuccess': {
    es: '¡Pago procesado exitosamente!',
    en: 'Payment processed successfully!'
  },
  'checkout.cardPayment': { 
    es: 'Pago con tarjeta de crédito o débito',
    en: 'Payment with credit or debit card'
  },
  'checkout.paymentError': {
    es: 'Hubo un error al procesar el pago. Por favor, contacta con soporte.',
    en: 'There was an error processing the payment. Please contact support.'
  },
  'checkout.departureDatePassed': {
    es: 'Fecha de salida pasada',
    en: 'Departure date has passed'
  },
  'checkout.departureDatePassedMessage': {
    es: 'La fecha y hora de salida seleccionada ya pasó. Por favor modifica la fecha y hora de salida para continuar con la reserva.',
    en: 'The selected departure date and time has already passed. Please modify the departure date and time to continue with the reservation.'
  },
  'checkout.deadlineConfirmCancel': {
    es: 'Fecha límite para confirmar o cancelar',
    en: 'Deadline to confirm or cancel'
  },
  'checkout.deadlineMessage': {
    es: 'Debes confirmar o cancelar tu reserva antes del {deadline}. Si no tomas ninguna acción antes de esta fecha, la reserva se cancelará automáticamente.',
    en: 'You must confirm or cancel your reservation before {deadline}. If you don\'t take any action before this date, the reservation will be automatically cancelled.'
  },
  'checkout.holdSpotFor': {
    es: 'Mantenemos tu lugar por',
    en: "We'll hold your spot for"
  },
  'checkout.selectPaymentMethod': {
    es: 'Selecciona un método de pago',
    en: 'Select a payment method'
  },
  'checkout.paymentsSecure': {
    es: 'Los pagos son seguros y están encriptados.',
    en: 'Payments are secure and encrypted.'
  },
  'checkout.comingSoon': {
    es: 'Próximamente',
    en: 'Coming soon'
  },
  'checkout.reserveNowPayLater': {
    es: 'Reserva ahora y paga después',
    en: 'Reserve now and pay later'
  },
  'checkout.reserveNowPayLaterDescription': {
    es: 'Tu lugar está asegurado. Puedes pagar antes de la fecha de la actividad.',
    en: 'Your spot is secured. You can pay before the activity date.'
  },
  'checkout.deadlineConfirmCancelInfo': {
    es: 'Tienes hasta el {deadline} para confirmar o cancelar.',
    en: 'You have until {deadline} to confirm or cancel.'
  },
  'checkout.loadingPayPal': {
    es: 'Cargando PayPal...',
    en: 'Loading PayPal...'
  },
  'checkout.paypalRedirect': {
    es: 'Serás redirigido a PayPal para completar el pago.',
    en: 'You will be redirected to PayPal to complete payment.'
  },
  'checkout.termsAgreement': {
    es: 'Al continuar, aceptas los términos y condiciones generales de viajeromap. Lee más sobre el derecho de retracto y la información sobre la ley de viajes aplicable.',
    en: "By continuing, you agree to viajeromap's general terms and conditions. Read more on the right of withdrawal and information on the applicable travel law."
  },
  'checkout.reserveNow': {
    es: 'Reservar ahora',
    en: 'Reserve now'
  },
  'checkout.payNow': {
    es: 'Pagar ahora',
    en: 'Pay now'
  },
  'checkout.noOptions': {
    es: 'Sin opciones',
    en: 'No options'
  },
  'checkout.selectMeetingPoint': {
    es: 'Seleccione un punto de encuentro',
    en: 'Select a meeting point'
  },
  'checkout.specialRequest': {
    es: 'Solicitud especial',
    en: 'Special request'
  },
  'checkout.specialRequestPlaceholder': {
    es: 'Escribe tu solicitud especial...',
    en: 'Write your special request...'
  },
  'checkout.characters': {
    es: 'caracteres',
    en: 'characters'
  },
  'checkout.departureTime': {
    es: 'Horario de salida',
    en: 'Departure time'
  },
  'checkout.noSchedulesForDay': {
    es: 'No hay horarios disponibles para este día',
    en: 'No schedules available for this day'
  },
  'checkout.adult': {
    es: 'adulto',
    en: 'adult'
  },
  'checkout.adults': {
    es: 'adultos',
    en: 'adults'
  },
  'checkout.child': {
    es: 'niño',
    en: 'child'
  },
  'checkout.children': {
    es: 'niños',
    en: 'children'
  },
  'checkout.adultsLabel': {
    es: 'Adultos',
    en: 'Adults'
  },
  'checkout.childrenLabel': {
    es: 'Niños',
    en: 'Children'
  },
  'checkout.maxGroupSize': {
    es: 'Capacidad máx. del grupo: ',
    en: 'Max group size: '
  },
  'checkout.contactInformation': {
    es: 'Información de contacto',
    en: 'Contact Information'
  },
  'checkout.edit': {
    es: 'Editar',
    en: 'Edit'
  },
  'checkout.totalWithoutDiscount': {
    es: 'Total sin descuento: ',
    en: 'Total without discount: '
  },
  'checkout.totalToPay': {
    es: 'Total a pagar',
    en: 'Total to pay'
  },
  'checkout.withDiscount': {
    es: ' con descuento: ',
    en: ' with discount: '
  },
  'checkout.discountApplied': {
    es: 'Descuento aplicado: ',
    en: 'Discount applied: '
  },
  'checkout.unitPrice': {
    es: 'Unitario',
    en: 'Unit price'
  },
  'checkout.unitPriceWithDiscount': {
    es: ' con descuento',
    en: ' with discount'
  },
  'checkout.save': {
    es: 'Ahorras',
    en: 'Save'
  },
  'checkout.pax': {
    es: 'pax',
    en: 'pax'
  },
  'checkout.googlePayComingSoon': {
    es: 'Google Pay estará disponible próximamente.',
    en: 'Google Pay will be available soon.'
  },
  'checkout.loginModal.title': {
    es: '¿Quieres iniciar sesión?',
    en: 'Do you want to log in?'
  },
  'checkout.loginModal.continueWithoutLogin': {
    es: 'Continuar sin iniciar sesión',
    en: 'Continue without logging in'
  },
  'checkout.loginModal.benefits': {
    es: 'Consulta o accede a tus tickets fácilmente desde cualquier dispositivo con tu cuenta ViajeroMap.',
    en: 'Consult or access your tickets easily from any device with your ViajeroMap account.'
  },
  'checkout.loginModal.emailPlaceholder': {
    es: 'Dirección de correo electrónico',
    en: 'Email address'
  },
  'checkout.loginModal.continueWithEmail': {
    es: 'Continuar con tu correo',
    en: 'Continue with your email'
  },
  'checking.processing':{
    es: 'Procesando tu solicitud...',
    en: 'Processing your request...'
  },
  'checkout.errorProcessingPayment':{
    es: 'Error al procesar el pago. Por favor, intenta de nuevo.',
    en: 'Error processing payment. Please try again.'
  },
  'activity.processing': {
    es: 'Procesando...',
    en: 'Processing...'
  },
  'cart.subtitle': {
    es: 'Revisa tus actividades seleccionadas',
    en: 'Review your selected activities'
  },
  'cart.empty.title': {
    es: 'Tu carrito está vacío',
    en: 'Your cart is empty'
  },
  'cart.empty.message': {
    es: 'No has agregado ninguna actividad al carrito aún. Explora nuestras increíbles experiencias y comienza a planificar tu aventura.',
    en: 'You haven\'t added any activities to your cart yet. Explore our amazing experiences and start planning your adventure.'
  },
  'cart.empty.exploreActivities': {
    es: 'Explorar Actividades',
    en: 'Explore Activities'
  },
  'cart.features.secure.title': {
    es: 'Reserva Segura',
    en: 'Secure Booking'
  },
  'cart.features.secure.description': {
    es: 'Tus datos están protegidos con encriptación SSL',
    en: 'Your data is protected with SSL encryption'
  },
  'cart.features.flexible.title': {
    es: 'Cancelación Flexible',
    en: 'Flexible Cancellation'
  },
  'cart.features.flexible.description': {
    es: 'Cancela gratis hasta 24h antes del viaje',
    en: 'Cancel for free up to 24h before travel'
  },
  'cart.features.support.title': {
    es: 'Soporte 24/7',
    en: '24/7 Support'
  },
  'cart.features.support.description': {
    es: 'Nuestro equipo está aquí para ayudarte',
    en: 'Our team is here to help you'
  },
  'cart.remove.title': {
    es: 'Eliminar',
    en: 'Remove'
  },
  'cart.edit.title': {
    es: 'Editar',
    en: 'Edit'
  },

  // Profile
  'profile.title': {
    es: 'Perfil',
    en: 'Profile'
  },

  // Page Views
  'pageview.language.title': {
    es: 'Idioma',
    en: 'Language'
  },
  'pageview.language.selectLanguage': {
    es: 'Seleccionar Idioma',
    en: 'Select Language'
  },
  'pageview.language.spanish': {
    es: 'Español',
    en: 'Spanish'
  },
  'pageview.language.english': {
    es: 'Inglés',
    en: 'English'
  },
  'pageview.currency.title': {
    es: 'Moneda',
    en: 'Currency'
  },
  'pageview.currency.selectCurrency': {
    es: 'Seleccionar Moneda',
    en: 'Select Currency'
  },
  'pageview.currency.usd': {
    es: 'Dólar Estadounidense',
    en: 'US Dollar'
  },
  'pageview.currency.pen': {
    es: 'Sol Peruano',
    en: 'Peruvian Sol'
  },
  'pageview.login.title': {
    es: 'Inicia sesión o regístrate',
    en: 'Log in or sign up'
  },
  'pageview.support.title': {
    es: 'Ayuda',
    en: 'Support'
  },
  'pageview.download.title': {
    es: 'Descarga la app',
    en: 'Download the app'
  },
  'pageview.notifications.title': {
    es: 'Notificaciones',
    en: 'Notifications'
  },
  'pageview.appearance.title': {
    es: 'Apariencia',
    en: 'Appearance'
  },
  'pageview.appearance.alwaysLight': {
    es: 'Siempre modo claro',
    en: 'Always light mode'
  },

  // Home page
  'home.hero.title': {
    es: 'Descubre las mejores experiencias en Perú',
    en: 'Discover the best experiences in Peru'
  },
  'home.hero.subtitle': {
    es: 'Explora destinos únicos y vive aventuras inolvidables',
    en: 'Explore unique destinations and live unforgettable adventures'
  },
  'home.search.where': {
    es: '¿A dónde quieres ir?',
    en: 'Where do you want to go?'
  },
  'home.search.date': {
    es: 'Fecha',
    en: 'Date'
  },
  'home.search.travelers': {
    es: 'Viajeros',
    en: 'Travelers'
  },
  'home.search.adults': {
    es: 'Adultos',
    en: 'Adults'
  },
  'home.search.children': {
    es: 'Niños',
    en: 'Children'
  },
  'home.search.button': {
    es: 'Buscar Experiencias',
    en: 'Search Experiences'
  },
  'home.destinations.title': {
    es: 'Destinos Populares',
    en: 'Popular Destinations'
  },
  'home.destinations.subtitle': {
    es: 'Explora nuestros destinos más visitados',
    en: 'Explore our most visited destinations'
  },
  'home.activities.title': {
    es: 'Actividades Destacadas',
    en: 'Featured Activities'
  },
  'home.activities.subtitle': {
    es: 'Descubre nuestras experiencias más populares',
    en: 'Discover our most popular experiences'
  },
  'home.activities.available.title': {
    es: 'Actividades Disponibles',
    en: 'Available Activities'
  },
  'home.activities.available.subtitle': {
    es: 'Descubre todas las experiencias que tenemos para ti',
    en: 'Discover all the experiences we have for you'
  },
  'home.activities.viewDetails': {
    es: 'Ver Detalles',
    en: 'View Details'
  },
  'home.activities.viewMore': {
    es: 'Ver más actividades',
    en: 'View more activities'
  },
  'home.activities.loading': {
    es: 'Cargando actividades disponibles...',
    en: 'Loading available activities...'
  },
  'home.activities.noActivities': {
    es: 'No hay actividades disponibles en este momento.',
    en: 'No activities available at this time.'
  },
  'home.activities.priceFrom': {
    es: 'desde',
    en: 'from'
  },
  'home.activities.perPerson': {
    es: 'por persona',
    en: 'per person'
  },
  'home.activities.fromParticipants': {
    es: 'A partir de {count} {plural}',
    en: 'From {count} {plural}'
  },
  'home.activities.participantSingular': {
    es: 'pax',
    en: 'pax'
  },
  'home.activities.participantPlural': {
    es: 'paxs',
    en: 'paxs'
  },
  'home.activities.priceOnRequest': {
    es: 'Precio a consultar',
    en: 'Price on request'
  },
  'home.activities.more': {
    es: 'más',
    en: 'more'
  },
  'home.activities.provider': {
    es: 'Proveedor de actividad:',
    en: 'Activity Provider:'
  },
  'home.activities.newActivity': {
    es: 'Nueva Actividad',
    en: 'New Activity'
  },
  'home.activities.verifiedProvider': {
    es: 'Proveedor verificado',
    en: 'Verified provider'
  },
  'home.activities.verifiedProviderTooltip': {
    es: 'Proveedor verificado: cuenta con toda su documentación del gobierno local y del Ministerio de Turismo.',
    en: 'Verified provider: holds all documentation from the local government and the Ministry of Tourism.'
  },


  'home.activities.duration': {
    es: 'Duración',
    en: 'Duration'
  },
  'home.activities.includes': {
    es: 'Incluye',
    en: 'Includes'
  },
  'home.destinations.viewActivities': {
    es: 'Ver Actividades',
    en: 'View Activities'
  },
  'home.whyChooseUs.title': {
    es: '¿Por qué elegirnos?',
    en: 'Why choose us?'
  },
  'home.whyChooseUs.subtitle': {
    es: 'Especialistas en la Costa Sur de Perú',
    en: 'Specialists in the South Coast of Peru'
  },
  'home.readyToExplore.title': {
    es: '¿Listo para explorar la Costa Sur?',
    en: 'Ready to explore the South Coast?'
  },
  'home.readyToExplore.subtitle': {
    es: 'Únete a más de 8,000 viajeros que ya han descubierto Paracas, Ica y Nazca',
    en: 'Join over 8,000 travelers who have already discovered Paracas, Ica and Nazca'
  },

  // Search page
  'search.title': {
    es: 'Resultados de Búsqueda',
    en: 'Search Results'
  },
  'search.found': {
    es: 'Encontramos {count} experiencias para ti',
    en: 'We found {count} experiences for you'
  },
  'search.filters.title': {
    es: 'Filtros por Destino',
    en: 'Destination Filters'
  },
  'search.filters.destination': {
    es: 'Destino',
    en: 'Destination'
  },
  'search.filters.allDestinations': {
    es: 'Todos los destinos',
    en: 'All destinations'
  },
  'search.filters.yourSearch': {
    es: 'Tu búsqueda',
    en: 'Your search'
  },
  'search.filters.date': {
    es: 'Fecha',
    en: 'Date'
  },
  'search.filters.travelers': {
    es: 'Viajeros',
    en: 'Travelers'
  },
  'search.filters.adults': {
    es: 'adultos',
    en: 'adults'
  },
  'search.filters.children': {
    es: 'niños',
    en: 'children'
  },
  'search.loading': {
    es: 'Cargando actividades...',
    en: 'Loading activities...'
  },
  'search.error': {
    es: 'Error al cargar las actividades. Por favor, intenta de nuevo.',
    en: 'Error loading activities. Please try again.'
  },
  'search.noResults': {
    es: 'No se encontraron actividades para los criterios seleccionados.',
    en: 'No activities found for the selected criteria.'
  },
  'search.duration': {
    es: 'Duración',
    en: 'Duration'
  },
  'search.includes': {
    es: 'Incluye',
    en: 'Includes'
  },
  'search.viewDetails': {
    es: 'Ver Detalles',
    en: 'View Details'
  },

  // Activities page
  'activities.title': {
    es: 'Actividades',
    en: 'Activities'
  },
  'activities.subtitle': {
    es: 'Especialistas en Paracas, Ica y Nazca. Descubre el desierto y la costa peruana',
    en: 'Specialists in Paracas, Ica and Nazca. Discover the desert and Peruvian coast'
  },
  'activities.filterByDestination': {
    es: 'Filtrar por Destino',
    en: 'Filter by Destination'
  },
  'activities.allDestinations': {
    es: 'Todos los destinos',
    en: 'All destinations'
  },
  'activities.noActivitiesFound': {
    es: 'No se encontraron actividades en este destino.',
    en: 'No activities found in this destination.'
  },
  'activities.cta.title': {
    es: '¿No encuentras lo que buscas?',
    en: 'Can\'t find what you\'re looking for?'
  },
  'activities.cta.subtitle': {
    es: 'Contáctanos para crear una actividad personalizada en Paracas, Ica o Nazca',
    en: 'Contact us to create a custom activity in Paracas, Ica or Nazca'
  },
  'activities.cta.button': {
    es: 'Contactar Asesor',
    en: 'Contact Advisor'
  },

  // Extranet Activities page
  'activities.error.loading': {
    es: 'Error al cargar las actividades',
    en: 'Error loading activities'
  },
  'activities.delete.confirm': {
    es: '¿Estás seguro de que quieres eliminar esta actividad?',
    en: 'Are you sure you want to delete this activity?'
  },
  'activities.delete.success': {
    es: 'Actividad eliminada exitosamente',
    en: 'Activity deleted successfully'
  },
  'activities.delete.error': {
    es: 'Error al eliminar la actividad',
    en: 'Error deleting activity'
  },
  'activities.status.active': {
    es: 'Activo',
    en: 'Active'
  },
  'activities.status.inProgress': {
    es: 'En proceso',
    en: 'In Progress'
  },
  'activities.duration.hours': {
    es: 'horas',
    en: 'hours'
  },
  'activities.duration.minutes': {
    es: 'minutos',
    en: 'minutes'
  },
  'activities.duration.notSpecified': {
    es: 'Duración no especificada',
    en: 'Duration not specified'
  },
  'activities.destination.notSpecified': {
    es: 'Destino no especificado',
    en: 'Destination not specified'
  },
  'activities.total': {
    es: 'Total',
    en: 'Total'
  },
  'activities.count': {
    es: 'actividades',
    en: 'activities'
  },
  'activities.filter.byActivity': {
    es: 'Filtrar por Actividad',
    en: 'Filter by Activity'
  },
  'activities.search.placeholder': {
    es: 'Buscar actividad',
    en: 'Search activity'
  },
  'activities.filter.byStatus': {
    es: 'Filtrar por estado',
    en: 'Filter by status'
  },
  'activities.filter.allDestinations': {
    es: 'Todos los destinos',
    en: 'All destinations'
  },
  'activities.search.button': {
    es: 'Buscar',
    en: 'Search'
  },
  'activities.showMore': {
    es: 'Mostrar más',
    en: 'Show more'
  },
  'activities.showLess': {
    es: 'Mostrar menos',
    en: 'Show less'
  },
  'activities.filter.allStatuses': {
    es: 'Todos los estados',
    en: 'All statuses'
  },
  'activities.create.new': {
    es: 'Crear nueva actividad',
    en: 'Create new activity'
  },
  'activities.table.activity': {
    es: 'Actividad',
    en: 'Activity'
  },
  'activities.table.destination': {
    es: 'Destino',
    en: 'Destination'
  },
  'activities.table.origin': {
    es: 'Origen',
    en: 'Origin'
  },
  'activities.table.status': {
    es: 'Estado',
    en: 'Status'
  },
  'activities.table.action': {
    es: 'Acción',
    en: 'Action'
  },
  'activities.noResults': {
    es: 'No se encontraron actividades',
    en: 'No activities found'
  },
  'activities.clearFilters': {
    es: 'Limpiar filtros',
    en: 'Clear filters'
  },
  'activities.noRatings': {
    es: 'Sin valoraciones',
    en: 'No ratings'
  },
  'activities.viewOnWebsite': {
    es: 'Ver en el sitio web',
    en: 'View on website'
  },
  'activities.viewDetails': {
    es: 'Ver detalle',
    en: 'View detail'
  },
  'activities.finishProcess': {
    es: 'Terminar proceso',
    en: 'Finish process'
  },
  'activities.edit': {
    es: 'Editar',
    en: 'Edit'
  },
  'activities.duplicate': {
    es: 'Duplicar',
    en: 'Duplicate'
  },
  'activities.delete': {
    es: 'Eliminar',
    en: 'Delete'
  },
  'activities.pagination.show': {
    es: 'Mostrar',
    en: 'Show'
  },
  'activities.pagination.itemsPerPage': {
    es: 'elementos por página',
    en: 'items per page'
  },
  'activities.pagination.navigation': {
    es: 'Paginación',
    en: 'Pagination'
  },

  // Activity Detail page
  'detail.presentation': {
    es: 'Presentación',
    en: 'Presentation'
  },
  'detail.description': {
    es: 'Descripción',
    en: 'Description'
  },
  'detail.includes': {
    es: 'Qué incluye',
    en: 'What\'s included'
  },
  'detail.notIncludes': {
    es: 'Qué no incluye',
    en: 'What\'s not included'
  },
  'detail.recommendations': {
    es: 'Recomendaciones',
    en: 'Recommendations'
  },
  'detail.restrictions': {
    es: 'Restricciones',
    en: 'Restrictions'
  },
  'detail.itinerary': {
    es: 'Itinerario',
    en: 'Itinerary'
  },
  'detail.booking.title': {
    es: 'Reserva tu experiencia',
    en: 'Book your experience'
  },
  'detail.booking.date': {
    es: 'Fecha de viaje',
    en: 'Travel date'
  },
  'detail.booking.travelers': {
    es: 'Número de viajeros',
    en: 'Number of travelers'
  },
  'detail.booking.adults': {
    es: 'Adultos (18+)',
    en: 'Adults (18+)'
  },
  'detail.booking.children': {
    es: 'Niños (0-17)',
    en: 'Children (0-17)'
  },
  'detail.booking.total': {
    es: 'Total',
    en: 'Total'
  },
  'detail.booking.reserve': {
    es: 'Reservar',
    en: 'Reserve'
  },
  'detail.booking.itemAddedToCart': {
    es: 'Actividad agregada al carrito exitosamente',
    en: 'Activity added to cart successfully'
  },
  'detail.meetingPoint': {
    es: 'Punto de encuentro',
    en: 'Meeting point'
  },
  'detail.duration': {
    es: 'Duración',
    en: 'Duration'
  },
  'detail.groupSize': {
    es: 'Tamaño del grupo',
    en: 'Group size'
  },
  'detail.languages': {
    es: 'Idiomas',
    en: 'Languages'
  },
  'detail.error': {
    es: 'Error al cargar la actividad. Por favor, intenta de nuevo.',
    en: 'Error loading activity. Please try again.'
  },
  'detail.loading': {
    es: 'Cargando detalles de la actividad...',
    en: 'Loading activity details...'
  },
  'detail.notFound': {
    es: 'Actividad no encontrada',
    en: 'Activity not found'
  },
  'detail.reviews': {
    es: 'reseñas',
    en: 'reviews'
  },
  'rating.comments': {
    es: 'comentarios',
    en: 'comments'
  },
  'rating.basedOn': {
    es: 'basado en',
    en: 'based on'
  },

  'detail.perPerson': {
    es: 'por persona',
    en: 'per person'
  },
  'activity.pricePerPerson': {
    es: 'precio por persona',
    en: 'price per person'
  },
  'activity.discount': {
    es: 'DESCUENTO',
    en: 'DISCOUNT'
  },
  'activity.youSave': {
    es: 'Ahorras:',
    en: 'You save:'
  },
  'detail.booking.security': {
    es: 'Reserva segura con cancelación gratuita',
    en: 'Secure booking with free cancellation'
  },
  'detail.booking.options': {
    es: 'Opciones de Reserva',
    en: 'Booking Options'
  },
  'detail.booking.duration': {
    es: 'Duración',
    en: 'Duration'
  },
  'detail.booking.guide': {
    es: 'Guía',
    en: 'Guide'
  },
  'detail.booking.selectDepartureTime': {
    es: 'Seleccione la hora de salida para la fecha',
    en: 'Select departure time for the date'
  },
  'detail.booking.noSchedulesAvailable': {
    es: 'No hay horarios disponibles para la fecha seleccionada.',
    en: 'No schedules available for the selected date.'
  },
  'detail.booking.noSchedules': {
    es: 'No hay horarios disponibles.',
    en: 'No schedules available.'
  },
  'detail.booking.pickupZones': {
    es: 'Ver zonas de recojo',
    en: 'View pickup zones'
  },
  'detail.booking.pickupDescription': {
    es: 'Comprueba si tu alojamiento está dentro de la zona elegible para el servicio de recojo.',
    en: 'Check if your accommodation is within the eligible area for pickup service.'
  },
  'detail.booking.cancellationPolicy': {
    es: 'Cancela antes de las 8:30 del día anterior para recibir un reembolso completo',
    en: 'Cancel before 8:30 AM the day before to receive a full refund'
  },
  'detail.booking.oneAdult': {
    es: '1 adulto',
    en: '1 adult'
  },
  'detail.booking.allTaxesIncluded': {
    es: 'Todas las tasas e impuestos incluidos',
    en: 'All taxes and fees included'
  },
  'detail.booking.reserveNow': {
    es: 'Reservar ahora',
    en: 'Reserve now'
  },
  'detail.booking.addToCart': {
    es: 'Añadir al carrito',
    en: 'Add to cart'
  },
  'detail.booking.from': {
    es: 'Desde',
    en: 'From'
  },
  'detail.booking.viewAvailability': {
    es: 'Ver disponibilidad',
    en: 'View availability'
  },
  'detail.booking.bookNowPayLater': {
    es: 'Reserva ahora y paga después para asegurar tu plaza sin que se realice ningún cargo hoy.',
    en: 'Book now and pay later to secure your spot without any charges today.'
  },
  'detail.booking.readMore': {
    es: 'Leer más',
    en: 'Read more'
  },
  'detail.booking.meetingPoint': {
    es: 'Punto de Encuentro',
    en: 'Meeting Point'
  },
  'detail.booking.selectMeetingPoint': {
    es: 'Selecciona tu punto de encuentro',
    en: 'Select your meeting point'
  },
  'detail.booking.hotelLocation': {
    es: 'Ubicación del Hotel',
    en: 'Hotel Location'
  },
  'detail.booking.searchHotel': {
    es: 'Buscar hotel...',
    en: 'Search hotel...'
  },
  'detail.booking.hotelDescription': {
    es: 'Busca tu hotel para que podamos recogerte en la ubicación exacta.',
    en: 'Search for your hotel so we can pick you up at the exact location.'
  },
  'detail.booking.selectHotel': {
    es: 'Selecciona tu hotel',
    en: 'Select your hotel'
  },
  'detail.booking.hours': {
    es: 'h',
    en: 'h'
  },
  'detail.booking.minutes': {
    es: 'min',
    en: 'min'
  },
  'detail.booking.fullDay': {
    es: 'FULL DAY',
    en: 'FULL DAY'
  },
  'detail.booking.perPerson': {
    es: 'por persona',
    en: 'per person'
  },
  'detail.booking.fromParticipants': {
    es: 'A partir de {count} {plural}',
    en: 'From {count} {plural}'
  },
  'detail.booking.participantSingular': {
    es: 'pax',
    en: 'pax'
  },
  'detail.booking.participantPlural': {
    es: 'personas',
    en: 'people'
  },
  'detail.booking.contactForPrice': {
    es: 'Consultar precio',
    en: 'Contact for price'
  },
  'detail.booking.duration.day': {
    es: 'día',
    en: 'day'
  },
  'detail.booking.duration.days': {
    es: 'días',
    en: 'days'
  },
  'detail.booking.duration.hour': {
    es: 'hora',
    en: 'hour'
  },
  'detail.booking.duration.hours': {
    es: 'horas',
    en: 'hours'
  },
  'detail.booking.duration.minute': {
    es: 'minuto',
    en: 'minute'
  },
  'detail.booking.duration.minutes': {
    es: 'minutos',
    en: 'minutes'
  },
  'detail.booking.duration.notSpecified': {
    es: 'Duración no especificada',
    en: 'Duration not specified'
  },
  'detail.booking.duration.default': {
    es: '2 horas',
    en: '2 hours'
  },
  'detail.booking.guideLanguage': {
    es: 'Idioma del guía: ',
    en: 'Guide language: '
  },
  'detail.booking.selectGuideLanguages': {
    es: 'Selecciona idiomas del guía',
    en: 'Select guide languages'
  },
  'detail.booking.selectLanguage': {
    es: 'Selecciona un idioma',
    en: 'Select a language'
  },
  'detail.booking.selectedLocation': {
    es: 'Ubicación seleccionada:',
    en: 'Selected location:'
  },
  'detail.booking.edit': {
    es: 'Editar',
    en: 'Edit'
  },
  'detail.booking.viewPickupLocations': {
    es: 'Ver {count} ubicaciones de recogida',
    en: 'View {count} pickup locations'
  },
  'detail.booking.pickupAvailableDescription': {
    es: 'La recogida está disponible desde múltiples ubicaciones. Selecciona tu ubicación preferida.',
    en: 'Pickup is available from multiple locations. Select your preferred location.'
  },
  'detail.booking.specialRequests': {
    es: '¿Tienes alguna solicitud especial? (opcional)',
    en: 'Do you have any special requests? (optional)'
  },
  'detail.booking.specialRequestsPlaceholder': {
    es: 'Ej: Llegar 15 minutos antes, necesidades específicas, ubicación exacta...',
    en: 'E.g.: Arrive 15 minutes early, specific needs, exact location...'
  },
  'detail.booking.characters': {
    es: 'caracteres',
    en: 'characters'
  },
  'detail.booking.startTime': {
    es: 'Hora de inicio',
    en: 'Start time'
  },
  'detail.booking.selectStartTime': {
    es: 'Selecciona un horario de inicio',
    en: 'Select a starting time'
  },
  'detail.booking.pickupLocations': {
    es: 'Ubicaciones de Recogida',
    en: 'Pickup Locations'
  },
  'detail.booking.close': {
    es: 'Cerrar',
    en: 'Close'
  },
  'detail.booking.confirm': {
    es: 'Confirmar',
    en: 'Confirm'
  },
  'detail.booking.activityAlreadyInCart': {
    es: 'Esta actividad ya está en tu carrito',
    en: 'This activity is already in your cart'
  },
  'detail.booking.noSchedulesForDay': {
    es: 'No hay horarios disponibles para {day} ({date}).',
    en: 'No schedules available for {day} ({date}).'
  },
  'detail.booking.selectPickupLocation': {
    es: 'Selecciona tu ubicación de recogida preferida:',
    en: 'Select your preferred pickup location:'
  },
  'detail.booking.cancelBeforeDeadline': {
    es: 'Cancela antes del {deadline} para un reembolso completo',
    en: 'Cancel before {deadline} for a full refund'
  },
  'detail.booking.provider': {
    es: 'Proveedor',
    en: 'Provider'
  },
  'detail.booking.verified': {
    es: 'Verificado',
    en: 'Verified'
  },
  'detail.review': {
    es: 'reseña',
    en: 'review'
  },

  // About page
  'about.title': {
    es: 'Sobre Nosotros',
    en: 'About Us'
  },
  'about.subtitle': {
    es: 'Conoce más sobre nuestra empresa',
    en: 'Learn more about our company'
  },

  // Contact page
  'contact.title': {
    es: 'Contáctanos',
    en: 'Contact Us'
  },
  'contact.subtitle': {
    es: 'Estamos aquí para ayudarte',
    en: 'We are here to help you'
  },

  // Footer
  'footer.company': {
    es: 'Peru Trips & Adventures',
    en: 'Peru Trips & Adventures'
  },

  'footer.workWithUs': {
    es: 'Trabaja con nosotros',
    en: 'Work with us'
  },
  'footer.comoProveedorDeActividades': {
    es: 'Como proveedor de actividades',
    en: 'As a provider of activities'
  },
  'footer.comoCreadorDeContenido': { 
    es: 'Como creador de contenido',
    en: 'As a content creator'
  },
  'footer.socialMedia': {
    es: 'Encuentranos en nuestras redes sociales',
    en: 'Find us on our social media'
  },
  'footer.comoAfiliado': {
    es: 'Como afiliado',
    en: 'As an affiliate'
  },
  'footer.description': {
    es: 'Tu compañía de confianza para explorar los mejores destinos de Perú.',
    en: 'Your trusted company to explore the best destinations in Peru.'
  },
  'footer.quickLinks': {
    es: 'Enlaces Rápidos',
    en: 'Quick Links'
  },
  'footer.destinations': {
    es: 'Principales destinos',
    en: 'Main destinations'
  },
  'footer.contactInfo': {
    es: 'Información de Contacto',
    en: 'Contact Information'
  },
  'footer.address': {
    es: 'Dirección',
    en: 'Address'
  },
  'footer.phone': {
    es: 'Teléfono',
    en: 'Phone'
  },
  'footer.email': {
    es: 'Email',
    en: 'Email'
  },
  'footer.copyright': {
    es: '© 2025-2026 ViajeroMap. Creado en Paracas, Ica, Perú.',
    en: '© 2025-2026 ViajeroMap. Created in Paracas, Ica, Peru.'
  },

  // Destinations
  'destination.paracas': {
    es: 'Paracas',
    en: 'Paracas'
  },
  'destination.ica': {
    es: 'Ica',
    en: 'Ica'
  },
  'destination.nazca': {
    es: 'Nazca',
    en: 'Nazca'
  },
  'destination.activities': {
    es: 'actividades',
    en: 'activities'
  },
  'destination.currentTemperature': {
    es: 'Temperatura actual',
    en: 'Current temperature'
  },
  'destination.pointsOfInterest': {
    es: 'Puntos de interés:',
    en: 'Points of interest:'
  },
  'destination.loadingInfo': {
    es: 'Cargando información...',
    en: 'Loading information...'
  },
  'destination.exploreDestination': {
    es: 'Explorar destino',
    en: 'Explore destination'
  },

  // Common
  'common.editDepartureDate': {
    es: 'Editar fecha de salida',
    en: 'Edit departure date'
  },
  'common.backToCart': {
    es: 'Volver al carrito',
    en: 'Back to cart'
  },
  'common.loading': {
    es: 'Cargando...',
    en: 'Loading...'
  },
  'common.validating': {
    es: 'Validando...',
    en: 'Validating...'
  },
  'common.validatingAuth': {
    es: 'Validando autenticación...',
    en: 'Validating authentication...'
  },
  'common.signingIn': {
    es: 'Iniciando sesión...',
    en: 'Signing in...'
  },
  'common.continueWithGoogle': {
    es: 'Continuar con Google',
    en: 'Continue with Google'
  },
  'common.continueWithEmail': {
    es: 'Continuar con correo electrónico',
    en: 'Continue with email'
  },
  'common.enterEmail': {
    es: 'Ingresa tu correo electrónico',
    en: 'Enter your email address'
  },
  'common.or': {
    es: 'o',
    en: 'or'
  },
  'common.saving': {
    es: 'Guardando...',
    en: 'Saving...'
  },
  'common.saveChanges': {
    es: 'Guardar cambios',
    en: 'Save changes'
  },
  'common.error': {
    es: 'Error',
    en: 'Error'
  },
  'common.success': {
    es: 'Éxito',
    en: 'Success'
  },
  'common.cancel': {
    es: 'Cancelar',
    en: 'Cancel'
  },
  'common.accept': {
    es: 'Aceptar',
    en: 'Accept'
  },
  'common.close': {
    es: 'Cerrar',
    en: 'Close'
  },
  'common.back': {
    es: 'Volver',
    en: 'Back'
  },
  'common.next': {
    es: 'Siguiente',
    en: 'Next'
  },
  'common.previous': {
    es: 'Anterior',
    en: 'Previous'
  },
  'common.viewDetails': {
    es: 'Ver Detalle',
    en: 'View Detail'
  },
  'common.editAvailability': {
    es: 'Editar disponibilidad',
    en: 'Edit availability'
  },
  'common.confirm': {
    es: 'Confirmar',
    en: 'Confirm'
  },
  'common.selectDate': {
    es: 'Seleccionar fecha',
    en: 'Select date'
  },
  'common.clearFilters': {
    es: 'Limpiar filtros',
    en: 'Clear filters'
  },
  'common.showMore': {
    es: 'Mostrar más',
    en: 'Show more'
  },
  'common.showLess': {
    es: 'Mostrar menos',
    en: 'Show less'
  },
  'common.edit': {
    es: 'Editar',
    en: 'Edit'
  },
  'common.save': {
    es: 'Guardar',
    en: 'Save'
  },
  'common.more': {
    es: 'Más',
    en: 'More'
  },

  // Cookie Consent
  'cookies.title': {
    es: '🍪 Uso de Cookies',
    en: '🍪 Cookie Usage'
  },
  'cookies.message': {
    es: 'Utilizamos cookies para mejorar tu experiencia, personalizar contenido y analizar el tráfico del sitio. Al hacer clic en "Aceptar", aceptas el uso de cookies según nuestra política de privacidad.',
    en: 'We use cookies to improve your experience, personalize content, and analyze site traffic. By clicking "Accept", you agree to the use of cookies according to our privacy policy.'
  },
  'cookies.accept': {
    es: 'Aceptar',
    en: 'Accept'
  },
  'cookies.reject': {
    es: 'Rechazar',
    en: 'Reject'
  },
  'cookies.learnMore': {
    es: 'Más información',
    en: 'Learn more'
  },
  'cookies.moreInfoText': {
    es: 'Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo. Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar nuestro servicio. Puedes gestionar tus preferencias en cualquier momento.',
    en: 'Cookies are small text files stored on your device. We use essential cookies for site functionality and analytics cookies to improve our service. You can manage your preferences at any time.'
  },
  'favorites.empty.title': {
    es: 'No tienes favoritos',
    en: 'You don\'t have favorites'
  },
  'favorites.empty.message': {
    es: 'Aún no tienes actividades en favoritos. Guarda tus experiencias preferidas para compararlas, revisar precios y horarios, y planificar mejor tu viaje.',
    en: 'You don’t have any favorite activities yet. Save your preferred experiences to compare them, check prices and schedules, and plan your trip better.'
  },
  'favorites.exploreActivities': {
    es: 'Explorar Actividades',
    en: 'Explore Activities'
  },
  'cart.editDetails': {
    es: 'Editar detalles',
    en: 'Edit details'
  },
  'cart.traveler': {
    es: 'Viajero',
    en: 'Traveler'
  },
  'cart.travelers': {
    es: 'Viajeros',
    en: 'Travelers'
  },
  'cart.adding': {
    es: 'Agregando...',
    en: 'Adding...'
  },
  'cart.departureDate': {
    es: 'Fecha de salida',
    en: 'Departure date'
  },
  'cart.departureTime': {
    es: 'Hora de salida',
    en: 'Departure time'
  },
  'cart.meetingPoint': {
    es: 'Punto de encuentro',
    en: 'Meeting point'
  },
  'cart.guideLanguage': {
    es: 'Idioma del guía',
    en: 'Guide language'
  },
  'cart.pricePerPerson': {
    es: 'Precio por persona',
    en: 'Price per person'
  },
  'cart.discount': {
    es: 'descuento',
    en: 'discount'
  },
  'cart.perPerson': {
    es: 'por persona',
    en: 'per person'
  },
  'booking.selectOption': {
    es: 'Selecciona una opción de reserva',
    en: 'Select a booking option'
  },
  'booking.selectTime': {
    es: 'Selecciona un horario',
    en: 'Select a time'
  },
  'booking.meetingPoint': {
    es: 'Punto de Encuentro',
    en: 'Meeting Point'
  },
  'booking.duration': {
    es: 'Duración',
    en: 'Duration'
  },
  'booking.guide': {
    es: 'Guía',
    en: 'Guide'
  },
  'booking.cancellationPolicy': {
    es: 'Cancela antes de las 8:00 AM del día anterior para recibir un reembolso completo',
    en: 'Cancel before 8:00 AM the day before to receive a full refund'
  },
  'booking.oneAdult': {
    es: '1 Adulto',
    en: '1 Adult'
  },
  'booking.allTaxesIncluded': {
    es: 'Todas las tasas e impuestos incluidos',
    en: 'All taxes and fees included'
  },
  'booking.reserveNow': {
    es: 'Reservar ahora',
    en: 'Reserve now'
  },
  'booking.addToCart': {
    es: 'Añadir al carrito',
    en: 'Add to cart'
  },

  // Login page
  'login.title': {
    es: 'Panel de Administración',
    en: 'Administration Panel'
  },
  'login.email': {
    es: 'Correo electrónico',
    en: 'Email'
  },
  'login.emailPlaceholder': {
    es: 'Ingrese su correo electrónico',
    en: 'Enter your email'
  },
  'login.password': {
    es: 'Contraseña',
    en: 'Password'
  },
  'login.passwordPlaceholder': {
    es: 'Ingrese su contraseña',
    en: 'Enter your password'
  },
  'login.submit': {
    es: 'Iniciar Sesión',
    en: 'Sign In'
  },
  'login.loading': {
    es: 'Iniciando sesión...',
    en: 'Signing in...'
  },
  'login.error.emptyFields': {
    es: 'Por favor, complete todos los campos',
    en: 'Please complete all fields'
  },
  'login.error.invalidCredentials': {
    es: 'Usuario o contraseña incorrectos',
    en: 'Invalid username or password'
  },
  'login.error.connection': {
    es: 'Error de conexión. Por favor, intente de nuevo.',
    en: 'Connection error. Please try again.'
  },
  'login.backToHome': {
    es: 'Volver al sitio principal',
    en: 'Back to main site'
  },
  'login.copyright': {
    es: 'Todos los derechos reservados.',
    en: 'All rights reserved.'
  },

  // New Activity
  'newActivity.title': {
    es: 'Crear Nueva Actividad',
    en: 'Create New Activity'
  },
  'newActivity.title.step': {
    es: '¿Cuál es el título de tu actividad?',
    en: 'What is the title of your activity?'
  },
  'newActivity.title.description': {
    es: 'Elige un título atractivo que describa claramente tu experiencia.',
    en: 'Choose an attractive title that clearly describes your experience.'
  },
  'newActivity.title.label': {
    es: 'Título de la actividad',
    en: 'Activity title'
  },
  'newActivity.title.placeholder': {
    es: 'Ej: Tour por las Islas Ballestas en Paracas',
    en: 'Ex: Ballestas Islands Tour in Paracas'
  },
  'newActivity.description.step': {
    es: 'Describe tu actividad',
    en: 'Describe your activity'
  },
  'newActivity.description.description': {
    es: 'Proporciona una descripción detallada de lo que incluye tu experiencia.',
    en: 'Provide a detailed description of what your experience includes.'
  },
  'newActivity.description.label': {
    es: 'Descripción de la actividad',
    en: 'Activity description'
  },
  'newActivity.description.placeholder': {
    es: 'Describe los puntos destacados, lo que incluye, duración, etc.',
    en: 'Describe highlights, what\'s included, duration, etc.'
  },
  'common.continue': {
    es: 'Continuar',
    en: 'Continue'
  },
  'common.skip': {
    es: 'Omitir',
    en: 'Skip'
  },

  // Step Category
  'stepCategory.title': {
    es: '¿Qué opción describe mejor tu actividad?',
    en: 'Which option best describes your activity?'
  },
  'stepCategory.description': {
    es: 'Esto adapta el proceso de creación a aquello que ofreces y nos ayuda a categorizar tu actividad para que los clientes puedan encontrarlo.',
    en: 'This adapts the creation process to what you offer and helps us categorize your activity so customers can find it.'
  },
  'categories.error.noCategories': {
    es: 'No se encontraron categorías disponibles.',
    en: 'No categories found.'
  },
  'stepCategory.warning.title': {
    es: 'La categoría de la actividad no se puede cambiar',
    en: 'The activity category cannot be changed'
  },
  'stepCategory.warning.description': {
    es: 'Esto se debe a que personalizamos el proceso de creación de la actividad según tu elección inicial. Si seleccionas la categoría incorrecta, elimina la actividad y crea uno de nuevo.',
    en: 'This is because we customize the activity creation process based on your initial choice. If you select the wrong category, delete the activity and create a new one.'
  },
  'stepCategory.error.createFailed': {
    es: 'Error al crear la actividad. Por favor, inténtelo de nuevo.',
    en: 'Error creating activity. Please try again.'
  },

  // Step Title
  'stepTitle.title': {
    es: 'Información principal',
    en: 'Main Information'
  },
  'stepTitle.description': {
    es: 'Proporciona la información básica de tu actividad',
    en: 'Provide the basic information for your activity'
  },
  'stepTitle.activityTitle.label': {
    es: '¿Cuál es el título que verán los clientes?',
    en: 'What is the title clients will see?'
  },
  'stepTitle.activityTitle.instructions': {
    es: 'Proporciona una ubicación seguida de dos puntos (:), e incluye el tipo de actividad (por ejemplo, tour o entrada), y las inclusiones importantes y puntos de venta únicos. Empieza el título con mayúscula.',
    en: 'Provide a location followed by a colon (:), and include the type of activity (e.g., tour or ticket), and important inclusions and unique selling points. Start the title with a capital letter.'
  },
  'stepTitle.activityTitle.placeholder': {
    es: 'Ej: Desde Paracas: Islas Ballestas y Reserva de Paracas',
    en: 'Ex: From Paracas: Ballestas Islands & Paracas Reserve'
  },
  'stepTitle.referenceCode.label': {
    es: 'Crea un código de referencia de la actividad (opcional)',
    en: 'Create an activity reference code (optional)'
  },
  'stepTitle.referenceCode.instructions': {
    es: 'Para ayudarte a hacer un seguimiento de tus actividades en GetYourGuide, puedes añadir tu código interno. Si no añades ninguno, te asignaremos uno automáticamente.',
    en: 'To help you track your activities on GetYourGuide, you can add your internal code. If you don\'t add one, we will assign one automatically.'
  },
  'stepTitle.referenceCode.placeholder': {
    es: 'Ej: T-1069772',
    en: 'Ex: T-1069772'
  },
  'stepTitle.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepTitle.error.titleRequired': {
    es: 'El título es obligatorio',
    en: 'Title is required'
  },
  'stepTitle.error.titleTooLong': {
    es: 'El texto excede el límite de 80 caracteres. Solo se han guardado los primeros 80 caracteres.',
    en: 'The text exceeds the 80 character limit. Only the first 80 characters have been saved.'
  },
  'stepTitle.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepTitle.selectedCategory': {
    es: 'Categoría seleccionada',
    en: 'Selected category'
  },

  // Step Description
  'stepDescription.title': {
    es: 'Descripción de la actividad',
    en: 'Activity Description'
  },
  'stepDescription.description': {
    es: 'Describe tu actividad de manera atractiva para los clientes',
    en: 'Describe your activity in an attractive way for customers'
  },
  'stepDescription.presentation.label': {
    es: 'Presentación de la actividad',
    en: 'Activity Presentation'
  },
  'stepDescription.presentation.instructions': {
    es: 'Escribe una presentación breve y atractiva que capture la atención de los clientes (máximo 200 caracteres).',
    en: 'Write a brief and attractive presentation that captures customers\' attention (maximum 200 characters).'
  },
  'stepDescription.presentation.placeholder': {
    es: 'Ej: Disfruta de una experiencia única en las Islas Ballestas, conocidas como las "Galápagos de Perú"...',
    en: 'Ex: Enjoy a unique experience at the Ballestas Islands, known as the "Galápagos of Peru"...'
  },
  'stepDescription.fullDescription.label': {
    es: 'Descripción completa',
    en: 'Full Description'
  },
  'stepDescription.fullDescription.instructions': {
    es: 'Proporciona una descripción detallada que explique qué incluye la actividad, qué pueden esperar los clientes y por qué deberían elegir esta experiencia (máximo 1000 caracteres).',
    en: 'Provide a detailed description that explains what the activity includes, what customers can expect, and why they should choose this experience (maximum 1000 characters).'
  },
  'stepDescription.fullDescription.placeholder': {
    es: 'Ej: Esta excursión te llevará a las hermosas Islas Ballestas, donde podrás observar...',
    en: 'Ex: This tour will take you to the beautiful Ballestas Islands, where you can observe...'
  },
  'stepDescription.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepDescription.error.bothFieldsRequired': {
    es: 'Tanto la presentación como la descripción son obligatorias',
    en: 'Both presentation and description are required'
  },
  'stepDescription.error.presentationTooLong': {
    es: 'La presentación excede el límite de 200 caracteres',
    en: 'The presentation exceeds the 200 character limit'
  },
  'stepDescription.error.descriptionTooLong': {
    es: 'La descripción excede el límite de 1000 caracteres',
    en: 'The description exceeds the 1000 character limit'
  },
  'stepDescription.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },

  // Step Recommendations
  'stepRecommend.title': {
    es: 'Recomendaciones',
    en: 'Recommendations'
  },
  'stepRecommend.description': {
    es: 'Agrega recomendaciones útiles para los clientes',
    en: 'Add helpful recommendations for customers'
  },
  'stepRecommend.recommendations.label': {
    es: '¿Qué recomiendas a los clientes?',
    en: 'What do you recommend to customers?'
  },
  'stepRecommend.recommendations.instructions': {
    es: 'Agrega al menos 3 recomendaciones útiles como qué llevar, qué ropa usar, consejos de seguridad, etc. (máximo 100 caracteres por recomendación).',
    en: 'Add at least 3 helpful recommendations such as what to bring, what clothes to wear, safety tips, etc. (maximum 100 characters per recommendation).'
  },
  'stepRecommend.recommendations.placeholder': {
    es: 'Ej: Llevar protector solar y agua',
    en: 'Ex: Bring sunscreen and water'
  },
  'stepRecommend.addRecommendation': {
    es: 'Agregar recomendación',
    en: 'Add recommendation'
  },
  'stepRecommend.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepRecommend.error.atLeastOneRequired': {
    es: 'Debe agregar al menos una recomendación',
    en: 'You must add at least one recommendation'
  },
  'stepRecommend.error.minimumThreeRequired': {
    es: 'Debe agregar al menos 3 recomendaciones',
    en: 'You must add at least 3 recommendations'
  },
  'stepRecommend.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepRecommend.required': {
    es: 'Obligatorio',
    en: 'Required'
  },
  'stepRecommend.removeRecommendation': {
    es: 'Eliminar recomendación',
    en: 'Remove recommendation'
  },

  // Step Restrictions
  'stepRestriction.title': {
    es: 'Restricciones',
    en: 'Restrictions'
  },
  'stepRestriction.description': {
    es: 'Define las restricciones y limitaciones de la actividad',
    en: 'Define the restrictions and limitations of the activity'
  },
  'stepRestriction.restrictions.label': {
    es: '¿Qué restricciones tiene la actividad?',
    en: 'What restrictions does the activity have?'
  },
  'stepRestriction.restrictions.instructions': {
    es: 'Agrega restricciones importantes como edad mínima, requisitos de salud, limitaciones físicas, etc. (opcional, máximo 100 caracteres por restricción).',
    en: 'Add important restrictions such as minimum age, health requirements, physical limitations, etc. (optional, maximum 100 characters per restriction).'
  },
  'stepRestriction.restrictions.placeholder': {
    es: 'Ej: Edad mínima 12 años',
    en: 'Ex: Minimum age 12 years'
  },
  'stepRestriction.addRestriction': {
    es: 'Agregar restricción',
    en: 'Add restriction'
  },
  'stepRestriction.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepRestriction.error.minimumThreeRequired': {
    es: 'Las restricciones son opcionales, pero si las agregas deben tener contenido válido',
    en: 'Restrictions are optional, but if you add them they must have valid content'
  },
  'stepRestriction.error.emptyRestrictionsNotAllowed': {
    es: 'No se permiten restricciones vacías. Completa o elimina las restricciones vacías antes de continuar.',
    en: 'Empty restrictions are not allowed. Complete or remove empty restrictions before continuing.'
  },
  'stepRestriction.error.emptyNotAllowed': {
    es: 'No se permite campo vacío',
    en: 'Empty field not allowed'
  },
  'stepRestriction.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepRestriction.required': {
    es: 'Obligatorio',
    en: 'Required'
  },
  'stepRestriction.removeRestriction': {
    es: 'Eliminar restricción',
    en: 'Remove restriction'
  },
  'stepRestriction.noRestrictions': {
    es: 'No hay restricciones agregadas. Haz clic en "Agregar restricción" si deseas agregar alguna.',
    en: 'No restrictions added. Click "Add restriction" if you want to add any.'
  },

  // Step Include
  'stepInclude.title': {
    es: 'Incluido',
    en: 'Included'
  },
  'stepInclude.description': {
    es: 'Define qué está incluido en tu actividad',
    en: 'Define what is included in your activity'
  },
  'stepInclude.inclusions.label': {
    es: '¿Qué está incluido en la actividad?',
    en: 'What is included in the activity?'
  },
  'stepInclude.inclusions.instructions': {
    es: 'Agrega al menos 3 elementos que estén incluidos en tu actividad como transporte, guía, entradas, etc. (máximo 100 caracteres por inclusión).',
    en: 'Add at least 3 elements that are included in your activity such as transportation, guide, tickets, etc. (maximum 100 characters per inclusion).'
  },
  'stepInclude.inclusions.placeholder': {
    es: 'Ej: Transporte desde el hotel',
    en: 'Ex: Transportation from hotel'
  },
  'stepInclude.addInclusion': {
    es: 'Agregar inclusión',
    en: 'Add inclusion'
  },
  'stepInclude.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepInclude.error.minimumThreeRequired': {
    es: 'Debe agregar al menos 3 inclusiones',
    en: 'You must add at least 3 inclusions'
  },
  'stepInclude.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepInclude.required': {
    es: 'Obligatorio',
    en: 'Required'
  },
  'stepInclude.removeInclusion': {
    es: 'Eliminar inclusión',
    en: 'Remove inclusion'
  },

  // Step Not Include
  'stepNotInclude.title': {
    es: 'No Incluido',
    en: 'Not Included'
  },
  'stepNotInclude.description': {
    es: 'Define qué NO está incluido en tu actividad (opcional)',
    en: 'Define what is NOT included in your activity (optional)'
  },
  'stepNotInclude.exclusions.label': {
    es: '¿Qué NO está incluido en la actividad?',
    en: 'What is NOT included in the activity?'
  },
  'stepNotInclude.exclusions.instructions': {
    es: 'Agrega elementos que NO estén incluidos en tu actividad como comidas, transporte de regreso, propinas, etc. (máximo 100 caracteres por exclusión). Este paso es opcional.',
    en: 'Add elements that are NOT included in your activity such as meals, return transportation, tips, etc. (maximum 100 characters per exclusion). This step is optional.'
  },
  'stepNotInclude.exclusions.placeholder': {
    es: 'Ej: Comidas no incluidas',
    en: 'Ex: Meals not included'
  },
  'stepNotInclude.addExclusion': {
    es: 'Agregar exclusión',
    en: 'Add exclusion'
  },
  'stepNotInclude.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepNotInclude.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepNotInclude.error.emptyExclusionsNotAllowed': {
    es: 'No se permiten exclusiones vacías. Completa o elimina las exclusiones vacías antes de continuar.',
    en: 'Empty exclusions are not allowed. Complete or remove empty exclusions before continuing.'
  },
  'stepNotInclude.removeExclusion': {
    es: 'Eliminar exclusión',
    en: 'Remove exclusion'
  },

  // Step Images
  'stepImages.title': {
    es: 'Añade fotos a tu actividad',
    en: 'Add photos to your activity'
  },
  'stepImages.description': {
    es: 'Las imágenes ayudan a los clientes a visualizar la actividad y gestionar las expectativas sobre multitudes, tamaño del grupo, tipos de vehículos, etc.',
    en: 'Images help customers visualize the activity and manage expectations about crowds, group size, vehicle types, etc.'
  },
  'stepImages.requirements.title': {
    es: 'Requisitos',
    en: 'Requirements'
  },
  'stepImages.requirements.allowed': {
    es: 'Permitido',
    en: 'Allowed'
  },
  'stepImages.requirements.minWidth': {
    es: 'Imágenes apaisadas con ancho mínimo de 1280 píxeles',
    en: 'Landscape images with minimum width of 1280 pixels'
  },
  'stepImages.requirements.fileTypes': {
    es: 'Tipos de archivo: JPG, JPEG, PNG, GIF o WebP',
    en: 'File types: JPG, JPEG, PNG, GIF or WebP'
  },
  'stepImages.requirements.maxSize': {
    es: 'Tamaño máximo de archivo: 7 MB',
    en: 'Maximum file size: 7 MB'
  },
  'stepImages.requirements.prohibited': {
    es: 'Prohibido',
    en: 'Prohibited'
  },
  'stepImages.requirements.noUpsideDown': {
    es: 'No imágenes al revés, oscuras, irrelevantes u ofensivas',
    en: 'No upside-down, dark, irrelevant or offensive images'
  },
  'stepImages.requirements.noWatermarks': {
    es: 'No marcas de agua de fotógrafos, logotipos o matrículas legibles',
    en: 'No photographer watermarks, logos or legible license plates'
  },
  'stepImages.requirements.noAI': {
    es: 'Evitar imágenes generadas por IA, fotos de mapas impresos o itinerarios de autobús con marcas visibles',
    en: 'Avoid AI-generated images, photos of printed maps or bus itineraries with visible brands'
  },
  'stepImages.examples.title': {
    es: 'Consejos',
    en: 'Tips'
  },
  'stepImages.examples.description': {
    es: 'Elige fotos coloridas, brillantes y centradas que cuenten una historia. Necesitas al menos 3 imágenes, pero trata de añadir de 7 a 10. Coloca las mejores al principio.',
    en: 'Choose colorful, bright and centered photos that tell a story. You need at least 3 images, but try to add 7 to 10. Place the best ones first.'
  },
  'stepImages.upload.instructions': {
    es: 'Arrastra tus fotos a la zona de abajo o selecciona "Subir fotos". Para cambiar el orden de las imágenes, selecciona la imagen que quieras reordenar y utiliza las flechas.',
    en: 'Drag your photos to the area below or select "Upload photos". To change the order of the images, select the image you want to reorder and use the arrows.'
  },
  'stepImages.upload.dragText': {
    es: 'Arrastra las fotos aquí',
    en: 'Drag photos here'
  },
  'stepImages.upload.minImages': {
    es: 'Sube al menos 3 fotos',
    en: 'Upload at least 3 photos'
  },
  'stepImages.upload.maxSize': {
    es: 'El tamaño máximo de archivo es de 7 MB',
    en: 'Maximum file size is 7 MB'
  },
  'stepImages.upload.fileTypes': {
    es: 'Tipos de archivo válidos: JPG, JPEG, PNG, GIF y WebP',
    en: 'Valid file types: JPG, JPEG, PNG, GIF and WebP'
  },
  'stepImages.upload.button': {
    es: 'Subir fotos',
    en: 'Upload photos'
  },
  'stepImages.preview.title': {
    es: 'Vista previa de imágenes',
    en: 'Image preview'
  },
  'stepImages.preview.remove': {
    es: 'Eliminar imagen',
    en: 'Remove image'
  },
  'stepImages.preview.moveUp': {
    es: 'Mover hacia arriba',
    en: 'Move up'
  },
  'stepImages.preview.moveDown': {
    es: 'Mover hacia abajo',
    en: 'Move down'
  },
  'stepImages.preview.cover': {
    es: 'Portada',
    en: 'Cover'
  },
  'stepImages.preview.minimumRequired': {
    es: 'Mínimo 3 requeridas',
    en: 'Minimum 3 required'
  },
  'stepImages.upload.maxReached': {
    es: 'Máximo de 5 imágenes alcanzado',
    en: 'Maximum of 5 images reached'
  },
  'stepImages.saveAndExit': {
    es: 'Guardar y salir',
    en: 'Save and exit'
  },
  'stepImages.uploading': {
    es: 'Subiendo...',
    en: 'Uploading...'
  },
  'stepImages.error.minimumThreeRequired': {
    es: 'Debe subir al menos 3 imágenes para continuar',
    en: 'You must upload at least 3 images to continue'
  },
  'stepImages.error.minWidth': {
    es: 'La imagen debe tener un ancho mínimo de 1280 píxeles',
    en: 'Image must have a minimum width of 1280 pixels'
  },
  'stepImages.error.fileSize': {
    es: 'El archivo excede el tamaño máximo de 7 MB',
    en: 'File exceeds maximum size of 7 MB'
  },
  'stepImages.error.fileType': {
    es: 'Tipo de archivo no válido. Solo se permiten JPG, JPEG, PNG, GIF y WebP',
    en: 'Invalid file type. Only JPG, JPEG, PNG, GIF and WebP are allowed'
  },
  'stepImages.error.maxImages': {
    es: 'No puede subir más de 5 imágenes',
    en: 'You cannot upload more than 5 images'
  },
  'stepImages.error.invalidImage': {
    es: 'Archivo de imagen no válido',
    en: 'Invalid image file'
  },
  'stepImages.error.uploadFailed': {
    es: 'Error al subir las imágenes. Por favor, inténtelo de nuevo.',
    en: 'Error uploading images. Please try again.'
  },
  'stepImages.error.saveFailed': {
    es: 'Error al guardar. Por favor, inténtelo de nuevo.',
    en: 'Error saving. Please try again.'
  },
  'stepImages.error.firebaseUpload': {
    es: 'Error al subir imágenes a Firebase. Verifica tu conexión e inténtalo de nuevo.',
    en: 'Error uploading images to Firebase. Check your connection and try again.'
  },
  'stepImages.error.network': {
    es: 'Error de conexión. Verifica tu internet e inténtalo de nuevo.',
    en: 'Connection error. Check your internet and try again.'
  },
  'stepImages.error.validationFailed': {
    es: 'Error de validación de imagen',
    en: 'Image validation error'
  },
  'stepImages.error.fileSelectionFailed': {
    es: 'Error al procesar la selección de archivos',
    en: 'Error processing file selection'
  },

  // Step Options
  'stepOptions.title': { es: 'Opciones de reserva', en: 'Booking options' },
  'stepOptions.description': { es: 'Configura las opciones de reserva para tu actividad', en: 'Configure booking options for your activity' },
  'stepOptions.placeholder.title': { es: 'Paso en desarrollo', en: 'Step in development' },
  'stepOptions.placeholder.description': { es: 'Este paso será implementado próximamente. Aquí podrás configurar las opciones de reserva, precios, horarios y más.', en: 'This step will be implemented soon. Here you will be able to configure booking options, prices, schedules and more.' },
  'stepOptions.saveAndExit': { es: 'Guardar y salir', en: 'Save and exit' },
  'stepOptions.examples.intro': { es: 'Las opciones te permiten personalizar tu actividad y atraer a más clientes. Por ejemplo, tus opciones pueden tener diferentes:', en: 'Options allow you to customize your activity and attract more customers. For example, your options can have different:' },
  'stepOptions.examples.duration': { es: 'Duraciones (1 o 2 horas)', en: 'Durations (1 or 2 hours)' },
  'stepOptions.examples.groupSize': { es: 'Tamaños de grupo (10 o 20 personas) o modalidades (privadas o públicas)', en: 'Group sizes (10 or 20 people) or modalities (private or public)' },
  'stepOptions.examples.language': { es: 'Idiomas (inglés o español)', en: 'Languages (English or Spanish)' },
  'stepOptions.examples.inclusions': { es: 'Inclusiones (con o sin almuerzo)', en: 'Inclusions (with or without lunch)' },
  'stepOptions.examples.startType': { es: 'Formas de comenzar la actividad (en un punto de encuentro o con recogida en el hotel)', en: 'Ways to start the activity (at a meeting point or with hotel pickup)' },
  'stepOptions.explanation': { es: 'La opción es donde se almacenan los precios y la disponibilidad y donde se hacen las reservas. Necesitarás al menos una opción por actividad para empezar a recibir reservas.', en: 'The option is where prices and availability are stored and where bookings are made. You will need at least one option per activity to start receiving bookings.' },
  'stepOptions.createNewOption': { es: 'Crear nueva opción', en: 'Create new option' },
  'stepOptions.createForm.title': { es: 'Crear nueva opción de reserva', en: 'Create new booking option' },
  'stepOptions.createForm.titleLabel': { es: 'Título de la opción', en: 'Option title' },
  'stepOptions.createForm.titlePlaceholder': { es: 'Ej: Tour básico, Tour premium', en: 'Ex: Basic tour, Premium tour' },
  'stepOptions.createForm.durationLabel': { es: 'Duración', en: 'Duration' },
  'stepOptions.createForm.durationPlaceholder': { es: 'Ej: 2 horas, 1 día', en: 'Ex: 2 hours, 1 day' },
  'stepOptions.createForm.groupSizeLabel': { es: 'Tamaño del grupo', en: 'Group size' },
  'stepOptions.createForm.groupSizePlaceholder': { es: 'Ej: 10 personas, Privado', en: 'Ex: 10 people, Private' },
  'stepOptions.createForm.languageLabel': { es: 'Idioma', en: 'Language' },
  'stepOptions.createForm.languagePlaceholder': { es: 'Ej: Español, Inglés', en: 'Ex: Spanish, English' },
  'stepOptions.createForm.startTypeLabel': { es: 'Tipo de inicio', en: 'Start type' },
  'stepOptions.createForm.startTypePlaceholder': { es: 'Ej: Punto de encuentro, Recogida en hotel', en: 'Ex: Meeting point, Hotel pickup' },
  'stepOptions.createForm.priceLabel': { es: 'Precio', en: 'Price' },
  'stepOptions.createForm.pricePlaceholder': { es: '0.00', en: '0.00' },
  'stepOptions.createForm.create': { es: 'Crear opción', en: 'Create option' },
  'stepOptions.createForm.cancel': { es: 'Cancelar', en: 'Cancel' },
  'stepOptions.existingOptions': { es: 'Opciones existentes', en: 'Existing options' },
  'stepOptions.noOptions': { es: 'No hay opciones creadas. Crea tu primera opción para continuar.', en: 'No options created. Create your first option to continue.' },
  'stepOptions.actions.activate': { es: 'Activar opción', en: 'Activate option' },
  'stepOptions.actions.deactivate': { es: 'Desactivar opción', en: 'Deactivate option' },
  'stepOptions.actions.delete': { es: 'Eliminar opción', en: 'Delete option' },
  'stepOptions.actions.edit': { es: 'Editar opción', en: 'Edit option' },
  'stepOptions.warning.activeOption': { es: 'No se puede crear una nueva opción mientras hay una opción activa. Desactiva la opción actual para crear una nueva.', en: 'Cannot create a new option while there is an active option. Deactivate the current option to create a new one.' },
  'stepOptions.button.disabledTitle': { es: 'No se puede crear una nueva opción mientras hay una opción activa', en: 'Cannot create a new option while there is an active option' },
  'stepOptions.button.enabledTitle': { es: 'Crear nueva opción de reserva', en: 'Create new booking option' },

  // Create Option Modal
  'createOptionModal.title': { es: 'Crear nueva opción', en: 'Create new option' },
  'createOptionModal.instructions.help': { es: 'Consulta estas instrucciones si necesitas ayuda para crear tu opción.', en: 'Consult these instructions if you need help creating your option.' },
  'createOptionModal.instructions.format': { es: 'Los títulos de las opciones deben seguir el mismo formato para que los clientes puedan distinguirlos fácilmente, p. ej.: Visita guiada en inglés, Visita guiada en español, etc.', en: 'Option titles must follow the same format so that customers can easily distinguish them, e.g.: Guided tour in English, Guided tour in Spanish, etc.' },
  'createOptionModal.instructions.edit': { es: 'Recuerda editar los títulos de las opciones existentes si estás añadiendo opciones nuevas.', en: 'Remember to edit the titles of existing options if you are adding new ones.' },
  'createOptionModal.radio.newOption': { es: 'Crear nueva opción', en: 'Create new option' },
  'createOptionModal.radio.useTemplate': { es: 'Usa la opción existente como plantilla:', en: 'Use existing option as template:' },
  'createOptionModal.template.select': { es: 'Seleccionar opción existente', en: 'Select existing option' },
  'createOptionModal.template.noOptions': { es: 'No hay opciones existentes', en: 'No existing options' },
  'createOptionModal.cancel': { es: 'Cancelar', en: 'Cancel' },
  'createOptionModal.create': { es: 'Crear opción', en: 'Create option' },

  // Step Option Setup
  'stepOptionSetup.backToProduct': { es: 'Volver a la actividad', en: 'Back to activity' },
  
  // Option Setup Sidebar
  'optionSetup.backToProduct': { es: 'Volver a la actividad', en: 'Back to activity' },
  'optionSetup.menu.newOption': { es: 'Nueva opción', en: 'New option' },
  'optionSetup.menu.optionSettings': { es: 'Ajustes de la opción', en: 'Option settings' },
  'optionSetup.menu.meetingPickup': { es: 'Encuentro o recogida', en: 'Meeting or pickup' },
  'optionSetup.menu.availabilityPricing': { es: 'Disponibilidad y precios', en: 'Availability and prices' },
  'optionSetup.menu.timeLimit': { es: 'Horario límite', en: 'Time limit' },
  'stepOptionSetup.referenceCode.title': { es: 'Código de referencia de la opción (opcional)', en: 'Option reference code (optional)' },
  'stepOptionSetup.referenceCode.placeholder': { es: 'Ingresa código de referencia', en: 'Enter reference code' },
  'stepOptionSetup.referenceCode.description': { es: 'Indica un código de referencia para distinguir qué opción ha reservado el cliente. Esto es para tus propios registros y no lo verá el cliente.', en: 'Indicates a reference code to distinguish which option the client has reserved. This is for your own records and the client will not see it.' },
  'stepOptionSetup.maxGroupSize.title': { es: 'Tamaño máximo del grupo', en: 'Maximum group size' },
  'stepOptionSetup.maxGroupSize.description': { es: '¿Cuál es el número máximo de participantes en tu actividad para cada franja horaria? Esto también incluye a aquellos que no reservan directamente contigo.', en: 'What is the maximum number of participants in your activity for each time slot? This also includes those who do not book directly with you.' },
  'stepOptionSetup.optionConfig.title': { es: 'Configuración de opciones', en: 'Option configuration' },
  'stepOptionSetup.languages.title': { es: '¿Qué idiomas habla el guía o anfitrión durante la actividad?', en: 'What languages does the guide or host speak during the activity?' },
  'stepOptionSetup.languages.instructions': { es: 'Elige todos los que correspondan', en: 'Choose all that apply' },
  'stepOptionSetup.languages.search': { es: 'Buscar idioma', en: 'Search language' },
  'stepOptionSetup.guideMaterials.title': { es: 'Añadir materiales de guía (opcional)', en: 'Add guide materials (optional)' },
  'stepOptionSetup.guideMaterials.label': { es: 'Incluir materiales de guía', en: 'Include guide materials' },
  'stepOptionSetup.privateActivity.title': { es: '¿Se trata de una actividad privada?', en: 'Is this a private activity?' },
  'stepOptionSetup.privateActivity.description': { es: 'Esto significa que solo puede participar un grupo o una persona. No habrá otros clientes en la misma actividad.', en: 'This means only one group or person can participate. There will be no other clients in the same activity.' },
  'stepOptionSetup.privateActivity.no': { es: 'No', en: 'No' },
  'stepOptionSetup.privateActivity.yes': { es: 'Sí', en: 'Yes' },
  'stepOptionSetup.skipLines.title': { es: '¿Evitará el cliente las colas para entrar? Si es así, ¿qué cola?', en: 'Will the client skip the lines to enter? If so, which line?' },
  'stepOptionSetup.skipLines.no': { es: 'No', en: 'No' },
  'stepOptionSetup.skipLines.yes': { es: 'Sí', en: 'Yes' },
  'stepOptionSetup.skipLines.selectType': { es: 'Seleccionar tipo de cola', en: 'Select queue type' },
  'stepOptionSetup.skipLines.tickets': { es: 'Sin colas para obtener tickets', en: 'No lines to get tickets' },
  'stepOptionSetup.skipLines.entrance': { es: 'Sin colas para entrar', en: 'No lines to enter' },
  'stepOptionSetup.skipLines.security': { es: 'Sin colas de seguridad', en: 'No security lines' },
  'stepOptionSetup.wheelchair.title': { es: '¿La actividad es accesible en silla de ruedas?', en: 'Is the activity wheelchair accessible?' },
  'stepOptionSetup.wheelchair.no': { es: 'No', en: 'No' },
  'stepOptionSetup.wheelchair.yes': { es: 'Sí', en: 'Yes' },
  'stepOptionSetup.duration.title': { es: 'Duración o validez', en: 'Duration or validity' },
  'stepOptionSetup.duration.description': { es: 'Algunas actividades empiezan y terminan a horas concretas, como un tour. Otras permiten a los clientes utilizar su ticket en cualquier momento dentro de un plazo determinado, como un pase de 2 días para una ciudad.', en: 'Some activities start and end at specific times, like a tour. Others allow clients to use their ticket at any time within a determined period, like a 2-day city pass.' },
  'stepOptionSetup.duration.question': { es: '¿Qué opción describe mejor tu actividad?', en: 'Which option best describes your activity?' },
  'stepOptionSetup.duration.type.duration': { es: 'Dura un tiempo determinado (duración). Incluye el tiempo de traslado. Ejemplo: tour guiado de 3 horas', en: 'Lasts a determined time (duration). Includes transfer time. Example: 3-hour guided tour' },
  'stepOptionSetup.duration.type.validity': { es: 'Los clientes pueden utilizar su ticket en cualquier momento durante un periodo determinado (validez). Ejemplo: tickets de entrada para museos que pueden utilizarse en cualquier momento durante el horario de apertura', en: 'Clients can use their ticket at any time during a determined period (validity). Example: museum entrance tickets that can be used at any time during opening hours' },
  'stepOptionSetup.loading': { es: 'Cargando configuración de la opción...', en: 'Loading option configuration...' },
  'stepOptionSetup.optionId': { es: 'ID de la opción', en: 'Option ID' },

  // Step Itinerary
  'stepItinerary.title': { es: 'Creador de itinerarios', en: 'Itinerary creator' },
  'stepItinerary.description': { es: 'Crea el itinerario detallado de tu actividad', en: 'Create the detailed itinerary for your activity' },
  'stepItinerary.welcome.title': { es: 'Bienvenido a nuestro nuevo creador de itinerarios.', en: 'Welcome to our new itinerary creator.' },
  'stepItinerary.welcome.description1': { es: 'Un itinerario visual muestra a los clientes exactamente dónde irán y qué harán durante la actividad.', en: 'A visual itinerary shows clients exactly where they will go and what they will do during the activity.' },
  'stepItinerary.welcome.description2': { es: 'Son rápidos y fáciles de configurar y las actividades que los incluyen reciben hasta un 25% más de reservas ¡Eso significa más clientes y más dinero en tu bolsillo!', en: 'They are quick and easy to configure, and activities that include them receive up to 25% more bookings! That means more clients and more money in your pocket!' },
  'stepItinerary.welcome.description3': { es: 'Esta es nuestra primera versión, pero vendrán más. Estamos mejorando nuestro creador de itinerarios continuamente.', en: 'This is our first version, but more will come. We are continuously improving our itinerary creator.' },
  'stepItinerary.welcome.description4': { es: 'Gracias, y ¡a crear se ha dicho!', en: 'Thank you, and let\'s get creating!' },
  'stepItinerary.createItinerary': { es: 'Crear itinerario', en: 'Create itinerary' },
  'stepItinerary.continueCreatingItinerary': { es: 'Seguir creando itinerario', en: 'Continue creating itinerary' },
  'stepItinerary.typeSelection.title': { es: '¿Qué pasa después?', en: 'What happens next?' },
  'stepItinerary.typeSelection.activity.title': { es: 'Una actividad (la razón por la que alguien compraría esta experiencia)', en: 'An activity (the reason why someone would buy this experience)' },
  'stepItinerary.typeSelection.activity.description': { es: 'La razón por la que alguien compraría esta experiencia', en: 'The reason why someone would buy this experience' },
  'stepItinerary.typeSelection.transfer.title': { es: 'Un traslado (transporte a los puntos destacados de la experiencia)', en: 'A transfer (transport to the highlights of the experience)' },
  'stepItinerary.typeSelection.transfer.description': { es: 'Transporte a los puntos destacados de la experiencia', en: 'Transport to the highlights of the experience' },
  'stepItinerary.continueCreating': { es: 'Seguir creando', en: 'Continue creating' },
  'stepItinerary.example.title': { es: 'Ejemplo de cómo ven los clientes un itinerario visual.', en: 'Example of how clients see a visual itinerary.' },
  'stepItinerary.day.title': { es: 'Día {dayNumber}', en: 'Day {dayNumber}' },
  'stepItinerary.day.titlePlaceholder': { es: 'Ej: Lugar de recojo: Edinburgh', en: 'Ex: Pickup location: Edinburgh' },
  'stepItinerary.day.descriptionPlaceholder': { es: 'Ej: Bus ride (1h30min)', en: 'Ex: Bus ride (1h30min)' },
  'stepItinerary.addDay': { es: 'Añadir día', en: 'Add day' },
  'stepItinerary.removeDay': { es: 'Eliminar día', en: 'Remove day' },
  'stepItinerary.noDays': { es: 'No hay días agregados al itinerario. Haz clic en "Añadir día" para comenzar.', en: 'No days added to the itinerary. Click "Add day" to start.' },
  'stepItinerary.saveAndExit': { es: 'Guardar y salir', en: 'Save and exit' },
  'stepItinerary.addActivity': { es: 'Añadir actividad', en: 'Add activity' },
  'stepItinerary.addTransfer': { es: 'Añadir traslado', en: 'Add transfer' },
  'stepItinerary.activityType.title': { es: '¿Qué sucede durante esta parte de la experiencia?', en: 'What happens during this part of the experience?' },
  'stepItinerary.activityType.instructions': { es: 'Indica lo que sucede durante esta parte de tu experiencia en la barra de búsqueda a continuación.', en: 'Indicate what happens during this part of your experience in the search bar below.' },
  'stepItinerary.activityType.placeholder': { es: 'Introduce la actividad aquí', en: 'Enter the activity here' },
  'stepItinerary.activityType.selectFromList': { es: '• Seleccionar de la lista', en: '• Select from the list' },
  'stepItinerary.activityType.class': { es: 'Clase', en: 'Class' },
  'stepItinerary.activityType.safetyInfo': { es: 'Información de seguridad', en: 'Safety information' },
  'stepItinerary.activityType.selfGuidedTour': { es: 'Tour autoguiado', en: 'Self-guided tour' },
  'stepItinerary.activityType.overnightStay': { es: 'Pernoctación', en: 'Overnight stay' },
  'stepItinerary.activityType.stopovers': { es: 'Lugares de paso', en: 'Places of passage' },
  'stepItinerary.location.title': { es: '¿Dónde tiene lugar esta parte de tu experiencia?', en: 'Where does this part of your experience take place?' },
  'stepItinerary.location.instructions': { es: 'Selecciona una de las ubicaciones etiquetadas en tu experiencia de la siguiente lista o utiliza una ubicación no específica.', en: 'Select one of the tagged locations in your experience from the following list or use a non-specific location.' },
  'stepItinerary.location.placeholder': { es: 'Selecciona una ubicación', en: 'Select a location' },
  'stepItinerary.duration.title': { es: '¿Cuánto dura esta parte de la experiencia?', en: 'How long does this part of the experience last?' },
  'stepItinerary.duration.instructions': { es: 'Añade una duración para esta parte de la experiencia. También puedes omitir este paso si no quieres mostrar una duración para este segmento del itinerario (por ejemplo, atracciones por las que pasas con un vehículo en movimiento, etc.).', en: 'Add a duration for this part of the experience. You can also skip this step if you don\'t want to show a duration for this segment of the itinerary (for example, attractions you pass by in a moving vehicle, etc.).' },
  'stepItinerary.duration.hours': { es: 'Horas', en: 'Hours' },
  'stepItinerary.duration.minutes': { es: 'Minutos', en: 'Minutes' },
  'stepItinerary.vehicleType.title': { es: '¿Qué tipo de vehículo se utiliza para el traslado?', en: 'What type of vehicle is used for the transfer?' },
  'stepItinerary.vehicleType.instructions': { es: 'Añade el tipo de vehículo utilizado para el traslado en la barra de búsqueda.', en: 'Add the type of vehicle used for the transfer in the search bar.' },
  'stepItinerary.vehicleType.placeholder': { es: 'Elige el tipo de vehículo aquí.', en: 'Choose the type of vehicle here.' },
  'stepItinerary.next': { es: 'Siguiente', en: 'Next' },
  'stepItinerary.back': { es: 'Atrás', en: 'Back' },
  'stepItinerary.skip': { es: 'Saltar y publicar', en: 'Skip and publish' },
  'stepItinerary.publish': { es: 'Publicar', en: 'Publish' },
  'stepItinerary.close': { es: 'Cerrar', en: 'Close' },
  'stepItinerary.visualTimeline': { es: 'Itinerario visual', en: 'Visual itinerary' },
  'stepItinerary.itinerarySummary': { es: 'Resumen del Itinerario', en: 'Itinerary Summary' },

  // Activity Creation Layout
  'activityCreation.navigation.title': {
    es: 'Proceso de creación',
    en: 'Creation process'
  },
  'activityCreation.steps.category': {
    es: 'Categoría',
    en: 'Category'
  },
  'activityCreation.steps.title': {
    es: 'Titulo',
    en: 'Title'
  },
  'activityCreation.steps.description': {
    es: 'Descripcion',
    en: 'Description'
  },
  'activityCreation.steps.recommendations': {
    es: 'Recomendaciones',
    en: 'Recommendations'
  },
  'activityCreation.steps.restrictions': {
    es: 'Restricciones',
    en: 'Restrictions'
  },
  'activityCreation.steps.included': {
    es: 'Incluido',
    en: 'Included'
  },
  'activityCreation.steps.not_included': {
    es: 'No incluido',
    en: 'Not included'
  },
  'activityCreation.steps.images': {
    es: 'Imagenes',
    en: 'Images'
  },
  'activityCreation.steps.options': {
    es: 'Opciones',
    en: 'Options'
  },
  'activityCreation.steps.itinerary': {
    es: 'Itinerario',
    en: 'Itinerary'
  },
  'activityCreation.steps.itineraries': {
    es: 'Itinerarios',
    en: 'Itineraries'
  },

  // Google Maps Modal
  'googleMaps.title': { es: 'Seleccionar Ubicación', en: 'Select Location' },
  'googleMaps.search.label': { es: 'Buscar ubicación en {city} y alrededores:', en: 'Search for location in {city} and surroundings:' },
  'googleMaps.search.placeholder': { es: 'Escribe para buscar lugares...', en: 'Type to search for places...' },
  'googleMaps.search.placeholderZone': { es: 'Escribe para buscar zonas/barrios...', en: 'Type to search for zones/neighborhoods...' },
  'googleMaps.search.placeholderAddress': { es: 'Escribe para buscar direcciones...', en: 'Type to search for addresses...' },
  'googleMaps.search.radius': { es: 'Radio', en: 'Radius' },
  'googleMaps.search.adjustRadius': { es: 'Ajustar radio de búsqueda:', en: 'Adjust search radius:' },
  'googleMaps.search.currentRadius': { es: 'Radio actual: {radius}km desde el centro de {city}', en: 'Current radius: {radius}km from the center of {city}' },
  'googleMaps.search.filtering': { es: 'Filtrando por radio...', en: 'Filtering by radius...' },
  'googleMaps.search.searching': { es: 'Buscando...', en: 'Searching...' },
  'googleMaps.search.noResults': { es: 'No se encontraron lugares dentro del radio de {radius}km desde {city}', en: 'No places found within {radius}km radius from {city}' },
  'googleMaps.search.noResultsGeneric': { es: 'No se encontraron lugares', en: 'No places found' },
  'googleMaps.search.tryExpand': { es: 'Intenta ampliar el radio de búsqueda o usar términos más específicos', en: 'Try expanding the search radius or using more specific terms' },
  'googleMaps.search.distanceFrom': { es: '{distance}km desde {city}', en: '{distance}km from {city}' },
  'googleMaps.tip.withRadius': { es: 'Las búsquedas se limitan a un radio de {radius}km desde {city}. Solo se muestran lugares dentro del radio especificado. Puedes ajustar el radio con el control deslizante.', en: 'Searches are limited to a {radius}km radius from {city}. Only places within the specified radius are shown. You can adjust the radius with the slider.' },
  'googleMaps.tip.withoutRadius': { es: 'Escribe nombres de lugares, calles o establecimientos. Las sugerencias aparecerán automáticamente.', en: 'Type names of places, streets or establishments. Suggestions will appear automatically.' },
  'googleMaps.buttons.cancel': { es: 'Cancelar', en: 'Cancel' },
  'googleMaps.buttons.saveLocation': { es: 'Guardar Ubicación', en: 'Save Location' },
  'googleMaps.buttons.addAddress': { es: 'Añadir dirección', en: 'Add address' },
  'googleMaps.buttons.selectOnMap': { es: 'Seleccionar en mapa', en: 'Select on map' },
  'googleMaps.loading': { es: 'Cargando...', en: 'Loading...' },
  'googleMaps.error.selectLocation': { es: 'Por favor, selecciona una ubicación primero.', en: 'Please select a location first.' },
  'googleMaps.error.apiKey': { es: 'Error: API Key de Google Maps no configurada. Contacta al administrador.', en: 'Error: Google Maps API Key not configured. Contact the administrator.' },
  'googleMaps.error.loading': { es: 'Error al cargar Google Maps. Por favor, recarga la página.', en: 'Error loading Google Maps. Please reload the page.' },

  // Step Option Meeting Pickup
  'stepMeetingPickup.title': { es: 'Encuentro o recogida', en: 'Meeting or pickup' },
  'stepMeetingPickup.howToArrive': { es: '¿Cómo llegan los clientes a la actividad?', en: 'How do clients arrive at the activity?' },
  'stepMeetingPickup.description': { es: 'Configura cómo los clientes llegarán a tu actividad', en: 'Configure how clients will arrive at your activity' },
  'stepMeetingPickup.arrivalMethod.title': { es: 'Método de llegada', en: 'Arrival method' },
  'stepMeetingPickup.arrivalMethod.description': { es: 'Describe el punto de encuentro (opcional)', en: 'Describe the meeting point (optional)' },
  'stepMeetingPickup.arrivalMethod.meetingPoint': { es: 'Punto de encuentro', en: 'Meeting point' },
  'stepMeetingPickup.arrivalMethod.pickupService': { es: 'Servicio de recojo', en: 'Pickup service' },
  'stepMeetingPickup.meetingPoint.title': { es: 'Punto de encuentro', en: 'Meeting point' },
  'stepMeetingPickup.meetingPoint.description': { es: 'Especifica dónde se reunirán los clientes para comenzar la actividad.', en: 'Specify where clients will meet to start the activity.' },
  'stepMeetingPickup.meetingPoint.addAddress': { es: 'Añadir dirección del punto de encuentro', en: 'Add meeting point address' },
  'stepMeetingPickup.pickupService.title': { es: 'Servicio de recojo', en: 'Pickup service' },
  'stepMeetingPickup.pickupService.description': { es: '¿Cómo funciona tu servicio de recojo?', en: 'How does your pickup service work?' },
  'stepMeetingPickup.pickupType.title': { es: 'Tipo de recojo', en: 'Pickup type' },
  'stepMeetingPickup.pickupType.zones': { es: 'Zonas', en: 'Zones' },
  'stepMeetingPickup.pickupType.specificPlaces': { es: 'Lugares específicos', en: 'Specific places' },
  'stepMeetingPickup.pickupType.zonesDescription': { es: 'Define zonas generales donde puedes recoger a los clientes.', en: 'Define general zones where you can pick up clients.' },
  'stepMeetingPickup.pickupType.specificPlacesDescription': { es: 'Define lugares específicos donde puedes recoger a los clientes.', en: 'Define specific places where you can pick up clients.' },
  'stepMeetingPickup.pickupAddresses.title': { es: 'Direcciones de recojo', en: 'Pickup addresses' },
  'stepMeetingPickup.pickupAddresses.description': { es: 'Añade las direcciones o zonas donde puedes recoger a los clientes.', en: 'Add the addresses or zones where you can pick up clients.' },
  'stepMeetingPickup.pickupAddresses.added': { es: 'Direcciones de recojo añadidas:', en: 'Added pickup addresses:' },
  'stepMeetingPickup.pickupDescription.title': { es: 'Descripción del servicio de recojo', en: 'Pickup service description' },
  'stepMeetingPickup.pickupDescription.description': { es: 'Explica a los clientes cómo funciona el servicio de recojo.', en: 'Explain to clients how the pickup service works.' },
  'stepMeetingPickup.pickupTiming.title': { es: '¿Cuándo sueles recoger a los clientes?', en: 'When do you usually pick up clients?' },
  'stepMeetingPickup.pickupTiming.description': { es: 'Ten en cuenta que tendrás que comunicar la hora exacta de recojo para cada reserva.', en: 'Keep in mind that you will have to communicate the exact pickup time for each booking.' },
  'stepMeetingPickup.pickupTiming.0-30': { es: 'De 0 a 30 min antes del inicio de la actividad', en: 'From 0 to 30 min before the start of the activity' },
  'stepMeetingPickup.pickupTiming.30-60': { es: 'De 30 a 60 min antes del inicio de la actividad', en: 'From 30 to 60 min before the start of the activity' },
  'stepMeetingPickup.pickupTiming.60-90': { es: 'De 60 a 90 min antes del inicio de la actividad', en: 'From 60 to 90 min before the start of the activity' },
  'stepMeetingPickup.pickupTiming.90-120': { es: 'De 90 a 120 min antes del inicio de la actividad', en: 'From 90 to 120 min before the start of the activity' },
  'stepMeetingPickup.pickupTiming.custom': { es: 'Otro horario personalizado', en: 'Other custom schedule' },
  'stepMeetingPickup.pickupTiming.customLabel': { es: 'Especifica el horario personalizado:', en: 'Specify the custom schedule:' },
  'stepMeetingPickup.pickupTiming.customPlaceholder': { es: 'Ej: 2 horas antes, 45 min antes, etc.', en: 'Ex: 2 hours before, 45 min before, etc.' },
  'stepMeetingPickup.pickupTiming.customHelp': { es: 'Describe cuánto tiempo antes del inicio de la actividad sueles recoger a los clientes.', en: 'Describe how long before the start of the activity you usually pick up clients.' },

  'stepMeetingPickup.transport.title': { es: 'Transporte', en: 'Transport' },
  'stepMeetingPickup.transport.description': { es: '¿Cuál es el medio de transporte utilizado para el servicio de recojo y regreso?', en: 'What is the means of transport used for pickup and return service?' },
  'stepMeetingPickup.transport.car': { es: 'Coche', en: 'Car' },
  'stepMeetingPickup.transport.van': { es: 'Furgoneta', en: 'Van' },
  'stepMeetingPickup.transport.bus': { es: 'Autobús', en: 'Bus' },
  'stepMeetingPickup.transport.minibus': { es: 'Minibús', en: 'Minibus' },
  'stepMeetingPickup.transport.motorcycle': { es: 'Motocicleta', en: 'Motorcycle' },
  'stepMeetingPickup.transport.bicycle': { es: 'Bicicleta', en: 'Bicycle' },
  'stepMeetingPickup.transport.walking': { es: 'A pie', en: 'Walking' },
  'stepMeetingPickup.transport.other': { es: 'Otro', en: 'Other' },
  'stepMeetingPickup.transport.loading': { es: 'Cargando modos de transporte...', en: 'Loading transport modes...' },
  'stepMeetingPickup.transport.error': { es: 'Error al cargar los modos de transporte disponibles. Por favor, recarga la página.', en: 'Error loading available transport modes. Please reload the page.' },
  'stepMeetingPickup.transport.retry': { es: 'Reintentar', en: 'Retry' },
  'stepMeetingPickup.validation.meetingPoint': { es: 'Debes añadir la dirección del punto de encuentro.', en: 'You must add the meeting point address.' },
  'stepMeetingPickup.validation.pickupAddresses': { es: 'Debes añadir al menos una dirección o zona de recojo.', en: 'You must add at least one pickup address or zone.' },
  'stepMeetingPickup.validation.customPickupTiming': { es: 'Debes especificar el horario personalizado de recojo.', en: 'You must specify the custom pickup timing.' },
  'stepMeetingPickup.validation.returnAddresses': { es: 'Debes añadir al menos una dirección de regreso.', en: 'You must add at least one return address.' },
  'stepMeetingPickup.loading.config': { es: 'Cargando configuración del punto de encuentro...', en: 'Loading meeting point configuration...' },
  'stepMeetingPickup.loading.cities': { es: 'Cargando ciudades disponibles...', en: 'Loading available cities...' },
  'stepMeetingPickup.buttons.back': { es: 'Regresar', en: 'Back' },
  'stepMeetingPickup.buttons.continue': { es: 'Continuar', en: 'Continue' },

  // Traducciones adicionales para StepOptionMeetingPickup
  'stepMeetingPickup.arrivalMethod.meetingPoint.description': { es: 'Van a un punto de encuentro establecido', en: 'They go to an established meeting point' },
  'stepMeetingPickup.arrivalMethod.pickupService.description': { es: 'Pueden elegir dónde los recoges entre determinadas zonas o una lista de lugares', en: 'They can choose where you pick them up from specific zones or a list of places' },
  'stepMeetingPickup.originCity.title': { es: 'Ciudad de Origen', en: 'Origin City' },
  'stepMeetingPickup.originCity.description': { es: 'Selecciona la ciudad donde operarás. Esto te permitirá buscar y añadir direcciones o áreas cercanas a dicha ciudad mediante Google Maps.', en: 'Select the city where you will operate. This will allow you to search and add addresses or nearby areas to that city using Google Maps.' },
  'stepMeetingPickup.originCity.label': { es: 'Ciudad donde operas:', en: 'City where you operate:' },
  'stepMeetingPickup.originCity.loading': { es: 'Cargando ciudades...', en: 'Loading cities...' },
  'stepMeetingPickup.originCity.noCities': { es: 'No hay ciudades disponibles', en: 'No cities available' },
  'stepMeetingPickup.originCity.filterInfo': { es: 'Las direcciones y áreas se filtrarán según esta ciudad seleccionada.', en: 'Addresses and areas will be filtered according to this selected city.' },
  'stepMeetingPickup.originCity.retry': { es: 'Reintentar', en: 'Retry' },
  'stepMeetingPickup.originCity.error': { es: 'Error al cargar las ciudades disponibles. Por favor, recarga la página.', en: 'Error loading available cities. Please reload the page.' },
  'stepMeetingPickup.meetingPoint.current': { es: 'Punto de encuentro:', en: 'Meeting point:' },

  // Traducciones para descripción del servicio de recojo (punto de encuentro)
  'stepMeetingPickup.pickupServiceDescription.title': { es: 'Describe tu servicio de recojo', en: 'Describe your pickup service' },
  'stepMeetingPickup.pickupServiceDescription.optional': { es: 'opcional', en: 'optional' },
  'stepMeetingPickup.pickupServiceDescription.description': { es: 'Si tus zonas/lugares de recojo son muy específicos, descríbelos con más detalle.', en: 'If your pickup zones/places are very specific, describe them in more detail.' },
  'stepMeetingPickup.pickupServiceDescription.placeholder': { es: 'Describe los detalles del servicio de recojo...', en: 'Describe the details of the pickup service...' },
  
  // Nuevas traducciones para la descripción del punto de encuentro
  'stepMeetingPickup.meetingPointDescription.title': { es: 'Describe el punto de encuentro', en: 'Describe the meeting point' },
  'stepMeetingPickup.meetingPointDescription.optional': { es: 'opcional', en: 'optional' },
  'stepMeetingPickup.meetingPointDescription.question1': { es: '¿Hay que fijarse en algún punto concreto?', en: 'Is there a specific point to look out for?' },
  'stepMeetingPickup.meetingPointDescription.question2': { es: '¿Cómo reconocerán los clientes al guía?', en: 'How will clients recognize the guide?' },
  'stepMeetingPickup.meetingPointDescription.placeholder': { es: 'Please insert your text in English', en: 'Please insert your text in English' },

  'stepMeetingPickup.pickupDescription.optional': { es: 'Describe tu servicio de recojo (opcional)', en: 'Describe your pickup service (optional)' },
  'stepMeetingPickup.pickupDescription.placeholder': { es: 'Describe los detalles del servicio de recojo...', en: 'Describe the details of the pickup service...' },
  'stepMeetingPickup.pickupDescription.help': { es: 'Si tus zonas/lugares de recojo son muy específicos, descríbelos con más detalle.', en: 'If your pickup zones/places are very specific, describe them in more detail.' },

  // Traducciones para la sección de regreso
  'stepMeetingPickup.return.title': { es: 'Regreso', en: 'Return' },
  'stepMeetingPickup.return.description': { es: '¿Dónde dejas al cliente al final de la actividad?', en: 'Where do you leave the client at the end of the activity?' },
  'stepMeetingPickup.return.samePickup.pickupService': { es: 'En el mismo lugar de la recogida', en: 'At the same pickup location' },
  'stepMeetingPickup.return.samePickup.meetingPoint': { es: 'En el mismo lugar de encuentro', en: 'At the same meeting point' },
  'stepMeetingPickup.return.otherLocation': { es: 'En otro lugar', en: 'At another location' },
  'stepMeetingPickup.return.noReturn': { es: 'No hay servicio de regreso, el cliente se queda en el lugar o destino', en: 'No return service, the client stays at the location or destination' },
  'stepMeetingPickup.return.addAddress.title': { es: 'Añadir dirección de regreso', en: 'Add return address' },
  'stepMeetingPickup.return.addAddress.description': { es: 'Especifica dónde dejas a los clientes al final de la actividad.', en: 'Specify where you leave clients at the end of the activity.' },
  'stepMeetingPickup.return.addresses.added': { es: 'Direcciones de regreso añadidas:', en: 'Added return addresses:' },

  // Traducciones para comunicación de horarios
  'stepMeetingPickup.pickupTimeCommunication.title': { es: '¿Cuándo le comunicas al cliente a qué hora es la recogida?', en: 'When do you inform the client about the pickup time?' },
  'stepMeetingPickup.pickupTimeCommunication.activityStart': { es: 'La recogida será a la hora de inicio de la actividad', en: 'Pickup will be at the start time of the activity' },
  'stepMeetingPickup.pickupTimeCommunication.dayBefore': { es: 'El día anterior a la realización de la actividad', en: 'The day before the activity takes place' },
  'stepMeetingPickup.pickupTimeCommunication.within24h': { es: 'En las 24 horas siguientes a su reserva', en: 'Within 24 hours after their booking' },



  'googleMaps.search.zoneInfo': { es: 'Buscando zonas, barrios y áreas generales', en: 'Searching for zones, neighborhoods and general areas' },
  'googleMaps.search.addressInfo': { es: 'Buscando direcciones y lugares específicos', en: 'Searching for specific addresses and places' },

  // Traducciones adicionales para pickupType
  'stepMeetingPickup.pickupType.zones.description': { es: 'La recogida se realizará en cualquier dirección de las zonas que especifiques', en: 'Pickup will be made at any address in the zones you specify' },
  'stepMeetingPickup.pickupType.specificPlaces.description': { es: 'La recogida se realizará en las direcciones específicas que añadas', en: 'Pickup will be made at the specific addresses you add' },
  'stepMeetingPickup.pickupType.zones.addMessage': { es: 'Añade las zonas en las que ofreces el servicio de recojo', en: 'Add the zones where you offer pickup service' },
  'stepMeetingPickup.pickupType.specificPlaces.addMessage': { es: 'Añade al menos 2 direcciones donde ofreces el servicio de recojo', en: 'Add at least 2 addresses where you offer pickup service' },
  'stepMeetingPickup.pickupType.zones.mapDescription': { es: 'Selecciona las zonas en el mapa donde ofreces el servicio de recojo.', en: 'Select the zones on the map where you offer pickup service.' },
  'stepMeetingPickup.pickupType.zones.added': { es: 'Zonas añadidas:', en: 'Added zones:' },
  'stepMeetingPickup.pickupType.specificPlaces.added': { es: 'Direcciones añadidas:', en: 'Added addresses:' },

  // Step Availability Pricing
  'stepAvailabilityPricing.title': { es: 'Disponibilidad y precios', en: 'Availability and pricing' },
  'stepAvailabilityPricing.description': { es: 'Esto se aplicará a todos los horarios añadidos a esta opción.', en: 'This will apply to all schedules added to this option.' },
  'stepAvailabilityPricing.buttons.back': { es: 'Regresar', en: 'Back' },
  'stepAvailabilityPricing.buttons.continue': { es: 'Continuar', en: 'Continue' },
  
  // Disponibilidad
  'stepAvailabilityPricing.availability.title': { es: '¿Cómo estableces tu disponibilidad?', en: 'How do you establish your availability?' },
  'stepAvailabilityPricing.availability.timeSlots': { es: 'Franjas horarias', en: 'Time slots' },
  'stepAvailabilityPricing.availability.timeSlots.example': { es: 'Ejemplo: tour guiado a pie a partir de las 09:00, las 10:00 y las 14:00', en: 'Example: guided walking tour starting at 09:00, 10:00 and 14:00' },
  'stepAvailabilityPricing.availability.openingHours': { es: 'Horario de apertura', en: 'Opening hours' },
  'stepAvailabilityPricing.availability.openingHours.example': { es: 'Ejemplo: museo abierto de lunes a sábado, entre las 09:00 y las 19:00', en: 'Example: museum open Monday to Saturday, between 09:00 and 19:00' },
  
  // Precios
  'stepAvailabilityPricing.pricing.title': { es: '¿Cómo se fijan los precios?', en: 'How are prices set?' },
  'stepAvailabilityPricing.pricing.perPerson': { es: 'Precio por persona', en: 'Price per person' },
  'stepAvailabilityPricing.pricing.perPerson.description': { es: 'Establece precios diferentes para adultos, jóvenes, niños, etc.', en: 'Set different prices for adults, youth, children, etc.' },
  'stepAvailabilityPricing.pricing.perGroup': { es: 'Precio por grupo/vehículo', en: 'Price per group/vehicle' },
  'stepAvailabilityPricing.pricing.perGroup.description': { es: 'Establece precios diferentes según el tamaño del grupo, el tipo de vehículo, etc.', en: 'Set different prices according to group size, vehicle type, etc.' },
  
  // Botón añadir horario
  'stepAvailabilityPricing.addSchedule': { es: 'Añadir nuevo horario', en: 'Add new schedule' },

  'stepMeetingPickup.meetingPoint.help': { es: 'Selecciona la ubicación exacta donde los clientes deben reunirse para comenzar la actividad.', en: 'Select the exact location where clients should meet to start the activity.' },
  'stepMeetingPickup.meetingPoint.operatingLocation.title': { es: '¿Dónde operará el punto de encuentro?', en: 'Where will the meeting point operate?' },
  'stepMeetingPickup.meetingPoint.operatingLocation.description': { es: 'Selecciona la ubicación donde operará tu punto de encuentro.', en: 'Select the location where your meeting point will operate.' },
  'stepMeetingPickup.meetingPoint.operatingLocation.label': { es: 'Ubicación de operación', en: 'Operating location' },
  'stepMeetingPickup.meetingPoint.operatingLocation.select': { es: 'Selecciona una ubicación', en: 'Select a location' },
  'stepMeetingPickup.meetingPoint.operatingLocation.option1': { es: 'Centro de Lima', en: 'Lima Center' },
  'stepMeetingPickup.meetingPoint.operatingLocation.option2': { es: 'Miraflores', en: 'Miraflores' },
  'stepMeetingPickup.meetingPoint.operatingLocation.option3': { es: 'Barranco', en: 'Barranco' },
  'stepMeetingPickup.meetingPoint.operatingLocation.help': { es: 'Esta ubicación determina dónde operará tu punto de encuentro.', en: 'This location determines where your meeting point will operate.' },

  'stepMeetingPickup.notes.modal.save': { es: 'Guardar', en: 'Save' },
  'stepMeetingPickup.notes.modal.cancel': { es: 'Cancelar', en: 'Cancel' },
  'stepMeetingPickup.notes.modal.placeholder': { es: 'Escribe una nota específica para esta dirección...', en: 'Write a specific note for this address...' },
  'stepMeetingPickup.notes.modal.description': { es: 'Agrega información adicional específica para esta dirección de recojo.', en: 'Add additional information specific to this pickup address.' },
  'stepMeetingPickup.notes.modal.title': { es: 'Nota para la dirección', en: 'Note for address' },
  'stepMeetingPickup.notes.button': { es: 'Agregar/Editar nota', en: 'Add/Edit note' },

  // Step Schedule (Horario)
  'stepSchedule.title': { es: 'Horario', en: 'Schedule' },
  'stepSchedule.name.title': { es: 'Pon un nombre a tu horario', en: 'Give a name to your schedule' },
  'stepSchedule.name.placeholder': { es: 'Por ejemplo, verano, precio de fin de semana...', en: 'For example, summer, weekend price...' },
  'stepSchedule.startDate.title': { es: '¿Cuál es la fecha de inicio de tu actividad?', en: 'What is the start date of your activity?' },
  'stepSchedule.startDate.hasEndDate': { es: 'Mi actividad tiene fecha de fin', en: 'My activity has an end date' },
  'stepSchedule.weeklySchedule.title': { es: 'Horario semanal estándar', en: 'Standard weekly schedule' },
  'stepSchedule.weeklySchedule.createSlots': { es: 'Crear franjas horarias habilitadas', en: 'Create enabled time slots' },
  'stepSchedule.weeklySchedule.monday': { es: 'lunes', en: 'Monday' },
  'stepSchedule.weeklySchedule.tuesday': { es: 'martes', en: 'Tuesday' },
  'stepSchedule.weeklySchedule.wednesday': { es: 'miércoles', en: 'Wednesday' },
  'stepSchedule.weeklySchedule.thursday': { es: 'jueves', en: 'Thursday' },
  'stepSchedule.weeklySchedule.friday': { es: 'viernes', en: 'Friday' },
  'stepSchedule.weeklySchedule.saturday': { es: 'sábado', en: 'Saturday' },
  'stepSchedule.weeklySchedule.sunday': { es: 'domingo', en: 'Sunday' },
  'stepSchedule.weeklySchedule.addTimeSlot': { es: 'Añadir franja horaria', en: 'Add time slot' },
  'stepSchedule.exceptions.title': { es: 'Excepciones (Opcional)', en: 'Exceptions (Optional)' },
  'stepSchedule.exceptions.description': { es: '¿Tienes horarios alternativos? Utiliza esta opción si quieres un horario diferente en un día especial, como Semana Santa o Navidad', en: 'Do you have alternative schedules? Use this option if you want a different schedule on a special day, like Easter or Christmas' },
  'stepSchedule.exceptions.addDate': { es: 'Añadir fecha', en: 'Add date' },
  'stepSchedule.exceptions.descriptionPlaceholder': { es: 'Descripción de la excepción...', en: 'Exception description...' },
  'stepSchedule.buttons.back': { es: 'Volver', en: 'Back' },
  'stepSchedule.buttons.saveAndContinue': { es: 'Guardar y continuar', en: 'Save and continue' },

  // Step Cut Off (Hora límite)
  'stepCutOff.title': { es: 'Establece tu hora límite', en: 'Set your limit time' },
  'stepCutOff.description': { es: 'La hora límite es la última en que aceptas nuevas reservas antes de la hora de inicio o de cierre.', en: 'The limit time is the last time you accept new bookings before the start or end time.' },
  'stepCutOff.learnMore': { es: 'Learn more', en: 'Learn more' },
  'stepCutOff.defaultCutOff.title': { es: '¿Con cuánta antelación dejas de aceptar nuevas reservas? Esta es tu hora límite por defecto.', en: 'How far in advance do you stop accepting new bookings? This is your default limit time.' },
  'stepCutOff.defaultCutOff.example': { es: 'Ejemplo: si la hora de inicio de la actividad es a las 10:00, las reservas se detendrán a las 9:30.', en: 'Example: if the activity start time is 10:00, bookings will stop at 9:30.' },
  'stepCutOff.infoAlert.message': { es: 'Establecer una hora límite más baja puede captar reservas de última hora y aumentar las ventas de tu producto.', en: 'Setting a lower limit time can capture last-minute bookings and increase your product sales.' },
  'stepCutOff.lastMinuteBookings.title': { es: 'Habilitar las reservas de última hora después de la primera reserva (opcional)', en: 'Enable last-minute bookings after the first booking (optional)' },
  'stepCutOff.lastMinuteBookings.description': { es: 'Una vez realizada la primera reserva para una franja horaria, se elimina la hora límite, permitiendo que se hagan más reservas hasta la hora de inicio o de cierre de esa franja horaria.', en: 'Once the first booking for a time slot is made, the limit time is removed, allowing more bookings to be made until the start or end time of that time slot.' },
  'stepCutOff.differentCutOff.title': { es: '¿Quieres que tus franjas horarias tengan horas límite diferentes?', en: 'Do you want your time slots to have different limit times?' },
  'stepCutOff.differentCutOff.no': { es: 'No', en: 'No' },
  'stepCutOff.differentCutOff.yes': { es: 'Sí', en: 'Yes' },
  'stepCutOff.differentCutOff.description': { es: 'Puedes sobrescribir la hora límite que aparece por defecto con otro valor para cada franja horaria.', en: 'You can override the default limit time with a different value for each time slot.' },
  'stepCutOff.timeSlots.title': { es: 'Establece la hora límite para las franjas horarias en las que necesites una configuración diferente', en: 'Set the limit time for time slots where you need a different configuration' },
  'stepCutOff.timeSlots.applyToAll': { es: 'Aplicar a todas', en: 'Apply to all' },
  'stepCutOff.buttons.back': { es: 'Atrás', en: 'Back' },
  'stepCutOff.buttons.saveAndContinue': { es: 'Guardar y continuar', en: 'Save and continue' },

  // Dashboard
  'dashboard.title': {
    es: 'Dashboard',
    en: 'Dashboard'
  },
  'dashboard.welcome': {
    es: 'Bienvenido',
    en: 'Welcome'
  },
  'dashboard.user': {
    es: 'Usuario',
    en: 'User'
  },
  'dashboard.description': {
    es: 'Este es el panel principal del extranet. Aquí podrás gestionar tus actividades, reservas y configuraciones.',
    en: 'This is the main extranet panel. Here you can manage your activities, bookings and settings.'
  },
  'dashboard.stats.activities': {
    es: 'Actividades',
    en: 'Activities'
  },
  'dashboard.stats.activitiesDesc': {
    es: 'Total de actividades',
    en: 'Total activities'
  },
  'dashboard.stats.bookings': {
    es: 'Reservas',
    en: 'Bookings'
  },
  'dashboard.stats.bookingsDesc': {
    es: 'Reservas este mes',
    en: 'Bookings this month'
  },
  'dashboard.stats.revenue': {
    es: 'Ingresos',
    en: 'Revenue'
  },
  'dashboard.stats.revenueDesc': {
    es: 'Ingresos este mes',
    en: 'Revenue this month'
  },
  'dashboard.stats.rating': {
    es: 'Calificación',
    en: 'Rating'
  },
  'dashboard.stats.ratingDesc': {
    es: 'Promedio de reseñas',
    en: 'Average reviews'
  },
  'dashboard.recentActivities.title': {
    es: 'Actividades Recientes',
    en: 'Recent Activities'
  },
  'dashboard.recentActivities.activity': {
    es: 'Actividad',
    en: 'Activity'
  },
  'dashboard.recentActivities.status': {
    es: 'Estado',
    en: 'Status'
  },
  'dashboard.recentActivities.created': {
    es: 'Creada',
    en: 'Created'
  },
  'dashboard.recentActivities.actions': {
    es: 'Acciones',
    en: 'Actions'
  },
  'dashboard.recentActivities.active': {
    es: 'Activo',
    en: 'Active'
  },
  'dashboard.recentActivities.inactive': {
    es: 'Inactivo',
    en: 'Inactive'
  },
  'dashboard.recentActivities.edit': {
    es: 'Editar',
    en: 'Edit'
  },
  'dashboard.recentActivities.view': {
    es: 'Ver',
    en: 'View'
  },
  'dashboard.recentActivities.noActivities': {
    es: 'No hay actividades recientes',
    en: 'No recent activities'
  },
  'dashboard.error.loadingActivities': {
    es: 'Error al cargar las actividades del dashboard',
    en: 'Error loading dashboard activities'
  }
};

export const getTranslation = (key: string, language: 'es' | 'en'): string => {
  const translation = translations[key];
  if (!translation) {
    return key;
  }
  return translation[language];
};

export const getTranslationWithParams = (key: string, language: 'es' | 'en', params: Record<string, string | number>): string => {
  let translation = getTranslation(key, language);
  
  // Reemplazar cada parámetro en la traducción
  Object.entries(params).forEach(([param, value]) => {
    const valueStr = String(value || '').trim();
    
    if (valueStr) {
      // Método simple y seguro: usar split y join para reemplazar todas las ocurrencias
      const placeholder = `{${param}}`;
      translation = translation.split(placeholder).join(valueStr);
    }
  });
  
  return translation;
}; 