import React, { useEffect, useRef, useState } from 'react';

const playTone = (context, frequency, start, duration, volume, type = 'sine') => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
};

export const CampusClashLoader = ({ isExiting = false }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioContextRef = useRef(null);

  const playSequence = (force = false) => {
    if (isMuted && !force) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = audioContextRef.current || new AudioContext();
    audioContextRef.current = context;
    context.resume().then(() => {
      const start = context.currentTime;
      playTone(context, 360, start, 0.1, 0.025, 'sine');
      playTone(context, 720, start + 0.12, 0.07, 0.035, 'square');
      playTone(context, 120, start + 0.52, 0.12, 0.045, 'triangle');
    }).catch(() => {});
  };

  useEffect(() => {
    if (!isMuted) playSequence();
  }, [isMuted]);

  useEffect(() => () => audioContextRef.current?.close(), []);

  const handleSoundToggle = () => {
    if (isMuted) playSequence(true);
    setIsMuted((muted) => !muted);
  };

  return (
    <div className={`campusclash-loader ${isExiting ? 'is-exiting' : ''}`} role="status" aria-live="polite" aria-label="Loading Playr-Pool">
      <button type="button" className="loader-sound" onClick={handleSoundToggle} aria-pressed={!isMuted}>
        {isMuted ? '🔇 Sound off' : '🔊 Sound on'}
      </button>
      <div className="loader-particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
      </div>
      <div className="loader-trail loader-trail-one" aria-hidden="true" />
      <div className="loader-trail loader-trail-two" aria-hidden="true" />
      <div className="loader-mark" aria-hidden="true" style={{ overflow: 'hidden', padding: 0, borderRadius: '50%', border: '2px solid rgba(230, 189, 84, 0.75)', boxShadow: '0 0 25px rgba(230, 189, 84, 0.45)' }}>
        <img src="/logo.jpg" alt="Playr-Pool" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <h1>Playr<span>-Pool</span></h1>
      <p style={{ color: 'var(--text-secondary, #94a3b8)', letterSpacing: '0.15em', fontSize: '0.8rem', textTransform: 'uppercase', marginTop: '-0.3rem', marginBottom: '0.5rem', fontWeight: 600 }}>Connect · Play · Conquer</p>
      <div className="loader-progress" aria-label="Loading progress" aria-valuetext="Loading complete" />
    </div>
  );
};
