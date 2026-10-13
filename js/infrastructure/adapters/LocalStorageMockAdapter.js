/**
 * Infrastructure Adapter: LocalStorageMockAdapter
 * Fornece armazenamento local reativo e sementes iniciais completas para testes offline
 * e desenvolvimento sem dependência de rede externa.
 */
export class LocalStorageMockAdapter {
  constructor() {
    this._prefix = 'systekna_gov_mock_';
    this._inicializarSeeds();
  }

  _inicializarSeeds() {
    if (!localStorage.getItem(`${this._prefix}solicitacoes`)) {
      const solicitacoesSeed = [
        {
          id: 'solic-001',
          usuario: 'central_coxinha',
          cnpj: null, // Sem CNPJ - balcão puro
          nomeEstabelecimento: 'Central da Coxinha & Salgados',
          tipoComercio: 'loja_salgados',
          status: 'pendente',
          permiteMesas: false,
          solicitadoEm: new Date(Date.now() - 3600000 * 2).toISOString(),
          aprovadoEm: null,
          aprovadoPor: null,
          motivoDecisao: ''
        },
        {
          id: 'solic-002',
          usuario: 'pub_esperanca',
          cnpj: '12345678000190',
          nomeEstabelecimento: 'Pub & Chopp Esperança',
          tipoComercio: 'bar',
          status: 'pendente',
          permiteMesas: true,
          solicitadoEm: new Date(Date.now() - 3600000 * 5).toISOString(),
          aprovadoEm: null,
          aprovadoPor: null,
          motivoDecisao: ''
        },
        {
          id: 'solic-003',
          usuario: 'adega_premium',
          cnpj: '98765432000111',
          nomeEstabelecimento: 'Adega & Distribuidora São Bento',
          tipoComercio: 'adega',
          status: 'aprovado',
          permiteMesas: false,
          solicitadoEm: new Date(Date.now() - 3600000 * 24).toISOString(),
          aprovadoEm: new Date(Date.now() - 3600000 * 12).toISOString(),
          aprovadoPor: 'CEO & Engenharia Systekna',
          motivoDecisao: 'Comércio de balcão e bebidas homologado.'
        }
      ];
      localStorage.setItem(`${this._prefix}solicitacoes`, JSON.stringify(solicitacoesSeed));
    }

    if (!localStorage.getItem(`${this._prefix}tenants`)) {
      const tenantsSeed = [
        {
          usuario: 'adega_premium',
          nomeComercio: 'Adega & Distribuidora São Bento',
          cnpj: '98.765.432/0001-11',
          tipoComercio: 'adega',
          licenca: {
            plano: 'pro',
            status: 'ativo',
            criadoEm: new Date(Date.now() - 86400000 * 30).toISOString(),
            expiraEm: new Date(Date.now() + 86400000 * 335).toISOString(),
            bloqueioRemoto: false,
            motivoBloqueio: null
          },
          permissoesModulos: {
            permiteMesas: false,
            permiteBiometria: true,
            permiteExportacaoXlsx: true,
            permiteEscPosTermica: true,
            limiteProdutos: 1000,
            limiteUsuarios: 10
          },
          politicaVersao: {
            versaoMinima: '9.3.0',
            bloquearLegado: true
          },
          metricasCompliance: {
            ultimoAcessoEm: new Date().toISOString(),
            ultimoBackupEm: new Date(Date.now() - 86400000 * 2).toISOString(),
            versaoCliente: '9.3.0'
          }
        }
      ];
      localStorage.setItem(`${this._prefix}tenants`, JSON.stringify(tenantsSeed));
    }

    if (!localStorage.getItem(`${this._prefix}feedbacks`)) {
      const feedbacksSeed = [
        {
          id: 'fb-001',
          app: 'BARGESTAO',
          tipo: 'sugestao',
          nota: 5,
          mensagem: 'O modo balcão sem mesas agilizou muito a venda das nossas coxinhas no caixa rápido!',
          usuario: 'central_coxinha',
          email: 'contato@centraldacoxinha.com.br',
          estabelecimento: 'Central da Coxinha',
          status: 'novo',
          lida: false,
          criadoEm: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id: 'fb-002',
          app: 'BARGESTAO',
          tipo: 'problema',
          nota: 3,
          mensagem: 'Na impressão térmica Bluetooth, o espaçamento de cabeçalho cortou o logo do bar.',
          usuario: 'pub_esperanca',
          email: 'financeiro@pubesperanca.com',
          estabelecimento: 'Pub & Chopp Esperança',
          status: 'novo',
          lida: false,
          criadoEm: new Date(Date.now() - 3600000 * 7).toISOString()
        },
        {
          id: 'fb-003',
          app: 'CAMBIO',
          tipo: 'elogio',
          nota: 5,
          mensagem: 'Excelente precisão nas taxas de conversão offline.',
          usuario: 'marcos_trader',
          email: 'marcos@cambio.io',
          estabelecimento: 'Operações Pessoais',
          status: 'lido',
          lida: true,
          criadoEm: new Date(Date.now() - 3600000 * 20).toISOString()
        }
      ];
      localStorage.setItem(`${this._prefix}feedbacks`, JSON.stringify(feedbacksSeed));
    }

    if (!localStorage.getItem(`${this._prefix}erros`)) {
      const errosSeed = [
        {
          id: 'err-001',
          app: 'BARGESTAO',
          versao: '9.3.0',
          modulo: 'storage_opfs',
          mensagem: 'QuotaExceededError: The requested quota size exceeds the allowed limit.',
          stackTrace: 'Error: QuotaExceededError\n    at StorageAdapter.writeSlot (StorageAdapter.js:142)\n    at App._commit (App.js:312)',
          origem: 'StorageAdapter.js:142',
          tipo: 'erro',
          usuario: 'pub_esperanca',
          ambiente: { userAgent: 'Chrome/128 Linux Mobile', online: true, viewport: '412x915' },
          resolvido: false,
          criadoEm: new Date(Date.now() - 3600000 * 4).toISOString()
        },
        {
          id: 'err-002',
          app: 'BARGESTAO',
          versao: '9.3.0',
          modulo: 'bluetooth_escpos',
          mensagem: 'NetworkError: GATT operation failed during ESC/POS buffer chunk transmission.',
          stackTrace: 'Error: GATT operation failed\n    at EscPosAdapter.printTicket (EscPosAdapter.js:88)',
          origem: 'EscPosAdapter.js:88',
          tipo: 'erro',
          usuario: 'central_coxinha',
          ambiente: { userAgent: 'Chrome/127 Android 14', online: true, viewport: '1080x2400' },
          resolvido: false,
          criadoEm: new Date(Date.now() - 3600000 * 9).toISOString()
        }
      ];
      localStorage.setItem(`${this._prefix}erros`, JSON.stringify(errosSeed));
    }

    if (!localStorage.getItem(`${this._prefix}noticias`)) {
      const noticiasSeed = [
        {
          id: 'noticia-001',
          titulo: 'Lançamento da Arquitetura Hexagonal Soberana no BarGestão v9.3',
          categoria: 'arquitetura',
          prioridade: 'info',
          resumo: 'Desacoplamento total dos drivers de infraestrutura (OPFS, LocalStorage, Firebase) e introdução do BusinessConfig para comutação de perfil Balcão / Mesas.',
          conteudo: 'A versão 9.3 do BarGestão conclui a migração para a arquitetura hexagonal estrita.\n\n### Principais Mudanças:\n- Entidades puras e imutáveis com validação nos construtores.\n- Desacoplamento da camada de UI via DomRenderer e EventBus.\n- O módulo de mesas agora é condicional através da autorização da governança via `permiteMesas`.\n- Preservação do princípio Zero-Knowledge com criptografia AES-GCM 256 bits local.',
          autor: 'CEO & Engenheiro Chefe',
          tags: ['arquitetura', 'hexagonal', 'bargestao', 'zero-knowledge'],
          ativo: true,
          criadoEm: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: 'noticia-002',
          titulo: 'Diretriz de Segurança: Sanitização Obrigatória de PII e Chaves na Telemetria',
          categoria: 'seguranca',
          prioridade: 'warning',
          resumo: 'Todos os módulos devem implementar o PII & Secret Scrubber antes de despachar eventos de telemetria ou relatórios de erro.',
          conteudo: 'Para atender integralmente à LGPD e à política de Soberania da Systekna, nenhum stack trace ou log de erro enviado ao Firebase pode conter:\n- Sequências hexadecimais de chaves brutas (`[CHAVE_REDUZIDA]`)\n- Números de cartões ou documentos fiscais (`[DOC_REDUZIDO]`)\n- Nomes de titulares de comandas\n\nConsulte o adapter `FirebaseTelemetryAdapter.js` como referência de implementação.',
          autor: 'Engenharia de Segurança Systekna',
          tags: ['seguranca', 'lgpd', 'telemetria', 'scrubber'],
          ativo: true,
          criadoEm: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          id: 'noticia-003',
          titulo: 'Atualização do Service Worker e Política de Cache First para GitHub Pages',
          categoria: 'release',
          prioridade: 'info',
          resumo: 'Novos cabeçalhos e controle de ciclo de vida do Service Worker garantem disponibilidade offline imediata para PWA.',
          conteudo: 'Os PWAs publicados no GitHub Pages agora contam com o Service Worker v2, implementando estratégia Network-First para APIs externas e Cache-First para fontes e scripts estáticos com validação de SRI.',
          autor: 'Time de DevOps & Core',
          tags: ['pwa', 'cache', 'github-pages', 'service-worker'],
          ativo: true,
          criadoEm: new Date(Date.now() - 86400000 * 8).toISOString()
        }
      ];
      localStorage.setItem(`${this._prefix}noticias`, JSON.stringify(noticiasSeed));
    }
  }

  get(chave) {
    try {
      const raw = localStorage.getItem(`${this._prefix}${chave}`);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  set(chave, valor) {
    localStorage.setItem(`${this._prefix}${chave}`, JSON.stringify(valor));
  }
}
