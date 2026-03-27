import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, AI_RESPONSES } from '../data/constants';
import { useApp } from '../hooks/useApp';

export default function CoachScreen({ navigation }) {
  const { today, goals } = useApp();
  const [messages, setMessages] = useState([
    { type: 'ai', text: "Hey! I'm your AI health coach 💪 Ask me anything about nutrition, protein, or your fitness goals!" },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef(null);

  function sendMsg() {
    const msg = input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { type: 'user', text: msg }]);
    setThinking(true);

    setTimeout(() => {
      const lower = msg.toLowerCase();
      let response = AI_RESPONSES.default;
      if (lower.includes('protein')) response = AI_RESPONSES.protein;
      else if (lower.includes('calorie') || lower.includes('calories')) response = AI_RESPONSES.calories;
      else if (lower.includes('meal') || lower.includes('eat') || lower.includes('food')) response = AI_RESPONSES.meal;
      else if (lower.includes('muscle') || lower.includes('bulk')) response = AI_RESPONSES.muscle;
      else if (lower.includes('lose') || lower.includes('fat') || lower.includes('weight')) response = AI_RESPONSES.lose;

      if (today.protein > 0) {
        response += `\n\nToday so far: ${today.protein}g protein / ${today.calories} kcal. `;
        response += today.protein >= goals.protein
          ? 'Protein goal hit! ✅'
          : `${goals.protein - today.protein}g protein remaining.`;
      }

      setThinking(false);
      setMessages(prev => [...prev, { type: 'ai', text: response }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  }

  const QUICK_QUESTIONS = [
    'How do I get 120g protein easily?',
    'What should I eat to build muscle?',
    'How do I lose fat without losing muscle?',
    'Explain my calorie target',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🤖 AI Health Coach</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.msgWrap, m.type === 'user' ? styles.userWrap : styles.aiWrap]}>
              <View style={[styles.bubble, m.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.bubbleText, m.type === 'user' && { color: '#0a0a0f', fontWeight: '500' }]}>
                  {m.text}
                </Text>
              </View>
            </View>
          ))}

          {thinking && (
            <View style={styles.aiWrap}>
              <View style={styles.aiBubble}>
                <ActivityIndicator size="small" color={colors.text2} />
              </View>
            </View>
          )}

          {/* Quick questions */}
          {messages.length === 1 && (
            <View style={styles.quickQs}>
              <Text style={styles.quickQsLabel}>Try asking:</Text>
              {QUICK_QUESTIONS.map(q => (
                <TouchableOpacity key={q} style={styles.quickQ} onPress={() => { setInput(q); }}>
                  <Text style={styles.quickQText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor={colors.text3}
            multiline
            onSubmitEditing={sendMsg}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMsg}>
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  backText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  messages: { flex: 1 },
  msgWrap: { maxWidth: '85%' },
  userWrap: { alignSelf: 'flex-end' },
  aiWrap: { alignSelf: 'flex-start' },
  bubble: { padding: 12, borderRadius: 16 },
  userBubble: { backgroundColor: colors.accent, borderTopRightRadius: 4 },
  aiBubble: { backgroundColor: colors.card, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 22 },
  quickQs: { marginTop: 8, gap: 8 },
  quickQsLabel: { fontSize: 12, color: colors.text2, marginBottom: 4 },
  quickQ: { backgroundColor: colors.card2, borderRadius: radius.sm, padding: 12, borderWidth: 1, borderColor: colors.border },
  quickQText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  inputWrap: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg2 },
  input: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 14, color: colors.text, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.accent, borderRadius: radius.sm, width: 46, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#0a0a0f', fontSize: 20, fontWeight: '700' },
});
