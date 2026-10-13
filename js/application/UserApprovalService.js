import { UserRegistration } from '../domain/entities/UserRegistration.js';
import { TenantPermission } from '../domain/entities/TenantPermission.js';

/**
 * Application Service: UserApprovalService
 * Orquestra o fluxo de aprovação de novos comércios (com CNPJ opcional e toggle permiteMesas)
 * e o gerenciamento de cotas, módulos e kill-switch remoto de tenants ativos.
 */
export class UserApprovalService {
  constructor(userGovernancePort) {
    this._port = userGovernancePort;
  }

  processarSolicitacoes(rawList = []) {
    return rawList.map(item => item instanceof UserRegistration ? item : new UserRegistration(item));
  }

  processarTenants(rawList = []) {
    return rawList.map(item => item instanceof TenantPermission ? item : new TenantPermission(item));
  }

  filtrarSolicitacoes(solicitacoes = [], { status = 'pendentes', busca = '' } = {}) {
    const termo = String(busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    return solicitacoes.filter(s => {
      if (status !== 'todos' && s.status !== status) return false;
      if (termo) {
        const texto = `${s.usuario} ${s.nomeEstabelecimento} ${s.cnpj || ''} ${s.tipoComercio}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.solicitadoEm).getTime() - new Date(a.solicitadoEm).getTime());
  }

  calcularMetricas(solicitacoes = [], tenants = []) {
    let pendentes = 0;
    let aprovados = 0;
    let reprovados = 0;
    let comMesas = 0;
    let semMesas = 0;

    for (const s of solicitacoes) {
      if (s.status === 'pendente') pendentes++;
      else if (s.status === 'aprovado') {
        aprovados++;
        if (s.permiteMesas) comMesas++;
        else semMesas++;
      } else if (s.status === 'reprovado') {
        reprovados++;
      }
    }

    let tenantsAtivos = 0;
    let tenantsBloqueados = 0;
    for (const t of tenants) {
      if (t.licenca?.bloqueioRemoto || t.licenca?.status === 'bloqueado') tenantsBloqueados++;
      else tenantsAtivos++;
    }

    return {
      totalSolicitacoes: solicitacoes.length,
      pendentes,
      aprovados,
      reprovados,
      comMesas,
      semMesas,
      tenantsAtivos,
      tenantsBloqueados
    };
  }

  async aprovarSolicitacao(solicitacao, { permiteMesas = true, plano = 'pro', aprovador = 'CEO / Engenharia Systekna', motivo = 'Homologado com sucesso' } = {}) {
    solicitacao.aprovar({ aprovador, permiteMesas, motivo });
    await this._port.atualizarStatusSolicitacao(solicitacao.id, solicitacao.toJSON());

    // Cria ou sincroniza o registro do tenant
    const tenant = new TenantPermission({
      usuario: solicitacao.usuario,
      nomeComercio: solicitacao.nomeEstabelecimento || solicitacao.usuario,
      cnpj: solicitacao.cnpj,
      tipoComercio: solicitacao.tipoComercio,
      licenca: {
        plano,
        status: 'ativo',
        criadoEm: new Date().toISOString(),
        expiraEm: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        bloqueioRemoto: false
      },
      permissoesModulos: {
        permiteMesas: Boolean(permiteMesas),
        permiteBiometria: true,
        permiteExportacaoXlsx: plano !== 'starter',
        permiteEscPosTermica: plano === 'enterprise',
        limiteProdutos: plano === 'starter' ? 50 : 1000,
        limiteUsuarios: plano === 'starter' ? 2 : 10
      }
    });

    await this._port.salvarTenant(tenant.toJSON());
    return { solicitacao, tenant };
  }

  async reprovarSolicitacao(solicitacao, { aprovador = 'CEO / Engenharia Systekna', motivo = 'Cadastro não aprovado pela governança' } = {}) {
    solicitacao.reprovar({ aprovador, motivo });
    return await this._port.atualizarStatusSolicitacao(solicitacao.id, solicitacao.toJSON());
  }

  async alternarKillSwitch(usuario, bloquear, motivo = 'Suspensão de Governança Systekna') {
    return await this._port.alternarKillSwitch(usuario, bloquear, motivo);
  }

  async atualizarModulosTenant(tenant, novosModulos = {}) {
    tenant.atualizarModulos(novosModulos);
    return await this._port.salvarTenant(tenant.toJSON());
  }

  async atualizarPlanoTenant(tenant, novoPlano) {
    tenant.atualizarPlano(novoPlano);
    return await this._port.salvarTenant(tenant.toJSON());
  }
}
