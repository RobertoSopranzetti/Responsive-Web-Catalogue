import { extractAnnoRange, getStato } from './loader.js';

// Pure filter: returns the subset of schede matching all active criteria.
// stato and anno use 'tutti' as the "no filter" sentinel value.
// query is matched against a wide haystack (nome, acronimo, overview, tech, kpi, partners…).
export function applyFilters(schede, { stato, anno, query }) {
  return schede.filter(s => {
    if (stato && stato !== 'tutti') {
      if (getStato(s) !== stato) return false;
    }
    if (anno && anno !== 'tutti') {
      const range = extractAnnoRange(s);
      if (!range) return false;
      const n = parseInt(anno, 10);
      if (n < range.start || n > range.end) return false;
    }
    if (query) {
      const attivita = (s.contributo_mac?.attivita_principali || [])
        .flatMap(a => [a.campo, a.valore].filter(Boolean));
      const tech = (s.contributo_mac?.tecnologie_mac || []).map(t => t.nome);
      const kpiText = s.kpi
        ? Object.values(s.kpi).filter(Boolean)
        : (s.risultati_e_kpi || []).flatMap(k => [k.metrica, k.valore]);
      const partners = Array.isArray(s.progetto?.partner)
        ? s.progetto.partner.map(p => p.nome || '').filter(Boolean)
        : (typeof s.progetto?.partner === 'string' ? [s.progetto.partner] : []);
      const q = query.toLowerCase();
      const haystack = [
        s.progetto?.nome,
        s.progetto?.acronimo,
        s.progetto?.programma,
        s.progetto?.ruolo_mac,
        s.contributo_mac?.overview,
        ...attivita,
        ...tech,
        ...kpiText,
        ...partners,
        s.valore_generato_per_mac?.posizionamento,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// Collects every individual year covered by any project and returns them sorted.
// Used to populate the Anno <select> options on page load.
export function buildAnniOptions(schede) {
  const anni = new Set();
  schede.forEach(s => {
    const range = extractAnnoRange(s);
    if (range) {
      for (let a = range.start; a <= range.end; a++) anni.add(a);
    }
  });
  return Array.from(anni).sort((a, b) => a - b);
}

// Wires up all filter controls (stato select, anno select, search input).
// onRefresh is called with the filtered array whenever any control changes.
// The search input is debounced by 200 ms to avoid re-rendering on every keystroke.
export function setupFilters(schede, onRefresh) {
  const selStato = document.getElementById('filter-stato');
  const selAnno = document.getElementById('filter-anno');
  const inputSearch = document.getElementById('filter-search');

  buildAnniOptions(schede).forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    selAnno.appendChild(opt);
  });

  let debounce;
  function refresh() {
    const filtered = applyFilters(schede, {
      stato: selStato.value,
      anno: selAnno.value,
      query: inputSearch.value.trim(),
    });
    onRefresh(filtered);
  }

  selStato.addEventListener('change', refresh);
  selAnno.addEventListener('change', refresh);
  inputSearch.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(refresh, 200);
  });
}
