import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, useWindowDimensions, Switch, Modal } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C, R } from '../data/theme';
import { useApp } from '../hooks/useApp';
import { useLang } from '../hooks/useLang';
import { LANG_OPTIONS } from '../data/i18n';

const CREDS_KEY = 'saved_creds_v2';

function LangPicker({ onClose }) {
  const { lang, setLang, t } = useLang();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={lp.overlay} activeOpacity={1} onPress={onClose}>
        <View style={lp.box}>
          <Text style={lp.title}>🌐 {t('language')}</Text>
          {LANG_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.code} style={[lp.row, lang===opt.code&&lp.rowOn]}
              onPress={() => { setLang(opt.code); onClose(); }}>
              <Text style={lp.flag}>{opt.flag}</Text>
              <View style={{flex:1}}>
                <Text style={[lp.name, lang===opt.code&&{color:C.primary}]}>{opt.native}</Text>
                <Text style={lp.sub}>{opt.name}</Text>
              </View>
              {lang===opt.code && <Text style={{color:C.primary}}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const lp = StyleSheet.create({
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'center',alignItems:'center'},
  box:{backgroundColor:C.card,borderRadius:R.lg,padding:20,width:'82%',borderWidth:1,borderColor:C.border},
  title:{fontSize:17,fontWeight:'800',color:C.text,marginBottom:14},
  row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.border},
  rowOn:{backgroundColor:C.primary+'10'},
  flag:{fontSize:24}, name:{fontSize:14,fontWeight:'600',color:C.text}, sub:{fontSize:11,color:C.text2,marginTop:1},
});

// Why the sign-up screen opened — shown as the headline.
const REASONS = {
  scan:  { icon:'📷', title:'reasonScan',  sub:'reasonScanSub' },   // i18n keys
  log:   { icon:'🍽️', title:'reasonLog',   sub:'reasonLogSub' },
  coach: { icon:'🤖', title:'reasonCoach', sub:'reasonCoachSub' },
};

