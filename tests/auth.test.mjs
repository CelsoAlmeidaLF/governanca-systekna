import test from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/js/application/AuthService.js';

test('AuthService: login e validação de parâmetros obrigatórios', async () => {
  let logado = null;
  const mockAdapter = {
    signInWithEmail: async (email, pass) => { logado = { email }; return logado; },
    getCurrentUser: () => logado
  };

  const service = new AuthService(mockAdapter);

  await assert.rejects(async () => {
    await service.login('', '123456');
  }, /obrigatórios/);

  const user = await service.login('ceo@systekna.com', '123456');
  assert.equal(user.email, 'ceo@systekna.com');
  assert.equal(service.isAuthenticated(), true);
});

test('AuthService: troca de senha valida antes de chamar o Firebase', async () => {
  let chamado = null;
  const service = new AuthService({ changePassword: async (a, n) => { chamado = [a, n]; } });
  await assert.rejects(service.trocarSenha('', 'nova senha 123', 'nova senha 123'), /senha atual/);
  await assert.rejects(service.trocarSenha('antiga', 'curta', 'curta'), /10 caracteres/);
  assert.equal(chamado, null);
  await service.trocarSenha('antiga', 'nova senha 123', 'nova senha 123');
  assert.deepEqual(chamado, ['antiga', 'nova senha 123']);
});

test('AuthService: "Esqueci a senha" pede um e-mail válido', async () => {
  const service = new AuthService({ sendPasswordReset: async () => true });
  await assert.rejects(service.solicitarRecuperacaoSenha('sem-arroba'), /Digite seu e-mail/);
  assert.equal(await service.solicitarRecuperacaoSenha('ceo@systekna.com'), true);
});
