'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Menu, Pin, Archive, Trash2, ChevronDown, Settings, Sparkles } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import styles from './ChatArea.module.css';

export default function ChatArea() {
  const { 
    activeChatId, 
    chats, 
    pinChat, 
    archiveChat, 
    deleteChat 
  } = useChatStore();

  const { 
    sidebarOpen, 
    toggleSidebar,
    setSettingsModalOpen
  } = useUIStore();

  const { model, setModel } = useSettingsStore();

  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Find active chat details
  const activeChat = chats.find(c => c.id === activeChatId);

  const handlePinToggle = async () => {
    if (activeChat) {
      await pinChat(activeChat.id, !activeChat.is_pinned);
    }
  };

  const handleArchiveToggle = async () => {
    if (activeChat) {
      await archiveChat(activeChat.id, !activeChat.is_archived);
    }
  };

  const handleDelete = async () => {
    if (activeChat && confirm('Delete this conversation?')) {
      await deleteChat(activeChat.id);
    }
  };

  const getModelLabel = () => {
    if (model === 'grok-beta') return 'Grok Beta';
    return 'Grok 2';
  };

  return (
    <div className={styles.chatArea}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.leftControls}>
          {/* Mobile Sidebar Hamburger Trigger */}
          <button 
            className={styles.mobileMenuBtn} 
            onClick={toggleSidebar}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <Menu size={18} />
          </button>

          {/* Model selector or Chat Title */}
          {activeChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span className={styles.chatTitle}>{activeChat.title}</span>
              <span style={{ fontSize: '0.72rem', color: '#8e8ea0' }}>{activeChat.category}</span>
            </div>
          ) : (
            // Dropdown menu trigger matching the ChatGPT welcome dropdown
            <div className={styles.modelSelector} onClick={() => setModelMenuOpen(!modelMenuOpen)} ref={dropdownRef}>
              <span>{getModelLabel()}</span>
              <ChevronDown size={14} className={styles.chevron} />
              
              {modelMenuOpen && (
                <div className={styles.dropdownMenu}>
                  <button 
                    className={`${styles.dropdownItem} ${model === 'grok-2-1212' ? styles.dropdownItemActive : ''}`}
                    onClick={() => setModel('grok-2-1212')}
                  >
                    <span className={styles.modelHeadline}>Grok 2</span>
                    <span className={styles.modelDesc}>Latest stable text and vision capability.</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${model === 'grok-beta' ? styles.dropdownItemActive : ''}`}
                    onClick={() => setModel('grok-beta')}
                  >
                    <span className={styles.modelHeadline}>Grok Beta</span>
                    <span className={styles.modelDesc}>Fast-paced completion engine.</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat control buttons / Settings triggers */}
        <div className={styles.rightControls}>
          {activeChat ? (
            <>
              <button
                className={styles.headerBtn}
                onClick={handlePinToggle}
                title={activeChat.is_pinned ? "Unpin chat" : "Pin chat"}
              >
                <Pin 
                  size={15} 
                  className={activeChat.is_pinned ? styles.pinIconActive : ''} 
                />
              </button>
              <button
                className={styles.headerBtn}
                onClick={handleArchiveToggle}
                title={activeChat.is_archived ? "Unarchive chat" : "Archive chat"}
              >
                <Archive size={15} />
              </button>
              <button
                className={styles.headerBtn}
                onClick={handleDelete}
                title="Delete chat"
              >
                <Trash2 size={15} />
              </button>
            </>
          ) : (
            // Settings shortcut icon in header when welcome screen is active
            <button 
              className={styles.headerBtn}
              onClick={() => setSettingsModalOpen(true)}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Body Area */}
      <div className={styles.body}>
        {/* Messages */}
        <MessageList />
        
        {/* Chat Input */}
        <ChatInput />
      </div>
    </div>
  );
}
