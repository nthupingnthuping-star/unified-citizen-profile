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
  const [simpleMode, setSimpleMode] = useState(false);

  // Load language + simple mode from localStorage or Firestore profile
  useEffect(() => {
    const storedLang = localStorage.getItem('preferred_language');
    if (storedLang && ['en', 'st'].includes(storedLang)) {
      setLanguage(storedLang);
    } else if (profile?.preferred_language) {
      setLanguage(profile.preferred_language);
    }

    const storedMode = localStorage.getItem('preferred_simple_mode');
    if (storedMode === 'true' || storedMode === 'false') {
      setSimpleMode(storedMode === 'true');
    } else if (typeof profile?.simple_mode === 'boolean') {
      setSimpleMode(profile.simple_mode);
    }
  }, [profile]);

  // Apply/remove the CSS class on <body> whenever simpleMode changes
  useEffect(() => {
    if (simpleMode) {
      document.body.classList.add('simple-mode');
    } else {
      document.body.classList.remove('simple-mode');
    }
  }, [simpleMode]);

  const changeLanguage = async (lang) => {
    if (!['en', 'st'].includes(lang)) return;
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);

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

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    localStorage.setItem('preferred_simple_mode', String(next));

    if (profile?.uid) {
      try {
        await updateDoc(doc(db, 'citizens', profile.uid), {
          simple_mode: next,
        });
      } catch (err) {
        console.error('Failed to save simple mode preference:', err);
      }
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, t, simpleMode, toggleSimpleMode }}
    >
      {children}
    </LanguageContext.Provider>
  );
};