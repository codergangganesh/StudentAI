'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, MessageSquare, Pin, Archive, Trash2, Edit3, 
  Settings, User, ChevronLeft, ChevronRight, Check, X,
  Library, Clock, Puzzle, MoreHorizontal, MessageCircle, FolderClosed, SquarePen
} from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { 
    chats, 
    activeChatId, 
    searchQuery, 
    setSearchQuery,
    createChat, 
    deleteChat, 
    renameChat, 
    pinChat, 
    archiveChat,
    selectChat,
    fetchChats 
  } = useChatStore();

  const { 
    sidebarOpen, 
    toggleSidebar, 
    setProfileModalOpen, 
    setSettingsModalOpen 
  } = useUIStore();

  const [showSearch, setShowSearch] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleCreateChat = async () => {
    await createChat();
  };

  const handleStartRename = (e: React.MouseEvent, chatId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingChatId(chatId);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (chatId: string) => {
    if (editTitle.trim()) {
      await renameChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
  };

  // Split chats into Pinned vs Regular (Chats)
  const pinnedChats = chats.filter(c => c.is_pinned && !c.is_archived && c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const regularChats = chats.filter(c => !c.is_pinned && !c.is_archived && c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {/* Sidebar Container */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.expanded : styles.collapsed}`}>
        <div className={styles.sidebarInner}>
          {/* Header: Logo and Toggle */}
          <div className={styles.header}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <img src="/logo.png" alt="StudentAI Logo" className={styles.logoImg} />
              </div>
              <span className={styles.logoText}>StudentAI</span>
            </div>
            <button 
              className={styles.collapseBtn} 
              onClick={toggleSidebar}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

            {/* New Chat Button */}
            <button className={styles.newChatBtn} onClick={handleCreateChat} title="New Chat">
              <div className={styles.newChatBtnInner}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>New chat</span>
              </div>
              <SquarePen size={16} style={{ color: '#8e8ea0' }} />
            </button>



            {/* Scroll Area */}
            <div className={styles.scrollArea}>
              
              {/* Pinned Section */}
              {pinnedChats.length > 0 && (
                <div>
                  <div className={styles.sectionHeader}>Pinned</div>
                  <div className={styles.chatList}>
                    {pinnedChats.map((chat) => (
                      <div
                        key={chat.id}
                        className={`${styles.chatItem} ${activeChatId === chat.id ? styles.chatItemActive : ''}`}
                        onClick={() => selectChat(chat.id)}
                      >
                        <div className={styles.chatTitleWrapper}>
                          <MessageCircle size={15} style={{ flexShrink: 0 }} />
                          {editingChatId === chat.id ? (
                            <input
                              ref={editInputRef}
                              type="text"
                              className={styles.renameInput}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => handleSaveRename(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(chat.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className={styles.chatTitle}>{chat.title}</span>
                          )}
                        </div>

                        {/* Actions */}
                        {editingChatId !== chat.id && (
                          <div className={styles.chatActions}>
                            <button
                              className={styles.actionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                pinChat(chat.id, false);
                              }}
                              title="Unpin chat"
                            >
                              <Pin size={12} className={styles.pinIcon} />
                            </button>
                            <button
                              className={styles.actionBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChat(chat.id);
                              }}
                              title="Delete chat"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* Chats List Section */}
              <div>
                <div className={`${styles.sectionHeader} ${styles.sectionHeaderWithAction}`}>
                  <span>Chats</span>
                  <button
                    className={styles.sectionSearchBtn}
                    onClick={() => setShowSearch(!showSearch)}
                    title="Search chats"
                  >
                    <Search size={14} />
                  </button>
                </div>

                {/* Inline search bar */}
                {showSearch && (
                  <div className={styles.searchContainer}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className={styles.searchBarInput}
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => {
                        if (!searchQuery) setTimeout(() => setShowSearch(false), 150);
                      }}
                    />
                    {searchQuery && (
                      <X
                        size={14}
                        style={{ cursor: 'pointer' }}
                        className={styles.searchIcon}
                        onClick={() => {
                          setSearchQuery('');
                          setShowSearch(false);
                        }}
                      />
                    )}
                  </div>
                )}
                <div className={styles.chatList}>
                  {regularChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`${styles.chatItem} ${activeChatId === chat.id ? styles.chatItemActive : ''}`}
                      onClick={() => selectChat(chat.id)}
                    >
                      <div className={styles.chatTitleWrapper}>
                        <MessageSquare size={15} style={{ flexShrink: 0 }} />
                        {editingChatId === chat.id ? (
                          <input
                            ref={editInputRef}
                            type="text"
                            className={styles.renameInput}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={() => handleSaveRename(chat.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(chat.id);
                              if (e.key === 'Escape') handleCancelRename();
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={styles.chatTitle}>{chat.title}</span>
                        )}
                      </div>

                      {/* Actions */}
                      {editingChatId !== chat.id && (
                        <div className={styles.chatActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              pinChat(chat.id, true);
                            }}
                            title="Pin chat"
                          >
                            <Pin size={12} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => handleStartRename(e, chat.id, chat.title)}
                            title="Rename chat"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            title="Delete chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {regularChats.length === 0 && !pinnedChats.length && (
                    <div style={{ padding: '16px 12px', fontSize: '0.82rem', color: '#8e8ea0', fontStyle: 'italic' }}>
                      No chats yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer User Profile Card */}
            <div className={styles.footer}>
              <div className={styles.userProfile} onClick={() => setProfileModalOpen(true)}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>MG</div>
                  <div className={styles.userNameContainer}>
                    <span className={styles.userName}>Mannam Ganeshbabu</span>
                    <span className={styles.userEmail}>Go</span>
                  </div>
                </div>
                <button
                  className={`${styles.actionBtn} ${styles.settingsTriggerBtn}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSettingsModalOpen(true);
                  }}
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
      </aside>
    </>
  );
}
