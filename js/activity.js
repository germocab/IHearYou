// ============================================================
// LÓGICA DE LA ACTIVIDAD "¿QUÉ VEO?"
// ============================================================
// Flujo:
// 1. Se carga un ejercicio aleatorio con sus 2 alternativas de audio.
// 2. El usuario puede reproducir cada audio (tocando el botón).
// 3. Tocar una alternativa la selecciona como respuesta:
//    - Si es correcta: se muestra en verde + mensaje de acierto.
//    - Si es incorrecta: se muestra en rojo + mensaje para reintentar.
// 4. Tras un breve delay, se carga automáticamente el siguiente ejercicio.
// ============================================================

const state = {
  currentExercise: null,
  lastExerciseId: null,
  answered: false,
  correctCount: 0,
  totalCount: 0,
  currentAudio: null, // objeto <audio> en reproducción
};

const els = {
  content: document.getElementById('screenContent'),
  progressFill: document.getElementById('progressFill'),
  pointsBadge: document.getElementById('pointsBadge'),
  btnClose: document.getElementById('btnClose'),
};

els.btnClose.addEventListener('click', () => {
  window.location.href = 'index.html';
});

init();

async function init() {
  renderLoading();
  await loadNextExercise();
}

async function loadNextExercise() {
  state.answered = false;
  els.pointsBadge.style.display = 'none';
  updateProgress(0);

  try {
    const exercise = await DataService.getRandomExercise(ACTIVITY_TYPES.QUE_VEO, state.lastExerciseId);
    state.currentExercise = exercise;
    state.lastExerciseId = exercise ? exercise.id : null;

    if (!exercise) {
      renderEmpty();
      return;
    }
    renderExercise(exercise);
  } catch (err) {
    console.error(err);
    renderError();
  }
}

// ------------------------------------------------------------
// RENDER: estado de carga
// ------------------------------------------------------------
function renderLoading() {
  els.content.innerHTML = `
    <div class="loading-screen">
      <div class="spinner"></div>
      <p>Cargando ejercicio…</p>
    </div>
  `;
}

// ------------------------------------------------------------
// RENDER: sin ejercicios disponibles
// ------------------------------------------------------------
function renderEmpty() {
  els.content.innerHTML = `
    <div class="empty-screen">
      <div style="font-size:40px;">🗂️</div>
      <p><strong>Aún no hay ejercicios cargados.</strong><br>Agrega contenido desde el panel de administración para comenzar.</p>
      <a href="admin.html" class="btn btn-secondary" style="margin-top:10px; text-decoration:none;">Ir al panel</a>
    </div>
  `;
}

function renderError() {
  els.content.innerHTML = `
    <div class="empty-screen">
      <div style="font-size:40px;">⚠️</div>
      <p><strong>No se pudo cargar el ejercicio.</strong><br>Verifica tu conexión e inténtalo de nuevo.</p>
      <button class="btn btn-primary" id="retryBtn" style="margin-top:10px;">Reintentar</button>
    </div>
  `;
  document.getElementById('retryBtn').addEventListener('click', loadNextExercise);
}

// ------------------------------------------------------------
// RENDER: ejercicio activo
// ------------------------------------------------------------
function renderExercise(exercise) {
  const audios = exercise.exercise_audios;

  els.content.innerHTML = `
    <div class="activity-header">
      <div class="dot-icon">👁️</div>
      <h1>¿Qué veo?</h1>
    </div>
    <p class="activity-instructions">Selecciona la opción que contenga lo que ves en la imagen.</p>

    <div class="image-card">
      <img src="${exercise.image_url}" alt="Imagen del ejercicio" />
    </div>

    <div class="feedback-banner" id="feedbackBanner"></div>
    <div class="feedback-caption" id="feedbackCaption"></div>

    <div class="options-list" id="optionsList">
      ${audios.map((a, i) => renderOptionButton(a, i)).join('')}
    </div>
  `;

  audios.forEach((a, i) => {
    const btn = document.getElementById(`opt-${i}`);
    btn.addEventListener('click', () => handleSelect(a, i, exercise));
  });
}

function renderOptionButton(audio, index) {
  const letter = String.fromCharCode(65 + index); // A, B, C...
  const variantClass = index % 2 === 1 ? 'variant-b' : '';
  const bars = Array.from({ length: 22 })
    .map(() => `<span style="height:${6 + Math.round(Math.random() * 14)}px;"></span>`)
    .join('');

  return `
    <button class="audio-option ${variantClass}" id="opt-${index}" data-audio-url="${audio.audio_url}">
      <span class="opt-label">${letter}.</span>
      <span class="play-icon">▶</span>
      <span class="waveform">${bars}</span>
      <span class="check-mark">✓</span>
    </button>
  `;
}

// ------------------------------------------------------------
// INTERACCIÓN: reproducir + seleccionar respuesta
// ------------------------------------------------------------
function handleSelect(audioData, index, exercise) {
  if (state.answered) return; // evita doble respuesta mientras se resuelve

  const btn = document.getElementById(`opt-${index}`);
  playAudio(audioData.audio_url, btn);

  // Pequeño delay para permitir que el usuario perciba el audio antes
  // de bloquear la interfaz con el resultado.
  state.answered = true;
  const isCorrect = !!audioData.is_correct;

  setTimeout(() => {
    resolveAnswer(isCorrect, btn, exercise);
  }, 450);
}

function playAudio(url, btnEl) {
  if (state.currentAudio) {
    state.currentAudio.pause();
  }
  document.querySelectorAll('.audio-option').forEach(b => b.classList.remove('playing'));

  const audio = new Audio(url);
  state.currentAudio = audio;
  if (btnEl) btnEl.classList.add('playing');

  audio.play().catch(() => { /* reproducción bloqueada por el navegador hasta interacción */ });
  audio.addEventListener('ended', () => {
    if (btnEl) btnEl.classList.remove('playing');
  });
}

function resolveAnswer(isCorrect, selectedBtn, exercise) {
  state.totalCount++;
  if (isCorrect) state.correctCount++;

  updateProgress(100);

  // Oculta la alternativa no seleccionada y expande la elegida,
  // replicando el patrón visual de las referencias.
  document.querySelectorAll('.audio-option').forEach(btn => {
    if (btn !== selectedBtn) {
      btn.style.display = 'none';
    } else {
      btn.disabled = true;
      btn.classList.add(isCorrect ? 'state-correct' : 'state-incorrect');
    }
  });

  const banner = document.getElementById('feedbackBanner');
  const caption = document.getElementById('feedbackCaption');

  if (isCorrect) {
    banner.className = 'feedback-banner correct show';
    banner.innerHTML = '✅ Correcto';
    caption.className = 'feedback-caption show';
    caption.textContent = exercise.title ? `Esta es ${exercise.title}` : '¡Muy bien!';
    els.pointsBadge.style.display = 'block';
  } else {
    banner.className = 'feedback-banner incorrect show';
    banner.innerHTML = '⚠️ Ups, intenta de nuevo';
  }

  // Avanza automáticamente al siguiente ejercicio.
  setTimeout(loadNextExercise, 1700);
}

function updateProgress(pct) {
  els.progressFill.style.width = `${pct}%`;
}
