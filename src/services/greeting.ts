export type TimeOfDayPeriod = 'morning' | 'afternoon' | 'evening';

const GENERIC_NAMES = new Set([
  'usuario',
  'usuario impulso diario',
  'user',
  'invitado',
  'guest',
  'admin',
  'administrador',
  'test',
  'prueba',
  'demo',
  'cliente',
  'mail',
  'correo',
  'info',
  'hola',
  'contacto',
  'soporte',
  'support',
]);

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function isGenericPlaceholderName(name?: string | null): boolean {
  if (!name) return true;
  const cleaned = normalizeToken(name).replace(/\s+/g, ' ');
  if (!cleaned) return true;
  if (GENERIC_NAMES.has(cleaned)) return true;
  const firstToken = cleaned.split(' ')[0];
  return firstToken === 'usuario' || firstToken === 'user';
}

export function deriveNameFromEmail(email?: string | null): string {
  if (!email) return '';
  const localPart = email.split('@')[0]?.trim() || '';
  if (!localPart) return '';

  const rawTokens = localPart
    .replace(/\d+/g, ' ')
    .split(/[._+\-\s]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  const meaningfulTokens = rawTokens.filter(
    (token) => !GENERIC_NAMES.has(normalizeToken(token))
  );

  if (meaningfulTokens.length === 0) return '';

  return meaningfulTokens
    .slice(0, 2)
    .map((token) => capitalizeWord(token))
    .join(' ');
}

export function resolveDisplayName(fullName?: string | null, email?: string | null): string {
  const trimmed = (fullName || '').trim().replace(/\s+/g, ' ');
  if (trimmed && !isGenericPlaceholderName(trimmed)) {
    return trimmed
      .split(' ')
      .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
      .join(' ');
  }

  return deriveNameFromEmail(email);
}

export function getGreetingFirstName(fullName?: string | null, email?: string | null): string {
  const resolved = resolveDisplayName(fullName, email);
  if (!resolved) return 'amigo';
  const first = resolved.split(/\s+/)[0] || '';
  if (!first) return 'amigo';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export function getLocalHour(timezone?: string, referenceDate: Date = new Date()): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || undefined,
      hour: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(referenceDate);
    const hourPart = parts.find((p) => p.type === 'hour')?.value;
    const parsed = hourPart !== undefined ? parseInt(hourPart, 10) : parseInt(formatter.format(referenceDate), 10);
    if (!Number.isNaN(parsed)) {
      return parsed % 24;
    }
  } catch {
    // Fallback to browser local hour
  }
  return referenceDate.getHours();
}

export function getTimeOfDayPeriod(timezone?: string, referenceDate: Date = new Date()): TimeOfDayPeriod {
  const hour = getLocalHour(timezone, referenceDate);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'evening';
}

export function getSpanishGreeting(
  timezone?: string,
  referenceDate: Date = new Date()
): 'Buenos días' | 'Buenas tardes' | 'Buenas noches' {
  const period = getTimeOfDayPeriod(timezone, referenceDate);
  if (period === 'morning') return 'Buenos días';
  if (period === 'afternoon') return 'Buenas tardes';
  return 'Buenas noches';
}

export function formatLocalizedDate(timezone?: string, referenceDate: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      timeZone: timezone || undefined,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(referenceDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(referenceDate);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}
