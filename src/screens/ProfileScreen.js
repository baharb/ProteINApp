import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
  Alert, Image, TextInput, Modal, KeyboardAvoidingView, Platform,
  useWindowDimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Constants from 'expo-constants';
import { colors, radius, GOAL_LABELS, ACTIVITIES, GOALS_LIST } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { ScreenHeader, PrimaryButton } from '../components/UI';
import { registerForPushNotifications, scheduleDailyProteinReminder } from '../lib/notifications';
import { supabase } from '../lib/supabase';

const W_UNITS = ['kg','lbs'];
const H_UNITS = ['cm','in','ft'];

function inputToKg(val, unit) {
  const n = parseFloat(val) || 0;
  if (unit==='lbs') return n / 2.20462;
  return n;
}
function inputToCm(val, unit) {
  const n = parseFloat(val) || 0;
  if (unit==='in')  return n * 2.54;
  if (unit==='ft')  return n * 30.48;
  return n;
}
function kgToDisplay(kg, unit) {
  if (!kg) return '';
  if (unit==='lbs') return (kg * 2.20462).toFixed(1);
  return kg.toFixed(1);
}
function cmToDisplay(cm, unit) {
  if (!cm) return '';
  if (unit==='in')  return (cm / 2.54).toFixed(1);
  if (unit==='ft')  return (cm / 30.48).toFixed(2);
  return Math.round(cm).toString();
}

