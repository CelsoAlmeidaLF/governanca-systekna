import { Feedback } from '../domain/entities/Feedback.js';

/**
 * Application Service: FeedbackService
 * Orquestra agregação analítica, filtragem e ciclo de vida dos feedbacks.
 */
export class FeedbackService {
  constructor(feedbackPort) {
    this._port = feedbackPort;
    this._dicionarioApps = {
      BARGESTAO: 'BarGestão Aero',
      CAMBIO: 'Câmbio Sim',
      CRIPTO: 'Cripto Sim',
      LIVROCAIXA: 'Livro-Caixa / Finanças',
      TAXOMETRO: 'Taxômetro',
      INVEST: 'Investimentos Sim',
      IDENTIDADE: 'Identidade Systekna'
    };
  }

  getNomeApp(appKey) {
    return this._dicionarioApps[String(appKey).toUpperCase()] || appKey;
  }

  processarFeedbacks(rawList = []) {
    return rawList.map(item => item instanceof Feedback ? item : new Feedback(item));
  }

  filtrarFeedbacks(feedbacks, { app = '', tipo = '', status = 'todos', busca = '' } = {}) {
    const termo = String(busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    return feedbacks.filter(fb => {
      if (app && fb.app !== app) return false;
      if (tipo && fb.tipo !== tipo) return false;
      if (status === 'novos' && fb.lida) return false;
      if (status === 'lidos' && !fb.lida) return false;
      if (termo) {
        const textoNorm = `${fb.mensagem} ${fb.usuario} ${fb.email} ${fb.estabelecimento}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (!textoNorm.includes(termo)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  calcularResumo(feedbacks = []) {
    const total = feedbacks.length;
    let somaNotas = 0;
    const distribuicao = [0, 0, 0, 0, 0];
    const porTipo = { sugestao: 0, problema: 0, elogio: 0, duvida: 0 };
    const porApp = {};
    let novosNaoLidos = 0;

    for (const fb of feedbacks) {
      somaNotas += fb.nota;
      distribuicao[fb.nota - 1]++;
      if (porTipo[fb.tipo] !== undefined) porTipo[fb.tipo]++;
      if (!fb.lida) novosNaoLidos++;

      if (!porApp[fb.app]) porApp[fb.app] = { total: 0, soma: 0, media: 0 };
      porApp[fb.app].total++;
      porApp[fb.app].soma += fb.nota;
    }

    Object.keys(porApp).forEach(app => {
      porApp[app].media = porApp[app].total ? porApp[app].soma / porApp[app].total : 0;
    });

    const mediaGeral = total > 0 ? somaNotas / total : 0;

    return {
      total,
      mediaGeral,
      novosNaoLidos,
      distribuicao,
      porTipo,
      porApp
    };
  }

  gerarCsv(feedbacks = []) {
    const formatarCelula = (valor) => {
      let s = valor == null ? '' : String(valor);
      if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
      return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const cabecalho = ['ID', 'Data/Hora', 'App', 'Tipo', 'Nota', 'Status', 'Usuário', 'Email', 'Estabelecimento', 'Mensagem'];
    const linhas = [cabecalho];

    for (const fb of feedbacks) {
      linhas.push([
        fb.id,
        new Date(fb.criadoEm).toLocaleString('pt-BR'),
        this.getNomeApp(fb.app),
        fb.tipo,
        fb.nota,
        fb.lida ? 'Lido' : 'Novo',
        fb.usuario,
        fb.email,
        fb.estabelecimento,
        fb.mensagem
      ]);
    }

    return '\uFEFF' + linhas.map(l => l.map(formatarCelula).join(';')).join('\r\n') + '\r\n';
  }

  async marcarComoLido(id, lido = true) {
    return await this._port.marcarComoLido(id, lido);
  }

  async excluirFeedback(id) {
    return await this._port.excluirFeedback(id);
  }
}
