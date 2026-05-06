-- ============================================
-- Blog CMS Schema
-- Run in Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text not null,
  full_name  text,
  avatar_url text,
  role       text not null default 'author' check (role in ('admin', 'author')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories
create table if not exists public.categories (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tags
create table if not exists public.tags (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  slug       text not null unique,
  created_at timestamptz default now()
);

-- Education Grades
create table if not exists public.education_grades (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  slug        text not null unique,
  level_order int not null,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Education Subjects
create table if not exists public.education_subjects (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Education Chapters
create table if not exists public.education_chapters (
  id            uuid default gen_random_uuid() primary key,
  grade_id      uuid references public.education_grades(id) on delete cascade,
  subject_id    uuid references public.education_subjects(id) on delete cascade,
  name          text not null,
  slug          text not null,
  description   text,
  chapter_order int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (grade_id, subject_id, slug)
);

-- Posts
create table if not exists public.posts (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  slug            text not null unique,
  excerpt         text,
  content         text,  -- TipTap JSON stringified
  cover_image     text,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  author_id       uuid references public.profiles(id) on delete set null,
  category_id     uuid references public.categories(id) on delete set null,
  content_type    text default 'lesson' check (content_type in ('lesson', 'solution', 'exercise', 'exam', 'news')),
  grade_id        uuid references public.education_grades(id) on delete set null,
  subject_id      uuid references public.education_subjects(id) on delete set null,
  chapter_id      uuid references public.education_chapters(id) on delete set null,
  lesson_order    int default 0,
  exam_type       text,
  exam_year       int,
  school_name     text,
  province        text,
  difficulty      text check (difficulty is null or difficulty in ('easy', 'medium', 'hard', 'advanced')),
  seo_title       text,
  seo_description text,
  published_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Post Tags (join table)
create table if not exists public.post_tags (
  post_id uuid references public.posts(id) on delete cascade,
  tag_id  uuid references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ============================================
-- INDEXES
-- ============================================

create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_category_id_idx on public.posts(category_id);
create index if not exists posts_status_idx on public.posts(status);
create index if not exists posts_slug_idx on public.posts(slug);
create index if not exists posts_published_at_idx on public.posts(published_at desc);
create index if not exists posts_content_type_idx on public.posts(content_type);
create index if not exists posts_grade_id_idx on public.posts(grade_id);
create index if not exists posts_subject_id_idx on public.posts(subject_id);
create index if not exists posts_chapter_id_idx on public.posts(chapter_id);
create index if not exists posts_exam_year_idx on public.posts(exam_year);
create index if not exists categories_slug_idx on public.categories(slug);
create index if not exists tags_slug_idx on public.tags(slug);
create index if not exists education_chapters_grade_subject_idx on public.education_chapters(grade_id, subject_id);
create index if not exists education_grades_slug_idx on public.education_grades(slug);
create index if not exists education_subjects_slug_idx on public.education_subjects(slug);
create index if not exists education_chapters_slug_idx on public.education_chapters(slug);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-create profile on new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profiles
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Auto-update updated_at on posts
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at
  before update on public.posts
  for each row execute function public.handle_updated_at();

-- Auto-update updated_at on categories
drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.handle_updated_at();

-- Auto-update updated_at on education grades
drop trigger if exists education_grades_updated_at on public.education_grades;
create trigger education_grades_updated_at
  before update on public.education_grades
  for each row execute function public.handle_updated_at();

-- Auto-update updated_at on education subjects
drop trigger if exists education_subjects_updated_at on public.education_subjects;
create trigger education_subjects_updated_at
  before update on public.education_subjects
  for each row execute function public.handle_updated_at();

-- Auto-update updated_at on education chapters
drop trigger if exists education_chapters_updated_at on public.education_chapters;
create trigger education_chapters_updated_at
  before update on public.education_chapters
  for each row execute function public.handle_updated_at();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.education_grades enable row level security;
alter table public.education_subjects enable row level security;
alter table public.education_chapters enable row level security;
