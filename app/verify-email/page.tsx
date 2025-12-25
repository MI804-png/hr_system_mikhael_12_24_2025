'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify token
    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify-token',
          token: verificationToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.error || 'Email verification failed');
        if (data.error.includes('expired')) {
          setStatus('expired');
        }
        return;
      }

      setStatus('success');
      setMessage('✓ Your email has been verified successfully!');
      setEmail(data.user?.email || '');

      // Auto-login user
      if (data.shouldAutoLogin && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('emailVerified', 'true');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred during verification. Please try again.');
      console.error('Verification error:', error);
    }
  };

  const resendEmail = async () => {
    if (!email) return;

    try {
      const response = await fetch('/api/auth/email-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend-verification',
          email: email,
        }),
      });

      if (response.ok) {
        alert('✓ Verification email sent! Check your inbox.');
      } else {
        alert('❌ Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending email:', error);
      alert('❌ Error resending verification email');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">HR System</h1>
          <p className="text-gray-600">Email Verification</p>
        </div>

        {/* Status Messages */}
        {status === 'loading' && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 mt-4">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-700 mb-2">Email Verified!</h2>
            <p className="text-green-600 mb-4">{message}</p>
            <p className="text-sm text-gray-600 mb-6">
              Verified email: <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-8">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">❌</div>
              <h2 className="text-2xl font-bold text-red-700">Verification Failed</h2>
            </div>
            <p className="text-red-600 text-center mb-6">{message}</p>

            <div className="space-y-4">
              <Link
                href="/login"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center"
              >
                Back to Login
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="block w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {status === 'expired' && (
          <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-8">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">⏰</div>
              <h2 className="text-2xl font-bold text-yellow-700">Link Expired</h2>
            </div>
            <p className="text-yellow-600 text-center mb-4">
              Your verification link has expired. Please request a new one.
            </p>

            {email && (
              <div className="bg-white border border-yellow-300 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Send new verification link to:</p>
                <p className="font-semibold text-gray-900 mb-4">{email}</p>
                <button
                  onClick={resendEmail}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                >
                  📧 Resend Verification Email
                </button>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-center"
              >
                Back to Login
              </Link>
              <Link
                href="/register"
                className="block w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium text-center"
              >
                Sign Up Again
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center">
          <p className="text-sm text-gray-600">
            Having issues?{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
