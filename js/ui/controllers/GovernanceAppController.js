/**
 * UI Controller: GovernanceAppController
 * Orquestrador principal da SPA de Governança Systekna.
 * Suporte a menu expansível/retrátil, drawer lateral mobile/tablet e total ausência de emojis.
 */
import { Icons } from '../icons/Icons.js';

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

    this._appContainer = document.getElementById('app-container');
    this._sidebar = document.getElementById('sidebar');
    this._sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this._sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    this._sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    this._menuToggleBtn = document.getElementById('menu-toggle-btn');

    this._activeTab = 'usuarios';
    this._cache = {
      feedbacks: [],
      erros: [],
      solicitacoes: [],
      tenants: [],
      noticias: []
    };

    this._setupResponsiveMenu();
    this._setupTabNavigation();
    this._setupDataSubscriptions();
  }

  _setupResponsiveMenu() {
    // Restaurar estado salvo de recolhimento no Desktop
    const isCollapsed = localStorage.getItem('systekna_sidebar_collapsed') === 'true';
    if (isCollapsed && this._appContainer && window.innerWidth > 1024) {
      this._appContainer.classList.add('sidebar-collapsed');
      this._atualizarIconeToggle(true);
    }

    // Toggle de diminuir ou expandir no desktop
    if (this._sidebarToggleBtn) {
      this._sidebarToggleBtn.addEventListener('click', () => {
        this.toggleSidebarDesktop();
      });
    }

    // Toggle geral (menu hambúrguer da topbar)
    if (this._menuToggleBtn) {
      this._menuToggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          this.toggleSidebarMobile();
        } else {
          this.toggleSidebarDesktop();
        }
      });
    }

    // Fechar drawer no mobile/tablet
    if (this._sidebarCloseBtn) {
      this._sidebarCloseBtn.addEventListener('click', () => {
        this.fecharSidebarMobile();
      });
    }

    if (this._sidebarBackdrop) {
      this._sidebarBackdrop.addEventListener('click', () => {
        this.fecharSidebarMobile();
      });
    }

    // Fechar ao teclar Esc
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.fecharSidebarMobile();
      }
    });

    // Ajustar em resize de tela
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        this.fecharSidebarMobile();
      }
    });
  }

  toggleSidebarDesktop() {
    if (!this._appContainer) return;
    const collapsed = this._appContainer.classList.toggle('sidebar-collapsed');
    localStorage.setItem('systekna_sidebar_collapsed', String(collapsed));
    this._atualizarIconeToggle(collapsed);
  }

  _atualizarIconeToggle(collapsed) {
    if (!this._sidebarToggleBtn) return;
    if (collapsed) {
      this._sidebarToggleBtn.innerHTML = Icons.svg('sidebarExpand', { size: 18, color: 'currentColor' });
      this._sidebarToggleBtn.title = 'Expandir menu';
    } else {
      this._sidebarToggleBtn.innerHTML = Icons.svg('sidebarCollapse', { size: 18, color: 'currentColor' });
      this._sidebarToggleBtn.title = 'Diminuir menu';
    }
  }

  toggleSidebarMobile() {
    if (!this._sidebar) return;
    const isOpen = this._sidebar.classList.toggle('open');
    if (this._sidebarBackdrop) {
      if (isOpen) {
        this._sidebarBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        this._sidebarBackdrop.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  fecharSidebarMobile() {
    if (this._sidebar) {
      this._sidebar.classList.remove('open');
    }
    if (this._sidebarBackdrop) {
      this._sidebarBackdrop.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  _setupTabNavigation() {
    const tabs = ['usuarios', 'erros', 'feedbacks', 'noticias'];
    tabs.forEach(tab => {
      const btn = document.getElementById(`nav-btn-${tab}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.switchTab(tab);
          // Fecha o drawer em telas móveis ao trocar de aba
          if (window.innerWidth <= 1024) {
            this.fecharSidebarMobile();
          }
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
