import React, { createContext, useState, useContext, useCallback } from 'react';
import type { User } from '../types';
import {
    getUsers as getUsersFromDb,
    updateUserProfile as updateUserInDb,
    deleteUser as deleteUserFromDb,
} from '../services/db';

interface UserContextType {
  users: User[];
  updateUser: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => getUsersFromDb());

  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    const updatedUser = updateUserInDb(userId, data);
    if (updatedUser) {
        setUsers(currentUsers => currentUsers.map(u => u.id === userId ? updatedUser : u));
    }
  }, []);

  const deleteUser = useCallback((userId: string) => {
    deleteUserFromDb(userId);
    setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
  }, []);

  return (
    <UserContext.Provider value={{ users, updateUser, deleteUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};