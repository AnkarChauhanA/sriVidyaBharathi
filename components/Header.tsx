import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
    showUploadButton?: boolean;
    onUploadClick?: () => void;
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ showUploadButton = false, onUploadClick, onMenuClick }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('');

    if (!user) return null;

    return (
        <header className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20">
            <div className="flex items-center">
                 <button onClick={onMenuClick} className="lg:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mr-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold text-white mr-3">🎓</div>
                    <div>
                        <h1 className="text-base sm:text-lg font-bold">SRI VIDYA BHARATHI</h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Learn • Grow • Excel</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                {showUploadButton && (
                    <button 
                        onClick={onUploadClick}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 text-sm flex items-center gap-2"
                    >
                        <span className="hidden sm:inline">➕ </span>
                        <span>Upload</span>
                    </button>
                )}
                <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                    {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                </button>
                 <button onClick={logout} className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition hidden sm:block">Logout</button>
                <div className="flex items-center gap-2 sm:gap-3 bg-gray-100 dark:bg-slate-700/50 p-2 rounded-lg">
                    <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm text-white">
                        {getInitials(user.name)}
                    </div>
                    <div className="hidden md:block">
                        <h3 className="font-semibold text-sm">{user.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                            {user.type === 'student' ? `Class ${user.class}` : user.type}
                        </p>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;