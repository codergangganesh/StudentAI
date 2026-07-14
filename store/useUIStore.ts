import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  profileModalOpen: boolean;
  settingsModalOpen: boolean;
  voiceModeActive: boolean;
  toasts: Toast[];
  
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setProfileModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setVoiceModeActive: (active: boolean) => void;
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  profileModalOpen: false,
  settingsModalOpen: false,
  voiceModeActive: false,
  toasts: [],

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setProfileModalOpen: (profileModalOpen) => set({ profileModalOpen }),
  setSettingsModalOpen: (settingsModalOpen) => set({ settingsModalOpen }),
  setVoiceModeActive: (voiceModeActive) => set({ voiceModeActive }),
  
  addToast: (message, type, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
