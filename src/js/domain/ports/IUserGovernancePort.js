/**
 * Driven Port: IUserGovernancePort
 * Contrato abstrato para aprovação de solicitações de novos comércios e gestão de permissões de tenants.
 */
export class IUserGovernancePort {
  async listarSolicitacoes() {
    throw new Error('Método listarSolicitacoes não implementado');
  }

  async atualizarStatusSolicitacao(id, dadosDecisao) {
    throw new Error('Método atualizarStatusSolicitacao não implementado');
  }

  async listarTenants() {
    throw new Error('Método listarTenants não implementado');
  }

  async salvarTenant(tenantData) {
    throw new Error('Método salvarTenant não implementado');
  }

  async alternarKillSwitch(usuario, bloquear, motivo) {
    throw new Error('Método alternarKillSwitch não implementado');
  }

  inscreverAtualizacoes(callback) {
    throw new Error('Método inscreverAtualizacoes não implementado');
  }
}
