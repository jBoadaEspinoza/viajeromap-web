# Búsqueda Integrada en Home

## Resumen
Se ha eliminado la página `/search` y toda la funcionalidad de búsqueda ahora se encuentra integrada directamente en la página Home. Los usuarios pueden filtrar actividades por destino, fecha, adultos y niños sin necesidad de navegar a otra página.

## Cambios Realizados

### 1. Eliminación de Página Search
- ✅ Archivo `src/pages/Search.tsx` eliminado
- ✅ Ruta `/search` removida de `src/routes/AppRoutes.tsx`
- ✅ Import de Search eliminado de las rutas

### 2. Filtrado Dinámico en Home

#### Parámetros de URL
El Home ahora lee y escribe parámetros de URL:

```typescript
// URL: /?destination=Paracas&date=2024-10-20&adults=2&children=1

const [searchParams, setSearchParams] = useSearchParams();
const [destination, setDestination] = useState(searchParams.get('destination') || '');
const [dates, setDates] = useState(searchParams.get('date') || '');
const [adults, setAdults] = useState(parseInt(searchParams.get('adults') || '1'));
const [children, setChildren] = useState(parseInt(searchParams.get('children') || '0'));
```

#### Sincronización Automática
Los filtros se sincronizan con la URL automáticamente:

```typescript
useEffect(() => {
  const params = new URLSearchParams();
  if (destination) params.set('destination', destination);
  if (dates) params.set('date', dates);
  if (adults > 1) params.set('adults', adults.toString());
  if (children > 0) params.set('children', children.toString());
  
  if (newParamsString !== currentParamsString) {
    setSearchParams(params, { replace: true });
  }
}, [destination, dates, adults, children]);
```

### 3. Búsqueda en Tiempo Real

El `useEffect` de actividades ahora depende de los filtros:

```typescript
useEffect(() => {
  const fetchActivities = async () => {
    const response = await activitiesApi.search({
      lang: language,
      currency: currency.toUpperCase(),
      destinationCity: destination || undefined, // ← Filtro aplicado aquí
      page: 0,
      size: 50,
      active: true
    });
    // ... procesamiento
  };
  
  fetchActivities();
}, [language, currency, destination, dates]); // ← Se ejecuta al cambiar filtros
```

### 4. Aplicación de Ofertas con Fecha Seleccionada

Las ofertas especiales ahora consideran la fecha seleccionada:

```typescript
// Usar fecha seleccionada o fecha de hoy como fecha de salida
const departureDate = dates ? new Date(dates) : new Date();

// Validar oferta con la fecha de salida
const validOffer = bookingOption.specialOffers.find((offer: any) => 
  isOfferValidForDate(offer, bookingOption, departureDate)
);
```

### 5. Botón de Búsqueda Mejorado

El botón ahora actualiza la URL y hace scroll a las actividades:

