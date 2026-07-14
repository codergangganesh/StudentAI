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
    if (model === 'llama-3.1-8b-instant') return 'Llama 3.1 8B';
    if (model === 'llama-3.2-11b-vision-preview') return 'Llama 3.2 Vision';
    return 'Llama 3.3 70B';
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
                    className={`${styles.dropdownItem} ${model === 'llama-3.3-70b-versatile' ? styles.dropdownItemActive : ''}`}
                    onClick={() => setModel('llama-3.3-70b-versatile')}
                  >
                    <span className={styles.modelHeadline}>Llama 3.3 70B</span>
                    <span className={styles.modelDesc}>Powerful model for complex reasoning and coding.</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${model === 'llama-3.1-8b-instant' ? styles.dropdownItemActive : ''}`}
                    onClick={() => setModel('llama-3.1-8b-instant')}
                  >
                    <span className={styles.modelHeadline}>Llama 3.1 8B</span>
                    <span className={styles.modelDesc}>Ultra-low latency instant completions.</span>
                  </button>
                  <button 
                    className={`${styles.dropdownItem} ${model === 'llama-3.2-11b-vision-preview' ? styles.dropdownItemActive : ''}`}
                    onClick={() => setModel('llama-3.2-11b-vision-preview')}
                  >
                    <span className={styles.modelHeadline}>Llama 3.2 Vision</span>
                    <span className={styles.modelDesc}>Analyze images alongside text prompts.</span>
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
