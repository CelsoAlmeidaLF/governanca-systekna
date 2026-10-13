/**
 * Driven Port: IErrorReportingPort
 * Contrato abstrato para telemetria de erros sanitizados e crash reporting.
 */
export class IErrorReportingPort {
  async listarErros() {
    throw new Error('Método listarErros não implementado');
  }

  async marcarResolvido(id, resolvido) {
    throw new Error('Método marcarResolvido não implementado');
  }

  async excluirErro(id) {
    throw new Error('Método excluirErro não implementado');
  }

  inscreverAtualizacoes(callback) {
    throw new Error('Método inscreverAtualizacoes não implementado');
  }
}
