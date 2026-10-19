import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, R, ACHIEVEMENTS } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { useStreak } from '../hooks/useStreak';
import { supabase } from '../lib/supabase';
import { DEMO, demoHistory } from '../lib/demo';
import { localDateKey } from '../lib/dates';

const PERIODS = [
  { k:7,  l:'7D'  },
  { k:14, l:'14D' },
  { k:30, l:'30D' },
  { k:90, l:'90D' },
];

const dateKey = (d) => localDateKey(d);

// ── Protein bar chart with a dashed goal line ─────────────────────────────
const CHART_H = 150;

function ProteinChart({ data, labels, goal }) {
  const { t } = useLang();
  const max   = Math.max(...data, goal, 1) * 1.1;
  const goalY = (goal / max) * CHART_H;
  const dense = data.length > 14;
  const every = data.length <= 14 ? 1 : data.length <= 30 ? 5 : 15;

  return (
    <View>
      <View style={[ch.area, { height:CHART_H }]}>
        {/* Goal line */}
        <View style={[ch.goalLine, { bottom:goalY }]}>
          {Array.from({ length:30 }).map((_, i) => <View key={i} style={ch.dash} />)}
        </View>
        <View style={ch.bars}>
          {data.map((val, i) => {
            const h       = val > 0 ? Math.max((val / max) * CHART_H, 4) : 2;
            const hit     = val >= goal;
            const isToday = i === data.length - 1;
            return (
              <View key={i} style={[ch.barCol, { marginHorizontal: dense ? 1 : 4 }]}>
                <View style={[ch.bar, {
                  height: h,
                  backgroundColor: hit ? C.primary : val > 0 ? C.primary + '55' : C.border,
                  borderWidth: isToday ? 1.5 : 0, borderColor: C.text,
                }]} />
              </View>
            );
          })}
        </View>
      </View>
      <View style={ch.labels}>
        {labels.map((l, i) => (
          <Text key={i} style={[ch.label, { marginHorizontal: dense ? 1 : 4 }]} numberOfLines={1}>
            {(data.length - 1 - i) % every === 0 ? l : ''}
          </Text>
        ))}
      </View>
      <View style={ch.legend}>
        <View style={[ch.legendDot, { backgroundColor:C.primary }]} /><Text style={ch.legendTxt}>{t('goalHitLegend')}</Text>
        <View style={[ch.legendDot, { backgroundColor:C.primary + '55', marginLeft:14 }]} /><Text style={ch.legendTxt}>{t('belowGoal')}</Text>
      </View>
    </View>
  );
}

const ch = StyleSheet.create({
  area:      { position:'relative', justifyContent:'flex-end' },
  bars:      { flexDirection:'row', alignItems:'flex-end', height:'100%' },
  barCol:    { flex:1, justifyContent:'flex-end', height:'100%' },
  bar:       { width:'100%', borderRadius:4 },
  goalLine:  { position:'absolute', left:0, right:0, flexDirection:'row', justifyContent:'space-between', zIndex:1 },
  dash:      { width:5, height:1.5, backgroundColor:C.success },
  labels:    { flexDirection:'row', marginTop:6 },
  label:     { flex:1, fontSize:10, color:C.text2, textAlign:'center' },
  legend:    { flexDirection:'row', alignItems:'center', marginTop:12 },
  legendDot: { width:10, height:10, borderRadius:3, marginRight:6 },
  legendTxt: { fontSize:12, color:C.text2 },
});

