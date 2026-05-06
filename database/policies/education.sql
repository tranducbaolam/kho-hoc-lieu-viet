-- ============================================
-- Education taxonomy RLS policies
-- ============================================

create policy "Education grades are publicly readable"
  on public.education_grades for select
  using (true);

create policy "Admins can manage education grades"
  on public.education_grades for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Education subjects are publicly readable"
  on public.education_subjects for select
  using (true);

create policy "Admins can manage education subjects"
  on public.education_subjects for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Education chapters are publicly readable"
  on public.education_chapters for select
  using (true);

create policy "Admins can manage education chapters"
  on public.education_chapters for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
