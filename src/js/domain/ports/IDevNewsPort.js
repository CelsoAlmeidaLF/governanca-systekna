/**
 * Driven Port: IDevNewsPort
 * Contrato abstrato para consulta e publicação de notícias e comunicados aos desenvolvedores.
 */
export class IDevNewsPort {
  async listarNoticias() {
    throw new Error('Método listarNoticias não implementado');
  }

  async publicarNoticia(noticia) {
    throw new Error('Método publicarNoticia não implementado');
  }

  async excluirNoticia(id) {
    throw new Error('Método excluirNoticia não implementado');
  }

  inscreverAtualizacoes(callback) {
    throw new Error('Método inscreverAtualizacoes não implementado');
  }
}
