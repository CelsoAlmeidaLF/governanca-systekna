/**
 * Entidade de Domínio: SystemError
 * Representa relatórios técnicos de erro e falhas em tempo real (Crash Reporting).
 */
export class SystemError {
  constructor({
    id = crypto.randomUUID ? crypto.randomUUID() : `err-${Date.now()}`,
    app = 'BARGESTAO',
    versao = 'v9.3-standard',
    modulo = 'geral',
    mensagem = '',
    stackTrace = '',
    origem = '',
    tipo = 'erro',
    usuario = 'anonimo',
    uid = '',
    ambiente = {},
    resolvido = false,
    criadoEm = new Date().toISOString()
  } = {}) {
    this.id = id;
    this.app = String(app).toUpperCase();
    this.versao = String(versao);
    this.modulo = String(modulo);
    this.mensagem = String(mensagem);
    this.stackTrace = String(stackTrace);
    this.origem = String(origem);
    this.tipo = tipo;
    this.usuario = String(usuario);
    this.uid = /^[0-9a-f]{32}$/.test(String(uid || '')) ? String(uid) : '';
    this.ambiente = typeof ambiente === 'object' && ambiente !== null ? ambiente : {};
    this.resolvido = Boolean(resolvido);
    this.criadoEm = criadoEm instanceof Date ? criadoEm.toISOString() : String(criadoEm);
    this.assinatura = this.gerarAssinatura();
  }

  gerarAssinatura() {
    const limpo = this.mensagem.replace(/[0-9a-f]{8,}/gi, '').trim().slice(0, 100);
    return `${this.app}::${this.modulo}::${limpo}`;
  }

  gerarLinkGitHubIssue(reposMap = {}) {
    const repos = {
      BARGESTAO: 'CelsoAlmeidaLF/multi-cm',
      CAMBIO: 'CelsoAlmeidaLF/cambio-sim',
      CRIPTO: 'CelsoAlmeidaLF/cripto-sim',
      LIVROCAIXA: 'CelsoAlmeidaLF/gerenc-fin',
      TAXOMETRO: 'CelsoAlmeidaLF/taxometro',
      INVEST: 'CelsoAlmeidaLF/invest-sim',
      IDENTIDADE: 'CelsoAlmeidaLF/identidade-systekna',
      ...reposMap
    };

    const repo = repos[this.app] || 'CelsoAlmeidaLF/multi-cm';
    const titulo = encodeURIComponent(`[BUG Telemetria ${this.app} ${this.versao}] ${this.mensagem.slice(0, 80)}`);
    const corpo = encodeURIComponent(`### Relatório de Falha Sanitizado (Governança Systekna)

- **Aplicação:** \`${this.app}\`
- **Versão:** \`${this.versao}\`
- **Módulo:** \`${this.modulo}\`
- **Usuário:** \`${this.usuario}\`${this.uid ? ` (UID \`${this.uid}\`)` : ''}
- **Data da Ocorrência:** \`${this.criadoEm}\`

#### Mensagem de Erro:
\`\`\`
${this.mensagem}
\`\`\`

#### Stack Trace:
\`\`\`
${this.stackTrace || 'Sem stack trace registrado'}
\`\`\`

#### Ambiente do Cliente:
- **User Agent:** \`${this.ambiente.userAgent || 'N/A'}\`
- **Online:** \`${this.ambiente.online !== false}\`
- **Viewport:** \`${this.ambiente.viewport || 'N/A'}\`

*Gerado automaticamente pelo Painel de Governança Systekna.*`);

    return `https://github.com/${repo}/issues/new?title=${titulo}&body=${corpo}`;
  }

  marcarResolvido(resolvido = true) {
    this.resolvido = Boolean(resolvido);
  }

  toJSON() {
    return {
      id: this.id,
      app: this.app,
      versao: this.versao,
      modulo: this.modulo,
      mensagem: this.mensagem,
      stackTrace: this.stackTrace,
      origem: this.origem,
      tipo: this.tipo,
      usuario: this.usuario,
      uid: this.uid,
      ambiente: this.ambiente,
      resolvido: this.resolvido,
      criadoEm: this.criadoEm,
      assinatura: this.assinatura
    };
  }
}
