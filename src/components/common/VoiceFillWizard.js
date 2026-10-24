import { useState, useEffect } from 'react';
import useVoiceInput from '../../hooks/useVoiceInput';
import { normalizeVoice } from '../../utils/voiceNormalizer';

const VoiceFillWizard = ({ fields, onComplete, onCancel, voiceLang = 'en-ZA' }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [confirmed, setConfirmed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const current = fields[stepIndex];

  const {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
  } = useVoiceInput({ lang: voiceLang });

  useEffect(() => {
    if (!supported) return;
    if (confirmed) return;
    if (editing) return;
    const t = setTimeout(() => {
      reset();
      start();
    }, 300);
    return () => {
      clearTimeout(t);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, supported, confirmed, editing]);

  useEffect(() => {
    if (listening) return;
    if (!transcript) return;
    if (confirmed) return;
    if (editing) return;
    setConfirmed(true);
  }, [listening, transcript, confirmed, editing]);

  const advance = (nextValues) => {
    if (stepIndex + 1 >= fields.length) {
      onComplete(nextValues);
    } else {
      setConfirmed(false);
      setEditing(false);
      reset();
      setStepIndex(stepIndex + 1);
    }
  };

  const handleYes = () => {
    const cleaned = normalizeVoice(current.type, transcript);
    const next = { ...values, [current.key]: cleaned };
    setValues(next);
    advance(next);
  };

  const handleEdit = () => {
    setEditText(transcript);
    setEditing(true);
    setConfirmed(false);
  };

  const handleEditSave = () => {
    const cleaned = normalizeVoice(current.type, editText);
    const next = { ...values, [current.key]: cleaned };
    setValues(next);
    setEditing(false);
    advance(next);
  };

  const handleRetry = () => {
    setConfirmed(false);
    reset();
    start();
  };

  const handleSkip = () => {
    const next = { ...values, [current.key]: '' };
    setValues(next);
    advance(next);
  };

  if (!supported) {
    return (
      <Backdrop>
        <Card>
          <h2 style={{ color: '#8b0000', marginTop: 0 }}>Voice input not available</h2>
          <p style={{ color: '#666' }}>
            Your browser doesn't support voice input. Please use Chrome, Edge, or Safari on a modern device.
            You can still fill the form by typing.
          </p>
          <button onClick={onCancel} style={btnPrimary}>Close</button>
        </Card>
      </Backdrop>
    );
  }

  const progress = ((stepIndex + 1) / fields.length) * 100;

  return (
    <Backdrop>
      <div style={{ maxWidth: 620, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{
            height: 8,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #ffcc00 0%, #ff9900 100%)',
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            marginTop: 8,
            fontSize: 13,
            color: 'white',
            textAlign: 'center',
            fontWeight: 'bold',
            letterSpacing: 1,
          }}>
            STEP {stepIndex + 1} OF {fields.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              {current.icon || '🎤'}
            </div>
            <h2 style={{
              color: '#003366',
              margin: 0,
              fontSize: 24,
              lineHeight: 1.35,
            }}>
              {current.prompt}
            </h2>
            {current.example && (
              <p style={{
                color: '#666',
                fontSize: 14,
                margin: '12px 0 0',
                fontStyle: 'italic',
              }}>
                Example: "{current.example}"
              </p>
            )}
          </div>

          {error && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffcccc',
              color: '#cc0000',
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {!confirmed && !editing && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              {listening ? (
                <>
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #006600 0%, #00a050 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 40,
                    animation: 'voicePulse 1.4s ease-in-out infinite',
                  }}>
                    🎤
                  </div>
                  <div style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#006600',
                    marginBottom: 8,
                  }}>
                    Listening...
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    Speak clearly. Tap <strong>Done</strong> when you finish.
                  </div>

                  {transcript && (
                    <div style={{
                      marginTop: 20,
                      background: '#f0f6ff',
                      borderRadius: 8,
                      padding: 14,
                      fontSize: 15,
                      color: '#003366',
                      fontStyle: 'italic',
                      minHeight: 40,
                    }}>
                      "{transcript}"
                    </div>
                  )}

                  <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={stop}
                      disabled={!transcript}
                      style={{
                        background: transcript
                          ? 'linear-gradient(135deg, #006600 0%, #00a050 100%)'
                          : '#ccc',
                        color: 'white',
                        border: 'none',
                        padding: '14px 32px',
                        borderRadius: 999,
                        fontSize: 16,
                        fontWeight: 'bold',
                        cursor: transcript ? 'pointer' : 'not-allowed',
                        minHeight: 56,
                      }}
                    >
                      ✓ Done speaking
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 90,
                    height: 90,
                    borderRadius: '50%',
                    background: '#f0f6ff',
                    color: '#003366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    fontSize: 40,
                  }}>
                    🎤
                  </div>
                  <div style={{ fontSize: 16, color: '#666', marginBottom: 20 }}>
                    Tap below to start speaking.
                  </div>
                  <button onClick={handleRetry} style={{
                    background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '16px 36px',
                    borderRadius: 999,
                    fontSize: 16,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minHeight: 56,
                  }}>
                    🎤 Start listening
                  </button>
                </>
              )}
            </div>
          )}

          {confirmed && !editing && (
            <div>
              <div style={{
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Did I hear that right?
              </div>
              <div style={{
                background: '#f0f6ff',
                border: '2px solid #cce0ff',
                borderRadius: 10,
                padding: 20,
                fontSize: 20,
                fontWeight: 'bold',
                color: '#003366',
                textAlign: 'center',
                marginBottom: 24,
                wordBreak: 'break-word',
              }}>
                {normalizeVoice(current.type, transcript) || '(nothing)'}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
              }}>
                <button onClick={handleYes} style={btnGreen}>✅ Yes</button>
                <button onClick={handleEdit} style={btnBlue}>✏️ Edit</button>
                <button onClick={handleRetry} style={btnAmber}>🔁 Retry</button>
              </div>
            </div>
          )}

          {editing && (
            <div>
              <div style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 8,
              }}>
                Edit your answer:
              </div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
                style={{
                  width: '100%',
                  padding: 14,
                  fontSize: 16,
                  border: '2px solid #cce0ff',
                  borderRadius: 10,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  marginBottom: 16,
                }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(false)} style={btnSecondary}>
                  Back
                </button>
                <button onClick={handleEditSave} style={btnGreen}>
                  ✓ Save & continue
                </button>
              </div>
            </div>
          )}

          <div style={{
            marginTop: 28,
            paddingTop: 20,
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <button
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888',
                fontSize: 14,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 8,
              }}
            >
              Skip this field
            </button>
            <button
              onClick={onCancel}
              style={{
                background: 'transparent',
                border: '1px solid #ccc',
                color: '#666',
                padding: '8px 18px',
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel voice fill
            </button>
          </div>
        </div>

        <style>{`
          @keyframes voicePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(0, 160, 80, 0.6); }
            50% { box-shadow: 0 0 0 20px rgba(0, 160, 80, 0); }
          }
        `}</style>
      </div>
    </Backdrop>
  );
};

