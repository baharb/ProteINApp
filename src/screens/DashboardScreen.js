import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, TIPS } from '../data/constants';
import { useApp } from '../hooks/useApp';
import {
  MacroBar, ProteinStatusCard, HealthScoreRing, TipCard, SectionTitle,
} from '../components/UI';

const TIP = TIPS[Math.floor(Math.random() * TIPS.length)];

const MEAL_SLOTS = [
  { name: 'Breakfast', icon: '🌅', slot: 0 },
  { name: 'Lunch', icon: '☀️', slot: 1 },
  { name: 'Dinner', icon: '🌙', slot: 2 },
  { name: 'Snacks', icon: '🍎', slot: 3 },
];

export default function DashboardScreen({ navigation }) {
  const { today, goals } = useApp();

  const pPct = goals.protein > 0 ? Math.min(100, Math.round((today.protein / goals.protein) * 100)) : 0;
  const cPct = goals.calories > 0 ? Math.min(100, Math.round((today.calories / goals.calories) * 100)) : 0;
  const mealPct = Math.min(100, Math.round((today.meals.length / 3) * 100));
  const score = Math.round(pPct * 0.5 + cPct * 0.3 + mealPct * 0.2);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function getMealsForSlot(slot) {
    return today.meals.filter(m => m.slot === slot);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Greeting */}
        <View style={styles.greet}>
          <Text style={styles.greetName}>{greeting}! 👋</Text>
          <Text style={styles.greetDate}>{dateStr}</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 5 day streak</Text>
          </View>
        </View>

        {/* Health Score */}
        <HealthScoreRing score={score} onPress={() => navigation.navigate('Coach')} />

        {/* Macro Grid */}
        <View style={styles.macroGrid}>
          <MacroBar label="Protein" icon="💪" value={today.protein} target={goals.protein} color={colors.accent} />
          <MacroBar label="Calories" icon="🔥" value={today.calories} target={goals.calories} unit="" color={colors.orange} />
        </View>
        <View style={styles.macroGrid}>
          <MacroBar label="Carbs" icon="🌾" value={today.carbs} target={goals.carbs} color={colors.accent3} />
          <MacroBar label="Fat" icon="🥑" value={today.fat} target={goals.fat} color={colors.pink} />
        </View>

        {/* Protein Status */}
        <ProteinStatusCard today={today} goals={goals} />

        {/* Scan CTA */}
        <TouchableOpacity style={styles.scanCta} onPress={() => navigation.navigate('ScanTab')} activeOpacity={0.9}>
          <View>
            <Text style={styles.scanCtaTitle}>📷 Scan a Meal</Text>
            <Text style={styles.scanCtaSub}>Log food in under 3 seconds</Text>
          </View>
          <Text style={{ fontSize: 28 }}>→</Text>
        </TouchableOpacity>

        {/* Today's Meals */}
        <SectionTitle title="Today's Meals" action="+ Add" onAction={() => navigation.navigate('AddTab')} />
        {MEAL_SLOTS.map(slot => {
          const meals = getMealsForSlot(slot.slot);
          if (meals.length === 0) {
            return (
              <TouchableOpacity key={slot.name} style={styles.mealSlot} onPress={() => navigation.navigate('AddTab')} activeOpacity={0.8}>
                <View style={styles.mealSlotLeft}>
                  <View style={styles.mealIcon}><Text style={{ fontSize: 16 }}>{slot.icon}</Text></View>
                  <View>
                    <Text style={styles.mealName}>{slot.name}</Text>
                    <Text style={styles.mealInfo}>No meals logged</Text>
                  </View>
                </View>
                <Text style={styles.mealAdd}>+</Text>
              </TouchableOpacity>
            );
          }
          return meals.map((m, i) => (
            <View key={`${slot.name}-${i}`} style={styles.mealSlot}>
              <View style={styles.mealSlotLeft}>
                <View style={styles.mealIcon}><Text style={{ fontSize: 16 }}>{slot.icon}</Text></View>
                <View>
                  <Text style={styles.mealName}>{m.name}</Text>
                  <Text style={styles.mealInfo}>{m.p}g protein · {m.c}g carbs · {m.f}g fat</Text>
                </View>
              </View>
              <Text style={styles.mealCals}>{m.cal}</Text>
            </View>
          ));
        })}

        {/* Tip */}
        <TipCard tip={TIP} />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 18, paddingTop: 10 },
  greet: { marginBottom: 18 },
  greetName: { fontSize: 24, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  greetDate: { fontSize: 13, color: colors.text2, marginTop: 2 },
  streakBadge: { marginTop: 8, flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: 'rgba(255,140,66,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,140,66,0.3)' },
  streakText: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  macroGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  scanCta: { backgroundColor: 'rgba(126,255,160,0.08)', borderRadius: radius.lg, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderWidth: 1, borderColor: 'rgba(126,255,160,0.25)' },
  scanCtaTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 3 },
  scanCtaSub: { fontSize: 13, color: colors.text2 },
  mealSlot: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  mealSlotLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mealIcon: { width: 36, height: 36, borderRadius: 9, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  mealName: { fontSize: 13, fontWeight: '600', color: colors.text },
  mealInfo: { fontSize: 11, color: colors.text2, marginTop: 2 },
  mealAdd: { fontSize: 22, color: colors.text3 },
  mealCals: { fontSize: 15, fontWeight: '700', color: colors.orange },
});
