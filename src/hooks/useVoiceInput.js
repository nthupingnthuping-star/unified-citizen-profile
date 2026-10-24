import { useState, useRef, useCallback, useEffect } from 'react';

// ============================================================
// useVoiceInput
// Wraps the browser's SpeechRecognition API in a React-friendly hook.
//
// Usage:
//   const { supported, listening, transcript, error, start, stop, reset } = useVoiceInput({ lang });
//
// - `supported` is false on Firefox and old browsers → hide the button.
// - `listening` is true while the mic is active.
// - `transcript` updates live as the user speaks.
// - `error` holds a user-facing message if something goes wrong.
// ============================================================

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export const useVoiceInput = ({ lang = 'en-ZA', continuous = false } = {}) => {
  const [supported] = useState(Boolean(SR));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* noop */ }
        recognitionRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* noop */ }
    }
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError('');
  }, []);

  const start = useCallback(() => {
    if (!SR) {
      setError('Voice input is not supported on this browser. Please type instead.');
      return;
    }

    // Cancel any previous session
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) { /* noop */ }
    }

    setError('');
    setTranscript('');

    const recognition = new SR();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript;
      }
      setTranscript(full.trim());
    };

    recognition.onerror = (event) => {
      setListening(false);
      const code = event.error || 'unknown';
      let msg = 'Voice input failed.';
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        msg = 'Microphone access was denied. Please allow it in your browser settings.';
      } else if (code === 'no-speech') {
        msg = "We didn't hear anything. Please try again.";
      } else if (code === 'network') {
        msg = 'Network error. Voice input needs an internet connection.';
      } else if (code === 'aborted') {
        msg = ''; // user-initiated, no error
      }
      setError(msg);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setError('Could not start the microphone. Please try again.');
      setListening(false);
    }
  }, [lang, continuous]);

  return { supported, listening, transcript, error, start, stop, reset };
};

export default useVoiceInput;