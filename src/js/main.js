/**
 * Governança Systekna — composição (arquitetura hexagonal) e inicialização.
 * Abre pelo cofre do kit de segurança (PIN FINANC ou biometria), como o painel de feedback:
 * o kit também bloqueia iframe de outro site e registra o service worker (sw.js).
 */
import { FirebaseAuthAdapter } from './infrastructure/adapters/FirebaseAuthAdapter.js';
import { FirestoreGovernanceAdapter } from './infrastructure/adapters/FirestoreGovernanceAdapter.js';
import { AuthService } from './application/AuthService.js';
import { FeedbackService } from './application/FeedbackService.js';
import { ErrorManagementService } from './application/ErrorManagementService.js';
import { UserApprovalService } from './application/UserApprovalService.js';
import { DevNewsService } from './application/DevNewsService.js';
import { AuthView } from './ui/views/AuthView.js';
import { FeedbackView } from './ui/views/FeedbackView.js';
import { ErrorManagementView } from './ui/views/ErrorManagementView.js';
import { UserApprovalView } from './ui/views/UserApprovalView.js';
import { DevNewsView } from './ui/views/DevNewsView.js';
import { GovernanceAppController } from './ui/controllers/GovernanceAppController.js';
import { SessaoController } from './ui/controllers/SessaoController.js';
import { notificarErro } from './ui/utils/notificar.js';
import { iniciarModo } from './ui/utils/modo.js';
import { iniciarDialogos } from './ui/utils/dialogo.js';
import { auth, db, authSdk, firestoreSdk } from './infrastructure/config/FirebaseApp.js';

// Envolve ações de escrita: qualquer falha (rede, regras do Firestore) aparece para o operador
// e a tela é recarregada do servidor, descartando mudanças otimistas feitas nas entidades em memória.
let recarregarAposFalha = null;
const comTratamentoDeErro = (acao) => async (...args) => {
  try {
    return await acao(...args);
  } catch (err) {
    notificarErro(err);
    if (recarregarAposFalha) await recarregarAposFalha();
    return undefined;
  }
};

iniciarModo();
iniciarDialogos();

// 1. Adaptadores de infraestrutura
const authAdapter = new FirebaseAuthAdapter({ auth, sdk: authSdk });
const firestoreAdapter = new FirestoreGovernanceAdapter({ db, fs: firestoreSdk });

// 2. Serviços de aplicação
const authService = new AuthService(authAdapter);
const feedbackService = new FeedbackService(firestoreAdapter);
const errorService = new ErrorManagementService(firestoreAdapter);
const userApprovalService = new UserApprovalService(firestoreAdapter);
const devNewsService = new DevNewsService(firestoreAdapter);

// 3. Views
let controller = null;
const feedbackView = new FeedbackView({
  onMarcarLido: comTratamentoDeErro((id, lido) => feedbackService.marcarComoLido(id, lido)),
  onExcluir: comTratamentoDeErro((id) => feedbackService.excluirFeedback(id)),
  onExportarCsv: () => { if (controller) controller.exportarCsvFeedbacks(); }
});
const errorView = new ErrorManagementView({
  onAlternarStatus: comTratamentoDeErro((grupo, resolvido) => errorService.alternarStatusGrupo(grupo, resolvido)),
  onExcluirGrupo: comTratamentoDeErro((grupo) => errorService.excluirGrupo(grupo))
});
const userApprovalView = new UserApprovalView({
  onAprovar: comTratamentoDeErro((solicitacao, opcoes) => userApprovalService.aprovarSolicitacao(solicitacao, opcoes)),
  onReprovar: comTratamentoDeErro((solicitacao, motivo) => userApprovalService.reprovarSolicitacao(solicitacao, { motivo })),
  onAlternarKillSwitch: comTratamentoDeErro((tenantId, bloquear) => userApprovalService.alternarKillSwitch(tenantId, bloquear)),
  onAtualizarModulos: comTratamentoDeErro((tenant, novosModulos) => userApprovalService.atualizarModulosTenant(tenant, novosModulos)),
  onAtualizarPlano: comTratamentoDeErro((tenant, novoPlano) => userApprovalService.atualizarPlanoTenant(tenant, novoPlano))
});
const devNewsView = new DevNewsView({
  onPublicarNoticia: (dados) => devNewsService.publicarNoticia(dados),
  onExcluirNoticia: comTratamentoDeErro((id) => devNewsService.excluirNoticia(id))
});

// 4. Controladores
controller = new GovernanceAppController({
  feedbackService, errorService, userApprovalService, devNewsService,
  dataAdapter: firestoreAdapter,
  feedbackView, errorView, userApprovalView, devNewsView
});
recarregarAposFalha = () => controller.carregarTodosDados();

let sessao = null;
const authView = new AuthView({
  onEntrar: (email, senha, guardar) => sessao.entrar(email, senha, guardar),
  onEsqueci: (email) => sessao.esqueci(email)
});
sessao = new SessaoController({ authService, dataAdapter: firestoreAdapter, authView, appController: controller });

// 5. Cofre: só depois do PIN/biometria o painel tenta entrar
await window.vaultReady;
sessao.secoesConfiguracoes();
authService.observarEstadoAutenticacao((user) => sessao.aoMudarLogin(user));
await authAdapter.inicializar();
