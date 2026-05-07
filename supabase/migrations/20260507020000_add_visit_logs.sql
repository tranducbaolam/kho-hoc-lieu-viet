-- Lightweight privacy-preserving visit logs for public article pages.

CREATE TABLE IF NOT EXISTS public.visit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  ip_hash text,
  user_agent text,
  country text,
  city text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visit_logs_created_at_idx ON public.visit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS visit_logs_path_idx ON public.visit_logs(path);
CREATE INDEX IF NOT EXISTS visit_logs_user_id_idx ON public.visit_logs(user_id);

ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read visit logs" ON public.visit_logs;

CREATE POLICY "Admins can read visit logs"
  ON public.visit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
