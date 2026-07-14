# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projektu

Promptovač – webová aplikace pro testování a porovnávání odpovědí AI modelů přes OpenRouter (jediný API klíč pro všechny modely). Podporuje text i obrázky, výsledky lze exportovat do Excelu. Nástupce aplikace vidaprompty.

## Příkazy

```bash
npm install    # instalace závislostí
npm start      # spuštění serveru (port 3002)
npm run dev    # vývoj s automatickým restartem (node --watch)
```

Vyžaduje `.env` s `OPENROUTER_API_KEY` (viz `.env.example`).

## Architektura

Jednoduchá struktura bez buildu:

- **`server.js`** – celý backend (Express, ES modules):
  - `MODELS` pole – jediné místo s definicí modelů (id = OpenRouter ID, vision = podpora obrázků)
  - `/api/models` – seznam modelů pro frontend
  - `/api/test-stream` – hlavní endpoint, SSE stream; modely běží paralelně, opakování sekvenčně
  - `/api/export-excel` – XLSX export přes `xlsx` knihovnu
  - Obrázky: Multer (memory, max 20 MB) + Sharp (HEIC→JPEG, resize na 1024px)
  - Servíruje statický frontend z `public/`
- **`public/`** – vanilla JS frontend (index.html, style.css, app.js), žádný framework ani build

## Konvence

- Při změně modelů stačí upravit `MODELS` v `server.js` – frontend se přizpůsobí sám
- Modely bez `vision: true` se při nahraném obrázku přeskakují (backend pošle `skipped: true`)
- Komentáře v kódu česky
- Žádné testy ani linter nejsou nastaveny
