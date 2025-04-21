import { NextResponse } from 'next/server';
import axios from 'axios';
import { getActiveToken } from '@/utils/cookies';

const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

export async function POST(request: Request) {
  try {
    // Get the request data
    const data = await request.json();
    
    // Make request to external API
    const url = `${API_BASE_URL}/account/resendOtp`;
    
    const response = await axios.post(url, data, {
      headers: {
        'tof-auth-token': getActiveToken(),
        'Content-Type': 'application/json'
      }
    });
    
    // Return the response data
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in send-otp API route:', error);
    
    // Extract error details
    let statusCode = 500;
    let errorMessage = 'Failed to send OTP';
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        statusCode = error.response.status;
        errorMessage = error.response.data?.message || 'Error from external API';
      } else if (error.request) {
        errorMessage = 'No response received from external API';
      } else {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
} 