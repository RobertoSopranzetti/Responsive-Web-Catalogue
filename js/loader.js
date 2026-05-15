const MANIFEST = 'project_ymls/index.json';

// Fetches index.json, then loads and parses every YAML listed in it.
// Returns an array of plain objects (one per project).
export async function loadAllSchede() {
  const manifest = await fetch(MANIFEST).then(r => r.json());
  return Promise.all(
    manifest.map(name =>
      fetch(`project_ymls/${name}`)
        .then(r => r.text())
        .then(text => jsyaml.load(text))
    )
  );
}

// Extracts the year range covered by a project from progetto.periodo (regex on 4-digit years).
// Falls back to the old-schema catalogo.anno_inizio / anno_fine fields.
// Returns { start, end } or null if no year is found.
export function extractAnnoRange(scheda) {
  const periodo = scheda.progetto?.periodo || '';
  const years = (periodo.match(/\d{4}/g) || []).map(Number).filter(y => y >= 1990 && y <= 2100);
  if (years.length) return { start: Math.min(...years), end: Math.max(...years) };
  const cat = scheda.catalogo;
  if (cat?.anno_inizio) return { start: Number(cat.anno_inizio), end: Number(cat.anno_fine || cat.anno_inizio) };
  return null;
}

// Returns the project status string, supporting both current and old YAML schemas.
export function getStato(scheda) {
  return scheda.progetto?.stato || scheda.catalogo?.stato || '';
}
