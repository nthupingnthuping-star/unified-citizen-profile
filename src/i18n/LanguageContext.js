import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { translations } from './translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { profile } = useAuth();
  const [language, setLanguage] = useState('en');

  // Load language from localStorage or Firestore profile
  useEffect(() => {
    const stored = localStorage.getItem('preferred_language');
    if (stored && ['en', 'st'].includes(stored)) {
      setLanguage(stored);
    } else if (profile?.preferred_language) {
      setLanguage(profile.preferred_language);
    }
  }, [profile]);

  const changeLanguage = async (lang) => {
    if (!['en', 'st'].includes(lang)) return;
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);

    // Save to Firestore if user is logged in
    if (profile?.uid) {
      try {
        await updateDoc(doc(db, 'citizens', profile.uid), {
          preferred_language: lang,
        });
      } catch (err) {
        console.error('Failed to save language preference:', err);
      }
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};