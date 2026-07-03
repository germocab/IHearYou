// ============================================================
// LÓGICA DEL PANEL DE ADMINISTRACIÓN
// ============================================================

let audioRowCount = 0;

const els = {
  tabs: document.querySelectorAll('.admin-tab'),
  tabCreate: document.getElementById('tab-create'),
  tabList: document.getElementById('tab-list'),
  countBadge: document.getElementById('countBadge'),

  inputTitle: document.getElementById('inputTitle'),
  inputImage: document.getElementById('inputImage'),
  audioInputsContainer: document.getElementById('audioInputsContainer'),
  btnAddAudio: document.getElementById('btnAddAudio'),
  btnSaveExercise: document.getElementById('btnSaveExercise'),
  uploadProgress: document.getElementById('uploadProgress'),
  uploadProgressFill: document.getElementById('uploadProgressFill'),
  exerciseList: document.getElementById('exerciseList'),
  toast: document.getElementById('toast'),
};

// ------------------------------------------------------------
// TABS
// ------------------------------------------------------------
els.tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    els.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    els.tabCreate.style.display = target === 'create' ? 'block' : 'none';
    els.tabList.style.display = target === 'list' ? 'block' : 'none';
    if (target === 'list') loadExerciseList();
  });
});

// ------------------------------------------------------------
// FORMULARIO: FILAS DE AUDIO DINÁMICAS
// ------------------------------------------------------------
function addAudioRow(isCorrectDefault = false) {
  audioRowCount++;
  const id = audioRowCount;
  const row = document.createElement('div');
  row.className = 'audio-input-row';
  row.dataset.rowId = id;
  row.innerHTML = `
    <div class="file-field">
      <input type="text" placeholder="Etiqueta interna (ej: Fuente con peras)" data-role="label" />
      <input type="file" accept="audio/*" data-role="file" />
    </div>
    <label class="correct-toggle ${isCorrectDefault ? 'is-correct' : ''}">
      <input type="radio" name="correctAudio" data-role="correct" ${isCorrectDefault ? 'checked' : ''} />
      Correcta
    </label>
    <button class="icon-btn small danger" type="button" data-role="remove" title="Quitar alternativa">✕</button>
  `;
  els.audioInputsContainer.appendChild(row);

  row.querySelector('[data-role=remove]').addEventListener('click', () => row.remove());
  row.querySelector('[data-role=correct]').addEventListener('change', updateCorrectHighlight);
}

function updateCorrectHighlight() {
  document.querySelectorAll('.audio-input-row').forEach(row => {
    const checked = row.querySelector('[data-role=correct]').checked;
    row.querySelector('.correct-toggle').classList.toggle('is-correct', checked);
  });
}

els.btnAddAudio.addEventListener('click', () => addAudioRow());

// Alternativas iniciales por defecto (A y B), como en el flujo descrito.
addAudioRow(true);
addAudioRow(false);

// ------------------------------------------------------------
// GUARDAR EJERCICIO
// ------------------------------------------------------------
els.btnSaveExercise.addEventListener('click', async () => {
  const title = els.inputTitle.value.trim();
  const imageFile = els.inputImage.files[0];
  const rows = Array.from(document.querySelectorAll('.audio-input-row'));

  if (!imageFile) return showToast('Selecciona una imagen para el ejercicio.', 'error');
  if (rows.length < 2) return showToast('Agrega al menos dos alternativas de audio.', 'error');

  const audiosToUpload = rows.map(row => ({
    file: row.querySelector('[data-role=file]').files[0],
    label: row.querySelector('[data-role=label]').value.trim(),
    isCorrect: row.querySelector('[data-role=correct]').checked,
  }));

  if (audiosToUpload.some(a => !a.file)) {
    return showToast('Falta el archivo de audio en alguna alternativa.', 'error');
  }
  if (!audiosToUpload.some(a => a.isCorrect)) {
    return showToast('Marca cuál alternativa es la correcta.', 'error');
  }

  setSaving(true);
  try {
    const imageUrl = await DataService.uploadFile(BUCKETS.IMAGES, imageFile);

    const audios = [];
    for (const a of audiosToUpload) {
      const url = await DataService.uploadFile(BUCKETS.AUDIOS, a.file);
      audios.push({ url, label: a.label, isCorrect: a.isCorrect });
    }

    await DataService.createExercise({
      activityType: ACTIVITY_TYPES.QUE_VEO,
      imageUrl,
      title,
      audios,
    });

    showToast('Ejercicio guardado correctamente.', 'success');
    resetForm();
  } catch (err) {
    console.error(err);
    showToast('Ocurrió un error al guardar. Revisa la consola.', 'error');
  } finally {
    setSaving(false);
  }
});

