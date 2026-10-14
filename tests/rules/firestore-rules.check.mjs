// Testes das regras do Firestore no emulador. Rodar com: npm run test:rules (requer Java).
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, getDocs, collection, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-systekna',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8089 }
});
const anon = env.unauthenticatedContext().firestore();
const user = env.authenticatedContext('u1', { admin: false }).firestore();
const admin = env.authenticatedContext('a1', { admin: true }).firestore();
// Conta dona (mesmo UID da função dono() nas regras): governa sem precisar da claim
const dono = env.authenticatedContext('q6KSrUMgdqUsWd5YSTcHCbioKCu2').firestore();
const uuid = () => crypto.randomUUID();
const now = () => Timestamp.now();
let ok = 0, fail = 0;
async function t(name, p) { try { await p; ok++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, e.message); } }

const fb = () => ({ app: 'BARGESTAO', usuario: 'anonimo', estabelecimento: '', tipo: 'elogio', avaliacao: 5, mensagem: 'ok', status: 'novo', enviadoEm: now() });
const err = () => ({ app: 'BARGESTAO', usuario: 'anonimo', versaoApp: '2.5.0', mensagem: 'x', modulo: 'storage', stackTrace: 's', ambiente: { userAgent: 'ua', online: true, opfsSuportado: true, viewport: '1x1' }, dataOcorrencia: now(), resolvido: false });
const sol = () => ({ usuario: 'bar_do_ze', nomeEstabelecimento: 'Bar', cnpj: null, tipoComercio: 'bar', status: 'pendente', permiteMesas: true, solicitadoEm: now(), aprovadoEm: null, aprovadoPor: null, motivoDecisao: '' });

await t('app cria feedback válido', assertSucceeds(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), fb())));
await t('app não cria feedback com status lido', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), status: 'lido' })));
await t('app não cria feedback com campo extra', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), html: '<x>' })));
await t('app não cria feedback com id arbitrário', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', 'meu-id'), fb())));
await t('app não cria feedback com app malicioso', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), app: '<img src=x>' })));
await t('app fora da lista não cria feedback', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), app: 'OUTRO' })));
await t('feedback com data forjada (1970) negado', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), enviadoEm: Timestamp.fromMillis(0) })));
await t('feedback com data no futuro negado', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), enviadoEm: Timestamp.fromMillis(Date.now() + 86400000) })));
await t('anônimo não lista feedbacks', assertFails(getDocs(collection(anon, 'feedbacks_usuarios'))));
await t('usuário sem claim não lista feedbacks', assertFails(getDocs(collection(user, 'feedbacks_usuarios'))));
await t('admin lista feedbacks', assertSucceeds(getDocs(collection(admin, 'feedbacks_usuarios'))));

await t('app cria telemetria válida', assertSucceeds(setDoc(doc(anon, 'telemetria_erros', uuid()), err())));
await t('app não cria telemetria já resolvida', assertFails(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), resolvido: true })));
await t('telemetria com ambiente.online string grande negada', assertFails(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), ambiente: { online: 'x'.repeat(5000) } })));
await t('telemetria com versão fora do formato negada', assertFails(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), versaoApp: '__proto__' })));
await t('app não cria telemetria com modulo HTML', assertFails(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), modulo: '"><script>' })));

const sid = uuid();
await t('app cria solicitação pendente', assertSucceeds(setDoc(doc(anon, 'solicitacoes_governanca', sid), sol())));
await t('app não se autoaprova na criação', assertFails(setDoc(doc(anon, 'solicitacoes_governanca', uuid()), { ...sol(), status: 'aprovado' })));
await t('app não altera solicitação existente', assertFails(updateDoc(doc(anon, 'solicitacoes_governanca', sid), { status: 'aprovado' })));
await t('app lê a própria solicitação pelo id', assertSucceeds(getDoc(doc(anon, 'solicitacoes_governanca', sid))));
await t('anônimo não lista solicitações', assertFails(getDocs(collection(anon, 'solicitacoes_governanca'))));
await t('admin registra decisão (payload do painel)', assertSucceeds(setDoc(doc(admin, 'solicitacoes_governanca', sid), { usuario: 'bar_do_ze', status: 'aprovado', permiteMesas: false, solicitadoEm: new Date().toISOString(), aprovadoEm: new Date().toISOString(), aprovadoPor: 'CEO', motivoDecisao: 'ok' }, { merge: true })));

