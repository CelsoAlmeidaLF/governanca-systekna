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

test('AuthService: cadastro de novo usuário com validação de senha mínima', async () => {
  let registrado = null;
  const mockAdapter = {
    createUserWithEmail: async (email, pass, name) => {
      registrado = { email, displayName: name };
      return registrado;
    },
    getCurrentUser: () => registrado
  };

  const service = new AuthService(mockAdapter);

  await assert.rejects(async () => {
    await service.cadastrarUsuario('novo@systekna.com', '123', 'Novo Usuário');
  }, /mínimo 6 caracteres/);

  const novo = await service.cadastrarUsuario('admin@systekna.com', 'senhaSegura123', 'Administrador Core');
  assert.equal(novo.email, 'admin@systekna.com');
  assert.equal(novo.displayName, 'Administrador Core');
  assert.equal(service.isAuthenticated(), true);
});
