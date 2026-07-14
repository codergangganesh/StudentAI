import { create } from 'zustand';
import { supabase, GUEST_USER_ID } from '@/lib/supabase';

export type AppTheme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';

interface SettingsState {
  theme: AppTheme;
  model: string;
  temperature: number;
  fontSize: FontSize;
  speechSpeed: number;
  speechVoice: string;
  isSaving: boolean;

  setTheme: (theme: AppTheme) => void;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setFontSize: (size: FontSize) => void;
  setSpeechSpeed: (speed: number) => void;
  setSpeechVoice: (voice: string) => void;
  loadSettings: () => Promise<void>;
  saveSettings: (updates: Partial<Omit<SettingsState, 'isSaving' | 'setTheme' | 'setModel' | 'setTemperature' | 'setFontSize' | 'setSpeechSpeed' | 'setSpeechVoice' | 'loadSettings' | 'saveSettings'>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'system',
  model: 'grok-2-1212',
  temperature: 0.7,
  fontSize: 'md',
  speechSpeed: 1.0,
  speechVoice: '',
  isSaving: false,

  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    localStorage.setItem('theme', theme);
    get().saveSettings({ theme });
  },

  setModel: (model) => {
    set({ model });
    localStorage.setItem('model', model);
    get().saveSettings({ model });
  },

  setTemperature: (temperature) => {
    set({ temperature });
    localStorage.setItem('temperature', temperature.toString());
    get().saveSettings({ temperature });
  },

  setFontSize: (fontSize) => {
    set({ fontSize });
    applyFontSize(fontSize);
    localStorage.setItem('fontSize', fontSize);
    get().saveSettings({ fontSize });
  },

  setSpeechSpeed: (speechSpeed) => {
    set({ speechSpeed });
    localStorage.setItem('speechSpeed', speechSpeed.toString());
    get().saveSettings({ speechSpeed });
  },

  setSpeechVoice: (speechVoice) => {
    set({ speechVoice });
    localStorage.setItem('speechVoice', speechVoice);
    get().saveSettings({ speechVoice });
  },

  loadSettings: async () => {
    // 1. Load from localstorage for immediate render
    const localTheme = localStorage.getItem('theme') as AppTheme || 'system';
    const localModel = localStorage.getItem('model') || 'grok-2-1212';
    const localTemp = parseFloat(localStorage.getItem('temperature') || '0.7');
    const localFontSize = localStorage.getItem('fontSize') as FontSize || 'md';
    const localSpeechSpeed = parseFloat(localStorage.getItem('speechSpeed') || '1.0');
    const localSpeechVoice = localStorage.getItem('speechVoice') || '';

    set({
      theme: localTheme,
      model: localModel,
      temperature: localTemp,
      fontSize: localFontSize,
      speechSpeed: localSpeechSpeed,
      speechVoice: localSpeechVoice,
    });

    applyTheme(localTheme);
    applyFontSize(localFontSize);

    // 2. Load from Supabase in the background
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', GUEST_USER_ID)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({
          theme: data.theme as AppTheme,
          model: data.model,
          temperature: Number(data.temperature),
          fontSize: data.font_size as FontSize,
          speechSpeed: Number(data.speech_speed),
          speechVoice: data.speech_voice || '',
        });

        applyTheme(data.theme as AppTheme);
        applyFontSize(data.font_size as FontSize);

        // Update localstorage
        localStorage.setItem('theme', data.theme);
        localStorage.setItem('model', data.model);
        localStorage.setItem('temperature', data.temperature.toString());
        localStorage.setItem('fontSize', data.font_size);
        localStorage.setItem('speechSpeed', data.speech_speed.toString());
        if (data.speech_voice) localStorage.setItem('speechVoice', data.speech_voice);
      } else {
        // Create initial settings row if it doesn't exist
        await supabase.from('settings').insert({
          user_id: GUEST_USER_ID,
          theme: localTheme,
          model: localModel,
          temperature: localTemp,
          font_size: localFontSize,
          speech_speed: localSpeechSpeed,
          speech_voice: localSpeechVoice,
        });
      }
    } catch (e) {
      console.warn('Supabase settings loading failed, using local settings:', e);
    }
  },

  saveSettings: async (updates) => {
    set({ isSaving: true });
    try {
      // Map frontend camelCase to database snake_case
      const dbUpdates: any = {};
      if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.temperature !== undefined) dbUpdates.temperature = updates.temperature;
      if (updates.fontSize !== undefined) dbUpdates.font_size = updates.fontSize;
      if (updates.speechSpeed !== undefined) dbUpdates.speech_speed = updates.speechSpeed;
      if (updates.speechVoice !== undefined) dbUpdates.speech_voice = updates.speechVoice;

      const { error } = await supabase
        .from('settings')
        .update(dbUpdates)
        .eq('user_id', GUEST_USER_ID);

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to save settings to Supabase:', e);
    } finally {
      set({ isSaving: false });
    }
  },
}));

function applyTheme(theme: AppTheme) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  
  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', systemTheme);
  } else {
    root.setAttribute('data-theme', theme);
  }
}

function applyFontSize(size: FontSize) {
  if (typeof window === 'undefined') return;
  const root = window.document.documentElement;
  root.style.setProperty('--font-size-multiplier', size === 'sm' ? '0.9' : size === 'lg' ? '1.1' : '1.0');
}
