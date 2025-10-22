# Implementación de Ofertas Especiales en Actividades

## Resumen
Se ha implementado la visualización de ofertas especiales en las actividades de la aplicación, mostrando el precio original tachado, el precio con descuento, y un badge con el porcentaje de descuento. Las ofertas solo se aplican si están dentro del rango de fechas válido (entre `fromDate` y `toDate`) y si están activas (`isActive: true`).

## Cambios Realizados

### 1. Interfaz `ActivityCardData` (src/components/ActivityCard.tsx)

Se agregaron tres nuevos campos opcionales a la interfaz:

```typescript
export interface ActivityCardData {
  // ... campos existentes
  hasActiveOffer?: boolean;        // Indica si tiene una oferta activa válida
  originalPrice?: number;           // Precio original antes del descuento
  discountPercent?: number;         // Porcentaje de descuento aplicado
}
```

### 2. Componente ActivityCard (src/components/ActivityCard.tsx)

Se actualizaron las tres variantes del componente para mostrar las ofertas:

#### Variante Default (Tarjeta vertical)
- Muestra un badge rojo con el porcentaje de descuento
- Muestra el precio original tachado
- Muestra el precio con descuento en color rojo (en lugar de azul)

#### Variante Horizontal
- Mismo formato que la variante default
- Badge de descuento y precio original tachado
- Precio con descuento en rojo

#### Variante Compact
- Badge de descuento en la esquina superior derecha
- Mantiene el precio con descuento visible

### 3. Página Home (src/pages/Home.tsx)

#### Función de Validación de Ofertas
Se agregó una función helper para validar si una oferta es válida según la fecha actual:

```typescript
const isOfferValid = (fromDate: string, toDate: string): boolean => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
  
  const startDate = new Date(fromDate);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(toDate);
  endDate.setHours(23, 59, 59, 999); // Set to end of day
  
  return currentDate >= startDate && currentDate <= endDate;
};
```

#### Lógica de Aplicación de Ofertas
En el mapeo de actividades, se agregó la lógica para:

1. Calcular el precio base de la actividad
2. Buscar ofertas especiales activas en las `bookingOptions`
3. Validar que la oferta esté dentro del rango de fechas
4. Aplicar el descuento si la oferta es válida
5. Pasar los datos de la oferta al componente `ActivityCard`

```typescript
// Check for active special offers
if (bookingOption.specialOffers && bookingOption.specialOffers.length > 0) {
  const validOffer = bookingOption.specialOffers.find(offer => 
    offer.isActive && 
    isOfferValid(offer.fromDate, offer.toDate)
  );

  if (validOffer && validOffer.discountPercent > 0) {
    hasActiveOffer = true;
    originalPrice = price;
    discountPercent = validOffer.discountPercent;
    price = price * (1 - validOffer.discountPercent / 100);
  }
}
```

#### Vistas Desktop y Móvil
Se actualizaron ambas vistas (desktop y móvil) para mostrar:
- Badge rojo con el porcentaje de descuento
- Precio original tachado
- Precio con descuento en color rojo

### 4. Página Search (src/pages/Search.tsx)

Se aplicó la misma lógica de validación y aplicación de ofertas en la página de búsqueda, incluyendo:

1. Función helper `isOfferValid` dentro del mapeo de actividades
2. Cálculo de precio base
3. Validación de ofertas especiales
4. Aplicación del descuento
5. Paso de datos de oferta al componente `ActivityCard`

## Flujo de Datos

```
API Response (Activity)
  └── bookingOptions[]
      ├── priceTiers[] (precios YA CONVERTIDOS por el backend según currency)
      ├── pricePerPerson (precio YA CONVERTIDO)
      └── specialOffers[]
          ├── fromDate
          ├── toDate
          ├── discountPercent
          └── isActive
              ↓
    PASO 1: Obtener Precio Base
    (El API ya devuelve precios en la moneda solicitada)
              ↓
    PASO 2: Validación de Fecha
    (isOfferValid)
              ↓
    PASO 3: Cálculo de Descuento
    (sobre el precio YA CONVERTIDO)
    precio_final = precio_convertido - (precio_convertido * descuento%)
              ↓
    ActivityCardData
    ├── price (precio convertido con descuento)
    ├── originalPrice (precio convertido sin descuento)
    ├── discountPercent
    └── hasActiveOffer
              ↓
    ActivityCard Component
    (muestra UI con descuento)
```

