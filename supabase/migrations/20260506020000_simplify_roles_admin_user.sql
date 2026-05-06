-- ============================================
-- Simplify roles: admin + user (remove author)
-- ============================================

-- 1) Profiles role constraint + default
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'user'));

-- 2) Convert existing non-admin users to role=user
UPDATE public.profiles
SET role = 'user'
WHERE role <> 'admin';

-- 3) Ensure new users get role=user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4) RLS POLICIES
-- Drop old policies first to avoid duplicates.
-- ============================================

-- POSTS
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can read own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can read all posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can create posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can delete any post" ON public.posts;

CREATE POLICY "Public can read published posts"
  ON public.posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can read all posts"
  ON public.posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update posts"
  ON public.posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete posts"
  ON public.posts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- POST TAGS
DROP POLICY IF EXISTS "Public can read post_tags for published posts" ON public.post_tags;
DROP POLICY IF EXISTS "Authors can manage own post_tags" ON public.post_tags;
DROP POLICY IF EXISTS "Admins can manage all post_tags" ON public.post_tags;

CREATE POLICY "Public can read post_tags for published posts"
  ON public.post_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND status = 'published'
    )
  );

CREATE POLICY "Admins can manage all post_tags"
  ON public.post_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- CATEGORIES
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Admins can create categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;

CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.categories FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.categories FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- TAGS
DROP POLICY IF EXISTS "Tags are publicly readable" ON public.tags;
DROP POLICY IF EXISTS "Admins can create tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can update tags" ON public.tags;
DROP POLICY IF EXISTS "Admins can delete tags" ON public.tags;

CREATE POLICY "Tags are publicly readable"
  ON public.tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can create tags"
  ON public.tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update tags"
  ON public.tags FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete tags"
  ON public.tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- EDUCATION TAXONOMY
DROP POLICY IF EXISTS "Education grades are publicly readable" ON public.education_grades;
DROP POLICY IF EXISTS "Admins can manage education grades" ON public.education_grades;
DROP POLICY IF EXISTS "Education subjects are publicly readable" ON public.education_subjects;
DROP POLICY IF EXISTS "Admins can manage education subjects" ON public.education_subjects;
DROP POLICY IF EXISTS "Education chapters are publicly readable" ON public.education_chapters;
DROP POLICY IF EXISTS "Admins can manage education chapters" ON public.education_chapters;

CREATE POLICY "Education grades are publicly readable"
  ON public.education_grades FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage education grades"
  ON public.education_grades FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Education subjects are publicly readable"
  ON public.education_subjects FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage education subjects"
  ON public.education_subjects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Education chapters are publicly readable"
  ON public.education_chapters FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage education chapters"
  ON public.education_chapters FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- POST ATTACHMENTS
DROP POLICY IF EXISTS "Public can read attachments for published posts" ON public.post_attachments;
DROP POLICY IF EXISTS "Authors can read own post attachments" ON public.post_attachments;
DROP POLICY IF EXISTS "Authors can manage own post attachments" ON public.post_attachments;
DROP POLICY IF EXISTS "Admins can manage all post attachments" ON public.post_attachments;

CREATE POLICY "Public can read attachments for published posts"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND status = 'published')
  );

CREATE POLICY "Admins can manage all post attachments"
  ON public.post_attachments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- STORAGE: post-attachments bucket
-- Drop old author-based policies (created earlier) and recreate as admin-only.
DROP POLICY IF EXISTS "Users can upload attachments for their posts" ON storage.objects;
DROP POLICY IF EXISTS "Public can read attachments for published posts (storage)" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete attachments for their posts" ON storage.objects;

CREATE POLICY "Admins can upload post attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public can read post attachments for published posts (storage)"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'post-attachments'
    AND (
      EXISTS (
        SELECT 1
        FROM public.post_attachments a
        JOIN public.posts p ON p.id = a.post_id
        WHERE a.file_path = name
          AND p.status = 'published'
      )
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
  );

CREATE POLICY "Admins can delete post attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-attachments'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- PROFILES (prevent users from changing their own role)
DROP POLICY IF EXISTS "Profiles are publicly readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Profiles are publicly readable"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

