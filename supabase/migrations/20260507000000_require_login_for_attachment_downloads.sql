-- Require authentication before reading files from the private post-attachments bucket.
-- Attachment metadata remains readable for published posts so public article pages can list file names.

DROP POLICY IF EXISTS "Public can read post attachments for published posts (storage)"
  ON storage.objects;
DROP POLICY IF EXISTS "Public can read attachments for published posts (storage)"
  ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read published post attachments (storage)"
  ON storage.objects;

CREATE POLICY "Authenticated users can read published post attachments (storage)"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'post-attachments'
    AND auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.post_attachments a
        JOIN public.posts p ON p.id = a.post_id
        WHERE a.file_path = name
          AND p.status = 'published'
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );
