import axios, { AxiosError } from 'axios';
import { getActiveToken, setTokenCookie, setTokenDirectly } from './cookies';

// Log API configuration
const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

// Function to get headers with the active token
function getHeaders() {
  const token = getActiveToken();
  return {
    'tof-auth-token': token
  };
}

// Types for login functionality
export interface SendOtpRequest {
  emailId: string;
  otpType: 'Resend' | 'Login';
  emailFlag: number;
  aartiFlag: number;
}

export interface ValidateOtpRequest {
  userId: string;
  otp: string;
  otpType: 'Resend' | 'Login';
}

export interface OtpResponse {
  userId: string;
  statusMessage: string | null;
  actionMsg: string | null;
}

export interface ValidateOtpResponse {
  userId: number;
  userStatus: boolean;
  statusMessage: string | null;
  actionMsg: string | null;
  piligrimTimeOut: string;
  loginSuccess: boolean;
  authToken?: string;
  authTokenPresent: boolean;
}

// Function to send OTP
export async function sendOtp(data: SendOtpRequest): Promise<OtpResponse> {
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send OTP');
    }
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

// Function to validate OTP and save token
export async function validateOtp(data: ValidateOtpRequest): Promise<ValidateOtpResponse> {
  try {
    const response = await fetch('/api/auth/validate-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to validate OTP');
    }
    
    const responseData = await response.json();
    
    // Try to get auth token from multiple sources
    // 1. From response headers (both possible names)
    const headerToken = response.headers.get('tof-auth-token') || response.headers.get('x-auth-token');
    
    // 2. From response body
    const bodyToken = responseData.authToken;
    
    // Use token from any available source
    const authToken = headerToken || bodyToken;
    
    if (authToken && responseData.loginSuccess) {
      // Try multiple methods to set the token
      try {
        // Method 1: Standard cookie setting
        setTokenCookie(authToken);
        
        // Method 2: Direct setting
        setTokenDirectly(authToken);
        
        // Verify the cookie is set
        document.cookie.split(';').some(
          item => item.trim().startsWith('auth_token=')
        );
      } catch (cookieError) {
        console.error('Error saving token to cookie:', cookieError);
      }
    }
    
    // Remove the token from the response we return (for security)
    if ('authToken' in responseData) {
      // Create a copy of the response without the tokens
      const cleanResponseData = { ...responseData };
      delete cleanResponseData.authToken;
      delete cleanResponseData.authTokenPresent;
      return cleanResponseData;
    }
    
    return responseData;
  } catch (error) {
    console.error('Error validating OTP:', error);
    throw error;
  }
}

// Types for the API responses
export interface DarshanSummary {
  availableDatesList: string[];
  startAndEndDates: string[];
  blockedDates: string[];
  bookedDates: string[];
  minCount: string;
  maxCount: string;
}

export interface DarshanSlot {
  darshanDate: string;
  slotId: number;
  slotName: string;
  noOfTicketsAvailable: number;
  slotBeginTime: string;
  slotEndTime: string;
  reportingTime: string;
}

export interface DarshanAvailability {
  darshanSlots: DarshanSlot[] | null;
  minPersons: number;
  maxPersons: number;
  darshanPrice: number | null;
  flag: string;
}

export interface AartiSummary {
  availableDatesList: string[];
  startAndEndDates: string[];
  blockedDates: string[];
  bookedDates: string[];
  minCount: string;
  maxCount: string;
}

export interface AartiSlot {
  aartiDate: string;
  slotId: number;
  slotName: string;
  noOfTicketsAvailable: number;
  slotBeginTime: string;
  slotEndTime: string;
  reportingStartTime: string;
  reportingEndTime: string;
}

export interface AartiAvailability {
  aartiSlots: AartiSlot[] | null;
  minPersons: number;
  maxPersons: number;
  aartiPrice: number | null;
  flag: string;
}

export interface AvailableSlot {
  date: string;
  formattedDate: string;
  slots: (DarshanSlot | AartiSlot)[];
  minPersons: number;
  maxPersons: number;
  price: number | null;
}

// API Error type
export interface ApiError {
  status: number;
  message: string;
}

// Function to fetch darshan summary
export async function fetchDarshanSummary(): Promise<DarshanSummary | null> {
  try {
    const url = `${API_BASE_URL}/eDarshan/darshansummary/100001`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching darshan summary:', error);
    handleApiError(error);
    return null;
  }
}

