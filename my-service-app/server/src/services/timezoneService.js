/**
 * Timezone Handling Service
 * Provides consistent timezone handling across the application
 */

const config = require('../config');

class TimezoneService {
  constructor() {
    this.defaultTimezone = config.app.timezone || 'Asia/Ho_Chi_Minh';
    this.supportedTimezones = [
      'Asia/Ho_Chi_Minh',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Jakarta',
      'Asia/Kuala_Lumpur',
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Australia/Sydney'
    ];
  }

  /**
   * Parse date string with timezone handling
   */
  parseDate(dateString, timezone = null) {
    if (!dateString) {
      throw new Error('Date string is required');
    }

    const targetTimezone = timezone || this.defaultTimezone;
    
    try {
      // Handle ISO strings with timezone
      if (typeof dateString === 'string' && dateString.includes('T')) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date format');
        }
        return this.normalizeToTimezone(date, targetTimezone);
      }
      
      // Handle timestamp numbers
      if (typeof dateString === 'number') {
        const date = new Date(dateString);
        return this.normalizeToTimezone(date, targetTimezone);
      }
      
      // Handle Date objects
      if (dateString instanceof Date) {
        return this.normalizeToTimezone(dateString, targetTimezone);
      }
      
      // Handle string dates without time
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      
      return this.normalizeToTimezone(date, targetTimezone);
    } catch (error) {
      throw new Error(`Failed to parse date: ${error.message}`);
    }
  }

  /**
   * Normalize date to specific timezone
   */
  normalizeToTimezone(date, timezone) {
    try {
      // Use Intl.DateTimeFormat to handle timezone conversion
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
      
      const parts = formatter.formatToParts(date);
      const values = {};
      
      parts.forEach(part => {
        values[part.type] = part.value;
      });
      
      // Create normalized date in target timezone
      const normalizedDate = new Date(
        `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
      );
      
      return normalizedDate;
    } catch (error) {
      // Fallback to simple date conversion
      console.warn('Timezone normalization failed, using fallback:', error.message);
      return new Date(date);
    }
  }

  /**
   * Convert date to UTC
   */
  toUTC(date) {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  }

  /**
   * Convert UTC date to local timezone
   */
  fromUTC(utcDate, timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    return this.normalizeToTimezone(utcDate, targetTimezone);
  }

  /**
   * Format date for display
   */
  formatDate(date, timezone = null, format = 'full') {
    const targetTimezone = timezone || this.defaultTimezone;
    const normalizedDate = this.normalizeToTimezone(date, targetTimezone);
    
    const formats = {
      full: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetTimezone
      },
      date: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: targetTimezone
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: targetTimezone
      },
      iso: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: targetTimezone
      }
    };
    
    return new Intl.DateTimeFormat('vi-VN', formats[format] || formats.full).format(normalizedDate);
  }

  /**
   * Validate booking date with timezone awareness
   */
  validateBookingDate(dateString, timezone = null) {
    try {
      const targetTimezone = timezone || this.defaultTimezone;
      const bookingDate = this.parseDate(dateString, targetTimezone);
      const now = new Date();
      const nowInTimezone = this.normalizeToTimezone(now, targetTimezone);
      
      // Check if booking date is in the future
      if (bookingDate <= nowInTimezone) {
        return {
          valid: false,
          error: 'Ngày đặt lịch phải là trong tương lai',
          bookingDate,
          nowInTimezone
        };
      }
      
      // Check if booking date is too far in the future (6 months)
      const maxFutureDate = new Date(nowInTimezone);
      maxFutureDate.setMonth(maxFutureDate.getMonth() + 6);
      
      if (bookingDate > maxFutureDate) {
        return {
          valid: false,
          error: 'Không thể đặt lịch quá 6 tháng tới',
          bookingDate,
          maxFutureDate
        };
      }
      
      // Check business hours (8:00 - 20:00)
      const bookingHour = bookingDate.getHours();
      if (bookingHour < 8 || bookingHour > 20) {
        return {
          valid: false,
          error: 'Giờ làm việc từ 8:00 đến 20:00',
          bookingDate,
          bookingHour
        };
      }
      
      // Check if booking is on weekend (optional restriction)
      const dayOfWeek = bookingDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      
      return {
        valid: true,
        bookingDate,
        nowInTimezone,
        isWeekend,
        formattedDate: this.formatDate(bookingDate, targetTimezone)
      };
      
    } catch (error) {
      return {
        valid: false,
        error: `Định dạng ngày không hợp lệ: ${error.message}`
      };
    }
  }

  /**
   * Get date range for queries with timezone handling
   */
  getDateRange(startDate, endDate, timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    
    const start = this.parseDate(startDate, targetTimezone);
    const end = this.parseDate(endDate, targetTimezone);
    
    // Set end time to end of day
    end.setHours(23, 59, 59, 999);
    
    return {
      start: this.toUTC(start),
      end: this.toUTC(end)
    };
  }

  /**
   * Get today's date range in timezone
   */
  getTodayRange(timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    const now = new Date();
    const today = this.normalizeToTimezone(now, targetTimezone);
    
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    
    return {
      start: this.toUTC(start),
      end: this.toUTC(end),
      local: { start, end }
    };
  }

  /**
   * Check if two dates are the same day in timezone
   */
  isSameDay(date1, date2, timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    
    const d1 = this.normalizeToTimezone(date1, targetTimezone);
    const d2 = this.normalizeToTimezone(date2, targetTimezone);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * Add business days to date (skipping weekends)
   */
  addBusinessDays(date, days, timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    let result = this.normalizeToTimezone(date, targetTimezone);
    
    for (let i = 0; i < days; i++) {
      result.setDate(result.getDate() + 1);
      
      // Skip weekends
      while (result.getDay() === 0 || result.getDay() === 6) {
        result.setDate(result.getDate() + 1);
      }
    }
    
    return result;
  }

  /**
   * Get timezone offset for user
   */
  getTimezoneOffset(timezone = null) {
    const targetTimezone = timezone || this.defaultTimezone;
    const now = new Date();
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimezone,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(now);
      const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value;
      
      return {
        timezone: targetTimezone,
        offset: now.getTimezoneOffset(),
        name: timeZoneName
      };
    } catch (error) {
      return {
        timezone: targetTimezone,
        offset: now.getTimezoneOffset(),
        name: 'Local'
      };
    }
  }

  /**
   * Validate timezone string
   */
  isValidTimezone(timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get supported timezones
   */
  getSupportedTimezones() {
    return this.supportedTimezones.map(tz => ({
      value: tz,
      label: tz.replace('_', ' '),
      offset: this.getTimezoneOffset(tz)
    }));
  }

  /**
   * Convert booking date for database storage (always UTC)
   */
  toDatabaseDate(dateString, timezone = null) {
    const localDate = this.parseDate(dateString, timezone);
    return this.toUTC(localDate);
  }

  /**
   * Convert database date to local timezone for display
   */
  fromDatabaseDate(utcDate, timezone = null) {
    return this.fromUTC(utcDate, timezone);
  }
}

// Create singleton instance
const timezoneService = new TimezoneService();

module.exports = timezoneService;
