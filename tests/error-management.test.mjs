import test from 'node:test';
import assert from 'node:assert/strict';
import { SystemError } from '../src/js/domain/entities/SystemError.js';
import { ErrorManagementService } from '../src/js/application/ErrorManagementService.js';

test('SystemError: sanitização de assinatura e geração de GitHub Issue', () => {
  const err = new SystemError({
    id: 'err-99',
    app: 'BARGESTAO',
    versao: '9.3.0',
    modulo: 'storage_opfs',
    mensagem: 'QuotaExceededError: Memory limit reached for user 00000000000000000000000000000000',
    stackTrace: 'Error at StorageAdapter.js:14',
    usuario: 'salgados_central'
  });

  assert.equal(err.modulo, 'storage_opfs');
  assert.equal(err.assinatura.includes('BARGESTAO::storage_opfs::'), true);

  const link = err.gerarLinkGitHubIssue();
  assert.match(link, /github\.com\/CelsoAlmeidaLF\/multi-cm\/issues\/new/);
});

test('ErrorManagementService: agrupamento correto por assinatura', () => {
  const service = new ErrorManagementService({});
  const erros = [
    new SystemError({ modulo: 'opfs', mensagem: 'Quota exceeded', criadoEm: '2026-10-13T10:00:00Z', resolvido: false }),
    new SystemError({ modulo: 'opfs', mensagem: 'Quota exceeded', criadoEm: '2026-10-13T11:00:00Z', resolvido: false }),
    new SystemError({ modulo: 'bluetooth', mensagem: 'Device disconnected', criadoEm: '2026-10-13T11:30:00Z', resolvido: true })
  ];

  const grupos = service.agruparErros(erros, { status: 'todos' });
  assert.equal(grupos.length, 2);

  const grupoOpfs = grupos.find(g => g.modulo === 'opfs');
  assert.equal(grupoOpfs.totalOcorrencias, 2);
  assert.equal(grupoOpfs.resolvido, false);
  assert.equal(grupoOpfs.abertos, 2);
});
