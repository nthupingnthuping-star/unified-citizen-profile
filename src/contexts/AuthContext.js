import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { subscribeToAuth, getUserProfile } from '../firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // NEW: A function to manually re-fetch the profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      try {
        const userProfile = await getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (err) {
        console.error('Failed to refresh profile:', err);
      }
    }
  }, [user]);

  useEffect(() => {
    console.log('🚀 AuthProvider: subscribing to Firebase auth');
    const unsubscribe = subscribeToAuth(async (firebaseUser) => {
      console.log('🔐 Auth state changed. User:', firebaseUser ? firebaseUser.uid : 'null');
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userProfile = await getUserProfile(firebaseUser.uid);
          console.log('📋 Profile loaded:', userProfile);
          setProfile(userProfile);
        } catch (err) {
          console.error('❌ Failed to load profile:', err);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user;
  const isStaff = profile?.type === 'staff';
  const isCitizen = profile?.type === 'citizen';
  const isVerified = profile?.verified_by_home_affairs === true;

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated,
      isStaff,
      isCitizen,
      isVerified,
      refreshProfile, // <-- Passed down to all components
    }}>
      {children}
    </AuthContext.Provider>
  );
};