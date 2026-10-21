import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, useWindowDimensions, Animated } from 'react-native';
import { Text, TextInput } from '../components/AppText';
import { DEMO, DEMO_COACH } from '../lib/demo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../data/constants';
import { useApp } from '../hooks/useApp';
import { SERVER_URL, fetchWithTimeout, errorKey } from '../lib/config';
import { useVoice } from '../hooks/useVoice';
import VoiceOverlay from '../components/VoiceOverlay';
import { useLang } from '../hooks/useLang';

function MicButton({ isListening, isProcessing, onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isListening) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulse,{toValue:1.25,duration:500,useNativeDriver:true}),
        Animated.timing(pulse,{toValue:1,   duration:500,useNativeDriver:true}),
      ])).start();
    } else { pulse.setValue(1); }
  }, [isListening]);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={isProcessing}>
      <Animated.View style={[mb.btn, isListening&&mb.btnActive, {transform:[{scale:pulse}]}]}>
        {isProcessing ? <ActivityIndicator size="small" color={colors.accent} /> : <Text style={{fontSize:20}}>🎤</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}
const mb = StyleSheet.create({
  btn:{width:46,height:46,borderRadius:23,backgroundColor:colors.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.border},
  btnActive:{backgroundColor:'rgba(126,255,160,0.2)',borderColor:colors.accent},
});

