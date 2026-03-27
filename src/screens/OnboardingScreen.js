import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

const ACTIVITIES = [
  { key: 'sedentary', label: '🪑 Sedentary' },
  { key: 'light', label: '🚶 Light' },
  { key: 'moderate', label: '🏃 Moderate' },
  { key: 'active', label: '⚡ Very Active' },
];

const GOALS = [
  { key: 'lose', icon: '🔥', label: 'Lose Fat', desc: 'Caloric deficit with high protein to preserve muscle' },
  { key: 'muscle', icon: '💪', label: 'Build Muscle', desc: 'Slight surplus, maximizing protein synthesis' },
  { key: 'healthy', icon: '🌿', label: 'Stay Healthy', desc: 'Balanced macros for long-term wellbeing' },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('sedentary');
  const [goal, setGoal] = useState('muscle');
  const [calcGoals, setCalcGoals] = useState(null);
  const { calcAndSetGoals, loadDemo } = useApp();

  function handleCalc() {
    const a = parseInt(age) || 25;
    const w = parseInt(weight) || 75;
    const h = parseInt(height) || 175;
    let bmr = gender === 'male'
      ? 10 * w + 6.25 * h - 5 * a + 5
      : 10 * w + 6.25 * h - 5 * a - 161;
    const actMult = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
    const tdee = bmr * (actMult[activity] || 1.2);
    const goalAdj = { lose: -400, muscle: 200, healthy: 0 };
    const calories = Math.round(tdee + goalAdj[goal]);
    const proteinMult = { lose: 2.2, muscle: 2.0, healthy: 1.6 };
    const protein = Math.round(w * proteinMult[goal]);
    const fat = Math.round(calories * 0.25 / 9);
    const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 100);
    setCalcGoals({ calories, protein, carbs, fat });
    setStep(4);
  }

  function handleStart() {
    calcAndSetGoals(
      parseInt(age) || 25,
      parseInt(weight) || 75,
      parseInt(height) || 175,
      gender, activity, goal
    );
    onComplete();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* STEP 1: Welcome */}
          {step === 1 && (
            <View style={styles.page}>
              <Text style={styles.logo}>ProteIN <Text style={styles.logoSub}>AI</Text></Text>
              <Text style={styles.title}>Protein-first nutrition, powered by AI</Text>
              <Text style={styles.sub}>Log food in 3 seconds with your camera. Hit your protein goals. Build the body you want — without complexity.</Text>
              <View style={styles.heroEmoji}><Text style={{ fontSize: 80 }}>🥗</Text></View>
              <TouchableOpacity style={styles.obtn} onPress={() => setStep(2)}>
                <Text style={styles.obtnText}>Get Started →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoBtn} onPress={() => { loadDemo(); onComplete(); }}>
                <Text style={styles.demoBtnText}>Try Demo Mode</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: Profile info */}
          {step === 2 && (
            <View style={styles.page}>
              <Text style={styles.logo}>ProteIN <Text style={styles.logoSub}>AI</Text></Text>
              <Text style={styles.title}>Tell us about you</Text>
              <Text style={styles.sub}>We'll calculate your exact daily targets.</Text>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Age</Text>
                  <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={colors.text3} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Weight (kg)</Text>
                  <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="75" placeholderTextColor={colors.text3} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.fieldLabel}>Height (cm)</Text>
                  <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="175" placeholderTextColor={colors.text3} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.genderRow}>
                    {['male', 'female'].map(g => (
                      <TouchableOpacity key={g} style={[styles.genderBtn, gender === g && styles.genderBtnOn]} onPress={() => setGender(g)}>
                        <Text style={[styles.genderText, gender === g && { color: colors.accent3 }]}>{g === 'male' ? '♂ Male' : '♀ Female'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Activity Level</Text>
                <View style={styles.actGrid}>
                  {ACTIVITIES.map(a => (
                    <TouchableOpacity key={a.key} style={[styles.actBtn, activity === a.key && styles.actBtnOn]} onPress={() => setActivity(a.key)}>
                      <Text style={[styles.actText, activity === a.key && { color: colors.accent3 }]}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.obtn} onPress={() => setStep(3)}>
                <Text style={styles.obtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: Goal */}
          {step === 3 && (
            <View style={styles.page}>
              <Text style={styles.logo}>ProteIN <Text style={styles.logoSub}>AI</Text></Text>
              <Text style={styles.title}>What's your goal?</Text>
              <Text style={styles.sub}>We'll customize your nutrition plan and protein targets.</Text>

              {GOALS.map(g => (
                <TouchableOpacity key={g.key} style={[styles.goalBtn, goal === g.key && styles.goalBtnOn]} onPress={() => setGoal(g.key)}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{g.icon}</Text>
                  <Text style={styles.goalLabel}>{g.label}</Text>
                  <Text style={styles.goalDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={[styles.obtn, { marginTop: 20 }]} onPress={handleCalc}>
                <Text style={styles.obtnText}>Calculate My Goals →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: Results */}
          {step === 4 && calcGoals && (
            <View style={styles.page}>
              <Text style={styles.logo}>ProteIN <Text style={styles.logoSub}>AI</Text></Text>
              <Text style={styles.title}>Your daily targets</Text>
              <Text style={styles.sub}>AI-calculated based on your body and goals.</Text>

              <View style={styles.rcard}>
                <Text style={styles.rcardTitle}>Daily Nutrition Goals</Text>
                {[
                  { label: 'Calories', val: calcGoals.calories.toLocaleString(), unit: 'kcal' },
                  { label: 'Protein', val: calcGoals.protein, unit: 'g' },
                  { label: 'Carbs', val: calcGoals.carbs, unit: 'g' },
                  { label: 'Fat', val: calcGoals.fat, unit: 'g' },
                ].map(r => (
                  <View key={r.label} style={styles.rrow}>
                    <Text style={styles.rlabel}>{r.label}</Text>
                    <Text style={styles.rval}>{r.val} <Text style={styles.runit}>{r.unit}</Text></Text>
                  </View>
                ))}
              </View>

              <View style={styles.proteinNote}>
                <Text style={styles.proteinNoteText}>
                  💡 <Text style={{ color: colors.text, fontWeight: '700' }}>Protein is your #1 priority.</Text> Hitting your protein goal ensures muscle retention and growth.
                </Text>
              </View>

              <TouchableOpacity style={styles.obtn} onPress={handleStart}>
                <Text style={styles.obtnText}>Start Tracking →</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  page: { padding: 24, paddingTop: 50, flex: 1, minHeight: 700 },
  logo: { fontSize: 24, fontWeight: '700', color: colors.accent, letterSpacing: -1, marginBottom: 40 },
  logoSub: { color: colors.text2, fontWeight: '400' },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, lineHeight: 36, marginBottom: 10, letterSpacing: -0.5 },
  sub: { color: colors.text2, fontSize: 14, lineHeight: 22, marginBottom: 30 },
  heroEmoji: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  obtn: { backgroundColor: colors.accent, borderRadius: radius.sm, padding: 15, alignItems: 'center', marginTop: 10 },
  obtnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 16 },
  demoBtn: { marginTop: 12, padding: 12, alignItems: 'center' },
  demoBtnText: { color: colors.text2, fontSize: 14 },
  row: { flexDirection: 'row', marginBottom: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, marginBottom: 7 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 13, fontSize: 15, color: colors.text },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, padding: 11, alignItems: 'center' },
  genderBtnOn: { borderColor: colors.accent3, backgroundColor: 'rgba(0,212,255,0.08)' },
  genderText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  actGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actBtn: { width: '48%', backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, padding: 12, alignItems: 'center' },
  actBtnOn: { borderColor: colors.accent3, backgroundColor: 'rgba(0,212,255,0.08)' },
  actText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  goalBtn: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: radius.sm, padding: 16, marginBottom: 10 },
  goalBtnOn: { borderColor: colors.accent, backgroundColor: 'rgba(126,255,160,0.08)' },
  goalLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  goalDesc: { fontSize: 12, color: colors.text2 },
  rcard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  rcardTitle: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, marginBottom: 14 },
  rrow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
  rlabel: { fontSize: 13, color: colors.text2 },
  rval: { fontSize: 20, fontWeight: '700', color: colors.accent },
  runit: { fontSize: 13, color: colors.text2, fontWeight: '400' },
  proteinNote: { backgroundColor: colors.card, borderRadius: radius.sm, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  proteinNoteText: { fontSize: 13, color: colors.text2, lineHeight: 20 },
});
