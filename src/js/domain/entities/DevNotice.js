/**
 * Entidade de Domínio: DevNotice
 * Modela comunicados técnicos, changelogs e notícias direcionadas aos desenvolvedores do ecossistema Systekna.
 */
export class DevNotice {
  constructor({
    id = crypto.randomUUID ? crypto.randomUUID() : `noticia-${Date.now()}`,
    titulo = '',
    categoria = 'arquitetura', // 'arquitetura' | 'release' | 'seguranca' | 'cloud' | 'governanca'
    prioridade = 'info', // 'info' | 'warning' | 'critical'
    resumo = '',
    conteudo = '',
    autor = 'CEO & Engenheiro Chefe',
    tags = [],
    ativo = true,
    criadoEm = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.titulo = String(titulo).trim();
    this.categoria = ['arquitetura', 'release', 'seguranca', 'cloud', 'governanca'].includes(categoria) ? categoria : 'arquitetura';
    this.prioridade = ['info', 'warning', 'critical'].includes(prioridade) ? prioridade : 'info';
    this.resumo = String(resumo || '').trim();
    this.conteudo = String(conteudo || '').trim();
    this.autor = String(autor || 'CEO & Engenheiro Chefe').trim();
    this.tags = Array.isArray(tags) ? tags.map(t => String(t).trim()).filter(Boolean) : [];
    this.ativo = Boolean(ativo);
    this.criadoEm = criadoEm instanceof Date ? criadoEm.toISOString() : String(criadoEm);
  }

  isValido() {
    return this.titulo.length > 3 && this.conteudo.length > 5;
  }

  getRotuloCategoria() {
    const rotulos = {
      arquitetura: '🏛️ Arquitetura & ADR',
      release: '🚀 Release / Versão',
      seguranca: '🛡️ Segurança & Hardening',
      cloud: '☁️ Infraestrutura & Firebase',
      governanca: '⚖️ Diretrizes de Governança'
    };
    return rotulos[this.categoria] || this.categoria;
  }

  getBadgeClasse() {
    const badges = {
      info: 'badge-info',
      warning: 'badge-warn',
      critical: 'badge-crit'
    };
    return badges[this.prioridade] || 'badge-info';
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      categoria: this.categoria,
      prioridade: this.prioridade,
      resumo: this.resumo,
      conteudo: this.conteudo,
      autor: this.autor,
      tags: this.tags,
      ativo: this.ativo,
      criadoEm: this.criadoEm
    };
  }
}
