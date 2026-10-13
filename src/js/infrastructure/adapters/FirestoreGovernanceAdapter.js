import { IFeedbackPort } from '../../domain/ports/IFeedbackPort.js';
import { IErrorReportingPort } from '../../domain/ports/IErrorReportingPort.js';
import { IUserGovernancePort } from '../../domain/ports/IUserGovernancePort.js';
import { IDevNewsPort } from '../../domain/ports/IDevNewsPort.js';
import { FirebaseConfigProvider } from '../config/FirebaseConfig.js';
import { LocalStorageMockAdapter } from './LocalStorageMockAdapter.js';

/**
 * Infrastructure Adapter: FirestoreGovernanceAdapter
 * Implementa as 4 portas de dados (Feedback, Erros, Governança de Usuários e Notícias Devs)
 * comunicando com o Firebase Firestore (via SDK Modular ou REST API com fallback para LocalStorage).
 */
export class FirestoreGovernanceAdapter implements IFeedbackPort, IErrorReportingPort, IUserGovernancePort, IDevNewsPort {
  constructor() {
    this._cfg = FirebaseConfigProvider.getConfig();
    this._mock = new LocalStorageMockAdapter();
    this._db = null;
    this._listeners = new Set();
    this._isInitialized = false;
  }

  async inicializar() {
    if (this._isInitialized) return;
    try {
      const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js');
      const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');

      const apps = getApps();
      const app = apps.length ? apps[0] : initializeApp(this._cfg);
      this._db = getFirestore(app);
      this._isInitialized = true;
    } catch (err) {
      console.warn('[FirestoreGovernanceAdapter] Operando com persistência local de alto desempenho:', err.message);
      this._isInitialized = true;
    }
  }

