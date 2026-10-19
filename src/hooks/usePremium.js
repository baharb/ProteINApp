import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FEATURES } from '../lib/config';

const PREMIUM_KEY  = 'is_premium_v2';
const INSTALL_KEY  = 'install_date_v2';
const PAYWALL_DAYS = 5;

export function usePremium() {
  const [isPremium,    setIsPremium]    = useState(false);
  const [daysInstalled,setDaysInstalled]= useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      const premium = await AsyncStorage.getItem(PREMIUM_KEY);
      setIsPremium(premium === 'true');
      let installDate = await AsyncStorage.getItem(INSTALL_KEY);
      if (!installDate) {
        installDate = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(INSTALL_KEY, installDate);
      }
      const days = Math.floor((Date.now() - new Date(installDate).getTime()) / 86400000);
      setDaysInstalled(days);
      setLoading(false);
    })();
  }, []);

  async function unlock() {
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
    setIsPremium(true);
  }

  // Show paywall if not premium AND (days >= threshold OR triggered manually)
  function shouldShowPaywall(forceShow=false) {
    if (isPremium) return false;
    return forceShow || daysInstalled >= PAYWALL_DAYS;
  }

  // Without payments there is nothing to buy — every user gets every feature.
  if (!FEATURES.payments) return { isPremium: true, daysInstalled, loading, unlock, shouldShowPaywall: () => false };
  return { isPremium, daysInstalled, loading, unlock, shouldShowPaywall };
}
