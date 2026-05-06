-- ============================================
-- Migration: add Vietnamese education taxonomy
-- Created: 2026-05-06
-- ============================================

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.education_grades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  level_order INT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.education_subjects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.education_chapters (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id      UUID REFERENCES public.education_grades(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES public.education_subjects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  description   TEXT,
  chapter_order INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (grade_id, subject_id, slug)
);

-- ============================================
-- POSTS EDUCATION FIELDS
-- ============================================

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'lesson'
    CHECK (content_type IN ('lesson', 'solution', 'exercise', 'exam', 'news')),
  ADD COLUMN IF NOT EXISTS grade_id UUID REFERENCES public.education_grades(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.education_subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS chapter_id UUID REFERENCES public.education_chapters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lesson_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_type TEXT,
  ADD COLUMN IF NOT EXISTS exam_year INT,
  ADD COLUMN IF NOT EXISTS school_name TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT
    CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard', 'advanced'));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS posts_content_type_idx ON public.posts(content_type);
CREATE INDEX IF NOT EXISTS posts_grade_id_idx ON public.posts(grade_id);
CREATE INDEX IF NOT EXISTS posts_subject_id_idx ON public.posts(subject_id);
CREATE INDEX IF NOT EXISTS posts_chapter_id_idx ON public.posts(chapter_id);
CREATE INDEX IF NOT EXISTS posts_exam_year_idx ON public.posts(exam_year);
CREATE INDEX IF NOT EXISTS education_chapters_grade_subject_idx ON public.education_chapters(grade_id, subject_id);
CREATE INDEX IF NOT EXISTS education_grades_slug_idx ON public.education_grades(slug);
CREATE INDEX IF NOT EXISTS education_subjects_slug_idx ON public.education_subjects(slug);
CREATE INDEX IF NOT EXISTS education_chapters_slug_idx ON public.education_chapters(slug);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS education_grades_updated_at ON public.education_grades;
CREATE TRIGGER education_grades_updated_at
  BEFORE UPDATE ON public.education_grades
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS education_subjects_updated_at ON public.education_subjects;
CREATE TRIGGER education_subjects_updated_at
  BEFORE UPDATE ON public.education_subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS education_chapters_updated_at ON public.education_chapters;
CREATE TRIGGER education_chapters_updated_at
  BEFORE UPDATE ON public.education_chapters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.education_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Education grades are publicly readable" ON public.education_grades;
CREATE POLICY "Education grades are publicly readable"
  ON public.education_grades FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage education grades" ON public.education_grades;
CREATE POLICY "Admins can manage education grades"
  ON public.education_grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Education subjects are publicly readable" ON public.education_subjects;
CREATE POLICY "Education subjects are publicly readable"
  ON public.education_subjects FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage education subjects" ON public.education_subjects;
CREATE POLICY "Admins can manage education subjects"
  ON public.education_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Education chapters are publicly readable" ON public.education_chapters;
CREATE POLICY "Education chapters are publicly readable"
  ON public.education_chapters FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage education chapters" ON public.education_chapters;
CREATE POLICY "Admins can manage education chapters"
  ON public.education_chapters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
