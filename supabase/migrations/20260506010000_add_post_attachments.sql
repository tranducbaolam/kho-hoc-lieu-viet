-- ============================================
-- Post attachments (downloadable files)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_path text,
  file_type text,
  file_size bigint,
  description text,
  display_order int DEFAULT 0,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS post_attachments_post_id_idx ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS post_attachments_display_order_idx ON public.post_attachments(display_order);

ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: post_attachments
-- ============================================

-- Public can read attachments only when the related post is published
CREATE POLICY "Public can read attachments for published posts"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND status = 'published'
    )
  );

-- Authors can read/manage attachments for their own posts
CREATE POLICY "Authors can read own post attachments"
  ON public.post_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can manage own post attachments"
  ON public.post_attachments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts
      WHERE id = post_id AND author_id = auth.uid()
    )
  );

-- Admins can manage all attachments
CREATE POLICY "Admins can manage all post attachments"
  ON public.post_attachments FOR ALL
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

-- ============================================
-- STORAGE: post-attachments bucket + RLS
-- ============================================

-- Bucket should exist (private). Files are served via signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-attachments', 'post-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {post_id}/{timestamp}-{safe_file_name}
-- Allow upload only for authors of the post or admins.
CREATE POLICY "Users can upload attachments for their posts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-attachments'
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id::text = (string_to_array(name, '/'))[1]
        AND (
          p.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

-- Allow read only when:
-- - related post is published (public), OR
-- - owner author (draft OK), OR
-- - admin
CREATE POLICY "Public can read attachments for published posts (storage)"
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
      OR EXISTS (
        SELECT 1
        FROM public.post_attachments a
        JOIN public.posts p ON p.id = a.post_id
        WHERE a.file_path = name
          AND p.author_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

CREATE POLICY "Users can delete attachments for their posts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-attachments'
    AND EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id::text = (string_to_array(name, '/'))[1]
        AND (
          p.author_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
        )
    )
  );

