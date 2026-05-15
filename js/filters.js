import { extractAnnoRange, getStato } from './loader.js';

// Pure filter + sort: returns the subset of schede matching all active criteria, sorted.
// stato and anno use 'tutti' as the "no filter" sentinel value.
// query is matched against a wide haystack (nome, acronimo, overview, tech, kpi, partners…).
export function applyFilters(schede, { stato, anno, query, sort }) {
  let result = schede.filter(s => {
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
      const kpiText = s.kpi ? Object.values(s.kpi).filter(Boolean) : [];
      const partners = Array.isArray(s.progetto?.partner)
        ? s.progetto.partner.map(p => p.nome || '').filter(Boolean)
        : [];
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

  if (sort && sort !== 'default') {
    result = [...result];
    if (sort === 'anno-desc') {
      result.sort((a, b) => {
        const ra = extractAnnoRange(a), rb = extractAnnoRange(b);
        return (rb?.end ?? 0) - (ra?.end ?? 0);
      });
    } else if (sort === 'anno-asc') {
      result.sort((a, b) => {
        const ra = extractAnnoRange(a), rb = extractAnnoRange(b);
        return (ra?.start ?? 9999) - (rb?.start ?? 9999);
      });
    } else if (sort === 'acronimo') {
      result.sort((a, b) =>
        (a.progetto?.acronimo || '').localeCompare(b.progetto?.acronimo || '', 'it')
      );
    } else if (sort === 'stato') {
      result.sort((a, b) =>
        getStato(a).localeCompare(getStato(b), 'it')
      );
    }
  }

  return result;
}

// Collects every individual year covered by any project and returns them sorted.
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

// Collects unique stati from the data, sorted alphabetically.
export function buildStatiOptions(schede) {
  const stati = new Set(schede.map(s => getStato(s)).filter(Boolean));
  return Array.from(stati).sort((a, b) => a.localeCompare(b, 'it'));
}

// Wires up all filter controls and syncs state with URLSearchParams.
// onRefresh is called with the filtered+sorted array whenever any control changes.
export function setupFilters(schede, onRefresh) {
  const selStato = document.getElementById('filter-stato');
  const selAnno = document.getElementById('filter-anno');
  const selSort = document.getElementById('filter-sort');
  const inputSearch = document.getElementById('filter-search');

  // Populate dynamic selects
  buildStatiOptions(schede).forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    selStato.appendChild(opt);
  });
  buildAnniOptions(schede).forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    selAnno.appendChild(opt);
  });

  // Pre-populate controls from URL params
  const params = new URLSearchParams(location.search);
  if (params.get('stato')) selStato.value = params.get('stato');
  if (params.get('anno')) selAnno.value = params.get('anno');
  if (params.get('q')) inputSearch.value = params.get('q');
  if (params.get('sort')) selSort.value = params.get('sort');

  let debounce;
  function refresh() {
    const stato = selStato.value;
    const anno = selAnno.value;
    const query = inputSearch.value.trim();
    const sort = selSort.value;

    // Sync URL (omit default values for clean URLs)
    const p = new URLSearchParams();
    if (stato && stato !== 'tutti') p.set('stato', stato);
    if (anno && anno !== 'tutti') p.set('anno', anno);
    if (query) p.set('q', query);
    if (sort && sort !== 'default') p.set('sort', sort);
    const qs = p.toString();
    history.replaceState(null, '', qs ? '?' + qs : location.pathname);

    onRefresh(applyFilters(schede, { stato, anno, query, sort }));
  }

  selStato.addEventListener('change', refresh);
  selAnno.addEventListener('change', refresh);
  selSort.addEventListener('change', refresh);
  inputSearch.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(refresh, 200);
  });

  // Apply any params that were in the URL on load
  refresh();
}
