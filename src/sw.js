/* Governança Systekna · service worker (mesmo modelo do painel de feedback e do Finanças da Casa).
   Troque CACHE_NAME a cada versão (igual ao data-vault-version do index.html); o teste pwa confere. */
const CACHE_NAME = 'governanca-systekna-v1.3.0';
const APP_SHELL = [
  './', './index.html', './manifest.json', './stk-pkg-bip39-pt.js', './stk-pkg-financ-icons.js', './stk-pkg-secure-ui.css',
  './stk-pkg-secure-ui.js', './stk-pkg-secure-vault.js', './css/aero.css', './fonts/fonts.css', './fonts/open-sans.woff2',
  './js/main.js', './js/application/AuthService.js', './js/application/DevNewsService.js',
  './js/application/ErrorManagementService.js', './js/application/FeedbackService.js', './js/application/UserApprovalService.js',
  './js/domain/ContaCofre.js', './js/domain/entities/DevNotice.js', './js/domain/entities/Feedback.js',
  './js/domain/entities/SystemError.js', './js/domain/entities/TenantPermission.js', './js/domain/entities/UserRegistration.js',
  './js/domain/ports/IAuthPort.js', './js/domain/ports/IDevNewsPort.js', './js/domain/ports/IErrorReportingPort.js',
  './js/domain/ports/IFeedbackPort.js', './js/domain/ports/IUserGovernancePort.js',
  './js/infrastructure/adapters/FirebaseAuthAdapter.js', './js/infrastructure/adapters/FirestoreGovernanceAdapter.js',
  './js/infrastructure/config/FirebaseApp.js', './js/infrastructure/config/FirebaseConfig.js',
  './js/ui/controllers/GovernanceAppController.js', './js/ui/controllers/SessaoController.js', './js/ui/icons/Icons.js',
  './js/ui/utils/dialogo.js', './js/ui/utils/escapeHtml.js', './js/ui/utils/formatarUid.js', './js/ui/utils/modo.js', './js/ui/utils/notificar.js',
  './js/ui/utils/seletor.js', './js/ui/views/AuthView.js', './js/ui/views/DevNewsView.js', './js/ui/views/ErrorManagementView.js',
  './js/ui/views/FeedbackView.js', './js/ui/views/UserApprovalView.js',
  './icon-192.png?v=2', './icon-512.png?v=2', './icon-maskable-192.png?v=2', './icon-maskable-512.png?v=2',
  './apple-touch-icon.png?v=2', './favicon.ico?v=2', './favicon-16.png?v=2', './favicon-32.png?v=2', './favicon-48.png?v=2'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url)))));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Firebase (gstatic, googleapis) e envios vão direto para a rede: nada de dado é guardado aqui.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Rede primeiro: atualização vale na hora; o cache só entra offline (e sempre abre a tela do painel).
  event.respondWith(fetch(event.request).then(resp => {
    if (resp && resp.status === 200 && resp.type === 'basic') { const copia = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copia)); }
    return resp;
  }).catch(() => caches.match(event.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
});
