# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projektu

Promptovač – webová aplikace pro testování a porovnávání odpovědí AI modelů přes OpenRouter (jediný API klíč pro všechny modely). Podporuje text i obrázky, odpovědi se streamují živě, výsledky lze exportovat do Excelu. Nástupce aplikace vidaprompty. Nasazeno na Netlify.

## Příkazy

```bash
npm install    # instalace závislostí (včetně netlify-cli)
npm run dev    # lokální vývoj přes `netlify dev` (http://localhost:8888)
```

Lokálně vyžaduje `.env` s `OPENROUTER_API_KEY` (viz `.env.example`), `netlify dev` ho načte automaticky. V produkci se klíč nastavuje v Netlify UI: Site configuration → Environment variables.

## Architektura

Serverless aplikace pro Netlify, žádný trvale běžící server ani build frontendu:

- **`shared/models.mjs`** – jediné místo s definicí modelů (id = OpenRouter ID, `vision` = podpora obrázků). Importují ho Node i Edge funkce, frontend si seznam stahuje z `/api/models`.
- **`netlify/edge-functions/test.mjs`** – `/api/test`, jedno volání modelu. Edge funkce (Deno runtime), která streamuje SSE odpověď z OpenRouteru beze změny do frontendu. Edge funkce proto, že běžné Netlify funkce mají 10s limit – přemýšlející modely potřebují déle. API klíč čte přes `Netlify.env.get()`.
- **`netlify/functions/`** – běžné Node funkce (Functions 2.0, Request/Response API):
  - `models.mjs` – `/api/models`, seznam modelů
  - `prepare-image.mjs` – `/api/prepare-image`, Sharp: HEIC→JPEG, resize na 1024px, vrací base64. Volá se jednou před testem; frontend pak base64 posílá s každým voláním `/api/test`.
  - `export-excel.mjs` – `/api/export-excel`, XLSX export
- **`public/`** – statický vanilla JS frontend (index.html, style.css, app.js), žádný framework ani build. Fan-out: pro každý model × opakování jeden fetch na `/api/test`, max 6 souběžně, text se streamuje živě do karty výsledku. Modely bez `vision` se při nahraném obrázku přeskakují na frontendu.
- **`netlify.toml`** – publish `public/`, esbuild bundler, Sharp jako `external_node_modules` (nativní binárky).

## Deployment

Netlify, propojeno s GitHub repem `miloscermak/promptovac` – push do `main` = automatický deploy. Jediná nutná konfigurace: env proměnná `OPENROUTER_API_KEY` v Netlify UI.

## Konvence

- Při změně modelů stačí upravit `shared/models.mjs` – frontend i funkce se přizpůsobí samy
- Komentáře v kódu česky
- Žádné testy ani linter nejsou nastaveny
- Limit nahraného obrázku: ~6 MB (limit request body Netlify funkcí)
