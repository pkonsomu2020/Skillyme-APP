// Shared date formatting utilities — all times displayed in Kenya EAT (UTC+3)

const EAT = 'Africa/Nairobi';

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString('en-KE', { timeZone: EAT, year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString('en-KE', { timeZone: EAT, dateStyle: 'medium', timeStyle: 'short' });

export const formatTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString('en-KE', { timeZone: EAT, hour: 'numeric', minute: '2-digit', hour12: true });