## Orden de Operaciones CRÍTICO

⚠️ **MUY IMPORTANTE**: El orden de las operaciones es:

1. **PRIMERO**: El backend devuelve los precios ya convertidos a la moneda solicitada (`currency` parameter)
2. **SEGUNDO**: Se aplica el descuento sobre el precio ya convertido
3. **TERCERO**: Se muestra al usuario el precio final

**Nunca** se debe aplicar el descuento antes de la conversión de moneda, porque el descuento debe calcularse sobre el precio en la moneda final que verá el usuario.

## Validación de Ofertas Especiales

La validación de ofertas es compleja y considera múltiples factores:

### 1. Validación de Rango de Fechas

1. **Fecha de Salida**: Para Home se usa la fecha actual; en otras páginas puede ser una fecha seleccionada
2. **Fecha de Inicio de Oferta**: Se normaliza a las 00:00:00
3. **Fecha de Fin de Oferta**: Se normaliza a las 23:59:59
4. **Validación**: La fecha de salida debe estar dentro del rango `fromDate` - `toDate`

### 2. Validación según `applyToAllSlots`

**Si `applyToAllSlots === true`:**
- ✅ Se aplica el descuento sin verificar días ni horarios específicos
- Solo se valida que la fecha de salida esté en el rango de la oferta

**Si `applyToAllSlots === false`:**
- ❌ Se deben verificar días y horarios específicos según el `availabilityMode`

### 3. Validación según `availabilityMode`

#### Modo: `TIME_SLOTS`

**Si la fecha de salida es HOY:**
1. Verificar que el día de la semana actual coincida con algún `dayIndex` en `specialOfferDays`
2. Verificar que la hora actual esté dentro de algún rango `startTime` - `endTime` de ese día
3. Aplicar descuento solo si ambas condiciones se cumplen

**Si la fecha de salida es OTRO DÍA:**
1. Solo verificar que el día de la semana coincida con algún `dayIndex` en `specialOfferDays`
2. No validar horarios (se asume disponible todo el día)

#### Modo: `OPENING_HOURS`

**Si la fecha de salida es HOY:**
1. Verificar que el día de la semana actual coincida con algún `dayIndex` en `specialOfferDays`
2. Verificar que la hora actual esté dentro del rango `startTime` - `endTime` del día
3. Aplicar descuento solo si ambas condiciones se cumplen

**Si la fecha de salida es OTRO DÍA:**
1. Solo verificar que el día de la semana coincida con algún `dayIndex` en `specialOfferDays`
2. No validar horarios (se asume disponible durante las horas de apertura)

### 4. Estructura de Datos

```typescript
SpecialOfferResponse {
  applyToAllSlots: boolean;
  fromDate: string;          // "2024-01-01"
  toDate: string;            // "2024-12-31"
  discountPercent: number;   // 20
  specialOfferDays: [
    {
      dayIndex: number;      // 0=Domingo, 1=Lunes, ..., 6=Sábado
      specialOfferTimes: [
        {
          startTime: string; // "09:00:00"
          endTime: string;   // "18:00:00"
        }
      ]
    }
  ]
}

BookingOption {
  availabilityMode: 'TIME_SLOTS' | 'OPENING_HOURS';
  // ... otros campos
}
```

## Visualización de UI

### Con Oferta Activa
```
┌─────────────────────────────────┐
│  -20%  S/100                    │  <- Badge y precio original tachado
│  S/80                           │  <- Precio con descuento (rojo)
│  por persona                    │
└─────────────────────────────────┘
```

### Sin Oferta
```
┌─────────────────────────────────┐
│  S/100                          │  <- Precio normal (azul)
│  por persona                    │
└─────────────────────────────────┘
```

## Consideraciones Importantes

1. **Conversión de Moneda PRIMERO**: El API backend ya devuelve los precios en la moneda solicitada a través del parámetro `currency`. El frontend NO hace conversión de moneda.
2. **Descuento sobre Precio Convertido**: El descuento se aplica sobre el precio que ya está en la moneda correcta.
3. **Fecha de Salida**:
   - **Home**: Usa la fecha de hoy por defecto
   - **Search**: Usa la fecha seleccionada por el usuario, o hoy si no hay fecha seleccionada
