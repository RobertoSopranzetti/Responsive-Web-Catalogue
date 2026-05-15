import { loadAllSchede } from './js/loader.js';
import { setupFilters } from './js/filters.js';
import { renderCatalogo } from './js/render.js';

// Entry point: loads all project YAMLs, renders the initial catalogue, then wires up filters.
async function init() {
  const container = document.getElementById('schede-container');
  try {
    const { schede, errors } = await loadAllSchede();
    if (errors.length) {
      const items = errors.map(e => `<li><code>${e.file}</code> — ${e.message}</li>`).join('');
      const banner = document.createElement('div');
      banner.className = 'load-error-banner';
      banner.innerHTML = `<strong>${errors.length} scheda/e non caricata/e:</strong><ul>${items}</ul>`;
      container.before(banner);
    }
    renderCatalogo(schede);
    setupFilters(schede, renderCatalogo);
  } catch (err) {
    container.innerHTML = `
      <div class="empty-state">
        Errore nel caricamento delle schede.<br>
        Avvia il catalogo con: <code>python -m http.server 8000</code><br>
        <small style="color:#9ca3af">${err.message}</small>
      </div>`;
  }
}

init();
