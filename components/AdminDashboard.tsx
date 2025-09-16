import React, { useState, useMemo, useEffect } from 'react';
import { ADMIN_NAV_ITEMS } from '../constants';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../hooks/useAuth';
import { useVideos } from '../hooks/useVideos';
import { useUsers } from '../hooks/useUsers';
import { useToast } from '../hooks/useToast';
import type { Video, User } from '../types';
import AnalyticsDashboard from './AnalyticsDashboard';

type AdminView = 'Dashboard' | 'Upload Videos' | 'Manage Videos' | 'Students' | 'Analytics' | 'Settings';

// Define component with improved polymorphic types for type safety and correctness.
// This resolves potential runtime errors and improves developer experience by enabling better type inference.
type InputProps = React.ComponentPropsWithoutRef<'input'> & { as?: 'input' };
type SelectProps = React.ComponentPropsWithoutRef<'select'> & { as: 'select' };
type TextareaProps = React.ComponentPropsWithoutRef<'textarea'> & { as: 'textarea' };

type FormInputProps = InputProps | SelectProps | TextareaProps;

const FormInput: React.FC<FormInputProps> = (props) => {
    const baseClasses = "w-full px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition";

    if (props.as === 'textarea') {
        const { as, className, ...rest } = props;
        return <textarea {...rest} className={`${baseClasses} ${className || ''}`} />;
    }
    if (props.as === 'select') {
        const { as, className, ...rest } = props;
        return <select {...rest} className={`${baseClasses} ${className || ''}`} />;
    }

    const { as, className, ...rest } = props;
    return <input {...rest} className={`${baseClasses} ${className || ''}`} />;
};

