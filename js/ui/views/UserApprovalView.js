import { Icons } from '../icons/Icons.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { confirmar, pedirTexto } from '../utils/dialogo.js';
import { seletor } from '../utils/seletor.js';

/**
 * UI View: UserApprovalView
 * Controla a esteira de aprovação de novos cadastros (com CNPJ opcional e toggle permiteMesas)
 * e o painel de governança avançada de tenants ativos (módulos, cotas e kill-switch remoto).
 * REGRA ABSOLUTA: Proibido o uso de emojis como ícones visuais na interface.
 */
export class UserApprovalView {
  constructor({ onAprovar, onReprovar, onAlternarKillSwitch, onAtualizarModulos, onAtualizarPlano }) {
    this._onAprovar = onAprovar;
    this._onReprovar = onReprovar;
    this._onAlternarKillSwitch = onAlternarKillSwitch;
    this._onAtualizarModulos = onAtualizarModulos;
    this._onAtualizarPlano = onAtualizarPlano;

    this._solicitacoesContainer = document.getElementById('solicitacoes-list-container');
    this._tenantsContainer = document.getElementById('tenants-list-container');

    this._pendentesCount = document.getElementById('user-pendentes-count');
    this._aprovadosCount = document.getElementById('user-aprovados-count');
    this._comMesasCount = document.getElementById('user-com-mesas-count');
    this._semMesasCount = document.getElementById('user-sem-mesas-count');

    this._filterStatus = document.getElementById('user-filter-status');
    this._searchInput = document.getElementById('user-search-input');

    // Sub-abas (Solicitações × Licenças ativas)
    this._panelSolicitacoes = document.getElementById('panel-solicitacoes');
    this._panelTenants = document.getElementById('panel-tenants');

    this._setupSubTabs();
  }

  _setupSubTabs() {
    const seg = document.getElementById('fSubUsuarios');
    if (!seg) return;
    this._subSeletor = seletor(seg, (v) => {
      if (this._panelSolicitacoes) this._panelSolicitacoes.hidden = v !== 'solicitacoes';
      if (this._panelTenants) this._panelTenants.hidden = v !== 'tenants';
    });
  }

  /** Reposiciona o indicador quando a seção aparece (oculta, ele não tem largura). */
  ajustarLayout() {
    this._subSeletor?.mover();
  }

  onFilterChange(callback) {
    const trigger = () => {
      callback({
        status: this._filterStatus?.value || 'pendente',
        busca: this._searchInput?.value || ''
      });
    };

    this._filterStatus?.addEventListener('change', trigger);
    this._searchInput?.addEventListener('input', trigger);
  }

  renderMetricas(metricas) {
    if (this._pendentesCount) this._pendentesCount.textContent = metricas.pendentes;
    if (this._aprovadosCount) this._aprovadosCount.textContent = metricas.aprovados;
    if (this._comMesasCount) this._comMesasCount.textContent = metricas.comMesas;
    if (this._semMesasCount) this._semMesasCount.textContent = metricas.semMesas;
  }

