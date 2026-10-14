/**
 * Driving/Driven Port: IAuthPort
 * Contrato abstrato para autenticação de administradores da Governança.
 */
export class IAuthPort {
  async signInWithEmail(email, password) {
    throw new Error('Método signInWithEmail não implementado');
  }

  async createUserWithEmail(email, password, displayName) {
    throw new Error('Método createUserWithEmail não implementado');
  }

  async signOut() {
    throw new Error('Método signOut não implementado');
  }

  async sendPasswordReset(email) {
    throw new Error('Método sendPasswordReset não implementado');
  }

  onAuthStateChanged(callback) {
    throw new Error('Método onAuthStateChanged não implementado');
  }

  getCurrentUser() {
    throw new Error('Método getCurrentUser não implementado');
  }
}
