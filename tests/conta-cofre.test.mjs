import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAVE_CONTA, gravarCredenciais, lerCredenciais, problemaSenhaNova, iniciais, emailValido, saudacao } from '../src/js/domain/ContaCofre.js';

test('ContaCofre: grava e lê de volta o formato do cofre', () => {
  assert.equal(CHAVE_CONTA, 'governanca:conta');
  const texto = gravarCredenciais('  ceo@systekna.com ', 'frase longa e boa');
  assert.deepEqual(lerCredenciais(texto), { email: 'ceo@systekna.com', senha: 'frase longa e boa' });
});

test('ContaCofre: recusa e-mail inválido e senha vazia ou enorme', () => {
  assert.throws(() => gravarCredenciais('sem-arroba', 'x'), /E-mail inválido/);
  assert.throws(() => gravarCredenciais('a@b.co', ''), /Senha inválida/);
  assert.throws(() => gravarCredenciais('a@b.co', 'x'.repeat(257)), /Senha inválida/);
});

test('ContaCofre: conteúdo estranho no cofre não vira tentativa de login', () => {
  for (const lixo of [null, '', '{', '[]', '{"v":2,"email":"a@b.co","senha":"x"}', '{"v":1,"email":"x","senha":"y"}', '{"v":1,"email":"a@b.co","senha":""}']) {
    assert.equal(lerCredenciais(lixo), null, String(lixo));
  }
});

test('ContaCofre: regras da senha nova (10+ caracteres, iguais, diferente da atual)', () => {
  assert.match(problemaSenhaNova('curta', 'curta', 'x'), /10 caracteres/);
  assert.match(problemaSenhaNova('uma senha boa', 'outra senha boa', 'x'), /não são iguais/);
  assert.match(problemaSenhaNova('mesma senha 1', 'mesma senha 1', 'mesma senha 1'), /diferente da atual/);
  assert.equal(problemaSenhaNova('nova senha 123', 'nova senha 123', 'antiga'), '');
});

test('ContaCofre: iniciais, e-mail e saudação', () => {
  assert.equal(iniciais('celso.almeida@x.com'), 'CA');
  assert.equal(iniciais('ceo@systekna.com'), 'CE');
  assert.equal(iniciais(''), '?');
  assert.equal(emailValido('a@b.co'), true);
  assert.equal(emailValido('a b@c.d'), false);
  assert.equal(saudacao(new Date(2026, 9, 14, 9)), 'Bom dia');
  assert.equal(saudacao(new Date(2026, 9, 14, 15)), 'Boa tarde');
  assert.equal(saudacao(new Date(2026, 9, 14, 21)), 'Boa noite');
});
