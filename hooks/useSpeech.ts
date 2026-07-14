'use client';

import { useEffect, useRef } from 'react';
import { useVoiceStore } from '@/store/useVoiceStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';

export default function useSpeech() {
  const { 
    isListening, 
    isSpeaking, 
    isContinuous, 
    transcript,
    handsFreeMode,
    setIsListening, 
    setIsSpeaking, 
    setTranscript, 
    setSoundLevel,
    resetVoiceState 
  } = useVoiceStore();

  const { speechSpeed, speechVoice } = useSettingsStore();
  const { sendMessage, isStreaming } = useChatStore();

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const javascriptNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize Speech Synthesis and Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const currentText = finalTranscript || interimTranscript;
          setTranscript(currentText);

          // Voice Interruption VAD
          // If Grok is speaking and the user starts speaking, interrupt Grok immediately!
          if (isSpeaking && currentText.trim().length > 1) {
            cancelSpeaking();
          }
        };

        rec.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'no-speech') return;
        };

        rec.onend = () => {
          // Restart if continuous mode is enabled and we didn't manually stop
          if (isContinuous && isListening) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              // Ignore already started errors
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      stopListening();
      cancelSpeaking();
    };
  }, [isContinuous]);

  // Audio Context waveform visualizer level
  const startVolumeAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;

      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);
      javascriptNodeRef.current = javascriptNode;

      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);
      microphone.connect(analyser);

      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;

        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }

        const average = values / length;
        setSoundLevel(average); // 0 to 100 level indicator
      };
    } catch (e) {
      console.warn('Failed to start volume analyser:', e);
    }
  };

  const stopVolumeAnalyser = () => {
    if (javascriptNodeRef.current) javascriptNodeRef.current.disconnect();
    if (microphoneRef.current) microphoneRef.current.disconnect();
    if (analyserRef.current) analyserRef.current.disconnect();
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setSoundLevel(0);
  };

  // Actions
  const startListening = async () => {
    cancelSpeaking();
    if (recognitionRef.current) {
      try {
        setTranscript('');
        recognitionRef.current.start();
        await startVolumeAnalyser();
      } catch (e) {
        console.warn('Recognition start failed:', e);
      }
    } else {
      console.warn('Speech recognition is not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopVolumeAnalyser();
    setIsListening(false);
  };

  // Text to Speech
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    
    // Stop any current voice speaking
    synthRef.current.cancel();

    // Clean markdown characters from text for clean speech synthesis
    const cleanText = text
      .replace(/[\*\#\`\_]/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // remove link urls
      .slice(0, 400); // limit speech snippet size for responsiveness

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechSpeed;
    
    // Pick configured voice
    if (speechVoice) {
      const voices = synthRef.current.getVoices();
      const selected = voices.find((v) => v.name === speechVoice);
      if (selected) utterance.voice = selected;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Continuous VAD Mode: If hands-free is enabled, start listening again automatically after speaking completes!
      if (handsFreeMode && isContinuous) {
        setTimeout(() => {
          startListening();
        }, 300);
      }
    };

    utterance.onerror = (e) => {
      console.error('SpeechSynthesis error:', e);
      setIsSpeaking(false);
    };

    synthRef.current.speak(utterance);
  };

  const cancelSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  };

  // Voice Form submission
  const submitSpeech = async () => {
    const speechContent = transcript.trim();
    if (!speechContent) return;

    stopListening();
    resetVoiceState();

    // Send content
    await sendMessage(speechContent);
  };

  return {
    startListening,
    stopListening,
    speakText,
    cancelSpeaking,
    submitSpeech,
    isListening,
    isSpeaking,
    transcript,
    handsFreeMode,
  };
}
