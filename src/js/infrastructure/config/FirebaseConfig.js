/**
 * Configuração de Infraestrutura: FirebaseConfig
 * Define a conexão com o projeto Firebase da Systekna (systekna-feedback)
 * com suporte a sobrescrita dinâmica para múltiplos ambientes (Sandbox, Homologação, Produção).
 */

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCQx8kJyXEReASiQMI4a5bT5NNWgtBmJpM',
  authDomain: 'systekna-feedback.firebaseapp.com',
  projectId: 'systekna-feedback',
  storageBucket: 'systekna-feedback.appspot.com',
  messagingSenderId: '870927975015',
  appId: '1:870927975015:web:0576bd5e3cdd8d067d8ac2'
};

const HOSTS_SANDBOX = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * A sobrescrita via localStorage só vale em ambiente local (Sandbox do desenvolvedor).
 * Em produção, um valor injetado no localStorage (ex.: via XSS ou extensão) não pode
 * redirecionar o painel para outro projeto Firebase.
 */
function permiteSobrescrita() {
  try {
    return HOSTS_SANDBOX.has(globalThis.location?.hostname);
  } catch (_) {
    return false;
  }
}

export class FirebaseConfigProvider {
  static getConfig() {
    if (permiteSobrescrita()) {
      try {
        const custom = localStorage.getItem('systekna_firebase_config');
        if (custom) {
          return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(custom) };
        }
      } catch (_) {}
    }
    return DEFAULT_FIREBASE_CONFIG;
  }

  static setCustomConfig(cfg) {
    if (!permiteSobrescrita()) {
      throw new Error('Configuração customizada do Firebase só é permitida em ambiente local.');
    }
    localStorage.setItem('systekna_firebase_config', JSON.stringify(cfg));
  }

  static resetConfig() {
    localStorage.removeItem('systekna_firebase_config');
  }
}
