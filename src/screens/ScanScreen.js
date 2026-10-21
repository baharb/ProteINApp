import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Alert, Image, Modal, useWindowDimensions, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { C, R, getSlot } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { usePremium } from '../hooks/usePremium';
import { PrimaryBtn, FoodImage } from '../components/UI';
import { SERVER_URL, fetchWithTimeout, errorKey } from '../lib/config';
import { estimateMeal } from '../lib/estimate';
import { DEMO, DEMO_SCREEN, DEMO_SCAN } from '../lib/demo';
const DEMO_SCAN_ON = DEMO && DEMO_SCREEN === 'scan';
// Web returns the bundled image as a URL (or { uri }), which is all the demo needs.
const demoPhoto = () => { const src = require('../../assets/demo/meal.jpg'); return src?.uri || src?.default || src; };

function calcIng(ing) {
  if (ing.protein_per_unit != null) {
    const q = parseFloat(ing.qty) || 0;
    return { calories: Math.round((ing.calories_per_unit||0)*q), protein: Math.round(ing.protein_per_unit*q), carbs:0, fat:0 };
  }
  const f = (parseFloat(ing.amount_g)||0)/100;
  return {
    calories: Math.round((ing.per_100g?.calories||0)*f),
    protein:  Math.round((ing.per_100g?.protein||0)*f),
    carbs:    Math.round((ing.per_100g?.carbs||0)*f),
    fat:      Math.round((ing.per_100g?.fat||0)*f),
  };
}

function calcTotals(ings) {
  return ings.reduce((acc,ing) => {
    const m = calcIng(ing);
    return { calories:acc.calories+m.calories, protein:acc.protein+m.protein, carbs:acc.carbs+m.carbs, fat:acc.fat+m.fat };
  }, { calories:0, protein:0, carbs:0, fat:0 });
}

// AI guesses portion sizes poorly, so the user can scale the whole plate in one tap.
const PORTIONS = [
  { k:'s', label:'small',   factor:0.75 },   // labels are i18n keys
  { k:'m', label:'regular', factor:1 },
  { k:'l', label:'large',   factor:1.5 },
];

// ── Analyzing: photo + step-by-step checklist ─────────────────────────────
const ANALYZE_STEPS = ['step1', 'step2', 'step3'];   // i18n keys

// Photo size that leaves room for the rest of the screen (tablets, landscape).
function usePhotoSize() {
  const { width, height } = useWindowDimensions();
  const wide = width > height && width >= 700;
  const size = Math.round(Math.min(wide ? width * 0.42 : width - 32, height * 0.5, 440));
  return { wide, size };
}

function Analyzing({ photoUri }) {
  const { t } = useLang();
  const { wide, size } = usePhotoSize();
  const [done, setDone] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDone(d => Math.min(d + 1, ANALYZE_STEPS.length - 1)), 1100);
    return () => clearInterval(id);
  }, []);
  return (
    <ScrollView contentContainerStyle={an.wrap}>
      <Text style={an.title}>{t('scanMeal')}</Text>
      <View style={[an.body, wide && an.bodyWide]}>
      {photoUri && <Image source={{ uri: photoUri }} style={[an.photo, { width:size, height:size }]} />}
      <View style={wide ? { flex:1, maxWidth:420 } : { alignSelf:'stretch' }}>
      <Text style={an.heading}>{t('analyzing')}</Text>
      {ANALYZE_STEPS.map((label, i) => {
        const complete = i < done;
        const active   = i === done;
        return (
          <View key={label} style={an.step}>
            <View style={[an.dot, complete && an.dotDone, active && an.dotActive]}>
              <Text style={[an.dotTxt, complete && { color:'#0B0F14' }]}>{complete ? '✓' : active ? '•' : ''}</Text>
            </View>
            <Text style={[an.stepTxt, (complete || active) && { color:C.text }]}>{t(label)}</Text>
          </View>
        );
      })}
      </View>
      </View>
    </ScrollView>
  );
}

