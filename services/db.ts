// FIX: Implemented a mock database service using localStorage to resolve module not found errors.
import type { User, Video, UserProgress } from '../types';
import { initialUsers, initialVideos } from './initialData';

const USERS_KEY = 'eduportal_users';
const VIDEOS_KEY = 'eduportal_videos'; // Kept for migration
const DB_NAME = 'EduPortalDB';
const DB_VERSION = 1;
const VIDEO_STORE_NAME = 'videos';

let db: IDBDatabase;

const getCompletionsKey = (userId: string) => `eduportal_completions_${userId}`;
const getProgressKey = (userId: string) => `eduportal_progress_${userId}`;

// --- DB Initialization ---

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening database.');
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = () => {
            const tempDb = request.result;
            if (!tempDb.objectStoreNames.contains(VIDEO_STORE_NAME)) {
                tempDb.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

const migrateLocalStorageToIndexedDB = async (): Promise<void> => {
    try {
        const lsVideosItem = localStorage.getItem(VIDEOS_KEY);
        if (lsVideosItem) {
            console.log('Migrating videos from localStorage to IndexedDB...');
            const lsVideos: Video[] = JSON.parse(lsVideosItem);
            if (Array.isArray(lsVideos) && lsVideos.length > 0) {
                const database = await openDB();
                const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
                const store = transaction.objectStore(VIDEO_STORE_NAME);
                
                const putPromises = lsVideos.map(video => {
                    return new Promise<void>((resolve, reject) => {
                        const request = store.put(video);
                        request.onsuccess = () => resolve();
                        request.onerror = () => reject(request.error);
                    });
                });
                
                await Promise.all(putPromises);
                localStorage.removeItem(VIDEOS_KEY);
                console.log('Migration successful.');
            } else {
                 localStorage.removeItem(VIDEOS_KEY); // Clear corrupted or empty data
            }
        }
    } catch (error) {
        console.error('Failed to migrate videos from localStorage:', error);
    }
};


export const initDB = async (): Promise<void> => {
    const database = await openDB();
    
    // Initialize users from localStorage if not present
    if (!localStorage.getItem(USERS_KEY)) {
        saveToStorage(USERS_KEY, initialUsers);
    }

    // Check if IndexedDB is empty and migrate/initialize
    const transaction = database.transaction(VIDEO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    const countRequest = store.count();

    return new Promise((resolve) => {
        countRequest.onsuccess = async () => {
            if (countRequest.result === 0) {
                // First, try migrating from localStorage
                await migrateLocalStorageToIndexedDB();
                
                // Re-check count after migration attempt
                const postMigrationTransaction = database.transaction(VIDEO_STORE_NAME, 'readonly');
                const postMigrationStore = postMigrationTransaction.objectStore(VIDEO_STORE_NAME);
                const postMigrationCountReq = postMigrationStore.count();
                
                postMigrationCountReq.onsuccess = async () => {
                    if (postMigrationCountReq.result === 0) {
                        console.log('No videos in IndexedDB, initializing with initial data.');
                        // If still empty, populate with initial videos
                        const writeTransaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
                        const writeStore = writeTransaction.objectStore(VIDEO_STORE_NAME);
                        initialVideos.forEach(video => writeStore.add(video));
                    }
                    resolve();
                };
            } else {
                // If not empty, check if there's anything to migrate just in case
                await migrateLocalStorageToIndexedDB();
                resolve();
            }
        };
        countRequest.onerror = () => {
            console.error("Could not count videos in DB", countRequest.error);
            resolve(); // Resolve anyway to not block app load
        };
    });
};


// Utility functions to interact with localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const saveToStorage = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
        if (error instanceof DOMException && (
            error.name === 'QuotaExceededError' ||
            // Firefox specific error name
            error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            throw new Error('Storage quota exceeded. Please clear some space.');
        }
        // Re-throw other unexpected errors
        throw error;
    }
};

// --- User Management (continues to use localStorage) ---
export const getUsers = (): User[] => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    // FIX: Add validation to prevent crashes from corrupted localStorage data.
    if (!Array.isArray(users)) {
        console.warn('Corrupted user data in localStorage. Resetting.');
        saveToStorage(USERS_KEY, initialUsers);
        return initialUsers;
    }
    return users;
};

export const authenticateUser = (email: string, password_sent: string): User | null => {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    // In a real app, passwords would be hashed. Here we do a plain text comparison.
    if (user && user.password === password_sent) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    }
    return null;
};

export const registerStudent = (userData: Omit<User, 'id' | 'type' | 'status'>): User | null => {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return null; // Email already exists
    }
    const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        type: 'student',
        status: 'active',
    };
    users.push(newUser);
    saveToStorage(USERS_KEY, users);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
};

export const updateUserProfile = (userId: string, updatedData: Partial<User>): User | null => {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;
    
    users[userIndex] = { ...users[userIndex], ...updatedData };
    saveToStorage(USERS_KEY, users);
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as User;
};

export const changePassword = (userId: string, oldPass: string, newPass: string): boolean => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user && user.password === oldPass) {
        user.password = newPass;
        saveToStorage(USERS_KEY, users);
        return true;
    }
    return false;
};

export const deleteUser = (userId: string): void => {
    let users = getUsers();
    users = users.filter(u => u.id !== userId);
    saveToStorage(USERS_KEY, users);
};