const Backdrop = ({ children }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 20, 45, 0.92)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    overflowY: 'auto',
  }}>
    {children}
  </div>
);

const Card = ({ children }) => (
  <div style={{
    background: 'white',
    borderRadius: 20,
    padding: 40,
    maxWidth: 500,
    textAlign: 'center',
  }}>
    {children}
  </div>
);

const btnPrimary = {
  background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
  color: 'white',
  border: 'none',
  padding: '14px 32px',
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  minHeight: 56,
};

const btnGreen = {
  background: 'linear-gradient(135deg, #006600 0%, #00a050 100%)',
  color: 'white',
  border: 'none',
  padding: '14px 24px',
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  minHeight: 56,
};

const btnBlue = {
  background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
  color: 'white',
  border: 'none',
  padding: '14px 24px',
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  minHeight: 56,
};

const btnAmber = {
  background: 'linear-gradient(135deg, #cc6600 0%, #ff9900 100%)',
  color: 'white',
  border: 'none',
  padding: '14px 24px',
  borderRadius: 999,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: 'pointer',
  minHeight: 56,
};

const btnSecondary = {
  background: 'white',
  color: '#003366',
  border: '1px solid #003366',
  padding: '12px 24px',
  borderRadius: 999,
  fontSize: 14,
  cursor: 'pointer',
  minHeight: 48,
};

export default VoiceFillWizard;