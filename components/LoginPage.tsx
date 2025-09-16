import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { EyeIcon, EyeOffIcon } from './Icons';
import type { User } from '../types';

const LoginPage: React.FC = () => {
    const [userType, setUserType] = useState<'student' | 'admin'>('student');
    const [action, setAction] = useState<'login' | 'register'>('login');
    const [error, setError] = useState<string | null>(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    const { login, register } = useAuth();
    
    const resetFormState = () => {
        setError(null);
        setShowLoginPrompt(false);
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        resetFormState();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        try {
            await login(email, password);
        } catch (err) {
            setError((err as Error).message);
        }
    };
    
    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        resetFormState();
        const formData = new FormData(e.currentTarget);
        const studentData: Omit<User, 'id' | 'type' | 'status'> = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            class: formData.get('class') as '8' | '9' | '10',
            password: formData.get('password') as string,
        };
        try {
            await register(studentData);
        } catch (err) {
            if ((err as Error).message === 'Email already exists') {
                setError('An account with this email already exists.');
                setShowLoginPrompt(true);
            } else {
                setError((err as Error).message);
            }
        }
    };

    const handleForgotPassword = () => {
        alert('Password reset functionality is not yet implemented.');
    };

    const TabButton: React.FC<{ text: string, isActive: boolean, onClick: () => void, icon?: string }> = ({ text, isActive, onClick, icon }) => (
        <button
            onClick={onClick}
            className={`flex-1 p-3 text-sm font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-slate-600 hover:text-gray-700 dark:hover:text-slate-200'}`}
        >
            {icon && <span className="mr-2">{icon}</span>}
            {text}
        </button>
    );

    const PasswordInput: React.FC = () => {
        const [visible, setVisible] = useState(false);
        return (
            <div className="relative">
                <input
                    name="password"
                    type={visible ? 'text' : 'password'}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={action === 'login' ? "Enter your password" : "Create a password"}
                    required
                />
                <button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-slate-400">
                    {visible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
            <div className="w-full max-w-md bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-200">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-3xl rounded-xl mb-4">🎓</div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">SRI VIDYA BHARATHI</h1>
                    <p className="text-gray-500 dark:text-slate-400">Learn • Grow • Excel</p>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Welcome to SRI VIDYA BHARATHI</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Access your learning journey</p>
                </div>

                <div className="flex bg-gray-200 dark:bg-slate-700 rounded-xl p-1 mb-6">
                    <TabButton text="Student" icon="👤" isActive={userType === 'student'} onClick={() => { setUserType('student'); resetFormState(); }} />
                    <TabButton text="Admin" icon="👨‍💼" isActive={userType === 'admin'} onClick={() => { setUserType('admin'); resetFormState(); }} />
                </div>

                {userType === 'student' && (
                    <div className="flex bg-gray-200 dark:bg-slate-700 rounded-xl p-1 mb-6">
                        <TabButton text="Login" isActive={action === 'login'} onClick={() => { setAction('login'); resetFormState(); }} />
                        <TabButton text="Register" isActive={action === 'register'} onClick={() => { setAction('register'); resetFormState(); }} />
                    </div>
                )}
                
                {error && !showLoginPrompt && (
                    <div className="bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/50 dark:border-red-500/50 dark:text-red-400 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>
                )}
                {error && showLoginPrompt && (
                     <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 dark:bg-yellow-900/50 dark:border-yellow-500 dark:text-yellow-300 p-4 mb-4" role="alert">
                        <p className="font-bold">{error}</p>
                        <p className="text-sm">Please log in to access your account.</p>
                        <button
                            onClick={() => {
                                setAction('login');
                                resetFormState();
                            }}
                            className="mt-2 text-sm font-bold text-blue-600 hover:underline"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {/* Forms */}
                <div className="space-y-4">
                    {userType === 'student' && action === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Email</label>
                                <input name="email" type="email" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter your email" required />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300">Password</label>
                                    <button type="button" onClick={handleForgotPassword} className="text-sm text-blue-600 hover:underline">Forgot Password?</button>
                                </div>
                                <PasswordInput />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">Sign In</button>
                        </form>
                    )}

                    {userType === 'student' && action === 'register' && (
                         <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Full Name</label>
                                <input name="name" type="text" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter your full name" required />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Email</label>
                                <input name="email" type="email" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter your email" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Class</label>
                                <select name="class" required className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <option value="">Select your class</option>
                                    <option value="8">Class 8</option>
                                    <option value="9">Class 9</option>
                                    <option value="10">Class 10</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Password</label>
                                <PasswordInput />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">Create Account</button>
                        </form>
                    )}

                    {userType === 'admin' && (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Admin Email</label>
                                <input name="email" type="email" defaultValue="admin@srividyabharathi.com" className="w-full px-4 py-3 bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Enter admin email" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Password</label>
                                <PasswordInput />
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">Admin Sign In</button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;