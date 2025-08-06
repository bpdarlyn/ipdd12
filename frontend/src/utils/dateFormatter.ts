import type { TFunction } from 'i18next';

export class DateFormatter {
  private locale: string;

  constructor(t: TFunction) {
    this.locale = t('common.locale');
  }

  /**
   * Formats date and time according to locale
   * Spanish: dd/mm/yyyy hh:mm
   * English: mm/dd/yyyy hh:mm
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    
    if (this.locale === 'es') {
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      return date.toLocaleString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
  }

  /**
   * Formats date only according to locale
   * Spanish: dd/mm/yyyy
   * English: mm/dd/yyyy
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    
    if (this.locale === 'es') {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  /**
   * Formats meeting date time to show day name and time
   * Spanish: "Lunes 14:30"
   * English: "Monday 14:30"
   */
  formatMeetingDateTime(dateString: string): string {
    const date = new Date(dateString);
    
    // Get day name based on locale
    const dayName = date.toLocaleDateString(
      this.locale === 'es' ? 'es-ES' : 'en-US', 
      { weekday: 'long' }
    );
    
    const time = date.toLocaleTimeString(
      this.locale === 'es' ? 'es-ES' : 'en-US', 
      { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }
    );
    
    // Capitalize first letter of day name
    const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    
    return `${capitalizedDayName} ${time}`;
  }

  /**
   * Formats birth date from server format (YYYY-MM-DD) to locale format
   * Avoids timezone issues by parsing manually
   * Spanish: dd/mm/yyyy
   * English: mm/dd/yyyy
   */
  formatBirthDate(dateString: string): string {
    // Parse server format "YYYY-MM-DD" manually to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    
    if (this.locale === 'es') {
      // Spanish format: dd/mm/yyyy
      return `${day}/${month}/${year}`;
    } else {
      // English format: mm/dd/yyyy
      return `${month}/${day}/${year}`;
    }
  }
}

/**
 * Utility functions for date formatting
 * These functions create a DateFormatter instance for one-time use
 */
export const formatDateTime = (dateString: string, t: TFunction): string => {
  const formatter = new DateFormatter(t);
  return formatter.formatDateTime(dateString);
};

export const formatDate = (dateString: string, t: TFunction): string => {
  const formatter = new DateFormatter(t);
  return formatter.formatDate(dateString);
};

export const formatMeetingDateTime = (dateString: string, t: TFunction): string => {
  const formatter = new DateFormatter(t);
  return formatter.formatMeetingDateTime(dateString);
};

export const formatBirthDate = (dateString: string, t: TFunction): string => {
  const formatter = new DateFormatter(t);
  return formatter.formatBirthDate(dateString);
};