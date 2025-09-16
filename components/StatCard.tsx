import React from 'react';

interface StatCardProps {
    value: string | number;
    label: string;
    sublabel?: string;
    colorClass?: string;
    icon?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, sublabel, icon, colorClass = 'text-slate-800 dark:text-white' }) => {
    const borderColors: { [key: string]: string } = {
        'text-blue-400': 'from-blue-500 to-blue-400',
        'text-green-400': 'from-green-500 to-green-400',
    };

    const topBorderClass = borderColors[colorClass] || 'from-purple-500 to-indigo-500';

    return (
        <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl p-6 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topBorderClass}`}></div>
            <div className="flex justify-between items-start">
                <div>
                    <div className={`text-2xl sm:text-3xl font-bold mb-1 ${colorClass}`}>{value}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{label}</div>
                </div>
                {icon && <div className="text-gray-300 dark:text-slate-500">{icon}</div>}
            </div>
            {sublabel && <div className="text-xs text-green-400 mt-2">{sublabel}</div>}
        </div>
    );
};

export default StatCard;