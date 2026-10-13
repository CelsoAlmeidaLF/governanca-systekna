import test from 'node:test';
import assert from 'node:assert/strict';
import { Feedback } from '../src/js/domain/entities/Feedback.js';
import { FeedbackService } from '../src/js/application/FeedbackService.js';

test('Feedback: instanciação válida e geração de link de resposta', () => {
  const fb = new Feedback({
    id: 'fb-101',
    app: 'BARGESTAO',
    tipo: 'sugestao',
    nota: 5,
    mensagem: 'Excelente modo balcão sem mesas',
    usuario: 'salgados_central',
    email: 'gestor@salgados.com.br'
  });

  assert.equal(fb.isValido(), true);
  assert.equal(fb.hasEmailValido(), true);
  assert.match(fb.gerarLinkResposta(), /mailto:gestor@salgados\.com\.br/);
});

test('FeedbackService: cálculo analítico de métricas e distribuição', () => {
  const mockPort = {
    listarFeedbacks: async () => [],
    marcarComoLido: async () => true,
    excluirFeedback: async () => true
  };

  const service = new FeedbackService(mockPort);
  const lista = [
    new Feedback({ nota: 5, tipo: 'sugestao', lida: false }),
    new Feedback({ nota: 3, tipo: 'problema', lida: false }),
    new Feedback({ nota: 4, tipo: 'elogio', lida: true })
  ];

  const metricas = service.calcularResumo(lista);
  assert.equal(metricas.total, 3);
  assert.equal(metricas.mediaGeral, 4.0);
  assert.equal(metricas.novosNaoLidos, 2);
  assert.equal(metricas.distribuicao[4], 1); // 5 estrelas
  assert.equal(metricas.distribuicao[2], 1); // 3 estrelas
});

test('FeedbackService: geração de CSV formatado com cabeçalho UTF-8 BOM', () => {
  const service = new FeedbackService({});
  const lista = [
    new Feedback({ id: 'fb-1', app: 'BARGESTAO', tipo: 'elogio', nota: 5, mensagem: 'Muito bom; rápido!' })
  ];

  const csv = service.gerarCsv(lista);
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /BarGestão Aero/);
  assert.match(csv, /"Muito bom; rápido!"/);
});
