# 🏛️ Governança da Systekna — Painel do CEO & Engenheiro Chefe

> **Sistema Soberano de Governança, Homologação de Estabelecimentos, Telemetria de Erros Sanitizados, Análise de Feedbacks e Central de Notícias aos Desenvolvedores.**

[![Deploy static content to Pages](https://github.com/CelsoAlmeidaLF/governanca-systekna/actions/workflows/static.yml/badge.svg)](https://github.com/CelsoAlmeidaLF/governanca-systekna/actions/workflows/static.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Production Ready](https://img.shields.io/badge/Status-Production%20Ready-00e676.svg)]()

---

## 🌟 Visão Geral

O **Governança da Systekna** é o centro de comando corporativo do ecossistema de soluções da Systekna (BarGestão, Câmbio Sim, Cripto Sim, Livro-Caixa, Taxômetro e Identidade Soberana). Desenvolvido sob rigorosa **Arquitetura Hexagonal (Ports & Adapters)** e estética **Retro-Aero Glassmorphism 2.0**, o painel consolida:

1. **Esteira de Homologação e Aprovação de Usuários:**
   - Cadastro de novos gestores com **CNPJ estritamente opcional** (RN-FIREBASE.1).
   - Comutador Soberano da Governança para liberação do módulo de **Mesas e Salão** (`permiteMesas: true`) ou operação em modo **Balcão Puro** (`permiteMesas: false`) para lojas de salgados, lanchonetes e adegas.
   - Matriz de Governança Avançada com **Kill-Switch Remoto** de 1 clique, enforce de versão mínima do PWA e gestão de planos (*Starter, Pro, Enterprise*).

2. **Gestão de Falhas e Telemetria em Tempo Real (*Crash Reporting*):**
   - Agrupamento inteligente de incidentes por assinatura (`app + versao + modulo + mensagem`).
   - Higienização estrita de dados sensíveis (*PII & Secret Scrubber* — conformidade LGPD e Zero-Knowledge).
   - Botão para abertura automatizada de **GitHub Issues** com relatório técnico pré-formatado.

3. **Inteligência de Feedbacks e Satisfação dos Usuários:**
   - Métricas analíticas consolidadas: média ponderada (1 a 5 estrelas), distribuição e tendências.
   - Filtros por App, Tipo (*Sugestão, Elogio, Problema, Dúvida*), Status (*Novo/Lido*) e busca em tempo real.
   - Ações de resposta rápida via `mailto:` e exportação de relatórios em **CSV (UTF-8 BOM)**.

4. **Canal de Notícias e Diretrizes aos Desenvolvedores:**
   - Feed visual Aero de comunicados técnicos, ADRs de arquitetura, patches de segurança e changelogs.
   - Modal de publicação direta para o CEO emitir avisos de severidade (*Informativo, Alerta, Crítico*).

5. **Autenticação e Nuvem Firebase:**
   - Integração com **Firebase Auth** (Sessão isolada, proteção de rotas e recuperação de senha).
   - Persistência no **Firebase Firestore** (`systekna-feedback`) com fallback para armazenamento local offline.

---

## 📐 Arquitetura Hexagonal (Ports & Adapters)

```text
                     [ Interface Web Aero 3.0 / Glassmorphism 2.0 ]
                                          │
                                          ▼
                               [ GovernanceAppController ]
                                          │
          ┌───────────────────────────────┼───────────────────────────────┐
          ▼                               ▼                               ▼
  [FeedbackService]             [UserApprovalService]           [ErrorManagementService]
          │                               │                               │
          ▼                               ▼                               ▼
   [IFeedbackPort]             [IUserGovernancePort]            [IErrorReportingPort]
          │                               │                               │
          └───────────────────────────────┼───────────────────────────────┘
                                          ▼
                         [FirestoreGovernanceAdapter]
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     (Firebase Firestore Cloud)                    (LocalStorage Mock Fallback)
```

### Estrutura de Diretórios

```
governanca-systekna/
├── .github/
│   └── workflows/
│       └── static.yml              # Pipeline CI/CD para GitHub Pages
├── src/
│   ├── css/
│   │   ├── tokens.css              # Variáveis HSL, Glassmorphism 2.0 e Retro-Aero
│   │   ├── layout.css              # Layout Grid, Sidebar e Topbar com Ilha Viva
│   │   ├── components.css          # Cards, Badges, Botões GPU, Switches e Modais
│   │   └── animations.css          # Micro-interações otimizadas para GPU
│   ├── js/
│   │   ├── domain/
│   │   │   ├── entities/           # Feedback, SystemError, UserRegistration, TenantPermission, DevNotice
│   │   │   └── ports/              # IAuthPort, IFeedbackPort, IErrorReportingPort, IUserGovernancePort, IDevNewsPort
│   │   ├── application/            # AuthService, FeedbackService, ErrorManagementService, UserApprovalService, DevNewsService
│   │   ├── infrastructure/
│   │   │   ├── adapters/           # FirebaseAuthAdapter, FirestoreGovernanceAdapter, LocalStorageMockAdapter
│   │   │   └── config/             # FirebaseConfigProvider
│   │   ├── ui/
│   │   │   ├── views/              # AuthView, FeedbackView, ErrorManagementView, UserApprovalView, DevNewsView
│   │   │   └── controllers/        # GovernanceAppController
│   │   └── main.js                 # Composição e inicialização modular
│   ├── index.html                  # SPA Completa
│   ├── manifest.webmanifest        # PWA Manifest
│   └── favicon.ico                 # Favicon institucional
├── tests/                          # Suíte de testes unitários automatizados
│   ├── feedback.test.mjs
│   ├── error-management.test.mjs
│   ├── user-approval.test.mjs
│   └── dev-news.test.mjs
├── package.json
└── README.md
```

---

## 🚀 Como Executar Localmente

### 1. Testes Unitários Automatizados
Utiliza o test runner nativo do Node.js:
```bash
npm test
```

### 2. Execução Local com Servidor HTTP
```bash
npm start
# Acesse em: http://localhost:8080
```

---

## 🌐 Publicação no GitHub Pages

O projeto está configurado para deploy automático no GitHub Pages:
- **Repositório GitHub:** [https://github.com/CelsoAlmeidaLF/governanca-systekna](https://github.com/CelsoAlmeidaLF/governanca-systekna)
- **Endereço do GitHub Pages:** [https://celsoalmeidalf.github.io/governanca-systekna/](https://celsoalmeidalf.github.io/governanca-systekna/)

---

## 🔒 Segurança e Privacidade (LGPD & Zero-Knowledge)

- **Sanitização de Stack Traces:** Segredos, chaves brutas de 256 bits (`[CHAVE_REDUZIDA]`) e CPF/CNPJ em logs (`[DOC_REDUZIDO]`) são removidos antes da persistência.
- **Sessão Segura:** Tokens e credenciais operam protegidos na memória com limpeza ao efetuar logout.
- **Kill-Switch Remoto Soberano:** Permite congelamento de operações sem destruição do cofre local, garantindo integridade contábil e exportação defensiva.

---

© 2026 Systekna Engineering Core. Todos os direitos reservados.
