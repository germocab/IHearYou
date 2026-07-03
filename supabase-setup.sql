-- ============================================================
-- ESQUEMA DE BASE DE DATOS · "Qué veo" (y futuras actividades)
-- Ejecutar una sola vez en el SQL Editor de Supabase.
-- ============================================================

-- Tabla de ejercicios (uno por imagen)
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null default 'que_veo',
  image_url text not null,
  title text,
  created_at timestamptz not null default now()
);

-- Tabla de audios asociados a cada ejercicio
create table if not exists exercise_audios (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references exercises(id) on delete cascade,
  audio_url text not null,
  label text,
  is_correct boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_exercise_audios_exercise_id on exercise_audios(exercise_id);
create index if not exists idx_exercises_activity_type on exercises(activity_type);

-- ============================================================
-- ROW LEVEL SECURITY
-- Para el prototipo dejamos lectura y escritura pública (anon key).
-- En producción se debe restringir la escritura a usuarios autenticados.
-- ============================================================
alter table exercises enable row level security;
alter table exercise_audios enable row level security;

create policy "public read exercises" on exercises for select using (true);
create policy "public write exercises" on exercises for insert with check (true);
create policy "public update exercises" on exercises for update using (true);
create policy "public delete exercises" on exercises for delete using (true);

create policy "public read audios" on exercise_audios for select using (true);
create policy "public write audios" on exercise_audios for insert with check (true);
create policy "public update audios" on exercise_audios for update using (true);
create policy "public delete audios" on exercise_audios for delete using (true);

-- ============================================================
-- STORAGE BUCKETS
-- Crear manualmente en Supabase Storage (o descomentar si tu plan
-- permite crear buckets vía SQL):
--   - images  (público)
--   - audios  (público)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('audios', 'audios', true)
on conflict (id) do nothing;

create policy "public read images" on storage.objects for select using (bucket_id = 'images');
create policy "public insert images" on storage.objects for insert with check (bucket_id = 'images');
create policy "public read audios file" on storage.objects for select using (bucket_id = 'audios');
create policy "public insert audios file" on storage.objects for insert with check (bucket_id = 'audios');
create policy "public delete images" on storage.objects for delete using (bucket_id = 'images');
create policy "public delete audios file" on storage.objects for delete using (bucket_id = 'audios');
