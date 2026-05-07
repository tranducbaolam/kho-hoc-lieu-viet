-- Article view counts and attachment download counts.
-- Counters are incremented through narrow RPC functions instead of opening table UPDATE policies.

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS view_count bigint NOT NULL DEFAULT 0;

ALTER TABLE public.post_attachments
  ADD COLUMN IF NOT EXISTS download_count bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_post_view(post_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.posts
  SET view_count = view_count + 1
  WHERE posts.id = increment_post_view.post_id
    AND posts.status = 'published'
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_attachment_download(attachment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE public.post_attachments
  SET download_count = download_count + 1
  WHERE post_attachments.id = increment_attachment_download.attachment_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.posts
        WHERE posts.id = post_attachments.post_id
          AND posts.status = 'published'
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
      )
    )
  RETURNING download_count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_post_view(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_attachment_download(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.increment_post_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_attachment_download(uuid) TO service_role;
