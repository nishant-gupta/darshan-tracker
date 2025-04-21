import { NextResponse } from 'next/server';
import axios from 'axios';
import { getActiveToken } from '@/utils/cookies';

const API_BASE_URL = 'https://online.srjbtkshetra.org/api/v1';

export async function POST(request: Request) {
  try {
    // Get the request data
    const data = await request.json();
    
    // Make request to external API
    const url = `${API_BASE_URL}/account/validateOtp`;
    
    const response = await axios.post(url, data, {
      headers: {
        'tof-auth-token': getActiveToken(),
        'Content-Type': 'application/json'
      }
    });
    
    // Get the auth token from response headers
    const authToken = response.headers['tof-auth-token'] || response.headers['x-auth-token'];
    
    // Create our response
    const responseData = response.data;
    
    // Check if we have a token
    if (authToken) {
      // Add token info to the response data
      responseData.authToken = authToken;
      responseData.authTokenPresent = true;
    } else {
      responseData.authTokenPresent = false;
    }
    
    // Add the token to the response
    const clientResponse = NextResponse.json(responseData);
    
    return clientResponse;
  } catch (error) {
    console.error('Error in validate-otp API route:', error);
    
    // Extract error details
    let statusCode = 500;
    let errorMessage = 'Failed to validate OTP';
    
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