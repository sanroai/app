'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Voice input for the chat composer, on the browser's own SpeechRecognition.
 *
 * No dependency and no server round trip: Chrome/Edge expose `SpeechRecognition`
 * (Safari has `webkitSpeechRecognition`, Firefox has neither). When the API is
 * missing `supported` is false and the caller hides the button instead of showing
 * a control that cannot work.
 *
 * The interim transcript is streamed so the words appear as they are spoken, and a
 * *final* result is handed back so the caller can send it - which is what "ask by
 * voice" means to a student: speak, and the question goes.
 */

type SpeechRecognitionAlternative = { transcript: string };
type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
  length: number;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResult };
};
type SpeechRecognitionErrorLike = { error: string; message?: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** The message a student should see for a given recognition failure. */
export function speechErrorMessage(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in your browser settings to ask by voice.';
    case 'no-speech':
      return 'I did not hear anything — tap the mic and speak again.';
    case 'audio-capture':
      return 'No microphone was found on this device.';
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
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Kept in a ref so the recognition callbacks never close over a stale function.
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new Ctor();
    recognition.lang = lang;
    // `continuous` keeps the mic open across a natural pause so a sentence with a
    // comma is not cut in half; `interimResults` is what makes it feel live.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = '';

    recognition.onresult = (event) => {
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterim(interimText || finalText);
    };

    recognition.onerror = (event) => {
      const message = speechErrorMessage(event.error);
      if (message) setError(message);
      setListening(false);
      setInterim('');
    };

    recognition.onend = () => {
      setListening(false);
      setInterim('');
      const text = finalText.trim();
      if (text) onFinalRef.current?.(text);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError(null);
    setInterim('');
    setListening(true);
    try {
      recognition.start();
    } catch {
      // A second start() before the previous session ended throws; treat it as a stop.
      setListening(false);
      recognitionRef.current = null;
    }
  }, [lang]);

  return { supported, listening, interim, error, start, stop, clearError: () => setError(null) };
}
