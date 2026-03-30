import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, displayWeight } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader } from '../components/UI';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BarChart({ data, goal, color, label }) {
  const max = Math.max(...data, goal, 1);
  return (
    <View style={s.chartCard}>
      <Text style={s.chartTitle}>{label}</Text>
      <View style={s.bars}>
        {data.map((v, i) => {
          const h = v > 0 ? Math.round((v / max) * 88) : 0;
          return (
            <View key={i} style={s.barCol}>
              <View style={s.barOuter}>
                <View style={[s.bar, { height: h, backgroundColor: v >= goal ? colors.accent : color, minHeight: v > 0 ? 4 : 0 }]} />
              </View>
              <Text style={s.barDay}>{DAYS[i]}</Text>
            </View>
          );
        })}
      </View>
      <View style={s.legend}>
        <View style={[s.legendDot, { backgroundColor: colors.accent }]} />
        <Text style={s.legendTxt}>Goal hit</Text>
        <View style={[s.legendDot, { backgroundColor: color, marginLeft: 12 }]} />
        <Text style={s.legendTxt}>Below goal</Text>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { today, goals, weightLog, logWeight, goals2, units } = useApp();
  const [weightInput, setWeightInput] = useState('');

  // Static historical data + today
  const weekData = {
    protein:  [82, 118, 95, 140, 76, 130, today.protein],
    calories: [1800, 2050, 1950, 2100, 1700, 2200, today.calories],
  };

  const active   = weekData.protein.filter(v => v > 0).length;
  const avgP     = active > 0 ? Math.round(weekData.protein.filter(v => v > 0).reduce((a, b) => a + b, 0) / active) : 0;
  const daysHit  = weekData.protein.filter(v => v >= goals.protein).length;
  const streakDays = active;

  function handleLog() {
    const v = parseFloat(weightInput);
    if (!v || v < 20 || v > 500) return;
    logWeight(v);
    setWeightInput('');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Progress" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Summary row */}
        <View style={s.summary}>
          {[
            { val: `${avgP}g`, label: 'Avg Protein' },
            { val: daysHit,    label: 'Goals Hit' },
            { val: `🔥 ${streakDays}`, label: 'Day Streak' },
          ].map(item => (
            <View key={item.label} style={s.summaryItem}>
              <Text style={s.summaryVal}>{item.val}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Charts */}
        <BarChart data={weekData.protein}  goal={goals.protein}  color="rgba(126,255,160,0.3)" label="Protein this week (g)" />
        <BarChart data={weekData.calories} goal={goals.calories} color="rgba(0,212,255,0.3)"   label="Calories this week" />

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
            <Text style={s.logBtnTxt}>Log</Text>
          </TouchableOpacity>
        </View>

        {weightLog.length === 0 ? (
          <Text style={s.emptyTxt}>No weight logged yet. Start tracking!</Text>
        ) : (
          weightLog.slice(-6).reverse().map((e, i, arr) => {
            const prev = arr[i + 1];
            const diff = prev ? (e.weight - prev.weight).toFixed(1) : null;
            return (
              <View key={i} style={s.weightEntry}>
                <Text style={s.weightDate}>{e.date}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {diff !== null && (
                    <Text style={{ fontSize: 12, fontWeight: '600', color: parseFloat(diff) > 0 ? colors.orange : colors.accent }}>
                      {parseFloat(diff) > 0 ? '+' : ''}{diff} {units?.weight || 'kg'}
                    </Text>
                  )}
                  <Text style={s.weightVal}>{e.weight} {units?.weight || 'kg'}</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Badges */}
        <Text style={[s.sectionTitle, { marginTop: 8 }]}>🏆 Achievements</Text>
        {[
          { icon: '🔥', name: '5-Day Streak',   desc: 'Logged meals 5 days in a row', done: streakDays >= 5 },
          { icon: '💪', name: 'Protein Master',  desc: 'Hit protein goal 3+ days',     done: daysHit >= 3 },
          { icon: '📸', name: 'Snap Pro',         desc: 'Used AI scan to log a meal',   done: true },
          { icon: '⚖️', name: 'Weight Tracker',  desc: 'Logged weight 3+ times',       done: weightLog.length >= 3 },
          { icon: '🥗', name: 'Week Warrior',    desc: 'Logged all 7 days this week',  done: active >= 7 },
        ].map(b => (
          <View key={b.name} style={[s.badge, !b.done && s.badgeDim]}>
            <Text style={{ fontSize: 22, marginRight: 10 }}>{b.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.badgeName}>{b.name}</Text>
              <Text style={s.badgeDesc}>{b.desc}</Text>
            </View>
            {b.done
              ? <Text style={{ color: colors.accent, fontSize: 16, fontWeight: '700' }}>✓</Text>
              : <Text style={{ color: colors.text3, fontSize: 11 }}>Locked</Text>}
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 8 },
  summary: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 22, fontWeight: '700', color: colors.accent },
  summaryLabel: { fontSize: 11, color: colors.text2, marginTop: 2 },
  chartCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 14 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barOuter: { width: '100%', height: 88, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  barDay: { fontSize: 8, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.3 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, color: colors.text2, marginLeft: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 10 },
  weightRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  weightInput: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 15, color: colors.text },
  logBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  logBtnTxt: { color: '#0a0a0f', fontWeight: '700', fontSize: 14 },
  emptyTxt: { color: colors.text2, fontSize: 13, textAlign: 'center', padding: 16 },
  weightEntry: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: 8, padding: 12, marginBottom: 7, borderWidth: 1, borderColor: colors.border },
  weightDate: { fontSize: 13, color: colors.text2 },
  weightVal: { fontSize: 18, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  badgeDim: { opacity: 0.4 },
  badgeName: { fontSize: 13, fontWeight: '700', color: colors.text },
  badgeDesc: { fontSize: 11, color: colors.text2, marginTop: 1 },
});
