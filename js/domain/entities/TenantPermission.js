/**
 * Entidade de Domínio: TenantPermission
 * Modela os controles de governança ativa, tiers, módulos, cotas e kill-switch remoto de um tenant.
 * Conforme especificado em 14_GOVERNANCA_AVANCADA_LICENCIAMENTO_E_CONTROLE.md.
 */
export class TenantPermission {
  constructor({
    id = '',
    usuario = '',
    nomeComercio = '',
    cnpj = null,
    tipoComercio = 'bar',
    licenca = {},
    permissoesModulos = {},
    politicaVersao = {},
    metricasCompliance = {}
  } = {}) {
    this.usuario = String(usuario).trim();
    // Chave do documento em tenants_governanca = id da solicitação de origem (UUID não adivinhável).
    // Tenants legados sem id usam o próprio usuário como chave.
    this.id = String(id || this.usuario).trim();
    this.nomeComercio = String(nomeComercio || '').trim();
    this.cnpj = cnpj;
    this.tipoComercio = tipoComercio;

    this.licenca = {
      plano: licenca.plano || 'pro', // 'starter', 'pro', 'enterprise'
      status: licenca.status || 'ativo', // 'trial', 'ativo', 'inadimplente', 'bloqueado'
      criadoEm: licenca.criadoEm || new Date().toISOString(),
      expiraEm: licenca.expiraEm || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      bloqueioRemoto: Boolean(licenca.bloqueioRemoto),
      motivoBloqueio: licenca.motivoBloqueio || null
    };

    this.permissoesModulos = {
      permiteMesas: permissoesModulos.permiteMesas !== undefined ? Boolean(permissoesModulos.permiteMesas) : true,
      permiteBiometria: permissoesModulos.permiteBiometria !== undefined ? Boolean(permissoesModulos.permiteBiometria) : true,
      permiteExportacaoXlsx: permissoesModulos.permiteExportacaoXlsx !== undefined ? Boolean(permissoesModulos.permiteExportacaoXlsx) : true,
      permiteEscPosTermica: permissoesModulos.permiteEscPosTermica !== undefined ? Boolean(permissoesModulos.permiteEscPosTermica) : false,
      limiteProdutos: Number(permissoesModulos.limiteProdutos) || 1000,
      limiteUsuarios: Number(permissoesModulos.limiteUsuarios) || 10
    };

    this.politicaVersao = {
      versaoMinima: politicaVersao.versaoMinima || null, // sem política até a governança definir
      bloquearLegado: Boolean(politicaVersao.bloquearLegado)
    };

    this.metricasCompliance = {
      ultimoAcessoEm: metricasCompliance.ultimoAcessoEm || new Date().toISOString(),
      ultimoBackupEm: metricasCompliance.ultimoBackupEm || null,
      versaoCliente: metricasCompliance.versaoCliente || null
    };
  }

  alternarKillSwitch(bloquear, motivo = 'Suspensão de Governança Systekna') {
    this.licenca.bloqueioRemoto = Boolean(bloquear);
    this.licenca.motivoBloqueio = bloquear ? motivo : null;
    if (bloquear) {
      this.licenca.status = 'bloqueado';
    } else {
      this.licenca.status = 'ativo';
    }
  }

  atualizarModulos(novosModulos = {}) {
    this.permissoesModulos = {
      ...this.permissoesModulos,
      ...novosModulos
    };
  }

  atualizarPlano(plano) {
    if (['starter', 'pro', 'enterprise'].includes(plano)) {
      this.licenca.plano = plano;
      if (plano === 'starter') {
        this.permissoesModulos.limiteProdutos = 50;
        this.permissoesModulos.limiteUsuarios = 2;
        this.permissoesModulos.permiteExportacaoXlsx = false;
      } else if (plano === 'pro') {
        this.permissoesModulos.limiteProdutos = 1000;
        this.permissoesModulos.limiteUsuarios = 10;
        this.permissoesModulos.permiteExportacaoXlsx = true;
      } else if (plano === 'enterprise') {
        this.permissoesModulos.limiteProdutos = 100000;
        this.permissoesModulos.limiteUsuarios = 100;
        this.permissoesModulos.permiteEscPosTermica = true;
        this.permissoesModulos.permiteExportacaoXlsx = true;
      }
    }
  }

  toJSON() {
    return {
      id: this.id,
      usuario: this.usuario,
      nomeComercio: this.nomeComercio,
      cnpj: this.cnpj,
      tipoComercio: this.tipoComercio,
      licenca: this.licenca,
      permissoesModulos: this.permissoesModulos,
      politicaVersao: this.politicaVersao,
      metricasCompliance: this.metricasCompliance
    };
  }
}
