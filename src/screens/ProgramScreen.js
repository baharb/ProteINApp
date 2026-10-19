import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, useWindowDimensions, Alert } from 'react-native';
import { Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton, SecondaryButton } from '../components/UI';
import { SERVER_URL, fetchWithTimeout } from '../lib/config';
import { registerForPushNotifications, scheduleProgramReminder } from '../lib/notifications';

const PROGRAM_TYPES = [
  { key:'diet',     icon:'🥗', label:'Diet Program',     desc:'Personalized meal plan for your goal' },
  { key:'exercise', icon:'💪', label:'Exercise Program',  desc:'Workout plan tailored to your body' },
  { key:'both',     icon:'🏆', label:'Full Plan',         desc:'Combined diet + exercise program' },
];

const DURATIONS = [
  { key:'weekly',  label:'1 Week',  desc:'7-day plan' },
  { key:'monthly', label:'1 Month', desc:'30-day plan' },
];

const EXERCISE_TYPES = [
  { key:'gym',         icon:'🏋️', label:'Gym',           desc:'Weight training & machines' },
  { key:'home',        icon:'🏠', label:'Home Workouts',  desc:'No equipment needed' },
  { key:'cardio',      icon:'🏃', label:'Cardio',         desc:'Running, cycling, swimming' },
  { key:'mixed',       icon:'⚡',  label:'Mixed',          desc:'Combination of all types' },
];

function ProgramModal({ program, onClose, onEnableNotif }) {
  const [notifEnabled, setNotifEnabled] = useState(false);

  async function handleEnableNotif() {
    const granted = await registerForPushNotifications();
    if (!granted) { Alert.alert('Permission Denied','Enable notifications in Settings to get daily reminders.'); return; }
    await onEnableNotif(program);
    setNotifEnabled(true);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={pm.overlay}>
        <View style={pm.sheet}>
          <View style={pm.handle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={pm.title}>✅ Your Program is Ready!</Text>
            {!notifEnabled ? (
              <View style={pm.notifCard}>
                <Text style={pm.notifTitle}>🔔 Get Daily Reminders?</Text>
                <Text style={pm.notifDesc}>We'll send you a daily notification with your diet and exercise for the day.</Text>
                <PrimaryButton title="Yes, Remind Me Daily" onPress={handleEnableNotif} style={{marginTop:12}} />
                <TouchableOpacity style={{padding:10,alignItems:'center'}} onPress={() => setNotifEnabled(true)}>
                  <Text style={{color:colors.text2}}>No thanks</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={pm.notifSuccess}>
                <Text style={pm.notifSuccessTxt}>🔔 Daily reminders enabled!</Text>
              </View>
            )}
            <View style={pm.programContent}>
              <Text style={pm.programText}>{program}</Text>
            </View>
            <PrimaryButton title="Close" onPress={onClose} style={{marginTop:16}} />
            <View style={{height:20}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'flex-end'},
  sheet:{backgroundColor:colors.bg2,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'90%'},
  handle:{width:40,height:4,backgroundColor:colors.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  title:{fontSize:20,fontWeight:'700',color:colors.accent,marginBottom:16,textAlign:'center'},
  notifCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:16,borderWidth:1,borderColor:'rgba(126,255,160,0.3)'},
  notifTitle:{fontSize:15,fontWeight:'700',color:colors.text,marginBottom:6},
  notifDesc:{fontSize:13,color:colors.text2,lineHeight:20},
  notifSuccess:{backgroundColor:'rgba(126,255,160,0.1)',borderRadius:radius.sm,padding:12,marginBottom:16,alignItems:'center'},
  notifSuccessTxt:{color:colors.accent,fontWeight:'700',fontSize:14},
  programContent:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,borderWidth:1,borderColor:colors.border},
  programText:{fontSize:13,color:colors.text,lineHeight:22},
});

