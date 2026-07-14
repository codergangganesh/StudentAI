'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, ArrowUp, Square, Loader2, X, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';
import useUpload from '@/hooks/useUpload';
import styles from './ChatInput.module.css';

export default function ChatInput() {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { isStreaming, sendMessage, stopGeneration, activeAttachments, removeAttachment } = useChatStore();
  const { setVoiceModeActive } = useUIStore();
  const { uploadFile, isUploading, uploadProgress } = useUpload();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [content]);

  // Focus input on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSend = async () => {
    const cleanContent = content.trim();
    if (!cleanContent && activeAttachments.length === 0) return;
    if (isStreaming) return;

    setContent('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    
    await sendMessage(cleanContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  // Clipboard Paste image
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await uploadFile(file);
        }
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFile(files[0]);
    }
  };

  const hasContent = content.trim().length > 0 || activeAttachments.length > 0;

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.inputWrapper} ${isFocused ? styles.inputWrapperFocus : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className={styles.dragOverlay}>
            Drop image here to upload
          </div>
        )}

        {/* Plus Button (Left) */}
        <motion.button 
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.85 }}
          className={styles.plusBtn}
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
          disabled={isUploading || isStreaming}
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={18} />
          )}
        </motion.button>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef}
          className={styles.fileInput} 
          accept="image/*"
          onChange={handleFileSelect}
        />

        {/* Attachment Previews */}
        {activeAttachments.length > 0 && (
          <div className={styles.attachmentsList}>
            {activeAttachments.map((att) => (
              <div key={att.id} className={styles.attachmentThumbnail}>
                <img src={att.file_path} alt={att.file_name} className={styles.attachmentImg} />
                <button 
                  className={styles.removeAttachmentBtn}
                  onClick={() => removeAttachment(att.id)}
                  title="Remove image"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Ask anything"
          rows={1}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isUploading}
        />

        {/* Control Buttons (Right) */}
        <div className={styles.controls}>
          {isStreaming ? (
            // Stop button
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`${styles.controlBtn} ${styles.submitBtn}`} 
              onClick={stopGeneration}
              title="Stop generating"
            >
              <Square size={14} fill="currentColor" />
            </motion.button>
          ) : hasContent ? (
            // Send button if user types text or attaches image
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`${styles.controlBtn} ${styles.submitBtn}`}
              onClick={handleSend}
              title="Send message"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </motion.button>
          ) : (
            // Mic + Voice Wave buttons if input is empty
            <>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={styles.controlBtn} 
                onClick={() => setVoiceModeActive(true)}
                title="Use voice"
              >
                <Mic size={18} />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={styles.voicePillBtn}
                onClick={() => setVoiceModeActive(true)}
                title="Voice mode"
              >
                <div className={styles.voicePillWave}>
                  <div className={styles.voicePillBar} style={{ animationDelay: '0ms' }} />
                  <div className={styles.voicePillBar} style={{ animationDelay: '150ms' }} />
                  <div className={styles.voicePillBar} style={{ animationDelay: '300ms' }} />
                </div>
              </motion.button>
            </>
          )}
        </div>

        {/* Upload Progress Loader bar */}
        {isUploading && (
          <div 
            className={styles.uploadProgress} 
            style={{ width: `${uploadProgress}%` }}
          />
        )}
      </div>
      
      <span className={styles.footerText}>
        Groq can make mistakes. Verify important info.
      </span>
    </div>
  );
}
