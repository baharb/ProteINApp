import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function BarChart({ data, goal, color, label }) {
  const max = Math.max(...data, goal, 1);
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{label} (this week)</Text>
      <View style={styles.chartArea}>
        {data.map((v, i) => {
          const hPct = v > 0 ? (v / max) : 0;
          const isGoal = v >= goal;
          return (
            <View key={i} style={styles.barWrap}>
              <View style={styles.barOuter}>
                <View style={[
                  styles.bar,
                  {
                    height: `${Math.round(hPct * 100)}%`,
                    backgroundColor: isGoal ? colors.accent : color,
                    minHeight: v > 0 ? 4 : 0,
                  }
                ]} />
              </View>
              <Text style={styles.barDay}>{DAYS[i]}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { today, goals, weightLog, logWeight, goal, weekData } = useApp();
  const [weightInput, setWeightInput] = useState('');

  const pd = [...weekData.protein]; pd[6] = today.protein;
  const cd = [...weekData.calories]; cd[6] = today.calories;

  const activeDays = pd.filter(v => v > 0).length;
  const avgProtein = activeDays > 0 ? Math.round(pd.filter(v => v > 0).reduce((a, b) => a + b, 0) / activeDays) : 0;
  const activeCal = cd.filter(v => v > 0).length;
  const avgCal = activeCal > 0 ? Math.round(cd.filter(v => v > 0).reduce((a, b) => a + b, 0) / activeCal) : 0;
  const daysHit = pd.filter(v => v >= goals.protein).length;

  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekStr = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  function handleLogWeight() {
    const val = parseFloat(weightInput);
    if (!val || val < 20 || val > 300) return;
    logWeight(val);
    setWeightInput('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Your fitness journey</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Weekly Report */}
        <View style={styles.weekCard}>
          <View style={styles.weekHead}>
            <View>
              <Text style={styles.weekTitle}>Weekly Report</Text>
              <Text style={styles.weekPeriod}>{weekStr}</Text>
            </View>
            <View style={styles.weekBadge}>
              <Text style={styles.weekBadgeText}>{daysHit}/7 Goals Hit</Text>
            </View>
          </View>
          <View style={styles.weekStats}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{avgProtein}g</Text>
              <Text style={styles.weekStatLabel}>Avg Protein</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{avgCal.toLocaleString()}</Text>
              <Text style={styles.weekStatLabel}>Avg Calories</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatVal}>{activeDays}</Text>
              <Text style={styles.weekStatLabel}>Days Logged</Text>
            </View>
          </View>
        </View>

        {/* Charts */}
        <BarChart data={pd} goal={goals.protein} color="rgba(126,255,160,0.4)" label="Protein (g)" />
        <BarChart data={cd} goal={goals.calories} color="rgba(0,212,255,0.4)" label="Calories" />

        {/* Weight Log */}
        <View style={styles.weightCard}>
          <Text style={styles.sectionTitle}>⚖️ Weight Log</Text>
          <View style={styles.weightRow}>
            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder="Enter weight (kg)"
              placeholderTextColor={colors.text3}
              returnKeyType="done"
              onSubmitEditing={handleLogWeight}
            />
            <TouchableOpacity style={styles.weightBtn} onPress={handleLogWeight}>
              <Text style={styles.weightBtnText}>Log</Text>
            </TouchableOpacity>
          </View>
          {weightLog.length === 0 ? (
            <Text style={{ color: colors.text2, fontSize: 13, textAlign: 'center', padding: 16 }}>No weight logged yet</Text>
          ) : (
            weightLog.slice(-5).reverse().map((e, i, arr) => {
              const prev = arr[i + 1];
              const diff = prev ? (e.weight - prev.weight).toFixed(1) : null;
              return (
                <View key={i} style={styles.weightEntry}>
                  <Text style={styles.weightDate}>{e.date}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {diff !== null && (
                      <Text style={[styles.weightDiff, { color: parseFloat(diff) > 0 ? colors.orange : colors.accent }]}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff} kg
                      </Text>
                    )}
                    <Text style={styles.weightVal}>{e.weight} kg</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Streaks */}
        <View style={styles.streaksCard}>
          <Text style={styles.sectionTitle}>🏆 Streaks & Achievements</Text>
          <View style={styles.streakGrid}>
            <View style={styles.streakItem}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>🔥</Text>
              <Text style={styles.streakVal}>5</Text>
              <Text style={styles.streakLabel}>Days Logged</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>💪</Text>
              <Text style={styles.streakVal}>{daysHit}</Text>
              <Text style={styles.streakLabel}>Protein Goals</Text>
            </View>
          </View>

          <Text style={styles.badgesTitle}>Earned Badges</Text>
          <View style={styles.badgesWrap}>
            {[
              { icon: '🏆', name: 'Protein Master', desc: 'Hit protein 3x' },
              { icon: '⚡', name: '5-Day Streak', desc: 'Log 5 days straight' },
              { icon: '📸', name: 'Snap Pro', desc: '10 meal scans' },
            ].map(b => (
              <View key={b.name} style={styles.badge}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{b.icon}</Text>
                <View>
                  <Text style={styles.badgeName}>{b.name}</Text>
                  <Text style={styles.badgeDesc}>{b.desc}</Text>
                </View>
              </View>
            ))}
          </View>
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
  weekCard: { backgroundColor: 'rgba(126,255,160,0.06)', borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(126,255,160,0.2)' },
  weekHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  weekTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  weekPeriod: { fontSize: 12, color: colors.text2, marginTop: 2 },
  weekBadge: { backgroundColor: 'rgba(126,255,160,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(126,255,160,0.3)' },
  weekBadgeText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  weekStats: { flexDirection: 'row' },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatVal: { fontSize: 22, fontWeight: '700', color: colors.accent },
  weekStatLabel: { fontSize: 11, color: colors.text2, marginTop: 2 },
  chartCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  chartTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 },
  chartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 6 },
  barWrap: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barOuter: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  barDay: { fontSize: 9, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  weightCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 14 },
  weightRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  weightInput: { flex: 1, backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 11, fontSize: 15, color: colors.text },
  weightBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  weightBtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 14 },
  weightEntry: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg3, borderRadius: 8, padding: 11, marginBottom: 7 },
  weightDate: { fontSize: 13, color: colors.text2 },
  weightDiff: { fontSize: 12, fontWeight: '600' },
  weightVal: { fontSize: 18, fontWeight: '700', color: colors.text },
  streaksCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  streakGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  streakItem: { flex: 1, backgroundColor: colors.card2, borderRadius: radius.sm, padding: 14, alignItems: 'center' },
  streakVal: { fontSize: 24, fontWeight: '700', color: colors.orange },
  streakLabel: { fontSize: 11, color: colors.text2, marginTop: 2 },
  badgesTitle: { fontSize: 12, fontWeight: '600', color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  badgesWrap: { gap: 8 },
  badge: { backgroundColor: colors.card2, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center' },
  badgeName: { fontSize: 13, fontWeight: '600', color: colors.text },
  badgeDesc: { fontSize: 11, color: colors.text2, marginTop: 1 },
});
