import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, StatusBar, Image, Alert, Animated, Keyboard, ActivityIndicator } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { C, R, QUICK_ADD, getSlot, SLOT_LABELS } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { useStreak } from '../hooks/useStreak';
import { useVoice } from '../hooks/useVoice';
import { useRequireAccount } from '../hooks/useRequireAccount';
import { FoodImage } from '../components/UI';
import MealSheet from '../components/MealSheet';
import { planNextMeals, nextMealMoment } from '../lib/planner';
import { estimateMeal } from '../lib/estimate';

// ── Protein ring ──────────────────────────────────────────────────────────
function ProteinRing({ consumed, goal, size = 96, stroke = 11 }) {
  const radius   = (size - stroke) / 2;
  const circum   = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(goal, 1), 1);
  const dash     = circum * progress;
  return (
    <View style={{ width:size, height:size, alignItems:'center', justifyContent:'center' }}>
      <Svg width={size} height={size} style={{ position:'absolute' }}>
        <Circle cx={size/2} cy={size/2} r={radius} stroke={C.border} strokeWidth={stroke} fill="none" />
        {consumed > 0 && (
          <Circle cx={size/2} cy={size/2} r={radius} stroke={C.primary} strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${circum - dash}`} strokeDashoffset={circum / 4} strokeLinecap="round" />
        )}
      </Svg>
      {consumed >= goal && <Text style={s.ringDone}>✓</Text>}
    </View>
  );
}

// ── Calorie bar: under the limit it stays quiet; near it turns orange, over it red ──
function CalorieBar({ t, consumed, goal }) {
  const eaten = Math.round(consumed);
  const limit = Math.max(Math.round(goal), 1);
  const over  = eaten > limit;
  const near  = !over && eaten >= limit * 0.9;
  const color = over ? C.danger : near ? C.warning : C.secondary;
  const note  = over ? t('calOver', { n: eaten - limit }) : near ? t('calNear') : t('calLeft', { n: limit - eaten });
  return (
    <View style={s.calWrap} accessibilityLabel={`${t('calories')}: ${t('calOfGoal', { a: eaten, b: limit })}. ${note}`}>
      <View style={s.calRow}>
        <Text style={[s.calNum, over && { color:C.danger }]}>{t('calOfGoal', { a: eaten, b: limit })}</Text>
        <Text style={[s.calNote, { color: over || near ? color : C.text3 }]} numberOfLines={1}>{over ? '⚠ ' : ''}{note}</Text>
      </View>
      <View style={s.calTrack}>
        <View style={[s.calFill, { width:`${Math.min(eaten / limit, 1) * 100}%`, backgroundColor:color }]} />
      </View>
    </View>
  );
}

function getGreeting(t) {
  const h = new Date().getHours();
  return h < 12 ? t('goodMorning') : h < 17 ? t('goodAfternoon') : t('goodEvening');
}

// "Kabab koobideh ×3 + Chelo" → "Kabab koobideh +1" for the small food buttons.
function shortName(name) {
  const parts = name.split(' + ').map(p => p.replace(/ ×[\d.]+$/, '').replace(/\s*\(.*\)$/, ''));
  return parts.length > 1 ? `${parts[0]} +${parts.length - 1}` : parts[0];
}

// One friendly line about the day.
function getStatus(t, consumed, goal, remaining) {
  if (consumed >= goal)  return t('statusHit');
  if (consumed === 0)    return t('statusStart');
  if (remaining <= 20)   return t('statusClose', { n: remaining });
  if (new Date().getHours() >= 19) return t('statusLate', { n: remaining });
  return t('statusOnTrack');
}

export default function HomeScreen({ navigation, route }) {
  const { today, goals, addMeal, removeMeal, profile, isGuest, myFoods } = useApp();
  const { t, lang, foodName, fwd, qtyLabel } = useLang();
  const { streak } = useStreak(today.protein, goals.protein);
  const requireAccount = useRequireAccount();

  const remaining = Math.max(0, goals.protein - today.protein);
  const name      = profile?.display_name || '';
  const moment    = nextMealMoment();

  // ── Autopilot: next meal + swap ──
  const eatenKey = today.meals.map(m => m.name).join('|');
  const plan = useMemo(
    () => planNextMeals({ remaining, myFoods, eatenToday: today.meals.map(m => m.name) }),
    [remaining, myFoods, eatenKey],
  );
  const [swapIdx, setSwapIdx] = useState(0);
  useEffect(() => { setSwapIdx(0); }, [plan.length, remaining]);
  const next = plan.length ? plan[swapIdx % plan.length] : null;

  // ── Your foods: most-eaten first, topped up with defaults for new users ──
  const yourFoods = useMemo(() => {
    const mine  = Object.values(myFoods).sort((a, b) => (b.count - a.count) || (b.last - a.last)).slice(0, 8)
      .map(f => {
        const starter = !f.unit && QUICK_ADD.find(q => q.name === f.name);
        return starter ? { ...starter, ...f, unit: starter.unit, qty: starter.qty, protein_per_unit: starter.protein_per_unit, calories_per_unit: starter.calories_per_unit, protein: starter.protein, calories: starter.calories } : f;
      });
    const names = new Set(mine.map(f => f.name));
    const fill  = QUICK_ADD.filter(f => !names.has(f.name)).slice(0, Math.max(0, 5 - mine.length));
    return [...mine, ...fill];
  }, [myFoods]);

  // ── Describe your meal ──
  const [text,  setText]  = useState('');
  const [typing, setTyping] = useState(false);
  const [sheet, setSheet] = useState({ visible:false, text:'', loading:false, error:'', items:null });
  const inputRef  = useRef(null);
  const scrollRef = useRef(null);
  const logY      = useRef(0);   // where the Log buttons sit, to scroll the text box above the keyboard

  async function describe(raw) {
    const q = (raw ?? text).trim();
    if (!q) return;
    Keyboard.dismiss();
    setSheet({ visible:true, text:q, title:null, loading:true, error:'', items:null });
    try {
      const items = await estimateMeal(q, lang);
      setSheet(prev => ({ ...prev, loading:false, items }));
    } catch (e) {
      setSheet(prev => ({ ...prev, loading:false, error:e.message }));
    }
  }

  // Starter foods (they have a unit) → "how much?" sheet; your own foods → one tap.
  function onFoodTap(item) {
    if (!item.unit) return logFood(item);
    if (!requireAccount('log')) return;
    setSheet({ visible:true, text:'', title: t('howMuchShort'), loading:false, error:'', items:[{
      name: foodName(item.name).replace(/ ×[\d.]+$/, ''), emoji: item.emoji, unit: item.unit, qty: item.qty, qty_given: false, ask: true,
      protein_per_unit: item.protein_per_unit, calories_per_unit: item.calories_per_unit,
    }]});
  }

  async function logDescribed(items, protein, calories) {
    const mealName = items.map(it => it.qty !== 1 ? `${it.name} ×${it.qty}` : it.name).join(' + ');
    const one = items.length === 1 ? items[0] : null;   // single food → remember its amount too
    await addMeal(mealName, calories, protein, 0, 0, getSlot(), {
      emoji: items[0]?.emoji,
      ...(one && { unit: one.unit, qty: one.qty, protein_per_unit: one.protein_per_unit, calories_per_unit: one.calories_per_unit }),
    });
    setSheet(prev => ({ ...prev, visible:false }));
    setText('');
    setTyping(false);
    showToast({ name: mealName, protein });
  }

  const voice = useVoice({ lang, onResult: (said) => { setText(said); describe(said); } });

  function onMic() {
    if (!requireAccount('log')) return;
    if (voice.isListening) return voice.stopListening();
    // Keep the Say button (the stop button) on screen while listening.
    scrollRef.current?.scrollTo({ y: Math.max(0, logY.current - 8), animated: true });
    voice.startListening();
  }

  function onSnap() {
    if (requireAccount('scan')) navigation.navigate('ScanTab', { open: Date.now() });
  }

  function onType() {
    if (!requireAccount('log')) return;
    setTyping(true);
    // Some windows (e.g. tablet desktop mode) don't resize for the keyboard,
    // so bring the buttons + text box to the top of the screen ourselves.
    scrollRef.current?.scrollTo({ y: Math.max(0, logY.current - 8), animated: true });
    setTimeout(() => inputRef.current?.focus(), 250);
  }

  // The Log button in the tab bar sends us here with "say" or "type".
  useEffect(() => {
    const action = route?.params?.action;
    if (action === 'say' && !voice.isListening) onMic();
    if (action === 'type') onType();
  }, [route?.params?.ts]);

  // ── Undo toast ──
  const [toast, setToast] = useState(null);
  const toastAnim  = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  function showToast(item) {
    clearTimeout(toastTimer.current);
    setToast(item);
    Animated.timing(toastAnim, { toValue:1, duration:180, useNativeDriver:true }).start();
    toastTimer.current = setTimeout(hideToast, 4000);
  }
  function hideToast() {
    Animated.timing(toastAnim, { toValue:0, duration:180, useNativeDriver:true }).start(() => setToast(null));
  }

  async function logFood(food) {
    if (!requireAccount('log')) return;
    await addMeal(food.name, food.calories, food.protein, 0, 0, getSlot(), { emoji: food.emoji, image: food.image });
    showToast({ name: food.name, protein: food.protein });
  }

  async function onUndo() {
    clearTimeout(toastTimer.current);
    hideToast();
    if (today.meals.length > 0) await removeMeal(today.meals.length - 1);
  }

  function confirmRemove(index) {
    const m = today.meals[index];
    Alert.alert(t('removeMeal'), `${foodName(m.name)} · ${m.p}g`, [
      { text: t('cancel'), style:'cancel' },
      { text: t('remove'), style:'destructive', onPress: () => removeMeal(index) },
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={{ flex:1 }}>
            <Text style={s.greeting}>{getGreeting(t)}{name ? `, ${name}` : ''}</Text>
            <Text style={s.statusLine}>{getStatus(t, today.protein, goals.protein, remaining)}</Text>
          </View>
          {streak > 0 && (
            <View style={s.streakPill}><Text style={s.streakTxt}>🔥 {streak}</Text></View>
          )}
          <TouchableOpacity style={s.avatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85} accessibilityLabel={t('profile')}>
            {profile?.avatar_url
              ? <Image source={{ uri: profile.avatar_url }} style={s.avatarImg} />
              : <Text style={s.avatarTxt}>{(name[0] || '👤').toUpperCase()}</Text>}
          </TouchableOpacity>
        </View>

        {isGuest && (
          <TouchableOpacity style={s.guestBanner} onPress={() => navigation.navigate('Auth', { reason:'log' })} activeOpacity={0.85}>
            <Text style={s.guestBannerTxt}>{t('guestBanner')}</Text>
            <Text style={s.guestBannerArrow}>{fwd}</Text>
          </TouchableOpacity>
        )}

        {/* ── 1. One number: how much is left ── */}
        <View style={s.heroCard}>
          <ProteinRing consumed={today.protein} goal={goals.protein} />
          <View style={{ flex:1 }}>
            <Text style={s.heroValue}>{remaining > 0 ? t('gramsToGo', { n: remaining }) : t('goalHitBig')}</Text>
            <Text style={s.heroSub}>{t('todaySoFar', { a: today.protein, b: goals.protein })}</Text>
            <CalorieBar t={t} consumed={today.calories} goal={goals.calories} />
          </View>
        </View>

        {/* ── 2. Log it: three equal ways ── */}
        <Text style={s.sectionTitle} onLayout={e => { logY.current = e.nativeEvent.layout.y; }}>{t('logWhatYouAte')}</Text>
        <View style={s.logRow}>
          <TouchableOpacity style={[s.logBtn, s.logBtnMain]} onPress={onSnap} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t('scanMeal')}>
            <Text style={s.logIcon}>📷</Text>
            <Text style={[s.logTxt, s.logTxtMain]}>{t('snap')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.logBtn, voice.isListening && s.logBtnOn]} onPress={onMic} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t('sayIt')}>
            {voice.isProcessing ? <ActivityIndicator color={C.primary} style={{ height:34 }} /> : <Text style={s.logIcon}>🎤</Text>}
            <Text style={[s.logTxt, voice.isListening && { color:C.primary }]}>{t('say')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.logBtn, (typing || !!text) && s.logBtnOn]} onPress={onType} activeOpacity={0.9} accessibilityRole="button" accessibilityLabel={t('inputPlaceholder')}>
            <Text style={s.logIcon}>⌨️</Text>
            <Text style={s.logTxt}>{t('typeIt')}</Text>
          </TouchableOpacity>
        </View>

        {(typing || !!text) && (
          <View style={s.inputBar}>
            <TextInput
              ref={inputRef}
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder={t('inputPlaceholder')}
              placeholderTextColor={C.text3}
              returnKeyType="send"
              onSubmitEditing={() => describe()}
            />
            {text.trim() ? (
              <TouchableOpacity style={[s.inputBtn, s.sendBtn]} onPress={() => describe()} accessibilityLabel={t('send')}>
                <Text style={s.sendTxt}>↑</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={s.inputBtn} onPress={() => { setTyping(false); Keyboard.dismiss(); }} accessibilityLabel={t('close')}>
                <Text style={s.closeTxt}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        <Text style={[s.inputHint, voice.isListening && { color:C.primary }]}>
          {voice.isListening ? t('tapToStop') : voice.error ? t(voice.error) : t('inputHint')}
        </Text>

        {/* ── 3. One tap: your usual foods ── */}
        <Text style={s.sectionTitle}>{t('tapAgain')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:12, paddingRight:4 }}>
          {yourFoods.map(item => (
            <TouchableOpacity key={item.name} style={s.foodPill} onPress={() => onFoodTap(item)} activeOpacity={0.85}>
              <FoodImage image={item.image} emoji={item.emoji} name={item.name} size={58} round />
              <Text style={s.foodName} numberOfLines={2}>{shortName(foodName(item.name))}</Text>
              {!!item.unit && <Text style={s.foodAmount} numberOfLines={1}>{qtyLabel(item.qty, item.unit)}</Text>}
              <Text style={s.foodProtein}>+{item.protein}g</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── 4. A quiet idea for the next meal ── */}
        {next && (
          <View style={s.ideaCard}>
            <FoodImage image={next.image} emoji={next.emoji} name={next.name} size={48} />
            <View style={{ flex:1 }}>
              <Text style={s.ideaLabel}>💡 {t('mealIdea', { meal: t(moment.label) })}</Text>
              <Text style={s.ideaName} numberOfLines={1}>{foodName(next.name)} · {t('approxProtein', { n: next.protein })}</Text>
            </View>
            {plan.length > 1 && (
              <TouchableOpacity style={s.ideaSwap} onPress={() => setSwapIdx(i => i + 1)} accessibilityLabel={t('swap')} hitSlop={8}>
                <Text style={s.ideaSwapTxt}>↻</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.ideaLog} onPress={() => logFood(next)} activeOpacity={0.85}>
              <Text style={s.ideaLogTxt}>{t('logIt')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {!next && remaining === 0 && (
          <View style={s.doneCard}>
            <Text style={s.doneEmoji}>🎉</Text>
            <Text style={s.doneTitle}>{t('doneTitle')}</Text>
            <Text style={s.doneSub}>{t('doneSub')}</Text>
          </View>
        )}

        {/* ── Today's log ── */}
        {today.meals.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop:24 }]}>{t('todaysLog')}</Text>
            <View style={s.mealsCard}>
              {today.meals.map((m, i) => ({ m, i })).reverse().map(({ m, i }, row, arr) => (
                <TouchableOpacity key={m.id || `${i}-${m.name}`} onLongPress={() => confirmRemove(i)} activeOpacity={0.8}
                  style={[s.mealRow, row === arr.length - 1 && { borderBottomWidth:0 }]}>
                  <Text style={s.mealEmoji}>{m.emoji || '🍽️'}</Text>
                  <View style={{ flex:1 }}>
                    <Text style={s.mealName} numberOfLines={1}>{foodName(m.name)}</Text>
                    <Text style={s.mealMeta}>{t(SLOT_LABELS[m.slot] || 'meal')} · {m.cal} {t('kcal')}</Text>
                  </View>
                  <Text style={s.mealProtein}>{m.p}g</Text>
                  <TouchableOpacity onPress={() => confirmRemove(i)} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                    <Text style={s.mealRemove}>×</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Coach (quiet link) ── */}
        <TouchableOpacity style={s.coachLink} onPress={() => requireAccount('coach') && navigation.navigate('Coach')} activeOpacity={0.8}>
          <Text style={s.coachTxt}>🤖  {t('askCoach')}</Text>
          <Text style={s.coachArrow}>{fwd}</Text>
        </TouchableOpacity>

        {/* Room to scroll the text box above the keyboard while typing. */}
        <View style={{ height: typing ? 420 : 40 }} />
      </ScrollView>

      <MealSheet
        visible={sheet.visible}
        text={sheet.text}
        title={sheet.title}
        loading={sheet.loading}
        error={sheet.error}
        items={sheet.items}
        remaining={remaining}
        onLog={logDescribed}
        onRetry={() => describe(sheet.text)}
        onClose={() => setSheet(prev => ({ ...prev, visible:false }))}
      />

      {toast && (
        <Animated.View style={[s.toast, {
          opacity: toastAnim,
          transform: [{ translateY: toastAnim.interpolate({ inputRange:[0,1], outputRange:[20,0] }) }],
        }]}>
          <Text style={s.toastTxt} numberOfLines={1}>✓ {t('logged', { name: foodName(toast.name), n: toast.protein })}</Text>
          <TouchableOpacity onPress={onUndo} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
            <Text style={s.toastUndo}>{t('undo')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:C.bg },
  scroll: { padding:16, paddingTop:12, width:'100%', maxWidth:860, alignSelf:'center' },

  // Header
  header:     { flexDirection:'row', alignItems:'center', marginBottom:18, gap:10 },
  greeting:   { fontSize:22, fontWeight:'900', color:C.text, marginBottom:3, letterSpacing:-0.3 },
  statusLine: { fontSize:14, color:C.text2, fontWeight:'500' },
  streakPill: { backgroundColor:C.card, borderRadius:R.full, paddingHorizontal:12, paddingVertical:7, borderWidth:1, borderColor:C.border },
  streakTxt:  { fontSize:14, fontWeight:'800', color:C.text },
  avatar:     { width:40, height:40, borderRadius:20, backgroundColor:C.card2, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center', overflow:'hidden' },
  avatarImg:  { width:40, height:40 },
  avatarTxt:  { fontSize:16, fontWeight:'800', color:C.text },

  guestBanner:      { flexDirection:'row', alignItems:'center', backgroundColor:C.primary+'12', borderRadius:R.md, paddingHorizontal:14, paddingVertical:12, marginBottom:16, borderWidth:1, borderColor:C.primary+'35' },
  guestBannerTxt:   { flex:1, fontSize:14, color:C.primary, fontWeight:'700' },
  guestBannerArrow: { fontSize:20, color:C.primary },

  // 1. Progress
  heroCard:  { flexDirection:'row', alignItems:'center', gap:18, backgroundColor:C.card, borderRadius:R.xl, padding:16, marginBottom:22, borderWidth:1, borderColor:C.border },
  ringDone:  { fontSize:30, fontWeight:'900', color:C.primary },
  heroValue: { fontSize:30, fontWeight:'900', color:C.text, letterSpacing:-0.5 },
  heroSub:   { fontSize:14, color:C.text2, marginTop:4 },
  calWrap:   { marginTop:12 },
  calRow:    { flexDirection:'row', alignItems:'baseline', justifyContent:'space-between', gap:8, marginBottom:6 },
  calNum:    { fontSize:13, fontWeight:'700', color:C.text2 },
  calNote:   { fontSize:12, fontWeight:'600', flexShrink:1, textAlign:'right' },
  calTrack:  { height:6, borderRadius:3, backgroundColor:C.border, overflow:'hidden' },
  calFill:   { height:6, borderRadius:3 },

  // 2. Log buttons
  logRow:     { flexDirection:'row', gap:10 },
  logBtn:     { flex:1, height:92, borderRadius:R.lg, backgroundColor:C.card, borderWidth:1, borderColor:C.border, alignItems:'center', justifyContent:'center', gap:6 },
  logBtnMain: { backgroundColor:C.primary, borderColor:C.primary },
  logBtnOn:   { borderColor:C.primary, borderWidth:1.5, backgroundColor:C.primary+'14' },
  logIcon:    { fontSize:28, height:34 },
  logTxt:     { fontSize:15, fontWeight:'800', color:C.text },
  logTxtMain: { color:'#0B0F14' },

  inputBar:  { flexDirection:'row', alignItems:'center', backgroundColor:C.card, borderRadius:R.full, paddingLeft:18, paddingRight:6, height:54, borderWidth:1.5, borderColor:C.primary+'60', gap:6, marginTop:10 },
  input:     { flex:1, fontSize:16, color:C.text, paddingVertical:0 },
  inputBtn:  { width:42, height:42, borderRadius:21, backgroundColor:C.card2, alignItems:'center', justifyContent:'center' },
  closeTxt:  { fontSize:16, color:C.text2, fontWeight:'700' },
  sendBtn:   { backgroundColor:C.primary },
  sendTxt:   { fontSize:20, fontWeight:'900', color:'#0B0F14' },
  inputHint: { fontSize:12, color:C.text3, marginTop:8, marginBottom:24, textAlign:'center' },

  // 3. Your foods
  sectionTitle: { fontSize:16, fontWeight:'800', color:C.text, marginBottom:12 },
  foodPill:     { alignItems:'center', width:88 },
  foodAmount:   { fontSize:12, color:C.text2, marginBottom:2, textAlign:'center' },
  foodName:     { fontSize:13, fontWeight:'600', color:C.text, marginTop:8, marginBottom:2, textAlign:'center' },
  foodProtein:  { fontSize:13, color:C.primary, fontWeight:'800' },

  // 4. Next-meal idea
  ideaCard:    { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:C.card, borderRadius:R.lg, padding:12, marginTop:22, borderWidth:1, borderColor:C.border },
  ideaLabel:   { fontSize:12, fontWeight:'700', color:C.text2, marginBottom:3 },
  ideaName:    { fontSize:14, fontWeight:'700', color:C.text },
  ideaSwap:    { width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', backgroundColor:C.card2 },
  ideaSwapTxt: { fontSize:17, color:C.text2, fontWeight:'700' },
  ideaLog:     { paddingHorizontal:14, height:36, borderRadius:R.full, alignItems:'center', justifyContent:'center', borderWidth:1.5, borderColor:C.primary },
  ideaLogTxt:  { fontSize:13, fontWeight:'800', color:C.primary },

  doneCard:  { backgroundColor:C.primary+'10', borderRadius:R.xl, padding:22, alignItems:'center', marginTop:22, borderWidth:1, borderColor:C.primary+'35' },
  doneEmoji: { fontSize:40, marginBottom:8 },
  doneTitle: { fontSize:18, fontWeight:'900', color:C.primary, marginBottom:4 },
  doneSub:   { fontSize:14, color:C.text2 },

  // Today's log
  mealsCard:   { backgroundColor:C.card, borderRadius:R.lg, borderWidth:1, borderColor:C.border, overflow:'hidden' },
  mealRow:     { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:13, borderBottomWidth:1, borderBottomColor:C.border, gap:12 },
  mealEmoji:   { fontSize:22 },
  mealName:    { fontSize:15, color:C.text, fontWeight:'600' },
  mealMeta:    { fontSize:12, color:C.text2, marginTop:3 },
  mealProtein: { fontSize:15, color:C.primary, fontWeight:'800' },
  mealRemove:  { fontSize:22, color:C.text3, lineHeight:24, paddingHorizontal:2 },

  // Coach link
  coachLink:  { flexDirection:'row', alignItems:'center', paddingVertical:18, paddingHorizontal:4, marginTop:10 },
  coachTxt:   { flex:1, fontSize:14, fontWeight:'600', color:C.text2 },
  coachArrow: { fontSize:20, color:C.text3 },

  // Toast
  toast:     { position:'absolute', left:16, right:16, bottom:16, backgroundColor:C.card2, borderRadius:R.md, paddingHorizontal:16, paddingVertical:14, flexDirection:'row', alignItems:'center', gap:12, borderWidth:1, borderColor:C.primary+'50', elevation:6, shadowColor:'#000', shadowOpacity:0.3, shadowRadius:8, shadowOffset:{ width:0, height:4 } },
  toastTxt:  { flex:1, fontSize:14, color:C.text, fontWeight:'600' },
  toastUndo: { fontSize:14, color:C.primary, fontWeight:'800' },
});
