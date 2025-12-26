import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isValid(dateObj) ? format(dateObj, formatStr) : '';
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm:ss');
};

export const formatDateDisplay = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy');
};

export const formatDateTimeDisplay = (date: Date | string): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

export const getCurrentDate = (): string => {
  return formatDate(new Date());
};

export const getCurrentDateTime = (): string => {
  return formatDateTime(new Date());
};
