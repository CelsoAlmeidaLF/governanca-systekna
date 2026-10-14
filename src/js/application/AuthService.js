/**
 * Application Service: AuthService
 * Orquestra o login da Governança: entrar, sair, redefinir e trocar a senha.
 * Guardar e-mail e senha é tarefa do cofre (ui/controllers/ContaPainelController.js), nunca do localStorage.
 */
import { emailValido, problemaSenhaNova } from '../domain/ContaCofre.js';

export class AuthService {
  constructor(authAdapter) {
    this._authAdapter = authAdapter;
  }

  async login(email, password) {
    if (!email || !password) {
      throw new Error('E-mail e senha são obrigatórios.');
    }
    return await this._authAdapter.signInWithEmail(email, password);
  }

  async logout() {
    await this._authAdapter.signOut();
  }

  async solicitarRecuperacaoSenha(email) {
    if (!emailValido(email)) {
      throw new Error('Digite seu e-mail acima e toque de novo em "Esqueci a senha".');
    }
    return await this._authAdapter.sendPasswordReset(email);
  }

  async trocarSenha(atual, nova, repetida) {
    const problema = !atual ? 'Digite a senha atual.' : problemaSenhaNova(nova, repetida, atual);
    if (problema) throw new Error(problema);
    await this._authAdapter.changePassword(atual, nova);
  }

  observarEstadoAutenticacao(callback) {
    return this._authAdapter.onAuthStateChanged(callback);
  }

  getCurrentUser() {
    return this._authAdapter.getCurrentUser();
  }

  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  }
}
