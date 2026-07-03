// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================
// Reemplaza estos valores si cambian las credenciales del proyecto.
// Se usa el cliente oficial de Supabase vía CDN (ver <script> en el HTML).
// ============================================================

const SUPABASE_URL = 'https://vytwbeyljlaqcmlupmgx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5dHdiZXlsamxhcWNtbHVwbWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTUyMjQsImV4cCI6MjA5ODY3MTIyNH0.XzklQ942d-ZX6p9_yhO5PK_kgpuqlg6gxY4FgWmwXag';

// Cliente global de Supabase, disponible para toda la app.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ------------------------------------------------------------
// Nombres de tablas y buckets — centralizados para facilitar
// futuras expansiones (nuevas actividades, nuevos tipos de medios).
// ------------------------------------------------------------
const TABLES = {
  EXERCISES: 'exercises',       // id, activity_type, image_url, created_at
  AUDIOS: 'exercise_audios',    // id, exercise_id, audio_url, label, is_correct, position
};

const BUCKETS = {
  IMAGES: 'images',
  AUDIOS: 'audios',
};

const ACTIVITY_TYPES = {
  QUE_VEO: 'que_veo',
};
