import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, displayWeight } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader } from '../components/UI';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function BarChart({ data, goal, color, label, unit='' }) {
  const max = Math.max(...data, goal, 1);
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>{label}</Text>
      <View style={s.bars}>
        {data.map((v,i) => {
          const h = v > 0 ? Math.round((v/max)*90) : 0;
          const hit = v >= goal;
          return (
            <View key={i} style={s.barCol}>
              <Text style={s.barVal}>{v>0?v+unit:''}</Text>
              <View style={s.barOuter}>
                <View style={[s.bar,{height:h,backgroundColor:hit?colors.accent:color,minHeight:v>0?4:0}]} />
              </View>
              <Text style={s.barDay}>{DAYS[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgressScreen({ navigation }) {
  const { today, goals, weightLog, logWeight, goals2, weekData, units } = useApp();
  const [weightInput, setWeightInput] = useState('');

  const pd = [...weekData.protein]; pd[6] = today.protein;
  const cd = [...weekData.calories]; cd[6] = today.calories;
  const activeDays = pd.filter(v=>v>0).length;
  const avgP = activeDays>0 ? Math.round(pd.filter(v=>v>0).reduce((a,b)=>a+b,0)/activeDays) : 0;
  const daysHit = pd.filter(v=>v>=goals.protein).length;

  function handleLog() {
    const v = parseFloat(weightInput);
    if (!v || v<20||v>500) return;
    logWeight(v);
    setWeightInput('');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Progress" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Summary */}
        <View style={s.summaryCard}>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{avgP}g</Text>
            <Text style={s.summaryLabel}>Avg Protein</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{daysHit}</Text>
            <Text style={s.summaryLabel}>Goals Hit</Text>
          </View>
          <View style={s.summaryItem}>
            <Text style={s.summaryVal}>{activeDays}</Text>
            <Text style={s.summaryLabel}>Days Logged</Text>
          </View>
        </View>

        {/* Charts */}
        <BarChart data={pd} goal={goals.protein} color="rgba(126,255,160,0.35)" label="Protein this week (g)" />
        <BarChart data={cd} goal={goals.calories} color="rgba(0,212,255,0.35)" label="Calories this week" />

        {/* Weight log */}
        <Text style={s.sectionTitle}>⚖️ Weight Log</Text>
        <View style={s.weightRow}>
          <TextInput
            style={s.weightInput}
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="numeric"
            placeholder={`Weight (${units?.weight || 'kg'})`}
            placeholderTextColor={colors.text3}
            returnKeyType="done"
            onSubmitEditing={handleLog}
          />
          <TouchableOpacity style={s.logBtn} onPress={handleLog}>
            <Text style={s.logBtnText}>Log</Text>
          </TouchableOpacity>
        </View>
        {weightLog.length === 0 ? (
          <Text style={s.emptyText}>No weight logged yet</Text>
        ) : (
          weightLog.slice(-5).reverse().map((e,i,arr) => {
            const prev = arr[i+1];
            const diff = prev ? (e.weight - prev.weight).toFixed(1) : null;
            return (
              <View key={i} style={s.weightEntry}>
                <Text style={s.weightDate}>{e.date}</Text>
                <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
                  {diff!==null && <Text style={{fontSize:12,fontWeight:'600',color:parseFloat(diff)>0?colors.orange:colors.accent}}>{parseFloat(diff)>0?'+':''}{diff} {units?.weight||'kg'}</Text>}
                  <Text style={s.weightVal}>{e.weight} {units?.weight||'kg'}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Badges */}
        <Text style={[s.sectionTitle,{marginTop:8}]}>🏆 Achievements</Text>
        {[
          {icon:'🔥', name:'5-Day Streak',    desc:'Logged 5 days in a row',  done:activeDays>=5},
          {icon:'💪', name:'Protein Master',  desc:'Hit protein 3 days',       done:daysHit>=3},
          {icon:'📸', name:'Snap Pro',         desc:'Used AI scan feature',     done:true},
        ].map(b => (
          <View key={b.name} style={[s.badge, !b.done && s.badgeDimmed]}>
            <Text style={{fontSize:22,marginRight:10}}>{b.icon}</Text>
            <View>
              <Text style={s.badgeName}>{b.name}</Text>
              <Text style={s.badgeDesc}>{b.desc}</Text>
            </View>
            {b.done && <Text style={s.badgeDone}>✓</Text>}
          </View>
        ))}

        <View style={{height:30}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:18, paddingTop:8 },
  summaryCard: { flexDirection:'row', backgroundColor:colors.card, borderRadius:radius.lg, padding:18, marginBottom:14, borderWidth:1, borderColor:colors.border },
  summaryItem: { flex:1, alignItems:'center' },
  summaryVal: { fontSize:24, fontWeight:'700', color:colors.accent },
  summaryLabel: { fontSize:11, color:colors.text2, marginTop:2 },
  chartCard: { backgroundColor:colors.card, borderRadius:radius.lg, padding:16, marginBottom:14, borderWidth:1, borderColor:colors.border },
  chartTitle: { fontSize:14, fontWeight:'700', color:colors.text, marginBottom:14 },
  bars: { flexDirection:'row', alignItems:'flex-end', height:110, gap:4 },
  barCol: { flex:1, alignItems:'center', height:'100%', justifyContent:'flex-end', gap:3 },
  barVal: { fontSize:8, color:colors.text3 },
  barOuter: { width:'100%', height:90, justifyContent:'flex-end' },
  bar: { width:'100%', borderRadius:3 },
  barDay: { fontSize:8, color:colors.text3, textTransform:'uppercase' },
  sectionTitle: { fontSize:16, fontWeight:'700', color:colors.text, marginBottom:10 },
  weightRow: { flexDirection:'row', gap:10, marginBottom:10 },
  weightInput: { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:8, padding:12, fontSize:15, color:colors.text },
  logBtn: { backgroundColor:colors.accent, borderRadius:8, paddingHorizontal:18, alignItems:'center', justifyContent:'center' },
  logBtnText: { color:'#0a0a0f', fontWeight:'700', fontSize:14 },
  emptyText: { color:colors.text2, fontSize:13, textAlign:'center', padding:16 },
  weightEntry: { flexDirection:'row', justifyContent:'space-between', backgroundColor:colors.card, borderRadius:8, padding:12, marginBottom:7, borderWidth:1, borderColor:colors.border },
  weightDate: { fontSize:13, color:colors.text2 },
  weightVal: { fontSize:18, fontWeight:'700', color:colors.text },
  badge: { backgroundColor:colors.card, borderRadius:radius.sm, padding:14, marginBottom:8, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:colors.border },
  badgeDimmed: { opacity:0.4 },
  badgeName: { fontSize:13, fontWeight:'700', color:colors.text },
  badgeDesc: { fontSize:11, color:colors.text2, marginTop:1 },
  badgeDone: { marginLeft:'auto', color:colors.accent, fontSize:16, fontWeight:'700' },
});
