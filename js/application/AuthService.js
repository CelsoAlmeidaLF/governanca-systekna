/**
 * Application Service: AuthService
 * Orquestra o fluxo de autenticação e proteção de sessão da Governança.
 */
export class AuthService {
  constructor(authAdapter) {
    this._authAdapter = authAdapter;
    this._currentUser = null;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    const user = await this._authAdapter.signInWithEmail(email, password);
    this._currentUser = user;
    return user;
  }

  async logout() {
    await this._authAdapter.signOut();
    this._currentUser = null;
  }

  async solicitarRecuperacaoSenha(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Informe um e-mail válido para recuperação de senha.');
    }
    return await this._authAdapter.sendPasswordReset(email);
  }

  observarEstadoAutenticacao(callback) {
    return this._authAdapter.onAuthStateChanged((user) => {
      this._currentUser = user;
      callback(user);
    });
  }

  getCurrentUser() {
    return this._currentUser || this._authAdapter.getCurrentUser();
  }

  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  }
}
