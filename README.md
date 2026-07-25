# 🧪 Promptovač

Webová aplikace pro testování a porovnávání odpovědí AI modelů. Jeden prompt, 12 modelů, jedno API – všechno běží přes [OpenRouter](https://openrouter.ai), takže stačí jediný API klíč.

Nástupce aplikace **vidaprompty** (ta volala OpenAI, Anthropic a Google napřímo).

## Funkce

- 🎯 15 modelů od 10 providerů, výběr checkboxy
- 🔄 1–50 odpovědí od každého modelu (pro testování konzistence)
- 📷 Podpora obrázků (JPG, PNG, HEIC z iPhonu – automatická konverze, max ~6 MB)
- ⚡ Odpovědi se streamují živě, jak je modely píší, s měřením času
- 📊 Export všech odpovědí do Excelu

## Dostupné modely

| Model | Provider | Typ |
|---|---|---|
| GPT-5.6 Luna | OpenAI | rychlý |
| GPT-5.6 Sol | OpenAI | přemýšlející |
| Claude Sonnet 5 | Anthropic | rychlý |
| Claude Opus 5 | Anthropic | přemýšlející |
| Claude Fable 5 | Anthropic | vlajkový (třída Mythos) |
| Gemini 3.6 Flash | Google | rychlý |
| Gemini 3.1 Pro | Google | přemýšlející |
| Grok 4.3 | xAI | aktuální (4.5 není dostupný v EU) |
| Mistral Medium 3.5 | Mistral | evropský |
| DeepSeek V4 Pro | DeepSeek | čínský, bez obrázků |
| Kimi K3 | Moonshot AI | čínský |
| MiniMax M3 | MiniMax | čínský |
| Nemotron 3 Ultra | NVIDIA | open-source, bez obrázků |
| GPT-OSS 20B | OpenAI (open-source) | lokální, bez obrázků |
| Qwen 3.5 9B | Alibaba (open-source) | lokální |

Modely bez podpory obrázků se při nahraném obrázku automaticky přeskočí.

## Nasazení na Netlify

1. Na [Netlify](https://app.netlify.com) zvol **Add new site → Import an existing project** a vyber GitHub repo `miloscermak/promptovac`
2. Build nastavení se načte samo z `netlify.toml` – nic neměň
3. V **Site configuration → Environment variables** přidej `OPENROUTER_API_KEY` (klíč z [openrouter.ai/keys](https://openrouter.ai/keys))
4. Deploy – každý další push do `main` se nasadí automaticky

## Lokální vývoj

```bash
npm install
cp .env.example .env   # a vlož svůj OpenRouter API klíč
npm run dev            # http://localhost:8888
```

`npm run dev` spouští `netlify dev`, který servíruje frontend i všechny funkce stejně jako v produkci.

## Jak přidat nebo vyměnit model

Všechno je na jednom místě – pole `MODELS` v `shared/models.mjs`. Přidej řádek s `id` (OpenRouter ID modelu), názvem, providerem, štítkem a příznakem `vision`. Frontend i funkce se přizpůsobí samy.

Aktuální nabídku OpenRouteru najdeš na [openrouter.ai/models](https://openrouter.ai/models).

## Technologie

- **Hosting:** Netlify – statický frontend + serverless funkce
- **Streaming testů:** Netlify Edge Function (bez 10s limitu, zvládne dlouhé odpovědi přemýšlejících modelů)
- **Obrázky:** Sharp (HEIC→JPEG, resize) v Node funkci, **Excel:** knihovna xlsx
- **Frontend:** čisté HTML + CSS + vanilla JavaScript, žádný build
- **API:** OpenRouter (`/chat/completions`, SSE streaming)