const an = StyleSheet.create({
  wrap:      { padding:16, paddingBottom:40 },
  title:     { fontSize:17, fontWeight:'800', color:C.text, textAlign:'center', marginBottom:16 },
  body:      { alignItems:'center', gap:24 },
  bodyWide:  { flexDirection:'row', justifyContent:'center', alignItems:'center', gap:40 },
  photo:     { borderRadius:R.xl, backgroundColor:C.card },
  heading:   { fontSize:16, fontWeight:'800', color:C.text, marginBottom:14 },
  step:      { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  dot:       { width:24, height:24, borderRadius:12, borderWidth:2, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  dotDone:   { backgroundColor:C.primary, borderColor:C.primary },
  dotActive: { borderColor:C.primary },
  dotTxt:    { fontSize:12, fontWeight:'900', color:C.primary },
  stepTxt:   { fontSize:15, color:C.text2, fontWeight:'600' },
});

// ── Step 2: Meal Analysis ─────────────────────────────────────────────────
function MealAnalysis({ scanResult, photoUri, remainingProtein, onFixMeal, onAddMeal, onBack, t }) {
  const { size } = usePhotoSize();
  const { back, lang, qtyLabel } = useLang();
  const [base]                        = useState(scanResult.ingredients);
  const [ingredients, setIngredients] = useState(scanResult.ingredients);
  const [portion,     setPortion]     = useState('m');
  const [editing,     setEditing]     = useState(false);
  // Things the photo missed, added by the user ("a slice of bread"). Kept apart
  // so the portion buttons only rescale what the scan found.
  const [added,       setAdded]       = useState([]);
  const [adding,      setAdding]      = useState(false);
  const [addText,     setAddText]     = useState('');
  const [addBusy,     setAddBusy]     = useState(false);
  const [addError,    setAddError]    = useState('');
  const all    = [...ingredients, ...added];
  const totals = calcTotals(all);
  const remainingAfter = Math.max(0, remainingProtein - totals.protein);
  const lowConfidence  = scanResult.confidence === 'low';

  function choosePortion(p) {
    setPortion(p.k);
    setIngredients(base.map(ing => ({ ...ing, amount_g: Math.round((parseFloat(ing.amount_g)||0) * p.factor) })));
  }

  function updateAmount(i, val) {
    if (i >= ingredients.length) {   // something the user added
      const j = i - ingredients.length;
      return setAdded(prev => prev.map((ing, idx) => idx === j ? { ...ing, amount_g: val } : ing));
    }
    setPortion(null);
    setIngredients(prev => prev.map((ing,idx) => idx===i ? {...ing, amount_g:val} : ing));
  }

  function removeIngredient(i) {
    if (i >= ingredients.length) return setAdded(prev => prev.filter((_, idx) => idx !== i - ingredients.length));
    setPortion(null);
    setIngredients(prev => prev.filter((_,idx) => idx!==i));
  }

  function updateQty(i, val) {
    const j = i - ingredients.length;
    setAdded(prev => prev.map((it, idx) => idx === j ? { ...it, qty: val } : it));
  }

  async function addMissing() {
    const q = addText.trim();
    if (!q || addBusy) return;
    setAddBusy(true); setAddError('');
    try {
      // grams + per 100 g, so added foods show, edit and add up like scanned ones
      const items = await estimateMeal(q, lang, 'grams');
      if (!items.length) throw new Error('estimateFailed');
      setAdded(prev => [...prev, ...items.map(it => ({ ...it, added: true }))]);
      setAddText(''); setAdding(false);
    } catch (e) {
      setAddError(t(e.message));
    } finally {
      setAddBusy(false);
    }
  }

  return (
    <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false} contentContainerStyle={{padding:16, paddingBottom:40}} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={ma.header}>
        <TouchableOpacity onPress={onBack} style={ma.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={ma.backTxt}>{back}</Text>
        </TouchableOpacity>
        <Text style={ma.title}>{t('hereWhatFound')}</Text>
        <View style={{width:40}} />
      </View>

      {/* Photo with protein overlay */}
      <View style={ma.photoWrap}>
        {photoUri
          ? <Image source={{ uri: photoUri }} style={[ma.photo, { width:size, height:Math.round(size*0.75) }]} />
          : <FoodImage emoji="🍽️" size={120} style={{ alignSelf:'center' }} />}
        <View style={ma.photoBadge}>
          <Text style={ma.photoBadgeNum}>{totals.protein}g</Text>
          <Text style={ma.photoBadgeLbl}>{t('protein')}</Text>
        </View>
      </View>

      <Text style={ma.mealName}>{scanResult.meal_name}</Text>
      <Text style={ma.mealSub}>{totals.calories} {t('kcal')} · {t('ingredientsCount', { n: all.length })}</Text>

      {lowConfidence && (
        <View style={ma.warnBox}>
          <Text style={ma.warnTxt}>{t('lowConfidence')}</Text>
        </View>
      )}

      {/* Portion size */}
      <Text style={ma.sectionLabel}>{t('portionSize')}</Text>
      <View style={ma.portionRow}>
        {PORTIONS.map(p => (
          <TouchableOpacity key={p.k} style={[ma.portion, portion===p.k && ma.portionOn]} onPress={() => choosePortion(p)} activeOpacity={0.85}>
            <Text style={[ma.portionTxt, portion===p.k && { color:C.primary }]}>{t(p.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Detected ingredients */}
      <View style={ma.ingHeader}>
        <Text style={[ma.sectionLabel, { marginBottom:0 }]}>{t('detected')}</Text>
        <Text style={ma.ingHeaderRight}>{t('protein')}</Text>
      </View>
      <View style={ma.ingCard}>
        {all.map((ing, i) => {
          const m = calcIng(ing);
          const counted = ing.protein_per_unit != null;
          return (
            <View key={i} style={ma.ingRow}>
              {editing && (
                <TouchableOpacity onPress={() => removeIngredient(i)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <Text style={ma.ingRemove}>✕</Text>
                </TouchableOpacity>
              )}
              <Text style={ma.ingName} numberOfLines={1}>{ing.added ? '＋ ' : ''}{ing.name}</Text>
              {editing && counted ? (
                <View style={ma.gramsWrap}>
                  <TextInput
                    style={ma.gramsInput}
                    value={String(ing.qty)}
                    onChangeText={v => updateQty(i, v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={ma.gramsUnit}>×</Text>
                </View>
              ) : counted ? (
                <Text style={ma.ingAmount}>{qtyLabel(parseFloat(ing.qty) || 0, ing.unit)}</Text>
              ) : editing ? (
                <View style={ma.gramsWrap}>
                  <TextInput
                    style={ma.gramsInput}
                    value={String(ing.amount_g)}
                    onChangeText={v => updateAmount(i, v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={ma.gramsUnit}>g</Text>
                </View>
              ) : (
                <Text style={ma.ingAmount}>{Math.round(parseFloat(ing.amount_g)||0)}g</Text>
              )}
              <Text style={ma.ingProtein}>{m.protein}g</Text>
            </View>
          );
        })}

        {/* Add what the photo missed — always visible, one tap */}
        {adding ? (
          <View style={ma.addBox}>
            <TextInput
              style={ma.addInput}
              value={addText}
              onChangeText={v => { setAddText(v); setAddError(''); }}
              placeholder={t('addMissingPh')}
              placeholderTextColor={C.text3}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={addMissing}
            />
            <TouchableOpacity style={[ma.addGo, !addText.trim() && { opacity:0.5 }]} onPress={addMissing} disabled={!addText.trim() || addBusy} activeOpacity={0.85}>
              {addBusy ? <ActivityIndicator color="#0B0F14" size="small" /> : <Text style={ma.addGoTxt}>{t('addBtn')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setAdding(false); setAddText(''); setAddError(''); }} hitSlop={10} accessibilityLabel={t('close')}>
              <Text style={ma.addCancel}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={ma.addRow} onPress={() => setAdding(true)} activeOpacity={0.8} accessibilityRole="button">
            <View style={ma.addPlus}><Text style={ma.addPlusTxt}>+</Text></View>
            <Text style={ma.addRowTxt}>{t('addMissing')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!addError && <Text style={ma.addError}>{addError}</Text>}

      {/* Remaining after */}
      <View style={[ma.remainingBanner, remainingAfter===0 && {borderColor:C.primary+'40',backgroundColor:C.primary+'10'}]}>
        <Text style={[ma.remainingTxt, remainingAfter===0 && {color:C.primary}]}>
          {remainingAfter > 0 ? t('afterMeal', { n: remainingAfter }) : t('completesGoal')}
        </Text>
      </View>

      {/* Actions */}
      <PrimaryBtn title={t('confirmLog')} onPress={() => onAddMeal(all, totals)} disabled={all.length===0} />
      <PrimaryBtn title={editing ? t('doneEditing') : t('editIngredients')} onPress={() => setEditing(e => !e)} variant="outline" style={{marginTop:10}} />
      {remainingAfter > 0 && (
        <TouchableOpacity style={ma.boostLink} onPress={() => onFixMeal(all, totals)} activeOpacity={0.8}>
          <Text style={ma.boostTxt}>{t('boost')}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const ma = StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12},
  backBtn:{width:40,height:40,alignItems:'center',justifyContent:'center'},
  backTxt:{fontSize:30,color:C.text,fontWeight:'300',lineHeight:36},
  title:{fontSize:17,fontWeight:'800',color:C.text},
  photoWrap:{marginBottom:16,alignSelf:'center'},
  photo:{borderRadius:R.xl,backgroundColor:C.card},
  photoBadge:{position:'absolute',right:12,bottom:12,backgroundColor:'rgba(11,15,20,0.85)',borderRadius:R.md,paddingHorizontal:14,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:C.primary+'60'},
  photoBadgeNum:{fontSize:26,fontWeight:'900',color:C.primary,lineHeight:30},
  photoBadgeLbl:{fontSize:11,color:C.text2,fontWeight:'600'},
  mealName:{fontSize:20,fontWeight:'800',color:C.text,marginBottom:4},
  mealSub:{fontSize:13,color:C.text2,marginBottom:16},
  warnBox:{backgroundColor:C.warning+'15',borderRadius:R.md,padding:12,marginBottom:16,borderWidth:1,borderColor:C.warning+'40'},
  warnTxt:{fontSize:13,color:C.warning,fontWeight:'600',lineHeight:18},
  sectionLabel:{fontSize:12,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:10},
  portionRow:{flexDirection:'row',gap:8,marginBottom:20},
  portion:{flex:1,backgroundColor:C.card,borderRadius:R.md,paddingVertical:11,alignItems:'center',borderWidth:1.5,borderColor:C.border},
  portionOn:{borderColor:C.primary,backgroundColor:C.primary+'12'},
  portionTxt:{fontSize:14,fontWeight:'700',color:C.text2},
  ingHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10},
  ingHeaderRight:{fontSize:12,fontWeight:'700',color:C.text2},
  ingCard:{backgroundColor:C.card,borderRadius:R.lg,borderWidth:1,borderColor:C.border,marginBottom:14,overflow:'hidden'},
  ingRow:{flexDirection:'row',alignItems:'center',paddingHorizontal:14,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.border,gap:10},
  ingRemove:{fontSize:14,color:C.warning,fontWeight:'800'},
  ingName:{flex:1,fontSize:15,color:C.text,fontWeight:'500'},
  ingAmount:{fontSize:13,color:C.text2,minWidth:48,textAlign:'right'},
  ingProtein:{fontSize:15,fontWeight:'800',color:C.primary,minWidth:40,textAlign:'right'},
  gramsWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.bg,borderRadius:R.sm,paddingHorizontal:8,paddingVertical:5,borderWidth:1,borderColor:C.primary+'60'},
  gramsInput:{fontSize:14,color:C.text,width:40,textAlign:'center',padding:0},
  gramsUnit:{fontSize:12,color:C.text2},
  remainingBanner:{backgroundColor:C.card,borderRadius:R.md,padding:12,marginBottom:16,borderWidth:1,borderColor:C.border},
  remainingTxt:{fontSize:14,color:C.text2,fontWeight:'600',textAlign:'center',lineHeight:19},
  addRow:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:14,paddingVertical:14,backgroundColor:C.primary+'10'},
  addPlus:{width:28,height:28,borderRadius:14,backgroundColor:C.primary,alignItems:'center',justifyContent:'center'},
  addPlusTxt:{fontSize:20,lineHeight:22,fontWeight:'900',color:'#0B0F14'},
  addRowTxt:{flex:1,fontSize:15,fontWeight:'800',color:C.primary},
  addBox:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12,paddingVertical:10,backgroundColor:C.primary+'10'},
  addInput:{flex:1,fontSize:15,color:C.text,backgroundColor:C.bg,borderRadius:R.md,paddingHorizontal:12,height:44,borderWidth:1.5,borderColor:C.primary+'70'},
  addGo:{height:44,paddingHorizontal:16,borderRadius:R.md,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',minWidth:64},
  addGoTxt:{fontSize:15,fontWeight:'900',color:'#0B0F14'},
  addCancel:{fontSize:16,color:C.text2,fontWeight:'700',paddingHorizontal:4},
  addError:{fontSize:13,color:C.warning,marginTop:-6,marginBottom:12,textAlign:'center'},
  boostLink:{padding:14,alignItems:'center'},
  boostTxt:{fontSize:14,color:C.primary,fontWeight:'700'},
});

// ── Step 3: Fix This Meal ─────────────────────────────────────────────────
function FixThisMeal({ mealTotals, remainingProtein, onApply, onBack, t, isPremium, onPaywall }) {
  const { foodName, back } = useLang();
  const fixes = [
    { name:'2 Boiled Eggs',        protein:13, calories:140, emoji:'🥚', image:'eggs' },
    { name:'Greek Yogurt (200g)',   protein:17, calories:200, emoji:'🥛', image:'yogurt' },
    { name:'Tuna (100g)',           protein:23, calories:110, emoji:'🐟', image:'tuna' },
    { name:'Cottage Cheese (150g)', protein:18, calories:120, emoji:'🧀', image:'cottage' },
  ];
  const [selected, setSelected] = useState([]);
  const newProtein = mealTotals.protein + selected.reduce((s,f)=>s+f.protein,0);
  const newCals    = mealTotals.calories + selected.reduce((s,f)=>s+f.calories,0);

  function toggle(fix) {
    setSelected(prev => prev.find(f=>f.name===fix.name) ? prev.filter(f=>f.name!==fix.name) : [...prev, fix]);
  }

  return (
    <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false} contentContainerStyle={{padding:16}}>
      <View style={fx.header}>
        <TouchableOpacity onPress={onBack} style={fx.backBtn}>
          <Text style={fx.backTxt}>{back}</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
      </View>

      <View style={fx.statusCard}>
        <Text style={fx.statusTitle}>{t('shortOfGoal', { n: Math.max(0, remainingProtein - mealTotals.protein) })}</Text>
        <Text style={fx.statusSub}>{t('addOneOfThese')}</Text>
      </View>

      <Text style={fx.sectionLabel}>{t('bestOptions')}</Text>

      {fixes.map((fix, i) => {
        const sel = !!selected.find(f=>f.name===fix.name);
        return (
          <TouchableOpacity key={i} style={[fx.fixCard, sel&&fx.fixCardOn]} onPress={()=>toggle(fix)} activeOpacity={0.85}>
            <FoodImage image={fix.image} emoji={fix.emoji} size={48} style={{marginRight:12}} />
            <View style={{flex:1}}>
              <Text style={fx.fixName}>{foodName(fix.name)}</Text>
              <Text style={fx.fixDetail}>+{t('proteinKcal', { p: fix.protein, c: fix.calories })}</Text>
            </View>
            <View style={[fx.plusBtn, sel&&fx.plusBtnOn]}>
              <Text style={[fx.plusTxt, sel&&{color:'#07111F'}]}>{sel?'✓':'+'}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={fx.newTotalCard}>
        <Text style={fx.newTotalLabel}>{t('newTotal')}</Text>
        <Text style={fx.newTotalNum}>{newProtein}g</Text>
        <Text style={fx.newTotalSub}>protein  ·  {newCals} kcal</Text>
      </View>

      <PrimaryBtn
        title={isPremium ? t('applyFix') : `🔒 ${t('applyFix')} (Premium)`}
        onPress={() => { if (!isPremium) { onPaywall(); return; } onApply(selected, newProtein, newCals); }}
        disabled={selected.length===0}
        style={{marginBottom:30}}
      />
    </ScrollView>
  );
}

const fx = StyleSheet.create({
  header:{flexDirection:'row',alignItems:'center',marginBottom:16},
  backBtn:{width:40,height:40,alignItems:'center',justifyContent:'center'},
  backTxt:{fontSize:30,color:C.primary,fontWeight:'300',lineHeight:36},
  statusCard:{backgroundColor:C.card,borderRadius:R.lg,padding:20,marginBottom:20,borderWidth:1,borderColor:C.border},
  statusTitle:{fontSize:20,fontWeight:'800',color:C.text,marginBottom:6,lineHeight:26},
  statusSub:{fontSize:13,color:C.text2},
  sectionLabel:{fontSize:11,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:10},
  fixCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:R.md,padding:14,marginBottom:8,borderWidth:1.5,borderColor:C.border},
  fixCardOn:{borderColor:C.primary,backgroundColor:C.primary+'0D'},
  fixName:{fontSize:14,fontWeight:'600',color:C.text,marginBottom:3},
  fixDetail:{fontSize:12,color:C.primary,fontWeight:'600'},
  plusBtn:{width:36,height:36,borderRadius:18,backgroundColor:C.border,alignItems:'center',justifyContent:'center'},
  plusBtnOn:{backgroundColor:C.primary},
  plusTxt:{fontSize:18,color:C.text,fontWeight:'700',lineHeight:22},
  newTotalCard:{backgroundColor:C.primary+'18',borderRadius:R.lg,padding:20,alignItems:'center',marginBottom:16,borderWidth:1,borderColor:C.primary+'40'},
  newTotalLabel:{fontSize:11,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8},
  newTotalNum:{fontSize:44,fontWeight:'900',color:C.primary},
  newTotalSub:{fontSize:13,color:C.text2,marginTop:6},
});

// ── Step 4: Meal Updated ──────────────────────────────────────────────────
function MealUpdated({ newProtein, goalProtein, onHome, onScanAnother, t }) {
  const pct = Math.min(100, Math.round((newProtein / goalProtein) * 100));
  return (
    <View style={{flex:1, padding:24}}>
      <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
        <Text style={mu.title}>{t('greatChoice')}</Text>
        <Text style={mu.sub}>{t('mealUpdated')}</Text>
        <View style={mu.circle}>
          <Text style={mu.circleNum}>{newProtein}g</Text>
          <Text style={mu.circleLabel}>{t('protein')}</Text>
        </View>
        <Text style={mu.pctTxt}>{t('youReached', { n: pct })}</Text>
        <View style={mu.bar}>
          <View style={[mu.barFill, {width:`${pct}%`}]} />
        </View>
      </View>
      <View style={{gap:10}}>
        <PrimaryBtn title={t('backToHome')} onPress={onHome} />
        <PrimaryBtn title={t('scanAnother')} onPress={onScanAnother} variant="outline" />
      </View>
    </View>
  );
}

const mu = StyleSheet.create({
  title:{fontSize:26,fontWeight:'900',color:C.text,textAlign:'center',marginBottom:8},
  sub:{fontSize:14,color:C.text2,textAlign:'center',marginBottom:36},
  circle:{width:160,height:160,borderRadius:80,backgroundColor:C.primary+'20',alignItems:'center',justifyContent:'center',borderWidth:4,borderColor:C.primary,marginBottom:24},
  circleNum:{fontSize:42,fontWeight:'900',color:C.primary},
  circleLabel:{fontSize:12,color:C.text2,marginTop:2},
  pctTxt:{fontSize:14,color:C.text2,marginBottom:12,textAlign:'center'},
  bar:{width:'100%',height:8,backgroundColor:C.border,borderRadius:4,overflow:'hidden'},
  barFill:{height:8,backgroundColor:C.primary,borderRadius:4},
});

// ── Paywall Modal ─────────────────────────────────────────────────────────
function PaywallModal({ visible, onClose, t }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pw.overlay}>
        <View style={pw.sheet}>
          <View style={pw.handle} />
          <Text style={pw.crown}>👑</Text>
          <Text style={pw.title}>{t('paywallTitle')}</Text>
          <Text style={pw.sub}>{t('paywallSub')}</Text>
          {[t('pw1'), t('pw2'), t('pw3'), t('pw4')].map((b,i)=>(
            <View key={i} style={pw.benefit}>
              <Text style={pw.check}>✓</Text>
              <Text style={pw.benefitTxt}>{b}</Text>
            </View>
          ))}
          <PrimaryBtn title={t('startTrial')} onPress={() => { onClose(); Alert.alert(t('comingSoon'), t('comingSoonSub')); }} style={{marginTop:20}} />
          <TouchableOpacity style={{padding:14,alignItems:'center'}} onPress={onClose}>
            <Text style={{color:C.text3,fontSize:14}}>{t('maybeLater')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const pw = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.85)',justifyContent:'flex-end'},
  sheet:{backgroundColor:C.card,borderTopLeftRadius:28,borderTopRightRadius:28,padding:24,paddingBottom:44},
  handle:{width:40,height:4,backgroundColor:C.border,borderRadius:2,alignSelf:'center',marginBottom:20},
  crown:{fontSize:44,textAlign:'center',marginBottom:12},
  title:{fontSize:20,fontWeight:'800',color:C.text,textAlign:'center',marginBottom:8,lineHeight:26},
  sub:{fontSize:14,color:C.text2,textAlign:'center',marginBottom:20},
  benefit:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:12},
  check:{fontSize:15,color:C.primary,fontWeight:'700'},
  benefitTxt:{fontSize:14,color:C.text},
});

// ── Main ScanScreen ───────────────────────────────────────────────────────
export default function ScanScreen({ navigation, route }) {
  const { addMeal, today, goals } = useApp();
  const { t, lang, foodName } = useLang();
  const { isPremium } = usePremium();

  const [step,          setStep]          = useState(DEMO_SCAN_ON ? 'analysis' : 'idle'); // idle|analyzing|analysis|fix|updated|error
  const [camDenied,     setCamDenied]     = useState(false);
  const [photoUri,      setPhotoUri]      = useState(DEMO_SCAN_ON ? demoPhoto() : null);
  const [scanResult,    setScanResult]    = useState(DEMO_SCAN_ON ? DEMO_SCAN : null);
  const [mealTotals,    setMealTotals]    = useState(null);
  const [updatedProtein,setUpdatedProtein]= useState(0);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [showPaywall,   setShowPaywall]   = useState(false);
  const stepRef   = useRef(step);

  stepRef.current = step;

  const remaining = Math.max(0, goals.protein - today.protein);

  // The Scan tab opens this page, not the camera: some tablet cameras have no
  // close button, so the user picks "Take photo" here (and can close this page).
  // The camera button on Home is an explicit request, so that one opens it directly.
  useEffect(() => { if (route?.params?.open) openCamera(); }, [route?.params?.open]);
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (['updated', 'error'].includes(stepRef.current)) setStep('idle');
    });
    return unsub;
  }, [navigation]);

  // The bottom bar would cover the result buttons; hide it after a photo is taken.
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: step === 'idle' ? undefined : { display: 'none' } });
  }, [step, navigation]);

  const { width: winW } = useWindowDimensions();
  const wide = winW >= 700;

  function close() {
    setStep('idle');
    navigation.navigate('HomeTab');
  }

  async function analyze(uri) {
    try {
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!resized?.base64) throw new Error('Could not process image.');
      setPhotoUri(resized.uri);

      const res = await fetchWithTimeout(`${SERVER_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: resized.base64, mimeType: 'image/jpeg', lang }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(errorKey(res.status, data) || 'estimateFailed');

      setScanResult(data);
      setStep('analysis');
    } catch(err) {
      const msg = err.message;
      setErrorMsg(
        msg.includes('fetch') || msg.includes('Server not responding') || msg.includes('Network')
          ? t('serverDown')
          : t(msg)
      );
      setStep('error');
    }
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') { Alert.alert(t('permissionNeeded'), t('allowPhotos')); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (picked.canceled || !picked.assets?.[0]?.uri) return;
    setScanResult(null); setErrorMsg('');
    setPhotoUri(picked.assets[0].uri);
    setStep('analyzing');
    await analyze(picked.assets[0].uri);
  }

  // Photos are taken with the phone's own camera app. (An embedded camera
  // preview left the whole screen white after capture on some Samsung tablets.)
  async function openCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      setCamDenied(true); setStep('idle');
      Alert.alert(t('cameraPermission'), t('allowCamera'));
      return;
    }
    setCamDenied(false);
    const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (shot.canceled || !shot.assets?.[0]?.uri) { setStep(prev => prev === 'analyzing' ? 'idle' : prev); return; }
    setScanResult(null); setErrorMsg('');
    setPhotoUri(shot.assets[0].uri);
    setStep('analyzing');
    await analyze(shot.assets[0].uri);
  }

  async function handleAddMeal(ingredients, totals) {
    await addMeal(scanResult.meal_name, totals.calories, totals.protein, totals.carbs, totals.fat, getSlot());
    setUpdatedProtein(today.protein + totals.protein);
    setStep('updated');
  }

  async function handleApplyFix(fixes, newProtein, newCals) {
    if (mealTotals) await addMeal(scanResult.meal_name, mealTotals.calories, mealTotals.protein, mealTotals.carbs, mealTotals.fat, getSlot());
    for (const fix of fixes) await addMeal(foodName(fix.name), fix.calories, fix.protein, 0, 0, getSlot(), { emoji: fix.emoji, image: fix.image });
    setUpdatedProtein(today.protein + newProtein);
    setStep('updated');
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {(
        <SafeAreaView style={s.safe} edges={['top']}>
          {/* Idle */}
          {step === 'idle' && (
            <ScrollView contentContainerStyle={[s.idleWrap, wide && s.idleWrapWide]}>
              <View style={s.idleHead}>
                <View style={{ flex:1 }}>
                  <Text style={s.idleTitle}>{t('scanTitle')}</Text>
                  <Text style={s.idleSub}>{t('scanSub')}</Text>
                </View>
                <TouchableOpacity style={s.closeBtn} onPress={close} accessibilityRole="button" accessibilityLabel={t('close')} hitSlop={10}>
                  <Text style={s.closeTxt}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={wide && s.idleRow}>
              <View style={wide && { flex:1.3 }}>
              <TouchableOpacity style={[s.bigScanBtn, wide && s.bigScanBtnWide]} onPress={openCamera} activeOpacity={0.9}>
                <View style={s.bigScanCircle}><Text style={s.bigScanIcon}>📷</Text></View>
                <Text style={s.bigScanTxt}>{t('takePhoto')}</Text>
                <Text style={s.bigScanHint}>{t('pointCamera')}</Text>
                <Text style={s.backHint}>{t('cameraBackHint')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.galleryBtn} onPress={pickFromGallery} activeOpacity={0.85}>
                <Text style={s.galleryTxt}>🖼️  {t('choosePhotos')}</Text>
              </TouchableOpacity>
              </View>
              <View style={[s.tipsCard, wide && { flex:1 }]}>
                <Text style={s.tipsTitle}>{t('bestResult')}</Text>
                {[t('tip1'), t('tip2'), t('tip3')].map(tip => (
                  <Text key={tip} style={s.tip}>✓  {tip}</Text>
                ))}
              </View>
              </View>
              {camDenied && (
                <Text style={s.permDenied}>{t('camDenied')}</Text>
              )}
            </ScrollView>
          )}

          {step === 'analyzing' && <Analyzing photoUri={photoUri} />}

          {/* Error */}
          {step === 'error' && (
            <View style={s.errorWrap}>
              <Text style={{fontSize:48, marginBottom:16}}>⚠️</Text>
              <Text style={s.errorTitle}>{t('scanFailed')}</Text>
              <Text style={s.errorSub}>{errorMsg}</Text>
              <TouchableOpacity style={s.retryBtn} onPress={() => openCamera()}>
                <Text style={s.retryTxt}>{t('tryAgain')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.errorClose} onPress={close}>
                <Text style={s.errorCloseTxt}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 'analysis' && scanResult && (
            <MealAnalysis
              scanResult={scanResult}
              photoUri={photoUri}
              remainingProtein={remaining}
              onFixMeal={(ings, totals) => { setMealTotals(totals); setStep('fix'); }}
              onAddMeal={handleAddMeal}
              onBack={() => setStep('idle')}
              t={t}
            />
          )}

          {step === 'fix' && mealTotals && (
            <FixThisMeal
              mealTotals={mealTotals}
              remainingProtein={remaining}
              onApply={handleApplyFix}
              onBack={() => setStep('analysis')}
              t={t}
              isPremium={isPremium}
              onPaywall={() => setShowPaywall(true)}
            />
          )}

          {step === 'updated' && (
            <MealUpdated
              newProtein={updatedProtein}
              goalProtein={goals.protein}
              onHome={() => { setStep('idle'); navigation.navigate('HomeTab'); }}
              onScanAnother={() => openCamera()}
              t={t}
            />
          )}
        </SafeAreaView>
      )}

      <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} t={t} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:C.bg },
  safe: { flex:1 },

  // Camera
  cameraScreen: { flex:1, backgroundColor:'#000' },
  cameraTopBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:12, backgroundColor:'rgba(0,0,0,0.6)', zIndex:10 },
  closeBtn: { width:40, height:40, alignItems:'center', justifyContent:'center' },
  closeTxt: { fontSize:20, color:'#fff', fontWeight:'600' },
  cameraTitle: { fontSize:16, fontWeight:'700', color:'#fff' },
  cameraFull: { flex:1 },

  frameTopLeft:    { position:'absolute', top:40,    left:32,  width:36, height:36, borderTopWidth:3,    borderLeftWidth:3,  borderColor:C.primary, borderTopLeftRadius:10 },
  frameTopRight:   { position:'absolute', top:40,    right:32, width:36, height:36, borderTopWidth:3,    borderRightWidth:3, borderColor:C.primary, borderTopRightRadius:10 },
  frameBottomLeft: { position:'absolute', bottom:70, left:32,  width:36, height:36, borderBottomWidth:3, borderLeftWidth:3,  borderColor:C.primary, borderBottomLeftRadius:10 },
  frameBottomRight:{ position:'absolute', bottom:70, right:32, width:36, height:36, borderBottomWidth:3, borderRightWidth:3, borderColor:C.primary, borderBottomRightRadius:10 },
  frameHint: { position:'absolute', bottom:24, left:0, right:0, textAlign:'center', color:'#fff', fontSize:14, fontWeight:'600' },

  captureBar: { backgroundColor:'rgba(0,0,0,0.85)', paddingVertical:18, flexDirection:'row', alignItems:'center', justifyContent:'space-around' },
  sideBtn: { width:64, alignItems:'center' },
  sideIcon: { fontSize:24 },
  sideTxt: { fontSize:11, color:'#fff', marginTop:3 },
  captureBtn: { width:76, height:76, borderRadius:38, borderWidth:3, borderColor:'#fff', alignItems:'center', justifyContent:'center' },
  captureBtnDisabled: { opacity:0.35 },
  captureBtnInner: { width:60, height:60, borderRadius:30, backgroundColor:C.primary },

  // Idle
  idleWrap: { padding:20, paddingTop:20, paddingBottom:40 },
  idleWrapWide: { width:'100%', maxWidth:980, alignSelf:'center', paddingHorizontal:28 },
  idleHead: { flexDirection:'row', alignItems:'flex-start', gap:12 },
  closeBtn: { width:40, height:40, borderRadius:20, backgroundColor:C.card, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center' },
  closeTxt: { fontSize:18, color:C.text, fontWeight:'700' },
  idleRow: { flexDirection:'row', gap:16, alignItems:'flex-start' },
  bigScanBtnWide: { paddingVertical:28 },
  backHint: { fontSize:12, color:C.text3, marginTop:10, textAlign:'center', paddingHorizontal:16 },
  errorClose: { marginTop:12, paddingVertical:12, paddingHorizontal:24 },
  errorCloseTxt: { fontSize:15, color:C.text2, fontWeight:'600' },
  idleTitle: { fontSize:26, fontWeight:'900', color:C.text, marginBottom:8 },
  idleSub: { fontSize:15, color:C.text2, marginBottom:24, lineHeight:21 },
  bigScanBtn: { backgroundColor:C.card, borderRadius:R.xl, paddingVertical:36, alignItems:'center', borderWidth:2, borderColor:C.primary+'50', borderStyle:'dashed', marginBottom:12 },
  bigScanCircle: { width:84, height:84, borderRadius:42, backgroundColor:C.primary+'20', alignItems:'center', justifyContent:'center', marginBottom:14 },
  bigScanIcon: { fontSize:40 },
  bigScanTxt: { fontSize:19, fontWeight:'800', color:C.text, marginBottom:4 },
  bigScanHint: { fontSize:14, color:C.text2 },
  galleryBtn: { backgroundColor:C.card, borderRadius:R.md, paddingVertical:15, alignItems:'center', borderWidth:1, borderColor:C.border, marginBottom:20 },
  galleryTxt: { fontSize:15, fontWeight:'700', color:C.text },
  tipsCard: { backgroundColor:C.card, borderRadius:R.lg, padding:16, borderWidth:1, borderColor:C.border },
  tipsTitle: { fontSize:14, fontWeight:'800', color:C.text, marginBottom:10 },
  tip: { fontSize:14, color:C.text2, marginBottom:6 },
  permDenied: { marginTop:20, fontSize:13, color:C.warning, textAlign:'center' },

  // Error
  errorWrap: { flex:1, alignItems:'center', justifyContent:'center', padding:32 },
  errorTitle: { fontSize:20, fontWeight:'800', color:C.warning, marginTop:8, marginBottom:10, textAlign:'center' },
  errorSub: { fontSize:14, color:C.text2, textAlign:'center', lineHeight:21 },
  retryBtn: { backgroundColor:C.primary, borderRadius:R.md, paddingHorizontal:28, paddingVertical:14, marginTop:24 },
  retryTxt: { color:'#0B0F14', fontWeight:'800', fontSize:15 },
});
