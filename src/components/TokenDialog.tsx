import React, { useState } from 'react';
import { setTokenCookie } from '@/utils/cookies';

interface TokenDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSubmit: () => void;
}

export default function TokenDialog({ isOpen, onClose, onTokenSubmit }: TokenDialogProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    try {
      setTokenCookie(token.trim());
      onTokenSubmit();
      onClose();
    } catch (err) {
      setError('Failed to save token. Please try again.');
      console.error('Error saving token:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 bg-orange-100 rounded-full p-2">
            <svg className="h-6 w-6 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v1m0 0v1m0-1h1m-1 0h-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="ml-3 text-xl font-bold text-gray-800">Authentication Required</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          Your authentication token has expired or is invalid. Please enter a new authentication token to access the darshan and aarti availability data.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Token
            </label>
            <input
              type="text"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your token"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Update Token
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 