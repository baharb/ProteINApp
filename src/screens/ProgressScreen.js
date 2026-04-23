import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton } from '../components/UI';
import { supabase } from '../lib/supabase';

// Simple calendar date picker
function CalendarPicker({ value, onChange, onClose }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const selected = value ? new Date(value + 'T00:00:00') : null;

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  function daysInMonth(y, m) { return new Date(y, m+1, 0).getDate(); }
  function firstDay(y, m)    { return new Date(y, m, 1).getDay(); }

  function prevMonth() { if (viewMonth === 0) { setViewYear(y=>y-1); setViewMonth(11); } else setViewMonth(m=>m-1); }
  function nextMonth() { if (viewMonth===11) { setViewYear(y=>y+1); setViewMonth(0); }  else setViewMonth(m=>m+1); }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay  = firstDay(viewYear, viewMonth);
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  function selectDay(d) {
    if (!d) return;
    const mm = String(viewMonth+1).padStart(2,'0');
    const dd = String(d).padStart(2,'0');
    onChange(`${viewYear}-${mm}-${dd}`);
    onClose();
  }

  function isSelected(d) {
    if (!d || !selected) return false;
    return selected.getFullYear()===viewYear && selected.getMonth()===viewMonth && selected.getDate()===d;
  }

  function isFuture(d) {
    if (!d) return false;
    const cell = new Date(viewYear, viewMonth, d);
    return cell > today;
  }

  return (
    <View style={cal.container}>
      <View style={cal.nav}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn}><Text style={cal.navTxt}>‹</Text></TouchableOpacity>
        <Text style={cal.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn}><Text style={cal.navTxt}>›</Text></TouchableOpacity>
      </View>
      <View style={cal.grid}>
        {DAYS.map(d => <Text key={d} style={cal.dayName}>{d}</Text>)}
        {cells.map((d, i) => (
          <TouchableOpacity key={i} style={[cal.cell, isSelected(d)&&cal.cellSelected, isFuture(d)&&cal.cellFuture]}
            onPress={() => selectDay(d)} disabled={!d || isFuture(d)}>
            <Text style={[cal.cellTxt, isSelected(d)&&cal.cellTxtSelected, (!d||isFuture(d))&&{opacity:0.25}]}>{d||''}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor:colors.card, borderRadius:radius.lg, padding:16 },
  nav: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  navBtn: { padding:8 },
  navTxt: { fontSize:22, color:colors.accent, fontWeight:'700' },
  monthTitle: { fontSize:15, fontWeight:'700', color:colors.text },
  grid: { flexDirection:'row', flexWrap:'wrap' },
  dayName: { width:'14.28%', textAlign:'center', fontSize:11, color:colors.text2, fontWeight:'700', paddingVertical:4 },
  cell: { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderRadius:20 },
  cellSelected: { backgroundColor:colors.accent },
  cellFuture: { opacity:0.3 },
  cellTxt: { fontSize:13, color:colors.text },
  cellTxtSelected: { color:'#0a0a0f', fontWeight:'700' },
});

function DateRangeModal({ onSelect, onClose }) {
  const [step, setStep] = useState('from'); // 'from' or 'to'
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  function handleFromSelect(date) { setFrom(date); setStep('to'); }
  function handleToSelect(date) {
    if (date < from) { setTo(from); setFrom(date); } else setTo(date);
    setStep('done');
  }

  function handleApply() {
    if (from && to) { onSelect(from, to); onClose(); }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.handle} />
          <Text style={dm.title}>
            {step === 'from' ? '📅 Select Start Date' : step === 'to' ? '📅 Select End Date' : '📅 Date Range Selected'}
          </Text>
          {step !== 'done' && (
            <CalendarPicker
              value={step === 'from' ? from : to}
              onChange={step === 'from' ? handleFromSelect : handleToSelect}
              onClose={() => {}}
            />
          )}
          {(from || to) && (
            <View style={dm.selectedRow}>
              {from && <Text style={dm.selectedTxt}>From: <Text style={{color:colors.accent}}>{from}</Text></Text>}
              {to   && <Text style={dm.selectedTxt}>To: <Text style={{color:colors.accent}}>{to}</Text></Text>}
            </View>
          )}
          {step === 'done' && <PrimaryButton title="Apply Range" onPress={handleApply} style={{marginTop:12}} />}
          {step === 'to'   && <TouchableOpacity style={{padding:10,alignItems:'center'}} onPress={() => setStep('from')}><Text style={{color:colors.text2}}>← Change start date</Text></TouchableOpacity>}
          <TouchableOpacity style={{padding:12,alignItems:'center'}} onPress={onClose}><Text style={{color:colors.text2}}>Cancel</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const dm = StyleSheet.create({
  overlay: { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet: { backgroundColor:colors.bg2, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40 },
  handle: { width:40, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  title: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:16 },
  selectedRow: { marginTop:12, gap:4 },
  selectedTxt: { fontSize:13, color:colors.text2 },
});

function BarChart({ data, labels, goal, color, title }) {
  const vals = data.map(v => isNaN(v)||v<0 ? 0 : v);
  const max  = Math.max(...vals, goal, 1);
  return (
    <View style={s.chartCard}>
      <View style={s.chartHead}>
        <Text style={s.chartTitle}>{title}</Text>
        <Text style={s.chartGoal}>Goal: {goal}</Text>
      </View>
      <View style={s.bars}>
        {vals.map((v, i) => {
          const h = v > 0 ? Math.max(Math.round((v/max)*80), 4) : 0;
          return (
            <View key={i} style={s.barCol}>
              {v > 0 && <Text style={s.barVal} numberOfLines={1}>{v}</Text>}
              <View style={s.barOuter}>
                <View style={[s.bar,{height:h, backgroundColor:v>=goal?colors.accent:color}]} />
              </View>
              <Text style={[s.barDay, labels[i]==='Today'&&{color:colors.accent,fontWeight:'700'}]} numberOfLines={1}>{labels[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { today, goals, weightLog, logWeight, units, session } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [weightInput,   setWeightInput]   = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [duration,      setDuration]      = useState(7);
  const [customFrom,    setCustomFrom]    = useState(null);
  const [customTo,      setCustomTo]      = useState(null);
  const [mealHistory,   setMealHistory]   = useState({});
  const [loadingHistory,setLoadingHistory]= useState(false);
  const wu = units?.weight || 'kg';

  useEffect(() => { if (session) loadHistory(); }, [session, duration, customFrom, customTo]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const now = new Date();
      let fromDate, toDate;
      if (duration === 0 && customFrom && customTo) { fromDate = customFrom; toDate = customTo; }
      else { toDate = now.toISOString().split('T')[0]; const f = new Date(now); f.setDate(f.getDate()-(duration-1)); fromDate = f.toISOString().split('T')[0]; }
      const { data } = await supabase.from('meals').select('date,calories,protein').eq('user_id', session.user.id).gte('date', fromDate).lte('date', toDate);
      const grouped = {};
      (data||[]).forEach(m => { if (!grouped[m.date]) grouped[m.date]={protein:0,calories:0}; grouped[m.date].protein+=m.protein; grouped[m.date].calories+=m.calories; });
      const todayStr = now.toISOString().split('T')[0];
      grouped[todayStr] = { protein:today.protein, calories:today.calories };
      setMealHistory(grouped);
    } catch(e) { console.error('loadHistory:', e); }
    finally { setLoadingHistory(false); }
  }

  function buildChartData() {
    const days = duration===0 && customFrom && customTo ? Math.min(30, Math.round((new Date(customTo)-new Date(customFrom))/86400000)+1) : duration;
    const result = [];
    const now = new Date();
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate()-i);
      const key = d.toISOString().split('T')[0];
      result.push({ date:key, protein:mealHistory[key]?.protein||0, calories:mealHistory[key]?.calories||0, label: i===0 ? 'Today' : d.toLocaleDateString('en-US',{month:'numeric',day:'numeric'}) });
    }
    return result;
  }

  const chartData   = buildChartData();
  const protData    = chartData.map(d=>d.protein);
  const calData     = chartData.map(d=>d.calories);
  const chartLabels = chartData.map(d=>d.label);
  const activeDays  = protData.filter(v=>v>0).length;
  const avgProtein  = activeDays>0 ? Math.round(protData.filter(v=>v>0).reduce((a,b)=>a+b,0)/activeDays) : 0;
  const daysHit     = protData.filter(v=>v>=goals.protein).length;

  async function handleLogWeight() {
    const v = parseFloat(weightInput);
    if (!v||v<20||v>500) return;
    await logWeight(v); setWeightInput('');
  }

  const achievements = [
    { icon:'🌱', name:'First Step',        desc:'Logged your first meal',         done: today.meals.length>0||activeDays>0 },
    { icon:'💪', name:'Protein Crusher',   desc:'Hit protein goal at least once', done: daysHit>=1 },
    { icon:'🔥', name:'3-Day Streak',      desc:'Logged meals 3+ days',           done: activeDays>=3 },
    { icon:'🏆', name:'Week Warrior',      desc:'Logged meals 7 days',            done: activeDays>=7 },
    { icon:'⚖️', name:'Weight Tracker',    desc:'Logged your weight once',        done: weightLog.length>=1 },
    { icon:'📊', name:'Consistent Logger', desc:'Hit protein goal 3+ days',       done: daysHit>=3 },
    { icon:'🥇', name:'Protein Master',    desc:'Hit protein goal 5+ days',       done: daysHit>=5 },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Progress" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]}>
        <View style={s.todayCard}>
          <View style={s.todayRow}>
            {[
              {val:`${today.protein}g`, sub:`/ ${goals.protein}g`, label:'Protein Today', color:colors.accent},
              {val:today.calories,      sub:`/ ${goals.calories}`, label:'Calories',      color:colors.orange},
              {val:today.meals.length,  sub:'meals',               label:'Logged',        color:colors.accent3},
            ].map(item => (
              <View key={item.label} style={s.todayItem}>
                <Text style={[s.todayVal,{color:item.color}]}>{item.val}</Text>
                <Text style={s.todaySub}>{item.sub}</Text>
                <Text style={s.todayLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.durationRow}>
          {[{label:'7D',val:7},{label:'14D',val:14},{label:'30D',val:30},{label:'Custom 📅',val:0}].map(opt => (
            <TouchableOpacity key={opt.val} style={[s.durationBtn, duration===opt.val&&s.durationBtnOn]}
              onPress={() => { setDuration(opt.val); if (opt.val===0) setShowDateModal(true); }}>
              <Text style={[s.durationTxt, duration===opt.val&&{color:colors.accent}]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {duration===0&&customFrom&&customTo && (
          <TouchableOpacity onPress={() => setShowDateModal(true)}>
            <Text style={s.customRangeLabel}>{customFrom} → {customTo} (tap to change)</Text>
          </TouchableOpacity>
        )}

        {loadingHistory ? (
          <View style={s.loadingCard}><Text style={{color:colors.text2}}>Loading history…</Text></View>
        ) : (
          <>
            <BarChart data={protData} labels={chartLabels} goal={goals.protein}  color="rgba(126,255,160,0.35)" title="Protein (g)" />
            <BarChart data={calData}  labels={chartLabels} goal={goals.calories} color="rgba(0,212,255,0.35)"   title="Calories" />
          </>
        )}

        <View style={s.statsRow}>
          {[{val:`${avgProtein}g`,label:'Avg Protein'},{val:daysHit,label:'Goals Hit'},{val:activeDays,label:'Days Logged'}].map(item => (
            <View key={item.label} style={s.statItem}>
              <Text style={s.statVal}>{item.val}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionTitle}>⚖️ Weight Log</Text>
        <View style={s.weightRow}>
          <TextInput style={s.weightInput} value={weightInput} onChangeText={setWeightInput}
            keyboardType="numeric" placeholder={`Weight (${wu})`} placeholderTextColor={colors.text3}
            returnKeyType="done" onSubmitEditing={handleLogWeight} />
          <TouchableOpacity style={s.logBtn} onPress={handleLogWeight}>
            <Text style={s.logBtnTxt}>Log</Text>
          </TouchableOpacity>
        </View>
        {weightLog.length===0 ? <Text style={s.emptyTxt}>No weight entries yet.</Text> : (
          weightLog.slice().reverse().slice(0,8).map((e, i, arr) => {
            const prev = arr[i+1];
            const diff = prev ? (e.weight-prev.weight).toFixed(1) : null;
            return (
              <View key={i} style={s.weightEntry}>
                <Text style={s.weightDate}>{e.date}</Text>
                <View style={{flex:1,flexDirection:'row',alignItems:'center',gap:8}}>
                  {diff!==null && <Text style={{fontSize:12,fontWeight:'600',color:parseFloat(diff)>0?colors.orange:colors.accent}}>{parseFloat(diff)>0?'+':''}{diff} {wu}</Text>}
                  <Text style={s.weightVal}>{e.weight} {wu}</Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={[s.sectionTitle,{marginTop:8}]}>🏆 Achievements</Text>
        {achievements.map(b => (
          <View key={b.name} style={[s.badge, !b.done&&s.badgeDim]}>
            <Text style={{fontSize:22,marginRight:10}}>{b.icon}</Text>
            <View style={{flex:1}}>
              <Text style={s.badgeName}>{b.name}</Text>
              <Text style={s.badgeDesc}>{b.desc}</Text>
            </View>
            {b.done ? <Text style={{color:colors.accent,fontSize:16,fontWeight:'700'}}>✓</Text> : <Text style={{color:colors.text3,fontSize:11}}>Locked</Text>}
          </View>
        ))}
        <View style={{height:30}} />
      </ScrollView>

      {showDateModal && (
        <DateRangeModal
          onSelect={(from,to) => { setCustomFrom(from); setCustomTo(to); setDuration(0); }}
          onClose={() => { setShowDateModal(false); if (!customFrom) setDuration(7); }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg}, scroll:{padding:18,paddingTop:8}, scrollL:{paddingHorizontal:40},
  todayCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:12,borderWidth:1,borderColor:colors.border},
  todayRow:{flexDirection:'row'}, todayItem:{flex:1,alignItems:'center'},
  todayVal:{fontSize:22,fontWeight:'700'}, todaySub:{fontSize:11,color:colors.text2,marginTop:2},
  todayLabel:{fontSize:9,color:colors.text3,textTransform:'uppercase',letterSpacing:0.5,marginTop:2},
  durationRow:{flexDirection:'row',gap:8,marginBottom:12},
  durationBtn:{flex:1,backgroundColor:colors.card,borderRadius:radius.sm,paddingVertical:8,alignItems:'center',borderWidth:1,borderColor:colors.border},
  durationBtnOn:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.1)'},
  durationTxt:{fontSize:11,fontWeight:'700',color:colors.text2},
  customRangeLabel:{fontSize:12,color:colors.accent,marginBottom:10,textAlign:'center'},
  loadingCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:20,alignItems:'center',marginBottom:14,borderWidth:1,borderColor:colors.border},
  chartCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:14,borderWidth:1,borderColor:colors.border},
  chartHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},
  chartTitle:{fontSize:14,fontWeight:'700',color:colors.text}, chartGoal:{fontSize:11,color:colors.text2},
  bars:{flexDirection:'row',alignItems:'flex-end',height:100,gap:2},
  barCol:{flex:1,alignItems:'center',height:'100%',justifyContent:'flex-end',gap:2},
  barVal:{fontSize:7,color:colors.text3,textAlign:'center',width:'100%'},
  barOuter:{width:'100%',height:80,justifyContent:'flex-end'}, bar:{width:'100%',borderRadius:3},
  barDay:{fontSize:7,color:colors.text3,textTransform:'uppercase',textAlign:'center',width:'100%'},
  statsRow:{flexDirection:'row',backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:14,borderWidth:1,borderColor:colors.border},
  statItem:{flex:1,alignItems:'center'}, statVal:{fontSize:22,fontWeight:'700',color:colors.accent}, statLabel:{fontSize:11,color:colors.text2,marginTop:2},
  sectionTitle:{fontSize:16,fontWeight:'700',color:colors.text,marginBottom:10},
  weightRow:{flexDirection:'row',gap:10,marginBottom:10},
  weightInput:{flex:1,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:8,padding:12,fontSize:15,color:colors.text},
  logBtn:{backgroundColor:colors.accent,borderRadius:8,paddingHorizontal:18,alignItems:'center',justifyContent:'center'},
  logBtnTxt:{color:'#0a0a0f',fontWeight:'700',fontSize:14},
  emptyTxt:{color:colors.text2,fontSize:13,textAlign:'center',padding:16},
  weightEntry:{flexDirection:'row',alignItems:'center',backgroundColor:colors.card,borderRadius:8,padding:12,marginBottom:7,borderWidth:1,borderColor:colors.border},
  weightDate:{fontSize:13,color:colors.text2,width:70}, weightVal:{fontSize:16,fontWeight:'700',color:colors.text},
  badge:{backgroundColor:colors.card,borderRadius:radius.sm,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:colors.border},
  badgeDim:{opacity:0.35}, badgeName:{fontSize:13,fontWeight:'700',color:colors.text}, badgeDesc:{fontSize:11,color:colors.text2,marginTop:1},
});
