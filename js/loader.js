const MANIFEST = 'project_ymls/index.json';

// Fetches index.json, then loads and parses every YAML listed in it.
// Returns { schede, errors } — partial failures don't block the rest.
export async function loadAllSchede() {
  if (typeof jsyaml === 'undefined') {
    throw new Error('CDN js-yaml non raggiungibile — verifica la connessione e ricarica la pagina.');
  }
  const manifest = await fetch(MANIFEST).then(r => r.json());
  const results = await Promise.allSettled(
    manifest.map(name =>
      fetch(`project_ymls/${name}`)
        .then(r => r.text())
        .then(text => ({ scheda: jsyaml.load(text), file: name }))
    )
  );
  const schede = [];
  const errors = [];
  for (const r of results) {
    if (r.status === 'fulfilled') schede.push(r.value.scheda);
    else errors.push({ file: r.reason?.message?.match(/project_ymls\/(\S+)/)?.[1] ?? '?', message: r.reason?.message ?? String(r.reason) });
  }
  return { schede, errors };
}

// Extracts the year range covered by a project from progetto.periodo (regex on 4-digit years).
// Returns { start, end } or null if no year is found.
export function extractAnnoRange(scheda) {
  const periodo = scheda.progetto?.periodo || '';
  const years = (periodo.match(/\d{4}/g) || []).map(Number).filter(y => y >= 1990 && y <= 2100);
  if (!years.length) return null;
  return { start: Math.min(...years), end: Math.max(...years) };
}

// Returns the project status string.
export function getStato(scheda) {
  return scheda.progetto?.stato || '';
}
