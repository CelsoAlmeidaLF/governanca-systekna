/**
 * UI Controller: GovernanceAppController
 * Orquestrador principal da SPA de Governança Systekna.
 */
export class GovernanceAppController {
  constructor({
    authService,
    feedbackService,
    errorService,
    userApprovalService,
    devNewsService,
    dataAdapter,
    authView,
    feedbackView,
    errorView,
    userApprovalView,
    devNewsView
  }) {
    this._authService = authService;
    this._feedbackService = feedbackService;
    this._errorService = errorService;
    this._userApprovalService = userApprovalService;
    this._devNewsService = devNewsService;
    this._dataAdapter = dataAdapter;

    this._authView = authView;
    this._feedbackView = feedbackView;
    this._errorView = errorView;
    this._userApprovalView = userApprovalView;
    this._devNewsView = devNewsView;

    this._liveIsland = document.getElementById('live-island');
    this._liveIslandText = document.getElementById('live-island-text');

    this._activeTab = 'usuarios';
    this._cache = {
      feedbacks: [],
      erros: [],
      solicitacoes: [],
      tenants: [],
      noticias: []
    };

    this._setupTabNavigation();
    this._setupDataSubscriptions();
  }

  _setupTabNavigation() {
    const tabs = ['usuarios', 'erros', 'feedbacks', 'noticias'];
    tabs.forEach(tab => {
      const btn = document.getElementById(`nav-btn-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.switchTab(tab);
        });
      }
    });
  }

  switchTab(tabName) {
    this._activeTab = tabName;

    // Atualiza classes ativas na Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    const activeNav = document.getElementById(`nav-item-${tabName}`);
    if (activeNav) activeNav.classList.add('active');

    // Atualiza seções ativas
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    const activeSec = document.getElementById(`section-${tabName}`);
    if (activeSec) activeSec.classList.add('active');
  }

  _setupDataSubscriptions() {
    // Inscreve para atualizações em tempo real
    this._dataAdapter.inscreverAtualizacoes(() => {
      this.carregarTodosDados();
    });

    // Filtros de Feedback
    this._feedbackView.onFilterChange((filtros) => {
      const filtrados = this._feedbackService.filtrarFeedbacks(this._cache.feedbacks, filtros);
      this._feedbackView.renderLista(filtrados, this._feedbackService);
    });

    // Filtros de Erros
    this._errorView.onFilterChange((filtros) => {
      const grupos = this._errorService.agruparErros(this._cache.erros, filtros);
      this._errorView.renderGrupos(grupos);
    });

    // Filtros de Usuários
    this._userApprovalView.onFilterChange((filtros) => {
      const filtradas = this._userApprovalService.filtrarSolicitacoes(this._cache.solicitacoes, filtros);
      this._userApprovalView.renderSolicitacoes(filtradas);
    });

    // Filtros de Notícias
    this._devNewsView.onFilterChange((filtros) => {
      const filtradas = this._devNewsService.filtrarNoticias(this._cache.noticias, filtros);
      this._devNewsView.renderNoticias(filtradas);
    });
  }

  async carregarTodosDados() {
    try {
      const [feedbacksRaw, errosRaw, solicitacoesRaw, tenantsRaw, noticiasRaw] = await Promise.all([
        this._dataAdapter.listarFeedbacks(),
        this._dataAdapter.listarErros(),
        this._dataAdapter.listarSolicitacoes(),
        this._dataAdapter.listarTenants(),
        this._dataAdapter.listarNoticias()
      ]);

      this._cache.feedbacks = this._feedbackService.processarFeedbacks(feedbacksRaw);
      this._cache.erros = this._errorService.processarErros(errosRaw);
      this._cache.solicitacoes = this._userApprovalService.processarSolicitacoes(solicitacoesRaw);
      this._cache.tenants = this._userApprovalService.processarTenants(tenantsRaw);
      this._cache.noticias = this._devNewsService.processarNoticias(noticiasRaw);

      this._atualizarViews();
      this._atualizarLiveIsland();
    } catch (err) {
      console.error('[GovernanceAppController] Erro ao carregar dados:', err);
    }
  }

  _atualizarViews() {
    // 1. Feedbacks
    const metricasFb = this._feedbackService.calcularResumo(this._cache.feedbacks);
    this._feedbackView.renderMetricas(metricasFb);
    const feedbacksFiltrados = this._feedbackService.filtrarFeedbacks(this._cache.feedbacks);
    this._feedbackView.renderLista(feedbacksFiltrados, this._feedbackService);

    // Badges Sidebar
    const badgeFb = document.getElementById('badge-count-feedbacks');
    if (badgeFb) badgeFb.textContent = metricasFb.novosNaoLidos || '0';

    // 2. Erros
    const metricasErr = this._errorService.calcularMetricas(this._cache.erros);
    this._errorView.renderMetricas(metricasErr);
    const gruposErr = this._errorService.agruparErros(this._cache.erros, { status: 'abertos' });
    this._errorView.renderGrupos(gruposErr);

    const badgeErr = document.getElementById('badge-count-erros');
    if (badgeErr) badgeErr.textContent = metricasErr.abertos || '0';

    // 3. Usuários
    const metricasUsr = this._userApprovalService.calcularMetricas(this._cache.solicitacoes, this._cache.tenants);
    this._userApprovalView.renderMetricas(metricasUsr);
    const solicitacoesFiltradas = this._userApprovalService.filtrarSolicitacoes(this._cache.solicitacoes, { status: 'pendente' });
    this._userApprovalView.renderSolicitacoes(solicitacoesFiltradas);
    this._userApprovalView.renderTenants(this._cache.tenants);

    const badgeUsr = document.getElementById('badge-count-usuarios');
    if (badgeUsr) badgeUsr.textContent = metricasUsr.pendentes || '0';

    // 4. Notícias
    const noticiasFiltradas = this._devNewsService.filtrarNoticias(this._cache.noticias);
    this._devNewsView.renderNoticias(noticiasFiltradas);

    const badgeNot = document.getElementById('badge-count-noticias');
    if (badgeNot) badgeNot.textContent = this._cache.noticias.length || '0';
  }

  _atualizarLiveIsland() {
    if (!this._liveIsland || !this._liveIslandText) return;

    const metricasErr = this._errorService.calcularMetricas(this._cache.erros);
    const metricasUsr = this._userApprovalService.calcularMetricas(this._cache.solicitacoes, this._cache.tenants);

    if (metricasErr.ultimas24h > 0) {
      this._liveIsland.className = 'live-island critical pulse-danger';
      this._liveIslandText.textContent = `Atenção: ${metricasErr.ultimas24h} falha(s) nas últimas 24h`;
    } else if (metricasUsr.pendentes > 0) {
      this._liveIsland.className = 'live-island warning pulse-warning';
      this._liveIslandText.textContent = `${metricasUsr.pendentes} comércio(s) aguardando homologação`;
    } else {
      this._liveIsland.className = 'live-island';
      this._liveIslandText.textContent = `Governança Systekna Ativa • Todos os sistemas normais`;
    }
  }

  exportarCsvFeedbacks() {
    const csvContent = this._feedbackService.gerarCsv(this._cache.feedbacks);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `feedbacks-systekna-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
