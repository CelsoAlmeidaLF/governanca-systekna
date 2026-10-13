/**
 * Entidade de Domínio: UserRegistration
 * Modela a solicitação de homologação de novos estabelecimentos e gestores no ecossistema BarGestão.
 * Em estrita conformidade com 12_PLANEJAMENTO_GOVERNANCA_FIREBASE.md:
 * - CNPJ é estritamente opcional (se nulo, opera em modo balcão / sem CNPJ)
 * - permiteMesas é a chave soberana de autorização para o módulo de comandas de mesa
 */
export class UserRegistration {
  constructor({
    id = crypto.randomUUID ? crypto.randomUUID() : `solic-${Date.now()}`,
    usuario = '',
    cnpj = null,
    nomeEstabelecimento = '',
    tipoComercio = 'bar',
    status = 'pendente', // 'pendente' | 'aprovado' | 'reprovado' | 'bloqueado'
    permiteMesas = true, // Flag de autorização de governança
    solicitadoEm = new Date().toISOString(),
    aprovadoEm = null,
    aprovadoPor = null,
    motivoDecisao = ''
  } = {}) {
    this.id = id;
    this.usuario = String(usuario).trim();
    this.cnpj = this._sanitizarCnpj(cnpj);
    this.nomeEstabelecimento = String(nomeEstabelecimento || '').trim();
    this.tipoComercio = tipoComercio;
    this.status = ['pendente', 'aprovado', 'reprovado', 'bloqueado'].includes(status) ? status : 'pendente';
    this.permiteMesas = Boolean(permiteMesas);
    this.solicitadoEm = solicitadoEm instanceof Date ? solicitadoEm.toISOString() : String(solicitadoEm);
    this.aprovadoEm = aprovadoEm ? (aprovadoEm instanceof Date ? aprovadoEm.toISOString() : String(aprovadoEm)) : null;
    this.aprovadoPor = aprovadoPor ? String(aprovadoPor) : null;
    this.motivoDecisao = String(motivoDecisao || '');
  }

  _sanitizarCnpj(val) {
    if (!val) return null;
    const digitos = String(val).replace(/\D/g, '');
    return digitos.length === 14 ? digitos : null;
  }

  getCnpjFormatado() {
    if (!this.cnpj) return 'Não informado (Balcão / Opcional)';
    return this.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  }

  getRotuloTipoComercio() {
    const tipos = {
      bar: 'Barzinho / Restaurante / Pub (Salão)',
      loja_salgados: 'Loja de Salgados / Pastelaria (Balcão Puro)',
      lanchonete: 'Lanchonete / Fast Food',
      adega: 'Adega / Distribuidora de Bebidas',
      outro: 'Outro Estabelecimento'
    };
    return tipos[this.tipoComercio] || this.tipoComercio;
  }

  aprovar({ aprovador = 'CEO / Engenharia Systekna', permiteMesas = true, motivo = 'Homologado pela Governança' } = {}) {
    this.status = 'aprovado';
    this.permiteMesas = Boolean(permiteMesas);
    this.aprovadoEm = new Date().toISOString();
    this.aprovadoPor = aprovador;
    this.motivoDecisao = motivo;
  }

  reprovar({ aprovador = 'CEO / Engenharia Systekna', motivo = 'Documentação incompleta ou perfil não aderente' } = {}) {
    this.status = 'reprovado';
    this.aprovadoEm = new Date().toISOString();
    this.aprovadoPor = aprovador;
    this.motivoDecisao = motivo;
  }

  bloquear({ aprovador = 'CEO / Engenharia Systekna', motivo = 'Suspensão de governança' } = {}) {
    this.status = 'bloqueado';
    this.aprovadoEm = new Date().toISOString();
    this.aprovadoPor = aprovador;
    this.motivoDecisao = motivo;
  }

  toJSON() {
    return {
      id: this.id,
      usuario: this.usuario,
      cnpj: this.cnpj,
      nomeEstabelecimento: this.nomeEstabelecimento,
      tipoComercio: this.tipoComercio,
      status: this.status,
      permiteMesas: this.permiteMesas,
      solicitadoEm: this.solicitadoEm,
      aprovadoEm: this.aprovadoEm,
      aprovadoPor: this.aprovadoPor,
      motivoDecisao: this.motivoDecisao
    };
  }
}
