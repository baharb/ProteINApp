import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';

// ─── YOUR SERVER URL ─────────────────────────────────────────────────────────
// Local:   'http://YOUR_LOCAL_IP:3000'  (e.g. http://192.168.1.5:3000)
// Deployed:'https://your-app.onrender.com'
const SERVER_URL = 'https://your-server-url.onrender.com';
// ─────────────────────────────────────────────────────────────────────────────

const QUICK_QS = [
  'How do I hit my protein goal today?',
  'Give me a high-protein meal idea',
  'How do I lose fat without losing muscle?',
  'What should I eat after a workout?',
];

export default function CoachScreen({ navigation }) {
  const { today, goals, goals2, profile } = useApp();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [thinking,  setThinking]  = useState(false);
  const [error,     setError]     = useState(null);
  const scrollRef = useRef(null);

  function buildProfile() {
    return {
      goals:        goals2 || [],
      goalCalories: goals.calories,
      goalProtein:  goals.protein,
      goalCarbs:    goals.carbs,
      goalFat:      goals.fat,
      todayCalories: today.calories,
      todayProtein:  today.protein,
      meals:        today.meals.map(m => m.name),
      age:          profile?.age,
      weightKg:     profile?.weight_kg,
      heightCm:     profile?.height_cm,
      gender:       profile?.gender,
    };
  }

  async function send(msgOverride) {
    const text = (msgOverride || input).trim();
    if (!text || thinking) return;
    setInput('');
    setError(null);

    const newMsg = { role: 'user', content: text };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await fetch(`${SERVER_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, profile: buildProfile() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(
        err.message.includes('fetch') || err.message.includes('Network')
          ? 'Cannot reach server. Check SERVER_URL in CoachScreen.js and make sure the server is running.'
          : err.message
      );
    } finally {
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const displayMessages = [
    { role: 'assistant', content: "Hey! I'm your AI nutrition coach powered by Llama 3.1 💪\n\nI know your goals, today's intake, and your body stats. Ask me anything!" },
    ...messages,
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title}>🤖 AI Coach</Text>
          <Text style={s.titleSub}>Powered by Llama 3.1 70B</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={s.msgs}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {displayMessages.map((m, i) => (
            <View key={i} style={[s.msgWrap, m.role === 'user' ? s.userWrap : s.aiWrap]}>
              <View style={[s.bubble, m.role === 'user' ? s.userBubble : s.aiBubble]}>
                <Text style={[s.bubbleText, m.role === 'user' && { color: '#0a0a0f', fontWeight: '500' }]}>
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {thinking && (
            <View style={s.aiWrap}>
              <View style={[s.aiBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                <ActivityIndicator size="small" color={colors.text2} />
                <Text style={{ color: colors.text2, fontSize: 13 }}>Thinking…</Text>
              </View>
            </View>
          )}

          {error && (
            <View style={s.errorBox}>
              <Text style={s.errorTxt}>⚠️ {error}</Text>
            </View>
          )}

          {messages.length === 0 && !thinking && (
            <View style={{ gap: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 12, color: colors.text2, marginBottom: 2 }}>Try asking:</Text>
              {QUICK_QS.map(q => (
                <TouchableOpacity key={q} style={s.quickQ} onPress={() => send(q)}>
                  <Text style={s.quickQText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor={colors.text3}
            multiline
            returnKeyType="send"
            onSubmitEditing={() => send()}
          />
          <TouchableOpacity style={[s.sendBtn, thinking && { opacity: 0.5 }]} onPress={() => send()} disabled={thinking}>
            <Text style={s.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4, width: 60 },
  backText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  titleSub: { fontSize: 10, color: colors.text3, marginTop: 1 },
  msgs: { flex: 1 },
  msgWrap: { maxWidth: '85%' },
  userWrap: { alignSelf: 'flex-end' },
  aiWrap: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: colors.accent, borderTopRightRadius: 4 },
  aiBubble: { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 16 },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  errorBox: { backgroundColor: 'rgba(255,140,66,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255,140,66,0.3)' },
  errorTxt: { color: colors.orange, fontSize: 13, lineHeight: 20 },
  quickQ: { backgroundColor: colors.card2, borderRadius: radius.sm, padding: 12, borderWidth: 1, borderColor: colors.border },
  quickQText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg2 },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.text, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, width: 46, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#0a0a0f', fontSize: 20, fontWeight: '700' },
});
