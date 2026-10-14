// Teto por listagem: coleções de criação pública podem crescer por abuso; o painel mostra os mais recentes
export const LIMITE_LISTAGEM = 300;

/**
 * Infrastructure Adapter: FirestoreGovernanceAdapter
 * Implementa as 4 portas de dados (Feedback, Erros, Governança de Usuários e Notícias Devs)
 * sobre o Firebase Firestore (SDK Modular).
 *
 * Política (fail-closed):
 * - O Firestore é a única fonte de verdade. Não há fallback local nem dados de exemplo.
 * - Toda escrita é confirmada pelo servidor antes de a UI ser notificada; falhas são propagadas
 *   ao chamador para que o operador veja o erro (nada de "sucesso falso").
 * - Autorização é aplicada pelas regras em `firestore.rules` (função gestor(): conta dona ou claim `admin`).
 */
export class FirestoreGovernanceAdapter {
  /**
   * @param {{ db?: object, fs?: object }} deps banco e módulo do SDK do Firestore, vindos de
   *   infrastructure/config/FirebaseApp.js (mesmo app do login: App Check + Auth só na memória).
   */
  constructor({ db = null, fs = null } = {}) {
    this._db = db;
    this._fs = fs;
    this._listeners = new Set();
  }

  async inicializar() {
    if (!this._db || !this._fs) throw new Error('Banco de governança indisponível.');
  }

  async _fsApi() {
    await this.inicializar();
    return this._fs;
  }

  async _escrever(descricao, operacao) {
    const fs = await this._fsApi();
    try {
      await operacao(fs);
    } catch (err) {
      const motivo = err?.code === 'permission-denied'
        ? 'permissão negada pelas regras do Firestore'
        : (err?.message || 'erro desconhecido');
      throw new Error(`Falha ao ${descricao}: ${motivo}.`);
    }
    this._notificar();
  }

  async _listar(colecao, ordenarPor = null) {
    const fs = await this._fsApi();
    const ref = fs.collection(this._db, colecao);
    const q = ordenarPor
      ? fs.query(ref, fs.orderBy(ordenarPor, 'desc'), fs.limit(LIMITE_LISTAGEM))
      : fs.query(ref, fs.limit(LIMITE_LISTAGEM));
    // Sempre do servidor: sem conexão, falha explicitamente em vez de exibir cache vazio/antigo
    const snap = await fs.getDocsFromServer(q);
    return snap.docs.map(d => ({ data: d.data(), id: d.id }));
  }

  /**
   * Confirma no servidor que a conta conectada governa (regra gestor()).
   * Lê 1 documento de uma coleção que só o gestor lista; recusa → erro com code 'permission-denied'.
   * O painel só aparece depois disto (mesmo princípio do painel de feedback: quem decide é o Firestore).
   */
  async conferirAcesso() {
    const fs = await this._fsApi();
    await fs.getDocsFromServer(fs.query(fs.collection(this._db, 'solicitacoes_governanca'), fs.limit(1)));
  }

  static _iso(valor) {
    if (valor?.toDate) return valor.toDate().toISOString();
    return valor || null;
  }

  // ==========================================
  // FEEDBACKS
  // ==========================================
  async listarFeedbacks() {
    const docs = await this._listar('feedbacks_usuarios', 'enviadoEm');
    return docs.map(({ id, data: d }) => ({
      id,
      app: d.app || 'BARGESTAO',
      tipo: d.tipo || 'sugestao',
      nota: d.nota || d.avaliacao || 5,
      mensagem: d.mensagem || d.texto || '',
      usuario: d.usuario || 'anonimo',
      email: d.email || '',
      estabelecimento: d.estabelecimento || '',
      status: d.status || (d.lida ? 'lido' : 'novo'),
      lida: Boolean(d.lida || d.status === 'lido'),
      criadoEm: FirestoreGovernanceAdapter._iso(d.enviadoEm) || d.criadoEm || new Date().toISOString()
    }));
  }

  async marcarComoLido(id, lido = true) {
    await this._escrever('atualizar o feedback', (fs) =>
      fs.updateDoc(fs.doc(this._db, 'feedbacks_usuarios', id), { lida: Boolean(lido), status: lido ? 'lido' : 'novo' })
    );
    return true;
  }

  async excluirFeedback(id) {
    await this._escrever('excluir o feedback', (fs) =>
      fs.deleteDoc(fs.doc(this._db, 'feedbacks_usuarios', id))
    );
    return true;
  }

