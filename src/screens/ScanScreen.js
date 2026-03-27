import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, SCAN_RESULTS, LAZY_ESTIMATES } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { PrimaryButton, SecondaryButton } from '../components/UI';

const QUICK_PROTEIN = [
  { g: 10, cal: 70, name: 'Glass of milk (250ml)', emoji: '🥛' },
  { g: 13, cal: 140, name: '2 whole eggs', emoji: '🥚' },
  { g: 17, cal: 90, name: 'Greek yogurt (150g)', emoji: '🫙' },
  { g: 31, cal: 165, name: 'Chicken breast (100g)', emoji: '🍗' },
  { g: 25, cal: 110, name: 'Tuna can (100g)', emoji: '🐟' },
];

function currentSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0;
  if (h < 14) return 1;
  if (h < 19) return 2;
  return 3;
}

export default function ScanScreen({ navigation }) {
  const { addMeal } = useApp();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [lazyText, setLazyText] = useState('');
  const [lazyResult, setLazyResult] = useState(null);

  function startScan() {
    if (result) return;
    setScanning(true);
    setTimeout(() => {
      const meal = SCAN_RESULTS[Math.floor(Math.random() * SCAN_RESULTS.length)];
      setResult(meal);
      setScanning(false);
    }, 2200);
  }

  function addScannedMeal() {
    if (!result) return;
    addMeal(result.name, result.cal, result.p, result.c, result.f, currentSlot());
    setResult(null);
    navigation.navigate('HomeTab');
  }

  function handleLazyLog() {
    const txt = lazyText.toLowerCase().trim();
    if (!txt) return;
    let found = null;
    for (const [key, val] of Object.entries(LAZY_ESTIMATES)) {
      if (txt.includes(key)) { found = val; break; }
    }
    if (!found) {
      found = {
        name: lazyText.charAt(0).toUpperCase() + lazyText.slice(1),
        cal: 350 + Math.floor(Math.random() * 200),
        p: 15 + Math.floor(Math.random() * 25),
        c: 30 + Math.floor(Math.random() * 30),
        f: 8 + Math.floor(Math.random() * 15),
      };
    }
    setLazyResult(found);
  }

  function addLazyMeal() {
    if (!lazyResult) return;
    addMeal(lazyResult.name, lazyResult.cal, lazyResult.p, lazyResult.c, lazyResult.f, currentSlot());
    setLazyText('');
    setLazyResult(null);
    navigation.navigate('HomeTab');
  }

  function quickAdd(g, cal, name) {
    addMeal(name, cal, g, 0, 0, currentSlot());
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Meal</Text>
        <Text style={styles.subtitle}>AI analyzes in seconds</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Camera Area */}
        <TouchableOpacity style={[styles.camera, scanning && styles.cameraActive]} onPress={startScan} activeOpacity={0.9}>
          {scanning ? (
            <View style={styles.scanningWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.scanningText}>AI analyzing your meal...</Text>
            </View>
          ) : result ? (
            <View style={styles.detectedWrap}>
              <Text style={{ fontSize: 56 }}>🍽️</Text>
              <Text style={styles.detectedText}>Meal Detected!</Text>
            </View>
          ) : (
            <View style={styles.camPlaceholder}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>📸</Text>
              <Text style={styles.camTitle}>Tap to Scan</Text>
              <Text style={styles.camSub}>Point at your meal{'\n'}AI detects everything instantly</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Scan Result */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultName}>{result.name}</Text>
            <Text style={styles.resultSub}>{result.sub}</Text>
            <View style={styles.macros}>
              {[
                { val: result.cal, label: 'kcal', color: colors.text },
                { val: result.p + 'g', label: 'protein', color: colors.accent },
                { val: result.c + 'g', label: 'carbs', color: colors.accent3 },
                { val: result.f + 'g', label: 'fat', color: colors.orange },
              ].map(m => (
                <View key={m.label} style={styles.macroBox}>
                  <Text style={[styles.macroVal, { color: m.color }]}>{m.val}</Text>
                  <Text style={styles.macroLabel}>{m.label}</Text>
                </View>
              ))}
            </View>
            <View style={styles.resultActions}>
              <PrimaryButton title="✓ Add Meal" onPress={addScannedMeal} style={{ flex: 1, marginRight: 8 }} />
              <SecondaryButton title="Rescan" onPress={() => setResult(null)} style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* Quick Protein Fix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Quick Protein Fix</Text>
          {QUICK_PROTEIN.map(item => (
            <View key={item.name} style={styles.qpItem}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.qpAmount}>{item.g}g protein</Text>
                <Text style={styles.qpName}>{item.name}</Text>
              </View>
              <TouchableOpacity style={styles.qpAdd} onPress={() => quickAdd(item.g, item.cal, item.name)}>
                <Text style={{ color: colors.accent, fontSize: 20, fontWeight: '700' }}>+</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Lazy Logging */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 Describe Your Meal</Text>
          <View style={styles.lazyRow}>
            <TextInput
              style={styles.lazyInput}
              value={lazyText}
              onChangeText={setLazyText}
              placeholder="e.g. chicken sandwich…"
              placeholderTextColor={colors.text3}
              onSubmitEditing={handleLazyLog}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.lazyBtn} onPress={handleLazyLog}>
              <Text style={{ color: '#0a0a0f', fontWeight: '700', fontSize: 18 }}>→</Text>
            </TouchableOpacity>
          </View>
          {lazyResult && (
            <View style={styles.lazyResult}>
              <Text style={styles.lazyResultName}>🍽️ {lazyResult.name}</Text>
              <View style={styles.lazyMacros}>
                <Text style={styles.lazyMacro}>Cals: <Text style={{ color: colors.text }}>{lazyResult.cal}</Text></Text>
                <Text style={styles.lazyMacro}>Protein: <Text style={{ color: colors.accent }}>{lazyResult.p}g</Text></Text>
                <Text style={styles.lazyMacro}>Carbs: <Text style={{ color: colors.text }}>{lazyResult.c}g</Text></Text>
                <Text style={styles.lazyMacro}>Fat: <Text style={{ color: colors.text }}>{lazyResult.f}g</Text></Text>
              </View>
              <PrimaryButton title="Add This Meal" onPress={addLazyMeal} style={{ marginTop: 10 }} />
            </View>
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.text2, marginTop: 2 },
  scroll: { padding: 18, paddingTop: 8 },
  camera: { height: 220, backgroundColor: colors.bg3, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  cameraActive: { borderColor: colors.accent },
  scanningWrap: { alignItems: 'center', gap: 14 },
  scanningText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  detectedWrap: { alignItems: 'center' },
  detectedText: { color: colors.accent, fontWeight: '700', fontSize: 15, marginTop: 8 },
  camPlaceholder: { alignItems: 'center' },
  camTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  camSub: { fontSize: 13, color: colors.text2, textAlign: 'center', lineHeight: 20 },
  resultCard: { backgroundColor: colors.bg2, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  resultName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  resultSub: { fontSize: 13, color: colors.text2, marginBottom: 14 },
  macros: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  macroBox: { flex: 1, backgroundColor: colors.card, borderRadius: radius.sm, padding: 10, alignItems: 'center' },
  macroVal: { fontSize: 18, fontWeight: '700' },
  macroLabel: { fontSize: 9, textTransform: 'uppercase', color: colors.text2, marginTop: 2, letterSpacing: 0.5 },
  resultActions: { flexDirection: 'row' },
  section: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  qpItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card2, borderRadius: radius.sm, padding: 12, marginBottom: 8 },
  qpAmount: { fontSize: 14, fontWeight: '700', color: colors.accent },
  qpName: { fontSize: 12, color: colors.text2, marginTop: 2 },
  qpAdd: { width: 32, height: 32, backgroundColor: 'rgba(126,255,160,0.15)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  lazyRow: { flexDirection: 'row', gap: 8 },
  lazyInput: { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 13, fontSize: 14, color: colors.text },
  lazyBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  lazyResult: { backgroundColor: colors.bg3, borderRadius: radius.sm, padding: 14, marginTop: 10, borderWidth: 1, borderColor: 'rgba(126,255,160,0.2)' },
  lazyResultName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  lazyMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lazyMacro: { fontSize: 13, color: colors.text2 },
});
