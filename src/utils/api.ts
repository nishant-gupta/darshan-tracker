import axios, { AxiosError } from 'axios';
import { getActiveToken } from './cookies';

const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

// Function to get headers with the active token
function getHeaders() {
  return {
    'tof-auth-token': getActiveToken()
  };
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

// Function to fetch darshan availability for a specific date
export async function fetchDarshanByDate(dateString: string): Promise<DarshanAvailability | null> {
  try {
    const url = `${API_BASE_URL}/eDarshan/darshanAvailability/${dateString}/100001`;
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

// Function to fetch aarti availability for a specific date
export async function fetchAartiByDate(dateString: string): Promise<AartiAvailability | null> {
  try {
    const url = `${API_BASE_URL}/eAarti/aartiAvailability/${dateString}`;
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
      
      throw {
        status: axiosError.response.status,
        message: axiosError.response.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data
          ? String(axiosError.response.data.message)
          : 'An error occurred with the API'
      } as ApiError;
    }
  }
  
  throw {
    status: 500,
    message: error instanceof Error ? error.message : 'An unknown error occurred'
  } as ApiError;
}

// Helper function to find available dates from summary
export function findAvailableDates(summary: DarshanSummary | AartiSummary): string[] {
  if (!summary || !summary.startAndEndDates || summary.startAndEndDates.length < 2) {
    return [];
  }
  
  // Convert start and end dates from DD-MMM-YYYY to Date objects
  const startParts = summary.startAndEndDates[0].split('-');
  const endParts = summary.startAndEndDates[1].split('-');
  
  const monthMap: {[key: string]: number} = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  
  const startDate = new Date(
    parseInt(startParts[2]),
    monthMap[startParts[1]],
    parseInt(startParts[0])
  );
  
  const endDate = new Date(
    parseInt(endParts[2]),
    monthMap[endParts[1]],
    parseInt(endParts[0])
  );
  
  // Create a set of booked dates for easy lookup
  const bookedDatesSet = new Set<string>();
  if (summary.bookedDates) {
    summary.bookedDates.forEach(date => bookedDatesSet.add(date));
  }
  
  // Create array to hold available dates
  const availableDates: string[] = [];
  
  // If we have a explicit list of available dates, use that
  if (summary.availableDatesList && summary.availableDatesList.length > 0) {
    return summary.availableDatesList;
  }
  
  // Otherwise, loop through each date from start to end
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Format as YYYY-M-D for comparison with bookedDates
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dateString = `${year}-${month}-${day}`;
    
    // If date is not in bookedDates, add to availableDates
    if (!bookedDatesSet.has(dateString)) {
      availableDates.push(dateString);
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return availableDates;
}

// Function to check for available darshan slots
export async function getAvailableDarshanSlots(): Promise<AvailableSlot[]> {
  try {
    const summary = await fetchDarshanSummary();
    if (!summary) return [];
    
    const availableDates = findAvailableDates(summary);
    const availableSlots: AvailableSlot[] = [];
    
    for (const dateString of availableDates) {
      const data = await fetchDarshanByDate(dateString);
      
      if (data && data.darshanSlots) {
        // Filter only slots with available tickets
        const availableSlotsForDate = data.darshanSlots.filter(
          slot => slot.noOfTicketsAvailable > 0
        );
        
        if (availableSlotsForDate.length > 0) {
          availableSlots.push({
            date: dateString,
            formattedDate: availableSlotsForDate[0].darshanDate,
            slots: availableSlotsForDate,
            minPersons: data.minPersons,
            maxPersons: data.maxPersons,
            price: data.darshanPrice
          });
        }
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available darshan slots:', error);
    handleApiError(error);
    return [];
  }
}

// Function to check for available aarti slots
export async function getAvailableAartiSlots(): Promise<AvailableSlot[]> {
  try {
    const summary = await fetchAartiSummary();
    if (!summary) return [];
    
    const availableDates = findAvailableDates(summary);
    const availableSlots: AvailableSlot[] = [];
    
    for (const dateString of availableDates) {
      const data = await fetchAartiByDate(dateString);
      
      if (data && data.aartiSlots) {
        // Filter only slots with available tickets
        const availableSlotsForDate = data.aartiSlots.filter(
          slot => slot.noOfTicketsAvailable > 0
        );
        
        if (availableSlotsForDate.length > 0) {
          availableSlots.push({
            date: dateString,
            formattedDate: availableSlotsForDate[0].aartiDate,
            slots: availableSlotsForDate,
            minPersons: data.minPersons,
            maxPersons: data.maxPersons,
            price: data.aartiPrice
          });
        }
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error getting available aarti slots:', error);
    handleApiError(error);
    return [];
  }
} 