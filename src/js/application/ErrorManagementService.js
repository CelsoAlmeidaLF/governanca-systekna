import { SystemError } from '../domain/entities/SystemError.js';

/**
 * Application Service: ErrorManagementService
 * Orquestra agregação inteligente de assinaturas de falhas, métricas de severidade e abertura de issues.
 */
export class ErrorManagementService {
  constructor(errorPort) {
    this._port = errorPort;
  }

  processarErros(rawList = []) {
    return rawList.map(item => item instanceof SystemError ? item : new SystemError(item));
  }

  agruparErros(erros = [], { status = 'abertos', app = '', modulo = '', busca = '' } = {}) {
    const termo = String(busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const gruposMap = new Map();

    for (const err of erros) {
      if (app && err.app !== app) continue;
      if (modulo && err.modulo !== modulo) continue;

      if (termo) {
        const conteudo = `${err.mensagem} ${err.modulo} ${err.stackTrace} ${err.versao}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (!conteudo.includes(termo)) continue;
      }

      const chave = err.assinatura;
      let g = gruposMap.get(chave);

      if (!g) {
        g = {
          assinatura: chave,
          app: err.app,
          modulo: err.modulo,
          versao: err.versao,
          mensagem: err.mensagem,
          stackTrace: err.stackTrace,
          ambiente: err.ambiente,
          ids: [],
          totalOcorrencias: 0,
          abertos: 0,
          primeiraOcorrencia: err.criadoEm,
          ultimaOcorrencia: err.criadoEm,
          exemploErro: err
        };
        gruposMap.set(chave, g);
      }

      g.ids.push(err.id);
      g.totalOcorrencias++;
      if (!err.resolvido) g.abertos++;

      const tempoAtual = new Date(err.criadoEm).getTime();
      if (tempoAtual > new Date(g.ultimaOcorrencia).getTime()) {
        g.ultimaOcorrencia = err.criadoEm;
        g.ambiente = err.ambiente;
        g.exemploErro = err;
      }
      if (tempoAtual < new Date(g.primeiraOcorrencia).getTime()) {
        g.primeiraOcorrencia = err.criadoEm;
      }
    }

    const resultado = Array.from(gruposMap.values()).map(g => ({
      ...g,
      resolvido: g.abertos === 0
    }));

    return resultado
      .filter(g => {
        if (status === 'abertos') return !g.resolvido;
        if (status === 'resolvidos') return g.resolvido;
        return true;
      })
      .sort((a, b) => new Date(b.ultimaOcorrencia).getTime() - new Date(a.ultimaOcorrencia).getTime());
  }

  calcularMetricas(erros = []) {
    const totalRegistros = erros.length;
    let abertos = 0;
    let resolvidos = 0;
    const porModulo = {};
    const porApp = {};

    const agora = Date.now();
    const VINTE_QUATRO_HORAS = 24 * 60 * 60 * 1000;
    let ultimas24h = 0;

    for (const e of erros) {
      if (e.resolvido) resolvidos++;
      else abertos++;

      const diff = agora - new Date(e.criadoEm).getTime();
      if (diff <= VINTE_QUATRO_HORAS && !e.resolvido) ultimas24h++;

      porModulo[e.modulo] = (porModulo[e.modulo] || 0) + 1;
      porApp[e.app] = (porApp[e.app] || 0) + 1;
    }

    return {
      totalRegistros,
      abertos,
      resolvidos,
      ultimas24h,
      porModulo,
      porApp
    };
  }

  async alternarStatusGrupo(grupo, resolvido = true) {
    const promessas = (grupo.ids || []).map(id => this._port.marcarResolvido(id, resolvido));
    return await Promise.all(promessas);
  }

  async excluirGrupo(grupo) {
    const promessas = (grupo.ids || []).map(id => this._port.excluirErro(id));
    return await Promise.all(promessas);
  }
}
