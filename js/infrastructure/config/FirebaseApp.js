/**
 * Infraestrutura: FirebaseApp
 * Um único app Firebase para o painel, montado como no painel de feedback:
 * - App Check com reCAPTCHA Enterprise (a mesma chave dos apps; o domínio precisa estar na chave);
 * - Auth com sessão SÓ NA MEMÓRIA (inMemoryPersistence): fechar a aba ou bloquear o cofre derruba o login.
 *   Quem reabre é o cofre (PIN FINANC ou biometria), que guarda o e-mail e a senha cifrados;
 * - initializeAuth sem popup/redirect: não carrega o iframe do Firebase (CSP mais curta).
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js';
import * as authSdk from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import * as firestoreSdk from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { FirebaseConfigProvider } from './FirebaseConfig.js';

// Chave do site reCAPTCHA Enterprise usada por todos os apps do projeto systekna-feedback (não é segredo).
export const RECAPTCHA_SITE_KEY = '6LehydgtAAAAAOqkwKOQPzg2m0CZwYTRZSXPeyyx';

export const app = initializeApp(FirebaseConfigProvider.getConfig());
initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY), isTokenAutoRefreshEnabled: true });
export const auth = authSdk.initializeAuth(app, { persistence: authSdk.inMemoryPersistence });
export const db = firestoreSdk.getFirestore(app);
// Módulos do SDK entregues aos adaptadores (injeção: os testes no Node usam dublês, sem rede)
export { authSdk, firestoreSdk };

// Até a v1.1 o token de login ficava salvo sem cifra no navegador (persistência local): apaga o que sobrou.
try { indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch (_) {}
