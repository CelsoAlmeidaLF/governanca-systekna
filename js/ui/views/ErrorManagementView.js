import { Icons } from '../icons/Icons.js';

/**
 * UI View: ErrorManagementView
 * Controla a exibição de telemetria de falhas, agrupamento por assinatura e integração com GitHub Issues.
 * REGRA ABSOLUTA: Proibido o uso de emojis como ícones visuais na interface.
 */
export class ErrorManagementView {
  constructor({ onAlternarStatus, onExcluirGrupo }) {
    this._onAlternarStatus = onAlternarStatus;
    this._onExcluirGrupo = onExcluirGrupo;

    this._container = document.getElementById('error-list-container');
    this._totalDisplay = document.getElementById('err-total');
    this._abertosDisplay = document.getElementById('err-abertos');
    this._ultimas24hDisplay = document.getElementById('err-24h');
    this._resolvidosDisplay = document.getElementById('err-resolvidos');

    this._filterStatus = document.getElementById('err-filter-status');
    this._filterApp = document.getElementById('err-filter-app');
    this._filterModulo = document.getElementById('err-filter-modulo');
    this._searchInput = document.getElementById('err-search-input');
  }

  onFilterChange(callback) {
    const trigger = () => {
      callback({
        status: this._filterStatus?.value || 'abertos',
        app: this._filterApp?.value || '',
        modulo: this._filterModulo?.value || '',
        busca: this._searchInput?.value || ''
      });
    };

    this._filterStatus?.addEventListener('change', trigger);
    this._filterApp?.addEventListener('change', trigger);
    this._filterModulo?.addEventListener('change', trigger);
    this._searchInput?.addEventListener('input', trigger);
  }

  renderMetricas(metricas) {
    if (this._totalDisplay) this._totalDisplay.textContent = metricas.totalRegistros;
    if (this._abertosDisplay) this._abertosDisplay.textContent = metricas.abertos;
    if (this._ultimas24hDisplay) this._ultimas24hDisplay.textContent = metricas.ultimas24h;
    if (this._resolvidosDisplay) this._resolvidosDisplay.textContent = metricas.resolvidos;
  }

  renderGrupos(grupos) {
    if (!this._container) return;

    if (grupos.length === 0) {
      this._container.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="margin-bottom:0.75rem;color:var(--color-success);">${Icons.svg('shield', { size: 42, color: 'var(--color-success)' })}</div>
          <p>Nenhuma ocorrência de erro correspondente aos filtros. Sistema operando em estabilidade!</p>
        </div>
      `;
      return;
    }

    this._container.innerHTML = grupos.map((g, index) => {
      const linkGitHub = g.exemploErro.gerarLinkGitHubIssue();
      const statusBadge = g.resolvido ? '<span class="badge badge-pos">RESOLVIDO</span>' : '<span class="badge badge-crit">ABERTO</span>';

      return `
        <div class="glass-card" style="margin-bottom:1rem;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.65rem;">
              ${statusBadge}
              <span class="badge badge-neutral">${g.app}</span>
              <span class="badge badge-info">${g.modulo}</span>
              <span class="badge badge-warn">${g.totalOcorrencias} ${g.totalOcorrencias > 1 ? 'ocorrências' : 'ocorrência'}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-dim);">
              Última falha: ${new Date(g.ultimaOcorrencia).toLocaleString('pt-BR')} (versão ${g.versao})
            </div>
          </div>

          <div>
            <h4 style="color:#ffffff;font-size:1.05rem;font-weight:600;margin-bottom:0.4rem;">
              ${this._sanitizarHtml(g.mensagem)}
            </h4>
            <div style="font-size:0.8rem;color:var(--text-muted);">
              <strong>Ambiente:</strong> ${this._sanitizarHtml(g.ambiente.userAgent || 'Desconhecido')} | 
              <strong>Viewport:</strong> ${this._sanitizarHtml(g.ambiente.viewport || 'N/A')}
            </div>
          </div>

          <!-- Stack Trace com acordeão -->
          <details style="cursor:pointer;">
            <summary style="font-size:0.82rem;color:var(--color-primary);user-select:none;outline:none;display:inline-flex;align-items:center;gap:0.4rem;">
              ${Icons.svg('search', { size: 14 })} Visualizar Stack Trace Sanitizado
            </summary>
            <div class="code-block" style="margin-top:0.6rem;">${this._sanitizarHtml(g.stackTrace || 'Sem stack trace registrado.')}</div>
          </details>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding-top:0.75rem;border-top:var(--glass-border-subtle);">
            <div style="font-size:0.78rem;color:var(--text-dim);font-family:var(--font-mono);">
              Assinatura: ${this._sanitizarHtml(g.assinatura)}
            </div>

            <div style="display:flex;align-items:center;gap:0.5rem;">
              <a href="${linkGitHub}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" title="Criar issue no GitHub do repositório">
                ${Icons.svg('github', { size: 14 })} Abrir Issue no GitHub
              </a>

              <button class="btn btn-primary btn-sm alternar-resolvido-btn" data-index="${index}">
                ${g.resolvido ? 'Reabrir Erro' : `${Icons.svg('check', { size: 14 })} Marcar como Resolvido`}
              </button>

              <button class="btn btn-danger btn-sm excluir-grupo-btn" data-index="${index}" title="Excluir ocorrências">
                ${Icons.svg('trash', { size: 14 })}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Listeners
    this._container.querySelectorAll('.alternar-resolvido-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        const grupo = grupos[idx];
        if (this._onAlternarStatus) this._onAlternarStatus(grupo, !grupo.resolvido);
      });
    });

    this._container.querySelectorAll('.excluir-grupo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        const grupo = grupos[idx];
        if (confirm(`Deseja excluir todas as ${grupo.totalOcorrencias} ocorrências deste erro?`)) {
          if (this._onExcluirGrupo) this._onExcluirGrupo(grupo);
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
