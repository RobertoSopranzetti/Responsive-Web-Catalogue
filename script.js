import { loadAllSchede } from './js/loader.js';
import { setupFilters } from './js/filters.js';
import { renderCatalogo } from './js/render.js';

async function init() {
  try {
    const allSchede = await loadAllSchede();
    renderCatalogo(allSchede);
    setupFilters(allSchede, renderCatalogo);
  } catch (err) {
    document.getElementById('schede-container').innerHTML = `
      <div class="empty-state">
        Errore nel caricamento delle schede.<br>
        Avvia il catalogo con: <code>python -m http.server 8000</code><br>
        <small style="color:#9ca3af">${err.message}</small>
      </div>`;
  }
}

init();
