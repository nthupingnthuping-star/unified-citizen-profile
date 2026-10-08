import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCitizenMasterData } from '../firebase/db';

export function useAutoFill() {
  const { user } = useAuth();
  const [master, setMaster] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCitizenMasterData(user.uid);
        setMaster(data);
      } catch (err) {
        console.error('Failed to load master data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const prefill = (defaults) => {
    if (!master) return defaults;
    const merged = { ...defaults };
    Object.keys(defaults).forEach((key) => {
      if (master[key] !== undefined && master[key] !== null && master[key] !== '') {
        merged[key] = master[key];
      }
    });
    return merged;
  };

  const isFromProfile = (field) => {
    if (!master) return false;
    const v = master[field];
    return v !== undefined && v !== null && v !== '';
  };

  return { master, loading, prefill, isFromProfile };
}