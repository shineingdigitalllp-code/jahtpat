const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const IST_TIMEZONE = 'Asia/Kolkata';

export function getISTDate(date: Date = new Date()): Date {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

export function startOfDayIST(date: Date = new Date()): Date {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const day = ist.getUTCDate();
  const utcStart = Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  return new Date(utcStart);
}

export function endOfDayIST(date: Date = new Date()): Date {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const day = ist.getUTCDate();
  const utcEnd = Date.UTC(year, month, day, 23, 59, 59, 999) - IST_OFFSET_MS;
  return new Date(utcEnd);
}

export function daysAgoIST(days: number): Date {
  const todayStart = startOfDayIST();
  return new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatDateIST(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatTimeIST(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
