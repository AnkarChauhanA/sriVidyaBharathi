export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Should not be sent to client in real app
  type: 'student' | 'admin';
  class?: '8' | '9' | '10';
  status: 'active' | 'disabled';
}

export interface Video {
  id: string;
  title: string;
  description: string;
  subject: 'Mathematics' | 'Science' | 'History' | 'English' | 'Geography' | 'Physics' | 'Chemistry' | 'Biology' | 'Computer Science' | 'Economics' | 'Art';
  class: '8' | '9' | '10';
  duration: string; // e.g., "24:15"
  views: number;
  completed?: boolean;
  status: 'published' | 'draft';
  thumbnailUrl: string;
  videoUrls: { [quality: string]: string };
  tags?: string[];
  uploadedAt: string; // ISO date string
}

export interface NavItem {
    name: string;
    icon: React.ReactNode;
    active?: boolean;
}

export interface VideoProgress {
  progress: number; // in seconds
  duration: number; // in seconds
}

export interface UserProgress {
  [videoId: string]: VideoProgress;
}