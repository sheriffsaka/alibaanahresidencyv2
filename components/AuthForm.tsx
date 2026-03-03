
import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useTranslation } from '../hooks/useTranslation';
import { IconBuilding } from './Icon';
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
    const [gender, setGender] = useState<'Male' | 'Female'>('Male');
    // Note: Admin login is now handled by Supabase roles, not a checkbox.
    // An admin user would be created manually in the Supabase dashboard with the 'proprietor' role.
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        console.log("Attempting login for:", email);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            console.error("Login error:", error.message);
            throw error;
        }
        console.log("Login successful, redirecting to dashboard...");
        setPage('dashboard');
    };
    
    const handleRegister = async () => {
        console.log("Attempting registration for:", email);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    gender: gender,
                },
            },
        });
        if (error) {
            console.error("Registration error:", error.message);
            throw error;
        }
        console.log("Registration successful:", data);
        alert('Registration successful! Please login.');
        setIsLogin(true); // Switch to login form
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await handleLogin();
            } else {
                await handleRegister();
            }
        } catch (err: any) {
             if (err instanceof AuthError) {
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
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                    {!isLogin && (
                        <>
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
                            <div className="p-3 border-x border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input type="radio" value="Male" checked={gender === 'Male'} onChange={() => setGender('Male')} name="gender" className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">Male</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input type="radio" value="Female" checked={gender === 'Female'} onChange={() => setGender('Female')} name="gender" className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                                        <span className="ml-2 text-sm text-gray-900 dark:text-white">Female</span>
                                    </label>
                                </div>
                            </div>
                        </>
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
                            onChange={(e) => setEmail(e.target.value)}
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
                
                {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400"
                    >
                        {isLoading ? '...' : (isLogin ? t.login : t.register)}
                    </button>
                </div>
            </form>
            <div className="text-sm text-center mt-4">
                <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
                    {isLogin ? t.switchToRegister : t.switchToLogin}
                </button>
            </div>
        </div>
    );
};

export default AuthForm;