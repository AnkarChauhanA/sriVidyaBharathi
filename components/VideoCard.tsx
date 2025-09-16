import React from 'react';
import type { Video } from '../types';
import { PlayPlayerIcon, CheckCircleIcon, CheckCircleSolidIcon } from './Icons';

interface VideoCardProps {
    video: Video;
    onPlay: (video: Video) => void;
    onToggleComplete: (videoId: string) => void;
    watchProgress?: number; // percentage 0-100
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay, onToggleComplete, watchProgress = 0 }) => {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 group relative ${video.completed ? 'opacity-70' : ''}`}>
            <div className="relative">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button 
                        onClick={() => onPlay(video)}
                        className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-white/50 transition-colors"
                        aria-label={`Play video: ${video.title}`}
                    >
                        <PlayPlayerIcon className="w-10 h-10" />
                    </button>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(video.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1 bg-white/50 dark:bg-black/50 rounded-full group/check"
                    aria-label={video.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                    {video.completed ? (
                        <CheckCircleSolidIcon className="w-8 h-8 text-green-500" />
                    ) : (
                        <CheckCircleIcon className="w-8 h-8 text-gray-300 group-hover/check:text-green-400 transition-colors" />
                    )}
                </button>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">{video.subject}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{video.duration}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={video.title}>{video.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">{video.description}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-500 dark:text-slate-400">
                    <span>Class {video.class}</span>
                    <span>{video.views.toLocaleString()} views</span>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200 dark:bg-slate-700">
                {video.completed ? (
                    <div className="h-full bg-green-500" style={{ width: '100%' }}></div>
                ) : (
                    watchProgress > 0 && (
                         <div className="h-full bg-blue-500" style={{ width: `${watchProgress}%` }}></div>
                    )
                )}
            </div>
        </div>
    );
};

export default VideoCard;