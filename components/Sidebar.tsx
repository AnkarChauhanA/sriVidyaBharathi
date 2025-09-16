import React from 'react';
import type { NavItem } from '../types';
import { useAuth } from '../hooks/useAuth';

interface SidebarProps {
    navItems: NavItem[];
    activeItem: string;
    onItemClick: (itemName: string) => void;
    className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, activeItem, onItemClick, className }) => {
    const { user, logout } = useAuth();
    if (!user) return null;

    return (
        <aside className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 flex flex-col border-r border-gray-200 dark:border-slate-700 ${className}`}>
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl font-bold text-white mr-3">🎓</div>
                    <div>
                        <h1 className="text-lg font-bold">SRI VIDYA BHARATHI</h1>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Learn • Grow • Excel</p>
                    </div>
                </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        onClick={() => onItemClick(item.name)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 text-left ${
                            item.name === activeItem
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </button>
                ))}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                <button
                    onClick={logout}
                    className="w-full text-left flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;