await t('admin cria tenant', assertSucceeds(setDoc(doc(admin, 'tenants_governanca', sid), { usuario: 'bar_do_ze', licenca: { status: 'ativo', bloqueioRemoto: false } })));
await t('admin aciona kill-switch', assertSucceeds(updateDoc(doc(admin, 'tenants_governanca', sid), { 'licenca.bloqueioRemoto': true, 'licenca.status': 'bloqueado' })));
await t('app lê a própria licença pelo id', assertSucceeds(getDoc(doc(anon, 'tenants_governanca', sid))));
await t('app não desliga o kill-switch', assertFails(updateDoc(doc(anon, 'tenants_governanca', sid), { 'licenca.bloqueioRemoto': false })));
await t('anônimo não lista tenants', assertFails(getDocs(collection(anon, 'tenants_governanca'))));
await t('usuário sem claim não escreve tenant', assertFails(setDoc(doc(user, 'tenants_governanca', uuid()), { usuario: 'x' })));

// UID = impressão digital do cadastro (32 hex): o app cria e lê a própria solicitação/licença por ele
const fp = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const uidFp = fp();
await t('app cria solicitação com impressão digital', assertSucceeds(setDoc(doc(anon, 'solicitacoes_governanca', uidFp), sol())));
await t('app lê a solicitação pela impressão digital', assertSucceeds(getDoc(doc(anon, 'solicitacoes_governanca', uidFp))));
await t('impressão digital em maiúsculas negada', assertFails(setDoc(doc(anon, 'solicitacoes_governanca', fp().toUpperCase()), sol())));
await t('impressão digital curta negada', assertFails(setDoc(doc(anon, 'solicitacoes_governanca', fp().slice(0, 31)), sol())));
await t('admin cria tenant na impressão digital', assertSucceeds(setDoc(doc(admin, 'tenants_governanca', uidFp), { usuario: 'bar_do_ze', licenca: { status: 'ativo' }, permissoesModulos: { permiteMesas: false } })));
await t('app lê a licença pela impressão digital', assertSucceeds(getDoc(doc(anon, 'tenants_governanca', uidFp))));
await t('app não muda as próprias permissões', assertFails(updateDoc(doc(anon, 'tenants_governanca', uidFp), { 'permissoesModulos.permiteMesas': true })));
await t('feedback com uid válido', assertSucceeds(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), uid: uidFp })));
await t('feedback com uid inválido negado', assertFails(setDoc(doc(anon, 'feedbacks_usuarios', uuid()), { ...fb(), uid: '<x>' })));
await t('telemetria com uid válido', assertSucceeds(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), uid: uidFp })));
await t('telemetria com uid inválido negada', assertFails(setDoc(doc(anon, 'telemetria_erros', uuid()), { ...err(), uid: 123 })));

await t('anônimo não lê notícias', assertFails(getDocs(collection(anon, 'noticias_devs'))));
await t('usuário sem claim não publica notícia', assertFails(setDoc(doc(user, 'noticias_devs', 'n1'), { titulo: 'x' })));
await t('admin publica notícia', assertSucceeds(setDoc(doc(admin, 'noticias_devs', 'n1'), { titulo: 'x' })));
await t('dono (sem claim) lista solicitações', assertSucceeds(getDocs(collection(dono, 'solicitacoes_governanca'))));
await t('dono (sem claim) publica notícia', assertSucceeds(setDoc(doc(dono, 'noticias_devs', 'n2'), { titulo: 'y' })));

// As regras do painel de feedback continuam no mesmo arquivo (um deploy não apaga o outro)
await t('app cria avaliação', assertSucceeds(setDoc(doc(anon, 'avaliacoes', uuid()), { app: 'INVEST', nota: 5, criadoEm: serverTimestamp() })));
await t('anônimo não lê sugestões', assertFails(getDocs(collection(anon, 'sugestoes'))));
await t('dono lê sugestões', assertSucceeds(getDocs(collection(dono, 'sugestoes'))));
await t('admin por claim não lê sugestões (só o dono)', assertFails(getDocs(collection(admin, 'sugestoes'))));

await t('coleção desconhecida negada', assertFails(setDoc(doc(admin, 'qualquer', 'x'), { a: 1 })));

await env.cleanup();
console.log(`\n${ok} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
