import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, Image, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, Linking } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, R } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { usePremium } from '../hooks/usePremium';
import { PrimaryBtn, SettingsRow } from '../components/UI';
import { SERVER_URL } from '../lib/config';
import { supabase } from '../lib/supabase';
import { LANG_OPTIONS } from '../data/i18n';
import { registerForPushNotifications, scheduleDailyProteinReminder, remindersEnabled, cancelReminders } from '../lib/notifications';

// ── My Plan Modal ─────────────────────────────────────────────────────────
function MyPlanModal({ profile, goals, goals2, onClose, t }) {
  const [planType, setPlanType]   = useState('nutrition'); // nutrition | exercise
  const [exType,   setExType]     = useState('gym');       // gym | home | none
  const [loading,  setLoading]    = useState(false);
  const [plan,     setPlan]       = useState(null);

  const goalLabel = (goals2||[]).map(g=>({lose:t('loseFat'),muscle:t('buildMuscle'),healthy:t('stayHealthy')}[g])).filter(Boolean).join(' + ') || t('stayHealthy');
  const isRecomp  = goals2?.includes('lose') && goals2?.includes('muscle');

  async function generate() {
    setLoading(true);
    // Simulate plan generation with local data (no server call for plan outline)
    await new Promise(r => setTimeout(r, 1200));
    if (planType === 'nutrition') {
      setPlan({
        type: 'nutrition',
        goalMode: isRecomp ? t('bodyRecomp') : goalLabel,
        dailyProtein: goals.protein,
        dailyCalories: goals.calories,
        meals: [
          { time:'breakfast', protein:Math.round(goals.protein*0.25), example:'3 eggs + Greek yogurt' },
          { time:'lunch',     protein:Math.round(goals.protein*0.30), example:'Chicken rice bowl' },
          { time:'dinner',    protein:Math.round(goals.protein*0.30), example:'Salmon + vegetables' },
          { time:'snack',     protein:Math.round(goals.protein*0.15), example:'Cottage cheese + fruit' },
        ],
        weeklyIdeas: ['Meal prep Sunday', 'Batch cook chicken', 'Stock protein shakes', 'Keep Greek yogurt handy'],
      });
    } else {
      setPlan({
        type: 'exercise',
        style: exType,
        goalMode: goalLabel,
        schedule: exType === 'none' ? null : [
          { day:'Mon', focus:'Upper Body', exercises:['Push-ups 3×12','Rows 3×10','Shoulder press 3×10'] },
          { day:'Tue', focus:'Cardio',     exercises:['20 min brisk walk','5 min stretch'] },
          { day:'Wed', focus:'Lower Body', exercises:['Squats 3×12','Lunges 3×10','Glutes 3×15'] },
          { day:'Thu', focus:'Rest',       exercises:['Light stretching','Foam rolling'] },
          { day:'Fri', focus:'Full Body',  exercises:['Burpees 3×10','Push-ups 3×15','Squats 3×15'] },
          { day:'Sat', focus:'Cardio',     exercises:['30 min walk/run','Core work'] },
          { day:'Sun', focus:'Rest',       exercises:['Recovery','Meal prep'] },
        ],
      });
    }
    setLoading(false);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={mp.overlay}>
        <View style={mp.sheet}>
          <View style={mp.handle} />
          <View style={mp.header}>
            <Text style={mp.title}>{t('myPlan')}</Text>
            <TouchableOpacity onPress={onClose}><Text style={{color:C.text2,fontSize:18}}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!plan ? (
              <>
                {/* Plan type selector */}
                <View style={mp.tabRow}>
                  {[['nutrition','🥗 '+t('nutritionPlan')],['exercise','💪 '+t('exercisePlan')]].map(([k,l])=>(
                    <TouchableOpacity key={k} style={[mp.tab,planType===k&&mp.tabOn]} onPress={()=>setPlanType(k)}>
                      <Text style={[mp.tabTxt,planType===k&&{color:C.primary}]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Goal mode display */}
                <View style={mp.goalBox}>
                  <Text style={mp.goalLabel}>{t('goalMode')}</Text>
                  <Text style={mp.goalVal}>{isRecomp ? t('bodyRecomp') : goalLabel}</Text>
                  
                </View>

                {planType==='exercise' && (
                  <>
                    <Text style={mp.sectionLabel}>{t('exerciseStyle')}</Text>
                    {[
                      ['gym','🏋️','Gym',       'Weights & machines'],
                      ['home','🏠','Home',      'No equipment needed'],
                      ['none','🚫','Food only', 'Diet plan only'],
                    ].map(([k,icon,label,desc])=>(
                      <TouchableOpacity key={k} style={[mp.exCard,exType===k&&mp.exCardOn]} onPress={()=>setExType(k)}>
                        <Text style={{fontSize:24,marginRight:12}}>{icon}</Text>
                        <View style={{flex:1}}>
                          <Text style={[mp.exLabel,exType===k&&{color:C.primary}]}>{label}</Text>
                          <Text style={mp.exDesc}>{desc}</Text>
                        </View>
                        {exType===k&&<Text style={{color:C.primary,fontSize:16}}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </>
                )}

                {/* Stats summary */}
                <View style={mp.statsSummary}>
                  <Text style={mp.statsTitle}>{t('yourTargets')}</Text>
                  <Text style={mp.statsTxt}>🥩 {t('protein')}: {goals.protein}g</Text>
                  <Text style={mp.statsTxt}>🔥 {t('calories')}: {goals.calories} {t('kcal')}</Text>
                  {profile?.weight_kg && <Text style={mp.statsTxt}>⚖️ {t('weight')}: {profile.weight_kg.toFixed(1)} kg</Text>}
                </View>

                {loading ? (
                  <View style={{alignItems:'center',padding:20}}>
                    <ActivityIndicator color={C.primary} size="large" />
                    <Text style={{color:C.text2,marginTop:12}}>{t('generating')}</Text>
                  </View>
                ) : (
                  <PrimaryBtn title={t('generatePlan')} onPress={generate} style={{marginTop:16}} />
                )}
              </>
            ) : (
              /* Plan display */
              <>
                <View style={mp.planHeader}>
                  <Text style={mp.planTitle}>{plan.goalMode}</Text>
                  {plan.type==='nutrition' && (
                    <Text style={mp.planSub}>{t('proteinKcal', { p: plan.dailyProtein, c: plan.dailyCalories })}</Text>
                  )}
                </View>

                {plan.type==='nutrition' && (
                  <>
                    <Text style={mp.sectionLabel}>{t('dailyStructure')}</Text>
                    {plan.meals.map((m,i)=>(
                      <View key={i} style={mp.planCard}>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                          <Text style={mp.mealTime}>{t(m.time)}</Text>
                          <Text style={{color:C.primary,fontWeight:'700',fontSize:14}}>{t('approxProtein', { n: m.protein })}</Text>
                        </View>
                        <Text style={mp.mealExample}>{m.example}</Text>
                      </View>
                    ))}
                    <Text style={mp.sectionLabel}>{t('weeklyTips')}</Text>
                    {plan.weeklyIdeas.map((tip,i)=>(
                      <View key={i} style={mp.tipRow}>
                        <Text style={{color:C.primary,marginRight:8}}>•</Text>
                        <Text style={mp.tipTxt}>{tip}</Text>
                      </View>
                    ))}
                  </>
                )}

                {plan.type==='exercise' && plan.schedule && (
                  <>
                    <Text style={mp.sectionLabel}>{t('weeklySchedule')}</Text>
                    {plan.schedule.map((day,i)=>(
                      <View key={i} style={mp.planCard}>
                        <View style={{flexDirection:'row',alignItems:'center',marginBottom:6}}>
                          <View style={mp.dayBadge}><Text style={mp.dayBadgeTxt}>{day.day}</Text></View>
                          <Text style={mp.dayFocus}>{day.focus}</Text>
                        </View>
                        {day.exercises.map((ex,j)=>(
                          <Text key={j} style={mp.exItem}>· {ex}</Text>
                        ))}
                      </View>
                    ))}
                  </>
                )}

                <PrimaryBtn title={t('regenerate')} onPress={()=>setPlan(null)} variant="outline" style={{marginTop:12}} />
              </>
            )}
            <View style={{height:40}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const mp = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'flex-end'},
  sheet:{backgroundColor:C.card,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'92%'},
  handle:{width:40,height:4,backgroundColor:C.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  title:{fontSize:20,fontWeight:'800',color:C.text},
  tabRow:{flexDirection:'row',backgroundColor:C.bg,borderRadius:R.md,padding:4,marginBottom:16,gap:4},
  tab:{flex:1,paddingVertical:10,alignItems:'center',borderRadius:R.sm},
  tabOn:{backgroundColor:C.primary+'20'},
  tabTxt:{fontSize:13,fontWeight:'700',color:C.text2},
  goalBox:{backgroundColor:C.bg,borderRadius:R.md,padding:14,marginBottom:16,borderWidth:1,borderColor:C.primary+'30'},
  goalLabel:{fontSize:11,color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4},
  goalVal:{fontSize:16,fontWeight:'800',color:C.primary},
  goalNote:{fontSize:12,color:C.text2,marginTop:4},
  sectionLabel:{fontSize:11,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:10,marginTop:8},
  exCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.bg,borderRadius:R.md,padding:14,marginBottom:8,borderWidth:2,borderColor:C.border},
  exCardOn:{borderColor:C.primary},
  exLabel:{fontSize:14,fontWeight:'700',color:C.text},
  exDesc:{fontSize:12,color:C.text2,marginTop:2},
  statsSummary:{backgroundColor:C.bg,borderRadius:R.md,padding:14,marginTop:8,borderWidth:1,borderColor:C.border},
  statsTitle:{fontSize:13,fontWeight:'700',color:C.text2,marginBottom:8},
  statsTxt:{fontSize:14,color:C.text,marginBottom:4},
  planHeader:{backgroundColor:C.primary+'15',borderRadius:R.md,padding:16,marginBottom:16,borderWidth:1,borderColor:C.primary+'30'},
  planTitle:{fontSize:18,fontWeight:'800',color:C.primary,marginBottom:4},
  planSub:{fontSize:13,color:C.text2},
  planCard:{backgroundColor:C.bg,borderRadius:R.md,padding:14,marginBottom:8,borderWidth:1,borderColor:C.border},
  mealTime:{fontSize:14,fontWeight:'700',color:C.text},
  mealExample:{fontSize:13,color:C.text2},
  tipRow:{flexDirection:'row',alignItems:'flex-start',marginBottom:6},
  tipTxt:{fontSize:14,color:C.text,flex:1},
  dayBadge:{backgroundColor:C.primary,borderRadius:6,paddingHorizontal:8,paddingVertical:3,marginRight:10},
  dayBadgeTxt:{fontSize:12,fontWeight:'800',color:'#07111F'},
  dayFocus:{fontSize:14,fontWeight:'700',color:C.text},
  exItem:{fontSize:13,color:C.text2,marginTop:3},
});

// ── Language Modal ────────────────────────────────────────────────────────
function LangModal({ onClose }) {
  const { lang, setLang, t } = useLang();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={lm.overlay}>
        <View style={lm.sheet}>
          <View style={lm.handle} />
          <Text style={lm.title}>🌐 {t('language')}</Text>
          {LANG_OPTIONS.map(opt=>(
            <TouchableOpacity key={opt.code} style={[lm.row,lang===opt.code&&lm.rowOn]}
              onPress={()=>{setLang(opt.code);onClose();}}>
              <Text style={lm.flag}>{opt.flag}</Text>
              <View style={{flex:1}}>
                <Text style={[lm.name,lang===opt.code&&{color:C.primary}]}>{opt.native}</Text>
                <Text style={lm.sub}>{opt.name}</Text>
              </View>
              {lang===opt.code&&<Text style={{color:C.primary,fontSize:16}}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{padding:14,alignItems:'center'}} onPress={onClose}>
            <Text style={{color:C.text2}}>{t('close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const lm = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',justifyContent:'flex-end'},
  sheet:{backgroundColor:C.card,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:34},
  handle:{width:40,height:4,backgroundColor:C.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  title:{fontSize:18,fontWeight:'800',color:C.text,marginBottom:14},
  row:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.border},
  rowOn:{backgroundColor:C.primary+'08',borderRadius:R.sm,paddingHorizontal:8},
  flag:{fontSize:26},
  name:{fontSize:15,fontWeight:'600',color:C.text},
  sub:{fontSize:12,color:C.text2,marginTop:1},
});

// ── Edit Profile Modal ────────────────────────────────────────────────────
function EditProfileModal({ profile, units, onSave, onClose, t }) {
  const wu = units?.weight||'kg', hu = units?.height||'cm';
  const [name,     setName]     = useState(profile?.display_name||'');
  const [age,      setAge]      = useState(String(profile?.age||''));
  const [weight,   setWeight]   = useState(profile?.weight_kg ? (wu==='lbs'?(profile.weight_kg*2.20462).toFixed(1):profile.weight_kg.toFixed(1)) : '');
  const [height,   setHeight]   = useState(profile?.height_cm ? (hu==='in'?(profile.height_cm/2.54).toFixed(1):Math.round(profile.height_cm).toString()) : '');
  const [wUnit,    setWUnit]    = useState(wu);
  const [hUnit,    setHUnit]    = useState(hu);
  const [goal,     setGoal]     = useState((profile?.goals||['muscle'])[0]);
  const [saving,   setSaving]   = useState(false);

  const GOALS = [
    {k:'lose',   l:t('loseFat'),      icon:'🔥'},
    {k:'muscle', l:t('buildMuscle'),  icon:'💪'},
    {k:'healthy',l:t('stayHealthy'),  icon:'🌿'},
  ];

  async function handleSave() {
    setSaving(true);
    const w = parseFloat(weight), h = parseFloat(height);
    const wKg = w > 0 ? (wUnit==='lbs' ? w/2.20462 : w) : profile?.weight_kg;
    const hCm = h > 0 ? (hUnit==='in'  ? h*2.54    : h) : profile?.height_cm;
    if (!(wKg >= 25 && wKg <= 300) || !(hCm >= 100 && hCm <= 250)) {
      Alert.alert(t('checkNumbers'), t('weightHeightOff')); setSaving(false); return;
    }
    await onSave({ display_name:name.trim(), age:parseInt(age)||profile?.age||25, weightKg:wKg, heightCm:hCm, goals:[goal], weightUnit:wUnit, heightUnit:hUnit });
    setSaving(false); onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={ep.overlay}>
          <View style={ep.sheet}>
            <View style={ep.handle} />
            <View style={ep.header}>
              <Text style={ep.title}>{t('editProfile')}</Text>
              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <Text style={{color:C.primary,fontWeight:'800',fontSize:16}}>{saving?t('saving'):t('save')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={ep.label}>{t('name')}</Text>
              <TextInput style={ep.input} value={name} onChangeText={setName} placeholder={t('yourName')} placeholderTextColor={C.text3} />
              <Text style={ep.label}>{t('age')}</Text>
              <TextInput style={ep.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor={C.text3} />
              <Text style={ep.label}>{t('weight')}</Text>
              <View style={ep.unitRow}>
                {['kg','lbs'].map(u=><TouchableOpacity key={u} style={[ep.unitBtn,wUnit===u&&ep.unitBtnOn]} onPress={()=>setWUnit(u)}><Text style={[ep.unitTxt,wUnit===u&&{color:C.primary}]}>{u}</Text></TouchableOpacity>)}
              </View>
              <TextInput style={ep.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder={`in ${wUnit}`} placeholderTextColor={C.text3} />
              <Text style={ep.label}>{t('height')}</Text>
              <View style={ep.unitRow}>
                {['cm','in'].map(u=><TouchableOpacity key={u} style={[ep.unitBtn,hUnit===u&&ep.unitBtnOn]} onPress={()=>setHUnit(u)}><Text style={[ep.unitTxt,hUnit===u&&{color:C.primary}]}>{u}</Text></TouchableOpacity>)}
              </View>
              <TextInput style={ep.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder={`in ${hUnit}`} placeholderTextColor={C.text3} />
              <Text style={ep.label}>{t('goal')}</Text>
              {GOALS.map(g=>(
                <TouchableOpacity key={g.k} style={[ep.goalBtn,goal===g.k&&ep.goalBtnOn]} onPress={()=>setGoal(g.k)}>
                  <Text style={{fontSize:20,marginRight:10}}>{g.icon}</Text>
                  <Text style={[ep.goalTxt,goal===g.k&&{color:C.primary}]}>{g.l}</Text>
                  {goal===g.k&&<Text style={{color:C.primary,marginLeft:'auto'}}>✓</Text>}
                </TouchableOpacity>
              ))}
              <View style={{height:40}} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ep = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.8)',justifyContent:'flex-end'},
  sheet:{backgroundColor:C.card,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'90%'},
  handle:{width:40,height:4,backgroundColor:C.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},
  title:{fontSize:20,fontWeight:'800',color:C.text},
  label:{fontSize:12,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,marginTop:14},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:R.sm,padding:13,fontSize:15,color:C.text},
  unitRow:{flexDirection:'row',gap:8,marginBottom:8},
  unitBtn:{flex:1,backgroundColor:C.bg,borderWidth:2,borderColor:C.border,borderRadius:R.sm,paddingVertical:8,alignItems:'center'},
  unitBtnOn:{borderColor:C.primary,backgroundColor:C.primary+'15'},
  unitTxt:{fontSize:13,fontWeight:'700',color:C.text2},
  goalBtn:{flexDirection:'row',alignItems:'center',backgroundColor:C.bg,borderWidth:2,borderColor:C.border,borderRadius:R.md,padding:14,marginBottom:8},
  goalBtnOn:{borderColor:C.primary,backgroundColor:C.primary+'10'},
  goalTxt:{fontSize:15,fontWeight:'600',color:C.text},
});

// ── Main Profile Screen ───────────────────────────────────────────────────
export default function ProfileScreen({ navigation }) {
  const { goals, goals2, profile, units, setUnits, signOut, deleteAccount, session, isGuest, updateProfilePhoto, calcAndSetGoals, updateDisplayName } = useApp();
  const { t, lang, back } = useLang();
  const { isPremium, unlock } = usePremium();
  const [notifications,  setNotifications]  = useState(false);
  const [uploadingPhoto, setUploadingPhoto]  = useState(false);
  const [showEdit,       setShowEdit]        = useState(false);
  const [showMyPlan,     setShowMyPlan]      = useState(false);
  const [showLang,       setShowLang]        = useState(false);
  const wu = units?.weight||'kg', hu = units?.height||'cm';

  useEffect(() => { remindersEnabled().then(setNotifications); }, []);

  async function toggleNotif(val) {
    if (val) {
      const ok = await registerForPushNotifications();
      if (ok) { await scheduleDailyProteinReminder(goals.protein); setNotifications(true); }
      else Alert.alert(t('permissionDenied'), t('enableNotif'));
    } else { await cancelReminders(); setNotifications(false); }
  }

  async function pickPhoto(cam) {
    if (isGuest) { navigation.navigate('Auth'); return; }
    const perm = cam ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status!=='granted') { Alert.alert(t('permissionNeeded')); return; }
    const picked = cam
      ? await ImagePicker.launchCameraAsync({allowsEditing:true,aspect:[1,1],quality:0.8})
      : await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.8});
    if (picked.canceled||!picked.assets?.[0]?.uri) return;
    setUploadingPhoto(true);
    try {
      const r = await ImageManipulator.manipulateAsync(picked.assets[0].uri,[{resize:{width:400,height:400}}],{compress:0.8,format:ImageManipulator.SaveFormat.JPEG,base64:true});
      if (!r?.base64) throw new Error('Could not process image.');
      const fp = `${session.user.id}/avatar.jpg`;
      const bytes = Uint8Array.from(atob(r.base64),c=>c.charCodeAt(0));
      const {error} = await supabase.storage.from('avatars').upload(fp,bytes,{contentType:'image/jpeg',upsert:true});
      if (error) throw error;
      await updateProfilePhoto(fp);
    } catch(e) {
      Alert.alert('Upload failed', e.message.includes('policy')||e.message.includes('violates')
        ? 'Fix in Supabase: Storage → avatars → add upload/read policies for authenticated users.'
        : e.message);
    } finally { setUploadingPhoto(false); }
  }

  async function handleSaveProfile({display_name,age,weightKg,heightCm,goals:newGoals,weightUnit,heightUnit}) {
    await calcAndSetGoals(age,weightKg,heightCm,profile?.gender||'male',profile?.activity||'moderate',newGoals,weightUnit,heightUnit);
    if (display_name!==undefined) await updateDisplayName(display_name);
  }

  const displayName  = profile?.display_name || session?.user?.email?.split('@')[0] || (isGuest?t('guest'):'');
  const displayEmail = session?.user?.email || (isGuest?t('guestMode'):'');
  const goalLabel    = (goals2||[]).map(g=>({lose:t('loseFat'),muscle:t('buildMuscle'),healthy:t('stayHealthy')}[g])).filter(Boolean).join(' + ')||'—';
  const currentLang  = LANG_OPTIONS.find(l=>l.code===lang);
  const weightTxt    = profile?.weight_kg ? `${wu==='lbs' ? (profile.weight_kg*2.20462).toFixed(1) : profile.weight_kg.toFixed(1)} ${wu}` : '—';
  const heightTxt    = profile?.height_cm ? `${hu==='in' ? (profile.height_cm/2.54).toFixed(1) : Math.round(profile.height_cm)} ${hu}` : '—';

  function onPhoto() {
    Alert.alert(t('profilePhoto'),'',[
      {text:`📷 ${t('camera')}`,onPress:()=>pickPhoto(true)},
      {text:`🖼️ ${t('library')}`,onPress:()=>pickPhoto(false)},
      {text:t('cancel'),style:'cancel'},
    ]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        {navigation?.canGoBack() ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:10,bottom:10,left:10,right:10}} style={s.headerSide}>
            <Text style={s.backTxt}>{back}</Text>
          </TouchableOpacity>
        ) : <View style={s.headerSide} />}
        <Text style={s.headerTitle}>{t('profile')}</Text>
        <View style={s.headerSide} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Avatar + info */}
        <View style={s.profileTop}>
          <TouchableOpacity style={s.avatarWrap} onPress={onPhoto} activeOpacity={0.85}>
            {uploadingPhoto ? (
              <View style={s.avatarPlaceholder}><ActivityIndicator color={C.primary}/></View>
            ) : profile?.avatar_url ? (
              <Image source={{uri:profile.avatar_url}} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{(displayName[0]||'?').toUpperCase()}</Text></View>
            )}
            <View style={s.avatarEdit}><Text style={{fontSize:12}}>📷</Text></View>
          </TouchableOpacity>
          <Text style={s.displayName}>{displayName}</Text>
          <Text style={s.displayEmail}>{displayEmail}</Text>
          {isGuest && (
            <TouchableOpacity style={s.signupBtn} onPress={()=>navigation.navigate('Auth')} activeOpacity={0.9}>
              <Text style={s.signupBtnTxt}>{t('createFreeAccount')}</Text>
            </TouchableOpacity>
          )}
          {!isGuest && (
            <View style={s.goalBadge}><Text style={s.goalBadgeTxt}>🎯 {goalLabel}</Text></View>
          )}
        </View>

        {/* Body stats */}
        {profile && (
          <View style={s.statsRow}>
            {[
              {val:weightTxt, label:t('weight')},
              {val:heightTxt, label:t('height')},
              {val:`${profile.age||'—'}`, label:t('age')},
            ].map((st,i)=>(
              <View key={i} style={[s.statItem,i>0&&{borderLeftWidth:1,borderLeftColor:C.border}]}>
                <Text style={s.statVal}>{st.val}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>
        )}

        {!isGuest && (
          <TouchableOpacity style={s.editBtn} onPress={()=>setShowEdit(true)} activeOpacity={0.85}>
            <Text style={s.editBtnTxt}>{t('editProfile')}</Text>
          </TouchableOpacity>
        )}

        {/* Daily target — protein first */}
        <Text style={s.sectionTitle}>{t('dailyTarget')}</Text>
        <View style={s.targetCard}>
          <View style={{flex:1}}>
            <Text style={s.targetLabel}>🥩 {t('protein')}</Text>
            <Text style={s.targetSub}>{t('autoCalc')}</Text>
          </View>
          <Text style={s.targetVal}>{goals.protein}g</Text>
        </View>
        <Text style={s.calNote}>{t('calRef', { n: goals.calories })}</Text>

        {/* Premium */}
        {!isPremium && (
          <View style={s.premiumCard}>
            <Text style={s.premiumCrown}>👑</Text>
            <Text style={s.premiumTitle}>{t('premiumPlan')}</Text>
            <Text style={s.premiumPrice}>$5.99<Text style={s.premiumPer}>{t('perMonth')}</Text></Text>
            {[t('pr1'), t('pr2'), t('pr3'), t('pr4')].map(b=>(
              <View key={b} style={s.premiumRow}>
                <Text style={s.premiumCheck}>✓</Text>
                <Text style={s.premiumItem}>{b}</Text>
              </View>
            ))}
            <TouchableOpacity style={s.premiumBtn} activeOpacity={0.9}
              onPress={()=>Alert.alert(t('comingSoon'), t('comingSoonSub'))}>
              <Text style={s.premiumBtnTxt}>{t('startTrial')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings */}
        <Text style={s.sectionTitle}>{t('settings')}</Text>
        <View style={s.groupCard}>
          <View style={s.notifRow}>
            <Text style={{fontSize:18,marginRight:12}}>🔔</Text>
            <Text style={s.notifLabel}>{t('reminders')}</Text>
            <Switch value={notifications} onValueChange={toggleNotif}
              trackColor={{false:C.border,true:C.primary}} thumbColor="#fff" style={{marginLeft:'auto'}} />
          </View>
          <SettingsRow icon="🌐" label={t('language')} value={`${currentLang?.flag} ${currentLang?.native}`} onPress={()=>setShowLang(true)} />
          <SettingsRow icon="📏" label={t('units')} value={wu==='kg'?t('metric'):t('imperial')} onPress={()=>Alert.alert(t('units'), t('unitSystem'),[
            {text:t('metric'),   onPress:()=>setUnits({weight:'kg',height:'cm'})},
            {text:t('imperial'), onPress:()=>setUnits({weight:'lbs',height:'in'})},
            {text:t('cancel'),style:'cancel'},
          ])} />
          {!isGuest && <SettingsRow icon="📋" label={t('myPlan')} value={t('mealIdeas')} onPress={()=>setShowMyPlan(true)} />}
        </View>

        {/* Account */}
        <Text style={s.sectionTitle}>{t('account')}</Text>
        <View style={s.groupCard}>
          <SettingsRow icon="❓" label={t('helpSupport')} onPress={() => Linking.openURL(`${SERVER_URL}/help`)} />
          <SettingsRow icon="📄" label={t('privacy')} onPress={() => Linking.openURL(`${SERVER_URL}/privacy`)} />
          <SettingsRow icon="📋" label={t('terms')} onPress={() => Linking.openURL(`${SERVER_URL}/terms`)} />
          {isGuest ? (
            <TouchableOpacity style={s.logoutRow} onPress={()=>navigation.navigate('Auth')} activeOpacity={0.8}>
              <Text style={[s.logoutTxt,{color:C.primary}]}>{t('signUpOrIn')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.logoutRow} onPress={()=>Alert.alert(t('logOut'), t('areYouSure'),[
              {text:t('cancel'),style:'cancel'},
              {text:t('logOut'),style:'destructive',onPress:signOut},
            ])} activeOpacity={0.8}>
              <Text style={s.logoutTxt}>{t('logOut')}</Text>
            </TouchableOpacity>
          )}
          {!isGuest && (
            <TouchableOpacity style={[s.logoutRow,{borderTopWidth:1,borderTopColor:C.border}]} activeOpacity={0.8}
              onPress={()=>Alert.alert(t('deleteAccount'), t('deleteAccountConfirm'),[
                {text:t('cancel'),style:'cancel'},
                {text:t('deleteAccount'),style:'destructive',onPress:async()=>{
                  try { await deleteAccount(); Alert.alert('✓', t('deleteAccountDone')); }
                  catch { Alert.alert('⚠️', t('deleteFailed')); }
                }},
              ])}>
              <Text style={[s.logoutTxt,{color:C.text2,fontWeight:'600'}]}>{t('deleteAccount')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.disclaimerTxt}>{t('disclaimer')}</Text>
        <View style={{height:30}} />
      </ScrollView>

      {showEdit    && <EditProfileModal profile={profile} units={units||{weight:'kg',height:'cm'}} onSave={handleSaveProfile} onClose={()=>setShowEdit(false)} t={t} />}
      {showMyPlan  && <MyPlanModal profile={profile} goals={goals} goals2={goals2} onClose={()=>setShowMyPlan(false)} t={t} />}
      {showLang    && <LangModal onClose={()=>setShowLang(false)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:12},
  headerSide:{width:40},
  backTxt:{fontSize:30,color:C.text,lineHeight:32},
  headerTitle:{flex:1,fontSize:18,fontWeight:'800',color:C.text,textAlign:'center'},
  scroll:{padding:16,paddingTop:4,width:'100%',maxWidth:860,alignSelf:'center'},

  profileTop:{alignItems:'center',marginBottom:18},
  avatarWrap:{position:'relative',marginBottom:12},
  avatarImg:{width:96,height:96,borderRadius:48,borderWidth:3,borderColor:C.primary+'70'},
  avatarPlaceholder:{width:96,height:96,borderRadius:48,backgroundColor:C.card2,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:C.primary+'50'},
  avatarInitial:{fontSize:38,fontWeight:'900',color:C.primary},
  avatarEdit:{position:'absolute',bottom:0,right:0,backgroundColor:C.card,borderRadius:15,width:30,height:30,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:C.bg},
  displayName:{fontSize:22,fontWeight:'900',color:C.text,marginBottom:3},
  displayEmail:{fontSize:14,color:C.text2,marginBottom:12},
  signupBtn:{backgroundColor:C.primary,borderRadius:R.md,paddingHorizontal:24,paddingVertical:12},
  signupBtnTxt:{fontSize:15,fontWeight:'900',color:'#0B0F14'},
  goalBadge:{backgroundColor:C.primary+'18',borderRadius:R.full,paddingHorizontal:14,paddingVertical:6,borderWidth:1,borderColor:C.primary+'45'},
  goalBadgeTxt:{fontSize:13,color:C.primary,fontWeight:'800'},

  statsRow:{flexDirection:'row',backgroundColor:C.card,borderRadius:R.lg,borderWidth:1,borderColor:C.border,paddingVertical:14,marginBottom:12},
  statItem:{flex:1,alignItems:'center'},
  statVal:{fontSize:17,fontWeight:'800',color:C.text},
  statLabel:{fontSize:12,color:C.text2,marginTop:3},
  editBtn:{backgroundColor:C.card,borderRadius:R.md,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:C.border,marginBottom:24},
  editBtnTxt:{fontSize:15,fontWeight:'800',color:C.text},

  sectionTitle:{fontSize:17,fontWeight:'800',color:C.text,marginBottom:12},
  targetCard:{flexDirection:'row',alignItems:'center',backgroundColor:C.card,borderRadius:R.lg,padding:16,borderWidth:1,borderColor:C.primary+'40'},
  targetLabel:{fontSize:16,fontWeight:'800',color:C.text},
  targetSub:{fontSize:12,color:C.text2,marginTop:3},
  targetVal:{fontSize:28,fontWeight:'900',color:C.primary},
  calNote:{fontSize:12,color:C.text2,marginTop:8,marginBottom:24,marginLeft:4},

  premiumCard:{backgroundColor:'#12201A',borderRadius:R.xl,padding:20,marginBottom:24,borderWidth:1.5,borderColor:C.primary+'70',alignItems:'center'},
  premiumCrown:{fontSize:30,marginBottom:4},
  premiumTitle:{fontSize:14,fontWeight:'900',color:C.gold,letterSpacing:1,marginBottom:4},
  premiumPrice:{fontSize:30,fontWeight:'900',color:C.text,marginBottom:14},
  premiumPer:{fontSize:15,fontWeight:'600',color:C.text2},
  premiumRow:{flexDirection:'row',alignItems:'center',alignSelf:'stretch',marginBottom:8,paddingHorizontal:8},
  premiumCheck:{fontSize:15,color:C.primary,fontWeight:'900',marginRight:10},
  premiumItem:{fontSize:15,color:C.text},
  premiumBtn:{alignSelf:'stretch',backgroundColor:C.primary,borderRadius:R.md,paddingVertical:15,alignItems:'center',marginTop:10},
  premiumBtnTxt:{fontSize:16,fontWeight:'900',color:'#0B0F14'},

  groupCard:{backgroundColor:C.card,borderRadius:R.lg,paddingHorizontal:16,borderWidth:1,borderColor:C.border,marginBottom:24},
  notifRow:{flexDirection:'row',alignItems:'center',paddingVertical:13,borderBottomWidth:1,borderBottomColor:C.border},
  notifLabel:{fontSize:15,color:C.text},
  logoutRow:{paddingVertical:16},
  logoutTxt:{color:'#F87171',fontWeight:'800',fontSize:15},
  disclaimerTxt:{fontSize:12,color:C.text2,lineHeight:18,textAlign:'center',paddingHorizontal:8},
});
