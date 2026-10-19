import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { SERVER_URL, authHeaders, errorKey } from '../lib/config';

// error is an i18n key (show it with t()).
// Below this the recording is treated as silence. Normal speech near the mic is about -30 to -10 dBFS.
const SILENCE_DB = -45;

export function useVoice({ onResult, lang }) {
  const [isListening,  setIsListening]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState(null);
  const recordingRef = useRef(null);
  const loudestRef   = useRef(null);   // loudest level heard (dBFS) — to skip silent recordings; null = device gave no levels

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError('micDenied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS:true, playsInSilentModeIOS:true });
      loudestRef.current = null;
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: { extension:'.m4a', outputFormat:2, audioEncoder:3, sampleRate:16000, numberOfChannels:1, bitRate:64000 },
        ios: { extension:'.m4a', audioQuality:127, sampleRate:16000, numberOfChannels:1, bitRate:64000, linearPCMBitDepth:16, linearPCMIsBigEndian:false, linearPCMIsFloat:false },
        web: {},
      }, (st) => { if (st.metering != null && (loudestRef.current == null || st.metering > loudestRef.current)) loudestRef.current = st.metering; }, 200);
      recordingRef.current = recording;
      setIsListening(true);
    } catch(e) { console.warn('mic start:', e.message); setError('voiceFailed'); }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      setIsListening(false); setIsProcessing(true);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS:false });
      if (!uri) return;
      // Nothing was said (or only quiet background noise): don't send it —
      // speech-to-text invents words for silence.
      if (loudestRef.current != null && loudestRef.current < SILENCE_DB) { setError('voiceFailed'); return; }
      const formData = new FormData();
      formData.append('audio', { uri, type:'audio/m4a', name:'voice.m4a' });
      formData.append('lang', lang || 'en');
      const res = await fetch(`${SERVER_URL}/transcribe`, { method:'POST', body:formData, headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok||data.error) throw new Error(errorKey(res.status, data)||'voiceFailed');
      const text = data.text?.trim();
      if (text) onResult?.(text); else setError('voiceFailed');
    } catch(e) { setError(e.message === 'Network request failed' ? 'cantReach' : (e.message || 'voiceFailed')); }
    finally { setIsProcessing(false); }
  }, [onResult, lang]);

  return { isListening, isProcessing, error, startListening, stopListening };
}
