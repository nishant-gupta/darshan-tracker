import { NextResponse } from 'next/server';
import { getAvailableAartiSlots, ApiError } from '@/utils/api';

export async function GET() {
  try {
    const availableSlots = await getAvailableAartiSlots();
    return NextResponse.json({ availableSlots });
  } catch (error) {
    console.error('Error in aarti API route:', error);
    
    // Check if it's an authentication error
    if ((error as ApiError).status === 401) {
      return NextResponse.json(
        { error: 'Authentication token expired or invalid' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: (error as ApiError).message || 'Failed to fetch aarti data' },
      { status: (error as ApiError).status || 500 }
    );
  }
} 