function resetForm() {
  els.inputTitle.value = '';
  els.inputImage.value = '';
  els.audioInputsContainer.innerHTML = '';
  addAudioRow(true);
  addAudioRow(false);
}

function setSaving(isSaving) {
  els.btnSaveExercise.disabled = isSaving;
  els.btnSaveExercise.textContent = isSaving ? 'Guardando…' : 'Guardar ejercicio';
}

// ------------------------------------------------------------
// LISTA DE EJERCICIOS
// ------------------------------------------------------------
async function loadExerciseList() {
  els.exerciseList.innerHTML = `<div class="loading-screen" style="min-height:120px;"><div class="spinner"></div></div>`;
  try {
    const exercises = await DataService.getExercises(ACTIVITY_TYPES.QUE_VEO);
    els.countBadge.textContent = exercises.length;

    if (exercises.length === 0) {
      els.exerciseList.innerHTML = `<div class="empty-screen" style="min-height:160px;"><p>Todavía no hay ejercicios creados.</p></div>`;
      return;
    }

    els.exerciseList.innerHTML = exercises.map(renderExerciseRow).join('');

    exercises.forEach(ex => {
      document.getElementById(`del-${ex.id}`).addEventListener('click', () => handleDelete(ex.id));
      document.getElementById(`edit-${ex.id}`).addEventListener('click', () => handleEditTitle(ex));
    });
  } catch (err) {
    console.error(err);
    els.exerciseList.innerHTML = `<div class="empty-screen"><p>Error al cargar los ejercicios.</p></div>`;
  }
}

function renderExerciseRow(ex) {
  const correctAudio = (ex.exercise_audios || []).find(a => a.is_correct);
  return `
    <div class="exercise-row">
      <img src="${ex.image_url}" alt="" />
      <div class="info">
        <h4>${ex.title || '(sin nombre)'}</h4>
        <p>${ex.exercise_audios.length} alternativas · correcta: ${correctAudio ? (correctAudio.label || 'sin etiqueta') : '—'}</p>
      </div>
      <div class="actions">
        <button class="icon-btn small" id="edit-${ex.id}" title="Editar nombre">✎</button>
        <button class="icon-btn small danger" id="del-${ex.id}" title="Eliminar">🗑</button>
      </div>
    </div>
  `;
}

async function handleDelete(id) {
  if (!confirm('¿Eliminar este ejercicio y sus audios? Esta acción no se puede deshacer.')) return;
  try {
    await DataService.deleteExercise(id);
    showToast('Ejercicio eliminado.', 'success');
    loadExerciseList();
  } catch (err) {
    console.error(err);
    showToast('No se pudo eliminar el ejercicio.', 'error');
  }
}

async function handleEditTitle(ex) {
  const newTitle = prompt('Nuevo nombre del ejercicio:', ex.title || '');
  if (newTitle === null) return;
  try {
    await DataService.updateExerciseTitle(ex.id, newTitle.trim());
    showToast('Nombre actualizado.', 'success');
    loadExerciseList();
  } catch (err) {
    console.error(err);
    showToast('No se pudo actualizar el nombre.', 'error');
  }
}

// ------------------------------------------------------------
// TOAST
// ------------------------------------------------------------
function showToast(message, type = '') {
  els.toast.textContent = message;
  els.toast.className = `toast show ${type}`;
  setTimeout(() => { els.toast.className = 'toast'; }, 2800);
}

// Carga inicial del contador en segundo plano.
DataService.getExercises(ACTIVITY_TYPES.QUE_VEO).then(list => {
  els.countBadge.textContent = list.length;
}).catch(() => {});
