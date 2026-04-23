import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useApp();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [mode,     setMode]     = useState('signin');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  async function handleSubmit() {
    if (!email.trim()||!password) { setError('Please enter email and password.'); return; }
    if (password.length<6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    const err = mode==='signin' ? await signIn(email.trim(),password) : await signUp(email.trim(),password);
    setLoading(false);
    if (err) {
      const msg = err.message;
      if (msg.includes('Invalid login'))           setError('Wrong email or password.');
      else if (msg.includes('already registered')) setError('Email already registered. Try signing in.');
      else if (msg.includes('Email not confirmed'))setError('Please confirm your email first.');
      else setError(msg);
    } else if (mode==='signup') {
      setSuccess('Account created! Check your email to confirm, then sign in.');
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView contentContainerStyle={[s.scroll, isLandscape&&s.scrollL]} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>ProteIN <Text style={{color:colors.text2,fontWeight:'400'}}>AI</Text></Text>
          {!isLandscape && <Text style={s.hero}>🥗</Text>}
          <Text style={s.title}>{mode==='signin'?'Welcome back':'Create account'}</Text>
          <Text style={s.sub}>Protein-first nutrition, powered by AI</Text>

          <Text style={s.label}>Email</Text>
          <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor={colors.text3} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder={mode==='signup'?'At least 6 characters':'••••••••'} placeholderTextColor={colors.text3} secureTextEntry />

          {error   && <View style={s.errBox}><Text style={s.errTxt}>{error}</Text></View>}
          {success && <View style={s.okBox}><Text style={s.okTxt}>{success}</Text></View>}

          <TouchableOpacity style={[s.btn,loading&&{opacity:0.6}]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#0a0a0f" /> : <Text style={s.btnTxt}>{mode==='signin'?'Sign In':'Create Account'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.switchMode} onPress={() => {setMode(m=>m==='signin'?'signup':'signin');setError(null);setSuccess(null);}}>
            <Text style={s.switchTxt}>
              {mode==='signin'?"Don't have an account? ":"Already have an account? "}
              <Text style={{color:colors.accent,fontWeight:'700'}}>{mode==='signin'?'Sign up':'Sign in'}</Text>
            </Text>
          </TouchableOpacity>

          {/* Guest mode — continue without account */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine}/><Text style={s.dividerTxt}>or</Text><View style={s.dividerLine}/>
          </View>
          <TouchableOpacity style={s.guestBtn} onPress={continueAsGuest} activeOpacity={0.85}>
            <Text style={s.guestBtnTxt}>👀 Continue as Guest</Text>
          </TouchableOpacity>
          <Text style={s.guestNote}>Guest mode: explore the app — data won't be saved</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  scroll:{flexGrow:1,padding:24,paddingTop:60},
  scrollL:{paddingHorizontal:80,paddingTop:30},
  logo:{fontSize:22,fontWeight:'700',color:colors.accent,letterSpacing:-1},
  hero:{fontSize:72,textAlign:'center',marginVertical:20},
  title:{fontSize:28,fontWeight:'700',color:colors.text,letterSpacing:-0.5,marginBottom:6,marginTop:10},
  sub:{fontSize:14,color:colors.text2,marginBottom:24},
  label:{fontSize:11,fontWeight:'700',textTransform:'uppercase',letterSpacing:1,color:colors.text2,marginBottom:6,marginTop:14},
  input:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:14,fontSize:15,color:colors.text},
  errBox:{backgroundColor:'rgba(255,140,66,0.1)',borderRadius:radius.sm,padding:12,marginTop:12,borderWidth:1,borderColor:'rgba(255,140,66,0.3)'},
  errTxt:{color:colors.orange,fontSize:13,lineHeight:20},
  okBox:{backgroundColor:'rgba(126,255,160,0.1)',borderRadius:radius.sm,padding:12,marginTop:12,borderWidth:1,borderColor:'rgba(126,255,160,0.3)'},
  okTxt:{color:colors.accent,fontSize:13,lineHeight:20},
  btn:{backgroundColor:colors.accent,borderRadius:radius.sm,paddingVertical:15,alignItems:'center',marginTop:20},
  btnTxt:{color:'#0a0a0f',fontWeight:'700',fontSize:16},
  switchMode:{alignItems:'center',marginTop:18,padding:8},
  switchTxt:{fontSize:14,color:colors.text2},
  dividerRow:{flexDirection:'row',alignItems:'center',marginVertical:20,gap:10},
  dividerLine:{flex:1,height:1,backgroundColor:colors.border},
  dividerTxt:{color:colors.text3,fontSize:12},
  guestBtn:{backgroundColor:colors.card,borderRadius:radius.sm,paddingVertical:14,alignItems:'center',borderWidth:1,borderColor:colors.border},
  guestBtnTxt:{color:colors.text2,fontWeight:'600',fontSize:15},
  guestNote:{textAlign:'center',fontSize:11,color:colors.text3,marginTop:8},
});
