export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attachment {
  id: string;
  chat_id: string;
  message_id?: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export interface MessageMetadata {
  reaction?: string;
  thinking_time?: number;
  tokens_used?: number;
  error?: boolean;
  model?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parent_id?: string | null;
  metadata: MessageMetadata;
  created_at: string;
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  is_pinned: boolean;
  is_archived: boolean;
  category: string;
  created_at: string;
  updated_at: string;
  messages_count?: number;
}