4. **Primera Oferta Válida**: Si una actividad tiene múltiples ofertas válidas, se aplica la primera que cumpla todas las condiciones
5. **Validación Estricta**: Solo se aplican ofertas que cumplan TODAS estas condiciones:
   - `isActive: true`
   - Fecha de salida dentro del rango `fromDate` - `toDate`
   - `discountPercent > 0`
   - Si `applyToAllSlots = false`: día de semana y horario válidos según `availabilityMode`
6. **Precio Mínimo**: Si hay múltiples `priceTiers`, se toma el precio mínimo antes de aplicar el descuento
7. **Redondeo**: Los precios se muestran redondeados hacia arriba con `Math.ceil()`
8. **Línea Tachada**: Usa CSS personalizado con línea de 0.3px a 40% de altura para mejor legibilidad

### Ejemplo de Flujo Completo

```typescript
// Actividad con precio en PEN, usuario solicita USD
// Backend recibe: currency = "USD"
// Backend devuelve: pricePerPerson = 26.67 (ya convertido de PEN 100 a USD)

// En el frontend:
const price = 26.67; // ← Ya viene convertido del backend
const discountPercent = 20; // 20% de descuento

// Se aplica el descuento sobre el precio convertido:
const discountAmount = 26.67 * (20 / 100); // = 5.33 USD
const finalPrice = 26.67 - 5.33; // = 21.34 USD

// NO se debe hacer:
// ❌ Aplicar descuento en PEN y luego convertir
// ❌ const discountInPEN = 100 * 0.20 = 20 PEN
// ❌ const finalInPEN = 100 - 20 = 80 PEN
// ❌ const finalInUSD = 80 / 3.75 = 21.33 USD (INCORRECTO!)
```

## Archivos Modificados

1. `src/components/ActivityCard.tsx` - Interfaz y componente actualizado con visualización de descuentos
2. `src/pages/Home.tsx` - Lógica completa de validación de ofertas (usa fecha de hoy por defecto)
3. `src/pages/Search.tsx` - Lógica completa de validación de ofertas (usa fecha seleccionada por el usuario)
4. `src/api/activities.ts` - Agregado campo `availabilityMode` a la interfaz `BookingOption`
5. `src/api/specialOffer.ts` - Interfaces de ofertas especiales

## Ejemplos de Validación

### Ejemplo 1: Oferta con `applyToAllSlots = true`

```typescript
// Oferta: 20% descuento válida todo enero
offer = {
  applyToAllSlots: true,
  fromDate: "2024-01-01",
  toDate: "2024-01-31",
  discountPercent: 20
}

// Escenario: Usuario busca para cualquier día de enero
departureDate = new Date("2024-01-15")
// ✅ APLICAR DESCUENTO (está en el rango, applyToAllSlots=true)
```

### Ejemplo 2: TIME_SLOTS - Salida HOY

```typescript
// Oferta: 15% descuento solo Lunes de 9:00 a 18:00
offer = {
  applyToAllSlots: false,
  fromDate: "2024-01-01",
  toDate: "2024-12-31",
  discountPercent: 15,
  specialOfferDays: [
    { 
      dayIndex: 1,  // Lunes
      specialOfferTimes: [
        { startTime: "09:00:00", endTime: "18:00:00" }
      ]
    }
  ]
}

bookingOption = {
  availabilityMode: "TIME_SLOTS"
}

// Escenario 1: Hoy es Lunes 15:00
departureDate = new Date("2024-01-15 15:00") // Lunes
currentTime = "15:00"
// ✅ APLICAR DESCUENTO (día=Lunes, hora=15:00 está entre 9:00-18:00)

// Escenario 2: Hoy es Lunes 20:00
departureDate = new Date("2024-01-15 20:00") // Lunes
currentTime = "20:00"
// ❌ NO APLICAR (día=Lunes correcto, pero hora=20:00 fuera del rango)

// Escenario 3: Hoy es Martes 15:00
departureDate = new Date("2024-01-16 15:00") // Martes
// ❌ NO APLICAR (día=Martes, no coincide con dayIndex=1)
```

### Ejemplo 3: TIME_SLOTS - Salida OTRO DÍA

