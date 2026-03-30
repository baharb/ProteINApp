import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

export default function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [mode, setMode]       = useState('signin'); // signin | signup
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    if (!email || !password) { setError('Please enter email and password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true); setError(null); setSuccess(null);
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (err) setError(err.message);
    else if (mode === 'signup') setSuccess('Check your email to confirm your account, then sign in!');
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.logo}>ProteIN <Text style={{ color: colors.text2, fontWeight: '400' }}>AI</Text></Text>
          <Text style={s.hero}>🥗</Text>
          <Text style={s.title}>{mode === 'signin' ? 'Welcome back' : 'Create account'}</Text>
          <Text style={s.sub}>Protein-first nutrition, powered by AI</Text>

          <View style={s.form}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.text3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              placeholderTextColor={colors.text3}
              secureTextEntry
            />

            {error  && <Text style={s.error}>{error}</Text>}
            {success && <Text style={s.successMsg}>{success}</Text>}

            <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#0a0a0f" />
                : <Text style={s.btnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={s.switchMode} onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null); }}>
              <Text style={s.switchText}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={{ color: colors.accent, fontWeight: '700' }}>
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  logo: { fontSize: 22, fontWeight: '700', color: colors.accent, letterSpacing: -1 },
  hero: { fontSize: 72, textAlign: 'center', marginVertical: 24 },
  title: { fontSize: 30, fontWeight: '700', color: colors.text, letterSpacing: -0.5, marginBottom: 6 },
  sub: { fontSize: 14, color: colors.text2, marginBottom: 36 },
  form: { gap: 4 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.text2, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 14, fontSize: 15, color: colors.text },
  error: { color: colors.orange, fontSize: 13, marginTop: 10, lineHeight: 20 },
  successMsg: { color: colors.accent, fontSize: 13, marginTop: 10, lineHeight: 20 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.sm, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  btnText: { color: '#0a0a0f', fontWeight: '700', fontSize: 16 },
  switchMode: { alignItems: 'center', marginTop: 20, padding: 8 },
  switchText: { fontSize: 14, color: colors.text2 },
});
