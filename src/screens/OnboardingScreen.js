import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, inputToKg, inputToCm } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { PrimaryButton } from '../components/UI';

const ACTIVITIES = [
  { key: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light',     label: 'Light',     desc: '1–3 days/week' },
  { key: 'moderate',  label: 'Moderate',  desc: '3–5 days/week' },
  { key: 'active',    label: 'Very Active',desc: '6–7 days/week' },
];

const GOALS_LIST = [
  { key: 'lose',    icon: '🔥', label: 'Lose Fat',       desc: 'Caloric deficit, high protein' },
  { key: 'muscle',  icon: '💪', label: 'Build Muscle',   desc: 'Slight surplus, max protein' },
  { key: 'healthy', icon: '🌿', label: 'Stay Healthy',   desc: 'Balanced long-term approach' },
];

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('male');
  const [activity, setActivity] = useState('moderate');
  const [selectedGoals, setSelectedGoals] = useState(['muscle']);
  const [weightUnit, setWeightUnit] = useState('kg');  // kg | lbs
  const [heightUnit, setHeightUnit] = useState('cm');  // cm | in | ft
  const [calcResult, setCalcResult] = useState(null);
  const { calcAndSetGoals, setUnits } = useApp();

  function toggleGoal(key) {
    setSelectedGoals(prev =>
      prev.includes(key) ? prev.filter(g => g !== key) : [...prev, key]
    );
  }

  function handleCalc() {
    if (selectedGoals.length === 0) { alert('Please select at least one goal.'); return; }
    const a = parseInt(age) || 25;
    const wKg = inputToKg(weight || '75', weightUnit);
    const hCm = inputToCm(height || '175', heightUnit);
    let bmr = gender === 'male'
      ? 10 * wKg + 6.25 * hCm - 5 * a + 5
      : 10 * wKg + 6.25 * hCm - 5 * a - 161;
    const actMult = { sedentary:1.2, light:1.375, moderate:1.55, active:1.725 };
    const tdee = bmr * (actMult[activity] || 1.2);
    let calAdj = 0, protMult = 1.8;
    if (selectedGoals.includes('lose'))    { calAdj -= 300; protMult = Math.max(protMult, 2.2); }
    if (selectedGoals.includes('muscle'))  { calAdj += 150; protMult = Math.max(protMult, 2.0); }
    if (selectedGoals.includes('healthy')) { protMult = Math.max(protMult, 1.6); }
    const calories = Math.round(tdee + calAdj);
    const protein  = Math.round(wKg * protMult);
    const fat      = Math.round(calories * 0.25 / 9);
    const carbs    = Math.max(Math.round((calories - protein*4 - fat*9)/4), 80);
    setCalcResult({ calories, protein, carbs, fat });
    setStep(4);
  }

  function handleStart() {
    const wKg = inputToKg(weight || '75', weightUnit);
    const hCm = inputToCm(height || '175', heightUnit);
    setUnits({ weight: weightUnit, height: heightUnit });
    calcAndSetGoals(parseInt(age)||25, wKg, hCm, gender, activity, selectedGoals);
    onComplete();
  }

  const weightPlaceholder = weightUnit === 'kg' ? '75' : '165';
  const heightPlaceholder = heightUnit === 'cm' ? '175' : heightUnit === 'in' ? '69' : '5.9';

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Step 1 — Welcome */}
          {step === 1 && (
            <View style={s.page}>
              <Text style={s.logo}>ProteIN <Text style={s.logoSub}>AI</Text></Text>
              <Text style={s.hero}>🥗</Text>
              <Text style={s.title}>Protein-first nutrition, powered by AI</Text>
              <Text style={s.sub}>Log meals in seconds. Hit your protein goals. Build the body you want.</Text>
              <PrimaryButton title="Get Started →" onPress={() => setStep(2)} style={{ marginTop: 30 }} />
            </View>
          )}

          {/* Step 2 — Body info + units */}
          {step === 2 && (
            <View style={s.page}>
              <Text style={s.logo}>ProteIN <Text style={s.logoSub}>AI</Text></Text>
              <Text style={s.title}>About you</Text>
              <Text style={s.sub}>We'll calculate your exact daily targets.</Text>

              {/* Units row */}
              <View style={s.unitsRow}>
                <View style={s.unitGroup}>
                  <Text style={s.fieldLabel}>Weight unit</Text>
                  <View style={s.unitBtns}>
                    {['kg','lbs'].map(u => (
                      <TouchableOpacity key={u} style={[s.unitBtn, weightUnit===u && s.unitBtnOn]} onPress={()=>setWeightUnit(u)}>
                        <Text style={[s.unitBtnText, weightUnit===u && {color:colors.accent3}]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={s.unitGroup}>
                  <Text style={s.fieldLabel}>Height unit</Text>
                  <View style={s.unitBtns}>
                    {['cm','in','ft'].map(u => (
                      <TouchableOpacity key={u} style={[s.unitBtn, heightUnit===u && s.unitBtnOn]} onPress={()=>setHeightUnit(u)}>
                        <Text style={[s.unitBtnText, heightUnit===u && {color:colors.accent3}]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={s.row}>
                <View style={[s.field, {flex:1, marginRight:8}]}>
                  <Text style={s.fieldLabel}>Age</Text>
                  <TextInput style={s.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={colors.text3} />
                </View>
                <View style={[s.field, {flex:1}]}>
                  <Text style={s.fieldLabel}>Weight ({weightUnit})</Text>
                  <TextInput style={s.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder={weightPlaceholder} placeholderTextColor={colors.text3} />
                </View>
              </View>

              <View style={s.row}>
                <View style={[s.field, {flex:1, marginRight:8}]}>
                  <Text style={s.fieldLabel}>Height ({heightUnit})</Text>
                  <TextInput style={s.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder={heightPlaceholder} placeholderTextColor={colors.text3} />
                </View>
                <View style={[s.field, {flex:1}]}>
                  <Text style={s.fieldLabel}>Gender</Text>
                  <View style={s.genderRow}>
                    {['male','female'].map(g => (
                      <TouchableOpacity key={g} style={[s.genderBtn, gender===g && s.genderBtnOn]} onPress={()=>setGender(g)}>
                        <Text style={[s.genderText, gender===g && {color:colors.accent3}]}>{g==='male'?'♂':'♀'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={s.fieldLabel}>Activity Level</Text>
              {ACTIVITIES.map(a => (
                <TouchableOpacity key={a.key} style={[s.actBtn, activity===a.key && s.actBtnOn]} onPress={()=>setActivity(a.key)}>
                  <Text style={[s.actLabel, activity===a.key && {color:colors.accent3}]}>{a.label}</Text>
                  <Text style={s.actDesc}>{a.desc}</Text>
                </TouchableOpacity>
              ))}

              <PrimaryButton title="Next →" onPress={() => setStep(3)} style={{marginTop:16}} />
            </View>
          )}

          {/* Step 3 — Goals (multi-select) */}
          {step === 3 && (
            <View style={s.page}>
              <Text style={s.logo}>ProteIN <Text style={s.logoSub}>AI</Text></Text>
              <Text style={s.title}>Your goals</Text>
              <Text style={s.sub}>Select all that apply — we'll blend them together.</Text>

              {GOALS_LIST.map(g => {
                const on = selectedGoals.includes(g.key);
                return (
                  <TouchableOpacity key={g.key} style={[s.goalCard, on && s.goalCardOn]} onPress={() => toggleGoal(g.key)} activeOpacity={0.8}>
                    <View style={s.goalLeft}>
                      <Text style={{fontSize:28}}>{g.icon}</Text>
                      <View style={{marginLeft:12}}>
                        <Text style={[s.goalLabel, on && {color:colors.accent}]}>{g.label}</Text>
                        <Text style={s.goalDesc}>{g.desc}</Text>
                      </View>
                    </View>
                    <View style={[s.checkbox, on && s.checkboxOn]}>
                      {on && <Text style={{color:'#0a0a0f', fontWeight:'700', fontSize:14}}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <PrimaryButton title="Calculate My Goals →" onPress={handleCalc} style={{marginTop:20}} />
              <TouchableOpacity style={s.backLink} onPress={() => setStep(2)}>
                <Text style={s.backLinkText}>‹ Back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4 — Results */}
          {step === 4 && calcResult && (
            <View style={s.page}>
              <Text style={s.logo}>ProteIN <Text style={s.logoSub}>AI</Text></Text>
              <Text style={s.title}>Your daily targets</Text>
              <Text style={s.sub}>Tailored to your body and goals.</Text>

              <View style={s.resultCard}>
                {[
                  {label:'Calories', val:`${calcResult.calories.toLocaleString()} kcal`},
                  {label:'Protein',  val:`${calcResult.protein}g`},
                  {label:'Carbs',    val:`${calcResult.carbs}g`},
                  {label:'Fat',      val:`${calcResult.fat}g`},
                ].map(r => (
                  <View key={r.label} style={s.resultRow}>
                    <Text style={s.resultLabel}>{r.label}</Text>
                    <Text style={s.resultVal}>{r.val}</Text>
                  </View>
                ))}
              </View>

              <View style={s.goalChips}>
                {selectedGoals.map(g => {
                  const found = GOALS_LIST.find(gl => gl.key === g);
                  return (
                    <View key={g} style={s.goalChip}>
                      <Text style={s.goalChipText}>{found?.icon} {found?.label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={s.proteinNote}>
                <Text style={s.proteinNoteText}>
                  💡 <Text style={{color:colors.text,fontWeight:'700'}}>Protein is your #1 priority.</Text> Hitting your protein goal daily is the most important lever for every goal you selected.
                </Text>
              </View>

              <PrimaryButton title="Start Tracking 🚀" onPress={handleStart} />
              <TouchableOpacity style={s.backLink} onPress={() => setStep(3)}>
                <Text style={s.backLinkText}>‹ Back</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor: colors.bg },
  scroll: { flexGrow:1 },
  page: { padding:24, paddingTop:50 },
  logo: { fontSize:22, fontWeight:'700', color:colors.accent, marginBottom:30, letterSpacing:-1 },
  logoSub: { color:colors.text2, fontWeight:'400' },
  hero: { fontSize:72, textAlign:'center', marginVertical:30 },
  title: { fontSize:28, fontWeight:'700', color:colors.text, lineHeight:34, marginBottom:8, letterSpacing:-0.5 },
  sub: { fontSize:14, color:colors.text2, lineHeight:22, marginBottom:24 },
  unitsRow: { flexDirection:'row', gap:12, marginBottom:16 },
  unitGroup: { flex:1 },
  unitBtns: { flexDirection:'row', gap:6, marginTop:6 },
  unitBtn: { flex:1, backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:8, paddingVertical:8, alignItems:'center' },
  unitBtnOn: { borderColor:colors.accent3, backgroundColor:'rgba(0,212,255,0.1)' },
  unitBtnText: { fontSize:12, fontWeight:'700', color:colors.text2 },
  row: { flexDirection:'row', marginBottom:12 },
  field: { marginBottom:12 },
  fieldLabel: { fontSize:11, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, color:colors.text2, marginBottom:6 },
  input: { backgroundColor:colors.card, borderWidth:1, borderColor:colors.border, borderRadius:radius.sm, padding:12, fontSize:15, color:colors.text },
  genderRow: { flexDirection:'row', gap:8, marginTop:0 },
  genderBtn: { flex:1, backgroundColor:colors.card, borderWidth:2, borderColor:colors.border, borderRadius:radius.sm, padding:12, alignItems:'center', justifyContent:'center' },
  genderBtnOn: { borderColor:colors.accent3, backgroundColor:'rgba(0,212,255,0.1)' },
  genderText: { color:colors.text, fontSize:18 },
  actBtn: { backgroundColor:colors.card, borderWidth:2, borderColor:colors.border, borderRadius:radius.sm, padding:12, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  actBtnOn: { borderColor:colors.accent3, backgroundColor:'rgba(0,212,255,0.08)' },
  actLabel: { fontSize:14, fontWeight:'700', color:colors.text },
  actDesc: { fontSize:11, color:colors.text2 },
  goalCard: { backgroundColor:colors.card, borderWidth:2, borderColor:colors.border, borderRadius:radius.sm, padding:16, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  goalCardOn: { borderColor:colors.accent, backgroundColor:'rgba(126,255,160,0.06)' },
  goalLeft: { flexDirection:'row', alignItems:'center', flex:1 },
  goalLabel: { fontSize:15, fontWeight:'700', color:colors.text, marginBottom:2 },
  goalDesc: { fontSize:12, color:colors.text2 },
  checkbox: { width:24, height:24, borderRadius:6, borderWidth:2, borderColor:colors.border, alignItems:'center', justifyContent:'center' },
  checkboxOn: { backgroundColor:colors.accent, borderColor:colors.accent },
  resultCard: { backgroundColor:colors.card, borderRadius:radius.lg, padding:18, marginBottom:14, borderWidth:1, borderColor:colors.border },
  resultRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderBottomColor:colors.border },
  resultLabel: { fontSize:14, color:colors.text2 },
  resultVal: { fontSize:20, fontWeight:'700', color:colors.accent },
  goalChips: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 },
  goalChip: { backgroundColor:'rgba(126,255,160,0.15)', borderRadius:20, paddingHorizontal:12, paddingVertical:5, borderWidth:1, borderColor:'rgba(126,255,160,0.3)' },
  goalChipText: { fontSize:12, color:colors.accent, fontWeight:'600' },
  proteinNote: { backgroundColor:'rgba(0,212,255,0.06)', borderRadius:radius.sm, padding:14, marginBottom:16, borderWidth:1, borderColor:'rgba(0,212,255,0.2)' },
  proteinNoteText: { fontSize:13, color:colors.text2, lineHeight:20 },
  backLink: { marginTop:14, alignItems:'center', padding:8 },
  backLinkText: { color:colors.text2, fontSize:14 },
});
