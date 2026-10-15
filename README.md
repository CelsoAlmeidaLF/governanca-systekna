# Governança Systekna

Painel do CEO e da engenharia para **homologar estabelecimentos** do BarGestão, gerenciar **licenças** (mesas × balcão, planos, kill-switch), acompanhar **erros** e **feedbacks** dos apps e publicar **comunicados aos desenvolvedores**.

Segue o mesmo padrão do painel de feedback (`PESSOAL/stk-app-feedback-painel`): design Aero 3.0, cofre do kit de segurança (PIN FINANC ou biometria), sessão do Firebase só na memória e acesso decidido pelo Firestore.

[![Test and deploy to Pages](https://github.com/CelsoAlmeidaLF/governanca-systekna/actions/workflows/static.yml/badge.svg)](https://github.com/CelsoAlmeidaLF/governanca-systekna/actions/workflows/static.yml)

- Dados: Firestore do projeto `systekna-feedback`. As regras são as **mesmas** do painel de feedback (ver [Regras do Firestore](#regras-do-firestore)).
- Permissão pelo pacote `PACOTES/stk-pkg-governanca` (v1.4.0): planos, formato do UID e nomes das coleções vêm do mesmo contrato que o BarGestão usa. Solicitações, licenças, erros e feedbacks mostram a impressão digital (UID) no formato do app (`3F2A-9C01-…`).
- Quatro seções: **Licenças** (solicitações e licenças ativas), **Erros** (telemetria agrupada pelo mesmo erro, com Issue no GitHub), **Feedbacks** (média, distribuição, filtros, CSV) e **Comunicados**.
- Escritas só aparecem como feitas depois que o servidor confirma; falhas aparecem para o operador.
- Segurança: CSP no padrão dos apps, `noindex`, sem iframe (kit), texto vindo dos apps sempre escapado (`escapeHtml`), nada de `alert`/`confirm`/`prompt`.

## Design Aero 3.0 (v1.2.0)

Base idêntica ao `painel.css` do painel de feedback (o teste confere os tokens): vidro com espessura, céu e luzes ao fundo, fonte Open Sans servida em `src/fonts/` (SIL OFL 1.1).

- **Modo:** claro → escuro → luz ambiente (segue a hora). Fica salvo neste navegador (`governanca-modo`).
- **Ilha viva** no topo: erros abertos, depois cadastros pendentes, depois feedbacks novos.
- **Navegação:** segmentado no tablet/computador; **dock** no celular, com contadores.
- **Janelas Aero** para confirmar (homologar, kill-switch, excluir) e pedir o motivo da rejeição.
- Ícones de app (`icon-*.png`, `apple-touch-icon.png`, `favicon*`) no estilo Aero, escudo com visto.

## Cofre, PIN e biometria (v1.2.0)

O painel abre pelo kit de segurança (`PACOTES/stk-pkg-security`), como os apps e o painel de feedback:

- **Abrir:** PIN FINANC (o mesmo dos apps no mesmo endereço) ou biometria. Sem desbloquear, nada aparece.
- **Entrar sozinho:** no primeiro login, com "Guardar e-mail e senha neste aparelho" marcado, a conta vai para o cofre (`secureStorage`, chave `governanca:conta`), cifrada com AES-GCM. Nos próximos desbloqueios o painel entra no Firebase sem digitar nada.
- **Sessão do Firebase só na memória** (`inMemoryPersistence`): fechar a aba ou bloquear derruba o login. O token que a v1.1 guardava sem cifra (`firebaseLocalStorageDb`) é apagado.
- **App Check** com reCAPTCHA Enterprise (a mesma chave dos apps; o domínio precisa estar na chave).
- **Só quem governa entra:** depois do login, o painel só abre quando o Firestore confirma o acesso (regra `gestor()`: a conta dona do painel de feedback ou uma conta com a claim `admin`). Sem acesso, sai da conta e mostra e-mail e UID.
- **Menu ⋮ → Configurações:** PIN, senha no lugar do PIN, biometria, bloqueio automático, 12 palavras e "Instalar app" (do kit), mais a seção **Conta do painel**: entrar de novo, trocar a senha (10+ caracteres; atualiza o cofre), esquecer e-mail e senha deste aparelho, sair.

## Regras do Firestore

O projeto `systekna-feedback` tem **um só** arquivo de regras: `PACOTES/stk-pkg-doacao/firestore.rules`. Ele traz as coleções do painel de feedback (`avaliacoes`, `sugestoes`, `erros`) e as do Governança (`feedbacks_usuarios`, `telemetria_erros`, `solicitacoes_governanca`, `tenants_governanca`, `noticias_devs`).

- `firestore.rules` neste repositório é **cópia idêntica** (o teste `padrao-painel` confere). Não edite aqui: edite em PACOTES e copie.
- Publicar só de lá: `cd PACOTES/stk-pkg-doacao && npx -y firebase-tools deploy --only firestore --project systekna-feedback`.
- Testar no emulador (requer Java): `npm install && npm run test:rules` (49 casos, incluindo os do painel de feedback).
- Conta extra com acesso (opcional): `node scripts/set-admin-claim.mjs email@exemplo.com` com uma service account fora do repositório.

Antes da v1.2.0 havia dois arquivos de regras para o mesmo projeto; publicar um apagava as regras do outro.

## Endereços

- **GitHub Pages (DEV):** https://celsoalmeidalf.github.io/governanca-systekna/ — publicado pelo workflow a cada push na `main`, depois dos testes.
- **Firebase Hosting (recomendado; instalar no Android por aqui):** https://systekna-governanca.web.app — site `systekna-governanca` no projeto `systekna-feedback`, no ar desde 15/10/2026 (v1.4.0, login conferido). Endereço só da Governança (não divide o armazenamento do navegador com os outros apps) e com os cabeçalhos de segurança do `firebase.json` (sem iframe, HSTS, `nosniff`, `no-referrer`), que o GitHub Pages não envia. O domínio está na chave reCAPTCHA do App Check.
  - **Publicação manual:** o workflow só publica no Pages. A cada versão mesclada na `main`, rode `npm run deploy:hosting` a partir da `main` atualizada.
  - Custo: plano gratuito (Spark, sem cobrança ativada). A chave reCAPTCHA é compartilhada com os outros apps e o limite gratuito (10.000 verificações/mês) é somado entre todos.
- Cada endereço tem o próprio cofre: o PIN é criado de novo e o login é feito uma vez.

## Instalar no celular

No Android, abra **https://systekna-governanca.web.app** no Chrome, entre e use o menu → **Instalar app**.

PWA no modelo do painel: `manifest.json`, ícones com `?v=2` e `sw.js` registrado pelo kit, buscando **primeiro na rede** (versão nova vale na hora; sem internet, a tela abre do cache; Firebase e Google nunca passam pelo cache).

Ao mudar arquivos do app, troque `data-vault-version` no `index.html` e `CACHE_NAME` no `sw.js`; arquivo novo precisa entrar no `APP_SHELL` (o teste `pwa` confere os três).

## Versões

| Versão | O que mudou |
| --- | --- |
| 1.0.x | Painel inicial (Aero 2.0), cadastro e modo demo |
| 1.1.0 | Sem modo demo; claim `admin`; regras versionadas e testadas no emulador |
| 1.2.0 | Padrão do painel de feedback: Aero 3.0, cofre (PIN/biometria), sessão só na memória, App Check, acesso confirmado pelo Firestore, regras unificadas com o painel, PWA e cabeçalhos de hospedagem |
| 1.3.0 | Impressão digital (UID) do BarGestão no painel; regras aceitam o UID de 32 hex além do UUID; erros e feedbacks guardam o `uid` |
| 1.3.1 | Sem versão mínima inventada (9.3.0): política de versão só quando definida |
| 1.4.0 | Permissão pelo `stk-pkg-governanca`: tabela única de planos (corrige Enterprise gravado como 1000/10 ao aprovar), UID legado (UUID), coleções do contrato, kit com `FinancTyped` |

## Estrutura

```
src/index.html                 telas Entrar e Painel, janelas (conta, senha, confirmar, comunicado)
src/css/aero.css               design Aero 3.0 (base do painel de feedback + bloco "Governança")
src/fonts/                     Open Sans variável + licença OFL
src/stk-pkg-*                  kit de segurança e ícones (cópias de PACOTES/stk-pkg-security; não editar aqui)
src/stk-pkg-governanca/        contrato, cliente, Firestore e config (cópias de PACOTES/stk-pkg-governanca; não editar aqui)
src/js/domain/                 entidades, portas e ContaCofre (regras puras da conta guardada no cofre)
src/js/application/            serviços (auth, feedback, erros, aprovação, comunicados)
src/js/infrastructure/         FirebaseApp (App Check + Auth na memória + Firestore) e adaptadores
src/js/ui/controllers/         SessaoController (cofre, login, acesso) e GovernanceAppController (abas, ilha, dados)
src/js/ui/views/ e utils/      views das seções; modo, aviso, janelas, segmentado
tests/                         node --test: domínio, serviços, segurança, conta no cofre e padrão do painel
tests/rules/                   regras no emulador do Firestore
firebase.json                  Firebase Hosting (pasta src, cabeçalhos, no-cache) e emulador
```

## Rodar

```bash
npm test             # testes
npm start            # abre em http://localhost:8780 (localhost está na chave reCAPTCHA)
npm run test:rules   # regras no emulador (requer Java e npm install)
```