  renderSolicitacoes(solicitacoes) {
    if (!this._solicitacoesContainer) return;

    if (solicitacoes.length === 0) {
      this._solicitacoesContainer.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="margin-bottom:0.75rem;color:var(--text-dim);">${Icons.svg('users', { size: 42 })}</div>
          <p>Nenhuma solicitação de acesso pendente na esteira da Governança.</p>
        </div>
      `;
      return;
    }

    this._solicitacoesContainer.innerHTML = solicitacoes.map((s, index) => {
      const isPendente = s.status === 'pendente';
      const statusBadge = s.status === 'aprovado'
        ? '<span class="badge badge-pos">APROVADO</span>'
        : s.status === 'reprovado'
        ? '<span class="badge badge-crit">REPROVADO</span>'
        : '<span class="badge badge-warn">PENDENTE DE AVALIAÇÃO</span>';

      const sugereMesas = s.tipoComercio === 'bar';

      return `
        <div class="glass-card" style="margin-bottom:1.25rem;display:flex;flex-direction:column;gap:1rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.65rem;">
              ${statusBadge}
              <span class="badge badge-info">${escapeHtml(s.getRotuloTipoComercio())}</span>
              ${s.cnpj ? '<span class="badge badge-neutral">CNPJ Válido</span>' : '<span class="badge badge-neutral">Balcão (Sem CNPJ)</span>'}
            </div>
            <div style="font-size:0.8rem;color:var(--text-dim);">
              Solicitado em: ${new Date(s.solicitadoEm).toLocaleString('pt-BR')}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr));gap:1rem;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;font-weight:600;">Usuário / Gestor</div>
              <div style="font-size:1.05rem;color:var(--ink);font-weight:600;">${this._sanitizarHtml(s.usuario)}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;font-weight:600;">Nome Fantasia / Estabelecimento</div>
              <div style="font-size:1rem;color:var(--text-main);">${this._sanitizarHtml(s.nomeEstabelecimento || 'Não informado')}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);text-transform:uppercase;font-weight:600;">CNPJ (Opcional - RN12)</div>
              <div style="font-size:0.95rem;color:${s.cnpj ? 'var(--color-primary)' : 'var(--text-muted)'};font-family:var(--font-mono);">
                ${escapeHtml(s.getCnpjFormatado())}
              </div>
            </div>
          </div>

          ${isPendente ? `
            <!-- Painel de Decisão de Governança -->
            <div style="padding:1rem;background:var(--field);box-shadow:var(--recess);border:var(--glass-border-subtle);border-radius:var(--border-radius-md);display:flex;flex-direction:column;gap:1rem;">
              <div style="font-size:0.85rem;font-weight:600;color:var(--color-primary);display:flex;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                ${Icons.svg('shield', { size: 16 })} Decisão Soberana da Governança Systekna
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <!-- Comutador Soberano de Mesas -->
                <label class="switch-container">
                  <div class="switch">
                    <input type="checkbox" id="toggle-mesas-${index}" ${sugereMesas ? 'checked' : ''}>
                    <span class="slider"></span>
                  </div>
                  <div style="display:flex;flex-direction:column;">
                    <span style="font-size:0.88rem;font-weight:600;color:var(--ink);">Autorizar Módulo de Mesas e Salão</span>
                    <span style="font-size:0.75rem;color:var(--text-muted);">
                      Se desligado, operará em modo balcão puro (Lojas de Salgados/Lanchonetes)
                    </span>
                  </div>
                </label>

                <!-- Seleção de Plano -->
                <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                  <span style="font-size:0.82rem;color:var(--text-muted);">Plano:</span>
                  <select id="select-plano-${index}" class="filter-select" style="padding:0.4rem 0.8rem;">
                    <option value="pro" selected>Pro (Recomendado)</option>
                    <option value="starter">Starter (Básico)</option>
                    <option value="enterprise">Enterprise (Rede)</option>
                  </select>
                </div>
              </div>

              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.75rem;margin-top:0.5rem;">
                <button class="btn btn-success aprovar-btn" data-index="${index}">
                  ${Icons.svg('check', { size: 15 })} Homologar & Liberar Acesso
                </button>
                <button class="btn btn-danger reprovar-btn" data-index="${index}">
                  ${Icons.svg('x', { size: 15 })} Rejeitar Solicitação
                </button>
              </div>
            </div>
          ` : `
            <div style="padding:0.75rem;background:var(--track);border-radius:var(--border-radius-sm);font-size:0.82rem;color:var(--text-muted);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
              <div>
                <strong>Veredito:</strong> ${escapeHtml(String(s.status).toUpperCase())} | 
                <strong>Módulo de Mesas:</strong> ${s.permiteMesas ? 'HABILITADO' : 'BLOQUEADO'} |
                <strong>Auditor:</strong> ${this._sanitizarHtml(s.aprovadoPor || 'Governança')}
              </div>
              <div>${s.motivoDecisao ? `<em>"${this._sanitizarHtml(s.motivoDecisao)}"</em>` : ''}</div>
            </div>
          `}
        </div>
      `;
    }).join('');

    // Listeners
    this._solicitacoesContainer.querySelectorAll('.aprovar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-index'));
        const s = solicitacoes[idx];
        const toggleMesas = document.getElementById(`toggle-mesas-${idx}`);
        const selectPlano = document.getElementById(`select-plano-${idx}`);
        const permiteMesas = toggleMesas ? toggleMesas.checked : true;
        const plano = selectPlano ? selectPlano.value : 'pro';

        const resumo = `${s.nomeEstabelecimento || s.usuario} entra no plano ${plano.toUpperCase()}`
          + ` com mesas ${permiteMesas ? 'liberadas' : 'bloqueadas (balcão puro)'}.`;
        if (this._onAprovar && await confirmar(resumo, { titulo: 'Homologar estabelecimento?', ok: 'Homologar' })) {
          this._onAprovar(s, { permiteMesas, plano });
        }
      });
    });

    this._solicitacoesContainer.querySelectorAll('.reprovar-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-index'));
        const s = solicitacoes[idx];
        const motivo = await pedirTexto(`Por que rejeitar o cadastro de ${s.nomeEstabelecimento || s.usuario}?`, { titulo: 'Rejeitar solicitação', rotulo: 'Motivo', valor: 'Documentação cadastral não aderente', ok: 'Rejeitar', perigo: true });
        if (motivo !== null && this._onReprovar) {
          this._onReprovar(s, motivo);
        }
      });
    });
  }

  renderTenants(tenants) {
    if (!this._tenantsContainer) return;

    if (tenants.length === 0) {
      this._tenantsContainer.innerHTML = `
        <div class="glass-card" style="text-align:center;padding:3rem;color:var(--text-muted);">
          <div style="margin-bottom:0.75rem;color:var(--text-dim);">${Icons.svg('building', { size: 42 })}</div>
          <p>Nenhum tenant ativo registrado no banco de governança.</p>
        </div>
      `;
      return;
    }

    this._tenantsContainer.innerHTML = tenants.map((t, index) => {
      const isBloqueado = t.licenca.bloqueioRemoto || t.licenca.status === 'bloqueado';

      return `
        <div class="glass-card" style="margin-bottom:1.25rem;display:flex;flex-direction:column;gap:1rem;${isBloqueado ? 'box-shadow:var(--thick),var(--e1),inset 0 0 0 1.5px color-mix(in srgb,var(--out) 45%,transparent);' : ''}">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.65rem;">
              ${isBloqueado
                ? '<span class="badge badge-crit">BLOQUEADO REMOTAMENTE</span>'
                : '<span class="badge badge-pos">ATIVO & HOMOLOGADO</span>'}
              <span class="badge badge-info">PLANO ${escapeHtml(String(t.licenca.plano).toUpperCase())}</span>
              <span class="badge badge-neutral">${escapeHtml(t.usuario)}</span>
            </div>

            <!-- Kill-Switch Remoto -->
            <button class="btn ${isBloqueado ? 'btn-success' : 'btn-danger'} btn-sm kill-switch-btn" data-index="${index}">
              ${isBloqueado ? `${Icons.svg('check', { size: 14 })} Desbloquear Terminal` : `${Icons.svg('lock', { size: 14 })} Ativar Kill-Switch Remoto`}
            </button>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 200px), 1fr));gap:0.75rem;">
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);">Estabelecimento</div>
              <div style="font-size:1rem;color:var(--ink);font-weight:600;">${this._sanitizarHtml(t.nomeComercio)}</div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);">Versão do Cliente / Mínima</div>
              <div style="font-size:0.9rem;color:var(--text-main);font-family:var(--font-mono);">
                v${escapeHtml(t.metricasCompliance.versaoCliente)} (mín: v${escapeHtml(t.politicaVersao.versaoMinima)})
              </div>
            </div>
            <div>
              <div style="font-size:0.75rem;color:var(--text-dim);">Último Backup</div>
              <div style="font-size:0.9rem;color:var(--text-main);">
                ${t.metricasCompliance.ultimoBackupEm ? new Date(t.metricasCompliance.ultimoBackupEm).toLocaleDateString('pt-BR') : 'Sem registro'}
              </div>
            </div>
          </div>

          <!-- Matriz de Módulos Autorizados -->
          <div style="padding:0.75rem 1rem;background:var(--field);box-shadow:var(--recess);border-radius:var(--border-radius-sm);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
            <span style="font-size:0.8rem;font-weight:600;color:var(--text-muted);">Módulos Homologados:</span>
            
            <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.8rem;cursor:pointer;">
                <input type="checkbox" class="mod-checkbox" data-index="${index}" data-mod="permiteMesas" ${t.permissoesModulos.permiteMesas ? 'checked' : ''}>
                <span>Mesas & Comandas</span>
              </label>

              <label style="display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.8rem;cursor:pointer;">
                <input type="checkbox" class="mod-checkbox" data-index="${index}" data-mod="permiteBiometria" ${t.permissoesModulos.permiteBiometria ? 'checked' : ''}>
                <span>Biometria WebAuthn</span>
              </label>

              <label style="display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.8rem;cursor:pointer;">
                <input type="checkbox" class="mod-checkbox" data-index="${index}" data-mod="permiteExportacaoXlsx" ${t.permissoesModulos.permiteExportacaoXlsx ? 'checked' : ''}>
                <span>Exportação XLSX</span>
              </label>

              <label style="display:flex;align-items:center;flex-wrap:wrap;gap:0.4rem;font-size:0.8rem;cursor:pointer;">
                <input type="checkbox" class="mod-checkbox" data-index="${index}" data-mod="permiteEscPosTermica" ${t.permissoesModulos.permiteEscPosTermica ? 'checked' : ''}>
                <span>Térmica ESC/POS</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Listeners
    this._tenantsContainer.querySelectorAll('.kill-switch-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-index'));
        const t = tenants[idx];
        const isBloqueado = t.licenca.bloqueioRemoto || t.licenca.status === 'bloqueado';
        const confirmMsg = isBloqueado
          ? `O terminal de ${t.nomeComercio} volta a lançar normalmente.`
          : `Os lançamentos de ${t.nomeComercio} param na hora. Os dados do aparelho continuam guardados e exportáveis.`;

        if (await confirmar(confirmMsg, isBloqueado
          ? { titulo: 'Desbloquear terminal?', ok: 'Desbloquear' }
          : { titulo: 'Ativar o kill-switch?', ok: 'Bloquear', perigo: true })) {
          if (this._onAlternarKillSwitch) {
            this._onAlternarKillSwitch(t.id, !isBloqueado);
          }
        }
      });
    });

    this._tenantsContainer.querySelectorAll('.mod-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const idx = Number(chk.getAttribute('data-index'));
        const modKey = chk.getAttribute('data-mod');
        const t = tenants[idx];
        if (this._onAtualizarModulos) {
          this._onAtualizarModulos(t, { [modKey]: chk.checked });
        }
      });
    });
  }

  _sanitizarHtml(str) {
    return escapeHtml(str);
  }
}
