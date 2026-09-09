import React, { useState, useEffect } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import { supabase } from '../lib/supabaseClient';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Mail, KeyRound, ArrowRight, Sparkles, Building2 } from 'lucide-react';

export const ActivateAccountPage: React.FC = () => {
  const t = useTranslation();
  const { user, setPage, updateUserSession, sendStudentActivationEmail } = useApp();

  // Auth / session states
  const [sessionEmail, setSessionEmail] = useState<string>('');
  const [hasValidSession, setHasValidSession] = useState<boolean>(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(true);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend link state
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccessMsg, setResendSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Action status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Parse URL query parameter if email was provided
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const emailParam = urlParams.get('email');
      if (emailParam) {
        setResendEmail(emailParam);
        if (!sessionEmail) setSessionEmail(emailParam);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [sessionEmail]);

  // Check Supabase recovery / invitation session
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const tokenHash = urlParams.get('token_hash');
        const type = (urlParams.get('type') as any) || 'recovery';

        // 1. Handle PKCE code exchange if present
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code);
            // Clean up URL parameter to avoid re-exchanging on page reload
            const cleanUrl = window.location.origin + window.location.pathname + '?page=activate';
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (codeErr) {
            console.warn('[ActivateAccountPage] Code exchange notice:', codeErr);
          }
        }

        // 2. Handle token_hash verification if present
        if (tokenHash) {
          try {
            await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
            const cleanUrl = window.location.origin + window.location.pathname + '?page=activate';
            window.history.replaceState({}, document.title, cleanUrl);
          } catch (otpErr) {
            console.warn('[ActivateAccountPage] OTP verify notice:', otpErr);
          }
        }

        // 3. Inspect active session
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setHasValidSession(true);
          setSessionEmail(session.user.email || '');
        } else {
          setHasValidSession(false);
        }
      } catch (err) {
        console.warn('[ActivateAccountPage] Session inspection notice:', err);
      } finally {
        if (isMounted) setIsVerifyingSession(false);
      }
    };

    checkSession();

    // Listen to auth state changes (e.g. Supabase processing recovery hash)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setHasValidSession(true);
        setSessionEmail(session.user.email || '');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Handle resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the user's password using Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        password: password,
        data: {
          is_pending_activation: false,
          activated_at: new Date().toISOString()
        }
      });

      if (error) throw error;

      // Update profile timestamp if session user exists
      if (data.user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);
        } catch {
          // Non-blocking profile update
        }
      }

      setIsSuccess(true);

      // Refresh session in context
      const { data: refreshedSession } = await supabase.auth.getSession();
      if (refreshedSession?.session) {
        await updateUserSession(refreshedSession.session);
      }

      // Automatically redirect to student dashboard after a brief delay
      setTimeout(() => {
        setPage('dashboard');
      }, 1600);
    } catch (err: any) {
      console.error('[ActivateAccountPage] Activation error:', err);
      setErrorMessage(err.message || 'Failed to activate account. The activation link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendActivationLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendSuccessMsg(null);
    setErrorMessage(null);

    const targetEmail = (resendEmail || sessionEmail).trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsResending(true);
    try {
      const res = await sendStudentActivationEmail({
        email: targetEmail
      });

      if (res.success) {
        setResendSuccessMsg(`Activation instructions have been sent to ${targetEmail}. Please check your inbox and spam folder.`);
        setResendCooldown(60); // 60-second rate limiting cooldown
      } else {
        setErrorMessage(res.error || 'Unable to send activation email. Please check the email address or contact support.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while sending the activation link.');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerifyingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Verifying your secure activation credentials...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl mb-4 border border-emerald-200 dark:border-emerald-800">
          <KeyRound className="w-8 h-8 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Set Up Your Account
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Welcome to Al-Ibaanah Student Residency. Please create your personal password to activate your account and access your room booking.
        </p>
      </div>

      {/* Success Notification Card */}
      {isSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-6 mb-6 text-center animate-fade-in shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full mb-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
            Account Activated Successfully!
          </h2>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
            Your personal password has been saved. Loading your student dashboard and room booking...
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="animate-spin rounded-full h-3 w-3 border-b border-current"></span>
            <span>Redirecting to your dashboard...</span>
          </div>
        </div>
      )}

      {!isSuccess && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Active Session: Password Setup Form */}
          {hasValidSession ? (
            <form onSubmit={handleActivateAccount} className="p-6 sm:p-8 space-y-5">
              {sessionEmail && (
                <div className="bg-gray-50 dark:bg-gray-900/60 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Student Account Email</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{sessionEmail}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    Verified Link
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password (min. 6 characters)"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 6 characters with letters and numbers.
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    required
                    minLength={6}
                    className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-400 dark:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match.</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Passwords match!
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (!!confirmPassword && password !== confirmPassword)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition duration-150 flex items-center justify-center space-x-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Activate Account & Save Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setPage('auth')}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  Already have an active password? <span className="font-medium underline">Log in here</span>
                </button>
              </div>
            </form>
          ) : (
            /* No Active Session / Expired Link: Request Activation Link Form */
            <div className="p-6 sm:p-8 space-y-5">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-3 text-amber-800 dark:text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Secure Activation Link Required</p>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    If you arrived here directly or your link has expired, enter your registered email address below. We will send you a secure link to set your password.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {resendSuccessMsg && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start space-x-3 text-emerald-800 dark:text-emerald-300 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{resendSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleResendActivationLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Registered Student Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="e.g. student@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResending || resendCooldown > 0}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition duration-150 flex items-center justify-center space-x-2 text-sm"
                >
                  {isResending ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      <span>Sending Secure Link...</span>
                    </>
                  ) : resendCooldown > 0 ? (
                    <span>Wait {resendCooldown}s to Resend</span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Activation Link</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
                <button
                  type="button"
                  onClick={() => setPage('auth')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition underline"
                >
                  Back to Student Login
                </button>
                <button
                  type="button"
                  onClick={() => setPage('support')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                >
                  Need assistance? Contact Support
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivateAccountPage;