  // ==========================================
  // ERROS / TELEMETRIA
  // ==========================================
  async listarErros() {
    const docs = await this._listar('telemetria_erros', 'dataOcorrencia');
    return docs.map(({ id, data: d }) => ({
      id,
      app: d.app || 'BARGESTAO',
      versao: d.versaoApp || d.versao || '9.3.0',
      modulo: d.modulo || 'geral',
      mensagem: d.mensagem || '',
      stackTrace: d.stackTrace || d.stack || '',
      origem: d.origem || '',
      tipo: d.tipo || 'erro',
      usuario: d.usuario || 'anonimo',
      ambiente: d.ambiente || {},
      resolvido: Boolean(d.resolvido),
      criadoEm: FirestoreGovernanceAdapter._iso(d.dataOcorrencia) || d.criadoEm || new Date().toISOString()
    }));
  }

  async marcarResolvido(id, resolvido = true) {
    await this._escrever('atualizar o status do erro', (fs) =>
      fs.updateDoc(fs.doc(this._db, 'telemetria_erros', id), { resolvido: Boolean(resolvido) })
    );
    return true;
  }

  async excluirErro(id) {
    await this._escrever('excluir o registro de erro', (fs) =>
      fs.deleteDoc(fs.doc(this._db, 'telemetria_erros', id))
    );
    return true;
  }

  // ==========================================
  // SOLICITAÇÕES DE GOVERNANÇA & TENANTS
  // ==========================================
  async listarSolicitacoes() {
    const docs = await this._listar('solicitacoes_governanca', 'solicitadoEm');
    return docs.map(({ id, data: d }) => ({
      ...d,
      id,
      solicitadoEm: FirestoreGovernanceAdapter._iso(d.solicitadoEm),
      aprovadoEm: FirestoreGovernanceAdapter._iso(d.aprovadoEm)
    }));
  }

  async atualizarStatusSolicitacao(id, dadosDecisao) {
    // O id é a chave do documento; não é regravado como campo
    const { id: _ignorado, ...dados } = dadosDecisao || {};
    await this._escrever('registrar a decisão da solicitação', (fs) =>
      fs.setDoc(fs.doc(this._db, 'solicitacoes_governanca', id), dados, { merge: true })
    );
    return true;
  }

  async listarTenants() {
    const docs = await this._listar('tenants_governanca');
    return docs.map(({ id, data: d }) => ({ ...d, id }));
  }

  async salvarTenant(tenantData) {
    const { id, ...dados } = tenantData || {};
    if (!id) throw new Error('Tenant sem identificador; não é possível salvar.');
    await this._escrever('salvar o tenant', (fs) =>
      fs.setDoc(fs.doc(this._db, 'tenants_governanca', id), dados, { merge: true })
    );
    return true;
  }

  async alternarKillSwitch(tenantId, bloquear, motivo = 'Suspensão de Governança Systekna') {
    await this._escrever(bloquear ? 'ativar o kill-switch' : 'desbloquear o terminal', (fs) =>
      // setDoc com merge: funciona mesmo se o tenant ainda não existir (o bloqueio nunca falha por NOT_FOUND)
      fs.setDoc(fs.doc(this._db, 'tenants_governanca', tenantId), {
        licenca: {
          bloqueioRemoto: Boolean(bloquear),
          status: bloquear ? 'bloqueado' : 'ativo',
          motivoBloqueio: bloquear ? motivo : null
        }
      }, { merge: true })
    );
    return true;
  }

  // ==========================================
  // NOTÍCIAS PARA DESENVOLVEDORES
  // ==========================================
  async listarNoticias() {
    const docs = await this._listar('noticias_devs', 'criadoEm');
    return docs.map(({ id, data: d }) => ({ ...d, id }));
  }

  async publicarNoticia(noticia) {
    await this._escrever('publicar a notícia', (fs) =>
      fs.setDoc(fs.doc(this._db, 'noticias_devs', noticia.id), noticia)
    );
    return noticia;
  }

  async excluirNoticia(id) {
    await this._escrever('excluir a notícia', (fs) =>
      fs.deleteDoc(fs.doc(this._db, 'noticias_devs', id))
    );
    return true;
  }

  // ==========================================
  // INSCRIÇÃO REATIVA (REALTIME / EVENTOS)
  // ==========================================
  inscreverAtualizacoes(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  _notificar() {
    this._listeners.forEach(cb => {
      try { cb(); } catch (e) { console.error(e); }
    });
  }
}
