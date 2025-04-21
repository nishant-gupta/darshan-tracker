import { NextResponse } from 'next/server';
import { ApiError } from '@/utils/api';
import axios from 'axios';

const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

// Helper function to get available aarti slots with the provided token
async function getAvailableAartiSlots(token: string) {
  try {
    // Get aarti summary
    const summaryUrl = `${API_BASE_URL}/eAarti/aartiSummary`;
    const summaryResponse = await axios.get(summaryUrl, {
      headers: {
        'tof-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    
    const summary = summaryResponse.data;
    if (!summary) {
      return [];
    }
    
    // Extract available dates
    const availableDates = summary.availableDatesList || [];
    
    // Array to hold available slots
    const availableSlots = [];
    
    // For each available date, get the aarti slots
    for (const dateString of availableDates) {
      const detailUrl = `${API_BASE_URL}/eAarti/aartiAvailability/${dateString}`;
      const detailResponse = await axios.get(detailUrl, {
        headers: {
          'tof-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const data = detailResponse.data;

      console.log('🔍 Aarti data for date:', dateString, data);
      if (data && data.aartiSlots) {
        const availableSlotsForDate = data.aartiSlots;
        
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
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // Try to get token from request headers first
    const authToken = request.headers.get('x-auth-token');
    
    // Use environment variable token as backup
    const token = authToken || process.env.NEXT_PUBLIC_API_TOKEN;
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Get available aarti slots
    const slots = await getAvailableAartiSlots(token);
    
    // Return the slots
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error in aarti API route:', error);
    
    if ((error as ApiError)?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication token expired or invalid' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get available aarti slots' },
      { status: 500 }
    );
  }
} 