export default function AuthScreen({ navigation, route }) {
  const { signIn, signUp } = useApp();
  const reason = REASONS[route?.params?.reason];
  const { t, lang } = useLang();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [mode,        setMode]        = useState(reason ? 'signup' : 'signin');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [remember,    setRemember]    = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [success,     setSuccess]     = useState(null);
  const [showLang,    setShowLang]    = useState(false);
  const [savedEmail,  setSavedEmail]  = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(CREDS_KEY).then(raw => {
      if (!raw) return;
      try {
        const { email: e, password: p } = JSON.parse(raw);
        setEmail(e||''); setPassword(p||''); setSavedEmail(e||null);
      } catch {}
    });
  }, []);

  async function handleSubmit() {
    if (!email.trim()||!password) { setError(t('errEnter')); return; }
    if (mode==='signup'&&password.length<6) { setError(t('errPwLen')); return; }
    setLoading(true); setError(null); setSuccess(null);
    const err = mode==='signin' ? await signIn(email.trim(),password) : await signUp(email.trim(),password);
    setLoading(false);
    if (err) {
      if (err.message.includes('Invalid login'))            setError(t('errWrong'));
      else if (err.message.includes('already registered'))  setError(t('errRegistered'));
      else if (err.message.includes('Email not confirmed')) setError(t('errConfirm'));
      else setError(err.message);
      return;
    }
    if (mode==='signup') { setSuccess(t('accountCreated')); setMode('signin'); return; }
    if (remember) await AsyncStorage.setItem(CREDS_KEY, JSON.stringify({ email:email.trim(), password }));
    else await AsyncStorage.removeItem(CREDS_KEY);
  }

  function clearSaved() { AsyncStorage.removeItem(CREDS_KEY); setEmail(''); setPassword(''); setSavedEmail(null); }

  const currentLang = LANG_OPTIONS.find(l=>l.code===lang);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]} keyboardShouldPersistTaps="handled">

          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => navigation?.goBack()} style={s.closeBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.langPill} onPress={()=>setShowLang(true)}>
              <Text style={{fontSize:18}}>{currentLang?.flag}</Text>
              <Text style={s.langTxt}>{currentLang?.native}</Text>
              <Text style={{color:C.text3,fontSize:10}}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Why we're asking */}
          {reason && (
            <View style={s.reasonCard}>
              <Text style={s.reasonIcon}>{reason.icon}</Text>
              <Text style={s.reasonTitle}>{t(reason.title)}</Text>
              <Text style={s.reasonSub}>{t(reason.sub)}</Text>
            </View>
          )}

          {/* Hero */}
          {!isLandscape && !reason && (
            <View style={s.heroCard}>
              <Text style={s.heroTitle}>{t('heroTitle1')}{'\n'}<Text style={{color:C.primary}}>{t('heroTitle2')}</Text></Text>
              <Text style={s.heroSub}>{t('heroSub')}</Text>
              <View style={s.heroBullets}>
                {[t('hero1'), t('hero2'), t('hero3')].map((b,i)=>(
                  <Text key={i} style={s.heroBullet}>{b}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Saved credentials banner */}
          {savedEmail && mode==='signin' && (
            <View style={s.savedBanner}>
              <Text style={s.savedTxt}>🔑 {savedEmail}</Text>
              <TouchableOpacity onPress={clearSaved}><Text style={{color:C.text3,fontSize:12}}>{t('clear')}</Text></TouchableOpacity>
            </View>
          )}

          {/* Form */}
          <View style={s.form}>
            <Text style={s.formTitle}>{mode==='signin' ? t('welcomeBack') : t('createAccount')}</Text>
            <Text style={s.label}>{t('email')}</Text>
            <TextInput style={s.input} value={email} onChangeText={setEmail}
              placeholder="you@email.com" placeholderTextColor={C.text3}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
            <Text style={s.label}>{t('password')}</Text>
            <TextInput style={s.input} value={password} onChangeText={setPassword}
              placeholder={mode==='signup'?t('passwordHint'):'••••••••'}
              placeholderTextColor={C.text3} secureTextEntry />
            {mode==='signin' && (
              <View style={s.rememberRow}>
                <Text style={s.rememberTxt}>{t('rememberMe')}</Text>
                <Switch value={remember} onValueChange={setRemember}
                  trackColor={{false:C.border,true:C.primary}} thumbColor="#fff" />
              </View>
            )}
            {error   && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}
            {success && <View style={s.okBox}><Text style={s.okTxt}>{success}</Text></View>}
            <TouchableOpacity style={[s.submitBtn,loading&&{opacity:0.6}]}
              onPress={handleSubmit} disabled={loading} activeOpacity={0.9}>
              {loading ? <ActivityIndicator color="#07111F" /> : <Text style={s.submitTxt}>{mode==='signin'?t('signIn'):t('signUp')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.switchRow} onPress={()=>{setMode(m=>m==='signin'?'signup':'signin');setError(null);setSuccess(null);}}>
              <Text style={s.switchTxt}>
                {mode==='signin'?t('noAccount'):t('haveAccount')}{' '}
                <Text style={{color:C.primary,fontWeight:'700'}}>{mode==='signin'?t('signUp'):t('signIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={s.divRow}><View style={s.divLine}/><Text style={s.divTxt}>{t('or')}</Text><View style={s.divLine}/></View>

          {/* Keep browsing as a guest */}
          <TouchableOpacity style={s.guestBtn} onPress={() => navigation?.goBack()} activeOpacity={0.85}>
            <Text style={s.guestTxt}>{t('notNow')}</Text>
          </TouchableOpacity>
          <View style={{height:40}} />
        </ScrollView>
      </KeyboardAvoidingView>
      {showLang && <LangPicker onClose={()=>setShowLang(false)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  scroll:{flexGrow:1,padding:20,paddingTop:16},
  scrollL:{paddingHorizontal:80},
  topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20},
  closeBtn:{width:36,height:36,borderRadius:18,backgroundColor:C.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.border},
  closeTxt:{fontSize:16,color:C.text,fontWeight:'700'},
  reasonCard:{backgroundColor:C.primary+'10',borderRadius:R.lg,padding:20,marginBottom:16,alignItems:'center',borderWidth:1,borderColor:C.primary+'40'},
  reasonIcon:{fontSize:40,marginBottom:10},
  reasonTitle:{fontSize:20,fontWeight:'900',color:C.text,textAlign:'center',marginBottom:6,lineHeight:26},
  reasonSub:{fontSize:14,color:C.text2,textAlign:'center',lineHeight:20},
  langPill:{flexDirection:'row',alignItems:'center',gap:6,backgroundColor:C.card,borderRadius:R.full,paddingHorizontal:12,paddingVertical:7,borderWidth:1,borderColor:C.border},
  langTxt:{fontSize:12,color:C.text,fontWeight:'600'},
  heroCard:{backgroundColor:C.card,borderRadius:R.lg,padding:20,marginBottom:20,borderWidth:1,borderColor:C.border},
  heroTitle:{fontSize:28,fontWeight:'900',color:C.text,lineHeight:34,marginBottom:10},
  heroSub:{fontSize:13,color:C.text2,marginBottom:14,lineHeight:20},
  heroBullets:{gap:6},
  heroBullet:{fontSize:13,color:C.text2},
  savedBanner:{backgroundColor:C.primary+'15',borderRadius:R.sm,padding:10,marginBottom:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:C.primary+'30'},
  savedTxt:{fontSize:13,color:C.primary,fontWeight:'600'},
  form:{backgroundColor:C.card,borderRadius:R.lg,padding:20,borderWidth:1,borderColor:C.border,marginBottom:16},
  formTitle:{fontSize:20,fontWeight:'800',color:C.text,marginBottom:16},
  label:{fontSize:11,fontWeight:'700',color:C.text2,textTransform:'uppercase',letterSpacing:0.5,marginBottom:6,marginTop:12},
  input:{backgroundColor:C.bg,borderWidth:1,borderColor:C.border,borderRadius:R.sm,padding:14,fontSize:15,color:C.text},
  rememberRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:14},
  rememberTxt:{fontSize:14,color:C.text2},
  errBox:{backgroundColor:C.warning+'15',borderRadius:R.sm,padding:12,marginTop:12,borderWidth:1,borderColor:C.warning+'40'},
  errTxt:{color:C.warning,fontSize:13,lineHeight:20},
  okBox:{backgroundColor:C.primary+'15',borderRadius:R.sm,padding:12,marginTop:12,borderWidth:1,borderColor:C.primary+'40'},
  okTxt:{color:C.primary,fontSize:13,lineHeight:20},
  submitBtn:{backgroundColor:C.primary,borderRadius:R.md,paddingVertical:15,alignItems:'center',marginTop:20},
  submitTxt:{color:'#07111F',fontWeight:'800',fontSize:16},
  switchRow:{alignItems:'center',marginTop:16,padding:6},
  switchTxt:{fontSize:14,color:C.text2},
  divRow:{flexDirection:'row',alignItems:'center',marginVertical:16,gap:10},
  divLine:{flex:1,height:1,backgroundColor:C.border},
  divTxt:{color:C.text3,fontSize:12},
  guestBtn:{backgroundColor:C.card,borderRadius:R.md,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:C.border},
  guestTxt:{color:C.text2,fontWeight:'600',fontSize:15},
  guestNote:{textAlign:'center',fontSize:11,color:C.text3,marginTop:8},
});
