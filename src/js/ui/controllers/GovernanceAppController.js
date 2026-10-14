/**
 * UI Controller: GovernanceAppController
 * Orquestra o painel depois que o acesso de gestor é confirmado (ver SessaoController).
 * Navegação Aero 3.0: segmentado no tablet/computador e dock no celular; ilha viva com o que pede atenção.
 */
import { notificarErro } from '../utils/notificar.js';
import { seletor } from '../utils/seletor.js';

const ABAS = ['usuarios', 'erros', 'feedbacks', 'noticias'];
const $ = (id) => document.getElementById(id);

export class GovernanceAppController {
  constructor({
    feedbackService,
    errorService,
    userApprovalService,
    devNewsService,
    dataAdapter,
    feedbackView,
    errorView,
    userApprovalView,
    devNewsView
  }) {
    this._feedbackService = feedbackService;
    this._errorService = errorService;
    this._userApprovalService = userApprovalService;
    this._devNewsService = devNewsService;
    this._dataAdapter = dataAdapter;

    this._feedbackView = feedbackView;
    this._errorView = errorView;
    this._userApprovalView = userApprovalView;
    this._devNewsView = devNewsView;

    this._activeTab = 'usuarios';
    this._aberto = false;
    this._ilhaAcao = null;
    this._cache = { feedbacks: [], erros: [], solicitacoes: [], tenants: [], noticias: [] };

    this._setupTabs();
    this._setupIlha();
    this._setupDataSubscriptions();
  }

