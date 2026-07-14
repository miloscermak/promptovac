// Promptovač – backend
// Express server, který přes OpenRouter volá vybrané AI modely,
// zpracovává nahrané obrázky a exportuje výsledky do Excelu.

import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import XLSX from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3002;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Jediné místo, kde se definují modely – frontend si seznam stáhne z /api/models.
// vision = umí přijmout obrázek, tag = štítek zobrazený v UI
const MODELS = [
  { id: 'openai/gpt-5.6-luna', name: 'GPT-5.6 Luna', provider: 'OpenAI', tag: 'rychlý', vision: true, description: 'Nejrychlejší z nové řady GPT-5.6' },
  { id: 'openai/gpt-5.6-sol', name: 'GPT-5.6 Sol', provider: 'OpenAI', tag: 'přemýšlející', vision: true, description: 'Vlajkový model OpenAI pro složité úlohy' },
  { id: 'anthropic/claude-sonnet-5', name: 'Claude Sonnet 5', provider: 'Anthropic', tag: 'rychlý', vision: true, description: 'Vybalancovaný výkon a rychlost' },
  { id: 'anthropic/claude-opus-4.8', name: 'Claude Opus 4.8', provider: 'Anthropic', tag: 'přemýšlející', vision: true, description: 'Nejvýkonnější Claude model' },
  { id: 'google/gemini-3.5-flash', name: 'Gemini 3.5 Flash', provider: 'Google', tag: 'rychlý', vision: true, description: 'Rychlý multimodální model Googlu' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro', provider: 'Google', tag: 'přemýšlející', vision: true, description: 'Nejsilnější Gemini (preview)' },
  { id: 'x-ai/grok-4.5', name: 'Grok 4.5', provider: 'xAI', tag: 'novinka', vision: true, description: 'Nejnovější model od xAI' },
  { id: 'mistralai/mistral-medium-3-5', name: 'Mistral Medium 3.5', provider: 'Mistral', tag: 'evropský', vision: true, description: 'Aktuální střední model od Mistralu' },
  { id: 'deepseek/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'DeepSeek', tag: 'čínský', vision: false, description: 'Silný čínský model za zlomek ceny' },
  { id: 'moonshotai/kimi-k2.6', name: 'Kimi K2.6', provider: 'Moonshot AI', tag: 'čínský', vision: true, description: 'Čínský multimodální model' },
  { id: 'openai/gpt-oss-20b', name: 'GPT-OSS 20B', provider: 'OpenAI (open-source)', tag: 'lokální', vision: false, description: 'Open-source model, jde provozovat lokálně' },
  { id: 'qwen/qwen3.5-9b', name: 'Qwen 3.5 9B', provider: 'Alibaba (open-source)', tag: 'lokální', vision: true, description: 'Malý open-source model s podporou obrázků' }
];

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Zmenšení obrázku a konverze do JPEG – řeší i HEIC z iPhonu
async function prepareImage(buffer) {
  const jpeg = await sharp(buffer)
    .rotate()
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return jpeg.toString('base64');
}

// Jedno volání OpenRouteru, vrací text odpovědi
async function callModel(modelId, prompt, imageBase64) {
  const content = imageBase64
    ? [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
      ]
    : prompt;

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Promptovac'
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices?.[0]?.message?.content || '(prázdná odpověď)';
}

// Seznam modelů pro frontend
app.get('/api/models', (req, res) => {
  res.json(MODELS);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', apiKey: Boolean(OPENROUTER_API_KEY) });
});

// Hlavní endpoint – SSE stream, průběžně posílá výsledky jednotlivých volání.
// Modely běží paralelně, opakování v rámci jednoho modelu sekvenčně.
app.post('/api/test-stream', upload.single('image'), async (req, res) => {
  try {
    const prompt = (req.body.prompt || '').trim();
    const modelIds = JSON.parse(req.body.models || '[]');
    const count = Math.min(Math.max(parseInt(req.body.count) || 1, 1), 50);

    if (!prompt) return res.status(400).json({ error: 'Chybí prompt' });
    if (!modelIds.length) return res.status(400).json({ error: 'Nejsou vybrané žádné modely' });
    if (!OPENROUTER_API_KEY) return res.status(500).json({ error: 'Chybí OPENROUTER_API_KEY v .env' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const imageBase64 = req.file ? await prepareImage(req.file.buffer) : null;

    const total = modelIds.length * count;
    let finished = 0;

    await Promise.all(modelIds.map(async (id) => {
      const model = MODELS.find((m) => m.id === id);
      if (!model) {
        finished += count;
        send('result', { model: id, name: id, provider: '?', responseNumber: 1, error: 'Neznámý model' });
        send('progress', { finished, total });
        return;
      }

      // Model bez podpory obrázků při nahraném obrázku přeskočíme
      if (imageBase64 && !model.vision) {
        finished += count;
        send('result', {
          model: id, name: model.name, provider: model.provider, responseNumber: 1,
          skipped: true, error: 'Model nepodporuje obrázky – přeskočeno'
        });
        send('progress', { finished, total });
        return;
      }

      for (let i = 1; i <= count; i++) {
        const start = Date.now();
        try {
          const text = await callModel(id, prompt, imageBase64);
          send('result', {
            model: id, name: model.name, provider: model.provider, responseNumber: i,
            response: text, elapsed: Math.round((Date.now() - start) / 100) / 10,
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          send('result', {
            model: id, name: model.name, provider: model.provider, responseNumber: i,
            error: err.message
          });
        }
        finished++;
        send('progress', { finished, total });
      }
    }));

    send('done', {});
    res.end();
  } catch (err) {
    console.error('Chyba v /api/test-stream:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

// Export výsledků do Excelu
app.post('/api/export-excel', (req, res) => {
  try {
    const { results = [], prompt = '', hasImage = false } = req.body;
    if (!results.length) return res.status(400).json({ error: 'Žádné výsledky k exportu' });

    const rows = results.map((r) => ({
      'Model': r.name || r.model,
      'Provider': r.provider || '',
      'Odpověď č.': r.responseNumber || 1,
      'Čas (s)': r.elapsed ?? '',
      'Odpověď': r.response || r.error || '',
      'Stav': r.error ? (r.skipped ? 'přeskočeno' : 'chyba') : 'ok'
    }));

    const info = [
      { 'Klíč': 'Prompt', 'Hodnota': prompt },
      { 'Klíč': 'Obrázek', 'Hodnota': hasImage ? 'ano' : 'ne' },
      { 'Klíč': 'Vygenerováno', 'Hodnota': new Date().toLocaleString('cs-CZ') }
    ];

    const wb = XLSX.utils.book_new();
    const wsResults = XLSX.utils.json_to_sheet(rows);
    wsResults['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 100 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsResults, 'Výsledky');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), 'Info');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="promptovac-vysledky.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Chyba v /api/export-excel:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback na index.html (pro přímé odkazy)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Promptovač běží na http://localhost:${PORT}`);
  if (!OPENROUTER_API_KEY) console.warn('⚠ Chybí OPENROUTER_API_KEY – nastav ho v .env');
});
