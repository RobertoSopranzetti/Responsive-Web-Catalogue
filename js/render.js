import { getStato } from './loader.js';

const STATO_COLORS = {
  'Completato':                 '#196B24',
  'In corso':                   '#156082',
  'In sperimentazione':         '#E97132',
  'In attesa di approvazione':  '#595959',
};

const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const _oggi = new Date();
const MESE_ANNO = `${MESI_IT[_oggi.getMonth()]} ${_oggi.getFullYear()}`;

const cleanVal = v => (v && v !== 'N.D.' ? v : '');

function renderPartner(partner) {
  if (!partner) return '';
  if (typeof partner === 'string') return partner;
  if (Array.isArray(partner)) {
    if (!partner.length) return '';
    return partner.map(p => {
      const nome = p.nome || p;
      const ruolo = p.ruolo ? ` <span style="color:#595959;font-weight:400">(${p.ruolo})</span>` : '';
      return nome + ruolo;
    }).join(', ');
  }
  return '';
}

function renderKpiRow(kpi, kpi_label, risultati_e_kpi) {
  if (kpi && typeof kpi === 'object' && !Array.isArray(kpi)) {
    const headers = {
      feature_principali: { label: 'Feature principali', tag: 'mac' },
      benefici_pratici:   { label: 'Benefici pratici',   tag: 'mac' },
      monitoring:         { label: 'Monitoring',          tag: 'mac' },
      integrazioni:       { label: 'Integrazioni',        tag: 'sistema' },
    };
    const cells = Object.entries(headers).map(([key, { label, tag }]) => {
      const shortVal = kpi[key] || 'N.D.';
      const isNd = shortVal === 'N.D.';
      const tagLabel = tag === 'mac' ? 'MAC' : 'Sistema';
      const descText = kpi_label && kpi_label[key];
      const descLine = descText
        ? `<div class="kpi-label">${descText}</div>`
        : (isNd ? `<div class="kpi-label" style="color:#9ca3af;font-style:italic">Dato non disponibile</div>` : '');
      return `
      <div class="kpi-cell">
        <div class="kpi-header">${label}</div>
        <div class="kpi-value${isNd ? ' nd' : ''}">${shortVal}</div>
        ${descLine}
        <span class="kpi-tag ${tag}">${tagLabel}</span>
      </div>`;
    }).join('');
    return `<div class="kpi-row">${cells}</div>`;
  }
  const kpis = risultati_e_kpi || [];
  if (!kpis.length) return '';
  const cells = kpis.slice(0, 4).map(k => {
    const tagClass = k.pertinenza_mac === 'diretta' ? 'mac' : 'sistema';
    const tagLabel = k.pertinenza_mac === 'diretta' ? 'MAC' : 'Sistema';
    return `
      <div class="kpi-cell">
        <div class="kpi-header">${k.metrica}</div>
        <div class="kpi-value">${k.valore}</div>
        <span class="kpi-tag ${tagClass}">${tagLabel}</span>
      </div>`;
  }).join('');
  return `<div class="kpi-row">${cells}</div>`;
}

