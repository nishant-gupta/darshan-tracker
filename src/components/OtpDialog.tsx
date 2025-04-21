import React, { useState, useEffect } from 'react';
import { sendOtp, validateOtp } from '@/utils/api';

interface OtpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

enum LoginStep {
  SEND_OTP,
  VERIFY_OTP
}

const DEFAULT_EMAIL = ""; // Pre-filled email

export default function OtpDialog({ isOpen, onClose, onLoginSuccess }: OtpDialogProps) {
  const [step, setStep] = useState<LoginStep>(LoginStep.SEND_OTP);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep(LoginStep.SEND_OTP);
      setOtp('');
      setUserId('');
      setError('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    
    try {
      const response = await sendOtp({
        emailId: email,
        otpType: "Resend",
        emailFlag: 1,
        aartiFlag: 1
      });
      
      if (!response.userId) {
        throw new Error('No userId returned from server');
      }
      
      setUserId(response.userId);
      setMessage('OTP has been sent to your email. Please check and enter the OTP below.');
      setStep(LoginStep.VERIFY_OTP);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Failed to send OTP: ${err.message}` 
        : 'Failed to send OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    
    if (!userId) {
      setError('Missing user information. Please try again from the beginning.');
      setStep(LoginStep.SEND_OTP);
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const otpData = {
        userId: userId,
        otp: otp.trim(),
        otpType: "Resend" as const
      };
      
      const response = await validateOtp(otpData);
      
      if (response.loginSuccess) {
        setMessage('Login successful! Refreshing data...');
        
        // Wait a bit to let token cookie be properly set
        setTimeout(() => {
          onLoginSuccess();
          
          setTimeout(() => {
            onClose();
          }, 1000);
        }, 500);
      } else {
        setError(response.statusMessage || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? `Failed to verify OTP: ${err.message}` 
        : 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === LoginStep.SEND_OTP) {
      handleSendOtp();
    } else {
      handleVerifyOtp();
    }
  };

  const handleBackToSendOtp = () => {
    setStep(LoginStep.SEND_OTP);
    setOtp('');
    setError('');
    setMessage('');
  };
  
  if (!isOpen) {
    return null;
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
            <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
            </svg>
          </div>
          <h2 className="ml-3 text-xl font-bold text-gray-800">
            {step === LoginStep.SEND_OTP ? 'Login with OTP' : 'Verify OTP'}
          </h2>
        </div>
        
        {message && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {step === LoginStep.SEND_OTP ? (
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                We will send an OTP to this email for verification.
              </p>
            </div>
          ) : (
            <div className="mb-4">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the OTP sent to your email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={handleBackToSendOtp}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                disabled={loading}
              >
                Change email or resend OTP
              </button>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                loading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {step === LoginStep.SEND_OTP ? 'Sending...' : 'Verifying...'}
                </span>
              ) : (
                step === LoginStep.SEND_OTP ? 'Send OTP' : 'Verify'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 