import { format, startOfWeek, endOfWeek, isToday, isThisWeek, differenceInMinutes } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatTime = (date: Date): string => {
  return format(new Date(date), 'h:mm a');
};

export const formatDateTime = (date: Date): string => {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getWeekRange = (date: Date): { start: Date; end: Date } => {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
};

export const getWeekLabel = (date: Date): string => {
  const { start, end } = getWeekRange(date);
  return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
};

export const getRelativeDate = (date: Date): string => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isThisWeek(d, { weekStartsOn: 1 })) return format(d, 'EEEE');
  return format(d, 'MMM d');
};

export const getDurationMinutes = (startTime: Date, endTime: Date): number => {
  return differenceInMinutes(endTime, startTime);
};
