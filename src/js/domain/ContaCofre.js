/**
 * Domain: ContaCofre
 * Regras puras da conta do painel guardada no cofre do aparelho (mesmo modelo do painel de feedback).
 * O cofre (secureStorage do kit stk-pkg-security) cifra o texto com AES-GCM pela chave do PIN ou da biometria;
 * aqui só se monta e se confere o formato. Nada disto toca no DOM nem no Firebase.
 */

export const CHAVE_CONTA = 'governanca:conta';

export function emailValido(email) {
  return typeof email === 'string' && email.length <= 120 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

/** Texto que vai para o cofre. Recusa e-mail inválido e senha vazia ou longa demais. */
export function gravarCredenciais(email, senha) {
  const e = String(email || '').trim();
  const s = String(senha || '');
  if (!emailValido(e)) throw new Error('E-mail inválido.');
  if (!s || s.length > 256) throw new Error('Senha inválida.');
  return JSON.stringify({ v: 1, email: e, senha: s });
}

/** Lê o que está no cofre; qualquer coisa fora do formato vira null (o painel não tenta entrar). */
export function lerCredenciais(texto) {
  if (typeof texto !== 'string' || !texto) return null;
  try {
    const o = JSON.parse(texto);
    if (!o || o.v !== 1 || typeof o.email !== 'string' || typeof o.senha !== 'string') return null;
    if (!emailValido(o.email) || !o.senha || o.senha.length > 256) return null;
    return { email: o.email, senha: o.senha };
  } catch (_) {
    return null;
  }
}

/** Mensagem do problema da senha nova, ou '' se estiver boa. */
export function problemaSenhaNova(nova, repetida, atual) {
  if (String(nova || '').length < 10) return 'A nova senha precisa de pelo menos 10 caracteres.';
  if (nova.length > 256) return 'A nova senha pode ter no máximo 256 caracteres.';
  if (nova !== repetida) return 'As duas senhas novas não são iguais.';
  if (atual && nova === atual) return 'A nova senha precisa ser diferente da atual.';
  return '';
}

/** Iniciais para o avatar do topo (ex.: celso.almeida@x → CA). */
export function iniciais(email) {
  const partes = String(email || '').split('@')[0].split(/[._\-+]+/).filter(Boolean);
  const s = partes.length > 1 ? partes[0][0] + partes[1][0] : (partes[0] || '?').slice(0, 2);
  return s.toUpperCase();
}

/** Saudação pela hora local. */
export function saudacao(data = new Date()) {
  const h = data.getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}
