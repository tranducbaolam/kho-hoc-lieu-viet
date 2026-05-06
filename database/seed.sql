-- ============================================
-- Seed Data
-- Run after schema.sql
-- ============================================

-- Sample categories
insert into public.categories (name, slug, description) values
  ('Technology', 'technology', 'Articles about software, hardware, and tech trends'),
  ('Design', 'design', 'UI/UX design, typography, and visual communication'),
  ('Business', 'business', 'Entrepreneurship, strategy, and career growth'),
  ('Tutorial', 'tutorial', 'Step-by-step guides and how-tos')
on conflict (slug) do nothing;

-- Sample tags
insert into public.tags (name, slug) values
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('React', 'react'),
  ('Next.js', 'nextjs'),
  ('Supabase', 'supabase'),
  ('TailwindCSS', 'tailwindcss'),
  ('AI', 'ai'),
  ('Web Development', 'web-development')
on conflict (slug) do nothing;

-- ============================================
-- Vietnamese education taxonomy seed data
-- Run after supabase/migrations/20260506000000_add_education_taxonomy.sql
-- ============================================

insert into public.education_grades (name, slug, level_order, description) values
  ('Lớp 6', 'lop-6', 6, 'Học liệu theo chương trình lớp 6'),
  ('Lớp 7', 'lop-7', 7, 'Học liệu theo chương trình lớp 7'),
  ('Lớp 8', 'lop-8', 8, 'Học liệu theo chương trình lớp 8'),
  ('Lớp 9', 'lop-9', 9, 'Học liệu theo chương trình lớp 9'),
  ('Lớp 10', 'lop-10', 10, 'Học liệu theo chương trình lớp 10'),
  ('Lớp 11', 'lop-11', 11, 'Học liệu theo chương trình lớp 11'),
  ('Lớp 12', 'lop-12', 12, 'Học liệu theo chương trình lớp 12')
on conflict (slug) do nothing;

insert into public.education_subjects (name, slug, description) values
  ('Toán', 'toan', 'Bài học, lời giải, bài tập và đề thi môn Toán'),
  ('Ngữ văn', 'ngu-van', 'Bài học, bài soạn và đề thi môn Ngữ văn'),
  ('Tiếng Anh', 'tieng-anh', 'Bài học, bài tập và đề thi môn Tiếng Anh'),
  ('Tin học', 'tin-hoc', 'Bài học, thực hành và đề thi môn Tin học')
on conflict (slug) do nothing;

with chapter_seed(grade_slug, subject_slug, name, slug, chapter_order, description) as (
  values
    ('lop-9', 'toan', 'Căn bậc hai', 'can-bac-hai', 1, 'Kiến thức và bài tập về căn bậc hai'),
    ('lop-9', 'toan', 'Hàm số bậc nhất', 'ham-so-bac-nhat', 2, 'Hàm số bậc nhất và đồ thị'),
    ('lop-9', 'toan', 'Hệ phương trình', 'he-phuong-trinh', 3, 'Phương pháp giải hệ phương trình'),
    ('lop-9', 'toan', 'Phương trình bậc hai', 'phuong-trinh-bac-hai', 4, 'Phương trình bậc hai một ẩn'),
    ('lop-9', 'toan', 'Hình học', 'hinh-hoc', 5, 'Các chuyên đề hình học lớp 9'),
    ('lop-9', 'tieng-anh', 'Unit 1', 'unit-1', 1, 'Từ vựng và ngữ pháp Unit 1'),
    ('lop-9', 'tieng-anh', 'Unit 2', 'unit-2', 2, 'Từ vựng và ngữ pháp Unit 2'),
    ('lop-9', 'tieng-anh', 'Unit 3', 'unit-3', 3, 'Từ vựng và ngữ pháp Unit 3'),
    ('lop-9', 'tin-hoc', 'Thuật toán', 'thuat-toan', 1, 'Tư duy thuật toán cơ bản'),
    ('lop-9', 'tin-hoc', 'Lập trình C++', 'lap-trinh-cpp', 2, 'Cú pháp và bài tập C++ cơ bản'),
    ('lop-9', 'tin-hoc', 'Cấu trúc dữ liệu cơ bản', 'cau-truc-du-lieu-co-ban', 3, 'Mảng, xâu và cấu trúc dữ liệu nhập môn')
)
insert into public.education_chapters (grade_id, subject_id, name, slug, chapter_order, description)
select g.id, s.id, c.name, c.slug, c.chapter_order, c.description
from chapter_seed c
join public.education_grades g on g.slug = c.grade_slug
join public.education_subjects s on s.slug = c.subject_slug
on conflict (grade_id, subject_id, slug) do nothing;

insert into public.posts (
  title,
  slug,
  excerpt,
  content,
  status,
  published_at,
  content_type,
  grade_id,
  subject_id,
  chapter_id,
  lesson_order,
  difficulty,
  seo_title,
  seo_description
)
select
  'Phương trình bậc hai: lý thuyết và ví dụ',
  'phuong-trinh-bac-hai-ly-thuyet-va-vi-du',
  'Tóm tắt công thức, cách xét biệt thức và ví dụ giải phương trình bậc hai.',
  $html$
<section class="lesson-theory">
  <h2>I. Lý thuyết cần nhớ</h2>
  <p>Với phương trình bậc hai \(ax^2+bx+c=0\), ta xét biệt thức:</p>
  <p>\[
  \Delta=b^2-4ac
  \]</p>
  <table>
    <thead>
      <tr><th>Điều kiện</th><th>Kết luận</th></tr>
    </thead>
    <tbody>
      <tr><td>\(\Delta &gt; 0\)</td><td>Phương trình có hai nghiệm phân biệt</td></tr>
      <tr><td>\(\Delta = 0\)</td><td>Phương trình có nghiệm kép</td></tr>
      <tr><td>\(\Delta &lt; 0\)</td><td>Phương trình vô nghiệm trong tập số thực</td></tr>
    </tbody>
  </table>
</section>
<section class="lesson-example">
  <h2>II. Ví dụ minh họa</h2>
  <p>Giải phương trình \(x^2-5x+6=0\).</p>
</section>
<section class="lesson-solution">
  <h2>III. Lời giải chi tiết</h2>
  <p>Ta có \(\Delta = (-5)^2-4\cdot1\cdot6=1\).</p>
  <p>Suy ra phương trình có hai nghiệm \(x_1=2, x_2=3\).</p>
</section>
$html$,
  'published',
  now(),
  'lesson',
  g.id,
  s.id,
  c.id,
  1,
  'medium',
  'Phương trình bậc hai: lý thuyết và ví dụ',
  'Bài học mẫu với HTML chuẩn, bảng và công thức Toán dùng KaTeX.'
from public.education_grades g
join public.education_subjects s on s.slug = 'toan'
join public.education_chapters c on c.grade_id = g.id and c.subject_id = s.id and c.slug = 'phuong-trinh-bac-hai'
where g.slug = 'lop-9'
on conflict (slug) do nothing;
