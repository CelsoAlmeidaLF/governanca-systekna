/**
 * Entidade de Domínio: Feedback
 * Representa avaliações, relatos de problemas e sugestões do ecossistema.
 */
export class Feedback {
  constructor({
    id = crypto.randomUUID ? crypto.randomUUID() : `fb-${Date.now()}`,
    app = 'BARGESTAO',
    tipo = 'sugestao',
    nota = 5,
    mensagem = '',
    usuario = 'anonimo',
    email = '',
    estabelecimento = '',
    status = 'novo',
    lida = false,
    criadoEm = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.app = String(app).toUpperCase();
    this.tipo = ['sugestao', 'problema', 'elogio', 'duvida'].includes(tipo) ? tipo : 'sugestao';
    this.nota = Number.isInteger(Number(nota)) && Number(nota) >= 1 && Number(nota) <= 5 ? Number(nota) : 5;
    this.mensagem = String(mensagem || '').trim();
    this.usuario = String(usuario || 'anonimo').trim();
    this.email = String(email || '').trim();
    this.estabelecimento = String(estabelecimento || '').trim();
    this.status = status;
    this.lida = Boolean(lida || status === 'lido' || status === 'respondido');
    this.criadoEm = criadoEm instanceof Date ? criadoEm.toISOString() : String(criadoEm);
  }

  isValido() {
    return this.mensagem.length > 0 && this.nota >= 1 && this.nota <= 5;
  }

  hasEmailValido() {
    return typeof this.email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.email);
  }

  gerarLinkResposta() {
    if (!this.hasEmailValido()) return null;
    const assunto = encodeURIComponent(`[Systekna Governança] Resposta ao Feedback - ${this.app}`);
    const corpo = encodeURIComponent(`Olá,\n\nRecebemos sua mensagem sobre o sistema ${this.app}:\n"${this.mensagem}"\n\nAgradecemos seu contato.\n\nAtenciosamente,\nEngenharia e Governança Systekna`);
    return `mailto:${this.email}?subject=${assunto}&body=${corpo}`;
  }

  marcarComoLida(lida = true) {
    this.lida = Boolean(lida);
    this.status = this.lida ? 'lido' : 'novo';
  }

  toJSON() {
    return {
      id: this.id,
      app: this.app,
      tipo: this.tipo,
      nota: this.nota,
      mensagem: this.mensagem,
      usuario: this.usuario,
      email: this.email,
      estabelecimento: this.estabelecimento,
      status: this.status,
      lida: this.lida,
      criadoEm: this.criadoEm
    };
  }
}