  // ═════ Abas ═════
  _setupTabs() {
    this._abas = seletor($('fAba'), (tab) => this.switchTab(tab));
    document.querySelectorAll('#dock [data-tab]').forEach((b) => {
      b.addEventListener('click', () => { this.switchTab(b.dataset.tab); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    });
  }

  switchTab(tabName) {
    if (!ABAS.includes(tabName)) return;
    this._activeTab = tabName;
    this._abas.marcar(tabName);
    document.querySelectorAll('#dock [data-tab]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === tabName)));
    ABAS.forEach((t) => { $(`section-${t}`).hidden = t !== tabName; });
    if (tabName === 'usuarios') requestAnimationFrame(() => this._userApprovalView.ajustarLayout());
  }

  // ═════ Ilha viva ═════
  _setupIlha() {
    const isl = $('island');
    const alternar = () => { const o = isl.classList.toggle('open'); isl.setAttribute('aria-expanded', String(o)); };
    isl.addEventListener('click', (e) => { if (!e.target.closest('button')) alternar(); });
    isl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
    $('ilhaGo').addEventListener('click', () => {
      isl.classList.remove('open'); isl.setAttribute('aria-expanded', 'false');
      if (this._ilhaAcao) this._ilhaAcao();
    });
  }

  _ilha(pendentes, errosAbertos, novos) {
    let t, v = '', d, go, acao;
    if (errosAbertos) {
      t = errosAbertos === 1 ? '1 erro aberto' : `${errosAbertos} erros abertos`;
      d = 'Relatórios de erro dos apps aguardando correção.'; go = 'Ver erros'; acao = () => this.switchTab('erros');
    } else if (pendentes) {
      t = pendentes === 1 ? '1 cadastro pendente' : `${pendentes} cadastros pendentes`;
      d = 'Estabelecimentos aguardando homologação.'; go = 'Ver solicitações'; acao = () => this.switchTab('usuarios');
    } else if (novos) {
      t = novos === 1 ? '1 feedback novo' : `${novos} feedbacks novos`;
      d = 'Mensagens dos usuários ainda não lidas.'; go = 'Ver feedbacks'; acao = () => this.switchTab('feedbacks');
    } else {
      t = 'Tudo em dia'; d = 'Nenhum erro aberto, cadastro pendente ou feedback novo.'; go = 'Fechar'; acao = null;
    }
    $('ilhaT').textContent = t; $('ilhaV').textContent = v; $('ilhaD').textContent = d; $('ilhaGo').textContent = go;
    this._ilhaAcao = acao;
  }

  // ═════ Ciclo do painel ═════
  /** Acesso confirmado: mostra a aba atual e carrega os dados. */
  abrir() {
    this._aberto = true;
    $('msgPainel').textContent = '';
    $('msgPainel').className = 'glass aviso';
    this.switchTab(this._activeTab);
    requestAnimationFrame(() => this._abas.mover());
    this.carregarTodosDados();
  }

  /** Saiu da conta ou mudou o login: nada do que estava na tela continua visível. */
  limpar() {
    this._aberto = false;
    this._cache = { feedbacks: [], erros: [], solicitacoes: [], tenants: [], noticias: [] };
    ['solicitacoes-list-container', 'tenants-list-container', 'error-list-container', 'feedback-list-container', 'dev-news-container', 'fb-distribuicao']
      .forEach((id) => $(id).replaceChildren());
    $('ilhaT').textContent = 'Conectando…';
  }

  _setupDataSubscriptions() {
    // Depois de cada escrita confirmada, recarrega do servidor
    this._dataAdapter.inscreverAtualizacoes(() => {
      if (this._aberto) this.carregarTodosDados();
    });

    this._feedbackView.onFilterChange((filtros) => {
      const filtrados = this._feedbackService.filtrarFeedbacks(this._cache.feedbacks, filtros);
      this._feedbackView.renderLista(filtrados, this._feedbackService);
    });

    this._errorView.onFilterChange((filtros) => {
      const grupos = this._errorService.agruparErros(this._cache.erros, filtros);
      this._errorView.renderGrupos(grupos);
    });

    this._userApprovalView.onFilterChange((filtros) => {
      const filtradas = this._userApprovalService.filtrarSolicitacoes(this._cache.solicitacoes, filtros);
      this._userApprovalView.renderSolicitacoes(filtradas);
    });

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
      if (!this._aberto) return; // saiu no meio da carga

      this._cache.feedbacks = this._feedbackService.processarFeedbacks(feedbacksRaw);
      this._cache.erros = this._errorService.processarErros(errosRaw);
      this._cache.solicitacoes = this._userApprovalService.processarSolicitacoes(solicitacoesRaw);
      this._cache.tenants = this._userApprovalService.processarTenants(tenantsRaw);
      this._cache.noticias = this._devNewsService.processarNoticias(noticiasRaw);

      this._atualizarViews();
    } catch (err) {
      const aviso = $('msgPainel');
      aviso.className = 'glass aviso err';
      aviso.textContent = err?.code === 'permission-denied'
        ? 'O Firestore deixou de reconhecer esta conta como gestora. Feche e abra o painel de novo.'
        : 'Não foi possível carregar os dados de governança. Verifique a conexão e recarregue a página.';
      notificarErro(err);
    }
  }

  _contador(ids, n) {
    ids.forEach((id) => { const el = $(id); if (el) el.textContent = n ? String(n) : ''; });
  }

  _atualizarViews() {
    // 1. Feedbacks
    const metricasFb = this._feedbackService.calcularResumo(this._cache.feedbacks);
    this._feedbackView.renderMetricas(metricasFb);
    this._feedbackView.renderLista(this._feedbackService.filtrarFeedbacks(this._cache.feedbacks), this._feedbackService);
    this._contador(['badge-count-feedbacks', 'mobile-badge-feedbacks'], metricasFb.novosNaoLidos);

    // 2. Erros
    const metricasErr = this._errorService.calcularMetricas(this._cache.erros);
    this._errorView.renderMetricas(metricasErr);
    this._errorView.renderGrupos(this._errorService.agruparErros(this._cache.erros, { status: 'abertos' }));
    this._contador(['badge-count-erros', 'mobile-badge-erros'], metricasErr.abertos);

    // 3. Licenças
    const metricasUsr = this._userApprovalService.calcularMetricas(this._cache.solicitacoes, this._cache.tenants);
    this._userApprovalView.renderMetricas(metricasUsr);
    this._userApprovalView.renderSolicitacoes(this._userApprovalService.filtrarSolicitacoes(this._cache.solicitacoes, { status: 'pendente' }));
    this._userApprovalView.renderTenants(this._cache.tenants);
    this._contador(['badge-count-usuarios', 'mobile-badge-usuarios'], metricasUsr.pendentes);

    // 4. Comunicados
    this._devNewsView.renderNoticias(this._devNewsService.filtrarNoticias(this._cache.noticias));

    this._ilha(metricasUsr.pendentes, metricasErr.abertos, metricasFb.novosNaoLidos);
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
