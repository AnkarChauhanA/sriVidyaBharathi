import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { UserProgress } from '../types';
import { useAuth } from './useAuth';
import { getProgressForUser, updateVideoProgress as updateVideoProgressInDb } from '../services/db';

interface ProgressContextType {
  progress: UserProgress;
  updateProgress: (videoId: string, progress: number, duration: number) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress>({});

  useEffect(() => {
    if (user) {
      const userProgress = getProgressForUser(user.id);
      setProgress(userProgress);
    } else {
      // Clear progress when user logs out
      setProgress({});
    }
  }, [user]);

  const updateProgress = useCallback((videoId: string, newProgress: number, duration: number) => {
    if (user) {
      updateVideoProgressInDb(user.id, videoId, newProgress, duration);
      setProgress(currentProgress => ({
        ...currentProgress,
        [videoId]: { progress: newProgress, duration },
      }));
    }
  }, [user]);

  return (
    <ProgressContext.Provider value={{ progress, updateProgress }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};