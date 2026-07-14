'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, Check, Download, RotateCcw, Edit2, Trash2, 
  Volume2, VolumeX, Sparkles, Smile, MessageSquare, AlertCircle,
  Link as LinkIcon
} from 'lucide-react';
import { Message, Attachment } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import useSpeech from '@/hooks/useSpeech';
import styles from './MessageItem.module.css';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const { 
    reactToMessage, 
    deleteMessage, 
    editMessage, 
    regenerateMessage,
    isStreaming
  } = useChatStore();

  const { addToast } = useUIStore();
  const { speakText, cancelSpeaking, isSpeaking } = useSpeech();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      addToast('Copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      addToast('Copy failed', 'error');
    }
  };

  const handleSpeechToggle = () => {
    if (isSpeaking) {
      cancelSpeaking();
    } else {
      speakText(message.content);
    }
  };

  const triggerReactionConfetti = (emoji: string) => {
    if (emoji === '🎉' || emoji === '❤️') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  };

  const handleReact = async (emoji: string) => {
    await reactToMessage(message.id, emoji);
    setShowReactions(false);
    triggerReactionConfetti(emoji);
  };

  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== message.content) {
      await editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      await deleteMessage(message.id);
    }
  };

  // Custom components for Markdown parser
  const customMarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'javascript';
      const codeValue = String(children).replace(/\n$/, '');

      if (!inline && match) {
        return <CodeBlock language={language} value={codeValue} />;
      }
      return (
        <code className={className} style={{ backgroundColor: 'var(--bg-hover)', padding: '2px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }} {...props}>
          {children}
        </code>
      );
    },
    a({ href, children, ...props }: any) {
      const textContent = String(children);
      const isExternal = href?.startsWith('http') || href?.startsWith('//') || textContent.toLowerCase().includes('sonyliv');
      const showIcon = isExternal && (textContent.toLowerCase().includes('sonyliv') || textContent.toLowerCase().includes('register'));
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.markdownLink} 
          {...props}
        >
          {children}
          {showIcon && (
            <LinkIcon size={12} className={styles.inlineLinkIcon} />
          )}
        </a>
      );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`${styles.messageRow} ${isUser ? styles.userRow : styles.assistantRow}`}
    >
      <div className={styles.messageRowInner}>
        {/* Assistant Avatar */}
        {!isUser && (
          <div className={styles.assistantAvatar} title="StudentAI">
            <Sparkles size={16} className={styles.sparkleIcon} />
          </div>
        )}

        {/* Content Area */}
        <div className={styles.contentWrapper}>

          {/* Body content */}
          {isEditing ? (
            <div className={styles.editContainer}>
              <textarea
                className={styles.editTextarea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                }}
              />
              <div className={styles.editActions}>
                <button className={styles.editCancelBtn} onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button className={styles.editSubmitBtn} onClick={handleSaveEdit}>
                  Save & Submit
                </button>
              </div>
            </div>
          ) : (
            <div className={isUser ? styles.userBubble : styles.assistantContent}>
              <div className={styles.body}>
                {message.metadata?.error ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                    <AlertCircle size={16} />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={customMarkdownComponents}
                  >
                    {message.content}
                  </ReactMarkdown>
                )}
              </div>

              {/* Attachments preview inside messages */}
              {message.attachments && message.attachments.length > 0 && (
                <div className={styles.attachmentsGrid}>
                  {message.attachments.map((att) => (
                    <div key={att.id} className={styles.attachmentItem}>
                      <img 
                        src={att.file_path} 
                        alt={att.file_name} 
                        className={styles.attachmentImg}
                        onClick={() => window.open(att.file_path, '_blank')}
                        title="View image full size"
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Actions under bubble */}
          {isUser && !isEditing && (
            <div className={styles.userActions}>
              <button 
                className={styles.userActionBtn} 
                onClick={handleCopyText}
                title="Copy message"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button 
                className={styles.userActionBtn} 
                onClick={() => setIsEditing(true)}
                title="Edit message"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {/* Reactions and buttons footer */}
          {!isUser && !isEditing && (
            <div className={styles.actionsFooter}>
              <div className={styles.actionsGroup}>
                {/* Active reaction emoji */}
                {message.metadata?.reaction && (
                  <span style={{ fontSize: '0.85rem', backgroundColor: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '12px' }}>
                    {message.metadata.reaction}
                  </span>
                )}

                {/* Reaction Picker Trigger */}
                <div style={{ position: 'relative' }}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => setShowReactions(!showReactions)}
                    title="Add reaction"
                  >
                    <Smile size={14} />
                  </button>
                  
                  {showReactions && (
                    <div className={styles.reactions} style={{ position: 'absolute', bottom: '32px', left: '0', zIndex: 5 }}>
                      {['👍', '👎', '❤️', '😂', '🎉', '😮'].map((emoji) => (
                        <button
                          key={emoji}
                          className={styles.reactBtn}
                          onClick={() => handleReact(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Speaker TTS trigger */}
                {!isUser && (
                  <button 
                    className={styles.actionBtn} 
                    onClick={handleSpeechToggle}
                    title={isSpeaking ? "Mute speech" : "Read response aloud"}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  </button>
                )}

                {/* Copy Text */}
                <button 
                  className={styles.actionBtn} 
                  onClick={handleCopyText}
                  title="Copy message"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                {/* Edit Message (user only) */}
                {isUser && (
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => setIsEditing(true)}
                    title="Edit message"
                  >
                    <Edit2 size={14} />
                  </button>
                )}

                {/* Regenerate Message (assistant only, excluding stream) */}
                {!isUser && !isStreaming && (
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => regenerateMessage(message.id)}
                    title="Regenerate response"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}

                {/* Delete Message */}
                <button 
                  className={styles.actionBtn} 
                  onClick={handleDelete}
                  title="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Separate Sub-Component to avoid re-rendering entire markdown for codeblock interactions
function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleDownloadCode = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Pick extension from language
    let ext = 'js';
    if (language === 'typescript' || language === 'ts') ext = 'ts';
    else if (language === 'python' || language === 'py') ext = 'py';
    else if (language === 'html') ext = 'html';
    else if (language === 'css') ext = 'css';
    else if (language === 'json') ext = 'json';

    link.href = url;
    link.download = `code-snippet.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.codeBlockWrapper}>
      <div className={styles.codeHeader}>
        <span>{language}</span>
        <div className={styles.codeButtons}>
          <button className={styles.codeBtn} onClick={handleCopyCode}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className={styles.codeBtn} onClick={handleDownloadCode} title="Download file">
            <Download size={13} />
            <span>Download</span>
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          fontSize: '0.85rem',
          backgroundColor: '#0a0a0c',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)',
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