const UploadVideoView: React.FC<{ onUploadSuccess: () => void }> = ({ onUploadSuccess }) => {
    const { addVideo } = useVideos();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [videoFileInfo, setVideoFileInfo] = useState<{ name: string; duration: string; dataUrl: string; } | null>(null);

    const formatTime = (timeInSeconds: number) => {
        if (isNaN(timeInSeconds)) return '00:00';
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            setVideoFileInfo(null);
            return;
        }

        if (file.size > 500 * 1024 * 1024) { // 500 MB limit
            showToast("File is too large. Please select a video under 500MB.", "error");
            e.target.value = '';
            setVideoFileInfo(null);
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            const dataUrl = reader.result as string;
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.src = dataUrl;

            tempVideo.onloadedmetadata = () => {
                setVideoFileInfo({
                    name: file.name,
                    duration: formatTime(tempVideo.duration),
                    dataUrl: dataUrl,
                });
                setIsLoading(false);
            };

            tempVideo.onerror = () => {
                showToast("Could not read video metadata. Invalid file.", "error");
                e.target.value = '';
                setVideoFileInfo(null);
                setIsLoading(false);
            };
        };

        reader.onerror = () => {
            showToast("Failed to read the file.", "error");
            e.target.value = '';
            setVideoFileInfo(null);
            setIsLoading(false);
        };
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget; // Capture the form element synchronously

        if (!videoFileInfo) {
            showToast("Please select a video file.", "error");
            return;
        }
        setIsLoading(true);
        const formData = new FormData(form);
        
        const videoData: Omit<Video, 'id'> = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            subject: formData.get('subject') as any,
            class: formData.get('class') as any,
            duration: videoFileInfo.duration,
            views: 0,
            status: 'draft',
            thumbnailUrl: `https://placehold.co/600x400/3B82F6/FFF?text=${encodeURIComponent(formData.get('title') as string)}`,
            videoUrls: { 'source': videoFileInfo.dataUrl },
            uploadedAt: new Date().toISOString(),
        };

        try {
            await addVideo(videoData);
            showToast("Video uploaded successfully!", "success");
            form.reset(); // Use the captured reference
            setVideoFileInfo(null);
            onUploadSuccess();
        } catch (error) {
            // The error is already logged and a toast is shown by the useVideos hook.
            // This catch block prevents the success logic from running.
            console.error("Video upload failed in component:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-xl shadow border border-gray-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Video Title</label>
                    <FormInput name="title" type="text" placeholder="e.g., Introduction to Photosynthesis" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Description</label>
                    <FormInput name="description" as="textarea" placeholder="A brief summary of the video content." rows={4} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Video File (MP4, WebM - Max 500MB)</label>
                    <FormInput 
                        name="videoFile" 
                        type="file" 
                        accept="video/mp4,video/webm" 
                        onChange={handleFileChange} 
                        required 
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-slate-600 file:text-blue-700 dark:file:text-slate-200 hover:file:bg-blue-100 dark:hover:file:bg-slate-500" 
                    />
                    {videoFileInfo && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                            Selected: {videoFileInfo.name} ({videoFileInfo.duration})
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Subject</label>
                        <FormInput name="subject" as="select" required>
                            <option value="Mathematics">Mathematics</option>
                            <option value="Science">Science</option>
                            <option value="History">History</option>
                            <option value="English">English</option>
                            <option value="Geography">Geography</option>
                            <option value="Physics">Physics</option>
                            <option value="Chemistry">Chemistry</option>
                            <option value="Biology">Biology</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Economics">Economics</option>
                            <option value="Art">Art</option>
                        </FormInput>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Class</label>
                        <FormInput name="class" as="select" required>
                            <option value="8">Class 8</option>
                            <option value="9">Class 9</option>
                            <option value="10">Class 10</option>
                        </FormInput>
                    </div>
                </div>
                <div className="text-right">
                    <button type="submit" disabled={isLoading || !videoFileInfo} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition">
                        {isLoading ? 'Processing...' : 'Upload Video'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const ManageVideosView: React.FC = () => {
    const { videos, deleteVideo, deleteMultipleVideos, updateMultipleVideosStatus, addTagsToMultipleVideos } = useVideos();
    const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');
    const [tagsToAdd, setTagsToAdd] = useState('');

    const filteredVideos = useMemo(() => {
        return videos.filter(video => {
            const subjectMatch = subjectFilter === 'all' || video.subject === subjectFilter;
            const classMatch = classFilter === 'all' || video.class === classFilter;
            return subjectMatch && classMatch;
        });
    }, [videos, subjectFilter, classFilter]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedVideoIds(filteredVideos.map(v => v.id));
        } else {
            setSelectedVideoIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedVideoIds(prev =>
            prev.includes(id) ? prev.filter(vid => vid !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = async () => {
        if (window.confirm(`Are you sure you want to delete ${selectedVideoIds.length} video(s)?`)) {
            await deleteMultipleVideos(selectedVideoIds);
            setSelectedVideoIds([]);
        }
    };
    
    const handleStatusUpdateSelected = async (status: 'published' | 'draft') => {
        await updateMultipleVideosStatus(selectedVideoIds, status);
        setSelectedVideoIds([]);
    };

    const handleAddTags = async () => {
        if (!tagsToAdd.trim() || selectedVideoIds.length === 0) return;
        const tags = tagsToAdd.split(',').map(tag => tag.trim()).filter(Boolean);
        if (tags.length > 0) {
            await addTagsToMultipleVideos(selectedVideoIds, tags);
            setTagsToAdd('');
            setSelectedVideoIds([]);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div>
                    <label htmlFor="subject-filter" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Filter by Subject</label>
                    <FormInput as="select" id="subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
                        <option value="all">All Subjects</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="History">History</option>
                        <option value="English">English</option>
                        <option value="Geography">Geography</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Economics">Economics</option>
                        <option value="Art">Art</option>
                    </FormInput>
                </div>
                <div>
                    <label htmlFor="class-filter" className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Filter by Class</label>
                    <FormInput as="select" id="class-filter" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                        <option value="all">All Classes</option>
                        <option value="8">Class 8</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                    </FormInput>
                </div>
            </div>

            {selectedVideoIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-3 rounded-lg bg-blue-50 dark:bg-slate-700/50 border border-blue-200 dark:border-slate-600">
                    <span className="text-sm font-semibold whitespace-nowrap">{selectedVideoIds.length} video(s) selected</span>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                        <button onClick={() => handleStatusUpdateSelected('published')} className="text-xs px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-md hover:bg-green-200">Publish</button>
                        <button onClick={() => handleStatusUpdateSelected('draft')} className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-md hover:bg-yellow-200">Set to Draft</button>
                        <button onClick={handleDeleteSelected} className="text-xs px-3 py-1.5 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 rounded-md hover:bg-red-200">Delete</button>
                        
                        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-blue-300 dark:border-slate-500 pt-2 sm:pt-0 sm:pl-2 mt-2 sm:mt-0 sm:ml-2 w-full sm:w-auto">
                            <FormInput 
                                type="text"
                                placeholder="Add tags, comma separated"
                                value={tagsToAdd}
                                onChange={e => setTagsToAdd(e.target.value)}
                                className="!py-1.5 text-sm flex-grow"
                            />
                            <button onClick={handleAddTags} className="text-sm px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-md hover:bg-blue-200 whitespace-nowrap">Add Tags</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedVideoIds.length === filteredVideos.length && filteredVideos.length > 0} /></th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Title</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Subject</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Class</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Status</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredVideos.map(video => (
                            <tr key={video.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <td className="w-4 p-4"><input type="checkbox" checked={selectedVideoIds.includes(video.id)} onChange={() => handleSelectOne(video.id)} /></td>
                                <th scope="row" className="px-2 py-4 sm:px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">{video.title}</th>
                                <td className="px-2 py-4 sm:px-6">{video.subject}</td>
                                <td className="px-2 py-4 sm:px-6">{video.class}</td>
                                <td className="px-2 py-4 sm:px-6">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${video.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>{video.status}</span>
                                </td>
                                <td className="px-2 py-4 sm:px-6">
                                    <button onClick={() => deleteVideo(video.id)} className="font-medium text-red-500 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredVideos.length === 0 && <p className="text-center p-8 text-gray-500">No videos found.</p>}
            </div>
        </div>
    );
};

const ManageStudentsView: React.FC = () => {
    const { users, updateUser } = useUsers();
    const students = useMemo(() => users.filter(u => u.type === 'student'), [users]);

    const handleStatusToggle = (user: User) => {
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        updateUser(user.id, { status: newStatus });
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow border border-gray-200 dark:border-slate-700">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-slate-700 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-2 py-3 sm:px-6">Name</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Email</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Class</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Status</th>
                            <th scope="col" className="px-2 py-3 sm:px-6">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id} className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                <th scope="row" className="px-2 py-4 sm:px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap">{student.name}</th>
                                <td className="px-2 py-4 sm:px-6">{student.email}</td>
                                <td className="px-2 py-4 sm:px-6">{student.class}</td>
                                <td className="px-2 py-4 sm:px-6">
                                     <span className={`px-2 py-1 text-xs font-medium rounded-full ${student.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'}`}>{student.status}</span>
                                </td>
                                <td className="px-2 py-4 sm:px-6">
                                    <button onClick={() => handleStatusToggle(student)} className="font-medium text-blue-500 hover:underline">
                                        {student.status === 'active' ? 'Disable' : 'Enable'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {students.length === 0 && <p className="text-center p-8 text-gray-500">No students found.</p>}
            </div>
        </div>
    );
};


const AdminSettingsView: React.FC = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const { showToast } = useToast();
    
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    
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
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Admin Profile</h3>
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Full Name</label>
                        <FormInput value={name} onChange={e => setName(e.target.value)} type="text" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Email Address</label>
                        <FormInput value={email} onChange={e => setEmail(e.target.value)} type="email" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isProfileSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                            {isProfileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Change Password</h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Current Password</label>
                        <FormInput value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} type="password" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">New Password</label>
                        <FormInput value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-slate-300 mb-1">Confirm New Password</label>
                        <FormInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" disabled={isPasswordSaving} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-blue-400">
                            {isPasswordSaving ? 'Saving...' : 'Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<AdminView>('Dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleNavItemClick = (itemName: string) => {
        setActiveView(itemName as AdminView);
        setSidebarOpen(false);
    };

    const renderContent = () => {
        switch (activeView) {
            case 'Dashboard':
            case 'Analytics':
                return <AnalyticsDashboard />;
            case 'Upload Videos':
                return <UploadVideoView onUploadSuccess={() => handleNavItemClick('Manage Videos')} />;
            case 'Manage Videos':
                return <ManageVideosView />;
            case 'Students':
                return <ManageStudentsView />;
            case 'Settings':
                 return <AdminSettingsView />;
            default:
                return <AnalyticsDashboard />;
        }
    };
    
    if (!user || user.type !== 'admin') return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100">
            <div className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'bg-black/50' : 'bg-transparent pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
            <Sidebar
                navItems={ADMIN_NAV_ITEMS}
                activeItem={activeView}
                onItemClick={handleNavItemClick}
                className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header onMenuClick={() => setSidebarOpen(true)} showUploadButton={true} onUploadClick={() => handleNavItemClick('Upload Videos')} />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6">{activeView}</h2>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;