import { Icons } from '../icons/Icons.js';

/**
 * UI View: DevNewsView
 * Controla a renderização do feed de notícias e comunicados para desenvolvedores e modal de publicação.
 * REGRA ABSOLUTA: Proibido o uso de emojis como ícones visuais na interface.
 */
export class DevNewsView {
  constructor({ onPublicarNoticia, onExcluirNoticia }) {
    this._onPublicarNoticia = onPublicarNoticia;
    this._onExcluirNoticia = onExcluirNoticia;

    this._container = document.getElementById('dev-news-container');
    this._filterCategoria = document.getElementById('news-filter-categoria');
    this._filterPrioridade = document.getElementById('news-filter-prioridade');
    this._searchInput = document.getElementById('news-search-input');
    this._novaNoticiaBtn = document.getElementById('nova-noticia-btn');

    // Modal de publicação
    this._modalBackdrop = document.getElementById('noticia-modal-backdrop');
    this._modalForm = document.getElementById('noticia-form');
    this._modalCloseBtn = document.getElementById('noticia-modal-close');
    this._tituloInput = document.getElementById('noticia-titulo');
    this._categoriaSelect = document.getElementById('noticia-categoria');
    this._prioridadeSelect = document.getElementById('noticia-prioridade');
    this._resumoInput = document.getElementById('noticia-resumo');
    this._conteudoInput = document.getElementById('noticia-conteudo');
    this._tagsInput = document.getElementById('noticia-tags');

    this._setupListeners();
  }

  _setupListeners() {
    if (this._novaNoticiaBtn) {
      this._novaNoticiaBtn.addEventListener('click', () => {
        this._abrirModal();
      });
    }

    if (this._modalCloseBtn) {
      this._modalCloseBtn.addEventListener('click', () => {
        this._fecharModal();
      });
    }

    if (this._modalBackdrop) {
      this._modalBackdrop.addEventListener('click', (e) => {
        if (e.target === this._modalBackdrop) this._fecharModal();
      });
    }

    if (this._modalForm) {
      this._modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          titulo: this._tituloInput.value.trim(),
          categoria: this._categoriaSelect.value,
          prioridade: this._prioridadeSelect.value,
          resumo: this._resumoInput.value.trim(),
          conteudo: this._conteudoInput.value.trim(),
          tags: this._tagsInput.value.split(',').map(t => t.trim()).filter(Boolean),
          autor: 'CEO & Engenheiro Chefe'
        };

        try {
          if (this._onPublicarNoticia) {
            await this._onPublicarNoticia(payload);
          }
          this._fecharModal();
          this._modalForm.reset();
        } catch (err) {
          alert(`Erro ao publicar notícia: ${err.message}`);
        }
      });
    }
  }

  _abrirModal() {
    if (this._modalBackdrop) this._modalBackdrop.classList.add('open');
  }

  _fecharModal() {
    if (this._modalBackdrop) this._modalBackdrop.classList.remove('open');
  }

  onFilterChange(callback) {
    const trigger = () => {
      callback({
        categoria: this._filterCategoria?.value || 'todas',
        prioridade: this._filterPrioridade?.value || 'todas',
        busca: this._searchInput?.value || ''
      });
    };

    this._filterCategoria?.addEventListener('change', trigger);
    this._filterPrioridade?.addEventListener('change', trigger);
    this._searchInput?.addEventListener('input', trigger);
  }

  renderNoticias(noticias) {
    if (!this._container) return;

    if (noticias.length === 0) {
      this._container.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="margin-bottom:0.75rem;color:var(--text-dim);">${Icons.svg('newspaper', { size: 42 })}</div>
          <p>Nenhuma notícia ou comunicado encontrado para os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    this._container.innerHTML = noticias.map(n => {
      const prioridadeBadge = n.prioridade === 'critical'
        ? '<span class="badge badge-crit">URGENTE / CRÍTICO</span>'
        : n.prioridade === 'warning'
        ? '<span class="badge badge-warn">AVISO DE ARQUITETURA</span>'
        : '<span class="badge badge-info">INFORMATIVO</span>';

      const tagsHtml = n.tags.map(t => `<span class="badge badge-neutral" style="font-size:0.7rem;">#${this._sanitizarHtml(t)}</span>`).join(' ');

      return `
        <article class="glass-card" style="margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;gap:0.65rem;">
              ${prioridadeBadge}
              <span class="badge badge-neutral">${n.getRotuloCategoria().replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim()}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-dim);">
              ${new Date(n.criadoEm).toLocaleDateString('pt-BR')} • Publicado por ${this._sanitizarHtml(n.autor)}
            </div>
          </div>

          <h3 style="color:#ffffff;font-size:1.3rem;font-weight:700;line-height:1.3;">
            ${this._sanitizarHtml(n.titulo)}
          </h3>

          ${n.resumo ? `
            <div style="font-size:0.95rem;color:var(--text-main);font-weight:500;padding:0.75rem 1rem;background:rgba(255,255,255,0.03);border-left:3px solid var(--color-primary);border-radius:var(--border-radius-sm);">
              ${this._sanitizarHtml(n.resumo)}
            </div>
          ` : ''}

          <div style="font-size:0.92rem;line-height:1.7;color:var(--text-muted);white-space:pre-wrap;">${this._sanitizarHtml(n.conteudo)}</div>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;padding-top:0.75rem;border-top:var(--glass-border-subtle);">
            <div style="display:flex;align-items:center;gap:0.4rem;flex-wrap:wrap;">
              ${tagsHtml}
            </div>

            <button class="btn btn-danger btn-sm excluir-noticia-btn" data-id="${n.id}" title="Excluir comunicado">
              ${Icons.svg('trash', { size: 14 })} Excluir
            </button>
          </div>
        </article>
      `;
    }).join('');

    this._container.querySelectorAll('.excluir-noticia-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Deseja excluir este comunicado para os desenvolvedores?')) {
          if (this._onExcluirNoticia) this._onExcluirNoticia(id);
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
