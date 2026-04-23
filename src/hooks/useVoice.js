import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';
import { SERVER_URL } from '../lib/config';

export function useVoice({ onResult }) {
  const [isListening,  setIsListening]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error,        setError]        = useState(null);
  const recordingRef = useRef(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) { setError('Microphone permission denied'); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync({
        android: { extension:'.m4a', outputFormat:2, audioEncoder:3, sampleRate:16000, numberOfChannels:1, bitRate:64000 },
        ios: { extension:'.m4a', audioQuality:127, sampleRate:16000, numberOfChannels:1, bitRate:64000, linearPCMBitDepth:16, linearPCMIsBigEndian:false, linearPCMIsFloat:false },
        web: {},
      });
      recordingRef.current = recording;
      setIsListening(true);
    } catch (e) { setError('Could not start mic: ' + e.message); }
  }, []);

  const stopListening = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      setIsListening(false); setIsProcessing(true);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (!uri) return;
      const formData = new FormData();
      formData.append('audio', { uri, type:'audio/m4a', name:'voice.m4a' });
      const res = await fetch(`${SERVER_URL}/transcribe`, { method:'POST', body:formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Transcription failed');
      const text = data.text?.trim();
      if (text) onResult?.(text);
    } catch (e) { setError('Voice error: ' + e.message); }
    finally { setIsProcessing(false); }
  }, [onResult]);

  return { isListening, isProcessing, error, startListening, stopListening };
}
