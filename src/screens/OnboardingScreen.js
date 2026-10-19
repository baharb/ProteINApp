import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, useWindowDimensions, Alert } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { C, R } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';

function StepDots({ current, total }) {
  return (
    <View style={{flexDirection:'row',gap:6,justifyContent:'center',marginBottom:24}}>
      {Array.from({length:total}).map((_,i)=>(
        <View key={i} style={[sd.dot, i===current&&sd.dotActive]} />
      ))}
    </View>
  );
}
const sd = StyleSheet.create({
  dot:{width:8,height:8,borderRadius:4,backgroundColor:C.border},
  dotActive:{width:24,backgroundColor:C.primary},
});

export default function OnboardingScreen() {
  const { calcAndSetGoals, session } = useApp();
  const { t, back } = useLang();
  const { width } = useWindowDimensions();
  const [step,     setStep]     = useState(0);
  const [goal,     setGoal]     = useState('muscle');
  const [gender,   setGender]   = useState('male');
  const [age,      setAge]      = useState('');
  const [weight,   setWeight]   = useState('');
  const [height,   setHeight]   = useState('');
  const [activity, setActivity] = useState('moderate');
  const [loading,  setLoading]  = useState(false);

  const GOALS = [
    { k:'muscle',  icon:'💪', label:t('buildMuscle'), sub:t('goalMuscleSub') },
    { k:'lose',    icon:'🔥', label:t('loseFat'),     sub:t('goalLoseSub') },
    { k:'healthy', icon:'🌿', label:t('stayHealthy'), sub:t('goalHealthySub') },
  ];

  const ACTIVITIES = [
    { k:'sedentary', label:t('act_sedentary'), sub:t('act_sedentary_d') },
    { k:'light',     label:t('act_light'),     sub:t('act_light_d') },
    { k:'moderate',  label:t('act_moderate'),  sub:t('act_moderate_d') },
    { k:'active',    label:t('act_active'),    sub:t('act_active_d') },
  ];

  async function finish() {
    const a = parseInt(age, 10), w = parseFloat(weight), h = parseFloat(height);
    if (!(a >= 13 && a <= 100))  { setStep(1); Alert.alert(t('errAge'), t('errAgeSub')); return; }
    if (!(w >= 25 && w <= 300))  { setStep(2); Alert.alert(t('errWeight'), t('errWeightSub')); return; }
    if (!(h >= 100 && h <= 250)) { setStep(2); Alert.alert(t('errHeight'), t('errHeightSub')); return; }
    setLoading(true);
    try {
      await calcAndSetGoals(
        a, w, h,
        gender, activity, [goal], 'kg', 'cm'
      );
    } catch(e) { Alert.alert('⚠️', e.message); }
    finally { setLoading(false); }
  }

  const steps = [
    // Step 0 — Goal
    <View style={ob.stepWrap} key="goal">
      <Text style={ob.stepEmoji}>🎯</Text>
      <Text style={ob.stepTitle}>{t('obGoalTitle')}</Text>
      <Text style={ob.stepSub}>{t('obGoalSub')}</Text>
      {GOALS.map(g=>(
        <TouchableOpacity key={g.k} style={[ob.optCard,goal===g.k&&ob.optCardOn]}
          onPress={()=>setGoal(g.k)} activeOpacity={0.85}>
          <Text style={{fontSize:28,marginRight:14}}>{g.icon}</Text>
          <View style={{flex:1}}>
            <Text style={[ob.optLabel,goal===g.k&&{color:C.primary}]}>{g.label}</Text>
            <Text style={ob.optSub}>{g.sub}</Text>
          </View>
          {goal===g.k&&<View style={ob.check}><Text style={{color:'#07111F',fontSize:12,fontWeight:'800'}}>✓</Text></View>}
        </TouchableOpacity>
      ))}
    </View>,

    // Step 1 — Gender + Age
    <View style={ob.stepWrap} key="body1">
      <Text style={ob.stepEmoji}>👤</Text>
      <Text style={ob.stepTitle}>{t('obAboutTitle')}</Text>
      <Text style={ob.stepSub}>{t('obAboutSub')}</Text>
      <Text style={ob.fieldLabel}>{t('gender')}</Text>
      <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
        {[['male',`♂ ${t('male')}`],['female',`♀ ${t('female')}`]].map(([k,l])=>(
          <TouchableOpacity key={k} style={[ob.genderBtn,gender===k&&ob.genderBtnOn]} onPress={()=>setGender(k)}>
            <Text style={[ob.genderTxt,gender===k&&{color:C.primary}]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={ob.fieldLabel}>{t('age')}</Text>
      <TextInput style={ob.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder={t('agePh')} placeholderTextColor={C.text3} />
    </View>,

    // Step 2 — Weight + Height
    <View style={ob.stepWrap} key="body2">
      <Text style={ob.stepEmoji}>⚖️</Text>
      <Text style={ob.stepTitle}>{t('obMeasTitle')}</Text>
      <Text style={ob.stepSub}>{t('obMeasSub')}</Text>
      <Text style={ob.fieldLabel}>{t('weightKg')}</Text>
      <TextInput style={ob.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 75" placeholderTextColor={C.text3} />
      <Text style={ob.fieldLabel}>{t('heightCm')}</Text>
      <TextInput style={ob.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="e.g. 175" placeholderTextColor={C.text3} />
    </View>,

    // Step 3 — Activity
    <View style={ob.stepWrap} key="activity">
      <Text style={ob.stepEmoji}>🏃</Text>
      <Text style={ob.stepTitle}>{t('obActTitle')}</Text>
      <Text style={ob.stepSub}>{t('obActSub')}</Text>
      {ACTIVITIES.map(a=>(
        <TouchableOpacity key={a.k} style={[ob.actCard,activity===a.k&&ob.actCardOn]}
          onPress={()=>setActivity(a.k)} activeOpacity={0.85}>
          <View style={{flex:1}}>
            <Text style={[ob.actLabel,activity===a.k&&{color:C.primary}]}>{a.label}</Text>
            <Text style={ob.actSub}>{a.sub}</Text>
          </View>
          {activity===a.k&&<View style={ob.check}><Text style={{color:'#07111F',fontSize:12,fontWeight:'800'}}>✓</Text></View>}
        </TouchableOpacity>
      ))}
    </View>,
  ];

  const isLast = step === steps.length - 1;

  return (
    <SafeAreaView style={ob.safe}>
      <View style={ob.header}>
        <Text style={ob.logo}>ProteIN</Text>
        {step > 0 && (
          <TouchableOpacity onPress={()=>setStep(s=>s-1)}>
            <Text style={{color:C.text2,fontSize:14}}>{back} {t('back')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={ob.scroll} keyboardShouldPersistTaps="handled">
        <StepDots current={step} total={steps.length} />
        {steps[step]}
      </ScrollView>
      <View style={ob.footer}>
        <TouchableOpacity
          style={[ob.nextBtn, loading&&{opacity:0.6}]}
          onPress={isLast ? finish : ()=>setStep(s=>s+1)}
          disabled={loading} activeOpacity={0.9}>
          <Text style={ob.nextTxt}>{loading ? t('settingUp') : isLast ? t('getStarted') : t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const ob = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:20,paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border},
  logo:{fontSize:18,fontWeight:'900',color:C.primary},
  scroll:{flexGrow:1,padding:20},
  stepWrap:{flex:1},
  stepEmoji:{fontSize:48,textAlign:'center',marginBottom:16},
  stepTitle:{fontSize:24,fontWeight:'800',color:C.text,textAlign:'center',marginBottom:8},
  stepSub:{fontSize:14,color:C.text2,textAlign:'center',marginBottom:24,lineHeight:21},
  optCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:R.lg,padding:16,marginBottom:10,borderWidth:2,borderColor:C.border},
  optCardOn:{borderColor:C.primary,backgroundColor:C.primary+'10'},
  optLabel:{fontSize:16,fontWeight:'700',color:C.text,marginBottom:3},
  optSub:{fontSize:13,color:C.text2},
  check:{width:24,height:24,borderRadius:12,backgroundColor:C.primary,alignItems:'center',justifyContent:'center'},
  fieldLabel:{fontSize:12,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:8,marginTop:16},
  input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:R.sm,padding:14,fontSize:16,color:C.text},
  genderBtn:{flex:1,backgroundColor:C.card,borderWidth:2,borderColor:C.border,borderRadius:R.md,paddingVertical:14,alignItems:'center'},
  genderBtnOn:{borderColor:C.primary,backgroundColor:C.primary+'10'},
  genderTxt:{fontSize:15,fontWeight:'700',color:C.text},
  actCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:R.md,padding:14,marginBottom:10,borderWidth:2,borderColor:C.border},
  actCardOn:{borderColor:C.primary,backgroundColor:C.primary+'10'},
  actLabel:{fontSize:15,fontWeight:'700',color:C.text,marginBottom:3},
  actSub:{fontSize:12,color:C.text2},
  footer:{padding:20,borderTopWidth:1,borderTopColor:C.border},
  nextBtn:{backgroundColor:C.primary,borderRadius:R.md,paddingVertical:16,alignItems:'center'},
  nextTxt:{color:'#07111F',fontWeight:'800',fontSize:16},
});
