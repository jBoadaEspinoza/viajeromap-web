

/**
 * Utilidades para manejo de fechas y conversión de zonas horarias
 */

/**
 * Obtiene la zona horaria del sistema del usuario
 * @returns String con la zona horaria del sistema (ej: "America/Lima", "America/New_York", "Europe/Madrid")
 */
export const getTimeZoneFromSystem = (): string => {
  try {
    // Usar Intl.DateTimeFormat para obtener la zona horaria del sistema
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone;
  } catch (error) {
    console.error('Error getting timezone from system:', error);
    // Fallback: retornar una zona horaria por defecto
    return 'America/Lima';
  }
};

/**
 * Obtiene el offset de una zona horaria específica para una fecha dada
 * @param timezone Zona horaria (ej: "America/Lima", "America/New_York")
 * @param dateString Formato: "YYYY-MM-DD"
 * @returns String del offset en formato "+HH:MM" o "-HH:MM" (ej: "-05:00")
 */
const getTimezoneOffset = (timezone: string, dateString: string): string => {
  try {
    // Crear una fecha de referencia en UTC (mediodía para evitar problemas de cambio de día)
    const [year, month, day] = dateString.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Obtener la representación de la fecha en la zona horaria especificada
    const tzDateStr = utcDate.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Obtener la representación de la misma fecha en UTC
    const utcDateStr = utcDate.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parsear las horas
    const tzMatch = tzDateStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    const utcMatch = utcDateStr.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    
    if (tzMatch && utcMatch) {
      const tzHour = parseInt(tzMatch[1], 10);
      const utcHour = parseInt(utcMatch[1], 10);
      
      // Calcular el offset
      let offsetHours = tzHour - utcHour;
      // Ajustar si hay cambio de día
      if (offsetHours > 12) offsetHours -= 24;
      if (offsetHours < -12) offsetHours += 24;
      
      // Formatear el offset
      const sign = offsetHours >= 0 ? '+' : '-';
      const absHours = Math.abs(offsetHours);
      return `${sign}${String(absHours).padStart(2, '0')}:00`;
    }
    
    // Si no se puede calcular, usar un método alternativo
    // Crear una fecha en la zona horaria y comparar con UTC
    const testDate = new Date(`${dateString}T12:00:00`);
    const tzFormatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    // Intentar obtener el offset del formatter
    const parts = tzFormatter.formatToParts(testDate);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    
    if (offsetPart && offsetPart.value) {
      // El formato puede ser "GMT-5" o similar, extraer el número
      const offsetMatch = offsetPart.value.match(/GMT([+-])(\d+)/);
      if (offsetMatch) {
        const sign = offsetMatch[1];
        const hours = offsetMatch[2];
        return `${sign}${hours.padStart(2, '0')}:00`;
      }
    }
    
    // Fallback: retornar offset por defecto según la zona horaria común
    if (timezone.includes('Lima')) return '-05:00';
    if (timezone.includes('New_York')) return '-05:00'; // Puede variar con DST
    return '+00:00';
  } catch (error) {
    console.error(`Error getting offset for timezone ${timezone}, using fallback:`, error);
    // Fallback según zona horaria común
    if (timezone.includes('Lima')) return '-05:00';
    return '+00:00';
  }
};

/**
 * Convierte fecha y hora local de una zona horaria específica a UTC
 * @param dateTimeString Formato: "YYYY-MM-DDTHH:mm:ss"
 * @param timezone Zona horaria (ej: "America/Lima", "America/New_York")
 * @returns String ISO en formato UTC: "YYYY-MM-DDTHH:mm:ss+00:00"
 */

