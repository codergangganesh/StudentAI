import { create } from 'zustand';
import { supabase, GUEST_USER_ID } from '@/lib/supabase';
import { Chat, Message, Attachment } from '@/types';
import { useUIStore } from './useUIStore';
import { useSettingsStore } from './useSettingsStore';

interface ChatState {
  chats: Chat[];
  messages: Message[];
  activeChatId: string | null;
  searchQuery: string;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  activeAttachments: Attachment[];
  
  fetchChats: () => Promise<void>;
  createChat: (title?: string) => Promise<string | null>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  pinChat: (id: string, isPinned: boolean) => Promise<void>;
  archiveChat: (id: string, isArchived: boolean) => Promise<void>;
  selectChat: (id: string | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  stopGeneration: () => void;
  setSearchQuery: (query: string) => void;
  reactToMessage: (messageId: string, reaction: string) => Promise<void>;
  
  addAttachment: (attachment: Attachment) => void;
  clearAttachments: () => void;
  removeAttachment: (id: string) => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  messages: [],
  activeChatId: null,
  searchQuery: '',
  isLoadingChats: false,
  isLoadingMessages: false,
  isStreaming: false,
  activeAttachments: [],

  fetchChats: async () => {
    set({ isLoadingChats: true });
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', GUEST_USER_ID)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ chats: data || [] });
    } catch (e) {
      console.warn('Supabase fetchChats failed, fallback to local storage:', e);
      const local = localStorage.getItem('local_chats');
      if (local) {
        set({ chats: JSON.parse(local) });
      }
    } finally {
      set({ isLoadingChats: false });
    }
  },

  createChat: async (title = 'New Chat') => {
    const newChat: Partial<Chat> = {
      user_id: GUEST_USER_ID,
      title,
      is_pinned: false,
      is_archived: false,
      category: 'General',
    };

    // Optimistic insert
    const tempId = Math.random().toString(36).substring(2, 9);
    const tempChat: Chat = {
      id: tempId,
      user_id: GUEST_USER_ID,
      title,
      is_pinned: false,
      is_archived: false,
      category: 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    set((state) => {
      const updatedChats = [tempChat, ...state.chats];
      localStorage.setItem('local_chats', JSON.stringify(updatedChats));
      return { chats: updatedChats, activeChatId: tempId, messages: [] };
    });

    try {
      const { data, error } = await supabase
        .from('chats')
        .insert(newChat)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set((state) => {
          const updatedChats = state.chats.map((c) => (c.id === tempId ? data : c));
          localStorage.setItem('local_chats', JSON.stringify(updatedChats));
          return {
            chats: updatedChats,
            activeChatId: data.id,
          };
        });
        return data.id;
      }
    } catch (e) {
      console.warn('Supabase createChat failed, using local chat:', e);
      useUIStore.getState().addToast('Created local offline chat', 'info');
      return tempId;
    }
    return null;
  },

  deleteChat: async (id) => {
    const previousChats = get().chats;
    const wasActive = get().activeChatId === id;

    set((state) => {
      const updated = state.chats.filter((c) => c.id !== id);
      localStorage.setItem('local_chats', JSON.stringify(updated));
      return {
        chats: updated,
        activeChatId: wasActive ? (updated[0]?.id || null) : state.activeChatId,
        messages: wasActive ? [] : state.messages,
      };
    });

    if (wasActive && get().activeChatId) {
      get().selectChat(get().activeChatId);
    }

    try {
      const { error } = await supabase.from('chats').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete chat in Supabase:', e);
      useUIStore.getState().addToast('Deleted local chat', 'info');
    }
  },

