import React from 'react';
import type { NavItem } from './types';
import { DashboardIcon, VideoIcon, SubjectIcon, SettingsIcon, UploadIcon, UsersIcon, AnalyticsIcon } from './components/Icons';

export const STUDENT_NAV_ITEMS: NavItem[] = [
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Dashboard', icon: React.createElement(DashboardIcon, { className: 'w-5 h-5 mr-3' }), active: true },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'My Videos', icon: React.createElement(VideoIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Subjects', icon: React.createElement(SubjectIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Settings', icon: React.createElement(SettingsIcon, { className: 'w-5 h-5 mr-3' }) },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Dashboard', icon: React.createElement(DashboardIcon, { className: 'w-5 h-5 mr-3' }), active: true },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Upload Videos', icon: React.createElement(UploadIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Manage Videos', icon: React.createElement(VideoIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Students', icon: React.createElement(UsersIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Analytics', icon: React.createElement(AnalyticsIcon, { className: 'w-5 h-5 mr-3' }) },
    // FIX: Added className to all icons for consistent styling in the sidebar.
    { name: 'Settings', icon: React.createElement(SettingsIcon, { className: 'w-5 h-5 mr-3' }) },
];
