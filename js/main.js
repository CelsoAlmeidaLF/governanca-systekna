import { FirebaseAuthAdapter } from './infrastructure/adapters/FirebaseAuthAdapter.js?v=1.0.3';
import { FirestoreGovernanceAdapter } from './infrastructure/adapters/FirestoreGovernanceAdapter.js?v=1.0.3';
import { AuthService } from './application/AuthService.js?v=1.0.3';
import { FeedbackService } from './application/FeedbackService.js?v=1.0.3';
import { ErrorManagementService } from './application/ErrorManagementService.js?v=1.0.3';
import { UserApprovalService } from './application/UserApprovalService.js?v=1.0.3';
import { DevNewsService } from './application/DevNewsService.js?v=1.0.3';
import { AuthView } from './ui/views/AuthView.js?v=1.0.3';
import { FeedbackView } from './ui/views/FeedbackView.js?v=1.0.3';
import { ErrorManagementView } from './ui/views/ErrorManagementView.js?v=1.0.3';
import { UserApprovalView } from './ui/views/UserApprovalView.js?v=1.0.3';
import { DevNewsView } from './ui/views/DevNewsView.js?v=1.0.3';
import { GovernanceAppController } from './ui/controllers/GovernanceAppController.js?v=1.0.3';

// Inicialização Principal da Aplicação
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Adapters de Infraestrutura
  const authAdapter = new FirebaseAuthAdapter();
  const firestoreAdapter = new FirestoreGovernanceAdapter();

  // 2. Application Services
  const authService = new AuthService(authAdapter);
  const feedbackService = new FeedbackService(firestoreAdapter);
  const errorService = new ErrorManagementService(firestoreAdapter);
  const userApprovalService = new UserApprovalService(firestoreAdapter);
  const devNewsService = new DevNewsService(firestoreAdapter);

  let controller = null;

  // 3. UI Views
  const authView = new AuthView({
    onLogin: async (email, password) => {
      const user = await authService.login(email, password);
      authView.renderUserState(user);
      if (controller) await controller.carregarTodosDados();
    },
    onRegister: async (email, password, displayName) => {
      const user = await authService.cadastrarUsuario(email, password, displayName);
      authView.renderUserState(user);
      if (controller) await controller.carregarTodosDados();
    },
    onLogout: async () => {
      await authService.logout();
      authView.renderUserState(null);
    },
    onResetPassword: async (email) => {
      return await authService.solicitarRecuperacaoSenha(email);
    }
  });

  const feedbackView = new FeedbackView({
    onMarcarLido: async (id, lido) => {
      await feedbackService.marcarComoLido(id, lido);
    },
    onExcluir: async (id) => {
      await feedbackService.excluirFeedback(id);
    },
    onExportarCsv: () => {
      if (controller) controller.exportarCsvFeedbacks();
    }
  });

  const errorView = new ErrorManagementView({
    onAlternarStatus: async (grupo, resolvido) => {
      await errorService.alternarStatusGrupo(grupo, resolvido);
    },
    onExcluirGrupo: async (grupo) => {
      await errorService.excluirGrupo(grupo);
    }
  });

  const userApprovalView = new UserApprovalView({
    onAprovar: async (solicitacao, opcoes) => {
      await userApprovalService.aprovarSolicitacao(solicitacao, opcoes);
    },
    onReprovar: async (solicitacao, motivo) => {
      await userApprovalService.reprovarSolicitacao(solicitacao, { motivo });
    },
    onAlternarKillSwitch: async (usuario, bloquear) => {
      await userApprovalService.alternarKillSwitch(usuario, bloquear);
    },
    onAtualizarModulos: async (tenant, novosModulos) => {
      await userApprovalService.atualizarModulosTenant(tenant, novosModulos);
    },
    onAtualizarPlano: async (tenant, novoPlano) => {
      await userApprovalService.atualizarPlanoTenant(tenant, novoPlano);
    }
  });

  const devNewsView = new DevNewsView({
    onPublicarNoticia: async (dados) => {
      await devNewsService.publicarNoticia(dados);
    },
    onExcluirNoticia: async (id) => {
      await devNewsService.excluirNoticia(id);
    }
  });

  // 4. Controller
  controller = new GovernanceAppController({
    authService,
    feedbackService,
    errorService,
    userApprovalService,
    devNewsService,
    dataAdapter: firestoreAdapter,
    authView,
    feedbackView,
    errorView,
    userApprovalView,
    devNewsView
  });

  // 5. Observa estado de autenticação
  authService.observarEstadoAutenticacao(async (user) => {
    authView.renderUserState(user);
    if (user) {
      await controller.carregarTodosDados();
    }
  });

  // Tenta inicializar auth prévia
  await authAdapter.inicializar();
});
