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
    <div className={`campusclash-loader ${isExiting ? 'is-exiting' : ''}`} role="status" aria-live="polite" aria-label="Loading CampusClash">
      <button type="button" className="loader-sound" onClick={handleSoundToggle} aria-pressed={!isMuted}>
        {isMuted ? '🔇 Sound off' : '🔊 Sound on'}
      </button>
      <div className="loader-particles" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => <span key={index} />)}
      </div>
      <div className="loader-trail loader-trail-one" aria-hidden="true" />
      <div className="loader-trail loader-trail-two" aria-hidden="true" />
      <div className="loader-mark" aria-hidden="true"><span>CC</span></div>
      <h1>Campus<span>Clash</span></h1>
      <div className="loader-progress" aria-label="Loading progress" aria-valuetext="Loading complete" />
    </div>
  );
};
