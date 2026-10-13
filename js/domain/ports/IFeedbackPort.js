/**
 * Driven Port: IFeedbackPort
 * Contrato abstrato para persistência e consulta de feedbacks e avaliações dos usuários.
 */
export class IFeedbackPort {
  async listarFeedbacks() {
    throw new Error('Método listarFeedbacks não implementado');
  }

  async marcarComoLido(id, lido) {
    throw new Error('Método marcarComoLido não implementado');
  }

  async excluirFeedback(id) {
    throw new Error('Método excluirFeedback não implementado');
  }

  inscreverAtualizacoes(callback) {
    throw new Error('Método inscreverAtualizacoes não implementado');
  }
}
