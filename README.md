# Book delle Ricerche — Catalogo Progetti

Catalogo navigabile di progetti. Ogni progetto è descritto da un file YAML e reso come scheda visiva con filtri per stato, anno e ricerca testuale.

## Avvio

Il catalogo usa `fetch()` e deve essere servito via HTTP — non aprire `index.html` direttamente come file.

**Con Node** (consigliato se hai già Node installato):
```bash
npm start
```

**Con Python** (alternativa, nessuna dipendenza):
```bash
python -m http.server 8000
```

Poi apri `http://localhost:8000`.

## Aggiungere un progetto

1. Salva il file YAML del progetto in `project_ymls/<ACRONIMO>.yaml`
2. Rigenera il manifest:
   ```bash
   npm run generate
   ```
3. Ricarica `http://localhost:8000`

## Filtri e URL condivisibili

I filtri (stato, anno, ordine, ricerca) si riflettono nell'URL — puoi copiare e condividere un link con i filtri già applicati.

Esempio: `http://localhost:8000?stato=In%20corso&anno=2024`

## Struttura

```
project_ymls/
  index.json          ← manifest (generato da scripts/generate-index.mjs)
  *.yaml              ← un file per progetto
assets/
  catalogo.css
  logo_white.png
  logo_dark.png
js/
  loader.js           ← caricamento YAML
  filters.js          ← filtri, ordinamento, URL sync
  render.js           ← rendering card
scripts/
  generate-index.mjs  ← rigenera project_ymls/index.json
package.json          ← definisce npm start e npm run generate
index.html
script.js             ← entry point
```

## Note tecniche

- Nessun bundler o package manager — sito statico puro
- `js-yaml@4.1.0` caricato da CDN jsDelivr
- Schema YAML: vedere `CLAUDE.md` per la specifica completa