// "**Now:**" from the AI → bold "Now:" (the model sometimes uses markdown).
function renderBold(text) {
  return String(text).split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 ? <Text key={i} style={{ fontWeight:'800' }}>{part}</Text> : part.replace(/^#+\s*/gm, ''));
}

export default function CoachScreen({ navigation }) {
  const { today, goals, goals2, profile } = useApp();
  const { t, lang, back } = useLang();
  const QUICK_QS = [t('q1'), t('q2'), t('q3'), t('q4')];
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [messages, setMessages] = useState(DEMO ? DEMO_COACH : []);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const [error,    setError]    = useState(null);
  const scrollRef = useRef(null);

  const voice = useVoice({
    lang,
    onResult: (text) => {
      setInput('');
      sendMessage(text);
    },
  });

  function buildProfile() {
    return {
      goals: goals2||[], goalCalories:goals.calories, goalProtein:goals.protein,
      goalCarbs:goals.carbs, goalFat:goals.fat,
      todayCalories:today.calories, todayProtein:today.protein,
      meals:today.meals.map(m=>m.name),
      age:profile?.age, weightKg:profile?.weight_kg, heightCm:profile?.height_cm, gender:profile?.gender,
    };
  }

  async function sendMessage(msgOverride) {
    const text = (msgOverride||input).trim();
    if (!text||thinking) return;
    setInput(''); setError(null);
    const updated = [...messages, {role:'user',content:text}];
    setMessages(updated); setThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({animated:true}), 50);
    try {
      const res = await fetchWithTimeout(`${SERVER_URL}/chat`,{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:updated, profile:buildProfile(), lang}),
      });
      if (!res.ok) { const err=await res.json().catch(()=>({})); throw new Error(errorKey(res.status, err) || 'estimateFailed'); }
      const data = await res.json();
      setMessages(prev => [...prev, {role:'assistant',content:data.reply}]);
    } catch (err) {
      setError(err.message.includes('fetch')||err.message.includes('Server')||err.name==='AbortError'
        ? t('serverDown')
        : t(err.message));
    } finally {
      setThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({animated:true}), 100);
    }
  }

  const displayMessages = [
    { role:'assistant', content:t('coachHello') },
    ...messages,
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={[s.header, isLandscape&&s.headerL]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <Text style={s.backText}>{back} {t('back')}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.title} numberOfLines={1}>{t('coachTitle')}</Text>
          {voice.isListening && <Text style={s.listeningSub}>{t('recording')}</Text>}
          {voice.isProcessing && <Text style={s.listeningSub}>{t('processing')}</Text>}
        </View>
        <View style={{width:70}} />
      </View>

      {/* Disclaimer banner */}
      <View style={s.disclaimer}>
        <Text style={s.disclaimerTxt}>{t('coachDisclaimer')}</Text>
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        <ScrollView ref={scrollRef} style={s.msgs}
          contentContainerStyle={[s.msgsContent, isLandscape&&{paddingHorizontal:60}]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated:true})}>
          {displayMessages.map((m, i) => (
            <View key={i} style={[s.msgWrap, m.role==='user'?s.userWrap:s.aiWrap]}>
              <View style={[s.bubble, m.role==='user'?s.userBubble:s.aiBubble]}>
                <Text style={[s.bubbleText, m.role==='user'&&{color:'#0a0a0f',fontWeight:'500'}]}>{renderBold(m.content)}</Text>
              </View>
            </View>
          ))}
          {thinking && (
            <View style={s.aiWrap}>
              <View style={[s.aiBubble,{flexDirection:'row',alignItems:'center',gap:8}]}>
                <ActivityIndicator size="small" color={colors.text2} />
                <Text style={{color:colors.text2,fontSize:13}}>{t('thinking')}</Text>
              </View>
            </View>
          )}
          {error && <View style={s.errorBox}><Text style={s.errorTxt}>⚠️ {error}</Text></View>}
          {voice.error && <View style={s.errorBox}><Text style={s.errorTxt}>🎤 {t(voice.error)}</Text></View>}
          {messages.length===0&&!thinking&&(
            <View style={{gap:8,marginTop:4}}>
              <Text style={{fontSize:12,color:colors.text2,marginBottom:2}}>{t('tryAsking')}</Text>
              {QUICK_QS.map(q=>(
                <TouchableOpacity key={q} style={s.quickQ} onPress={() => sendMessage(q)}>
                  <Text style={s.quickQText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
        <View style={[s.inputRow, isLandscape&&{paddingHorizontal:60}]}>
          <TextInput style={[s.input, voice.isListening&&s.inputListening]}
            value={input} onChangeText={setInput}
            placeholder={voice.isListening?t('recording'):t('askAnything')}
            placeholderTextColor={voice.isListening?colors.accent:colors.text3}
            multiline returnKeyType="send" onSubmitEditing={()=>sendMessage()} />
          <MicButton isListening={voice.isListening} isProcessing={voice.isProcessing}
            onPress={voice.isListening ? voice.stopListening : voice.startListening} />
          <TouchableOpacity style={[s.sendBtn,(thinking||voice.isListening)&&{opacity:0.5}]}
            onPress={()=>sendMessage()} disabled={thinking||voice.isListening}>
            <Text style={s.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <VoiceOverlay voice={voice} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.bg},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:colors.border},
  headerL:{paddingHorizontal:40},
  backBtn:{width:70}, backText:{color:colors.accent,fontSize:16,fontWeight:'600'},
  headerCenter:{flex:1,alignItems:'center'},
  title:{fontSize:16,fontWeight:'700',color:colors.text},
  listeningSub:{fontSize:11,color:colors.accent,marginTop:2},
  disclaimer:{backgroundColor:'rgba(0,212,255,0.05)',paddingHorizontal:14,paddingVertical:8,borderBottomWidth:1,borderBottomColor:'rgba(0,212,255,0.15)'},
  disclaimerTxt:{fontSize:10,color:colors.text3,lineHeight:15},
  msgs:{flex:1},
  msgsContent:{padding:16,gap:12},
  msgWrap:{maxWidth:'85%'}, userWrap:{alignSelf:'flex-end'}, aiWrap:{alignSelf:'flex-start'},
  bubble:{padding:12,borderRadius:16},
  userBubble:{backgroundColor:colors.accent,borderTopRightRadius:4},
  aiBubble:{backgroundColor:colors.card,borderTopLeftRadius:4,borderWidth:1,borderColor:colors.border,padding:12,borderRadius:16},
  bubbleText:{color:colors.text,fontSize:14,lineHeight:22},
  errorBox:{backgroundColor:'rgba(255,140,66,0.1)',borderRadius:12,padding:12,borderWidth:1,borderColor:'rgba(255,140,66,0.3)'},
  errorTxt:{color:colors.orange,fontSize:13,lineHeight:20},
  quickQ:{backgroundColor:colors.card2,borderRadius:radius.sm,padding:12,borderWidth:1,borderColor:colors.border},
  quickQText:{fontSize:13,color:colors.text,fontWeight:'500'},
  inputRow:{flexDirection:'row',padding:10,gap:8,borderTopWidth:1,borderTopColor:colors.border,backgroundColor:colors.bg2,alignItems:'flex-end'},
  input:{flex:1,backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:radius.sm,padding:12,fontSize:14,color:colors.text,maxHeight:100},
  inputListening:{borderColor:colors.accent,backgroundColor:'rgba(126,255,160,0.06)'},
  sendBtn:{backgroundColor:colors.accent,borderRadius:radius.sm,width:46,height:46,alignItems:'center',justifyContent:'center'},
  sendText:{color:'#0a0a0f',fontSize:20,fontWeight:'700'},
});
