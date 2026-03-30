import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius, SCAN_RESULTS, LAZY_ESTIMATES, QUICK_PROTEIN } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/UI';
import { sendProteinGoalNotification } from '../lib/notifications';

function getSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

export default function ScanScreen({ navigation }) {
  const { addMeal, today, goals }  = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning]     = useState(false);
  const [result, setResult]         = useState(null);
  const [lazyText, setLazyText]     = useState('');
  const [lazyResult, setLazyResult] = useState(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const animRef  = useRef(null);

  useEffect(() => () => animRef.current?.stop(), []);

  async function openCamera() {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setCameraOpen(true);
  }

  function startScan() {
    if (scanning) return;
    setScanning(true);
    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    animRef.current.start();

    setTimeout(() => {
      animRef.current?.stop();
      scanAnim.setValue(0);
      const meal = SCAN_RESULTS[Math.floor(Math.random() * SCAN_RESULTS.length)];
      setResult(meal);
      setScanning(false);
      setCameraOpen(false);
    }, 2500);
  }

  async function addScanned() {
    await addMeal(result.name, result.cal, result.p, result.c, result.f, getSlot());
    const newProtein = today.protein + result.p;
    if (newProtein >= goals.protein && today.protein < goals.protein) {
      await sendProteinGoalNotification(newProtein, goals.protein);
    }
    setResult(null);
    navigation.navigate('HomeTab');
  }

  async function quickAdd(item) {
    await addMeal(item.name, item.cal, item.g, 0, 0, getSlot());
  }

  function handleLazy() {
    const txt = lazyText.toLowerCase().trim();
    if (!txt) return;
    let found = null;
    for (const [key, val] of Object.entries(LAZY_ESTIMATES)) {
      if (txt.includes(key)) { found = { ...val }; break; }
    }
    if (!found) {
      found = {
        name: lazyText.charAt(0).toUpperCase() + lazyText.slice(1),
        cal: 350 + Math.floor(Math.random() * 200),
        p:    15 + Math.floor(Math.random() * 25),
        c:    30 + Math.floor(Math.random() * 30),
        f:     8 + Math.floor(Math.random() * 15),
      };
    }
    setLazyResult(found);
  }

  async function addLazy() {
    await addMeal(lazyResult.name, lazyResult.cal, lazyResult.p, lazyResult.c, lazyResult.f, getSlot());
    setLazyText(''); setLazyResult(null);
    navigation.navigate('HomeTab');
  }

  const scanLineY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] });

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Scan Meal" subtitle="AI identifies your food instantly" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Camera / placeholder */}
        {!cameraOpen && !result && (
          <TouchableOpacity style={s.camPlaceholder} onPress={openCamera} activeOpacity={0.85}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>📸</Text>
            <Text style={s.camTitle}>Tap to Open Camera</Text>
            <Text style={s.camSub}>Point at your meal — AI detects macros instantly</Text>
            {permission?.status === 'denied' && (
              <Text style={s.permDenied}>Camera permission denied. Enable it in Settings.</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Live camera — expo-camera v15 uses CameraView, no CameraType import needed */}
        {cameraOpen && !result && (
          <View style={s.cameraWrap}>
            <CameraView style={s.camera} facing="back">
              {scanning && (
                <Animated.View style={[s.scanLine, { transform: [{ translateY: scanLineY }] }]} />
              )}
              <View style={s.cameraOverlay}>
                {!scanning ? (
                  <TouchableOpacity style={s.captureBtn} onPress={startScan} activeOpacity={0.85}>
                    <View style={s.captureBtnInner} />
                  </TouchableOpacity>
                ) : (
                  <View style={s.scanPill}>
                    <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
                    <Text style={s.scanPillTxt}>Analyzing meal…</Text>
                  </View>
                )}
              </View>
            </CameraView>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setCameraOpen(false); setScanning(false); }}>
              <Text style={s.cancelTxt}>✕ Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scan result */}
        {result && (
          <View style={s.resultCard}>
            <Text style={s.resultTag}>✓ Meal Detected</Text>
            <Text style={s.resultName}>{result.name}</Text>
            <Text style={s.resultSub}>{result.sub}</Text>
            <View style={s.macroRow}>
              {[{ v: result.cal,       l: 'kcal',   c: colors.text   },
                { v: result.p + 'g',  l: 'protein', c: colors.accent },
                { v: result.c + 'g',  l: 'carbs',   c: colors.accent3},
                { v: result.f + 'g',  l: 'fat',     c: colors.orange }].map(m => (
                <View key={m.l} style={s.macroBox}>
                  <Text style={[s.macroVal, { color: m.c }]}>{m.v}</Text>
                  <Text style={s.macroLabel}>{m.l}</Text>
                </View>
              ))}
            </View>
            <View style={s.resultBtns}>
              <PrimaryButton title="✓ Add Meal" onPress={addScanned} style={{ flex: 1, marginRight: 8 }} />
              <SecondaryButton title="Rescan" onPress={() => setResult(null)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* Quick Protein Fix */}
        <Text style={s.sectionTitle}>⚡ Quick Protein Fix</Text>
        <Text style={s.sectionSub}>Tap to instantly log a protein source</Text>
        {QUICK_PROTEIN.map(item => (
          <TouchableOpacity key={item.name} style={s.qpRow} onPress={() => quickAdd(item)} activeOpacity={0.8}>
            <Text style={{ fontSize: 22, marginRight: 12 }}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.qpName}>{item.name}</Text>
              <Text style={s.qpCal}>{item.cal} kcal</Text>
            </View>
            <Text style={s.qpProtein}>{item.g}g</Text>
            <View style={s.addIcon}><Text style={{ color: colors.accent, fontWeight: '700', fontSize: 20 }}>+</Text></View>
          </TouchableOpacity>
        ))}

        {/* Lazy logging */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>💬 Describe Your Meal</Text>
        <Text style={s.sectionSub}>Type anything — AI estimates the macros</Text>
        <View style={s.lazyRow}>
          <TextInput
            style={s.lazyInput}
            value={lazyText}
            onChangeText={setLazyText}
            placeholder="e.g. chicken sandwich, pizza, burger…"
            placeholderTextColor={colors.text3}
            returnKeyType="go"
            onSubmitEditing={handleLazy}
          />
          <TouchableOpacity style={s.lazyBtn} onPress={handleLazy}>
            <Text style={{ color: '#0a0a0f', fontWeight: '700', fontSize: 16 }}>→</Text>
          </TouchableOpacity>
        </View>
        {lazyResult && (
          <View style={s.lazyCard}>
            <Text style={s.lazyName}>🍽️ {lazyResult.name}</Text>
            <View style={s.lazyMacros}>
              <Text style={s.lazyM}>Cals: <Text style={{ color: colors.text }}>{lazyResult.cal}</Text></Text>
              <Text style={s.lazyM}>Protein: <Text style={{ color: colors.accent }}>{lazyResult.p}g</Text></Text>
              <Text style={s.lazyM}>Carbs: <Text style={{ color: colors.text }}>{lazyResult.c}g</Text></Text>
              <Text style={s.lazyM}>Fat: <Text style={{ color: colors.text }}>{lazyResult.f}g</Text></Text>
            </View>
            <PrimaryButton title="Add This Meal" onPress={addLazy} style={{ marginTop: 10 }} />
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8 },
  camPlaceholder: { height: 230, backgroundColor: colors.bg3, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  camTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  camSub: { fontSize: 13, color: colors.text2, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  permDenied: { marginTop: 12, fontSize: 12, color: colors.orange, textAlign: 'center', paddingHorizontal: 20 },
  cameraWrap: { marginBottom: 20, borderRadius: radius.lg, overflow: 'hidden' },
  camera: { height: 340 },
  scanLine: { position: 'absolute', left: 20, right: 20, height: 2, backgroundColor: colors.accent, opacity: 0.9, borderRadius: 1 },
  cameraOverlay: { position: 'absolute', bottom: 24, left: 0, right: 0, alignItems: 'center' },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  scanPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  scanPillTxt: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  cancelBtn: { backgroundColor: colors.card, padding: 14, alignItems: 'center' },
  cancelTxt: { color: colors.text2, fontSize: 14 },
  resultCard: { backgroundColor: colors.bg2, borderRadius: radius.lg, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(126,255,160,0.3)' },
  resultTag: { fontSize: 11, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  resultName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  resultSub: { fontSize: 13, color: colors.text2, marginBottom: 14 },
  macroRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  macroBox: { flex: 1, backgroundColor: colors.card, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  macroVal: { fontSize: 16, fontWeight: '700' },
  macroLabel: { fontSize: 9, textTransform: 'uppercase', color: colors.text2, marginTop: 2, letterSpacing: 0.5 },
  resultBtns: { flexDirection: 'row' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: colors.text2, marginBottom: 12 },
  qpRow: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  qpName: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  qpCal: { fontSize: 11, color: colors.text2 },
  qpProtein: { fontSize: 18, fontWeight: '700', color: colors.accent, marginRight: 10 },
  addIcon: { width: 32, height: 32, backgroundColor: 'rgba(126,255,160,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lazyRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  lazyInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.text },
  lazyBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  lazyCard: { backgroundColor: 'rgba(126,255,160,0.06)', borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: 'rgba(126,255,160,0.2)' },
  lazyName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  lazyMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  lazyM: { fontSize: 13, color: colors.text2 },
});
