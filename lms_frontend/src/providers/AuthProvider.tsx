"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  loginAsGuest: (role: 'guest_student' | 'guest_instructor') => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { 
    user, 
    loading, 
    login: storeLogin, 
    register: storeRegister, 
    loginAsGuest: storeLoginAsGuest,
    logout: storeLogout,
    refreshToken: storeRefreshToken,
    initializeAuth 
  } = useAuthStore();

  useEffect(() => {
    // Only initialize auth on client side
    if (typeof window !== 'undefined') {
      initializeAuth();
    }
  }, [initializeAuth]);

  const login = async (credentials: any) => {
    try {
      await storeLogin(credentials);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await storeRegister(userData);
      router.push('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const loginAsGuest = (role: 'guest_student' | 'guest_instructor') => {
    storeLoginAsGuest(role);
    router.push('/dashboard');
  };

  const logout = () => {
    storeLogout();
    router.push('/');
  };

  const refreshToken = async () => {
    try {
      await storeRefreshToken();
    } catch (error) {
      logout();
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    loginAsGuest,
    logout,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
