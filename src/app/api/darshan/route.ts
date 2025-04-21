import { NextResponse } from 'next/server';
import { ApiError } from '@/utils/api';
import axios from 'axios';

const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

// Helper function to get available darshan slots with the provided token
async function getAvailableDarshanSlots(token: string) {
  try {
    // Get darshan summary
    const summaryUrl = `${API_BASE_URL}/eDarshan/darshansummary/100001`;
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
    
    // For each available date, get the darshan slots
    for (const dateString of availableDates) {
      const detailUrl = `${API_BASE_URL}/eDarshan/darshanmasterdetailsbydate/${dateString}/100001`;
      const detailResponse = await axios.get(detailUrl, {
        headers: {
          'tof-auth-token': token,
          'Content-Type': 'application/json'
        }
      });
      
      const data = detailResponse.data;
      if (data && data.darshanSlots) {
        const availableSlotsForDate = data.darshanSlots;
        
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
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    // Try to get token from request headers first
    const authToken = request.headers.get('tof-auth-token');
    
    // Use environment variable token as backup
    const token = authToken || process.env.NEXT_PUBLIC_API_TOKEN;
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    // Get available darshan slots
    const slots = await getAvailableDarshanSlots(token);
    
    // Return the slots
    return NextResponse.json({ slots });
  } catch (error) {
    console.error('Error in darshan API route:', error);
    
    if ((error as ApiError)?.status === 401) {
      return NextResponse.json(
        { error: 'Authentication token expired or invalid' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to get available darshan slots' },
      { status: 500 }
    );
  }
} 