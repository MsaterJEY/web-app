-- ============================================
-- PORTFOLIO WEBSITE - SUPABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  title text,
  location text,
  website text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
create table if not exists projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  thumbnail_url text,
  project_url text,
  github_url text,
  tech_stack text[],
  category text,
  is_featured boolean default false,
  is_published boolean default true,
  view_count integer default 0,
  like_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- SKILLS TABLE
-- ============================================
create table if not exists skills (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  category text,
  level integer check (level between 1 and 100),
  icon_url text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================
create table if not exists contact_messages (
  id uuid default uuid_generate_v4() primary key,
  to_user_id uuid references profiles(id) on delete cascade not null,
  from_name text not null,
  from_email text not null,
  subject text,
  message text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ============================================
-- PROJECT LIKES TABLE
-- ============================================
create table if not exists project_likes (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade,
  ip_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(project_id, user_id)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table profiles enable row level security;
alter table projects enable row level security;
alter table skills enable row level security;
alter table contact_messages enable row level security;
alter table project_likes enable row level security;

-- PROFILES policies
create policy "Public profiles are viewable by everyone"
  on profiles for select using (is_public = true);

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- PROJECTS policies
create policy "Published projects are viewable by everyone"
  on projects for select using (is_published = true);

create policy "Users can view own projects"
  on projects for select using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on projects for insert with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete using (auth.uid() = user_id);

-- SKILLS policies
create policy "Skills are viewable by everyone"
  on skills for select using (true);

create policy "Users can manage own skills"
  on skills for all using (auth.uid() = user_id);

-- CONTACT MESSAGES policies
create policy "Anyone can send contact messages"
  on contact_messages for insert with check (true);

create policy "Users can view messages sent to them"
  on contact_messages for select using (auth.uid() = to_user_id);

create policy "Users can update their messages (mark read)"
  on contact_messages for update using (auth.uid() = to_user_id);

-- PROJECT LIKES policies
create policy "Likes are viewable by everyone"
  on project_likes for select using (true);

create policy "Authenticated users can like"
  on project_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on project_likes for delete using (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- UPDATE TIMESTAMP FUNCTION
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at_column();

create trigger update_projects_updated_at before update on projects
  for each row execute procedure update_updated_at_column();

-- ============================================
-- STORAGE BUCKET (run separately if needed)
-- ============================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('projects', 'projects', true);
