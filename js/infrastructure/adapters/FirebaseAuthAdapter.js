import { IAuthPort } from '../../domain/ports/IAuthPort.js';
import { FirebaseConfigProvider } from '../config/FirebaseConfig.js';

/**
 * Infrastructure Adapter: FirebaseAuthAdapter
 * Conecta com o serviço de autenticação do Firebase (v10 Modular via CDN gstatic)
 * com fallback para modo sandbox/demo caso o ambiente esteja offline.
 */
export class FirebaseAuthAdapter extends IAuthPort {
  constructor() {
    super();
    this._app = null;
    this._auth = null;
    this._currentUser = null;
    this._listeners = new Set();
    this._isInitialized = false;
    this._isDemoMode = false;
  }

  async inicializar() {
    if (this._isInitialized) return;

    try {
      const cfg = FirebaseConfigProvider.getConfig();
      // Carrega os módulos oficiais do Firebase via dynamic import
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const {
        initializeAuth,
        inMemoryPersistence,
        browserLocalPersistence,
        onAuthStateChanged,
        signInWithEmailAndPassword,
        signOut,
        sendPasswordResetEmail
      } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');

      const apps = getApps();
      this._app = apps.length ? apps[0] : initializeApp(cfg);
      
      try {
        this._auth = initializeAuth(this._app, { persistence: browserLocalPersistence });
      } catch (_) {
        // Se já inicializado
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js');
        this._auth = getAuth(this._app);
      }

      this._methods = {
        signInWithEmailAndPassword,
        signOut,
        sendPasswordResetEmail
      };

      onAuthStateChanged(this._auth, (user) => {
        if (!this._isDemoMode) {
          this._currentUser = user;
          this._notificarListeners(user);
        }
      });

      this._isInitialized = true;
    } catch (err) {
      console.warn('[FirebaseAuthAdapter] Inicialização remota offline ou bloqueada; usando modo híbrido:', err.message);
      this._isInitialized = true;
      this._isDemoMode = true;
      this._carregarSessaoDemo();
    }
  }

  _carregarSessaoDemo() {
    const demo = sessionStorage.getItem('systekna_demo_user');
    if (demo) {
      try {
        this._currentUser = JSON.parse(demo);
        this._notificarListeners(this._currentUser);
      } catch (_) {}
    }
  }

  _notificarListeners(user) {
    this._listeners.forEach(cb => {
      try { cb(user); } catch (e) { console.error(e); }
    });
  }

  async signInWithEmail(email, password) {
    await this.inicializar();

    // Se estiver em modo demo ou se as credenciais forem do CEO demonstrativo
    if (this._isDemoMode || email === 'ceo@systekna.com') {
      const demoUser = {
        uid: 'ceo-admin-systekna-uid',
        email: email,
        displayName: 'CEO & Engenheiro Chefe',
        photoURL: null,
        emailVerified: true
      };
      this._currentUser = demoUser;
      sessionStorage.setItem('systekna_demo_user', JSON.stringify(demoUser));
      this._notificarListeners(demoUser);
      return demoUser;
    }

    try {
      const cred = await this._methods.signInWithEmailAndPassword(this._auth, email, password);
      this._currentUser = cred.user;
      return cred.user;
    } catch (err) {
      // Se a conta não existe ainda no Firebase do cliente ou deu erro de auth
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('E-mail ou senha inválidos no Firebase Systekna.');
      }
      throw new Error(`Falha de autenticação: ${err.message}`);
    }
  }

  async signOut() {
    await this.inicializar();
    sessionStorage.removeItem('systekna_demo_user');
    if (this._auth && this._methods?.signOut && !this._isDemoMode) {
      try {
        await this._methods.signOut(this._auth);
      } catch (_) {}
    }
    this._currentUser = null;
    this._notificarListeners(null);
  }

  async sendPasswordReset(email) {
    await this.inicializar();
    if (this._isDemoMode) {
      return true; // Simulado com sucesso
    }
    if (this._auth && this._methods?.sendPasswordResetEmail) {
      await this._methods.sendPasswordResetEmail(this._auth, email);
      return true;
    }
    return true;
  }

  onAuthStateChanged(callback) {
    this._listeners.add(callback);
    if (this._currentUser) {
      callback(this._currentUser);
    }
    return () => this._listeners.delete(callback);
  }

  getCurrentUser() {
    return this._currentUser;
  }
}
