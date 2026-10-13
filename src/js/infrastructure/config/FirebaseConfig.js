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

export class FirebaseConfigProvider {
  static getConfig() {
    try {
      const custom = localStorage.getItem('systekna_firebase_config');
      if (custom) {
        return { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(custom) };
      }
    } catch (_) {}
    return DEFAULT_FIREBASE_CONFIG;
  }

  static setCustomConfig(cfg) {
    localStorage.setItem('systekna_firebase_config', JSON.stringify(cfg));
  }

  static resetConfig() {
    localStorage.removeItem('systekna_firebase_config');
  }
}
