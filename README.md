# 🧪 Promptovač

Webová aplikace pro testování a porovnávání odpovědí AI modelů. Jeden prompt, 12 modelů, jedno API – všechno běží přes [OpenRouter](https://openrouter.ai), takže stačí jediný API klíč.

Nástupce aplikace **vidaprompty** (ta volala OpenAI, Anthropic a Google napřímo).

## Funkce

- 🎯 12 modelů od 8 providerů, výběr checkboxy
- 🔄 1–50 odpovědí od každého modelu (pro testování konzistence)
- 📷 Podpora obrázků (JPG, PNG, HEIC z iPhonu – automatická konverze)
- ⚡ Výsledky naskakují průběžně (SSE streaming), s časem odpovědi
- 📊 Export všech odpovědí do Excelu

## Dostupné modely

| Model | Provider | Typ |
|---|---|---|
| GPT-5.6 Luna | OpenAI | rychlý |
| GPT-5.6 Sol | OpenAI | přemýšlející |
| Claude Sonnet 5 | Anthropic | rychlý |
| Claude Opus 4.8 | Anthropic | přemýšlející |
| Gemini 3.5 Flash | Google | rychlý |
| Gemini 3.1 Pro | Google | přemýšlející |
| Grok 4.5 | xAI | novinka |
| Mistral Medium 3.5 | Mistral | evropský |
| DeepSeek V4 Pro | DeepSeek | čínský, bez obrázků |
| Kimi K2.6 | Moonshot AI | čínský |
| GPT-OSS 20B | OpenAI (open-source) | lokální, bez obrázků |
| Qwen 3.5 9B | Alibaba (open-source) | lokální |

Modely bez podpory obrázků se při nahraném obrázku automaticky přeskočí.

## Instalace a spuštění

```bash
npm install
cp .env.example .env   # a vlož svůj OpenRouter API klíč
npm start              # server běží na http://localhost:3002
```

API klíč získáš na [openrouter.ai/keys](https://openrouter.ai/keys).

Pro vývoj s automatickým restartem: `npm run dev`.

## Jak přidat nebo vyměnit model

Všechno je na jednom místě – pole `MODELS` v `server.js`. Přidej řádek s `id` (OpenRouter ID modelu), názvem, providerem, štítkem a příznakem `vision`. Frontend si seznam stáhne sám z `/api/models`.

Aktuální nabídku OpenRouteru najdeš na [openrouter.ai/models](https://openrouter.ai/models).

## Technologie

- **Backend:** Node.js + Express (ES modules), Multer (upload), Sharp (obrázky), XLSX (export)
- **Frontend:** čisté HTML + CSS + vanilla JavaScript, žádný build
- **API:** OpenRouter (`/chat/completions`)
