# Grok AI Chatbot Web Application

A sleek, high-performance web application designed to look and feel like ChatGPT. It is powered by the xAI Grok API for streaming text completions and Supabase for real-time data persistence, user preferences, and attachment storage. Features include an interactive hands-free voice mode, image upload compression, and Markdown rendering with copyable code blocks.

---

## Technical Stack

*   **Frontend Framework:** React 19, Next.js 16 (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** CSS Modules (Vanilla CSS, no Tailwind CSS dependency)
*   **State Management:** Zustand
*   **Database & Storage:** Supabase (PostgreSQL, Realtime, Storage Buckets)
*   **Animations:** Framer Motion
*   **Markdown Parsing:** React Markdown, GFM tables, rehype-raw, KaTeX math
*   **Code Syntax Highlighting:** React Syntax Highlighter (Prism vscDarkPlus theme)
*   **Voice Features:** Web Speech API (webkitSpeechRecognition, SpeechSynthesis)

---

## Key Features

1.  **Grok API Edge Streaming:** Connects to the xAI completions API using SSE (Server-Sent Events) to stream response tokens.
2.  **Vision Model Support:** Formats messages containing image attachments into xAI-compatible structured content block arrays, enabling vision capabilities.
3.  **Demo Fallback Mode:** In the absence of a configured GROK_API_KEY, the API route falls back to a simulated streaming response so the application remains immediately interactive.
4.  **Drag-and-Drop Image Upload:** Accepts image uploads via file dialogs, drop zones, or clipboard paste. Images are compressed using HTML5 Canvas before uploading to Supabase Storage.
5.  **Hands-Free Voice Mode:** Real-time microphone listening, continuous voice activity detection (VAD), and text-to-speech reading with customizable system voices and speeds. User speech immediately interrupts synthesized speech outputs.
6.  **Interactive Waveform:** Canvas-drawn sinusoid waves that expand, contract, and color-shift based on mic levels and speaking states.
7.  **Global Search:** Debounced input filters that search both chat titles and cached message transcripts.
8.  **Data Export & Wipe:** One-click download of conversation history in JSON format, and database-wide history clearance triggers.

---

## Directory Structure

The codebase is organized modularly to separate UI layouts, data hooks, state containers, and backend API routes:

*   **app/**
    *   **api/chat/route.ts:** Next.js Edge route that streams completion chunks from xAI.
    *   **globals.css:** Standard HSL design tokens, light/dark theme variables, scrollbar styles, and resets.
    *   **layout.tsx:** Roots HTML layout, imports fonts, and handles hydration resets.
    *   **page.tsx:** Home client component loading modals, sidebar panels, and main chat grids.
*   **components/**
    *   **chat/**
        *   **ChatArea.tsx / ChatArea.module.css:** Main chat window, dropdown model selectors, and headers.
        *   **ChatInput.tsx / ChatInput.module.css:** Textarea with auto-growth and dynamic dual-state buttons.
        *   **MessageList.tsx / MessageList.module.css:** Scroll anchors, message maps, and welcome links.
        *   **MessageItem.tsx / MessageItem.module.css:** Markdown parser, LaTeX blocks, download snippets, and emoji reactions.
        *   **TypingIndicator.tsx:** Dot-bouncing loading ellipsis.
    *   **profile/ProfileModal.tsx / ProfileModal.module.css:** Display card for user data, export scripts, and db clearance.
    *   **settings/SettingsModal.tsx / SettingsModal.module.css:** Model settings, themes, temperature sliders, and font settings.
    *   **sidebar/Sidebar.tsx / Sidebar.module.css:** Collapse triggers, navigation lists, search bars, and profile footer.
    *   **ui/**
        *   **Modal.tsx:** Backdrop-dismissible animated overlay wrappers.
        *   **Toast.tsx / Toast.module.css:** Custom animated alert notification container.
        *   **Spinner.tsx:** Reusable SVG loaders.
        *   **Skeleton.tsx:** Shimmer layout placeholders.
    *   **voice/**
        *   **VoiceOverlay.tsx / VoiceOverlay.module.css:** Vocal mode layouts, speed sliders, and voice pickers.
        *   **Waveform.tsx:** Pulsating trigonometric sine waves drawn on Canvas.
*   **hooks/**
    *   **useSpeech.ts:** Integrates audio context analyzers, synthesis events, and recognition cycles.
    *   **useUpload.ts:** Canvas compression handler and Supabase storage upload hooks.
*   **lib/supabase.ts:** Supabase client configs and guest UUID fallbacks.
*   **store/**
    *   **useChatStore.ts:** Core store executing database inserts, selects, streaming readers, and model histories.
    *   **useSettingsStore.ts:** Preferences manager storing choices in localStorage and settings tables.
    *   **useUIStore.ts:** Panel toggles, modals visibility, and toast queues.
    *   **useVoiceStore.ts:** Transcripts, sound indicators, VAD loops, and audio states.
*   **supabase/schema.sql:** SQL migration files configuring tables, indexes, triggers, and replication publishers.
*   **types/index.ts:** Strict TypeScript interface mappings.
*   **utils/uuid.ts:** Standard v4 UUID generator matching Postgres UUID format.

---

## Database Schema (PostgreSQL)

The database consists of five tables set up inside your Supabase project schema:

### 1. profiles
*   `id` (uuid, primary key) - Unique identifier for the user profile (mapped to guest session or auth).
*   `display_name` (text) - Name displayed on the profile panel.
*   `avatar_url` (text, nullable) - Path to custom profile image.
*   `created_at`, `updated_at` (timestamptz)

### 2. chats
*   `id` (uuid, primary key, default gen_random_uuid())
*   `user_id` (uuid, foreign key referencing profiles.id)
*   `title` (text) - Dynamic topic title.
*   `is_pinned` (boolean, default false)
*   `is_archived` (boolean, default false)
*   `category` (text, default 'General')
*   `created_at`, `updated_at` (timestamptz)

### 3. messages
*   `id` (uuid, primary key, default gen_random_uuid())
*   `chat_id` (uuid, foreign key referencing chats.id)
*   `role` (text) - Constrained to 'user', 'assistant', or 'system'.
*   `content` (text) - Raw message text or structured JSON vision block representation.
*   `parent_id` (uuid, foreign key referencing messages.id, nullable)
*   `metadata` (jsonb) - Reactions, model name, thinking time, and errors.
*   `created_at` (timestamptz)

### 4. attachments
*   `id` (uuid, primary key, default gen_random_uuid())
*   `chat_id` (uuid, foreign key referencing chats.id)
*   `message_id` (uuid, foreign key referencing messages.id, nullable)
*   `file_path` (text) - Public URL to access file assets.
*   `file_name` (text) - Original file name.
*   `file_type` (text) - MIME type.
*   `file_size` (bigint)
*   `created_at` (timestamptz)

### 5. settings
*   `id` (uuid, primary key, default gen_random_uuid())
*   `user_id` (uuid, unique, foreign key referencing profiles.id)
*   `theme` (text) - Constrained to 'light', 'dark', or 'system'.
*   `model` (text) - e.g., 'grok-2-1212'.
*   `temperature` (numeric) - Value between 0.1 and 1.0.
*   `font_size` (text) - Constrained to 'sm', 'md', or 'lg'.
*   `speech_speed` (numeric)
*   `speech_voice` (text, nullable)
*   `notification_settings` (jsonb)
*   `experimental_features` (jsonb)
*   `created_at`, `updated_at` (timestamptz)

### Performance Optimization (Indexes & Triggers)
*   Foreign key indices are established on `chats(user_id)`, `messages(chat_id)`, `messages(created_at desc)`, `attachments(chat_id)`, and `attachments(message_id)` to speed up selections.
*   Triggers update the `updated_at` timestamps on modification.
*   Replication tables are enabled under `supabase_realtime` to support instant UI synchronization.

---

## Installation & Configuration

Follow these steps to configure your environment and run the application locally:

### 1. Clone & Set Directory
Ensure you are in the project folder containing the Next.js files:
```bash
cd StudentAI
```

### 2. Install Packages
Download all necessary modules, components, and type files:
```bash
npm install
```

### 3. Setup Environment Variables
Create a file named `.env.local` in the root folder (a template `.env.local` is provided) and enter your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
GROK_API_KEY=your-grok-api-key-here
```

### 4. Database Setup
1. Log in to your **Supabase Dashboard** and open your project.
2. Navigate to the **SQL Editor** tab.
3. Open the file [supabase/schema.sql](supabase/schema.sql) in this codebase, copy the SQL statements, paste them into the SQL editor, and click **Run**.
4. Navigate to **Storage** in the Supabase console, create a new bucket named `attachments`, and set its policy to **Public Access** so users can upload and retrieve images.

### 5. Run Dev Server
Start the development compiler:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Troubleshooting

### 404 Table Not Found Errors
If your web browser's developer console displays `Failed to load resource: 404` when loading chats or preferences, it means the database tables do not exist in your Supabase project. Complete step 4 (Database Setup) to create the tables in Supabase.

### 400 Bad Request (UUID Validation Errors)
UUID columns require correctly structured UUID keys. If you write custom SQL or query messages manually, do not insert plain alphanumeric strings (e.g. 'xyz123') as IDs. Always use `default gen_random_uuid()` or generate a v4 UUID on the client side using the provided `generateUUID()` utility.

### 400 Bad Request (Grok API Completions Errors)
If calls to `/api/chat` fail with a 400 error:
1. Ensure your `GROK_API_KEY` is active and has credits available on your xAI developer console.
2. Confirm the model selected (e.g. `grok-2-1212`) is allowed on your API key subscription tier.
3. Check the client console to see the forwarded detailed error message from xAI.
