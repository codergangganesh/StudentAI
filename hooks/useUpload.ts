'use client';

import { useState } from 'react';
import { supabase, GUEST_USER_ID } from '@/lib/supabase';
import { Attachment } from '@/types';
import { useChatStore } from '@/store/useChatStore';
import { useUIStore } from '@/store/useUIStore';

export default function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { activeChatId, addAttachment } = useChatStore();
  const { addToast } = useUIStore();

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 1200px
        const MAX_DIM = 1200;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas blob is empty'));
            }
          },
          'image/jpeg',
          0.8 // 80% JPEG quality
        );
      };
      img.onerror = (e) => reject(e);
    });
  };

  const uploadFile = async (file: File) => {
    // 1. Validation
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      addToast('Invalid file type. Only PNG, JPG, WEBP, and GIF are allowed.', 'error');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      addToast('File is too large. Maximum size is 5MB.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress bar indicator

    let uploadBlob: Blob = file;
    try {
      
      // Compress if it is a large image and not a gif
      if (file.type !== 'image/gif' && file.size > 200 * 1024) {
        setUploadProgress(20);
        uploadBlob = await compressImage(file);
        setUploadProgress(45);
      }

      const fileExtension = file.name.split('.').pop();
      const fileNameClean = file.name.replace(`.${fileExtension}`, '').replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueFileName = `${Date.now()}-${fileNameClean}.${fileExtension}`;
      
      const chatId = activeChatId || 'temp';
      const storagePath = `chats/${chatId}/${uniqueFileName}`;

      setUploadProgress(60);

      // 2. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(storagePath, uploadBlob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      setUploadProgress(85);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(storagePath);

      // 3. Save attachment reference to Supabase DB table
      const newAttachment: Partial<Attachment> = {
        chat_id: activeChatId || GUEST_USER_ID, // Use guest profile if no chat exists yet
        file_path: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: uploadBlob.size,
      };

      let dbAttachment: Attachment;

      if (activeChatId) {
        const { data: dbData, error: dbError } = await supabase
          .from('attachments')
          .insert({
            chat_id: activeChatId,
            file_path: publicUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: uploadBlob.size,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        dbAttachment = dbData;
      } else {
        // Fallback local mock attachment if chat hasn't been created yet
        dbAttachment = {
          id: Math.random().toString(36).substring(2, 9),
          chat_id: 'temp',
          file_path: publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: uploadBlob.size,
          created_at: new Date().toISOString(),
        };
      }

      addAttachment(dbAttachment);
      setUploadProgress(100);
      addToast('Image uploaded successfully', 'success');
    } catch (e: any) {
      console.warn('Supabase storage upload failed, fallback to local URL:', e);
      // Fallback: Create Object URL so it works offline
      const localUrl = URL.createObjectURL(uploadBlob);
      const offlineAttachment: Attachment = {
        id: Math.random().toString(36).substring(2, 9),
        chat_id: activeChatId || 'temp',
        file_path: localUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: uploadBlob.size,
        created_at: new Date().toISOString(),
      };
      
      addAttachment(offlineAttachment);
      addToast('Uploaded image in offline mode', 'info');
      setUploadProgress(100);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  return {
    uploadFile,
    isUploading,
    uploadProgress,
  };
}
