'use client';

import React from 'react';
import { Download, Trash2, Keyboard, ShieldAlert, Sparkles } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useChatStore } from '@/store/useChatStore';
import { supabase, GUEST_USER_ID } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import styles from './ProfileModal.module.css';

export default function ProfileModal() {
  const { profileModalOpen, setProfileModalOpen, addToast } = useUIStore();
  const { chats, selectChat, fetchChats } = useChatStore();

  const handleExportChats = async () => {
    try {
      addToast('Exporting conversation logs...', 'info');

      // Fetch all messages for all chats from Supabase
      const { data: allMessages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by chat
      const exportData = chats.map((chat) => ({
        id: chat.id,
        title: chat.title,
        category: chat.category,
        is_pinned: chat.is_pinned,
        created_at: chat.created_at,
        messages: (allMessages || [])
          .filter((m) => m.chat_id === chat.id)
          .map((m) => ({
            role: m.role,
            content: m.content,
            created_at: m.created_at,
          })),
      }));

      // Trigger Download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grok-chatbot-history-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      addToast('Chats exported successfully!', 'success');
    } catch (e) {
      console.error('Export failed:', e);
      addToast('Failed to export conversations', 'error');
    }
  };

  const handleDeleteAllHistory = async () => {
    if (confirm('WARNING: This will permanently delete your entire chat history. This action cannot be undone. Do you wish to proceed?')) {
      try {
        addToast('Clearing chat database...', 'info');
        
        // Delete all chats for the guest user
        const { error } = await supabase
          .from('chats')
          .delete()
          .eq('user_id', GUEST_USER_ID);

        if (error) throw error;

        // Clear local storage entries
        localStorage.removeItem('local_chats');
        chats.forEach((c) => localStorage.removeItem(`local_messages_${c.id}`));

        // Reload chats
        await fetchChats();
        selectChat(null);
        
        addToast('All conversations deleted successfully', 'success');
        setProfileModalOpen(false);
      } catch (e) {
        console.error('Delete history failed:', e);
        addToast('Failed to clear database', 'error');
      }
    }
  };

  const keyboardShortcuts = [
    { key: 'Ctrl + /', desc: 'Focus message box' },
    { key: 'Space', desc: 'Toggle microphone (Voice Mode)' },
    { key: 'Esc', desc: 'Close open modals / Voice Overlay' },
    { key: 'Shift + Enter', desc: 'Insert new line in input' },
  ];

  return (
    <Modal
      isOpen={profileModalOpen}
      onClose={() => setProfileModalOpen(false)}
      title="User Profile & History"
    >
      <div className={styles.container}>
        {/* User Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>GU</div>
          <div className={styles.name}>Guest User</div>
          <div className={styles.email}>guest@studentai.local</div>
          <div className={styles.badge}>Anonymous Guest Session</div>
        </div>

        {/* Database Management Options */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Data Management</h4>
          
          <button className={styles.profileBtn} onClick={handleExportChats}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Download size={16} style={{ color: 'var(--accent-color)' }} />
              <span>Export Conversation History</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>JSON format</span>
          </button>

          <button className={`${styles.profileBtn} ${styles.dangerBtn}`} onClick={handleDeleteAllHistory}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trash2 size={16} />
              <span>Clear Entire Chat History</span>
            </div>
            <span style={{ fontSize: '0.75rem' }}>Permanent delete</span>
          </button>
        </div>

        {/* Keyboard Shortcuts Cheatsheet */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={14} />
              <span>Keyboard Shortcuts</span>
            </div>
          </h4>
          <div className={styles.shortcutList}>
            {keyboardShortcuts.map((s, index) => (
              <div key={index} className={styles.shortcutItem}>
                <span>{s.desc}</span>
                <span className={styles.key}>{s.key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
