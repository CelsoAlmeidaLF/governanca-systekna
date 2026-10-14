import { IAuthPort } from '../../domain/ports/IAuthPort.js';

/**
 * Infrastructure Adapter: FirebaseAuthAdapter
 * Login por e-mail e senha no Firebase Auth, no mesmo modelo do painel de feedback:
 * - a sessão fica só na memória (FirebaseApp.js); quem reabre o painel é o cofre (PIN FINANC/biometria);
 * - este adaptador só autentica. Quem decide se a conta governa é o Firestore (regra gestor()),
 *   conferido pelo controlador antes de abrir o painel. Esconder a interface não é o controle de segurança.
 */
const ERROS = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos ou redefina a senha.',
  'auth/network-request-failed': 'Sem conexão. Tente de novo.',
  'auth/weak-password': 'O Firebase recusou a nova senha por ser fraca.'
};

export function traduzirErroAuth(err, padrao = 'Não foi possível entrar. Tente de novo.') {
  const e = new Error(ERROS[err?.code] || padrao);
  e.code = err?.code;
  return e;
}

export class FirebaseAuthAdapter extends IAuthPort {
  /**
   * @param {{ auth?: object, sdk?: object }} deps instância do Auth e módulo do SDK, vindos de
   *   infrastructure/config/FirebaseApp.js. Sem eles, todo login falha (fail-closed).
   */
  constructor({ auth = null, sdk = null } = {}) {
    super();
    this._auth = auth;
    this._sdk = sdk;
    this._listeners = new Set();
    this._parar = null;
  }

  _garantir() {
    if (!this._auth || !this._sdk) throw new Error('Serviço de autenticação indisponível. Verifique a conexão e tente de novo.');
  }

  /** Começa a ouvir o login. Chamado só depois do desbloqueio do cofre. */
  inicializar() {
    this._garantir();
    if (!this._parar) {
      this._parar = this._sdk.onAuthStateChanged(this._auth, (user) => {
        this._listeners.forEach((cb) => { try { cb(user || null); } catch (e) { console.error(e); } });
      });
    }
    return Promise.resolve();
  }

  async signInWithEmail(email, password) {
    this._garantir();
    try {
      const cred = await this._sdk.signInWithEmailAndPassword(this._auth, email, password);
      return cred.user;
    } catch (err) {
      throw traduzirErroAuth(err);
    }
  }

  async signOut() {
    if (!this._auth || !this._sdk) return;
    try { await this._sdk.signOut(this._auth); } catch (_) {}
  }

  async sendPasswordReset(email) {
    this._garantir();
    try {
      await this._sdk.sendPasswordResetEmail(this._auth, email);
    } catch (_) {
      // Não revela se a conta existe (evita enumeração de contas)
    }
    return true;
  }

  async changePassword(currentPassword, newPassword) {
    this._garantir();
    const user = this._auth.currentUser;
    if (!user) throw new Error('A sessão terminou. Entre de novo.');
    try {
      await this._sdk.reauthenticateWithCredential(user, this._sdk.EmailAuthProvider.credential(user.email, currentPassword));
      await this._sdk.updatePassword(user, newPassword);
    } catch (err) {
      throw traduzirErroAuth(err, 'Não foi possível trocar a senha.');
    }
  }

  onAuthStateChanged(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  getCurrentUser() {
    return this._auth ? this._auth.currentUser : null;
  }
}
