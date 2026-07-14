'use client';

import React, { useEffect, useState } from 'react';
import { 
  X, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  Infinity as InfIcon, Zap, Play, Square 
} from 'lucide-react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import useSpeech from '@/hooks/useSpeech';
import Waveform from './Waveform';
import styles from './VoiceOverlay.module.css';

export default function VoiceOverlay() {
  const { 
    isListening, 
    isSpeaking, 
    isContinuous, 
    transcript, 
    handsFreeMode,
    setIsContinuous,
    setHandsFreeMode
  } = useVoiceStore();

  const { voiceModeActive, setVoiceModeActive } = useUIStore();
  const { speechSpeed, speechVoice, setSpeechSpeed, setSpeechVoice } = useSettingsStore();

  const { 
    startListening, 
    stopListening, 
    cancelSpeaking, 
    submitSpeech 
  } = useSpeech();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load Speech Voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // Filter english voices or common voices for simplicity
        const englishVoices = voices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('es'));
        setAvailableVoices(englishVoices.length > 0 ? englishVoices : voices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Auto-start listening on mount
  useEffect(() => {
    if (voiceModeActive) {
      // Small timeout to allow transition
      const timer = setTimeout(() => {
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [voiceModeActive]);

  // Handle Spacebar shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (isListening) {
          stopListening();
        } else {
          startListening();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening]);

  if (!voiceModeActive) return null;

  const handleSphereClick = () => {
    // If speaking, clicking interrupts speaking and starts listening
    if (isSpeaking) {
      cancelSpeaking();
      startListening();
    } else if (isListening) {
      // If listening, submit text or stop listening
      if (transcript.trim()) {
        submitSpeech();
      } else {
        stopListening();
      }
    } else {
      // If quiet, start listening
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    cancelSpeaking();
    setVoiceModeActive(false);
  };

  const getStatusText = () => {
    if (isSpeaking) return 'Grok is speaking...';
    if (isListening) {
      return transcript.trim() ? 'Listening to prompt...' : 'Listening...';
    }
    return 'Tap sphere to talk';
  };

  return (
    <div className={styles.overlay}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.title}>
          <Sparkles size={20} />
          <span>Grok Voice Mode</span>
        </div>
        <button className={styles.closeBtn} onClick={handleClose} title="Exit Voice Mode">
          <X size={20} />
        </button>
      </header>

      {/* Waveform Sphere Container */}
      <div className={styles.waveformContainer}>
        <div 
          className={`${styles.waveSphere} ${isListening ? styles.waveSphereListening : ''} ${isSpeaking ? styles.waveSphereSpeaking : ''}`}
          onClick={handleSphereClick}
          title={isSpeaking ? "Interrupt Grok" : "Mute / Speak"}
        >
          <Waveform />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <h3 className={styles.statusText}>{getStatusText()}</h3>
          <p className={styles.transcriptText}>
            {transcript ? `"${transcript}"` : isListening ? 'Say something...' : 'Tap the sphere and start speaking'}
          </p>
        </div>
      </div>

      {/* Bottom Settings Controls Panel */}
      <div className={styles.footerControls}>
        <div className={styles.settingsRow}>
          {/* Voice Select */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Choose Voice</label>
            <select 
              className={styles.select}
              value={speechVoice}
              onChange={(e) => setSpeechVoice(e.target.value)}
            >
              <option value="">Default Voice</option>
              {availableVoices.map((voice, idx) => (
                <option key={idx} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed slider */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Speech Speed: {speechSpeed}x</label>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1"
              value={speechSpeed}
              onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>

        {/* Buttons Controls */}
        <div className={styles.buttonsGroup}>
          {/* Continuous Loop Mode */}
          <button 
            className={`${styles.circleBtn} ${isContinuous ? styles.circleBtnActive : ''}`}
            onClick={() => setIsContinuous(!isContinuous)}
            title={isContinuous ? "Disable Continuous Listening" : "Enable Continuous Listening"}
          >
            <InfIcon size={20} />
          </button>

          {/* Core Mic Toggle Button */}
          <button 
            className={`${styles.circleBtn} ${styles.micBtn} ${isListening ? styles.micBtnListening : ''}`}
            onClick={isListening ? stopListening : startListening}
            title={isListening ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isListening ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          {/* Hands Free VAD Mode */}
          <button 
            className={`${styles.circleBtn} ${handsFreeMode ? styles.circleBtnActive : ''}`}
            onClick={() => setHandsFreeMode(!handsFreeMode)}
            title={handsFreeMode ? "Disable Hands-Free VAD" : "Enable Hands-Free VAD (Auto-Response)"}
          >
            <Zap size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
