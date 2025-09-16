import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authenticateUser, registerStudent, updateUserProfile, changePassword as changePasswordInDb } from '../services/db';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'type' | 'status'>) => Promise<void>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('srividyabharathi_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from session storage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const foundUser = authenticateUser(email, password);
    if (foundUser) {
      setUser(foundUser);
      sessionStorage.setItem('srividyabharathi_user', JSON.stringify(foundUser));
    } else {
      throw new Error('Invalid credentials');
    }
  }, []);
  
  const register = useCallback(async (userData: Omit<User, 'id' | 'type' | 'status'>) => {
    const newUser = registerStudent(userData);
    if (newUser) {
      setUser(newUser);
      sessionStorage.setItem('srividyabharathi_user', JSON.stringify(newUser));
    } else {
      throw new Error('Email already exists');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('srividyabharathi_user');
  }, []);
  
  const updateProfile = useCallback(async (updatedData: Partial<User>) => {
    if (!user) throw new Error("No user is logged in");
    const updatedUser = updateUserProfile(user.id, updatedData);
    if (updatedUser) {
        setUser(updatedUser);
        sessionStorage.setItem('srividyabharathi_user', JSON.stringify(updatedUser));
    } else {
        throw new Error("Failed to update profile");
    }
  }, [user]);

  const changePassword = useCallback(async (oldPass: string, newPass: string) => {
    if (!user) throw new Error("No user is logged in");
    const success = changePasswordInDb(user.id, oldPass, newPass);
    if (!success) {
        throw new Error("Failed to change password. Please check your current password.");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};