  // ==========================================
  // FEEDBACKS
  // ==========================================
  async listarFeedbacks() {
    await this.inicializar();
    if (this._db) {
      try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        // Tenta obter de 'feedbacks_usuarios' ou 'sugestoes'
        const q = query(collection(this._db, 'feedbacks_usuarios'), orderBy('enviadoEm', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              app: d.app || 'BARGESTAO',
              tipo: d.tipo || 'sugestao',
              nota: d.nota || d.avaliacao || 5,
              mensagem: d.mensagem || d.texto || '',
              usuario: d.usuario || 'anonimo',
              email: d.email || '',
              estabelecimento: d.estabelecimento || '',
              status: d.status || (d.lida ? 'lido' : 'novo'),
              lida: Boolean(d.lida || d.status === 'lido'),
              criadoEm: d.enviadoEm?.toDate ? d.enviadoEm.toDate().toISOString() : (d.criadoEm || new Date().toISOString())
            };
          });
        }
      } catch (err) {
        console.warn('[Firestore] Fallback feedbacks:', err.message);
      }
    }
    return this._mock.get('feedbacks');
  }

  async marcarComoLido(id, lido = true) {
    await this.inicializar();
    const feedbacks = this._mock.get('feedbacks');
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx !== -1) {
      feedbacks[idx].lida = Boolean(lido);
      feedbacks[idx].status = lido ? 'lido' : 'novo';
      this._mock.set('feedbacks', feedbacks);
    }

    if (this._db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const ref = doc(this._db, 'feedbacks_usuarios', id);
        await updateDoc(ref, { lida: Boolean(lido), status: lido ? 'lido' : 'novo' });
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  async excluirFeedback(id) {
    await this.inicializar();
    const feedbacks = this._mock.get('feedbacks').filter(f => f.id !== id);
    this._mock.set('feedbacks', feedbacks);

    if (this._db) {
      try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await deleteDoc(doc(this._db, 'feedbacks_usuarios', id));
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  // ==========================================
  // ERROS / TELEMETRIA
  // ==========================================
  async listarErros() {
    await this.inicializar();
    if (this._db) {
      try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const q = query(collection(this._db, 'telemetria_erros'), orderBy('dataOcorrencia', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
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
              criadoEm: d.dataOcorrencia?.toDate ? d.dataOcorrencia.toDate().toISOString() : (d.criadoEm || new Date().toISOString())
            };
          });
        }
      } catch (err) {
        console.warn('[Firestore] Fallback erros:', err.message);
      }
    }
    return this._mock.get('erros');
  }

  async marcarResolvido(id, resolvido = true) {
    await this.inicializar();
    const erros = this._mock.get('erros');
    const idx = erros.findIndex(e => e.id === id);
    if (idx !== -1) {
      erros[idx].resolvido = Boolean(resolvido);
      this._mock.set('erros', erros);
    }

    if (this._db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await updateDoc(doc(this._db, 'telemetria_erros', id), { resolvido: Boolean(resolvido) });
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  async excluirErro(id) {
    await this.inicializar();
    const erros = this._mock.get('erros').filter(e => e.id !== id);
    this._mock.set('erros', erros);

    if (this._db) {
      try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await deleteDoc(doc(this._db, 'telemetria_erros', id));
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  // ==========================================
  // SOLICITAÇÕES DE GOVERNANÇA & TENANTS
  // ==========================================
  async listarSolicitacoes() {
    await this.inicializar();
    if (this._db) {
      try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const q = query(collection(this._db, 'solicitacoes_governanca'), orderBy('solicitadoEm', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn('[Firestore] Fallback solicitacoes:', err.message);
      }
    }
    return this._mock.get('solicitacoes');
  }

  async atualizarStatusSolicitacao(id, dadosDecisao) {
    await this.inicializar();
    const solicitacoes = this._mock.get('solicitacoes');
    const idx = solicitacoes.findIndex(s => s.id === id);
    if (idx !== -1) {
      solicitacoes[idx] = { ...solicitacoes[idx], ...dadosDecisao };
    } else {
      solicitacoes.push({ id, ...dadosDecisao });
    }
    this._mock.set('solicitacoes', solicitacoes);

    if (this._db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await setDoc(doc(this._db, 'solicitacoes_governanca', id), dadosDecisao, { merge: true });
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  async listarTenants() {
    await this.inicializar();
    if (this._db) {
      try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const snap = await getDocs(collection(this._db, 'tenants_governanca'));
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn('[Firestore] Fallback tenants:', err.message);
      }
    }
    return this._mock.get('tenants');
  }

  async salvarTenant(tenantData) {
    await this.inicializar();
    const tenants = this._mock.get('tenants');
    const idx = tenants.findIndex(t => t.usuario === tenantData.usuario);
    if (idx !== -1) {
      tenants[idx] = { ...tenants[idx], ...tenantData };
    } else {
      tenants.push(tenantData);
    }
    this._mock.set('tenants', tenants);

    if (this._db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await setDoc(doc(this._db, 'tenants_governanca', tenantData.usuario), tenantData, { merge: true });
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  async alternarKillSwitch(usuario, bloquear, motivo = 'Suspensão de Governança Systekna') {
    await this.inicializar();
    const tenants = this._mock.get('tenants');
    const t = tenants.find(item => item.usuario === usuario);
    if (t) {
      if (!t.licenca) t.licenca = {};
      t.licenca.bloqueioRemoto = Boolean(bloquear);
      t.licenca.status = bloquear ? 'bloqueado' : 'ativo';
      t.licenca.motivoBloqueio = bloquear ? motivo : null;
      this._mock.set('tenants', tenants);
    }

    if (this._db) {
      try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await updateDoc(doc(this._db, 'tenants_governanca', usuario), {
          'licenca.bloqueioRemoto': Boolean(bloquear),
          'licenca.status': bloquear ? 'bloqueado' : 'ativo',
          'licenca.motivoBloqueio': bloquear ? motivo : null
        });
      } catch (_) {}
    }
    this._notificar();
    return true;
  }

  // ==========================================
  // NOTÍCIAS PARA DESENVOLVEDORES
  // ==========================================
  async listarNoticias() {
    await this.inicializar();
    if (this._db) {
      try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        const q = query(collection(this._db, 'noticias_devs'), orderBy('criadoEm', 'desc'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (err) {
        console.warn('[Firestore] Fallback noticias:', err.message);
      }
    }
    return this._mock.get('noticias');
  }

  async publicarNoticia(noticia) {
    await this.inicializar();
    const noticias = this._mock.get('noticias');
    noticias.unshift(noticia);
    this._mock.set('noticias', noticias);

    if (this._db) {
      try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await setDoc(doc(this._db, 'noticias_devs', noticia.id), noticia);
      } catch (_) {}
    }
    this._notificar();
    return noticia;
  }

  async excluirNoticia(id) {
    await this.inicializar();
    const noticias = this._mock.get('noticias').filter(n => n.id !== id);
    this._mock.set('noticias', noticias);

    if (this._db) {
      try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js');
        await deleteDoc(doc(this._db, 'noticias_devs', id));
      } catch (_) {}
    }
    this._notificar();
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
