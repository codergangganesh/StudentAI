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
        {sidebarOpen && (
          <div className={styles.sidebarInner}>
            {/* Header: Logo and Toggle */}
            <div className={styles.header}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
              </div>
              <button 
                className={styles.collapseBtn} 
                onClick={toggleSidebar}
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
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

            {/* Navigation Lists */}
            <div className={styles.navList}>
              {/* Search chats */}
              {showSearch ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', height: '38px', backgroundColor: '#212121', borderRadius: '8px' }}>
                  <Search size={16} style={{ color: '#ececf1' }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.9rem', width: '100%', outline: 'none' }}
                  />
                  {searchQuery && (
                    <X 
                      size={14} 
                      style={{ color: '#8e8ea0', cursor: 'pointer' }} 
                      onClick={() => {
                        setSearchQuery('');
                        setShowSearch(false);
                      }} 
                    />
                  )}
                </div>
              ) : (
                <div className={styles.navItem} onClick={() => setShowSearch(true)}>
                  <Search size={16} />
                  <span>Search chats</span>
                </div>
              )}

              {/* Library */}
              <div className={styles.navItem}>
                <Library size={16} />
                <span>Library</span>
              </div>

              {/* Scheduled */}
              <div className={styles.navItem}>
                <Clock size={16} />
                <span>Scheduled</span>
              </div>

              {/* Plugins */}
              <div className={styles.navItem}>
                <Puzzle size={16} />
                <span>Plugins</span>
              </div>

              {/* More */}
              <div className={styles.navItem}>
                <MoreHorizontal size={16} />
                <span>More</span>
              </div>
            </div>

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

              {/* Projects section */}
              <div>
                <div className={`${styles.sectionHeader} ${styles.sectionHeaderWithLink}`}>
                  <span>Projects</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Chats List Section */}
              <div>
                <div className={styles.sectionHeader}>Chats</div>
                <div className={styles.chatList}>
                  {regularChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`${styles.chatItem} ${activeChatId === chat.id ? styles.chatItemActive : ''}`}
                      onClick={() => selectChat(chat.id)}
                    >
                      <div className={styles.chatTitleWrapper}>
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
        )}
      </aside>

      {/* Floating Toggle Button (visible when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          className={styles.floatingToggle}
          onClick={toggleSidebar}
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </>
  );
}