```typescript
// Misma oferta del Ejemplo 2

// Escenario: Usuario busca para el próximo Lunes
departureDate = new Date("2024-01-22") // Lunes (futuro)
// ✅ APLICAR DESCUENTO (día=Lunes coincide, no importa la hora actual)

// Escenario: Usuario busca para el próximo Martes
departureDate = new Date("2024-01-23") // Martes (futuro)
// ❌ NO APLICAR (día=Martes no coincide)
```

### Ejemplo 4: OPENING_HOURS - Salida HOY

```typescript
// Oferta: 25% descuento Viernes y Sábado de 18:00 a 23:00
offer = {
  applyToAllSlots: false,
  fromDate: "2024-01-01",
  toDate: "2024-12-31",
  discountPercent: 25,
  specialOfferDays: [
    { 
      dayIndex: 5,  // Viernes
      specialOfferTimes: [
        { startTime: "18:00:00", endTime: "23:00:00" }
      ]
    },
    { 
      dayIndex: 6,  // Sábado
      specialOfferTimes: [
        { startTime: "18:00:00", endTime: "23:00:00" }
      ]
    }
  ]
}

bookingOption = {
  availabilityMode: "OPENING_HOURS"
}

// Escenario 1: Hoy es Viernes 19:30
departureDate = new Date("2024-01-19 19:30") // Viernes
currentTime = "19:30"
// ✅ APLICAR DESCUENTO (día=Viernes, hora entre 18:00-23:00)

// Escenario 2: Hoy es Viernes 15:00
departureDate = new Date("2024-01-19 15:00") // Viernes
currentTime = "15:00"
// ❌ NO APLICAR (día correcto, pero fuera del horario de apertura con oferta)
```

## Logs de Depuración

La implementación incluye logs detallados en la consola:

```javascript
🔍 Verificando ofertas para actividad: Tour a Paracas
📅 Fecha de salida: 15/01/2024
🕐 Hora actual: 15:30:00
📋 Modo de disponibilidad: TIME_SLOTS

✅ Oferta aplica a todos los slots
// O
✅ TIME_SLOTS - Hoy - Horario válido: true
// O
❌ La oferta no aplica para el día 2 (Martes)

✅ DESCUENTO APLICADO:
- activityId: "abc123"
- activityTitle: "Tour a Paracas"
- offerName: "Descuento de Verano"
- applyToAllSlots: false
- originalPriceConverted: 100
- discountPercent: 20
- finalPrice: 80
- departureDate: "15/01/2024"
```

## Testing

Para probar la implementación:

### Test 1: Oferta General (`applyToAllSlots = true`)
1. Crear oferta con `applyToAllSlots: true`
2. Verificar que se aplica siempre dentro del rango de fechas
3. Verificar que no se aplica fuera del rango

### Test 2: TIME_SLOTS - Hoy
1. Crear oferta para día actual con horario específico
2. Si hora actual está en el rango → debe aplicar descuento
3. Si hora actual está fuera del rango → no debe aplicar

### Test 3: TIME_SLOTS - Futuro
1. Crear oferta para un día específico de la semana
2. Buscar para una fecha futura que coincida con ese día
3. Debe aplicar descuento sin importar la hora actual

### Test 4: OPENING_HOURS - Similar a TIME_SLOTS
1. Probar con horarios de apertura específicos
2. Verificar comportamiento para hoy vs futuro

## Diferencias entre Home y Search

| Característica | Home | Search |
|---------------|------|--------|
| Fecha de salida | Siempre usa HOY | Usa fecha seleccionada o HOY |
| Formato de cards | Grid 3-4 columnas | Horizontal 1 columna |
| Actualización | Al cargar la página | Al cambiar filtros/fecha |
| Logs en consola | Prefijo normal | Prefijo `[SEARCH]` |

## Mejoras Futuras

1. Mostrar fecha de expiración de la oferta en las tarjetas
2. Permitir múltiples ofertas simultáneas y elegir la mejor (mayor descuento)
3. Agregar animaciones para resaltar las ofertas
4. Implementar ofertas especiales en la página de detalle de la actividad
5. Agregar filtros para mostrar solo actividades con ofertas activas
6. Mostrar un contador de tiempo para ofertas que expiran pronto
7. Agregar notificaciones cuando una oferta está por expirar

