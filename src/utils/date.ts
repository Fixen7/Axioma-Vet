/**
 * Parsea un string de fecha asegurando que si es formato YYYY-MM-DD
 * se interprete en la zona horaria local en lugar de UTC.
 * Esto evita el bug común donde '2026-08-13' se convierte en '2026-08-12 19:00'
 */
export const parseLocalDate = (dateStr: string | Date): Date => {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // Si es solo fecha YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  // Si viene de Supabase como timestamp pero a veces iOS molesta,
  // Date constructor normalmente lo maneja si tiene T y Z o offset.
  // Solo devolvemos new Date() para el resto.
  const date = new Date(dateStr);
  
  // Fallback si es Invalid Date (pasa en algunos navegadores viejos con strings SQL)
  if (isNaN(date.getTime()) && typeof dateStr === 'string') {
    const normalized = dateStr.replace(' ', 'T');
    return new Date(normalized);
  }
  
  return date;
};

/**
 * Formatea una fecha a string amigable local, ej: "13 ago 2026"
 * Auto-detecta si el string incluye tiempo o se puede forzar con includeTime
 */
export const formatLocalDate = (dateInput: string | Date, includeTime: boolean = false): string => {
  const date = parseLocalDate(dateInput);
  if (isNaN(date.getTime())) return '';
  
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', month: 'short', year: 'numeric' 
  };
  
  if (includeTime || (typeof dateInput === 'string' && dateInput.includes('T'))) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('es-ES', options).format(date);
};

/**
 * Retorna la fecha local actual en formato YYYY-MM-DD
 * Ideal para rellenar por defecto inputs de tipo date
 */
export const getLocalDateString = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna la fecha y hora local actual en formato YYYY-MM-DDTHH:mm
 * Ideal para rellenar por defecto inputs de tipo datetime-local, 
 * o convertir un string UTC de la BD a formato local para el input.
 */
export const getLocalDatetimeString = (dateInput?: string | Date): string => {
  const date = dateInput ? new Date(dateInput) : new Date();
  
  // En caso de que el dateInput sea inválido, usamos la fecha actual
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, '0')}-${String(fallback.getDate()).padStart(2, '0')}T${String(fallback.getHours()).padStart(2, '0')}:${String(fallback.getMinutes()).padStart(2, '0')}`;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte un string de datetime-local (YYYY-MM-DDTHH:mm) a un ISO string UTC
 * para guardarlo correctamente en la base de datos sin desfases horarios.
 */
export const toUTCDateTime = (localDatetimeStr: string): string => {
  if (!localDatetimeStr) return localDatetimeStr;
  if (!localDatetimeStr.includes('T')) return localDatetimeStr;
  
  const date = new Date(localDatetimeStr);
  if (isNaN(date.getTime())) return localDatetimeStr;
  return date.toISOString();
};

/**
 * Calcula la edad de un paciente en base a su fecha de nacimiento
 */
export const calculateAge = (birthDate: string | Date | undefined): string => {
  if (!birthDate) return 'Desconocida';
  
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return 'Desconocida';
  
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    if (months === 0) return 'Menos de 1 mes';
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  }
  
  if (months === 0) {
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
  
  return `${years} ${years === 1 ? 'año' : 'años'}, ${months} ${months === 1 ? 'mes' : 'meses'}`;
};
