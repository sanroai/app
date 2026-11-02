import { useCallback, useRef, useState } from 'react';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';

/**
 * Voice input for the chat composer, on the device's own speech recogniser.
 *
 * `expo-speech-recognition` wraps Android's SpeechRecognizer / iOS's
 * SFSpeechRecognizer, so the audio never leaves the phone for our server and no
 * API key is involved. The interim transcript is streamed so words appear as the
 * student speaks, and a *final* result is handed back so the question can be sent —
 * "ask by voice" means speak and the question goes.
 *
 * The microphone permission is requested on the first tap, and a denied permission
 * is a readable message rather than a dead button.
 */

export function speechErrorMessage(code?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in Settings to ask by voice.';
    case 'no-speech':
    case 'no-match':
      return 'I did not catch that — tap the mic and speak again.';
    case 'network':
      return 'Voice input needs a connection. Check your internet and try again.';
    case 'aborted':
      return '';
    default:
      return 'Voice input stopped unexpectedly. Please type your question.';
  }
}

export function useSpeechRecognition({
  lang = 'en-IN',
  onFinal,
}: {
  lang?: string;
  /** Called once with the finished transcript. */
  onFinal?: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Kept in refs so the event handlers below never close over a stale callback.
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const finalRef = useRef('');

  const supported = (() => {
    try {
      return ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return false;
    }
  })();

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results?.[0]?.transcript ?? '';
    if (!text) return;
    if (event.isFinal) {
      finalRef.current = `${finalRef.current} ${text}`.trim();
      setInterim(finalRef.current);
    } else {
      setInterim(`${finalRef.current} ${text}`.trim());
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    const message = speechErrorMessage(event.error);
    if (message) setError(message);
    setListening(false);
    setInterim('');
  });

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    setInterim('');
    const text = finalRef.current.trim();
    finalRef.current = '';
    if (text) onFinalRef.current?.(text);
  });

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone access is blocked. Allow it in Settings to ask by voice.');
        return;
      }
      finalRef.current = '';
      setInterim('');
      setListening(true);
      ExpoSpeechRecognitionModule.start({
        lang,
        interimResults: true,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: true,
      });
    } catch {
      setListening(false);
      setError('Voice input could not start. Please type your question.');
    }
  }, [lang]);

  return {
    supported,
    listening,
    interim,
    error,
    start,
    stop,
    clearError: () => setError(null),
  };
}
