'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatArea from '@/components/chat/ChatArea';
import VoiceOverlay from '@/components/voice/VoiceOverlay';
import SettingsModal from '@/components/settings/SettingsModal';
import ProfileModal from '@/components/profile/ProfileModal';
import ToastContainer from '@/components/ui/Toast';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useChatStore } from '@/store/useChatStore';

export default function Home() {
  const { loadSettings } = useSettingsStore();
  const { fetchChats } = useChatStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Initialize settings & theme
    loadSettings();
    // 2. Fetch recent conversations
    fetchChats();
    // 3. Mark client as mounted to avoid hydration errors
    setMounted(true);
  }, [loadSettings, fetchChats]);

  if (!mounted) {
    // Static skeletal loading page while hydration finishes (extremely premium look)
    return (
      <div 
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          backgroundColor: '#0b0f17', // default dark bg
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontFamily: 'sans-serif'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="pulsar" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em' }}>
            LOADING STUDENTAI...
          </span>
        </div>
        <style>{`
          .pulsar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid rgba(129, 140, 248, 0.1);
            border-top-color: #818cf8;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <main 
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main chat viewport */}
      <ChatArea />

      {/* Overlays and dialogs */}
      <VoiceOverlay />
      <SettingsModal />
      <ProfileModal />
      <ToastContainer />
    </main>
  );
}