```typescript
const handleSearch = () => {
  if (!dates) {
    setShowDateTooltip(true);
    setTimeout(() => setShowDateTooltip(false), 3000);
    return;
  }

  // Actualizar URL con los parámetros de búsqueda
  const params = new URLSearchParams();
  if (destination) params.set('destination', destination);
  if (dates) params.set('date', dates);
  if (adults > 1) params.set('adults', adults.toString());
  if (children > 0) params.set('children', children.toString());
  
  // Actualizar URL usando pushState
  const newUrl = params.toString() ? `/?${params.toString()}#activities` : '/#activities';
  window.history.pushState({}, '', newUrl);
  
  // Hacer scroll a la sección de actividades
  const activitiesSection = document.getElementById('activities');
  if (activitiesSection) {
    activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
```

### 6. Badges de Filtros Aplicados

Se muestran badges informativos cuando hay filtros activos:

```jsx
{(destination || dates) && (
  <div className="d-flex justify-content-center gap-2 flex-wrap mt-3">
    {destination && (
      <span className="badge bg-primary px-3 py-2">
        📍 {getTranslation(`destination.${destination}`, language)}
      </span>
    )}
    {dates && (
      <span className="badge bg-info px-3 py-2">
        📅 {new Date(dates).toLocaleDateString()}
      </span>
    )}
    {(adults > 1 || children > 0) && (
      <span className="badge bg-secondary px-3 py-2">
        👥 {adults} adultos, {children} niños
      </span>
    )}
    <button className="badge bg-danger" onClick={clearFilters}>
      ❌ Limpiar filtros
    </button>
  </div>
)}
```

### 7. Enlaces Actualizados

#### Footer.tsx
```typescript
// Antes:
<Link to="/search?destination=Paracas">Paracas</Link>

// Ahora:
<Link to="/?destination=Paracas#activities">Paracas</Link>
```

#### DestinationCard.tsx
```typescript
// Antes:
navigate(`/search?${params.toString()}`);

// Ahora:
navigate(`/?destination=${destination.cityName}#activities`);
setTimeout(() => {
  const activitiesSection = document.getElementById('activities');
  if (activitiesSection) {
    activitiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}, 100);
```

## Flujo de Usuario

### Escenario 1: Búsqueda desde Hero
```
1. Usuario selecciona destino: "Paracas"
2. Usuario selecciona fecha: "2024-10-20"
3. Usuario selecciona adultos: 2
4. Usuario hace clic en "Buscar"
5. URL se actualiza inmediatamente: /?destination=Paracas&date=2024-10-20&adults=2#activities
6. Actividades se filtran automáticamente (useEffect detecta cambios)
7. Página hace scroll suave a sección #activities
8. Ofertas validadas para la fecha 2024-10-20
```

### Escenario 2: Click en Destino del Footer
```
1. Usuario hace clic en "Nazca" en el footer
2. Navegación a: /?destination=Nazca#activities
3. Home se carga con filtro de destino aplicado
4. Auto-scroll a actividades después de 500ms
5. Muestra solo actividades de Nazca
```

### Escenario 3: Click en Tarjeta de Destino
```
1. Usuario hace clic en tarjeta de destino "Ica"
2. Navegación a: /?destination=Ica#activities
3. Home aplica filtro de destino
4. Scroll automático a actividades
5. Actividades de Ica mostradas
```

### Escenario 4: Limpiar Filtros
```
1. Usuario tiene filtros aplicados
2. Hace clic en "Limpiar filtros"
3. Se resetean: destination='', dates='', adults=1, children=0
4. URL vuelve a: /
5. Muestra todas las actividades disponibles
```

## Beneficios

### ✅ Ventajas de la Nueva Implementación

1. **Experiencia Unificada**: Todo en una sola página, sin navegación innecesaria
2. **Filtrado en Tiempo Real**: Las actividades se actualizan automáticamente al cambiar filtros
3. **URLs Compartibles**: Cada búsqueda tiene una URL única que se puede compartir
4. **Mejor Performance**: No hay carga de página adicional, solo actualización de datos
5. **UX Mejorada**: Scroll suave a resultados, badges informativos, botón de limpiar filtros
6. **Ofertas Inteligentes**: Aplicación de descuentos según fecha seleccionada
7. **Código Más Limpio**: Un componente menos que mantener

### 📊 Comparación

| Aspecto | Antes (con /search) | Ahora (todo en /) |
|---------|---------------------|-------------------|
| Páginas | 2 (Home + Search) | 1 (Home) |
| Navegación | Cambio de página | Scroll suave |
| Filtros | Solo en Search | En Home |
| Ofertas | Implementadas separadas | Una sola implementación |
| Performance | 2 cargas | 1 carga |
| Mantenimiento | Duplicado | Centralizado |

## Componentes Actualizados

1. ✅ `src/pages/Home.tsx` - Búsqueda integrada con filtros y URL params
2. ✅ `src/routes/AppRoutes.tsx` - Ruta /search eliminada
3. ✅ `src/components/DestinationCard.tsx` - Enlaces actualizados a /?destination=X
4. ✅ `src/components/Footer.tsx` - Enlaces de destinos actualizados
5. ❌ `src/pages/Search.tsx` - Eliminado

## Testing

### Test 1: Navegación Directa
```
URL: /?destination=Paracas#activities
Resultado esperado:
- Selector de destino muestra "Paracas"
- Actividades filtradas por Paracas
- Scroll automático a actividades
```

### Test 2: Búsqueda Manual
```
1. Seleccionar destino: Ica
2. Seleccionar fecha: Hoy + 7 días
3. Click en "Buscar"
Resultado esperado:
- Scroll a actividades
- URL: /?destination=Ica&date=2024-10-24
- Ofertas validadas para fecha seleccionada
```

### Test 3: Limpiar Filtros
```
1. Aplicar filtros
2. Click en "Limpiar filtros"
Resultado esperado:
- Todos los campos resetean
- URL: /
- Muestra todas las actividades
```

### Test 4: Ofertas con Fecha
```
Oferta: 20% descuento solo Lunes
Usuario selecciona: Próximo Lunes
Resultado esperado:
- Descuento aplicado
- Badge -20% visible
- Precio original tachado
```

## Notas Técnicas

### URLs Soportadas

```
/                                    → Todas las actividades
/?destination=Paracas                → Actividades de Paracas
/?date=2024-10-20                   → Ofertas validadas para esa fecha
/?destination=Ica&date=2024-10-20   → Combinación de filtros
/?destination=Nazca#activities       → Con scroll automático
```

### Validación de Ofertas

La fecha seleccionada se usa para validar ofertas:

```typescript
// Si usuario selecciona fecha: 2024-10-20 (Domingo)
const departureDate = new Date('2024-10-20');

// Solo se aplican ofertas que:
// 1. Estén en rango de fechas (fromDate - toDate)
// 2. applyToAllSlots = true, O
// 3. specialOfferDays incluya dayIndex=0 (Domingo)
//    Y si es hoy, horario válido
```

### Estado del Buscador

El estado del buscador se mantiene sincronizado en dos vías:

```typescript
Estado Local ←→ URL Params ←→ API Filters
   ↓              ↓              ↓
destination   ?destination   destinationCity
dates         ?date          [usado en ofertas]
adults        ?adults        [info adicional]
children      ?children      [info adicional]
```

**Flujo de sincronización:**

1. **Al cargar página**: URL Params → Estado Local
   ```typescript
   useState(searchParams.get('destination') || '')
   ```

2. **Al buscar**: Estado Local → URL (pushState)
   ```typescript
   window.history.pushState({}, '', newUrl);
   ```

3. **Auto-sincronización**: Estado Local → URL (useEffect)
   ```typescript
   useEffect(() => {
     setSearchParams(params, { replace: true });
   }, [destination, dates, adults, children]);
   ```

4. **Al cambiar filtros**: Estado Local → useEffect → API Request
   ```typescript
   useEffect(() => {
     fetchActivities(); // Con destinationCity filtro
   }, [language, currency, destination, dates]);
   ```

## Mejoras Futuras

1. Agregar más filtros: categoría, rango de precio, duración
2. Implementar búsqueda por texto (searchTerm)
3. Guardar búsquedas recientes en localStorage
4. Sugerencias de destinos mientras se escribe
5. Filtro de "Solo con ofertas activas"
6. Ordenamiento por precio, popularidad, etc.