// ── Edit Profile Modal ────────────────────────────────────────────────────
function EditProfileModal({ profile, units, onSave, onClose }) {
  const wu = units?.weight || 'kg';
  const hu = units?.height || 'cm';
  const [name,     setName]     = useState(profile?.display_name || '');
  const [age,      setAge]      = useState(String(profile?.age || ''));
  const [weight,   setWeight]   = useState(kgToDisplay(profile?.weight_kg, wu));
  const [height,   setHeight]   = useState(cmToDisplay(profile?.height_cm, hu));
  const [wUnit,    setWUnit]    = useState(wu);
  const [hUnit,    setHUnit]    = useState(hu);
  const [gender,   setGender]   = useState(profile?.gender   || 'male');
  const [activity, setActivity] = useState(profile?.activity || 'moderate');
  const [selGoals, setSelGoals] = useState(profile?.goals    || ['muscle']);
  const [saving,   setSaving]   = useState(false);

  // When user changes unit, convert displayed value
  function changeWUnit(u) {
    const kg = inputToKg(weight, wUnit);
    setWUnit(u);
    setWeight(kgToDisplay(kg, u));
  }
  function changeHUnit(u) {
    const cm = inputToCm(height, hUnit);
    setHUnit(u);
    setHeight(cmToDisplay(cm, u));
  }

  function toggleGoal(key) {
    setSelGoals(prev => prev.includes(key) ? prev.filter(g=>g!==key) : [...prev, key]);
  }

  async function handleSave() {
    if (selGoals.length===0) { Alert.alert('Pick at least one goal'); return; }
    setSaving(true);
    await onSave({
      display_name: name.trim(),
      age: parseInt(age) || profile?.age || 25,
      weightKg: inputToKg(weight, wUnit),
      heightCm: inputToCm(height, hUnit),
      gender, activity, goals: selGoals,
      weightUnit: wUnit, heightUnit: hUnit,
    });
    setSaving(false);
    onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <View style={em.overlay}>
          <View style={em.sheet}>
            <View style={em.handle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={em.title}>Edit Profile</Text>

              <Text style={em.label}>Display Name</Text>
              <TextInput style={em.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.text3} />

              <Text style={em.label}>Age</Text>
              <TextInput style={em.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="25" placeholderTextColor={colors.text3} />

              {/* Weight with unit selector */}
              <Text style={em.label}>Weight</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:4}}>
                {W_UNITS.map(u => (
                  <TouchableOpacity key={u} style={[em.unitBtn, wUnit===u&&em.unitBtnOn]} onPress={() => changeWUnit(u)}>
                    <Text style={[em.unitTxt, wUnit===u&&{color:colors.accent}]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={em.input} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder={`Weight in ${wUnit}`} placeholderTextColor={colors.text3} />

              {/* Height with unit selector */}
              <Text style={em.label}>Height</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:4}}>
                {H_UNITS.map(u => (
                  <TouchableOpacity key={u} style={[em.unitBtn, hUnit===u&&em.unitBtnOn]} onPress={() => changeHUnit(u)}>
                    <Text style={[em.unitTxt, hUnit===u&&{color:colors.accent}]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={em.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder={`Height in ${hUnit}`} placeholderTextColor={colors.text3} />

              <Text style={em.label}>Gender</Text>
              <View style={{flexDirection:'row',gap:8,marginBottom:4}}>
                {['male','female'].map(g => (
                  <TouchableOpacity key={g} style={[em.optBtn, gender===g&&em.optBtnOn]} onPress={() => setGender(g)}>
                    <Text style={[em.optTxt, gender===g&&{color:colors.accent3}]}>{g==='male'?'♂ Male':'♀ Female'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={em.label}>Activity Level</Text>
              {ACTIVITIES.map(a => (
                <TouchableOpacity key={a.key} style={[em.actBtn, activity===a.key&&em.actBtnOn]} onPress={() => setActivity(a.key)}>
                  <Text style={[em.actLabel, activity===a.key&&{color:colors.accent3}]}>{a.label}</Text>
                  <Text style={em.actDesc}>{a.desc}</Text>
                </TouchableOpacity>
              ))}

              <Text style={em.label}>Goals</Text>
              {GOALS_LIST.map(g => {
                const on = selGoals.includes(g.key);
                return (
                  <TouchableOpacity key={g.key} style={[em.goalBtn,on&&em.goalBtnOn]} onPress={() => toggleGoal(g.key)}>
                    <Text style={{fontSize:20,marginRight:10}}>{g.icon}</Text>
                    <Text style={[em.goalLabel,on&&{color:colors.accent}]}>{g.label}</Text>
                    {on && <Text style={{color:colors.accent,marginLeft:'auto',fontSize:16}}>✓</Text>}
                  </TouchableOpacity>
                );
              })}

              <PrimaryButton title={saving?'Saving…':'Save Changes'} onPress={handleSave} disabled={saving} style={{marginTop:18}} />
              <TouchableOpacity style={{padding:14,alignItems:'center',marginTop:4}} onPress={onClose}>
                <Text style={{color:colors.text2,fontSize:14}}>Cancel</Text>
              </TouchableOpacity>
              <View style={{height:30}} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const em = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'flex-end'},
  sheet:{backgroundColor:colors.bg2,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'92%'},
  handle:{width:40,height:4,backgroundColor:colors.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  title:{fontSize:20,fontWeight:'700',color:colors.text,marginBottom:4},
  label:{fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:1,color:colors.text2,marginBottom:6,marginTop:14},
  input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:12,fontSize:15,color:colors.text},
  unitBtn:{flex:1,backgroundColor:colors.card,borderWidth:2,borderColor:colors.border,borderRadius:8,paddingVertical:8,alignItems:'center'},
  unitBtnOn:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.1)'},
  unitTxt:{fontSize:13,fontWeight:'700',color:colors.text2},
  optBtn:{flex:1,backgroundColor:colors.card,borderWidth:2,borderColor:colors.border,borderRadius:radius.sm,padding:10,alignItems:'center'},
  optBtnOn:{borderColor:colors.accent3,backgroundColor:'rgba(0,212,255,0.08)'},
  optTxt:{fontSize:13,color:colors.text,fontWeight:'600'},
  actBtn:{backgroundColor:colors.card,borderWidth:2,borderColor:colors.border,borderRadius:radius.sm,padding:10,marginBottom:6,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  actBtnOn:{borderColor:colors.accent3,backgroundColor:'rgba(0,212,255,0.06)'},
  actLabel:{fontSize:13,fontWeight:'700',color:colors.text}, actDesc:{fontSize:11,color:colors.text2},
  goalBtn:{backgroundColor:colors.card,borderWidth:2,borderColor:colors.border,borderRadius:radius.sm,padding:12,marginBottom:8,flexDirection:'row',alignItems:'center'},
  goalBtnOn:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.06)'},
  goalLabel:{fontSize:14,fontWeight:'600',color:colors.text},
});

// ── Main ProfileScreen ────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { goals, goals2, profile, units, setUnits, signOut, session, updateProfilePhoto, calcAndSetGoals } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [notifications,  setNotifications]  = useState(false);
  const [uploadingPhoto, setUploadingPhoto]  = useState(false);
  const [showEditModal,  setShowEditModal]   = useState(false);

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const wu = units?.weight || 'kg';
  const hu = units?.height || 'cm';

  useEffect(() => { registerForPushNotifications().then(g => setNotifications(!!g)); }, []);

  async function toggleNotifications(val) {
    if (val) {
      const granted = await registerForPushNotifications();
      if (granted) { await scheduleDailyProteinReminder(goals.protein); setNotifications(true); }
      else Alert.alert('Permission Denied','Enable notifications in Settings.');
    } else { setNotifications(false); }
  }

  async function pickPhoto(useCamera) {
    const perm = useCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status!=='granted') { Alert.alert('Permission needed',`Allow ${useCamera?'camera':'photo library'} access in Settings.`); return; }
    const picked = useCamera
      ? await ImagePicker.launchCameraAsync({allowsEditing:true,aspect:[1,1],quality:0.8})
      : await ImagePicker.launchImageLibraryAsync({mediaTypes:ImagePicker.MediaTypeOptions.Images,allowsEditing:true,aspect:[1,1],quality:0.8});
    if (picked.canceled||!picked.assets?.[0]?.uri) return;
    setUploadingPhoto(true);
    try {
      const resized = await ImageManipulator.manipulateAsync(picked.assets[0].uri,[{resize:{width:400,height:400}}],{compress:0.8,format:ImageManipulator.SaveFormat.JPEG,base64:true});
      if (!resized?.base64) throw new Error('Could not process image.');
      const filePath = `${session.user.id}/avatar.jpg`;
      const bytes = Uint8Array.from(atob(resized.base64), c => c.charCodeAt(0));
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, bytes, {contentType:'image/jpeg',upsert:true});
      if (uploadError) throw uploadError;
      await updateProfilePhoto(filePath);
      Alert.alert('✓ Photo updated!');
    } catch (e) {
      Alert.alert('Upload failed', e.message.includes('violates')||e.message.includes('policy')
        ? 'Storage policy error.\n\nFix: Supabase → Storage → avatars → Policies → add upload policy for authenticated users.'
        : e.message);
    } finally { setUploadingPhoto(false); }
  }

  function showPhotoOptions() {
    Alert.alert('Profile Photo','Choose source',[
      {text:'📷 Take Photo', onPress:()=>pickPhoto(true)},
      {text:'🖼️ From Library', onPress:()=>pickPhoto(false)},
      {text:'Cancel',style:'cancel'},
    ]);
  }

  async function handleSaveProfile({ display_name, age, weightKg, heightCm, gender, activity, goals: newGoals, weightUnit, heightUnit }) {
    await calcAndSetGoals(age, weightKg, heightCm, gender, activity, newGoals, weightUnit, heightUnit);
    if (session && display_name !== undefined) {
      await supabase.from('profiles').update({ display_name }).eq('id', session.user.id);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out','Are you sure?',[{text:'Cancel',style:'cancel'},{text:'Sign Out',style:'destructive',onPress:signOut}]);
  }

  // Show display_name if set, otherwise email prefix
  const displayName = profile?.display_name || session?.user?.email?.split('@')[0] || 'You';
  const displayEmail = session?.user?.email || '';

  return (
    <SafeAreaView style={s.safe}>
      <ScreenHeader title="Profile" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]}>

        <View style={s.profileHead}>
          <TouchableOpacity onPress={showPhotoOptions} activeOpacity={0.85} style={s.avatarWrap}>
            {uploadingPhoto ? (
              <View style={s.avatarPlaceholder}><ActivityIndicator color={colors.accent} /></View>
            ) : profile?.avatar_url ? (
              <Image source={{uri:profile.avatar_url}} style={s.avatarImg} />
            ) : (
              <View style={s.avatarPlaceholder}><Text style={{fontSize:32}}>👤</Text></View>
            )}
            <View style={s.avatarBadge}><Text style={{fontSize:13}}>📷</Text></View>
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={s.displayName}>{displayName}</Text>
            {/* Show email below name */}
            {displayEmail ? <Text style={s.email} numberOfLines={1}>{displayEmail}</Text> : null}
            {profile && <Text style={s.bodyStats}>{kgToDisplay(profile.weight_kg,wu)} {wu} · {cmToDisplay(profile.height_cm,hu)} {hu} · Age {profile.age}</Text>}
            <View style={s.chips}>
              {(goals2||[]).map(g => <View key={g} style={s.chip}><Text style={s.chipTxt}>{GOAL_LABELS[g]}</Text></View>)}
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.editBtn} onPress={() => setShowEditModal(true)} activeOpacity={0.85}>
          <Text style={s.editBtnTxt}>✏️ Edit Profile</Text>
        </TouchableOpacity>

        <View style={s.card}>
          <Text style={s.cardTitle}>Daily Goals</Text>
          {[
            {label:'Calories',val:`${goals.calories.toLocaleString()} kcal`},
            {label:'Protein', val:`${goals.protein}g`},
            {label:'Carbs',   val:`${goals.carbs}g`},
            {label:'Fat',     val:`${goals.fat}g`},
          ].map(r => (
            <View key={r.label} style={s.row}>
              <Text style={s.rowLabel}>{r.label}</Text>
              <Text style={s.rowVal}>{r.val}</Text>
            </View>
          ))}
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Settings</Text>
          <View style={s.settingRow}>
            <View>
              <Text style={s.settingLabel}>🔔 Daily Reminders</Text>
              <Text style={s.settingDesc}>Protein + diet + exercise nudges</Text>
            </View>
            <Switch value={notifications} onValueChange={toggleNotifications} trackColor={{false:colors.card2,true:colors.accent}} thumbColor="#fff" />
          </View>
          <View style={[s.settingRow,{borderBottomWidth:0}]}>
            <View>
              <Text style={s.settingLabel}>📱 Wearable Sync</Text>
              <Text style={s.settingDesc}>Apple Watch / Fitbit</Text>
            </View>
            <Text style={s.comingSoon}>Coming soon</Text>
          </View>
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={s.signOutTxt}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={s.version}>ProteIN AI v{appVersion}</Text>
        <View style={{height:30}} />
      </ScrollView>

      {showEditModal && (
        <EditProfileModal
          profile={profile}
          units={units||{weight:'kg',height:'cm'}}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg}, scroll:{padding:18,paddingTop:8}, scrollL:{paddingHorizontal:40},
  profileHead:{flexDirection:'row',alignItems:'center',gap:14,marginBottom:14},
  avatarWrap:{position:'relative'},
  avatarImg:{width:76,height:76,borderRadius:38,borderWidth:2,borderColor:'rgba(126,255,160,0.4)'},
  avatarPlaceholder:{width:76,height:76,borderRadius:38,backgroundColor:'rgba(126,255,160,0.12)',alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:'rgba(126,255,160,0.3)'},
  avatarBadge:{position:'absolute',bottom:0,right:0,backgroundColor:colors.card,borderRadius:12,width:26,height:26,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},
  displayName:{fontSize:18,fontWeight:'700',color:colors.text,marginBottom:2},
  email:{fontSize:12,color:colors.text2,marginBottom:4},
  bodyStats:{fontSize:11,color:colors.text2,marginBottom:6},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:6},
  chip:{backgroundColor:'rgba(126,255,160,0.12)',borderRadius:20,paddingHorizontal:10,paddingVertical:3,borderWidth:1,borderColor:'rgba(126,255,160,0.25)'},
  chipTxt:{fontSize:11,color:colors.accent,fontWeight:'600'},
  editBtn:{backgroundColor:colors.card,borderRadius:radius.sm,padding:13,alignItems:'center',marginBottom:14,borderWidth:1,borderColor:colors.border},
  editBtnTxt:{color:colors.text,fontWeight:'600',fontSize:14},
  card:{backgroundColor:colors.card,borderRadius:radius.lg,padding:16,marginBottom:14,borderWidth:1,borderColor:colors.border},
  cardTitle:{fontSize:15,fontWeight:'700',color:colors.text,marginBottom:12},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:9,borderBottomWidth:1,borderBottomColor:colors.border},
  rowLabel:{fontSize:13,color:colors.text2}, rowVal:{fontSize:16,fontWeight:'700',color:colors.accent},
  settingRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},
  settingLabel:{fontSize:14,color:colors.text,fontWeight:'500'}, settingDesc:{fontSize:11,color:colors.text2,marginTop:2},
  comingSoon:{fontSize:12,color:colors.text3},
  signOutBtn:{backgroundColor:'rgba(255,140,66,0.1)',borderRadius:radius.sm,padding:14,alignItems:'center',borderWidth:1,borderColor:'rgba(255,140,66,0.3)',marginBottom:14},
  signOutTxt:{color:colors.orange,fontWeight:'700',fontSize:15},
  version:{textAlign:'center',fontSize:11,color:colors.text3},
});
