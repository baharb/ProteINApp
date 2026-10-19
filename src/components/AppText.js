import React, { createContext, forwardRef, useContext } from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from 'react-native';
import {
  Vazirmatn_300Light, Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold,
  Vazirmatn_700Bold, Vazirmatn_800ExtraBold, Vazirmatn_900Black,
} from '@expo-google-fonts/vazirmatn';
import { useLang } from '../hooks/useLang';

// Loaded once in App.js with useFonts.
export const APP_FONTS = {
  Vazirmatn_300Light, Vazirmatn_400Regular, Vazirmatn_500Medium, Vazirmatn_600SemiBold,
  Vazirmatn_700Bold, Vazirmatn_800ExtraBold, Vazirmatn_900Black,
};

// Farsi uses Vazirmatn. Each weight is its own font file — Android can't
// derive weights from a custom font, so fontWeight picks the file instead.
const VAZIR = {
  '100':'Vazirmatn_300Light', '200':'Vazirmatn_300Light', '300':'Vazirmatn_300Light',
  '400':'Vazirmatn_400Regular', normal:'Vazirmatn_400Regular', '500':'Vazirmatn_500Medium',
  '600':'Vazirmatn_600SemiBold', '700':'Vazirmatn_700Bold', bold:'Vazirmatn_700Bold',
  '800':'Vazirmatn_800ExtraBold', '900':'Vazirmatn_900Black',
};

function fontFor(lang, style, inherit) {
  if (lang !== 'fa') return null;
  const weight = StyleSheet.flatten(style)?.fontWeight;
  // Nested text without its own weight keeps the parent's font (e.g. bold).
  if (inherit && weight == null) return null;
  return { fontFamily: VAZIR[String(weight ?? '400')] || VAZIR['400'], fontWeight:'normal' };
}

const InText = createContext(false);

export const Text = forwardRef(function Text({ style, ...props }, ref) {
  const lang = useLang()?.lang;
  const nested = useContext(InText);
  const font = fontFor(lang, style, nested);
  return (
    <InText.Provider value>
      <RNText ref={ref} style={font ? [style, font] : style} {...props} />
    </InText.Provider>
  );
});

export const TextInput = forwardRef(function TextInput({ style, ...props }, ref) {
  const font = fontFor(useLang()?.lang, style, false);
  return <RNTextInput ref={ref} style={font ? [style, font] : style} {...props} />;
});
