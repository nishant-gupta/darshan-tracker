// Cookie utility functions for token management
const TOKEN_COOKIE_NAME = 'auth_token';

/**
 * Set the token cookie
 */
export function setTokenCookie(token: string, expirationDays = 30): void {
  try {
    if (!token) {
      console.error('Cannot set cookie: Token is empty or null');
      return;
    }
    
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    document.cookie = `${TOKEN_COOKIE_NAME}=${token};${expires};path=/;SameSite=Strict`;
    
    // Verify the cookie was set
    const cookieExists = document.cookie.split(';').some(item => item.trim().startsWith(`${TOKEN_COOKIE_NAME}=`));
    if (!cookieExists) {
      console.warn('Cookie may not have been set properly. Check browser settings.');
    }
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

/**
 * Get the token from the cookie
 */
export function getTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(`${TOKEN_COOKIE_NAME}=`)) {
      const token = cookie.substring(TOKEN_COOKIE_NAME.length + 1);
      return token;
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
  const envToken = process.env.NEXT_PUBLIC_API_TOKEN || '';
  
  if (cookieToken) {
    return cookieToken;
  } else if (envToken) {
    return envToken;
  } else {
    return '';
  }
}

/**
 * Set token directly from client code
 * This is a workaround function that can be called directly with the token
 * when received from the server
 */
export function setTokenDirectly(token: string): boolean {
  try {
    if (!token) {
      console.error('Cannot set token: Token is empty or null');
      return false;
    }
    
    // Use the regular cookie setting function
    setTokenCookie(token);
    
    // Verify cookie was set
    const cookieExists = document.cookie.split(';').some(item => item.trim().startsWith(`${TOKEN_COOKIE_NAME}=`));
    
    if (cookieExists) {
      return true;
    } else {
      console.error('Failed to set token directly - cookie not found after setting');
      return false;
    }
  } catch (error) {
    console.error('Error setting token directly:', error);
    return false;
  }
} 