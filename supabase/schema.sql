-- Supabase Database Schema
-- Place this SQL in your Supabase SQL Editor to set up the database tables, triggers, and realtime listeners.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table if not exists public.profiles (
    id uuid primary key, -- References auth.users(id) in the future
    display_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CHATS TABLE
create table if not exists public.chats (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    is_pinned boolean default false not null,
    is_archived boolean default false not null,
    category text default 'General'::text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGES TABLE
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    content text not null,
    parent_id uuid references public.messages(id) on delete set null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATTACHMENTS TABLE
create table if not exists public.attachments (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats(id) on delete cascade not null,
    message_id uuid references public.messages(id) on delete cascade, -- Nullable if uploaded prior to sending message
    file_path text not null, -- Supabase Storage path
    file_name text not null,
    file_type text not null,
    file_size bigint not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SETTINGS TABLE
create table if not exists public.settings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid unique references public.profiles(id) on delete cascade not null,
    theme text default 'system'::text not null check (theme in ('light', 'dark', 'system')),
    model text default 'grok-2'::text not null,
    temperature numeric default 0.7 not null,
    font_size text default 'md'::text not null check (font_size in ('sm', 'md', 'lg')),
    speech_speed numeric default 1.0 not null,
    speech_voice text,
    notification_settings jsonb default '{"enabled": true}'::jsonb not null,
    experimental_features jsonb default '{"devMode": false}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.settings enable row level security;

-- Create Policies (Allow all operations for Anonymous/Guest for now, but ready for Auth user verification)
-- Future replacement: change 'true' to '(auth.uid() = user_id)' or similar.

-- Profiles
drop policy if exists "Allow public read profiles" on public.profiles;
drop policy if exists "Allow public insert profiles" on public.profiles;
drop policy if exists "Allow public update profiles" on public.profiles;
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow public insert profiles" on public.profiles for insert with check (true);
create policy "Allow public update profiles" on public.profiles for update using (true);

-- Chats
drop policy if exists "Allow public read chats" on public.chats;
drop policy if exists "Allow public insert chats" on public.chats;
drop policy if exists "Allow public update chats" on public.chats;
drop policy if exists "Allow public delete chats" on public.chats;
create policy "Allow public read chats" on public.chats for select using (true);
create policy "Allow public insert chats" on public.chats for insert with check (true);
create policy "Allow public update chats" on public.chats for update using (true);
create policy "Allow public delete chats" on public.chats for delete using (true);

-- Messages
drop policy if exists "Allow public read messages" on public.messages;
drop policy if exists "Allow public insert messages" on public.messages;
drop policy if exists "Allow public update messages" on public.messages;
drop policy if exists "Allow public delete messages" on public.messages;
create policy "Allow public read messages" on public.messages for select using (true);
create policy "Allow public insert messages" on public.messages for insert with check (true);
create policy "Allow public update messages" on public.messages for update using (true);
create policy "Allow public delete messages" on public.messages for delete using (true);

-- Attachments
drop policy if exists "Allow public read attachments" on public.attachments;
drop policy if exists "Allow public insert attachments" on public.attachments;
drop policy if exists "Allow public update attachments" on public.attachments;
drop policy if exists "Allow public delete attachments" on public.attachments;
create policy "Allow public read attachments" on public.attachments for select using (true);
create policy "Allow public insert attachments" on public.attachments for insert with check (true);
create policy "Allow public update attachments" on public.attachments for update using (true);
create policy "Allow public delete attachments" on public.attachments for delete using (true);

-- Settings
drop policy if exists "Allow public read settings" on public.settings;
drop policy if exists "Allow public insert settings" on public.settings;
drop policy if exists "Allow public update settings" on public.settings;
create policy "Allow public read settings" on public.settings for select using (true);
create policy "Allow public insert settings" on public.settings for insert with check (true);
create policy "Allow public update settings" on public.settings for update using (true);

-- Indexes for performance optimization
create index if not exists idx_chats_user_id on public.chats(user_id);
create index if not exists idx_messages_chat_id on public.messages(chat_id);
create index if not exists idx_messages_created_at on public.messages(created_at desc);
create index if not exists idx_attachments_chat_id on public.attachments(chat_id);
create index if not exists idx_attachments_message_id on public.attachments(message_id);

-- Auto Update triggers for updated_at fields
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();

create trigger set_chats_updated_at
    before update on public.chats
    for each row execute function public.handle_updated_at();

create trigger set_settings_updated_at
    before update on public.settings
    for each row execute function public.handle_updated_at();

-- Insert default guest profile and settings for instant loading
-- Default Guest UUID: '00000000-0000-0000-0000-000000000000'
insert into public.profiles (id, display_name, avatar_url)
values ('00000000-0000-0000-0000-000000000000', 'Guest User', '')
on conflict (id) do nothing;

insert into public.settings (user_id, theme, model, temperature, font_size)
values ('00000000-0000-0000-0000-000000000000', 'system', 'grok-2', 0.7, 'md')
on conflict (user_id) do nothing;

-- Enable Realtime for relevant tables in Supabase
-- Supabase default publication name is supabase_realtime
alter publication supabase_realtime add table public.chats;
alter publication supabase_realtime add table public.messages;
