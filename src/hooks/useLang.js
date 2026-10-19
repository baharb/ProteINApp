import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, Alert, DevSettings } from 'react-native';
import * as Localization from 'expo-localization';
import * as Updates from 'expo-updates';
import { T, RTL, UNITS, LANG_OPTIONS } from '../data/i18n';
import { FOOD_NAMES } from '../data/foodNames';

const Ctx = createContext(null);
const SUPPORTED = LANG_OPTIONS.map(l => l.code);
const KEY = 'app_lang';

// First launch: use the phone's language if we support it.
function deviceLang() {
  try {
    const code = Localization.getLocales()?.[0]?.languageCode;
    return SUPPORTED.includes(code) ? code : 'en';
  } catch { return 'en'; }
}

// Right-to-left layout only takes effect after a restart.
async function restartForDirection(t) {
  try { await Updates.reloadAsync(); return; } catch {}
  if (__DEV__) { try { DevSettings.reload(); return; } catch {} }
  Alert.alert('🌐', t('langRestartManual'));
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(saved => {
      const code = saved && SUPPORTED.includes(saved) ? saved : deviceLang();
      setLangState(code);
      // Make sure the layout direction matches (e.g. after a manual restart).
      const rtl = RTL.includes(code);
      if (I18nManager.isRTL !== rtl) { I18nManager.allowRTL(rtl); I18nManager.forceRTL(rtl); }
    }).catch(() => {});
  }, []);

  // t('key') — lookup with English fallback; t('key', { n: 5 }) fills {n}.
  function t(key, vars) {
    let str = T[lang]?.[key] ?? T.en[key] ?? key;
    if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.split(`{${k}}`).join(String(v)); });
    return str;
  }

  async function setLang(code) {
    if (!SUPPORTED.includes(code) || code === lang) return;
    await AsyncStorage.setItem(KEY, code).catch(() => {});
    const needsFlip = RTL.includes(code) !== I18nManager.isRTL;
    setLangState(code);
    if (needsFlip) {
      I18nManager.allowRTL(RTL.includes(code));
      I18nManager.forceRTL(RTL.includes(code));
      setTimeout(() => restartForDirection((k) => T[code]?.[k] ?? T.en[k]), 150);
    }
  }

  // Built-in food name in the current language (user-logged names stay as written).
  function foodName(name) {
    return FOOD_NAMES[name]?.[lang] || name;
  }

  // 2 + 'skewer' → "2 skewers" / "۲ سیخ" / "2本"
  function qtyLabel(qty, unit) {
    const n = qty === 0.5 ? '½' : qty === 1.5 ? '1½' : String(qty);
    const forms = UNITS[lang]?.[unit] || UNITS.en[unit];
    if (!forms) return `${n} ${unit}`;
    const word = qty > 1 && forms[1] ? forms[1] : forms[0];
    return lang === 'ja' || lang === 'zh' ? `${n}${word}` : `${n} ${word}`;
  }

  const isRTL = RTL.includes(lang);
  // Arrows: Android/iOS mirror ‹ › automatically in right-to-left layouts,
  // so the same characters are correct in every language.
  const fwd  = '›';
  const back = '‹';
  const locale = lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar' : lang;

  return (
    <Ctx.Provider value={{ lang, setLang, t, isRTL, foodName, qtyLabel, locale, fwd, back }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() { return useContext(Ctx); }