// --- Video Management (now uses IndexedDB) ---
const getRawVideos = async (): Promise<Video[]> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VIDEO_STORE_NAME, 'readonly');
        const store = transaction.objectStore(VIDEO_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const getVideos = async (userId?: string): Promise<Video[]> => {
    const allVideos = await getRawVideos();
    allVideos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    if (!userId) return allVideos;

    let completedVideoIds = getFromStorage<string[]>(getCompletionsKey(userId), []);
    // FIX: Add validation for completion data.
    if (!Array.isArray(completedVideoIds)) {
        console.warn(`Corrupted completion data for user ${userId}. Resetting.`);
        completedVideoIds = [];
        saveToStorage(getCompletionsKey(userId), completedVideoIds);
    }

    return allVideos.map(video => ({
        ...video,
        completed: completedVideoIds.includes(video.id),
    }));
};

export const addVideo = async (videoData: Omit<Video, 'id'>): Promise<Video> => {
    const database = await openDB();
    const newVideo: Video = {
        ...videoData,
        id: `video_${Date.now()}`,
    };

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE_NAME);
        const request = store.add(newVideo);
        request.onsuccess = () => resolve(newVideo);
        request.onerror = () => reject(request.error);
    });
};

export const updateVideo = async (videoId: string, updatedData: Partial<Video>): Promise<Video | null> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE_NAME);
        const getRequest = store.get(videoId);

        getRequest.onsuccess = () => {
            const video = getRequest.result;
            if (!video) {
                resolve(null);
                return;
            }
            const updatedVideo = { ...video, ...updatedData };
            const putRequest = store.put(updatedVideo);
            putRequest.onsuccess = () => resolve(updatedVideo);
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
};

export const deleteVideo = async (videoId: string): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE_NAME);
        const request = store.delete(videoId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const updateVideoCompletion = (userId: string, videoId: string, isCompleted: boolean): void => {
    const completionsKey = getCompletionsKey(userId);
    let completedVideoIds = getFromStorage<string[]>(completionsKey, []);
    if (!Array.isArray(completedVideoIds)) {
        console.warn(`Corrupted completion data for user ${userId}. Resetting.`);
        completedVideoIds = [];
    }

    if (isCompleted) {
        if (!completedVideoIds.includes(videoId)) {
            completedVideoIds.push(videoId);
        }
    } else {
        completedVideoIds = completedVideoIds.filter(id => id !== videoId);
    }
    saveToStorage(completionsKey, completedVideoIds);
};

export const deleteMultipleVideos = async (videoIds: string[]): Promise<void> => {
    const database = await openDB();
    const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    await Promise.all(videoIds.map(id => 
        new Promise<void>((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        })
    ));
};

export const updateMultipleVideosStatus = async (videoIds: string[], status: 'published' | 'draft'): Promise<void> => {
    const database = await openDB();
    const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    const videos = await getRawVideos(); // Get current state
    
    videoIds.forEach(id => {
        const video = videos.find(v => v.id === id);
        if (video) {
            video.status = status;
            store.put(video); // This will be queued in the transaction
        }
    });

    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const addTagsToMultipleVideos = async (videoIds: string[], tagsToAdd: string[]): Promise<void> => {
    const database = await openDB();
    const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    const videos = await getRawVideos();

    videoIds.forEach(id => {
        const video = videos.find(v => v.id === id);
        if (video) {
            const existingTags = video.tags || [];
            const newTags = [...new Set([...existingTags, ...tagsToAdd])];
            video.tags = newTags;
            store.put(video);
        }
    });

     return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

// --- Progress Tracking ---
export const getProgressForUser = (userId: string): UserProgress => {
    const progress = getFromStorage<UserProgress>(getProgressKey(userId), {});
    // Progress is an object, so check if it's a plain object
    if (typeof progress !== 'object' || progress === null || Array.isArray(progress)) {
        console.warn(`Corrupted progress data for user ${userId}. Resetting.`);
        saveToStorage(getProgressKey(userId), {});
        return {};
    }
    return progress;
};

export const getAllProgress = (): { [userId: string]: UserProgress } => {
    const users = getUsers();
    const allProgress: { [userId: string]: UserProgress } = {};
    users.forEach(user => {
        allProgress[user.id] = getProgressForUser(user.id);
    });
    return allProgress;
};

export const getAllCompletions = (): { [userId: string]: string[] } => {
    const users = getUsers();
    const allCompletions: { [userId: string]: string[] } = {};
    users.forEach(user => {
        if (user.type === 'student') {
            const completions = getFromStorage<string[]>(getCompletionsKey(user.id), []);
            allCompletions[user.id] = Array.isArray(completions) ? completions : [];
        }
    });
    return allCompletions;
};

export const updateVideoProgress = (userId: string, videoId: string, progress: number, duration: number): void => {
    const progressKey = getProgressKey(userId);
    const userProgress = getProgressForUser(userId);
    userProgress[videoId] = { progress, duration };
    saveToStorage(progressKey, userProgress);
};

// --- Admin / Debug ---
export const resetVideos = async (): Promise<void> => {
    const database = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction(VIDEO_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(VIDEO_STORE_NAME);
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            initialVideos.forEach(video => store.add(video));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        clearRequest.onerror = () => reject(clearRequest.error);
    });
};
