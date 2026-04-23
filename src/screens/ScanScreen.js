import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Alert, useWindowDimensions, Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { colors, radius, QUICK_PROTEIN } from '../data/constants';
import { searchLocalDB } from '../data/nutritionDB';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/UI';
import { sendProteinGoalNotification } from '../lib/notifications';
import { SERVER_URL, fetchWithTimeout } from '../lib/config';
import { useVoice } from '../hooks/useVoice';

function getSlot() {
  const h = new Date().getHours();
  if (h < 10) return 0; if (h < 14) return 1; if (h < 19) return 2; return 3;
}

const CONF_COLOR = { high: colors.accent, medium: colors.accent3, low: colors.orange };

function calcIngredient(ing) {
  const f = (parseFloat(ing.amount_g) || 0) / 100;
  return {
    calories: Math.round((ing.per_100g?.calories || 0) * f),
    protein:  Math.round((ing.per_100g?.protein  || 0) * f),
    carbs:    Math.round((ing.per_100g?.carbs    || 0) * f),
    fat:      Math.round((ing.per_100g?.fat      || 0) * f),
  };
}

function calcTotals(ingredients) {
  return ingredients.reduce((acc, ing) => {
    const m = calcIngredient(ing);
    return { calories: acc.calories+m.calories, protein: acc.protein+m.protein, carbs: acc.carbs+m.carbs, fat: acc.fat+m.fat };
  }, { calories:0, protein:0, carbs:0, fat:0 });
}

// ── Mic button with animated pulse ───────────────────────────────────────
function MicButton({ isListening, onPress, size = 44 }) {
  const pulse = useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue:1.3, duration:500, useNativeDriver:true }),
          Animated.timing(pulse, { toValue:1,   duration:500, useNativeDriver:true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [isListening]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ alignItems:'center', justifyContent:'center' }}>
      <Animated.View style={[
        mb.btn,
        { width:size, height:size, borderRadius:size/2 },
        isListening && mb.btnActive,
        { transform:[{ scale:pulse }] },
      ]}>
        <Text style={{ fontSize: size * 0.45 }}>🎤</Text>
      </Animated.View>
      {isListening && <Text style={mb.listeningLabel}>Listening…</Text>}
    </TouchableOpacity>
  );
}

