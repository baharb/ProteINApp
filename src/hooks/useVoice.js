import { useState, useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { SERVER_URL, authHeaders, errorKey } from '../lib/config';

// error is an i18n key (show it with t()).
// Below this the recording is treated as silence. Normal speech near the mic is about -30 to -10 dBFS.
const SILENCE_DB = -45;
const MAX_SECONDS = 60;   // stop on its own after a minute

export function useVoice({ onResult, lang }) {
  const [isListening,  setIsListening]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState(null);
  const [level,        setLevel]        = useState(0);     // 0..1, how loud right now (for the meter)
  const [seconds,      setSeconds]      = useState(0);
  const [heard,        setHeard]        = useState('');    // last recognized text
  const recordingRef = useRef(null);
  const loudestRef   = useRef(null);   // loudest level heard (dBFS) — to skip silent recordings; null = device gave no levels
  const stopRef      = useRef(null);

  const startListening = useCallback(async () => {
    try {
      setError(null); setHeard(''); setLevel(0); setSeconds(0);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError('micDenied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS:true, playsInSilentModeIOS:true });
      loudestRef.current = null;
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: { extension:'.m4a', outputFormat:2, audioEncoder:3, sampleRate:16000, numberOfChannels:1, bitRate:64000 },
        ios: { extension:'.m4a', audioQuality:127, sampleRate:16000, numberOfChannels:1, bitRate:64000, linearPCMBitDepth:16, linearPCMIsBigEndian:false, linearPCMIsFloat:false },
        web: {},
      }, (st) => {
        if (st.metering != null) {
          if (loudestRef.current == null || st.metering > loudestRef.current) loudestRef.current = st.metering;
          setLevel(Math.max(0, Math.min(1, (st.metering + 50) / 45)));   // -50 dB → 0, -5 dB → 1
        }
        if (st.durationMillis != null) {
          const s = Math.floor(st.durationMillis / 1000);
          setSeconds(s);
          if (s >= MAX_SECONDS) stopRef.current?.();
        }
      }, 150);
      recordingRef.current = recording;
      setIsListening(true);
    } catch(e) { console.warn('mic start:', e.message); setError('voiceFailed'); }
  }, []);

  // Stop recording; send = false throws the recording away (Cancel).
  const finish = useCallback(async (send) => {
    if (!recordingRef.current) return;
    const rec = recordingRef.current;
    recordingRef.current = null;
    setIsListening(false); setLevel(0);
    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS:false });
      if (!send) return;
      setIsProcessing(true);
      const uri = rec.getURI();
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
      // Close the recording panel before the caller opens its own sheet.
      setIsProcessing(false);
      if (text) { setHeard(text); onResult?.(text); } else setError('voiceFailed');
    } catch(e) { setError(e.message === 'Network request failed' ? 'cantReach' : (e.message || 'voiceFailed')); }
    finally { setIsProcessing(false); }
  }, [onResult, lang]);

  const stopListening   = useCallback(() => finish(true),  [finish]);
  const cancelListening = useCallback(() => finish(false), [finish]);
  stopRef.current = stopListening;

  // Leaving the screen mid-recording: release the microphone.
  useEffect(() => () => { recordingRef.current?.stopAndUnloadAsync().catch(() => {}); }, []);

  return { isListening, isProcessing, error, level, seconds, heard, startListening, stopListening, cancelListening };
}