  renameChat: async (id, title) => {
    set((state) => {
      const updated = state.chats.map((c) => (c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c));
      localStorage.setItem('local_chats', JSON.stringify(updated));
      return { chats: updated };
    });

    try {
      const { error } = await supabase.from('chats').update({ title }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to rename chat in Supabase:', e);
    }
  },

  pinChat: async (id, is_pinned) => {
    set((state) => {
      const updated = state.chats
        .map((c) => (c.id === id ? { ...c, is_pinned } : c))
        .sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      localStorage.setItem('local_chats', JSON.stringify(updated));
      return { chats: updated };
    });

    try {
      const { error } = await supabase.from('chats').update({ is_pinned }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to pin chat in Supabase:', e);
    }
  },

  archiveChat: async (id, is_archived) => {
    set((state) => {
      const updated = state.chats.map((c) => (c.id === id ? { ...c, is_archived } : c));
      localStorage.setItem('local_chats', JSON.stringify(updated));
      return { chats: updated };
    });

    try {
      const { error } = await supabase.from('chats').update({ is_archived }).eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to archive chat in Supabase:', e);
    }
  },

  selectChat: async (id) => {
    set({ activeChatId: id, messages: [], isLoadingMessages: !!id });
    if (!id) return;

    try {
      // Fetch messages from Supabase
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch attachments for these messages
      const { data: attachData, error: attachError } = await supabase
        .from('attachments')
        .select('*')
        .eq('chat_id', id);

      if (attachError) throw attachError;

      const messagesWithAttachments = (data || []).map((msg: any) => ({
        ...msg,
        attachments: (attachData || []).filter((att: any) => att.message_id === msg.id),
      }));

      set({ messages: messagesWithAttachments });
      localStorage.setItem(`local_messages_${id}`, JSON.stringify(messagesWithAttachments));
    } catch (e) {
      console.warn('Supabase selectChat failed, fallback to local storage:', e);
      const local = localStorage.getItem(`local_messages_${id}`);
      if (local) {
        set({ messages: JSON.parse(local) });
      }
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content) => {
    let chatId = get().activeChatId;
    const attachments = get().activeAttachments;
    get().clearAttachments();

    // 1. Create a new chat if none is active
    if (!chatId) {
      const newId = await get().createChat(content.slice(0, 30) || 'New Chat');
      if (!newId) return;
      chatId = newId;
    }

    // 2. Add user message optimistic
    const userMsgId = Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMsgId,
      chat_id: chatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      metadata: {},
      attachments: attachments,
    };

    // Add assistant placeholder
    const assistantMsgId = Math.random().toString(36).substring(2, 9);
    const assistantMessage: Message = {
      id: assistantMsgId,
      chat_id: chatId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      metadata: { model: useSettingsStore.getState().model },
    };

    set((state) => {
      const nextMsgs = [...state.messages, userMessage, assistantMessage];
      localStorage.setItem(`local_messages_${chatId}`, JSON.stringify(nextMsgs));
      return { messages: nextMsgs, isStreaming: true };
    });

    // Save User Message to Supabase
    try {
      const { error } = await supabase.from('messages').insert({
        id: userMsgId,
        chat_id: chatId,
        role: 'user',
        content,
        metadata: {},
      });

      if (error) throw error;

      // Link attachments to the message
      if (attachments.length > 0) {
        const attachmentIds = attachments.map((a) => a.id);
        const { error: attachError } = await supabase
          .from('attachments')
          .update({ message_id: userMsgId })
          .in('id', attachmentIds);

        if (attachError) throw attachError;
      }
    } catch (e) {
      console.warn('Failed to save user message to Supabase:', e);
    }

    // Update active chat timestamp
    set((state) => ({
      chats: state.chats.map((c) => (c.id === chatId ? { ...c, updated_at: new Date().toISOString() } : c)),
    }));

    // 3. Initiate Streaming Fetch
    abortController = new AbortController();
    const settings = useSettingsStore.getState();

    try {
      const history = get().messages
        .slice(0, -1) // Exclude the assistant placeholder
        .map((m) => {
          if (m.attachments && m.attachments.length > 0) {
            const contentArray: any[] = [
              { type: 'text', text: m.content || 'Analyze this image.' }
            ];
            
            m.attachments.forEach((att) => {
              contentArray.push({
                type: 'image_url',
                image_url: { url: att.file_path }
              });
            });
            
            return { role: m.role, content: contentArray };
          }
          
          return { role: m.role, content: m.content };
        });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          model: settings.model,
          temperature: settings.temperature,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable response body');

      const decoder = new TextDecoder();
      let assistantText = '';
      
      const startTime = Date.now();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;

        set((state) => {
          const updated = state.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: assistantText } : m
          );
          localStorage.setItem(`local_messages_${chatId}`, JSON.stringify(updated));
          return { messages: updated };
        });
      }

      const thinkingTime = Math.round((Date.now() - startTime) / 10) / 100; // in seconds

      // Save Assistant Message to Supabase
      try {
        const { error } = await supabase.from('messages').insert({
          id: assistantMsgId,
          chat_id: chatId,
          role: 'assistant',
          content: assistantText,
          metadata: {
            model: settings.model,
            thinking_time: thinkingTime,
          },
        });
        if (error) throw error;
      } catch (e) {
        console.warn('Failed to save assistant message to Supabase:', e);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation aborted by user.');
        // Save the partially generated content if it exists
        const partialContent = get().messages.find((m) => m.id === assistantMsgId)?.content || '';
        try {
          if (partialContent) {
            await supabase.from('messages').insert({
              id: assistantMsgId,
              chat_id: chatId,
              role: 'assistant',
              content: partialContent,
              metadata: {
                model: settings.model,
                error: false,
                aborted: true,
              },
            });
          } else {
            // Delete the empty placeholder
            set((state) => ({ messages: state.messages.filter((m) => m.id !== assistantMsgId) }));
          }
        } catch (e) {
          console.warn('Failed to save aborted assistant message:', e);
        }
      } else {
        console.error('Error fetching chat stream:', err);
        useUIStore.getState().addToast(err.message || 'Failed to generate response', 'error');

        // Mark message as error
        set((state) => {
          const updated = state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: m.content || 'An error occurred while generating the response. Please try again.',
                  metadata: { ...m.metadata, error: true },
                }
              : m
          );
          localStorage.setItem(`local_messages_${chatId}`, JSON.stringify(updated));
          return { messages: updated };
        });
      }
    } finally {
      set({ isStreaming: false });
      abortController = null;
      // Auto rename chat if it was default
      const chat = get().chats.find((c) => c.id === chatId);
      if (chat && chat.title === 'New Chat') {
        const firstUserMsg = get().messages.find((m) => m.role === 'user')?.content || 'New Chat';
        const cleanTitle = firstUserMsg.slice(0, 30) + (firstUserMsg.length > 30 ? '...' : '');
        get().renameChat(chatId, cleanTitle);
      }
    }
  },

  regenerateMessage: async (messageId) => {
    const messages = get().messages;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // Find the prompt before this message (usually role 'user')
    const prevUserMsg = messages.slice(0, msgIndex).reverse().find((m) => m.role === 'user');
    if (!prevUserMsg) return;

    // Remove all messages from index to end
    set((state) => {
      const nextMsgs = state.messages.slice(0, msgIndex);
      return { messages: nextMsgs };
    });

    // Delete in Supabase if exists
    try {
      const messageIdsToDelete = messages.slice(msgIndex).map((m) => m.id);
      await supabase.from('messages').delete().in('id', messageIdsToDelete);
    } catch (e) {
      console.warn('Failed to delete messages for regeneration in Supabase:', e);
    }

    // Send the user prompt again
    await get().sendMessage(prevUserMsg.content);
  },

  editMessage: async (messageId, newContent) => {
    const messages = get().messages;
    const msgIndex = messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    // If it is a user message, we delete everything after it, update the user message, and trigger sendMessage again
    const msg = messages[msgIndex];
    if (msg.role === 'user') {
      set((state) => {
        const nextMsgs = state.messages.slice(0, msgIndex);
        return { messages: nextMsgs };
      });

      // Delete subsequent in Supabase
      try {
        const idsToDelete = messages.slice(msgIndex).map((m) => m.id);
        await supabase.from('messages').delete().in('id', idsToDelete);
      } catch (e) {
        console.warn('Failed to delete messages in Supabase for editing:', e);
      }

      await get().sendMessage(newContent);
    } else {
      // If it is assistant, we just edit the message text
      set((state) => ({
        messages: state.messages.map((m) => (m.id === messageId ? { ...m, content: newContent } : m)),
      }));

      try {
        await supabase.from('messages').update({ content: newContent }).eq('id', messageId);
      } catch (e) {
        console.warn('Failed to update assistant message:', e);
      }
    }
  },

  deleteMessage: async (messageId) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));

    try {
      await supabase.from('messages').delete().eq('id', messageId);
    } catch (e) {
      console.warn('Failed to delete message in Supabase:', e);
    }
  },

  stopGeneration: () => {
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  reactToMessage: async (messageId, reaction) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, metadata: { ...m.metadata, reaction } } : m
      ),
    }));

    try {
      // Fetch existing metadata
      const { data } = await supabase.from('messages').select('metadata').eq('id', messageId).single();
      const updatedMeta = { ...(data?.metadata || {}), reaction };
      await supabase.from('messages').update({ metadata: updatedMeta }).eq('id', messageId);
    } catch (e) {
      console.warn('Failed to save reaction:', e);
    }
  },

  addAttachment: (attachment) =>
    set((state) => ({
      activeAttachments: [...state.activeAttachments, attachment],
    })),

  clearAttachments: () => set({ activeAttachments: [] }),

  removeAttachment: (id) =>
    set((state) => ({
      activeAttachments: state.activeAttachments.filter((a) => a.id !== id),
    })),
}));
