import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useVideos } from '../hooks/useVideos';
import { useProgress } from '../hooks/useProgress';
import { useToast } from '../hooks/useToast';
import { STUDENT_NAV_ITEMS } from '../constants';
import Sidebar from './Sidebar';
import Header from './Header';
import VideoCard from './VideoCard';
import VideoPlayer from './VideoPlayer';
import StatCard from './StatCard';
import type { Video } from '../types';
import { CheckCircleIcon, ClockIcon } from './Icons';

type StudentView = 'Dashboard' | 'My Videos' | 'Subjects' | 'Settings';

const parseDuration = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
};

const formatTotalDuration = (totalSeconds: number): string => {
    if (totalSeconds === 0) return '0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0 || hours === 0) {
        result += `${minutes}m`;
    }
    return result.trim();
};

const StudentSettingsView: React.FC = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const { showToast } = useToast();
    
    // Profile states
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    
    // Password states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProfileSaving(true);
        try {
            await updateProfile({ name, email });
            showToast("Profile updated successfully!", "success");
        } catch (error) {
            showToast((error as Error).message, "error");
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", "error");
            return;
        }
        if (newPassword.length < 6) {
            showToast("Password must be at least 6 characters long.", "error");
            return;
        }
        setIsPasswordSaving(true);
        try {
            await changePassword(currentPassword, newPassword);
            showToast("Password changed successfully!", "success");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            showToast((error as Error).message, "error");
        } finally {
            setIsPasswordSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl mx-auto">
            {/* Profile Settings */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Your Profile</h3>
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Full Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" required className="w-full form-input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Email Address</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="w-full form-input" />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isProfileSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                            {isProfileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Current Password</label>
                        <input value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required className="w-full form-input" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">New Password</label>
                        <input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required className="w-full form-input" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Confirm New Password</label>
                        <input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required className="w-full form-input" />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isPasswordSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                            {isPasswordSaving ? 'Saving...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
             <style>{`.form-input { background-color: white; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.5rem 0.75rem; width: 100%; } .dark .form-input { background-color: #334155; border-color: #475569; color: #e2e8f0; }`}</style>
        </div>
    );
};


const StudentDashboard: React.FC = () => {
    const { user } = useAuth();
    const { videos, toggleVideoCompletion } = useVideos();
    const { progress, updateProgress } = useProgress();
    const [activeView, setActiveView] = useState<StudentView>('Dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [watchingVideoId, setWatchingVideoId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleNavItemClick = (itemName: string) => {
        setActiveView(itemName as StudentView);
        setSidebarOpen(false);
    };
    
    const handlePlayVideo = (video: Video) => {
        setWatchingVideoId(video.id);
    };

    const handleClosePlayer = () => {
        setWatchingVideoId(null);
    };

    const handleProgressUpdate = (videoId: string, currentTime: number, duration: number) => {
        if (user) {
            updateProgress(videoId, currentTime, duration);
        }
    };

    const selectedVideo = useMemo(() => {
        if (!watchingVideoId) return null;
        return videos.find(v => v.id === watchingVideoId) ?? null;
    }, [videos, watchingVideoId]);

    const studentVideos = useMemo(() => {
        if (!user || user.type !== 'student') return [];
        return videos.filter(video => video.class === user.class && video.status === 'published');
    }, [videos, user]);

    const filteredVideos = useMemo(() => {
        if (!searchTerm) return studentVideos;
        const lowercasedFilter = searchTerm.toLowerCase();
        return studentVideos.filter(video =>
            video.title.toLowerCase().includes(lowercasedFilter) ||
            video.description.toLowerCase().includes(lowercasedFilter) ||
            video.subject.toLowerCase().includes(lowercasedFilter)
        );
    }, [studentVideos, searchTerm]);

    const completionStats = useMemo(() => {
        const completedVideos = studentVideos.filter(v => v.completed);
        const totalCompleted = completedVideos.length;
        const totalWatchTimeSeconds = completedVideos.reduce((total, video) => total + parseDuration(video.duration), 0);
        return {
            totalCompleted,
            formattedWatchTime: formatTotalDuration(totalWatchTimeSeconds),
        };
    }, [studentVideos]);

    const recommendedVideos = useMemo(() => {
        if (!user || !videos.length || !progress) return [];

        const unwatchedVideos = studentVideos.filter(v => !v.completed);
        if (unwatchedVideos.length === 0) return [];

        const subjectWatchTimes: { [subject: string]: number } = {};
        Object.keys(progress).forEach(videoId => {
            const videoProgress = progress[videoId];
            const videoDetails = videos.find(v => v.id === videoId);
            if (videoDetails && videoProgress) {
                subjectWatchTimes[videoDetails.subject] = (subjectWatchTimes[videoDetails.subject] || 0) + videoProgress.progress;
            }
        });

        const sortedSubjects = Object.keys(subjectWatchTimes).sort((a, b) => subjectWatchTimes[b] - subjectWatchTimes[a]);

        const recommendations: Video[] = [];
        const recommendedIds = new Set<string>();

        sortedSubjects.forEach(subject => {
            const subjectVideos = unwatchedVideos.filter(v => v.subject === subject && !recommendedIds.has(v.id));
            subjectVideos.forEach(video => {
                if (recommendations.length < 4) {
                    recommendations.push(video);
                    recommendedIds.add(video.id);
                }
            });
        });

        if (recommendations.length < 4) {
            unwatchedVideos.forEach(video => {
                if (recommendations.length < 4 && !recommendedIds.has(video.id)) {
                    recommendations.push(video);
                    recommendedIds.add(video.id);
                }
            });
        }

        return recommendations;
    }, [videos, user, progress, studentVideos]);


    const renderContent = () => {
        switch (activeView) {
            case 'Dashboard':
            case 'My Videos':
            case 'Subjects':
                return (
                    <div>
                        <div className="mb-6">
                             <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                                {activeView === 'Dashboard' ? `Welcome, ${user?.name.split(' ')[0]}!` : activeView}
                            </h2>
                            {activeView === 'Dashboard' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                    <StatCard
                                        value={completionStats.totalCompleted}
                                        label="Videos Completed"
                                        colorClass="text-green-400"
                                        icon={<CheckCircleIcon className="w-8 h-8" />}
                                    />
                                    <StatCard
                                        value={completionStats.formattedWatchTime}
                                        label="Total Watch Time"
                                        colorClass="text-blue-400"
                                        icon={<ClockIcon className="w-8 h-8" />}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <h3 className="text-xl font-semibold">Your Videos</h3>
                            <div className="w-full sm:w-auto">
                                <input
                                    type="text"
                                    placeholder="Search videos..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        {filteredVideos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredVideos.map(video => {
                                    const videoProgress = progress[video.id];
                                    const watchPercentage = videoProgress && videoProgress.duration > 0
                                        ? (videoProgress.progress / videoProgress.duration) * 100
                                        : 0;

                                    return (
                                        <VideoCard 
                                            key={video.id} 
                                            video={video} 
                                            onPlay={handlePlayVideo} 
                                            onToggleComplete={toggleVideoCompletion}
                                            watchProgress={watchPercentage}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-lg text-gray-500 dark:text-slate-400">No videos found matching your search.</p>
                            </div>
                        )}

                        {recommendedVideos.length > 0 && (
                             <div className="mt-12">
                                <h3 className="text-xl font-semibold mb-6">Recommended For You</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {recommendedVideos.map(video => {
                                        const videoProgress = progress[video.id];
                                        const watchPercentage = videoProgress && videoProgress.duration > 0
                                            ? (videoProgress.progress / videoProgress.duration) * 100
                                            : 0;

                                        return (
                                            <VideoCard 
                                                key={video.id} 
                                                video={video} 
                                                onPlay={handlePlayVideo} 
                                                onToggleComplete={toggleVideoCompletion}
                                                watchProgress={watchPercentage}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'Settings':
                return (
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-6">Settings</h2>
                        <StudentSettingsView />
                    </div>
                );
            default:
                return null;
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100">
             <div className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
            <Sidebar
                navItems={STUDENT_NAV_ITEMS}
                activeItem={activeView}
                onItemClick={handleNavItemClick}
                className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
            
            {selectedVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-toast-in">
                    <VideoPlayer
                        key={selectedVideo.id}
                        video={selectedVideo}
                        onClose={handleClosePlayer}
                        onToggleComplete={toggleVideoCompletion}
                        onProgressUpdate={handleProgressUpdate}
                    />
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;