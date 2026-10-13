import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRegistration } from '../src/js/domain/entities/UserRegistration.js';
import { TenantPermission } from '../src/js/domain/entities/TenantPermission.js';
import { UserApprovalService } from '../src/js/application/UserApprovalService.js';

test('UserRegistration: CNPJ opcional (RN-FIREBASE.1) e formatação', () => {
  // Com CNPJ
  const regComCnpj = new UserRegistration({
    usuario: 'pub_central',
    cnpj: '12.345.678/0001-90',
    tipoComercio: 'bar'
  });
  assert.equal(regComCnpj.cnpj, '12345678000190');
  assert.equal(regComCnpj.getCnpjFormatado(), '12.345.678/0001-90');

  // Sem CNPJ (Balcão Puro)
  const regSemCnpj = new UserRegistration({
    usuario: 'coxinha_express',
    cnpj: null,
    tipoComercio: 'loja_salgados'
  });
  assert.equal(regSemCnpj.cnpj, null);
  assert.equal(regSemCnpj.getCnpjFormatado(), 'Não informado (Balcão / Opcional)');
});

test('UserApprovalService: aprovação de Loja de Salgados com mesas bloqueadas (RN-FIREBASE.2)', async () => {
  let salvoStatus = null;
  let salvoTenant = null;

  const mockPort = {
    atualizarStatusSolicitacao: async (id, dados) => { salvoStatus = dados; return true; },
    salvarTenant: async (dados) => { salvoTenant = dados; return true; },
    alternarKillSwitch: async () => true
  };

  const service = new UserApprovalService(mockPort);
  const solic = new UserRegistration({
    id: 'solic-salgados',
    usuario: 'salgados_top',
    tipoComercio: 'loja_salgados',
    status: 'pendente'
  });

  const { solicitacao, tenant } = await service.aprovarSolicitacao(solic, {
    permiteMesas: false, // Balcão Puro
    plano: 'starter',
    aprovador: 'CEO Systekna'
  });

  assert.equal(solicitacao.status, 'aprovado');
  assert.equal(solicitacao.permiteMesas, false);
  assert.equal(tenant.permissoesModulos.permiteMesas, false);
  assert.equal(tenant.licenca.plano, 'starter');
  assert.equal(salvoStatus.status, 'aprovado');
  assert.equal(salvoTenant.usuario, 'salgados_top');
});

test('TenantPermission: ativação e suspensão por Kill-Switch Remoto (Eixo 1)', () => {
  const tenant = new TenantPermission({
    usuario: 'pub_inadimplente',
    nomeComercio: 'Pub Inadimplente'
  });

  assert.equal(tenant.licenca.bloqueioRemoto, false);
  assert.equal(tenant.licenca.status, 'ativo');

  // Bloqueio
  tenant.alternarKillSwitch(true, 'Inadimplência de licença contratual');
  assert.equal(tenant.licenca.bloqueioRemoto, true);
  assert.equal(tenant.licenca.status, 'bloqueado');
  assert.equal(tenant.licenca.motivoBloqueio, 'Inadimplência de licença contratual');

  // Desbloqueio
  tenant.alternarKillSwitch(false);
  assert.equal(tenant.licenca.bloqueioRemoto, false);
  assert.equal(tenant.licenca.status, 'ativo');
});
