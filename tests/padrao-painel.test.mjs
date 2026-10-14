// Padrão do painel de feedback (PESSOAL/stk-app-feedback-painel): cofre, sessão, design, PWA, hospedagem e regras.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const raiz = new URL('../', import.meta.url);
const ler = (f) => readFileSync(new URL(f, raiz), 'utf8');
const html = ler('src/index.html');
const main = ler('src/js/main.js');
const fbApp = ler('src/js/infrastructure/config/FirebaseApp.js');
const sessao = ler('src/js/ui/controllers/SessaoController.js');
const sw = ler('src/sw.js');
const versao = (html.match(/data-vault-version="(\d+\.\d+\.\d+)"/) || [])[1];
const hash = (texto) => createHash('sha256').update(texto).digest('hex');

test('cofre: o painel abre pelo kit de segurança (PIN FINANC / biometria)', () => {
  assert.match(html, /<html[^>]*class="vault-locked"[^>]*data-vault-app="governanca-systekna"/);
  const ordem = ['stk-pkg-financ-icons.js', 'stk-pkg-bip39-pt.js', 'stk-pkg-secure-vault.js', 'stk-pkg-secure-ui.js', 'js/main.js'].map((f) => html.indexOf(`src="${f}"`));
  assert.ok(ordem.every((i) => i > 0), 'todos os scripts presentes');
  assert.deepEqual([...ordem].sort((a, b) => a - b), ordem, 'kit antes do app');
  assert.ok(html.indexOf('stk-pkg-secure-ui.css') < html.indexOf('css/aero.css'), 'o Aero sobrescreve as cores do kit');
  assert.match(html, /data-vault-profile-slot/, 'menu ⋮ no cabeçalho');
});

