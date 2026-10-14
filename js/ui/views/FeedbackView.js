import { Icons } from '../icons/Icons.js';

/**
 * UI View: FeedbackView
 * Controla a renderização e interatividade do módulo de feedbacks e satisfação dos usuários.
 * REGRA ABSOLUTA: Proibido o uso de emojis como ícones visuais na interface.
 */
export class FeedbackView {
  constructor({ onMarcarLido, onExcluir, onExportarCsv }) {
    this._onMarcarLido = onMarcarLido;
    this._onExcluir = onExcluir;
    this._onExportarCsv = onExportarCsv;

    this._container = document.getElementById('feedback-list-container');
    this._totalDisplay = document.getElementById('fb-total');
    this._mediaDisplay = document.getElementById('fb-media');
    this._novosDisplay = document.getElementById('fb-novos');
    this._distribuicaoDisplay = document.getElementById('fb-distribuicao');

    this._filterApp = document.getElementById('fb-filter-app');
    this._filterTipo = document.getElementById('fb-filter-tipo');
    this._filterStatus = document.getElementById('fb-filter-status');
    this._searchInput = document.getElementById('fb-search-input');
    this._exportBtn = document.getElementById('fb-export-csv-btn');

    this._setupListeners();
  }

  _setupListeners() {
    if (this._exportBtn) {
      this._exportBtn.addEventListener('click', () => {
        if (this._onExportarCsv) this._onExportarCsv();
      });
    }
  }

  onFilterChange(callback) {
    const trigger = () => {
      callback({
        app: this._filterApp?.value || '',
        tipo: this._filterTipo?.value || '',
        status: this._filterStatus?.value || 'todos',
        busca: this._searchInput?.value || ''
      });
    };

    this._filterApp?.addEventListener('change', trigger);
    this._filterTipo?.addEventListener('change', trigger);
    this._filterStatus?.addEventListener('change', trigger);
    this._searchInput?.addEventListener('input', trigger);
  }

  renderMetricas(metricas) {
    if (this._totalDisplay) this._totalDisplay.textContent = metricas.total;
    if (this._mediaDisplay) this._mediaDisplay.textContent = metricas.mediaGeral.toFixed(1);
    if (this._novosDisplay) this._novosDisplay.textContent = metricas.novosNaoLidos;

    if (this._distribuicaoDisplay && metricas.distribuicao) {
      this._distribuicaoDisplay.innerHTML = metricas.distribuicao
        .map((qtd, idx) => `
          <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.75rem;color:var(--text-muted);">
            <span style="display:inline-flex;align-items:center;gap:2px;">${idx + 1} ${Icons.svg('star', { size: 11, color: '#ffd700' })}</span>
            <div style="flex:1;height:5px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
              <div style="height:100%;width:${metricas.total ? (qtd / metricas.total * 100) : 0}%;background:var(--color-primary);"></div>
            </div>
            <span>${qtd}</span>
          </div>
        `).reverse().join('');
    }
  }

  renderLista(feedbacks, feedbackService) {
    if (!this._container) return;

    if (feedbacks.length === 0) {
      this._container.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="margin-bottom:0.75rem;color:var(--text-dim);">${Icons.svg('mail', { size: 42 })}</div>
          <p>Nenhum feedback encontrado para os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    this._container.innerHTML = feedbacks.map(fb => {
      const tipoClass = fb.tipo === 'problema' ? 'badge-crit' : fb.tipo === 'elogio' ? 'badge-pos' : 'badge-info';
      
      let estrelasHtml = '';
      for (let i = 1; i <= 5; i++) {
        estrelasHtml += i <= fb.nota
          ? Icons.svg('star', { size: 14, color: '#ffd700' })
          : Icons.svg('starOutline', { size: 14, color: '#64748b' });
      }

      const linkResposta = fb.gerarLinkResposta();

      return `
        <div class="glass-card ${!fb.lida ? 'pulse-border' : ''}" style="margin-bottom:1rem;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.65rem;">
              <span class="badge ${tipoClass}">${fb.tipo.toUpperCase()}</span>
              <span class="badge badge-neutral">${feedbackService.getNomeApp(fb.app)}</span>
              <span style="display:inline-flex;align-items:center;gap:2px;">${estrelasHtml}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;color:var(--text-dim);">
              <span>${new Date(fb.criadoEm).toLocaleString('pt-BR')}</span>
              ${!fb.lida ? '<span class="badge badge-warn">NOVO</span>' : '<span class="badge badge-neutral">LIDO</span>'}
            </div>
          </div>

          <div style="font-size:0.95rem;line-height:1.6;color:var(--text-main);white-space:pre-wrap;">${this._sanitizarHtml(fb.mensagem)}</div>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding-top:0.75rem;border-top:var(--glass-border-subtle);font-size:0.82rem;color:var(--text-muted);">
            <div>
              <strong>Usuário:</strong> ${this._sanitizarHtml(fb.usuario)}
              ${fb.estabelecimento ? ` | <strong>Comércio:</strong> ${this._sanitizarHtml(fb.estabelecimento)}` : ''}
              ${fb.email ? ` | <span>${this._sanitizarHtml(fb.email)}</span>` : ''}
            </div>

            <div style="display:flex;align-items:center;gap:0.5rem;">
              ${linkResposta ? `
                <a href="${linkResposta}" class="btn btn-secondary btn-sm" title="Responder por e-mail">
                  ${Icons.svg('mail', { size: 14 })} Responder
                </a>
              ` : ''}

              <button class="btn btn-secondary btn-sm toggle-lido-btn" data-id="${fb.id}" data-lido="${fb.lida}">
                ${fb.lida ? 'Marcar Não Lido' : `${Icons.svg('check', { size: 14 })} Marcar Lido`}
              </button>

              <button class="btn btn-danger btn-sm excluir-fb-btn" data-id="${fb.id}" title="Excluir">
                ${Icons.svg('trash', { size: 14 })}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Adiciona listeners aos botões
    this._container.querySelectorAll('.toggle-lido-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const atual = btn.getAttribute('data-lido') === 'true';
        if (this._onMarcarLido) this._onMarcarLido(id, !atual);
      });
    });

    this._container.querySelectorAll('.excluir-fb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja excluir permanentemente este feedback?')) {
          if (this._onExcluir) this._onExcluir(id);
        }
      });
    });
  }

  _sanitizarHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}
