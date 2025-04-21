// Cookie utility functions for token management
const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * Set the token cookie
 */
export function setTokenCookie(token: string, expirationDays = 30): void {
  const date = new Date();
  date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${TOKEN_COOKIE_NAME}=${token};${expires};path=/;SameSite=Strict`;
}

/**
 * Get the token from the cookie
 */
export function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${TOKEN_COOKIE_NAME}=`)) {
      return cookie.substring(TOKEN_COOKIE_NAME.length + 1);
    }
  }
  return null;
}

/**
 * Remove the token cookie
 */
export function removeTokenCookie(): void {
  document.cookie = `${TOKEN_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
}

/**
 * Get the active token (from cookie if available, otherwise from env)
 */
export function getActiveToken(): string {
  const cookieToken = typeof window !== 'undefined' ? getTokenFromCookie() : null;
  return cookieToken || process.env.NEXT_PUBLIC_API_TOKEN || '';
} 