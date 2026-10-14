import test from 'node:test';
import assert from 'node:assert/strict';
import { FirebaseAuthAdapter } from '../src/js/infrastructure/adapters/FirebaseAuthAdapter.js';
import { FirestoreGovernanceAdapter } from '../src/js/infrastructure/adapters/FirestoreGovernanceAdapter.js';
import { FirebaseConfigProvider } from '../src/js/infrastructure/config/FirebaseConfig.js';
import { escapeHtml } from '../src/js/ui/utils/escapeHtml.js';
import { TenantPermission } from '../src/js/domain/entities/TenantPermission.js';
import { UserApprovalService } from '../src/js/application/UserApprovalService.js';
import { UserRegistration } from '../src/js/domain/entities/UserRegistration.js';

// O SDK do Firebase é injetado (FirebaseApp.js no navegador); aqui entram dublês, sem rede.
const authSdk = (extra = {}) => ({
  onAuthStateChanged: () => () => {},
  signInWithEmailAndPassword: async () => ({ user: { uid: 'u1', email: 'ceo@systekna.com' } }),
  signOut: async () => {},
  sendPasswordResetEmail: async () => {},
  ...extra
});

test('Auth fail-closed: sem SDK do Firebase, nenhum login é aceito (nem o e-mail do CEO)', async () => {
  const adapter = new FirebaseAuthAdapter();
  await assert.rejects(adapter.signInWithEmail('ceo@systekna.com', 'qualquer-coisa'), /indisponível/);
  await assert.rejects(adapter.signInWithEmail('outro@exemplo.com', 'errada'), /indisponível/);
  assert.equal(typeof adapter.createUserWithEmail, 'undefined', 'não há cadastro pelo painel');
  assert.equal(adapter.getCurrentUser(), null);
});

test('Auth: credencial recusada pelo Firebase vira mensagem clara e mantém o código', async () => {
  const adapter = new FirebaseAuthAdapter({ auth: { currentUser: null }, sdk: authSdk({
    signInWithEmailAndPassword: async () => { const e = new Error('x'); e.code = 'auth/invalid-credential'; throw e; }
  }) });
  await assert.rejects(adapter.signInWithEmail('ceo@systekna.com', 'errada'), (err) => {
    assert.match(err.message, /E-mail ou senha incorretos/);
    assert.equal(err.code, 'auth/invalid-credential', 'o cofre usa o código para pedir a senha atual');
    return true;
  });
  assert.equal(adapter.getCurrentUser(), null);
});

test('Auth: o adaptador só autentica; quem decide o acesso é o Firestore (conferirAcesso)', async () => {
  const adapter = new FirebaseAuthAdapter({ auth: { currentUser: null }, sdk: authSdk() });
  const user = await adapter.signInWithEmail('ceo@systekna.com', 'senha-ok');
  assert.equal(user.uid, 'u1');

  const negado = new FirestoreGovernanceAdapter({ db: {}, fs: {
    collection: () => ({}), limit: () => ({}), query: () => ({}),
    getDocsFromServer: async () => { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; }
  } });
  await assert.rejects(negado.conferirAcesso(), (err) => err.code === 'permission-denied');

  let lido = null;
  const liberado = new FirestoreGovernanceAdapter({ db: {}, fs: {
    collection: (_db, nome) => nome, limit: (n) => n, query: (c) => c,
    getDocsFromServer: async (q) => { lido = q; return { docs: [] }; }
  } });
  await liberado.conferirAcesso();
  assert.equal(lido, 'solicitacoes_governanca', 'lê do servidor uma coleção que só o gestor lista');
});

test('Auth: redefinir senha não revela se a conta existe', async () => {
  const adapter = new FirebaseAuthAdapter({ auth: {}, sdk: authSdk({
    sendPasswordResetEmail: async () => { const e = new Error('x'); e.code = 'auth/user-not-found'; throw e; }
  }) });
  assert.equal(await adapter.sendPasswordReset('ninguem@exemplo.com'), true);
});

test('Firestore: sem banco disponível, leitura e escrita falham explicitamente (sem dados de exemplo)', async () => {
  const adapter = new FirestoreGovernanceAdapter();
  await assert.rejects(adapter.listarSolicitacoes(), /indisponível/);
  await assert.rejects(adapter.alternarKillSwitch('id', true), /indisponível/);
});

test('Firestore: escrita recusada pelas regras é propagada com mensagem clara', async () => {
  const adapter = new FirestoreGovernanceAdapter();
  let notificado = false;
  adapter.inscreverAtualizacoes(() => { notificado = true; });
  adapter._db = {};
  adapter._fs = {
    doc: () => ({}),
    setDoc: async () => { const e = new Error('Missing or insufficient permissions.'); e.code = 'permission-denied'; throw e; }
  };
  await assert.rejects(adapter.alternarKillSwitch('tenant-1', true), /permissão negada/);
  assert.equal(notificado, false, 'UI não é notificada de sucesso quando a escrita falha');
});

test('Config: sobrescrita via localStorage é ignorada fora de localhost', () => {
  assert.throws(() => FirebaseConfigProvider.setCustomConfig({ projectId: 'atacante' }), /ambiente local/);
  assert.equal(FirebaseConfigProvider.getConfig().projectId, 'systekna-feedback');
});

test('XSS: escapeHtml neutraliza tags e quebra de atributo', () => {
  const payload = `"><img src=x onerror=alert(1)>'\``;
  const out = escapeHtml(payload);
  assert.ok(!/[<>"'`]/.test(out));
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(0), '0');
});

test('Tenant é chaveado pelo id da solicitação (UUID), não pelo usuário', async () => {
  let salvo = null;
  const service = new UserApprovalService({
    atualizarStatusSolicitacao: async () => true,
    salvarTenant: async (t) => { salvo = t; return true; }
  });
  const sol = new UserRegistration({ id: '0b6f3c1e-8f7a-4d2b-9c1e-2a3b4c5d6e7f', usuario: 'bar_do_ze', tipoComercio: 'bar' });
  await service.aprovarSolicitacao(sol, { permiteMesas: false });
  assert.equal(salvo.id, '0b6f3c1e-8f7a-4d2b-9c1e-2a3b4c5d6e7f');
  assert.equal(new TenantPermission({ usuario: 'legado' }).id, 'legado');
});

test('Aprovação grava a licença antes da decisão (nunca "aprovado sem tenant")', async () => {
  const ordem = [];
  const service = new UserApprovalService({
    atualizarStatusSolicitacao: async () => { ordem.push('decisao'); return true; },
    salvarTenant: async () => { ordem.push('tenant'); return true; }
  });
  const sol = new UserRegistration({ id: '0b6f3c1e-8f7a-4d2b-9c1e-2a3b4c5d6e7f', usuario: 'bar_do_ze' });
  await service.aprovarSolicitacao(sol, {});
  assert.deepEqual(ordem, ['tenant', 'decisao']);

  const falha = new UserApprovalService({
    atualizarStatusSolicitacao: async () => { ordem.push('decisao-indevida'); },
    salvarTenant: async () => { throw new Error('rede'); }
  });
  await assert.rejects(falha.aprovarSolicitacao(new UserRegistration({ id: 'x', usuario: 'y' }), {}), /rede/);
  assert.ok(!ordem.includes('decisao-indevida'), 'decisão não é gravada se a licença falhar');
});