export const convertLocalDateTimeToUTC = (dateTimeString: string, timezone: string): string => {
  try {
    // Separar fecha y hora si vienen juntas
    const [datePart, timePart] = dateTimeString.split('T');
    const dateString = datePart || '';
    const timeString = timePart || '00:00:00';
    
    // Obtener el offset de la zona horaria para la fecha específica
    const offset = getTimezoneOffset(timezone, dateString);
    
    // Crear un string ISO interpretando la fecha/hora como si fuera en la zona horaria especificada
    const tzISOString = `${dateString}T${timeString}${offset}`;
    
    // Parsear como Date (automáticamente convierte a UTC internamente)
    const utcDate = new Date(tzISOString);
    
    // Verificar que la fecha es válida
    if (isNaN(utcDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Formatear como ISO string en UTC
    const yearUTC = utcDate.getUTCFullYear();
    const monthUTC = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const dayUTC = String(utcDate.getUTCDate()).padStart(2, '0');
    const hoursUTC = String(utcDate.getUTCHours()).padStart(2, '0');
    const minutesUTC = String(utcDate.getUTCMinutes()).padStart(2, '0');
    const secondsUTC = String(utcDate.getUTCSeconds()).padStart(2, '0');
    
    return `${yearUTC}-${monthUTC}-${dayUTC}T${hoursUTC}:${minutesUTC}:${secondsUTC}+00:00`;
  } catch (error) {
    console.error('Error converting local time to UTC:', error);
    // Fallback: retornar con +00:00 (aunque no sea correcto)
    return dateTimeString.includes('T') ? `${dateTimeString}+00:00` : `${dateTimeString}T00:00:00+00:00`;
  }
};

/**
 * Convierte fecha y hora UTC a una zona horaria local específica
 * @param dateTimeString Formato: "YYYY-MM-DDTHH:mm:ss" o "YYYY-MM-DDTHH:mm:ss+00:00" (UTC)
 * @param timezone Zona horaria destino (ej: "America/Lima", "America/New_York")
 * @returns String ISO en formato local: "YYYY-MM-DDTHH:mm:ss"
 */
export const convertUTCToLocalDateTime = (dateTimeString: string, timezone: string): string => {
  try {
    if (!dateTimeString || !timezone) {
      throw new Error('Missing dateTimeString or timezone');
    }
    
    // Limpiar el string de datetime (remover offset si existe)
    let cleanDateTime = dateTimeString.trim();
    
    // Remover el offset si está presente (ej: "+00:00", "-05:00", "Z")
    cleanDateTime = cleanDateTime.replace(/[+-]\d{2}:\d{2}$/, ''); // Remover +HH:MM o -HH:MM
    cleanDateTime = cleanDateTime.replace(/Z$/, ''); // Remover Z
    cleanDateTime = cleanDateTime.replace(/\.\d{3,}$/, ''); // Remover milisegundos si existen
    
    // Separar fecha y hora
    const [datePart, timePart] = cleanDateTime.split('T');
    const dateString = datePart || '';
    let timeString = timePart || '00:00:00';
    
    // Asegurar que el tiempo tenga el formato correcto (HH:mm:ss)
    const timeParts = timeString.split(':');
    if (timeParts.length === 2) {
      timeString = `${timeString}:00`; // Agregar segundos si faltan
    }
    
    // Crear un objeto Date interpretando la fecha/hora como UTC
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes, seconds = 0] = timeString.split(':').map(Number);
    
    // Validar que los valores sean números válidos
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
      throw new Error('Invalid date or time values');
    }
    
    // Crear fecha en UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    
    // Verificar que la fecha es válida
    if (isNaN(utcDate.getTime())) {
      throw new Error('Invalid date');
    }
    
    // Convertir a la zona horaria local usando Intl
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Formatear la fecha en la zona horaria local
    const parts = formatter.formatToParts(utcDate);
    
    const yearLocal = parts.find(p => p.type === 'year')?.value || '';
    const monthLocal = parts.find(p => p.type === 'month')?.value || '';
    const dayLocal = parts.find(p => p.type === 'day')?.value || '';
    const hourLocal = parts.find(p => p.type === 'hour')?.value || '';
    const minuteLocal = parts.find(p => p.type === 'minute')?.value || '';
    const secondLocal = parts.find(p => p.type === 'second')?.value || '';
    
    // Formatear como ISO string local
    const result = `${yearLocal}-${monthLocal.padStart(2, '0')}-${dayLocal.padStart(2, '0')}T${hourLocal.padStart(2, '0')}:${minuteLocal.padStart(2, '0')}:${secondLocal.padStart(2, '0')}`;
    
    console.log(`🕐 convertUTCToLocalDateTime: ${dateTimeString} (UTC) -> ${result} (${timezone})`);
    
    return result;
  } catch (error) {
    console.error('Error converting UTC to local time:', error, { dateTimeString, timezone });
    // Fallback: retornar el string original sin offset
    const cleanDateTime = dateTimeString.replace(/[+-]\d{2}:\d{2}$/, '').replace(/Z$/, '').replace(/\.\d{3,}$/, '');
    return cleanDateTime.includes('T') ? cleanDateTime : `${cleanDateTime}T00:00:00`;
  }
};

