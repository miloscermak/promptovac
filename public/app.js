// Promptovač – frontend logika
// Načte modely z backendu, odešle test přes SSE stream a průběžně zobrazuje výsledky.

let MODELS = [];
let results = [];       // nasbírané výsledky pro Excel export
let lastPrompt = '';
let lastHasImage = false;

const $ = (id) => document.getElementById(id);

// --- Načtení seznamu modelů ---
async function loadModels() {
  try {
    const res = await fetch('/api/models');
    MODELS = await res.json();
    renderModels();
  } catch {
    $('models').innerHTML = '<p class="hint">Nepodařilo se načíst modely – běží server?</p>';
  }
}

function renderModels() {
  const container = $('models');
  container.innerHTML = '';
  MODELS.forEach((m) => {
    const label = document.createElement('label');
    label.className = 'model-item';
    label.innerHTML = `
      <input type="checkbox" value="${m.id}">
      <span>
        <span class="model-name">${m.name}</span>
        <span class="badge">${m.tag}</span>
        ${m.vision ? '' : '<span class="badge no-vision">bez obrázků</span>'}
        <br>
        <span class="model-desc">${m.provider} · ${m.description}</span>
      </span>`;
    const checkbox = label.querySelector('input');
    checkbox.addEventListener('change', () => {
      label.classList.toggle('checked', checkbox.checked);
      updateToggleAllLabel();
    });
    container.appendChild(label);
  });
}

// --- Vybrat vše / zrušit výběr ---
function selectedIds() {
  return [...document.querySelectorAll('#models input:checked')].map((el) => el.value);
}

function updateToggleAllLabel() {
  $('toggle-all').textContent =
    selectedIds().length === MODELS.length ? 'Zrušit výběr' : 'Vybrat vše';
}

$('toggle-all').addEventListener('click', () => {
  const all = selectedIds().length === MODELS.length;
  document.querySelectorAll('#models input').forEach((el) => {
    el.checked = !all;
    el.closest('.model-item').classList.toggle('checked', !all);
  });
  updateToggleAllLabel();
});

// --- Náhled obrázku ---
$('image').addEventListener('change', () => {
  const file = $('image').files[0];
  if (!file) return;
  // HEIC prohlížeč nezobrazí, ukážeme jen název
  if (/\.heic$/i.test(file.name)) {
    $('preview-img').removeAttribute('src');
    $('preview-img').alt = file.name;
  } else {
    const reader = new FileReader();
    reader.onload = (e) => { $('preview-img').src = e.target.result; };
    reader.readAsDataURL(file);
  }
  $('image-preview').classList.remove('hidden');
});

$('remove-image').addEventListener('click', () => {
  $('image').value = '';
  $('preview-img').removeAttribute('src');
  $('image-preview').classList.add('hidden');
});

// --- Spuštění testu ---
$('run').addEventListener('click', async () => {
  const prompt = $('prompt').value.trim();
  const models = selectedIds();
  const count = $('count').value;

  if (!prompt) return alert('Zadej prompt.');
  if (!models.length) return alert('Vyber aspoň jeden model.');

  results = [];
  lastPrompt = prompt;
  lastHasImage = Boolean($('image').files[0]);
  $('results').innerHTML = '';
  $('export').classList.add('hidden');
  $('run').disabled = true;
  $('progress').classList.remove('hidden');
  setProgress(0, models.length * count);

  const formData = new FormData();
  formData.append('prompt', prompt);
  formData.append('models', JSON.stringify(models));
  formData.append('count', count);
  if ($('image').files[0]) formData.append('image', $('image').files[0]);

  try {
    const response = await fetch('/api/test-stream', { method: 'POST', body: formData });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server vrátil chybu ${response.status}`);
    }

    await readSSE(response, (event, data) => {
      if (event === 'result') {
        results.push(data);
        renderResult(data);
      } else if (event === 'progress') {
        setProgress(data.finished, data.total);
      }
    });

    if (results.length) $('export').classList.remove('hidden');
  } catch (err) {
    alert('Chyba: ' + err.message);
  } finally {
    $('run').disabled = false;
    $('progress').classList.add('hidden');
  }
});

// Čtení SSE streamu z fetch odpovědi
async function readSSE(response, onEvent) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Události jsou oddělené prázdným řádkem
    const parts = buffer.split('\n\n');
    buffer = parts.pop();

    for (const part of parts) {
      let event = 'message';
      let data = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7).trim();
        else if (line.startsWith('data: ')) data += line.slice(6);
      }
      if (data) onEvent(event, JSON.parse(data));
    }
  }
}

function setProgress(finished, total) {
  const pct = total ? Math.round((finished / total) * 100) : 0;
  $('progress-bar').style.width = pct + '%';
  $('progress-text').textContent = `${finished} / ${total}`;
}

// --- Zobrazení výsledku ---
function renderResult(r) {
  const card = document.createElement('div');
  card.className = 'result-card' + (r.skipped ? ' skipped' : r.error ? ' error' : '');

  const meta = [];
  if (r.responseNumber) meta.push(`odpověď ${r.responseNumber}`);
  if (r.elapsed != null) meta.push(`${r.elapsed} s`);

  const header = document.createElement('div');
  header.className = 'result-header';
  header.innerHTML = `
    <span class="result-model">${escapeHtml(r.name)} <span class="result-meta">(${escapeHtml(r.provider)})</span></span>
    <span class="result-meta">${meta.join(' · ')}</span>`;

  const text = document.createElement('div');
  text.className = 'result-text' + (r.error && !r.skipped ? ' error-text' : '');
  text.textContent = r.response || r.error || '';

  card.append(header, text);
  $('results').appendChild(card);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// --- Excel export ---
$('export').addEventListener('click', async () => {
  try {
    const res = await fetch('/api/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results, prompt: lastPrompt, hasImage: lastHasImage })
    });
    if (!res.ok) throw new Error('Export selhal');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'promptovac-vysledky.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Chyba exportu: ' + err.message);
  }
});

loadModels();