export default function ProgramScreen() {
  const { profile, goals, goals2, units } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [programType,   setProgramType]   = useState('diet');
  const [duration,      setDuration]      = useState('weekly');
  const [exerciseType,  setExerciseType]  = useState('gym');
  const [loading,       setLoading]       = useState(false);
  const [program,       setProgram]       = useState(null);
  const [showModal,     setShowModal]     = useState(false);

  async function generateProgram() {
    if (!profile) { Alert.alert('Complete your profile first','Go to Profile and complete your info to get a personalized program.'); return; }
    setLoading(true);
    try {
      const wu = units?.weight || 'kg';
      const weightDisplay = wu==='lbs' ? `${(profile.weight_kg*2.20462).toFixed(1)} lbs` : `${profile.weight_kg?.toFixed(1)} kg`;
      const goalLabel = (goals2||[]).map(g=>({lose:'Lose Fat',muscle:'Build Muscle',healthy:'Stay Healthy'}[g])).filter(Boolean).join(' + ') || 'General Health';

      let prompt = '';
      if (programType==='diet'||programType==='both') {
        prompt += `Create a detailed ${duration} diet program for:
- Goal: ${goalLabel}
- Weight: ${weightDisplay}, Height: ${profile.height_cm}cm, Age: ${profile.age}, Gender: ${profile.gender}
- Activity: ${profile.activity}
- Daily protein target: ${goals.protein}g, Calories: ${goals.calories} kcal
- Format: Day by day meal plan with breakfast, lunch, dinner, snacks
- Include specific foods, portions in grams, and macro breakdown per meal
`;
      }
      if (programType==='exercise'||programType==='both') {
        prompt += `\nCreate a detailed ${duration} exercise program for:
- Goal: ${goalLabel}
- Weight: ${weightDisplay}, Height: ${profile.height_cm}cm, Age: ${profile.age}
- Exercise type: ${exerciseType}
- Format: Day by day workout plan with exercises, sets, reps, rest times
- Adjust intensity based on goal (${goalLabel})
- Include warm-up and cool-down
`;
      }

      const res = await fetchWithTimeout(`${SERVER_URL}/chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          messages:[{ role:'user', content: prompt + '\n\nFormat clearly with headers for each day. Be specific and practical.' }],
          profile: { goals:goals2, goalCalories:goals.calories, goalProtein:goals.protein },
        }),
      });
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(data.error||'Failed to generate program');
      setProgram(data.reply);
      setShowModal(true);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnableNotif(programText) {
    await scheduleProgramReminder(programText);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="My Program" subtitle="AI-generated diet & exercise plans" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]}>

        <Text style={s.sectionTitle}>What program do you need?</Text>
        {PROGRAM_TYPES.map(pt => (
          <TouchableOpacity key={pt.key} style={[s.optCard, programType===pt.key&&s.optCardOn]} onPress={() => setProgramType(pt.key)} activeOpacity={0.8}>
            <Text style={{fontSize:28,marginRight:12}}>{pt.icon}</Text>
            <View style={{flex:1}}>
              <Text style={[s.optLabel, programType===pt.key&&{color:colors.accent}]}>{pt.label}</Text>
              <Text style={s.optDesc}>{pt.desc}</Text>
            </View>
            {programType===pt.key && <Text style={{color:colors.accent,fontSize:18}}>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={s.sectionTitle}>Duration</Text>
        <View style={{flexDirection:'row',gap:10}}>
          {DURATIONS.map(d => (
            <TouchableOpacity key={d.key} style={[s.durationBtn, duration===d.key&&s.durationBtnOn]} onPress={() => setDuration(d.key)}>
              <Text style={[s.durationLabel, duration===d.key&&{color:colors.accent}]}>{d.label}</Text>
              <Text style={s.durationDesc}>{d.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(programType==='exercise'||programType==='both') && (
          <>
            <Text style={s.sectionTitle}>Exercise Type</Text>
            {EXERCISE_TYPES.map(et => (
              <TouchableOpacity key={et.key} style={[s.optCard, exerciseType===et.key&&s.optCardOn]} onPress={() => setExerciseType(et.key)} activeOpacity={0.8}>
                <Text style={{fontSize:24,marginRight:12}}>{et.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={[s.optLabel, exerciseType===et.key&&{color:colors.accent}]}>{et.label}</Text>
                  <Text style={s.optDesc}>{et.desc}</Text>
                </View>
                {exerciseType===et.key && <Text style={{color:colors.accent,fontSize:18}}>✓</Text>}
              </TouchableOpacity>
            ))}
          </>
        )}

        {profile && (
          <View style={s.profileSummary}>
            <Text style={s.profileSummaryTitle}>Your profile</Text>
            <Text style={s.profileSummaryTxt}>
              {(goals2||[]).map(g=>({lose:'Lose Fat 🔥',muscle:'Build Muscle 💪',healthy:'Stay Healthy 🌿'}[g])).filter(Boolean).join(' · ')}
              {'\n'}{profile.weight_kg?.toFixed(1)}kg · {profile.height_cm}cm · Age {profile.age}
              {'\n'}Target: {goals.protein}g protein · {goals.calories} kcal/day
            </Text>
          </View>
        )}

        {!profile && (
          <View style={s.noProfileCard}>
            <Text style={s.noProfileTxt}>⚠️ Complete your profile first to get a personalized program.</Text>
          </View>
        )}

        <PrimaryButton
          title={loading ? 'Generating…' : `Generate My ${duration==='weekly'?'Weekly':'Monthly'} Program`}
          onPress={generateProgram}
          disabled={loading}
          style={{marginTop:8}}
        />
        {loading && (
          <View style={s.loadingCard}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={s.loadingTxt}>AI is creating your personalized program…</Text>
            <Text style={s.loadingSub}>This may take 15-30 seconds</Text>
          </View>
        )}

        <View style={{height:30}} />
      </ScrollView>

      {showModal && program && (
        <ProgramModal
          program={program}
          onClose={() => setShowModal(false)}
          onEnableNotif={handleEnableNotif}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  scroll:{padding:18,paddingTop:8},
  scrollL:{paddingHorizontal:40},
  sectionTitle:{fontSize:16,fontWeight:'700',color:colors.text,marginBottom:10,marginTop:8},
  optCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:10,flexDirection:'row',alignItems:'center',borderWidth:2,borderColor:colors.border},
  optCardOn:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.06)'},
  optLabel:{fontSize:14,fontWeight:'700',color:colors.text,marginBottom:2},
  optDesc:{fontSize:12,color:colors.text2},
  durationBtn:{flex:1,backgroundColor:colors.card,borderRadius:radius.lg,padding:14,alignItems:'center',borderWidth:2,borderColor:colors.border},
  durationBtnOn:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.06)'},
  durationLabel:{fontSize:15,fontWeight:'700',color:colors.text,marginBottom:2},
  durationDesc:{fontSize:11,color:colors.text2},
  profileSummary:{backgroundColor:'rgba(126,255,160,0.07)',borderRadius:radius.lg,padding:14,marginTop:8,borderWidth:1,borderColor:'rgba(126,255,160,0.2)'},
  profileSummaryTitle:{fontSize:12,fontWeight:'700',color:colors.accent,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6},
  profileSummaryTxt:{fontSize:13,color:colors.text2,lineHeight:22},
  noProfileCard:{backgroundColor:'rgba(255,140,66,0.08)',borderRadius:radius.lg,padding:14,marginTop:8,borderWidth:1,borderColor:'rgba(255,140,66,0.3)'},
  noProfileTxt:{fontSize:13,color:colors.orange,lineHeight:20},
  loadingCard:{backgroundColor:colors.card,borderRadius:radius.lg,padding:24,marginTop:16,alignItems:'center',borderWidth:1,borderColor:colors.border},
  loadingTxt:{fontSize:14,fontWeight:'600',color:colors.text,marginTop:12,marginBottom:4},
  loadingSub:{fontSize:12,color:colors.text2},
});
