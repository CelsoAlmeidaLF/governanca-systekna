import { DevNotice } from '../domain/entities/DevNotice.js';

/**
 * Application Service: DevNewsService
 * Orquestra publicação, filtragem e consumo do feed de notícias para os Desenvolvedores.
 */
export class DevNewsService {
  constructor(devNewsPort) {
    this._port = devNewsPort;
  }

  processarNoticias(rawList = []) {
    return rawList.map(item => item instanceof DevNotice ? item : new DevNotice(item));
  }

  filtrarNoticias(noticias = [], { categoria = 'todas', prioridade = 'todas', busca = '' } = {}) {
    const termo = String(busca || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    return noticias.filter(n => {
      if (!n.ativo) return false;
      if (categoria !== 'todas' && n.categoria !== categoria) return false;
      if (prioridade !== 'todas' && n.prioridade !== prioridade) return false;
      if (termo) {
        const texto = `${n.titulo} ${n.resumo} ${n.conteudo} ${n.tags.join(' ')} ${n.autor}`
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }

  async publicarNoticia(dadosNoticia) {
    const noticia = new DevNotice(dadosNoticia);
    if (!noticia.isValido()) {
      throw new Error('A notícia precisa conter título válido (mín. 4 caracteres) e conteúdo técnico detalhado.');
    }
    await this._port.publicarNoticia(noticia.toJSON());
    return noticia;
  }

  async excluirNoticia(id) {
    return await this._port.excluirNoticia(id);
  }
}
