import test from 'node:test';
import assert from 'node:assert/strict';
import { DevNotice } from '../src/js/domain/entities/DevNotice.js';
import { DevNewsService } from '../src/js/application/DevNewsService.js';

test('DevNotice: validação de campos obrigatórios e categorização', () => {
  const noticia = new DevNotice({
    titulo: 'Lançamento do Módulo Hexagonal',
    categoria: 'arquitetura',
    prioridade: 'info',
    conteudo: 'Conteúdo detalhado sobre os ports e adapters implementados.'
  });

  assert.equal(noticia.isValido(), true);
  assert.equal(noticia.getRotuloCategoria(), '🏛️ Arquitetura & ADR');
  assert.equal(noticia.getBadgeClasse(), 'badge-info');
});

test('DevNewsService: publicação e filtragem por categoria', async () => {
  let salvo = null;
  const mockPort = {
    publicarNoticia: async (n) => { salvo = n; return n; },
    listarNoticias: async () => [],
    excluirNoticia: async () => true
  };

  const service = new DevNewsService(mockPort);
  await service.publicarNoticia({
    titulo: 'Patch de Segurança na Sanitização de Telemetria',
    categoria: 'seguranca',
    prioridade: 'critical',
    conteudo: 'Novo algoritmo Scrubber impede vazamento de hashes hexadecimais no Firestore.'
  });

  assert.notEqual(salvo, null);
  assert.equal(salvo.categoria, 'seguranca');
  assert.equal(salvo.prioridade, 'critical');

  const lista = [
    new DevNotice({ categoria: 'seguranca', titulo: 'Patch de Segurança', conteudo: '...' }),
    new DevNotice({ categoria: 'release', titulo: 'Versão 9.3', conteudo: '...' })
  ];

  const filtrados = service.filtrarNoticias(lista, { categoria: 'seguranca' });
  assert.equal(filtrados.length, 1);
  assert.equal(filtrados[0].categoria, 'seguranca');
});
