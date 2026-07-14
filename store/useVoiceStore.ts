import { create } from 'zustand';

interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isContinuous: boolean;
  soundLevel: number;
  transcript: string;
  handsFreeMode: boolean;

  setIsListening: (isListening: boolean) => void;
  setIsSpeaking: (isSpeaking: boolean) => void;
  setIsContinuous: (isContinuous: boolean) => void;
  setSoundLevel: (level: number) => void;
  setTranscript: (text: string) => void;
  setHandsFreeMode: (enabled: boolean) => void;
  resetVoiceState: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isListening: false,
  isSpeaking: false,
  isContinuous: false,
  soundLevel: 0,
  transcript: '',
  handsFreeMode: false,

  setIsListening: (isListening) => set({ isListening }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsContinuous: (isContinuous) => set({ isContinuous }),
  setSoundLevel: (soundLevel) => set({ soundLevel }),
  setTranscript: (transcript) => set({ transcript }),
  setHandsFreeMode: (handsFreeMode) => set({ handsFreeMode }),
  
  resetVoiceState: () =>
    set({
      isListening: false,
      isSpeaking: false,
      isContinuous: false,
      soundLevel: 0,
      transcript: '',
    }),
}));
