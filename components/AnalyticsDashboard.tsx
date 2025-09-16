import React, { useMemo } from 'react';
import { useVideos } from '../hooks/useVideos';
import { useUsers } from '../hooks/useUsers';
import { getAllProgress, getAllCompletions } from '../services/db';
import StatCard from './StatCard';
import { VideoIcon, UsersIcon, ClockIcon, TrendingUpIcon } from './Icons';
import type { Video } from '../types';

const formatTotalDuration = (totalSeconds: number): string => {
    if (isNaN(totalSeconds) || totalSeconds === 0) return '0h 0m';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
};

const parseDuration = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    if (isNaN(minutes) || isNaN(seconds)) return 0;
    return minutes * 60 + seconds;
};

const AnalyticsDashboard: React.FC = () => {
    const { videos } = useVideos();
    const { users } = useUsers();

    const analyticsData = useMemo(() => {
        const studentUsers = users.filter(u => u.type === 'student' && u.status === 'active');
        if (videos.length === 0 || studentUsers.length === 0) {
            return {
                totalVideos: videos.length,
                totalStudents: studentUsers.length,
                totalViews: 0,
                totalWatchTime: '0h 0m',
                averageCompletionRate: '0.0%',
                topVideos: [],
                subjectBreakdown: [],
            };
        }

        const allProgress = getAllProgress();
        const allCompletions = getAllCompletions();

        // Calculate total views and create a map of views per video
        let totalViews = 0;
        const videoViewsMap = new Map<string, number>();
        Object.values(allProgress).forEach(userProgress => {
            Object.keys(userProgress).forEach(videoId => {
                totalViews++;
                videoViewsMap.set(videoId, (videoViewsMap.get(videoId) || 0) + 1);
            });
        });

        // Calculate total watch time
        let totalWatchTimeSeconds = 0;
        Object.values(allProgress).forEach(userProgress => {
            Object.values(userProgress).forEach(p => {
                totalWatchTimeSeconds += p.progress;
            });
        });
        
        // Calculate average completion rate
        let totalProgressSum = 0;
        let totalDurationSum = 0;
        Object.values(allProgress).forEach(userProgress => {
            Object.values(userProgress).forEach(p => {
                if(p.duration > 0) {
                    totalProgressSum += p.progress;
                    totalDurationSum += p.duration;
                }
            });
        });
        const averageCompletionRate = totalDurationSum > 0 ? (totalProgressSum / totalDurationSum) * 100 : 0;

        // Determine top 5 videos
        const topVideos = Array.from(videoViewsMap.entries())
            .sort(([, viewsA], [, viewsB]) => viewsB - viewsA)
            .slice(0, 5)
            .map(([videoId, views]) => {
                const video = videos.find(v => v.id === videoId);
                // FIX: If a video is deleted but progress data remains, `video` will be undefined.
                // This check prevents a crash from trying to spread `undefined`.
                if (!video) {
                    return null;
                }
                const completions = Object.values(allCompletions).filter(list => list.includes(videoId)).length;
                const completionRate = studentUsers.length > 0 ? (completions / studentUsers.length) * 100 : 0;
                return { ...video, views, completionRate: completionRate.toFixed(1) } as Video & { views: number, completionRate: string };
            })
            .filter((v): v is Video & { views: number, completionRate: string } => v !== null);


        // Breakdown by subject based on watch time
        const subjectWatchTime: Record<string, number> = {};
        Object.values(allProgress).forEach(userProgress => {
            Object.entries(userProgress).forEach(([videoId, progressData]) => {
                const video = videos.find(v => v.id === videoId);
                if (video) {
                    subjectWatchTime[video.subject] = (subjectWatchTime[video.subject] || 0) + progressData.progress;
                }
            });
        });
        
        const totalSubjectWatchTime = Object.values(subjectWatchTime).reduce((sum, time) => sum + time, 0);

        const subjectBreakdown = Object.entries(subjectWatchTime)
            .map(([subject, time]) => ({
                subject,
                time: formatTotalDuration(time),
                percentage: totalSubjectWatchTime > 0 ? (time / totalSubjectWatchTime) * 100 : 0,
            }))
            .sort((a, b) => b.percentage - a.percentage);

        return {
            totalVideos: videos.length,
            totalStudents: studentUsers.length,
            totalViews,
            totalWatchTime: formatTotalDuration(totalWatchTimeSeconds),
            averageCompletionRate: `${averageCompletionRate.toFixed(1)}%`,
            topVideos,
            subjectBreakdown,
        };
    }, [videos, users]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard value={analyticsData.totalViews} label="Total Video Views" icon={<VideoIcon className="w-8 h-8" />} />
                <StatCard value={analyticsData.totalWatchTime} label="Total Watch Time" icon={<ClockIcon className="w-8 h-8" />} />
                <StatCard value={analyticsData.totalStudents} label="Active Students" icon={<UsersIcon className="w-8 h-8" />} />
                <StatCard value={analyticsData.averageCompletionRate} label="Avg. Completion Rate" icon={<TrendingUpIcon className="w-8 h-8" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-xl font-bold mb-4">Top Performing Videos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-slate-400">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-slate-300">
                                <tr>
                                    <th scope="col" className="px-2 py-3 sm:px-4">Title</th>
                                    <th scope="col" className="px-2 py-3 sm:px-4 text-center">Views</th>
                                    <th scope="col" className="px-2 py-3 sm:px-4 text-center">Completion %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.topVideos.map(video => (
                                    <tr key={video.id} className="border-b dark:border-slate-700">
                                        <td className="px-2 py-3 sm:px-4 font-medium text-gray-900 dark:text-white truncate" title={video.title}>{video.title}</td>
                                        <td className="px-2 py-3 sm:px-4 text-center">{video.views}</td>
                                        <td className="px-2 py-3 sm:px-4 text-center">{video.completionRate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {analyticsData.topVideos.length === 0 && <p className="p-6 text-center text-gray-500 dark:text-slate-400">Not enough data to show top videos.</p>}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                    <h3 className="text-xl font-bold mb-4">Engagement by Subject</h3>
                    <div className="space-y-4">
                        {analyticsData.subjectBreakdown.map(({ subject, time, percentage }) => (
                            <div key={subject}>
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-semibold">{subject}</span>
                                    <span className="text-gray-500 dark:text-slate-400">{time}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        ))}
                         {analyticsData.subjectBreakdown.length === 0 && <p className="p-6 text-center text-gray-500 dark:text-slate-400">No watch data available.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;