// Function to fetch darshan data for a specific date
export async function fetchDarshanByDate(dateString: string): Promise<DarshanAvailability | null> {
  try {
    const url = `${API_BASE_URL}/eDarshan/darshanmasterdetailsbydate/${dateString}/100001`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching darshan data for ${dateString}:`, error);
    handleApiError(error);
    return null;
  }
}

// Function to fetch aarti summary
export async function fetchAartiSummary(): Promise<AartiSummary | null> {
  try {
    const url = `${API_BASE_URL}/eAarti/aartiSummary`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    console.error('Error fetching aarti summary:', error);
    handleApiError(error);
    return null;
  }
}

// Function to fetch aarti data for a specific date
export async function fetchAartiByDate(dateString: string): Promise<AartiAvailability | null> {
  try {
    const url = `${API_BASE_URL}/eAarti/aartiMasterDetailsByDate/${dateString}`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    console.error(`Error fetching aarti data for ${dateString}:`, error);
    handleApiError(error);
    return null;
  }
}

// Handle API errors, throw specific error for 401 unauthorized
function handleApiError(error: unknown): void {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    if (axiosError.response) {
      if (axiosError.response.status === 401) {
        throw {
          status: 401,
          message: 'Authentication token expired or invalid'
        } as ApiError;
      }
      
      const errorMessage = axiosError.response.data && 
                        typeof axiosError.response.data === 'object' && 
                        'message' in axiosError.response.data
                          ? String(axiosError.response.data.message)
                          : 'An error occurred with the API';
      
      throw {
        status: axiosError.response.status,
        message: errorMessage
      } as ApiError;
    }
  }
  
  // Generic error handling for non-axios errors
  const genericMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  
  throw {
    status: 500,
    message: genericMessage
  } as ApiError;
}

// Utility function to format a date to display format
export function formatDateForDisplay(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

// Utility function to find available dates from summary
export function findAvailableDates(summary: DarshanSummary | AartiSummary): string[] {
  if (!summary || !summary.availableDatesList) {
    return [];
  }
  
  // Filter and sort available dates
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return summary.availableDatesList
    .filter(dateStr => {
      try {
        const date = new Date(dateStr);
        return date >= now;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      } catch {
        return 0;
      }
    });
}

// Function to get all available darshan slots
export async function getAvailableDarshanSlots(): Promise<AvailableSlot[]> {
  try {
    const summary = await fetchDarshanSummary();
    if (!summary) {
      return [];
    }
    
    // Filter and sort available dates
    const availableDates = findAvailableDates(summary);
    
    // Array to hold all slots across available dates
    const availableSlots: AvailableSlot[] = [];
    
    // Fetch slots for each available date
    for (const dateString of availableDates) {
      const availability = await fetchDarshanByDate(dateString);
      
      if (!availability) continue;
      
      // Skip if no slots available
      const availableSlotsForDate = availability.darshanSlots || [];
      if (availableSlotsForDate.length === 0) continue;
      
      // Add this date with its slots to our result
      availableSlots.push({
        date: dateString,
        formattedDate: formatDateForDisplay(dateString),
        slots: availableSlotsForDate,
        minPersons: availability.minPersons,
        maxPersons: availability.maxPersons,
        price: availability.darshanPrice
      });
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available darshan slots:', error);
    return [];
  }
}

// Function to get all available aarti slots
export async function getAvailableAartiSlots(): Promise<AvailableSlot[]> {
  try {
    const summary = await fetchAartiSummary();
    if (!summary) {
      return [];
    }
    
    // Filter and sort available dates
    const availableDates = findAvailableDates(summary);
    
    // Array to hold all slots across available dates
    const availableSlots: AvailableSlot[] = [];
    
    // Fetch slots for each available date
    for (const dateString of availableDates) {
      const availability = await fetchAartiByDate(dateString);
      
      if (!availability) continue;
      
      // Skip if no slots available
      const availableSlotsForDate = availability.aartiSlots || [];
      if (availableSlotsForDate.length === 0) continue;
      
      // Add this date with its slots to our result
      availableSlots.push({
        date: dateString,
        formattedDate: formatDateForDisplay(dateString),
        slots: availableSlotsForDate,
        minPersons: availability.minPersons,
        maxPersons: availability.maxPersons,
        price: availability.aartiPrice
      });
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available aarti slots:', error);
    return [];
  }
} 