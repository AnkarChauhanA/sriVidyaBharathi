import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { Video } from '../types';
import {
    getVideos as getVideosFromDb,
    addVideo as addVideoToDb,
    updateVideo as updateVideoInDb,
    deleteVideo as deleteVideoFromDb,
    updateVideoCompletion as updateVideoCompletionInDb,
    resetVideos as resetVideosInDb,
    deleteMultipleVideos as deleteMultipleVideosFromDb,
    updateMultipleVideosStatus as updateMultipleVideosStatusInDb,
    addTagsToMultipleVideos as addTagsToMultipleVideosInDb
} from '../services/db';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

interface VideoContextType {
  videos: Video[];
  addVideo: (videoData: Omit<Video, 'id'>) => Promise<void>;
  updateVideo: (videoId: string, updatedData: Partial<Video>) => Promise<void>;
  deleteVideo: (videoId: string) => Promise<void>;
  toggleVideoCompletion: (videoId: string) => void;
  resetVideos: () => Promise<void>;
  loading: boolean;
  deleteMultipleVideos: (videoIds: string[]) => Promise<void>;
  updateMultipleVideosStatus: (videoIds: string[], status: 'published' | 'draft') => Promise<void>;
  addTagsToMultipleVideos: (videoIds: string[], tags: string[]) => Promise<void>;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const refreshVideos = useCallback(async () => {
    try {
        setLoading(true);
        const allVideos = await getVideosFromDb(user?.id);
        setVideos(allVideos);
    } catch (error) {
        console.error("Failed to load videos", error);
        showToast("Could not load videos.", "error");
    } finally {
        setLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => {
    refreshVideos();
  }, [user, refreshVideos]);

  const addVideo = useCallback(async (videoData: Omit<Video, 'id'>) => {
    try {
      await addVideoToDb(videoData);
      await refreshVideos();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      showToast(errorMessage, "error");
      throw error; // Re-throw for component-level handling
    }
  }, [showToast, refreshVideos]);

  const updateVideo = useCallback(async (videoId: string, updatedData: Partial<Video>) => {
    try {
      await updateVideoInDb(videoId, updatedData);
      await refreshVideos();
      showToast("Video updated successfully!", "success");
    } catch (error) {
       showToast("Failed to update video.", "error");
    }
  }, [showToast, refreshVideos]);
  
  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      await deleteVideoFromDb(videoId);
      setVideos(currentVideos => currentVideos.filter(v => v.id !== videoId));
      showToast("Video deleted.", "success");
    } catch (error) {
      showToast("Failed to delete video.", "error");
    }
  }, [showToast]);
  
  const deleteMultipleVideos = useCallback(async (videoIds: string[]) => {
      try {
          await deleteMultipleVideosFromDb(videoIds);
          setVideos(currentVideos => currentVideos.filter(v => !videoIds.includes(v.id)));
          showToast(`${videoIds.length} video(s) deleted.`, "success");
      } catch (error) {
          showToast("Failed to delete videos.", "error");
      }
  }, [showToast]);

  const updateMultipleVideosStatus = useCallback(async (videoIds: string[], status: 'published' | 'draft') => {
      try {
          await updateMultipleVideosStatusInDb(videoIds, status);
          await refreshVideos();
          showToast(`${videoIds.length} video(s) updated to ${status}.`, "success");
      } catch (error) {
          showToast("Failed to update video statuses.", "error");
      }
  }, [showToast, refreshVideos]);

  const addTagsToMultipleVideos = useCallback(async (videoIds: string[], tags: string[]) => {
      try {
          await addTagsToMultipleVideosInDb(videoIds, tags);
          await refreshVideos();
          showToast(`Tags added to ${videoIds.length} video(s).`, "success");
      } catch (error) {
          showToast("Failed to add tags.", "error");
      }
  }, [showToast, refreshVideos]);

  const toggleVideoCompletion = useCallback((videoId: string) => {
    if (!user) return;
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const newCompletedStatus = !video.completed;
    updateVideoCompletionInDb(user.id, videoId, newCompletedStatus);
    
    // Update local state for immediate feedback
    setVideos(currentVideos => 
      currentVideos.map(v => 
        v.id === videoId ? { ...v, completed: newCompletedStatus } : v
      )
    );
  }, [user, videos]);
  
  const resetVideos = useCallback(async () => {
    try {
        await resetVideosInDb();
        await refreshVideos();
        showToast("All videos have been reset to their initial state.", "success");
    } catch(error) {
        showToast("Failed to reset videos.", "error");
    }
  }, [refreshVideos, showToast]);

  return (
    <VideoContext.Provider value={{ videos, addVideo, updateVideo, deleteVideo, toggleVideoCompletion, resetVideos, loading, deleteMultipleVideos, updateMultipleVideosStatus, addTagsToMultipleVideos }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideos = (): VideoContextType => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideoProvider');
  }
  return context;
};