const mb = StyleSheet.create({
  btn: { backgroundColor:colors.card, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  btnActive: { backgroundColor:'rgba(126,255,160,0.2)', borderColor:colors.accent },
  listeningLabel: { fontSize:10, color:colors.accent, marginTop:3, fontWeight:'600' },
});

// ── Add Ingredient Modal ──────────────────────────────────────────────────
function AddIngredientModal({ onAdd, onClose }) {
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [grams,    setGrams]    = useState('100');
  const inputRef = useRef(null);

  // Voice for ingredient search
  const voice = useVoice({
    onResult: (text) => { setQuery(text); setResults(searchLocalDB(text).slice(0, 8)); },
    onPartialResult: (text) => { setQuery(text); setResults(searchLocalDB(text).slice(0, 6)); },
  });

  function handleSearch(text) {
    setQuery(text); setSelected(null);
    setResults(text.length >= 1 ? searchLocalDB(text).slice(0, 8) : []);
  }

  function selectFood(food) { setSelected(food); setResults([]); setQuery(food.name); }

  function handleAdd() {
    if (!selected) { Alert.alert('Pick a food', 'Type and select one from the list.'); return; }
    const g = parseFloat(grams) || 100;
    onAdd({ name:selected.name, amount_g:g, per_100g:{ calories:selected.cal, protein:selected.p, carbs:selected.c, fat:selected.f } });
    onClose();
  }

  const g = parseFloat(grams) || 0;
  const preview = selected && g > 0 ? {
    cal: Math.round(selected.cal*g/100), p: Math.round(selected.p*g/100),
    c: Math.round(selected.c*g/100),    f: Math.round(selected.f*g/100),
  } : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={am.overlay}>
        <View style={am.sheet}>
          <View style={am.handle} />
          <Text style={am.title}>Add Ingredient</Text>

          {/* Search row with mic — Fix #2 #3 */}
          <View style={am.searchRow}>
            <TextInput ref={inputRef} style={am.input} value={query} onChangeText={handleSearch}
              placeholder="Search ingredient…" placeholderTextColor={colors.text3} autoFocus />
            <MicButton isListening={voice.isListening} size={40}
              onPress={voice.isListening ? voice.stopListening : voice.startListening} />
          </View>

          {/* Dropdown — no keyboard obstruction when voice active */}
          {results.length > 0 && (
            <View style={am.dropdown}>
              {results.map((f, i) => (
                <TouchableOpacity key={i} style={[am.dropItem, i===results.length-1&&{borderBottomWidth:0}]} onPress={() => selectFood(f)}>
                  <Text style={am.dropName}>{f.name}</Text>
                  <Text style={am.dropMacros}>{f.p}g protein · {f.cal} kcal / 100g</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selected && (
            <>
              <View style={am.selectedBadge}><Text style={am.selectedTxt}>✓ {selected.name}</Text></View>
              <Text style={am.gramsLabel}>Amount (grams)</Text>
              <View style={am.presetsRow}>
                {['50','100','150','200','250'].map(p => (
                  <TouchableOpacity key={p} style={[am.preset, grams===p&&am.presetOn]} onPress={() => setGrams(p)}>
                    <Text style={[am.presetTxt, grams===p&&{color:colors.accent}]}>{p}g</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={am.gramsInput} value={grams} onChangeText={setGrams} keyboardType="numeric" placeholder="Custom grams" placeholderTextColor={colors.text3} selectTextOnFocus />
              {preview && (
                <View style={am.preview}>
                  <Text style={am.previewTxt}>
                    For {grams}g: <Text style={{color:colors.accent}}>{preview.p}g protein</Text>
                    {' · '}{preview.cal} kcal · {preview.c}g carbs · {preview.f}g fat
                  </Text>
                </View>
              )}
            </>
          )}

          <PrimaryButton title="Add to Meal" onPress={handleAdd} style={{marginTop:16}} />
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={onClose}>
            <Text style={{color:colors.text2}}>Cancel</Text>
          </TouchableOpacity>
          <View style={{height:20}} />
        </View>
      </View>
    </Modal>
  );
}

const am = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet: { backgroundColor:colors.bg2, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'85%' },
  handle: { width:40, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  title: { fontSize:18, fontWeight:'700', color:colors.text, marginBottom:12 },
  searchRow: { flexDirection:'row', gap:8, alignItems:'center', marginBottom:6 },
  input: { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:14, color:colors.text },
  dropdown: { backgroundColor:colors.card2, borderRadius:radius.sm, borderWidth:1, borderColor:colors.border, marginBottom:10, maxHeight:200, overflow:'hidden' },
  dropItem: { padding:12, borderBottomWidth:1, borderBottomColor:colors.border },
  dropName: { fontSize:13, fontWeight:'600', color:colors.text },
  dropMacros: { fontSize:11, color:colors.text2, marginTop:2 },
  selectedBadge: { backgroundColor:'rgba(126,255,160,0.1)', borderRadius:radius.sm, padding:10, marginBottom:12, borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  selectedTxt: { fontSize:13, fontWeight:'700', color:colors.accent },
  gramsLabel: { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, color:colors.text2, marginBottom:8 },
  presetsRow: { flexDirection:'row', gap:8, marginBottom:8 },
  preset: { flex:1, backgroundColor:colors.card, borderRadius:8, paddingVertical:8, alignItems:'center', borderWidth:1, borderColor:colors.border },
  presetOn: { borderColor:colors.accent, backgroundColor:'rgba(126,255,160,0.1)' },
  presetTxt: { fontSize:12, fontWeight:'600', color:colors.text2 },
  gramsInput: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:16, color:colors.text, textAlign:'center', marginBottom:8 },
  preview: { backgroundColor:colors.card, borderRadius:radius.sm, padding:12, marginBottom:4 },
  previewTxt: { fontSize:13, color:colors.text2, lineHeight:20 },
});

// ── LazyResultCard with gram picker ───────────────────────────────────────
function LazyResultCard({ result, onAdd }) {
  const [grams, setGrams] = useState('100');
  const g = parseFloat(grams) || 0;
  const factor = g / 100;
  const calc = { cal:Math.round(result.cal*factor), p:Math.round(result.p*factor), c:Math.round(result.c*factor), f:Math.round(result.f*factor) };
  return (
    <View style={lc.card}>
      <Text style={lc.name}>🍽️ {result.name}</Text>
      <Text style={lc.per100}>per 100g: {result.p}g protein · {result.cal} kcal</Text>
      <View style={lc.presetsRow}>
        {['50','100','150','200','300'].map(p => (
          <TouchableOpacity key={p} style={[lc.preset, grams===p&&lc.presetOn]} onPress={() => setGrams(p)}>
            <Text style={[lc.presetTxt, grams===p&&{color:colors.accent}]}>{p}g</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput style={lc.gramsInput} value={grams} onChangeText={setGrams} keyboardType="numeric" placeholderTextColor={colors.text3} selectTextOnFocus />
      <View style={lc.macros}>
        <Text style={lc.macro}>Cals: <Text style={{color:colors.text}}>{calc.cal}</Text></Text>
        <Text style={lc.macro}>Protein: <Text style={{color:colors.accent}}>{calc.p}g</Text></Text>
        <Text style={lc.macro}>Carbs: <Text style={{color:colors.text}}>{calc.c}g</Text></Text>
        <Text style={lc.macro}>Fat: <Text style={{color:colors.text}}>{calc.f}g</Text></Text>
      </View>
      <PrimaryButton title={`Add ${grams}g to Today`} onPress={() => onAdd(calc, grams, result.name)} style={{marginTop:10}} />
    </View>
  );
}
const lc = StyleSheet.create({
  card: { backgroundColor:'rgba(126,255,160,0.06)', borderRadius:radius.lg, padding:14, borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  name: { fontSize:15, fontWeight:'700', color:colors.text, marginBottom:2 },
  per100: { fontSize:11, color:colors.text2, marginBottom:10 },
  presetsRow: { flexDirection:'row', gap:6, marginBottom:8 },
  preset: { flex:1, backgroundColor:colors.card, borderRadius:8, paddingVertical:7, alignItems:'center', borderWidth:1, borderColor:colors.border },
  presetOn: { borderColor:colors.accent, backgroundColor:'rgba(126,255,160,0.1)' },
  presetTxt: { fontSize:11, fontWeight:'600', color:colors.text2 },
  gramsInput: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:11, fontSize:15, color:colors.text, textAlign:'center', marginBottom:8 },
  macros: { flexDirection:'row', flexWrap:'wrap', gap:10 },
  macro: { fontSize:13, color:colors.text2 },
});

// ── Ingredient Editor ─────────────────────────────────────────────────────
function IngredientEditor({ scanResult, onConfirm, onRescan, onCancel }) {
  const [ingredients, setIngredients] = useState(scanResult.ingredients);
  const [showAddModal, setShowAddModal] = useState(false);
  const totals = calcTotals(ingredients);

  function updateAmount(i, val) { setIngredients(prev => prev.map((ing, idx) => idx===i ? {...ing, amount_g:val} : ing)); }
  function removeIng(i)         { setIngredients(prev => prev.filter((_,idx) => idx!==i)); }
  function addIng(newIng)       { setIngredients(prev => [...prev, newIng]); }

  return (
    <View style={ie.container}>
      <View style={ie.header}>
        <View style={{flex:1}}>
          <View style={{flexDirection:'row', alignItems:'center', gap:8, marginBottom:4}}>
            <View style={[ie.confDot, {backgroundColor:CONF_COLOR[scanResult.confidence]}]} />
            <Text style={ie.mealName} numberOfLines={2}>{scanResult.meal_name}</Text>
          </View>
          {scanResult.notes ? <Text style={ie.notes}>{scanResult.notes}</Text> : null}
        </View>
        <TouchableOpacity onPress={onCancel} style={ie.cancelBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={ie.cancelTxt}>✕</Text>
        </TouchableOpacity>
      </View>
      <Text style={ie.instruction}>✏️ Adjust grams if needed — totals update live</Text>
      {ingredients.map((ing, i) => {
        const m = calcIngredient(ing);
        return (
          <View key={i} style={ie.ingRow}>
            <View style={ie.ingLeft}>
              <Text style={ie.ingName} numberOfLines={1}>{ing.name}</Text>
              <Text style={ie.ingMacros}>{m.protein}g prot · {m.calories} kcal</Text>
              <Text style={ie.ingPer100}>per 100g: {ing.per_100g?.protein}g prot / {ing.per_100g?.calories} kcal</Text>
            </View>
            <View style={ie.ingRight}>
              <TextInput style={ie.gramInput} value={String(ing.amount_g)} onChangeText={v => updateAmount(i, v)} keyboardType="numeric" selectTextOnFocus />
              <Text style={ie.gramLabel}>g</Text>
              <TouchableOpacity onPress={() => removeIng(i)} style={ie.removeBtn}>
                <Text style={{color:colors.text3, fontSize:18}}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      <TouchableOpacity style={ie.addIngBtn} onPress={() => setShowAddModal(true)}>
        <Text style={ie.addIngTxt}>+ Add ingredient</Text>
      </TouchableOpacity>
      <View style={ie.totals}>
        <Text style={ie.totalsTitle}>Total for this meal</Text>
        <View style={ie.totalsRow}>
          {[
            {label:'Calories',val:`${totals.calories}`,color:colors.text},
            {label:'Protein', val:`${totals.protein}g`,color:colors.accent},
            {label:'Carbs',   val:`${totals.carbs}g`,  color:colors.accent3},
            {label:'Fat',     val:`${totals.fat}g`,    color:colors.orange},
          ].map(m => (
            <View key={m.label} style={ie.totalItem}>
              <Text style={[ie.totalVal,{color:m.color}]}>{m.val}</Text>
              <Text style={ie.totalLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>
      <PrimaryButton title={`✓ Add to Log  (${totals.protein}g protein)`} onPress={() => onConfirm(ingredients, totals)} style={{marginTop:4}} />
      <SecondaryButton title="Rescan" onPress={onRescan} style={{marginTop:8}} />
      {showAddModal && <AddIngredientModal onAdd={addIng} onClose={() => setShowAddModal(false)} />}
    </View>
  );
}

const ie = StyleSheet.create({
  container: { backgroundColor:colors.bg2, borderRadius:radius.lg, padding:18, marginBottom:20, borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  header: { flexDirection:'row', alignItems:'flex-start', marginBottom:10 },
  confDot: { width:8, height:8, borderRadius:4, marginTop:4 },
  mealName: { fontSize:19, fontWeight:'700', color:colors.text, flex:1 },
  notes: { fontSize:12, color:colors.text2, fontStyle:'italic', marginTop:2 },
  cancelBtn: { backgroundColor:colors.card, borderRadius:20, width:30, height:30, alignItems:'center', justifyContent:'center', marginLeft:8 },
  cancelTxt: { color:colors.text2, fontSize:16, fontWeight:'700' },
  instruction: { fontSize:12, color:colors.accent3, marginBottom:14, lineHeight:18 },
  ingRow: { flexDirection:'row', alignItems:'center', backgroundColor:colors.card, borderRadius:radius.sm, padding:12, marginBottom:8, borderWidth:1, borderColor:colors.border },
  ingLeft: { flex:1, marginRight:8 },
  ingName: { fontSize:13, fontWeight:'700', color:colors.text, marginBottom:2 },
  ingMacros: { fontSize:11, color:colors.accent, marginBottom:1 },
  ingPer100: { fontSize:10, color:colors.text3 },
  ingRight: { flexDirection:'row', alignItems:'center', gap:4 },
  gramInput: { backgroundColor:colors.bg3, borderRadius:6, padding:6, width:56, textAlign:'center', color:colors.text, fontSize:15, fontWeight:'700', borderWidth:1, borderColor:colors.border },
  gramLabel: { fontSize:12, color:colors.text2 },
  removeBtn: { paddingLeft:6 },
  addIngBtn: { alignItems:'center', padding:10, marginBottom:14, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, borderStyle:'dashed' },
  addIngTxt: { color:colors.accent, fontSize:13, fontWeight:'600' },
  totals: { backgroundColor:'rgba(126,255,160,0.07)', borderRadius:radius.sm, padding:14, marginBottom:16, borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  totalsTitle: { fontSize:11, fontWeight:'700', color:colors.accent, textTransform:'uppercase', letterSpacing:0.5, marginBottom:10 },
  totalsRow: { flexDirection:'row', justifyContent:'space-between' },
  totalItem: { alignItems:'center', flex:1 },
  totalVal: { fontSize:20, fontWeight:'700' },
  totalLabel: { fontSize:10, color:colors.text2, marginTop:2 },
});

// ── Main ScanScreen ───────────────────────────────────────────────────────
export default function ScanScreen({ navigation }) {
  const { addMeal, today, goals } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera,   setShowCamera]   = useState(false);
  const [cameraReady,  setCameraReady]  = useState(false);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [scanResult,   setScanResult]   = useState(null);
  const [scanError,    setScanError]    = useState(null);
  const [addedItems,   setAddedItems]   = useState([]);
  const [lazyText,     setLazyText]     = useState('');
  const [lazyDropdown, setLazyDropdown] = useState([]);
  const [lazyResult,   setLazyResult]   = useState(null);

  const cameraRef = useRef(null);

  // Fix #2 #3 — voice for describe meal section
  // When voice result comes in, immediately search and show dropdown (no keyboard)
  const voice = useVoice({
    onResult: (text) => {
      setLazyText(text);
      setLazyResult(null);
      const results = searchLocalDB(text);
      if (results.length > 0) {
        setLazyDropdown(results.slice(0, 6));
      } else {
        // No exact match — use as estimate
        setLazyResult({ name:text.charAt(0).toUpperCase()+text.slice(1), cal:300, p:15, c:30, f:10 });
      }
    },
    onPartialResult: (text) => {
      setLazyText(text);
      if (text.length >= 2) setLazyDropdown(searchLocalDB(text).slice(0, 6));
    },
  });

  async function openCamera() {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Camera Permission', 'Please allow camera access in Settings.'); return; }
    }
    setScanResult(null); setScanError(null);
    setCameraReady(false); setShowCamera(true);
  }

  async function takePicture() {
    if (!cameraRef.current || !cameraReady || analyzing) return;
    try {
      setAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality:0.5, base64:false, skipProcessing:true, exif:false });
      setShowCamera(false);
      if (!photo?.uri) throw new Error('Camera returned no photo. Please try again.');
      const resized = await ImageManipulator.manipulateAsync(photo.uri, [{resize:{width:512}}], {compress:0.6, format:ImageManipulator.SaveFormat.JPEG, base64:true});
      if (!resized?.base64) throw new Error('Could not process image.');
      const res = await fetchWithTimeout(`${SERVER_URL}/scan`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({imageBase64:resized.base64, mimeType:'image/jpeg'}) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Server error ${res.status}`);
      setScanResult(data);
    } catch (err) {
      setShowCamera(false);
      setScanError(err.message.includes('Server not responding')||err.message.includes('fetch') ? `Cannot reach server.\n\n• Run: node server.js\n• Check SERVER_URL in config.js\n• Phone & PC on same WiFi` : err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleConfirm(ingredients, totals) {
    await addMeal(scanResult.meal_name, totals.calories, totals.protein, totals.carbs, totals.fat, getSlot());
    const newP = today.protein + totals.protein;
    if (newP >= goals.protein && today.protein < goals.protein) await sendProteinGoalNotification(newP, goals.protein);
    setAddedItems(prev => [{name:scanResult.meal_name, p:totals.protein, cal:totals.calories, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},...prev].slice(0,5));
    setScanResult(null);
    navigation.navigate('HomeTab');
  }

  async function quickAdd(item) {
    await addMeal(item.name, item.cal, item.g, 0, 0, getSlot());
    setAddedItems(prev => [{name:item.name, p:item.g, cal:item.cal, time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})},...prev].slice(0,5));
  }

  async function addLazyWithGrams(calc, grams, name) {
    await addMeal(`${name} (${grams}g)`, calc.cal, calc.p, calc.c, calc.f, getSlot());
    setLazyText(''); setLazyResult(null); setLazyDropdown([]);
    navigation.navigate('HomeTab');
  }

  function handleLazyChange(text) {
    setLazyText(text); setLazyResult(null);
    setLazyDropdown(text.length >= 2 ? searchLocalDB(text).slice(0, 6) : []);
  }

  function selectLazyFood(food) {
    setLazyResult({name:food.name, cal:food.cal, p:food.p, c:food.c, f:food.f});
    setLazyText(food.name); setLazyDropdown([]);
  }

  function handleLazySubmit() {
    if (lazyResult) return;
    const txt = lazyText.trim();
    if (!txt) return;
    const found = searchLocalDB(txt)[0];
    setLazyResult(found || {name:txt.charAt(0).toUpperCase()+txt.slice(1), cal:300, p:15, c:30, f:10});
    setLazyDropdown([]);
  }

  const camH = isLandscape ? height * 0.75 : 380;

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Scan Meal" subtitle="AI detects ingredients — adjust then log" />

      {showCamera && (
        <View style={[s.cameraContainer, {height:camH}, analyzing && s.hidden]}>
          <CameraView ref={cameraRef} style={{flex:1}} facing="back" onCameraReady={() => setCameraReady(true)}>
            <View style={s.scanFrame}>
              {[
                {k:'TL',extra:{top:0,left:0,borderTopWidth:3,borderLeftWidth:3,borderTopLeftRadius:5}},
                {k:'TR',extra:{top:0,right:0,borderTopWidth:3,borderRightWidth:3,borderTopRightRadius:5}},
                {k:'BL',extra:{bottom:0,left:0,borderBottomWidth:3,borderLeftWidth:3,borderBottomLeftRadius:5}},
                {k:'BR',extra:{bottom:0,right:0,borderBottomWidth:3,borderRightWidth:3,borderBottomRightRadius:5}},
              ].map(c => <View key={c.k} style={[s.corner, c.extra]} />)}
            </View>
            <Text style={s.scanHint}>{cameraReady ? 'Tap to capture' : '⏳ Camera loading…'}</Text>
            <View style={s.cameraOverlay}>
              <TouchableOpacity style={[s.captureBtn, !cameraReady&&s.captureBtnDisabled]} onPress={takePicture} disabled={!cameraReady||analyzing} activeOpacity={0.85}>
                <View style={s.captureBtnInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
          <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowCamera(false); setCameraReady(false); }}>
            <Text style={s.cancelTxt}>✕ Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]}>
        {!showCamera && !analyzing && !scanResult && (
          <TouchableOpacity style={s.camPlaceholder} onPress={openCamera} activeOpacity={0.85}>
            <Text style={{fontSize:52, marginBottom:12}}>📸</Text>
            <Text style={s.camTitle}>Tap to Scan Your Meal</Text>
            <Text style={s.camSub}>AI detects each ingredient separately{'\n'}Adjust amounts before logging</Text>
            {permission?.status === 'denied' && <Text style={s.permDenied}>Camera denied — enable in Settings</Text>}
          </TouchableOpacity>
        )}
        {analyzing && (
          <View style={s.analyzingCard}>
            <Text style={{fontSize:56, marginBottom:16}}>🔍</Text>
            <Text style={s.analyzingTitle}>Identifying ingredients…</Text>
            <Text style={s.analyzingSub}>AI breaking down each component of your meal</Text>
            <ActivityIndicator color={colors.accent} size="large" style={{marginTop:16}} />
          </View>
        )}
        {scanError && !analyzing && (
          <View style={s.errorCard}>
            <Text style={s.errorTitle}>⚠️ Scan Failed</Text>
            <Text style={s.errorMsg}>{scanError}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={() => { setScanError(null); openCamera(); }}>
              <Text style={s.retryTxt}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        {scanResult && !analyzing && (
          <IngredientEditor scanResult={scanResult} onConfirm={handleConfirm}
            onRescan={() => { setScanResult(null); openCamera(); }} onCancel={() => setScanResult(null)} />
        )}

        <Text style={s.sectionTitle}>⚡ Quick Protein Fix</Text>
        <Text style={s.sectionSub}>Tap to instantly log a protein source</Text>
        {addedItems.length > 0 && (
          <View style={s.addedBox}>
            <View style={s.addedHeader}>
              <Text style={s.addedTitle}>✓ Just Added</Text>
              <TouchableOpacity onPress={() => navigation.navigate('HomeTab')}><Text style={s.viewLogBtn}>View Today's Log →</Text></TouchableOpacity>
            </View>
            {addedItems.map((item, i) => (
              <View key={i} style={s.addedRow}>
                <Text style={s.addedName} numberOfLines={1}>{item.name}</Text>
                <Text style={s.addedMeta}>{item.p}g protein · {item.time}</Text>
              </View>
            ))}
          </View>
        )}
        {QUICK_PROTEIN.map(item => (
          <TouchableOpacity key={item.name} style={s.qpRow} onPress={() => quickAdd(item)} activeOpacity={0.8}>
            <Text style={{fontSize:22, marginRight:12}}>{item.emoji}</Text>
            <View style={{flex:1}}>
              <Text style={s.qpName}>{item.name}</Text>
              <Text style={s.qpCal}>{item.cal} kcal</Text>
            </View>
            <Text style={s.qpProtein}>{item.g}g</Text>
            <View style={s.addIcon}><Text style={{color:colors.accent, fontWeight:'700', fontSize:20}}>+</Text></View>
          </TouchableOpacity>
        ))}

        {/* Fix #2 #3 — voice mic starts recognition immediately, dropdown appears without keyboard */}
        <Text style={[s.sectionTitle, {marginTop:8}]}>💬 Describe Your Meal</Text>
        <Text style={s.sectionSub}>Type or tap mic to speak — results appear instantly</Text>

        {/* Voice status banner */}
        {voice.isListening && (
          <View style={s.voiceBanner}>
            <Text style={s.voiceBannerTxt}>🎤 Listening… say a food name</Text>
            <TouchableOpacity onPress={voice.stopListening}>
              <Text style={s.voiceStopBtn}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
        {voice.error && <Text style={s.voiceError}>{voice.error}</Text>}

        <View style={s.lazyRow}>
          <TextInput style={s.lazyInput} value={lazyText} onChangeText={handleLazyChange}
            placeholder={voice.isListening ? 'Listening…' : 'e.g. chicken, pasta, black tea…'}
            placeholderTextColor={voice.isListening ? colors.accent : colors.text3}
            returnKeyType="search" onSubmitEditing={handleLazySubmit}
            editable={!voice.isListening} />
          {/* Fix #2 — tap mic → starts recognition immediately, no keyboard */}
          <MicButton isListening={voice.isListening} size={44}
            onPress={voice.isListening ? voice.stopListening : voice.startListening} />
          <TouchableOpacity style={s.lazyBtn} onPress={handleLazySubmit}>
            <Text style={{color:'#0a0a0f', fontWeight:'700', fontSize:16}}>→</Text>
          </TouchableOpacity>
        </View>

        {lazyDropdown.length > 0 && (
          <View style={s.dropdown}>
            {lazyDropdown.map((f, i) => (
              <TouchableOpacity key={i} style={[s.dropdownItem, i===lazyDropdown.length-1&&{borderBottomWidth:0}]} onPress={() => selectLazyFood(f)}>
                <Text style={s.dropdownName}>{f.name}</Text>
                <Text style={s.dropdownMacros}>{f.p}g protein · {f.cal} kcal / 100g</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {lazyResult && <LazyResultCard result={lazyResult} onAdd={addLazyWithGrams} />}
        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  scrollL: { paddingHorizontal:40 },
  cameraContainer: { borderRadius:radius.lg, overflow:'hidden', marginHorizontal:18 },
  hidden: { opacity:0, height:0 },
  scanFrame: { position:'absolute', top:40, left:40, right:40, bottom:80 },
  corner: { position:'absolute', width:26, height:26, borderColor:colors.accent },
  scanHint: { position:'absolute', top:14, left:0, right:0, textAlign:'center', color:'rgba(255,255,255,0.9)', fontSize:13, fontWeight:'600' },
  cameraOverlay: { position:'absolute', bottom:24, left:0, right:0, alignItems:'center' },
  captureBtn: { width:76, height:76, borderRadius:38, borderWidth:3, borderColor:'#fff', alignItems:'center', justifyContent:'center' },
  captureBtnDisabled: { opacity:0.4 },
  captureBtnInner: { width:58, height:58, borderRadius:29, backgroundColor:'#fff' },
  cancelBtn: { backgroundColor:colors.card, padding:14, alignItems:'center' },
  cancelTxt: { color:colors.text2, fontSize:14 },
  camPlaceholder: { height:220, backgroundColor:colors.bg3, borderRadius:radius.lg, borderWidth:2, borderColor:colors.border, borderStyle:'dashed', alignItems:'center', justifyContent:'center', marginBottom:20 },
  camTitle: { fontSize:18, fontWeight:'700', color:colors.text, marginBottom:6 },
  camSub: { fontSize:13, color:colors.text2, textAlign:'center', lineHeight:20, paddingHorizontal:20 },
  permDenied: { marginTop:10, fontSize:12, color:colors.orange, textAlign:'center' },
  analyzingCard: { backgroundColor:colors.card, borderRadius:radius.lg, padding:32, alignItems:'center', marginBottom:20, borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  analyzingTitle: { fontSize:18, fontWeight:'700', color:colors.text, marginBottom:8 },
  analyzingSub: { fontSize:13, color:colors.text2, textAlign:'center', lineHeight:20 },
  errorCard: { backgroundColor:'rgba(255,140,66,0.08)', borderRadius:radius.lg, padding:20, marginBottom:20, borderWidth:1, borderColor:'rgba(255,140,66,0.3)', alignItems:'center' },
  errorTitle: { fontSize:16, fontWeight:'700', color:colors.orange, marginBottom:8 },
  errorMsg: { fontSize:13, color:colors.text2, textAlign:'center', lineHeight:20, marginBottom:14 },
  retryBtn: { backgroundColor:colors.orange, borderRadius:radius.sm, paddingHorizontal:20, paddingVertical:10 },
  retryTxt: { color:'#fff', fontWeight:'700', fontSize:14 },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:4 },
  sectionSub: { fontSize:12, color:colors.text2, marginBottom:10 },
  voiceBanner: { backgroundColor:'rgba(126,255,160,0.1)', borderRadius:radius.sm, padding:12, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  voiceBannerTxt: { color:colors.accent, fontSize:13, fontWeight:'600' },
  voiceStopBtn: { color:colors.orange, fontSize:13, fontWeight:'700' },
  voiceError: { color:colors.orange, fontSize:12, marginBottom:8 },
  addedBox: { backgroundColor:'rgba(126,255,160,0.07)', borderRadius:radius.sm, padding:12, marginBottom:10, borderWidth:1, borderColor:'rgba(126,255,160,0.2)' },
  addedHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  addedTitle: { fontSize:11, fontWeight:'700', color:colors.accent, textTransform:'uppercase', letterSpacing:0.5 },
  viewLogBtn: { fontSize:11, color:colors.accent3, fontWeight:'600' },
  addedRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:3 },
  addedName: { flex:1, fontSize:12, color:colors.text, fontWeight:'600' },
  addedMeta: { fontSize:11, color:colors.text2 },
  qpRow: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  qpName: { fontSize:13, fontWeight:'600', color:colors.text, marginBottom:2 },
  qpCal: { fontSize:11, color:colors.text2 },
  qpProtein: { fontSize:18, fontWeight:'700', color:colors.accent, marginRight:10 },
  addIcon: { width:32, height:32, backgroundColor:'rgba(126,255,160,0.15)', borderRadius:8, alignItems:'center', justifyContent:'center' },
  lazyRow: { flexDirection:'row', gap:6, alignItems:'center', marginBottom:4 },
  lazyInput: { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:14, color:colors.text },
  lazyBtn: { backgroundColor:colors.accent, borderRadius:radius.sm, paddingHorizontal:14, height:44, alignItems:'center', justifyContent:'center' },
  dropdown: { backgroundColor:colors.card2, borderRadius:radius.sm, borderWidth:1, borderColor:colors.border, marginBottom:8, overflow:'hidden' },
  dropdownItem: { padding:12, borderBottomWidth:1, borderBottomColor:colors.border },
  dropdownName: { fontSize:13, fontWeight:'600', color:colors.text },
  dropdownMacros: { fontSize:11, color:colors.text2, marginTop:2 },
});
