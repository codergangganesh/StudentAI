'use client';

import React, { useEffect, useRef } from 'react';
import { Sparkles, Image, Pencil, Globe, Loader2 } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import MessageItem from './MessageItem';
import TypingIndicator from './TypingIndicator';
import styles from './MessageList.module.css';

export default function MessageList() {
  const { messages, isStreaming, sendMessage } = useChatStore();
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const quickPrompts = [
    {
      label: 'Create an image',
      prompt: 'Help me write a highly detailed prompt to generate an image of a futuristic campus with AI learning hubs.',
      icon: <Image size={18} />
    },
    {
      label: 'Write or edit',
      prompt: 'Draft an email requesting feedback on a software project architecture draft.',
      icon: <Pencil size={18} />
    },
    {
      label: 'Look something up',
      prompt: 'Explain the difference between Next.js Server Components and Client Components in terms of compilation and hydration.',
      icon: <Globe size={18} />
    }
  ];

  const handlePromptClick = async (promptText: string) => {
    await sendMessage(promptText);
  };

  if (messages.length === 0) {
    return (
      <div className={styles.welcomeContainer}>
        <div>
          <h1 className={styles.welcomeTitle}>Ready when you are.</h1>
        </div>

        {/* Vertical List of Quick Actions under input */}
        <div className={styles.quickPromptsList}>
          {quickPrompts.map((qp, index) => (
            <div
              key={index}
              className={styles.promptCard}
              onClick={() => handlePromptClick(qp.prompt)}
            >
              <div className={styles.promptIcon}>{qp.icon}</div>
              <span>{qp.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.listContainer} ref={listRef}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}

      {/* Typing Indicator */}
      {isStreaming && messages[messages.length - 1]?.content === '' && (
        <div className={styles.indicatorWrapper}>
          <div style={{ display: 'flex', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', border: '1px solid rgba(129, 140, 248, 0.2)' }}>
              <Sparkles size={16} />
            </div>
            <TypingIndicator />
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={bottomRef} className={styles.scrollSentinel} />
    </div>
  );
}
