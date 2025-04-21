'use client';

import { useState, useEffect } from 'react';
import SlotCard from '@/components/SlotCard';
import TokenDialog from '@/components/TokenDialog';
import OtpDialog from '@/components/OtpDialog';
import { AvailableSlot } from '@/utils/api';

export default function Home() {
  const [darshanSlots, setDarshanSlots] = useState<AvailableSlot[]>([]);
  const [aartiSlots, setAartiSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsAuthError(false);
    
    try {
      // Get the auth token from cookies for the request
      const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];
      
      console.log('🔑 Checking for auth token in cookies:', authToken ? 'Token found' : 'No token');
      
      // Prepare headers with the auth token if available
      const headers: HeadersInit = {};
      if (authToken) {
        headers['x-auth-token'] = authToken;
      }
      
      // Fetch darshan data
      console.log('🔄 Fetching darshan data with headers:', headers);
      const darshanResponse = await fetch('/api/darshan', { headers });
      
      // Check if it's specifically an authentication error
      if (darshanResponse.status === 401) {
        setIsAuthError(true);
        setIsTokenDialogOpen(true);
        throw new Error('Authentication token expired or invalid');
      }
      
      if (!darshanResponse.ok) {
        const errorData = await darshanResponse.json();
        throw new Error(errorData.error || 'Failed to fetch darshan data');
      }
      
      const darshanData = await darshanResponse.json();
      
      // Fetch aarti data
      console.log('🔄 Fetching aarti data with headers:', headers);
      const aartiResponse = await fetch('/api/aarti', { headers });
      
      // Check if it's specifically an authentication error
      if (aartiResponse.status === 401) {
        setIsAuthError(true);
        setIsTokenDialogOpen(true);
        throw new Error('Authentication token expired or invalid');
      }
      
      if (!aartiResponse.ok) {
        const errorData = await aartiResponse.json();
        throw new Error(errorData.error || 'Failed to fetch aarti data');
      }
      
      const aartiData = await aartiResponse.json();
      
      setDarshanSlots(darshanData.availableSlots);
      setAartiSlots(aartiData.availableSlots);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleManualTokenInput = () => {
    setIsTokenDialogOpen(true);
  };

  const handleRelogin = () => {
    console.log('🚨 Relogin button clicked');
    console.log('🔄 Current OTP dialog state:', isOtpDialogOpen);
    setIsOtpDialogOpen(true);
    console.log('🔄 Set OTP dialog state to:', true);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Darshan & Aarti Availability
          </h1>
          
          <div className="flex flex-col md:flex-row md:items-center">
            {lastUpdated && (
              <p className="text-sm text-gray-500 mr-4 mb-2 md:mb-0">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition flex items-center justify-center mb-2 md:mb-0 md:mr-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                'Refresh'
              )}
            </button>
            
            <button
              onClick={handleManualTokenInput}
              className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition mb-2 md:mb-0 md:mr-2"
            >
              Update Token
            </button>
            
            <button
              onClick={handleRelogin}
              className="px-4 py-2 border border-green-300 text-green-600 rounded-md hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition"
            >
              Relogin
            </button>
          </div>
        </div>
        
        {error && (
          <div className={`border-l-4 p-4 mb-6 rounded ${isAuthError ? 'bg-orange-50 border-orange-500' : 'bg-red-50 border-red-500'}`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm ${isAuthError ? 'text-orange-700' : 'text-red-700'}`}>
                  {error}
                </p>
                {isAuthError && (
                  <div className="mt-2 flex space-x-4">
                    <button
                      onClick={handleManualTokenInput}
                      className="text-sm font-medium text-orange-700 hover:text-orange-600"
                    >
                      Update Authentication Token
                    </button>
                    <button
                      onClick={handleRelogin}
                      className="text-sm font-medium text-green-700 hover:text-green-600"
                    >
                      Relogin with OTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Darshan Availability</h2>
            {loading && !darshanSlots.length ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading darshan availability...</p>
              </div>
            ) : darshanSlots.length > 0 ? (
              darshanSlots.map((slot, index) => (
                <SlotCard
                  key={`darshan-${index}`}
                  type="darshan"
                  date={slot.date}
                  formattedDate={slot.formattedDate}
                  slots={slot.slots}
                  minPersons={slot.minPersons}
                  maxPersons={slot.maxPersons}
                  price={slot.price}
                />
              ))
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  {isAuthError 
                    ? 'Authentication required to view darshan slots' 
                    : 'No darshan slots available at this time.'}
                </p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Aarti Availability</h2>
            {loading && !aartiSlots.length ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-3 text-gray-600">Loading aarti availability...</p>
              </div>
            ) : aartiSlots.length > 0 ? (
              aartiSlots.map((slot, index) => (
                <SlotCard
                  key={`aarti-${index}`}
                  type="aarti"
                  date={slot.date}
                  formattedDate={slot.formattedDate}
                  slots={slot.slots}
                  minPersons={slot.minPersons}
                  maxPersons={slot.maxPersons}
                  price={slot.price}
                />
              ))
            ) : (
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-gray-600">
                  {isAuthError 
                    ? 'Authentication required to view aarti slots' 
                    : 'No aarti slots available at this time.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Token dialog */}
      <TokenDialog 
        isOpen={isTokenDialogOpen}
        onClose={() => setIsTokenDialogOpen(false)}
        onTokenSubmit={fetchData}
      />
      
      {/* OTP dialog */}
      <OtpDialog
        isOpen={isOtpDialogOpen}
        onClose={() => {
          console.log('🔄 OtpDialog onClose called, setting isOtpDialogOpen to false');
          setIsOtpDialogOpen(false);
        }}
        onLoginSuccess={() => {
          console.log('🔄 OtpDialog onLoginSuccess called, refreshing data');
          fetchData();
        }}
      />
    </main>
  );
}
