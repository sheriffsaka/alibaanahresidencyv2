
import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import { IconBuilding, IconCheckCircle, IconMail, IconAlertTriangle } from './Icon';
import { supabase } from '../lib/supabaseClient';
import { AuthError } from '@supabase/supabase-js';

interface AuthFormProps {
    isLogin: boolean;
    setIsLogin: (isLogin: boolean) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin, setIsLogin }) => {
    const t = useTranslation();
    const { setPage, cmsContent } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
    const [verificationSent, setVerificationSent] = useState<{ email: string } | null>(null);

    const handleLogin = async () => {
        console.log("Attempting login for:", email);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });
        if (error) {
            console.error("Login error:", error.message, error);
            // Catch unconfirmed email errors specifically
            const msgLower = (error.message || '').toLowerCase();
            if (msgLower.includes('email not confirmed') || msgLower.includes('not confirmed') || msgLower.includes('not verified') || (error as any).code === 'email_not_confirmed') {
                throw new Error(`Your email address has not been verified yet. Please check your email inbox (and spam folder) at ${email.trim()} for the verification link before logging in.`);
            }
            if (msgLower.includes('invalid login credentials')) {
                throw new Error('Invalid email or password. Please check your credentials and try again.');
            }
            throw error;
        }
        console.log("Login successful, redirecting to dashboard...");
        setPage('dashboard');
    };
    
    const handleRegister = async () => {
        const cleanEmail = email.trim();
        console.log("Attempting registration for:", cleanEmail);
        const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
                data: {
                    full_name: name.trim(),
                },
            },
        });

        // 1. Check if Supabase returned a duplicate user error directly
        if (error) {
            console.error("Registration error:", error.message, error);
            const msgLower = (error.message || '').toLowerCase();
            const errorCode = (error as any).code || '';
            if (
                msgLower.includes('already registered') || 
                msgLower.includes('already exists') || 
                msgLower.includes('user already exists') ||
                errorCode === 'user_already_exists' ||
                errorCode === 'email_exists' ||
                (error.status === 422 && msgLower.includes('email'))
            ) {
                setIsDuplicateEmail(true);
                throw new Error('An account with this email address already exists. Please log in with your password or use a different email.');
            }
            throw error;
        }

        // 2. Check if Supabase returned an anti-enumeration response (identities is empty array when user exists)
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            console.warn("User already exists (detected via empty identities array):", cleanEmail);
            setIsDuplicateEmail(true);
            throw new Error('An account with this email address already exists. Please log in with your password or use a different email.');
        }

        console.log("Registration completed successfully:", data);
        setVerificationSent({ email: cleanEmail });
        setIsLogin(true); // Switch to login form
        setPassword(''); // Clear password field for login
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setIsDuplicateEmail(false);

        try {
            if (isLogin) {
                await handleLogin();
            } else {
                await handleRegister();
            }
        } catch (err: any) {
             if (err instanceof AuthError) {
                const msgLower = (err.message || '').toLowerCase();
                if (msgLower.includes('already registered') || msgLower.includes('already exists') || msgLower.includes('user already exists')) {
                    setIsDuplicateEmail(true);
                    setError('An account with this email address already exists. Please log in with your password or use a different email.');
                } else {
                    setError(err.message);
                }
             } else if (err instanceof Error) {
                setError(err.message);
             } else {
                setError('An unexpected error occurred.');
             }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div>
                <div className="flex justify-center">
                    <img src={cmsContent.logoUrl} alt="Logo" className="h-20 object-contain" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    {isLogin ? t.loginTitle : t.registerTitle}
                </h2>
            </div>

            {/* Email Verification Banner after Registration */}
            {verificationSent && isLogin && (
                <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-sm animate-fade-in">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                            <IconMail className="w-5 h-5" />
                        </div>
                        <div className="space-y-1.5 text-left text-xs leading-relaxed">
                            <h4 className="font-black text-sm text-amber-950 dark:text-amber-200">
                                Please Verify Your Email Address
                            </h4>
                            <p className="text-amber-800 dark:text-amber-300">
                                A verification link has been sent to <strong className="font-mono underline">{verificationSent.email}</strong>.
                            </p>
                            <p className="text-amber-800 dark:text-amber-300 font-medium">
                                📬 Please check your email inbox (and spam/junk folder) and click the confirmation link to verify your account before logging in to proceed to book.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Email Warning Alert */}
            {isDuplicateEmail && (
                <div className="mt-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 shadow-sm animate-fade-in text-left">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 rounded-xl text-red-600 dark:text-red-400 shrink-0 mt-0.5">
                            <IconAlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="space-y-2 text-xs">
                            <h4 className="font-black text-sm text-red-950 dark:text-red-200">
                                Account Already Exists
                            </h4>
                            <p className="text-red-800 dark:text-red-300 font-medium">
                                An account with the email <strong className="font-mono">{email}</strong> already exists in our system.
                            </p>
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(true);
                                        setError(null);
                                        setIsDuplicateEmail(false);
                                    }}
                                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                                >
                                    Log In with This Email →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                    {!isLogin && (
                        <div>
                            <label htmlFor="full-name" className="sr-only">{t.fullName}</label>
                            <input
                                id="full-name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                                placeholder={t.fullName}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-address" className="sr-only">{t.email}</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (isDuplicateEmail) setIsDuplicateEmail(false);
                            }}
                            className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${isLogin ? 'rounded-t-md' : ''} focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                            placeholder={t.email}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">{t.password}</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-brand-500 focus:border-brand-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder={t.password}
                        />
                    </div>
                </div>
                
                {error && !isDuplicateEmail && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 text-center font-medium leading-relaxed">
                        {error}
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 shadow-md transition-all"
                    >
                        {isLoading ? (
                            <span className="inline-flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>Please wait...</span>
                            </span>
                        ) : (
                            isLogin ? t.login : t.register
                        )}
                    </button>
                </div>
            </form>
            <div className="text-sm text-center mt-4">
                <button 
                    onClick={() => {
                        setIsLogin(!isLogin);
                        setError(null);
                        setIsDuplicateEmail(false);
                    }} 
                    className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                >
                    {isLogin ? t.switchToRegister : t.switchToLogin}
                </button>
            </div>
        </div>
    );
};

export default AuthForm;
