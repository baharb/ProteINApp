import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraType } from 'expo-camera';
import { colors, radius, SCAN_RESULTS, LAZY_ESTIMATES, QUICK_PROTEIN } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/UI';

function currentSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

export default function ScanScreen({ navigation }) {
  const { addMeal } = useApp();
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanning, setScanning]   = useState(false);
  const [result, setResult]       = useState(null);
  const [lazyText, setLazyText]   = useState('');
  const [lazyResult, setLazyResult] = useState(null);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  function openCamera() {
    setCameraActive(true);
  }

  function startScan() {
    if (scanning) return;
    setScanning(true);
    // animated scan line
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue:1, duration:1000, useNativeDriver:true }),
        Animated.timing(scanAnim, { toValue:0, duration:1000, useNativeDriver:true }),
      ])
    ).start();

    setTimeout(() => {
      scanAnim.stopAnimation();
      const meal = SCAN_RESULTS[Math.floor(Math.random() * SCAN_RESULTS.length)];
      setResult(meal);
      setScanning(false);
      setCameraActive(false);
    }, 2500);
  }

  function addScanned() {
    addMeal(result.name, result.cal, result.p, result.c, result.f, currentSlot());
    setResult(null);
    navigation.navigate('HomeTab');
  }

  function quickAdd(item) {
    addMeal(item.name, item.cal, item.g, 0, 0, currentSlot());
  }

  function handleLazy() {
    const txt = lazyText.toLowerCase().trim();
    if (!txt) return;
    let found = null;
    for (const [key, val] of Object.entries(LAZY_ESTIMATES)) {
      if (txt.includes(key)) { found = val; break; }
    }
    if (!found) {
      found = {
        name: lazyText.charAt(0).toUpperCase() + lazyText.slice(1),
        cal: 350 + Math.floor(Math.random()*200),
        p: 15 + Math.floor(Math.random()*25),
        c: 30 + Math.floor(Math.random()*30),
        f: 8 + Math.floor(Math.random()*15),
      };
    }
    setLazyResult(found);
  }

  function addLazy() {
    addMeal(lazyResult.name, lazyResult.cal, lazyResult.p, lazyResult.c, lazyResult.f, currentSlot());
    setLazyText(''); setLazyResult(null);
    navigation.navigate('HomeTab');
  }

  const scanLineY = scanAnim.interpolate({ inputRange:[0,1], outputRange:[0, 160] });

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Scan Meal" subtitle="AI identifies your food instantly" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Camera / Scan area */}
        {!cameraActive && !result && (
          <TouchableOpacity style={s.cameraPlaceholder} onPress={openCamera} activeOpacity={0.85}>
            <Text style={{fontSize:52, marginBottom:12}}>📸</Text>
            <Text style={s.camTitle}>Tap to Open Camera</Text>
            <Text style={s.camSub}>Point at your meal — AI detects macros instantly</Text>
            {hasPermission === false && (
              <Text style={s.permDenied}>Camera permission denied. Please allow in Settings.</Text>
            )}
          </TouchableOpacity>
        )}

        {cameraActive && hasPermission && !result && (
          <View style={s.cameraWrap}>
            <Camera style={s.camera} type={CameraType.back}>
              {scanning && (
                <Animated.View style={[s.scanLine, {transform:[{translateY:scanLineY}]}]} />
              )}
              <View style={s.cameraOverlay}>
                {!scanning ? (
                  <TouchableOpacity style={s.captureBtn} onPress={startScan} activeOpacity={0.85}>
                    <View style={s.captureBtnInner} />
                  </TouchableOpacity>
                ) : (
                  <View style={s.scanningPill}>
                    <ActivityIndicator size="small" color={colors.accent} style={{marginRight:8}} />
                    <Text style={s.scanningText}>Analyzing meal…</Text>
                  </View>
                )}
              </View>
            </Camera>
            <TouchableOpacity style={s.cancelCamera} onPress={() => setCameraActive(false)}>
              <Text style={s.cancelCameraText}>✕ Cancel</Text>
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
              {[{v:result.cal,  l:'kcal',    c:colors.text},
                {v:result.p+'g',l:'protein', c:colors.accent},
                {v:result.c+'g',l:'carbs',   c:colors.accent3},
                {v:result.f+'g',l:'fat',     c:colors.orange}].map(m => (
                <View key={m.l} style={s.macroBox}>
                  <Text style={[s.macroVal,{color:m.c}]}>{m.v}</Text>
                  <Text style={s.macroLabel}>{m.l}</Text>
                </View>
              ))}
            </View>
            <View style={s.resultBtns}>
              <PrimaryButton title="✓ Add Meal" onPress={addScanned} style={{flex:1,marginRight:8}} />
              <SecondaryButton title="Rescan" onPress={() => setResult(null)} style={{flex:1}} />
            </View>
          </View>
        )}

        {/* Quick Protein Fix */}
        <Text style={s.sectionTitle}>⚡ Quick Protein Fix</Text>
        <Text style={s.sectionSub}>Tap to instantly log a protein source</Text>
        {QUICK_PROTEIN.map(item => (
          <TouchableOpacity key={item.name} style={s.qpRow} onPress={() => quickAdd(item)} activeOpacity={0.8}>
            <Text style={{fontSize:22,marginRight:12}}>{item.emoji}</Text>
            <View style={{flex:1}}>
              <Text style={s.qpName}>{item.name}</Text>
              <Text style={s.qpCal}>{item.cal} kcal</Text>
            </View>
            <View style={s.qpRight}>
              <Text style={s.qpProtein}>{item.g}g</Text>
              <Text style={s.qpLabel}>protein</Text>
            </View>
            <View style={s.addIcon}><Text style={{color:colors.accent,fontWeight:'700',fontSize:18}}>+</Text></View>
          </TouchableOpacity>
        ))}

        {/* Lazy Logging */}
        <Text style={[s.sectionTitle,{marginTop:8}]}>💬 Describe Your Meal</Text>
        <Text style={s.sectionSub}>Type anything — AI estimates the macros</Text>
        <View style={s.lazyRow}>
          <TextInput
            style={s.lazyInput}
            value={lazyText}
            onChangeText={setLazyText}
            placeholder="e.g. chicken sandwich, pasta, burger…"
            placeholderTextColor={colors.text3}
            returnKeyType="go"
            onSubmitEditing={handleLazy}
          />
          <TouchableOpacity style={s.lazyBtn} onPress={handleLazy}>
            <Text style={{color:'#0a0a0f',fontWeight:'700',fontSize:16}}>→</Text>
          </TouchableOpacity>
        </View>
        {lazyResult && (
          <View style={s.lazyCard}>
            <Text style={s.lazyName}>🍽️ {lazyResult.name}</Text>
            <View style={s.lazyMacros}>
              <Text style={s.lazyM}>Cals: <Text style={{color:colors.text}}>{lazyResult.cal}</Text></Text>
              <Text style={s.lazyM}>Protein: <Text style={{color:colors.accent}}>{lazyResult.p}g</Text></Text>
              <Text style={s.lazyM}>Carbs: <Text style={{color:colors.text}}>{lazyResult.c}g</Text></Text>
              <Text style={s.lazyM}>Fat: <Text style={{color:colors.text}}>{lazyResult.f}g</Text></Text>
            </View>
            <PrimaryButton title="Add This Meal" onPress={addLazy} style={{marginTop:10}} />
          </View>
        )}

        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  cameraPlaceholder: { height:220, backgroundColor:colors.bg3, borderRadius:radius.lg, borderWidth:2, borderColor:colors.border, borderStyle:'dashed', alignItems:'center', justifyContent:'center', marginBottom:20 },
  camTitle: { fontSize:18, fontWeight:'700', color:colors.text, marginBottom:6 },
  camSub: { fontSize:13, color:colors.text2, textAlign:'center', lineHeight:20, paddingHorizontal:20 },
  permDenied: { marginTop:12, fontSize:12, color:colors.orange, textAlign:'center' },
  cameraWrap: { marginBottom:20, borderRadius:radius.lg, overflow:'hidden' },
  camera: { height:320, borderRadius:radius.lg },
  scanLine: { position:'absolute', left:0, right:0, height:2, backgroundColor:colors.accent, opacity:0.8 },
  cameraOverlay: { position:'absolute', bottom:20, left:0, right:0, alignItems:'center' },
  captureBtn: { width:70, height:70, borderRadius:35, borderWidth:3, borderColor:'#fff', alignItems:'center', justifyContent:'center' },
  captureBtnInner: { width:54, height:54, borderRadius:27, backgroundColor:'#fff' },
  scanningPill: { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(0,0,0,0.7)', borderRadius:20, paddingHorizontal:16, paddingVertical:8 },
  scanningText: { color:colors.accent, fontSize:14, fontWeight:'600' },
  cancelCamera: { backgroundColor:colors.card, padding:14, alignItems:'center' },
  cancelCameraText: { color:colors.text2, fontSize:14 },
  resultCard: { backgroundColor:colors.bg2, borderRadius:radius.lg, padding:18, marginBottom:20, borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  resultTag: { fontSize:11, color:colors.accent, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:6 },
  resultName: { fontSize:20, fontWeight:'700', color:colors.text, marginBottom:4 },
  resultSub: { fontSize:13, color:colors.text2, marginBottom:14 },
  macroRow: { flexDirection:'row', gap:8, marginBottom:14 },
  macroBox: { flex:1, backgroundColor:colors.card, borderRadius:radius.sm, padding:10, alignItems:'center' },
  macroVal: { fontSize:16, fontWeight:'700' },
  macroLabel: { fontSize:9, textTransform:'uppercase', color:colors.text2, marginTop:2, letterSpacing:0.5 },
  resultBtns: { flexDirection:'row' },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:4 },
  sectionSub: { fontSize:12, color:colors.text2, marginBottom:12 },
  qpRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  qpName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  qpCal: { fontSize:11, color:colors.text2 },
  qpRight: { alignItems:'flex-end', marginRight:12 },
  qpProtein: { fontSize:18, fontWeight:'700', color:colors.accent },
  qpLabel: { fontSize:10, color:colors.text2 },
  addIcon: { width:32, height:32, backgroundColor:'rgba(126,255,160,0.15)', borderRadius:8, alignItems:'center', justifyContent:'center' },
  lazyRow: { flexDirection:'row', gap:8, marginBottom:8 },
  lazyInput: { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:14, color:colors.text },
  lazyBtn: { backgroundColor:colors.accent, borderRadius:radius.sm, paddingHorizontal:16, alignItems:'center', justifyContent:'center' },
  lazyCard: { backgroundColor:'rgba(126,255,160,0.06)', borderRadius:radius.lg, padding:14, borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  lazyName: { fontSize:14, fontWeight:'700', color:colors.text, marginBottom:8 },
  lazyMacros: { flexDirection:'row', flexWrap:'wrap', gap:12 },
  lazyM: { fontSize:13, color:colors.text2 },
});
