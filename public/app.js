// Promptovač – frontend logika
// Načte modely z backendu, pro každý model × opakování pošle samostatný
// požadavek na /api/test a odpověď streamuje živě do karty výsledku.

const MAX_PARALLEL = 6; // kolik volání běží najednou

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
  const modelIds = selectedIds();
  const count = Math.min(Math.max(parseInt($('count').value) || 1, 1), 50);

  if (!prompt) return alert('Zadej prompt.');
  if (!modelIds.length) return alert('Vyber aspoň jeden model.');

  results = [];
  lastPrompt = prompt;
  lastHasImage = Boolean($('image').files[0]);
  $('results').innerHTML = '';
  $('export').classList.add('hidden');
  $('run').disabled = true;
  $('progress').classList.remove('hidden');

  try {
    // Obrázek se zpracuje jednou (zmenšení + JPEG) a pak posílá s každým voláním
    let imageBase64 = null;
    if ($('image').files[0]) {
      const file = $('image').files[0];
      const res = await fetch('/api/prepare-image', {
        method: 'POST',
        // HEIC nemívá vyplněný file.type – bez binárního Content-Type by Netlify tělo poškodil
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Zpracování obrázku selhalo');
      imageBase64 = data.imageBase64;
    }

    // Seznam úloh: model × opakování; modely bez vision se při obrázku přeskočí
    const jobs = [];
    for (const id of modelIds) {
      const model = MODELS.find((m) => m.id === id);
      if (imageBase64 && !model.vision) {
        addResult({
          model: id, name: model.name, provider: model.provider, responseNumber: 1,
          skipped: true, error: 'Model nepodporuje obrázky – přeskočeno'
        });
        continue;
      }
      for (let i = 1; i <= count; i++) {
        jobs.push({ model, responseNumber: i });
      }
    }

    let finished = 0;
    const total = jobs.length;
    setProgress(0, total);

    // Jednoduchý pool – max MAX_PARALLEL volání najednou
    const queue = [...jobs];
    const worker = async () => {
      while (queue.length) {
        const job = queue.shift();
        await runOne(job.model, job.responseNumber, prompt, imageBase64);
        finished++;
        setProgress(finished, total);
      }
    };
    await Promise.all(Array.from({ length: Math.min(MAX_PARALLEL, total) }, worker));

    if (results.length) $('export').classList.remove('hidden');
  } catch (err) {
    alert('Chyba: ' + err.message);
  } finally {
    $('run').disabled = false;
    $('progress').classList.add('hidden');
  }
});

// Jedno volání modelu – vytvoří kartu a průběžně do ní streamuje text
async function runOne(model, responseNumber, prompt, imageBase64) {
  const card = createCard(model, responseNumber);
  const start = Date.now();

  try {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model.id, prompt, imageBase64 })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Server vrátil chybu ${res.status}`);
    }

    // OpenRouter SSE stream: řádky "data: {...}", ukončené "data: [DONE]"
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          if (json.error) throw new Error(json.error.message || 'Chyba modelu');
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            text += delta;
            card.textEl.textContent = text;
          }
        } catch (e) {
          if (e instanceof SyntaxError) continue; // neúplný JSON přeskočíme
          throw e;
        }
      }
    }

    const elapsed = Math.round((Date.now() - start) / 100) / 10;
    if (!text) text = '(prázdná odpověď)';
    card.textEl.textContent = text;
    card.metaEl.textContent = `odpověď ${responseNumber} · ${elapsed} s`;
    card.el.classList.remove('pending');

    results.push({
      model: model.id, name: model.name, provider: model.provider,
      responseNumber, response: text, elapsed, timestamp: new Date().toISOString()
    });
  } catch (err) {
    card.el.classList.remove('pending');
    card.el.classList.add('error');
    card.textEl.classList.add('error-text');
    card.textEl.textContent = err.message;
    card.metaEl.textContent = `odpověď ${responseNumber}`;
    results.push({
      model: model.id, name: model.name, provider: model.provider,
      responseNumber, error: err.message
    });
  }
}

// --- Zobrazení výsledků ---
function createCard(model, responseNumber) {
  const el = document.createElement('div');
  el.className = 'result-card pending';

  const header = document.createElement('div');
  header.className = 'result-header';

  const title = document.createElement('span');
  title.className = 'result-model';
  title.textContent = model.name + ' ';
  const providerEl = document.createElement('span');
  providerEl.className = 'result-meta';
  providerEl.textContent = `(${model.provider})`;
  title.appendChild(providerEl);

  const metaEl = document.createElement('span');
  metaEl.className = 'result-meta';
  metaEl.textContent = `odpověď ${responseNumber} · píše…`;

  const textEl = document.createElement('div');
  textEl.className = 'result-text';
  textEl.textContent = '…';

  header.append(title, metaEl);
  el.append(header, textEl);
  $('results').appendChild(el);

  return { el, textEl, metaEl };
}

// Karta pro přeskočený model (bez volání API)
function addResult(r) {
  results.push(r);
  const card = createCard({ name: r.name, provider: r.provider }, r.responseNumber);
  card.el.classList.remove('pending');
  card.el.classList.add('skipped');
  card.textEl.textContent = r.error;
  card.metaEl.textContent = '';
}

function setProgress(finished, total) {
  const pct = total ? Math.round((finished / total) * 100) : 0;
  $('progress-bar').style.width = pct + '%';
  $('progress-text').textContent = `${finished} / ${total}`;
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