test('cofre: login só depois do desbloqueio e sessão do Firebase só na memória', () => {
  assert.match(fbApp, /persistence: authSdk\.inMemoryPersistence/);
  assert.doesNotMatch(fbApp + main, /browserLocalPersistence/);
  assert.match(fbApp, /deleteDatabase\('firebaseLocalStorageDb'\)/, 'apaga o token antigo salvo sem cifra');
  assert.match(fbApp, /initializeAppCheck\(app, \{ provider: new ReCaptchaEnterpriseProvider/, 'App Check como nos apps');
  assert.ok(main.indexOf('await window.vaultReady') < main.indexOf('observarEstadoAutenticacao('), 'espera o cofre antes de ouvir o login');
});

test('cofre: senha só vai para o secureStorage, nunca para localStorage', () => {
  for (const [nome, src] of [['main', main], ['sessao', sessao], ['modo', ler('src/js/ui/utils/modo.js')]]) {
    assert.doesNotMatch(src, /localStorage\.setItem\([^)]*(senha|conta|cred)/i, nome);
  }
  assert.match(sessao, /setItem\(CHAVE_CONTA, gravarCredenciais/);
});

test('acesso: o painel só abre depois que o Firestore confirma a conta como gestora', () => {
  const muda = sessao.slice(sessao.indexOf('async aoMudarLogin('), sessao.indexOf('_liberar(user) {'));
  assert.match(muda, /this\._view\.mostrarEntrar\(\);/, 'começa escondido a cada mudança de login');
  assert.match(muda, /await this\._dados\.conferirAcesso\(\)/);
  assert.match(muda, /this\._negado\(user, err\)/, 'leitura recusada vai para _negado()');
  const mostra = (sessao.match(/mostrarPainel\(\)/g) || []).length;
  assert.equal(mostra, 1, 'só _liberar() mostra o painel');
  const neg = sessao.slice(sessao.indexOf('async _negado('), sessao.indexOf('_status(user) {'));
  assert.match(neg, /this\._auth\.logout\(\)/, 'acesso recusado sai da conta');
});

test('segurança: CSP no padrão dos apps e sem diálogos nativos do navegador', () => {
  const csp = (html.match(/Content-Security-Policy" content="([^"]+)"/) || [])[1];
  assert.ok(csp, 'CSP no html');
  for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "script-src-attr 'none'", 'https://content-firebaseappcheck.googleapis.com']) assert.ok(csp.includes(d), d);
  assert.doesNotMatch(csp, /fonts\.googleapis|unsafe-eval/, 'fonte servida pelo próprio painel');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  const js = readdirSync(new URL('src/js/ui/views/', raiz)).map((f) => ler('src/js/ui/views/' + f)).join('\n');
  assert.doesNotMatch(js, /\b(alert|confirm|prompt)\(/, 'usa as janelas Aero (utils/dialogo.js)');
});

test('design: Aero 3.0 com a mesma base do painel de feedback', () => {
  const aero = ler('src/css/aero.css');
  assert.match(html, /href="fonts\/fonts\.css"/);
  assert.match(aero, /--font:'Open Sans'/);
  assert.match(aero, /:root\[data-mode="dark"\]/);
  assert.match(aero, /:root\[data-sky="dawn"\]/, 'luz ambiente');
  const painel = new URL('../../../PESSOAL/stk-app-feedback-painel/src/painel.css', raiz);
  if (existsSync(painel)) {
    // Tokens claro/escuro idênticos aos do painel (até a seção Base)
    const tokens = (css) => css.slice(css.indexOf('/* ───────── Tokens · claro'), css.indexOf('/* ───────── Base'));
    assert.equal(tokens(aero), tokens(readFileSync(painel, 'utf8')));
  }
  assert.ok(!existsSync(new URL('src/css/tokens.css', raiz)), 'design antigo removido');
});

test('kit: cópias idênticas às de PACOTES/stk-pkg-security (não editar aqui)', (t) => {
  const pacote = new URL('../../PACOTES/stk-pkg-security/', raiz);
  if (!existsSync(pacote)) { t.skip('PACOTES fora deste clone'); return; }
  for (const f of ['stk-pkg-financ-icons.js', 'stk-pkg-bip39-pt.js', 'stk-pkg-secure-vault.js', 'stk-pkg-secure-ui.js', 'stk-pkg-secure-ui.css']) {
    assert.equal(hash(ler('src/' + f)), hash(readFileSync(new URL(f, pacote), 'utf8')), f);
  }
});

test('regras: firestore.rules é cópia idêntica da fonte única em PACOTES/stk-pkg-doacao', (t) => {
  const rules = ler('firestore.rules');
  assert.match(rules, /function gestor\(\)/);
  assert.match(rules, /match \/sugestoes\/\{id\}/, 'mesmo arquivo do painel de feedback: um deploy não apaga o outro');
  assert.match(rules, /match \/solicitacoes_governanca\/\{id\}/);
  const fonte = new URL('../../PACOTES/stk-pkg-doacao/firestore.rules', raiz);
  if (!existsSync(fonte)) { t.skip('PACOTES fora deste clone'); return; }
  assert.equal(rules, readFileSync(fonte, 'utf8'));
});

test('pwa: manifesto e service worker no modelo do painel', () => {
  const m = JSON.parse(ler('src/manifest.json'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, './index.html');
  assert.ok(m.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
  for (const i of m.icons) assert.ok(existsSync(new URL('src/' + i.src.split('?')[0], raiz)), i.src);
  assert.match(html, /<link rel="manifest" href="manifest\.json">/);
  assert.ok(versao, 'data-vault-version no html');
  assert.match(sw, new RegExp(`CACHE_NAME = 'governanca-systekna-v${versao.replace(/\./g, '\\.')}'`), 'CACHE_NAME acompanha a versão');
  assert.match(sw, /fetch\(event\.request\)\.then/, 'rede primeiro');
  assert.match(sw, /url\.origin !== self\.location\.origin\) return/, 'Firebase nunca passa pelo cache');
  // Todo arquivo do app está no APP_SHELL (abre offline)
  const arquivos = [];
  const andar = (dir) => {
    for (const f of readdirSync(new URL(dir, raiz))) {
      const p = dir + f;
      if (statSync(new URL(p, raiz)).isDirectory()) andar(p + '/');
      else if (!/\.(png|ico|txt)$/.test(f) && f !== 'sw.js') arquivos.push(p.replace(/^src\//, './'));
    }
  };
  andar('src/');
  for (const a of arquivos) assert.ok(sw.includes(`'${a}'`), `${a} fora do APP_SHELL`);
});

test('hospedagem: cabeçalhos de segurança iguais aos do painel no Firebase Hosting', () => {
  const fb = JSON.parse(ler('firebase.json'));
  assert.equal(fb.hosting.public, 'src');
  const h = Object.fromEntries(fb.hosting.headers[0].headers.map((x) => [x.key, x.value]));
  assert.equal(h['X-Frame-Options'], 'DENY');
  assert.equal(h['Content-Security-Policy'], "frame-ancestors 'none'");
  assert.equal(h['X-Content-Type-Options'], 'nosniff');
  assert.equal(h['Referrer-Policy'], 'no-referrer');
  assert.match(h['Strict-Transport-Security'], /max-age=31536000/);
  const pkg = JSON.parse(ler('package.json'));
  assert.equal(pkg.scripts['deploy:rules'], undefined, 'regras só se publicam de PACOTES/stk-pkg-doacao');
});
