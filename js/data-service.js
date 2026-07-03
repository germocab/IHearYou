// ============================================================
// CAPA DE DATOS
// Todas las operaciones contra Supabase (DB + Storage) viven aquí,
// para que las pantallas de usuario y el panel de administración
// reutilicen la misma lógica. Al agregar nuevas actividades,
// extiende este archivo en lugar de duplicar consultas.
// ============================================================

const DataService = {

  /**
   * Trae todos los ejercicios de un tipo de actividad, con sus audios.
   * @param {string} activityType
   */
  async getExercises(activityType = ACTIVITY_TYPES.QUE_VEO) {
    const { data, error } = await supabaseClient
      .from(TABLES.EXERCISES)
      .select(`
        id, activity_type, image_url, title, created_at,
        exercise_audios ( id, audio_url, label, is_correct, position )
      `)
      .eq('activity_type', activityType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /** Trae un ejercicio aleatorio con exactamente sus audios asociados. */
  async getRandomExercise(activityType = ACTIVITY_TYPES.QUE_VEO, excludeId = null) {
    const exercises = await this.getExercises(activityType);
    const usable = exercises.filter(e => e.exercise_audios && e.exercise_audios.length >= 2);
    if (usable.length === 0) return null;

    let pool = usable;
    if (excludeId && usable.length > 1) {
      pool = usable.filter(e => e.id !== excludeId);
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // Baraja el orden de las alternativas para que la correcta
    // no aparezca siempre en la misma posición.
    picked.exercise_audios = this._shuffle([...picked.exercise_audios]);
    return picked;
  },

  /** Crea un ejercicio junto con sus audios. Recibe URLs ya subidas a Storage. */
  async createExercise({ activityType, imageUrl, title, audios }) {
    const { data: exercise, error: exErr } = await supabaseClient
      .from(TABLES.EXERCISES)
      .insert({ activity_type: activityType, image_url: imageUrl, title })
      .select()
      .single();
    if (exErr) throw exErr;

    const rows = audios.map((a, i) => ({
      exercise_id: exercise.id,
      audio_url: a.url,
      label: a.label || null,
      is_correct: !!a.isCorrect,
      position: i,
    }));

    const { error: audErr } = await supabaseClient.from(TABLES.AUDIOS).insert(rows);
    if (audErr) throw audErr;

    return exercise;
  },

  /** Elimina un ejercicio (los audios se eliminan por cascada). */
  async deleteExercise(exerciseId) {
    const { error } = await supabaseClient.from(TABLES.EXERCISES).delete().eq('id', exerciseId);
    if (error) throw error;
  },

  /** Reemplaza el título de un ejercicio existente. */
  async updateExerciseTitle(exerciseId, title) {
    const { error } = await supabaseClient.from(TABLES.EXERCISES).update({ title }).eq('id', exerciseId);
    if (error) throw error;
  },

  /** Marca cuál audio de un ejercicio es el correcto (desmarca los demás). */
  async setCorrectAudio(exerciseId, correctAudioId) {
    const { error: e1 } = await supabaseClient
      .from(TABLES.AUDIOS)
      .update({ is_correct: false })
      .eq('exercise_id', exerciseId);
    if (e1) throw e1;

    const { error: e2 } = await supabaseClient
      .from(TABLES.AUDIOS)
      .update({ is_correct: true })
      .eq('id', correctAudioId);
    if (e2) throw e2;
  },

  /** Sube un archivo (imagen o audio) a Storage y retorna su URL pública. */
  async uploadFile(bucket, file) {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseClient.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw error;

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
};
