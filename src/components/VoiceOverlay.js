import React, { useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Animated, ActivityIndicator, Easing } from 'react-native';
import { Text } from './AppText';
import { C, R } from '../data/theme';
import { useLang } from '../hooks/useLang';

// Full-screen "recording" panel for voice input: a pulsing mic, a live level
// meter and a timer while listening, then "Recognizing…" while the speech is
// turned into text. Uses the state from useVoice().
export default function VoiceOverlay({ voice }) {
  const { t } = useLang();
  const visible = voice.isListening || voice.isProcessing;

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!voice.isListening) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [voice.isListening]);

  const mm = Math.floor(voice.seconds / 60), ss = String(voice.seconds % 60).padStart(2, '0');
  // five bars; the middle ones react most, so it looks like a voice meter
  const bars = [0.45, 0.75, 1, 0.75, 0.45].map(w => 6 + Math.round(42 * Math.min(1, voice.level * w + 0.08)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={voice.cancelListening}>
      <View style={s.backdrop}>
        <View style={s.panel}>
          {voice.isListening ? (
            <>
              <View style={s.micWrap}>
                <Animated.View style={[s.ring, {
                  opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                  transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                }]} />
                <View style={s.mic}><Text style={s.micIcon}>🎤</Text></View>
              </View>
              <View style={s.recRow}>
                <View style={s.recDot} />
                <Text style={s.recTxt}>{t('recNow')} · {mm}:{ss}</Text>
              </View>
              <View style={s.meter}>
                {bars.map((h, i) => <View key={i} style={[s.bar, { height: h }]} />)}
              </View>
              <Text style={s.hint}>{t('voiceHint')}</Text>
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={voice.cancelListening} activeOpacity={0.85}>
                  <Text style={s.btnGhostTxt}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnMain]} onPress={voice.stopListening} activeOpacity={0.9}>
                  <Text style={s.btnMainTxt}>✓  {t('done')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color={C.primary} style={{ marginVertical: 24 }} />
              <Text style={s.recTxt}>{t('recognizing')}</Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:   { flex:1, backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center', padding:24 },
  panel:      { width:'100%', maxWidth:420, backgroundColor:C.card, borderRadius:R.xl, borderWidth:1, borderColor:C.border, paddingVertical:28, paddingHorizontal:22, alignItems:'center' },
  micWrap:    { width:120, height:120, alignItems:'center', justifyContent:'center', marginBottom:14 },
  ring:       { position:'absolute', width:110, height:110, borderRadius:55, backgroundColor:C.primary },
  mic:        { width:96, height:96, borderRadius:48, backgroundColor:C.primary, alignItems:'center', justifyContent:'center' },
  micIcon:    { fontSize:42 },
  recRow:     { flexDirection:'row', alignItems:'center', gap:8 },
  recDot:     { width:10, height:10, borderRadius:5, backgroundColor:C.danger || '#F87171' },
  recTxt:     { fontSize:17, fontWeight:'800', color:C.text },
  meter:      { flexDirection:'row', alignItems:'center', gap:6, height:52, marginVertical:14 },
  bar:        { width:8, borderRadius:4, backgroundColor:C.primary },
  hint:       { fontSize:14, color:C.text2, textAlign:'center', marginBottom:22, lineHeight:20 },
  btnRow:     { flexDirection:'row', gap:10, alignSelf:'stretch' },
  btn:        { flex:1, height:50, borderRadius:R.md, alignItems:'center', justifyContent:'center' },
  btnGhost:   { borderWidth:1, borderColor:C.border, backgroundColor:C.card2 },
  btnGhostTxt:{ fontSize:15, fontWeight:'700', color:C.text },
  btnMain:    { backgroundColor:C.primary },
  btnMainTxt: { fontSize:16, fontWeight:'900', color:'#0B0F14' },
});