// ── Screen ────────────────────────────────────────────────────────────────
export default function ProgressScreen() {
  const { today, goals, session, isGuest } = useApp();
  const { t, locale } = useLang();
  const { streak } = useStreak(today.protein, goals.protein);
  const [period,  setPeriod]  = useState(7);
  const [history, setHistory] = useState({});   // date -> protein
  const [mealCnt, setMealCnt] = useState({});   // date -> meals logged
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (session && !isGuest) loadHistory(); }, [session, period]);

  async function loadHistory() {
    if (DEMO) { const h = demoHistory(); setHistory(h.prot); setMealCnt(h.cnt); return; }
    setLoading(true);
    try {
      const from = new Date(); from.setDate(from.getDate() - (period - 1));
      const { data } = await supabase.from('meals').select('date,protein')
        .eq('user_id', session.user.id)
        .gte('date', dateKey(from))
        .lte('date', dateKey(new Date()));
      const prot = {}, cnt = {};
      (data || []).forEach(m => {
        prot[m.date] = (prot[m.date] || 0) + m.protein;
        cnt[m.date]  = (cnt[m.date]  || 0) + 1;
      });
      setHistory(prot); setMealCnt(cnt);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  // Build the series; today always comes from live state.
  const vals = [], labels = [];
  let mealsLogged = 0;
  const todayKey = dateKey(new Date());
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const isToday = key === todayKey;
    vals.push(isToday ? today.protein : (history[key] || 0));
    mealsLogged += isToday ? today.meals.length : (mealCnt[key] || 0);
    labels.push(period <= 14
      ? d.toLocaleDateString(locale, { weekday:'short' })
      : `${d.getDate()}/${d.getMonth() + 1}`);
  }

  const activeDays = vals.filter(v => v > 0).length;
  const daysHit    = vals.filter(v => v >= goals.protein).length;
  const avgProt    = activeDays > 0 ? Math.round(vals.filter(v => v > 0).reduce((a, b) => a + b, 0) / activeDays) : 0;
  const bestDay    = Math.max(...vals, 0);

  function getInsight() {
    if (activeDays === 0) return t('insStart');
    if (daysHit === activeDays) return t('insAll');
    const gap = goals.protein - avgProt;
    if (gap > 0 && gap <= 30) return t('insClose', { avg: avgProt, gap });
    if (gap > 0) return t('insFar', { avg: avgProt, gap });
    return t('insConsistent', { hit: daysHit, n: period });
  }

  const isUnlocked = (ach) =>
    ach.id === 'first_scan' ? (today.meals.length > 0 || activeDays > 0) : streak >= ach.days;
  const nextBadge = ACHIEVEMENTS.find(a => a.days > streak);

  const stats = [
    { icon:'🥩', label:t('avgProtein'),  value:`${avgProt}g` },
    { icon:'🎯', label:t('goalHitDays'), value:t(daysHit === 1 ? 'dayN' : 'daysN', { n: daysHit }) },
    { icon:'🍽️', label:t('mealsLogged'), value:`${mealsLogged}` },
    { icon:'🏅', label:t('bestDay'),     value:`${bestDay}g` },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.title}>{t('progress')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Period selector */}
        <View style={s.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.k} style={[s.periodBtn, period === p.k && s.periodBtnOn]} onPress={() => setPeriod(p.k)} activeOpacity={0.85}>
              <Text style={[s.periodTxt, period === p.k && { color:'#0B0F14' }]}>{p.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>{t('proteinG')}</Text>
            <Text style={s.cardMeta}>{t('goalN', { n: goals.protein })}</Text>
          </View>
          {loading
            ? <View style={{ height:CHART_H, alignItems:'center', justifyContent:'center' }}><Text style={{ color:C.text2 }}>{t('loading')}</Text></View>
            : <ProteinChart data={vals} labels={labels} goal={goals.protein} />}
          {isGuest && <Text style={s.guestNote}>{t('guestHistory')}</Text>}
        </View>

        {/* Stats */}
        <Text style={s.sectionTitle}>{period === 7 ? t('thisWeek') : t('lastNDays', { n: period })}</Text>
        <View style={s.listCard}>
          {stats.map((st, i) => (
            <View key={st.label} style={[s.statRow, i === stats.length - 1 && { borderBottomWidth:0 }]}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
              <Text style={s.statVal}>{st.value}</Text>
            </View>
          ))}
        </View>

        {/* Insight */}
        <View style={s.insightCard}>
          <Text style={s.insightLabel}>{t('insight')}</Text>
          <Text style={s.insightTxt}>{getInsight()}</Text>
        </View>

        {/* Streak */}
        <View style={s.streakCard}>
          <Text style={s.streakLabel}>{t('currentStreak')}</Text>
          <View style={s.streakRow}>
            <Text style={s.streakFire}>🔥</Text>
            <Text style={s.streakNum}>{streak}</Text>
            <Text style={s.streakDays}>{streak === 1 ? t('day') : t('days')}</Text>
          </View>
          <Text style={s.streakSub}>
            {nextBadge
              ? t('moreDaysTo', { n: t(nextBadge.days - streak === 1 ? 'dayN' : 'daysN', { n: nextBadge.days - streak }), badge: t(`ach_${nextBadge.id}`) })
              : t('allBadges')}
          </Text>
        </View>

        {/* Badges */}
        <Text style={s.sectionTitle}>{t('achievements')}</Text>
        <View style={s.listCard}>
          {ACHIEVEMENTS.map((ach, i) => {
            const unlocked = isUnlocked(ach);
            return (
              <View key={ach.id} style={[s.badgeRow, i === ACHIEVEMENTS.length - 1 && { borderBottomWidth:0 }]}>
                <View style={[s.badgeIcon, !unlocked && { opacity:0.35 }]}><Text style={{ fontSize:22 }}>{ach.icon}</Text></View>
                <View style={{ flex:1 }}>
                  <Text style={[s.badgeName, !unlocked && { color:C.text2 }]}>{t(`ach_${ach.id}`)}</Text>
                  <Text style={s.badgeDesc}>{t(`ach_${ach.id}_d`)}</Text>
                </View>
                {unlocked
                  ? <View style={s.badgeCheck}><Text style={s.badgeCheckTxt}>✓</Text></View>
                  : <Text style={s.badgeLock}>🔒</Text>}
              </View>
            );
          })}
        </View>

        <View style={{ height:30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex:1, backgroundColor:C.bg },
  header: { paddingHorizontal:16, paddingTop:12, paddingBottom:6, width:'100%', maxWidth:860, alignSelf:'center' },
  title:  { fontSize:24, fontWeight:'900', color:C.text },
  scroll: { padding:16, paddingTop:8, width:'100%', maxWidth:860, alignSelf:'center' },

  periodRow:   { flexDirection:'row', gap:8, marginBottom:16 },
  periodBtn:   { flex:1, paddingVertical:9, borderRadius:R.md, backgroundColor:C.card, borderWidth:1, borderColor:C.border, alignItems:'center' },
  periodBtnOn: { backgroundColor:C.primary, borderColor:C.primary },
  periodTxt:   { fontSize:14, fontWeight:'800', color:C.text2 },

  card:       { backgroundColor:C.card, borderRadius:R.lg, padding:16, marginBottom:20, borderWidth:1, borderColor:C.border },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  cardTitle:  { fontSize:16, fontWeight:'800', color:C.text },
  cardMeta:   { fontSize:13, color:C.text2, fontWeight:'600' },
  guestNote:  { fontSize:12, color:C.text2, marginTop:12, lineHeight:17 },

  sectionTitle: { fontSize:17, fontWeight:'800', color:C.text, marginBottom:12 },
  listCard:     { backgroundColor:C.card, borderRadius:R.lg, borderWidth:1, borderColor:C.border, marginBottom:20, overflow:'hidden' },
  statRow:      { flexDirection:'row', alignItems:'center', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:C.border },
  statIcon:     { fontSize:18, marginRight:12 },
  statLabel:    { flex:1, fontSize:15, color:C.text },
  statVal:      { fontSize:16, fontWeight:'800', color:C.primary },

  insightCard:  { backgroundColor:C.primary+'10', borderRadius:R.lg, padding:16, marginBottom:20, borderWidth:1, borderColor:C.primary+'35' },
  insightLabel: { fontSize:13, fontWeight:'800', color:C.primary, marginBottom:6 },
  insightTxt:   { fontSize:15, color:C.text, lineHeight:22 },

  streakCard:  { backgroundColor:'#2A1A10', borderRadius:R.xl, padding:20, alignItems:'center', marginBottom:20, borderWidth:1, borderColor:C.warning+'60' },
  streakLabel: { fontSize:14, color:C.warning, fontWeight:'700', marginBottom:6 },
  streakRow:   { flexDirection:'row', alignItems:'flex-end', gap:8 },
  streakFire:  { fontSize:44 },
  streakNum:   { fontSize:52, fontWeight:'900', color:C.text, lineHeight:58 },
  streakDays:  { fontSize:18, fontWeight:'700', color:C.text2, marginBottom:10 },
  streakSub:   { fontSize:14, color:C.text2, marginTop:6, textAlign:'center' },

  badgeRow:      { flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:16, paddingVertical:13, borderBottomWidth:1, borderBottomColor:C.border },
  badgeIcon:     { width:42, height:42, borderRadius:21, backgroundColor:C.card2, alignItems:'center', justifyContent:'center' },
  badgeName:     { fontSize:15, fontWeight:'700', color:C.text },
  badgeDesc:     { fontSize:12, color:C.text2, marginTop:2 },
  badgeCheck:    { width:24, height:24, borderRadius:12, backgroundColor:C.primary, alignItems:'center', justifyContent:'center' },
  badgeCheckTxt: { fontSize:13, fontWeight:'900', color:'#0B0F14' },
  badgeLock:     { fontSize:16, opacity:0.6 },
});
