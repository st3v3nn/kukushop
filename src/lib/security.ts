/**
 * Security utilities for the Speedy Bites app
 */

// Content Security Policy headers (to be configured on backend)
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' localhost:4000 https://",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  // Relaxed policy for development: require a reasonably-sized password only
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Accept Kenyan phone numbers (254 or +254 or 0 prefix)
  const phoneRegex = /^(\+?254|0)[1-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeInput = (input: string): string => {
  // Remove XSS attack vectors
  return input
    .replace(/[<>\"']/g, '')
    .trim()
    .slice(0, 500); // Limit length
};

// CSRF token management
export const getCsrfToken = (): string | null => {
  return localStorage.getItem('csrf_token');
};

export const setCsrfToken = (token: string): void => {
  localStorage.setItem('csrf_token', token);
};

// JWT validation (client-side basic validation)
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? Date.now() >= payload.exp * 1000 : false;
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

// Rate limiting (client-side)
class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();
  private windowMs: number = 15 * 60 * 1000; // 15 minutes
  private maxAttempts: number = 5;

  check(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Reset if window has passed
    if (now - record.timestamp > this.windowMs) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const loginRateLimiter = new RateLimiter();

// Local storage security
export const secureStorageKey = (key: string): string => {
  // Add app prefix to prevent conflicts
  return `speedy_bites_${key}`;
};

export const getSecureItem = (key: string): string | null => {
  return localStorage.getItem(secureStorageKey(key));
};

export const setSecureItem = (key: string, value: string): void => {
  localStorage.setItem(secureStorageKey(key), value);
};

export const removeSecureItem = (key: string): void => {
  localStorage.removeItem(secureStorageKey(key));
};

export const clearAllSecureItems = (): void => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('speedy_bites_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// Encryption utilities (basic - use proper library in production)
export const encodeData = (data: string): string => {
  return btoa(encodeURIComponent(data));
};

export const decodeData = (encoded: string): string => {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return '';
  }
};

// Security headers for fetch requests
export const getSecureHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Prevent timing attacks with constant-time comparison
export const constantTimeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};