export function renderCard(scheda) {
  const p = scheda.progetto || {};
  const mac = scheda.contributo_mac || {};
  const val = scheda.valore_generato_per_mac || {};
  const dataset = scheda.dataset_output || [];

  const statoLabel = getStato(scheda);
  const statoCol = STATO_COLORS[statoLabel] || '#595959';

  const partnerStr = renderPartner(p.partner);

  const attivitaItems = (mac.attivita_principali || [])
    .map(a => `<li>${a.valore || a.campo}</li>`)
    .join('');

  const techPills = (mac.tecnologie_mac || [])
    .map(t => `<span class="pill">${t.nome}</span>`)
    .join('');

  const introRuolo = mac.intro_ruolo ? `<p>${mac.intro_ruolo}</p>` : '';
  const introTech = mac.intro_tecnologie ? `<p>${mac.intro_tecnologie}</p>` : '';
  const notePartner = mac.note_partner ? `<p class="note-partner">${mac.note_partner}</p>` : '';

  const kpiHtml = renderKpiRow(scheda.kpi, scheda.kpi_label, scheda.risultati_e_kpi);

  const competenzeItems = (val.competenze_acquisite || []).map(c => `<li>${c}</li>`).join('');
  const referenzeItems = (val.referenze || []).map(r => `<li>${r}</li>`).join('');

  const fromDataset = dataset.map(d => {
    const titolo = cleanVal(d.tipo);
    const contenuto = cleanVal(d.contenuto);
    const riuso = cleanVal(d.riuso_potenziale);
    if (!titolo && !contenuto) return '';
    const head = titolo ? `<strong>${titolo}</strong>` : '';
    const body = contenuto ? (head ? ' — ' + contenuto : contenuto) : '';
    const tail = riuso ? `; riuso: ${riuso}` : '';
    return `<li>${head}${body}${tail}</li>`;
  }).filter(Boolean);

  const fromAssets = (val.asset_prodotti || [])
    .filter(cleanVal)
    .map(a => `<li>${a}</li>`);

  const datasetItems = [...fromDataset, ...fromAssets].join('');

  const progTag = [p.programma, p.codice].filter(cleanVal).join(' · ');

  const trl = cleanVal(p.trl);
  const ente = cleanVal(p.ente_finanziatore);
  const heroRight = (trl || ente) ? `
    <div class="hero-right">
      ${trl ? `<div class="trl-badge">${trl}</div>` : ''}
      ${ente ? `<div class="ente-tag">${ente}</div>` : ''}
    </div>` : '';

  const footerParts = [p.acronimo, p.programma, p.codice, 'Uso riservato'].filter(cleanVal);

  return `
<div class="scheda">
  <div class="top-strip">
    <img src="assets/mac_logo_dark.png" alt="MAC logo">
    <div class="strip-right">
      ${p.documento_url
        ? `<a class="btn-allegati active" href="${p.documento_url}" target="_blank" rel="noopener">&#128206; Allegati</a>`
        : `<span class="btn-allegati">&#128206; Allegati</span>`
      }
      <div class="meta-doc">Book delle Ricerche MAC · ${MESE_ANNO} · Uso riservato</div>
    </div>
  </div>
  <div class="hero">
    <div class="hero-left">
      <div class="prog-tag">${progTag}</div>
      <h1>${p.acronimo || p.nome || ''}</h1>
      <div class="subtitle">${p.nome || ''}</div>
      <div class="meta-row">
        <div class="meta-item">
          <span class="meta-label">Periodo</span>
          <span class="meta-value">${p.periodo || '<span class="nd">N.D.</span>'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Ruolo MAC</span>
          <span class="meta-value">${p.ruolo_mac || '<span class="nd">N.D.</span>'}</span>
        </div>
        ${partnerStr ? `<div class="meta-item" style="max-width:260px">
          <span class="meta-label">Partner</span>
          <span class="meta-value partners">${partnerStr}</span>
        </div>` : ''}
        ${statoLabel ? `<div class="meta-item">
          <span class="meta-label">Stato</span>
          <span class="meta-value">
            <span class="status-badge" style="background:${statoCol}">${statoLabel}</span>
          </span>
        </div>` : ''}
      </div>
    </div>
    ${heroRight}
  </div>
  ${kpiHtml}
  ${mac.overview ? `<div class="overview"><p>${mac.overview.trim()}</p></div>` : ''}
  ${mac.attivita_principali?.length ? `
  <div class="grid2">
    <div class="card">
      <div class="card-label">Ruolo e contributo MAC</div>
      ${introRuolo}
      <ul>${attivitaItems}</ul>
    </div>
    <div class="card">
      <div class="card-label">Tecnologie MAC coinvolte</div>
      ${introTech}
      ${techPills ? `<div class="pill-list">${techPills}</div>` : ''}
      ${notePartner}
    </div>
  </div>` : ''}
  <div class="grid2">
    <div class="card dark">
      <div class="card-label">Capacità e referenze MAC</div>
      ${competenzeItems ? `<p><strong>Competenze acquisite:</strong></p><ul>${competenzeItems}</ul>` : ''}
      ${referenzeItems ? `<p style="margin-top:6px"><strong>Referenze:</strong></p><ul>${referenzeItems}</ul>` : ''}
      ${val.posizionamento ? `<p style="margin-top:6px"><strong>Posizionamento:</strong> ${val.posizionamento.trim()}</p>` : ''}
    </div>
    <div class="card light">
      <div class="card-label">Dataset e output riutilizzabili</div>
      ${datasetItems ? `<ul>${datasetItems}</ul>` : `<p style="color:#595959;font-style:italic;font-size:0.95em">Nessun dataset pubblico previsto per questo progetto.</p>`}
    </div>
  </div>
  <div class="footer">
    <span class="footer-left">MAC Srl · Book delle Ricerche</span>
    <span class="footer-right">${footerParts.join(' · ')}</span>
  </div>
</div>`;
}

export function renderCatalogo(schede) {
  const container = document.getElementById('schede-container');
  const count = document.getElementById('filter-count');
  if (!schede.length) {
    container.innerHTML = '<div class="empty-state">Nessuna scheda corrisponde ai filtri selezionati.</div>';
    if (count) count.textContent = '0 schede';
    return;
  }
  container.innerHTML = schede.map(renderCard).join('');
  if (count) count.textContent = `${schede.length} scheda${schede.length !== 1 ? 'e' : ''}`;
}
