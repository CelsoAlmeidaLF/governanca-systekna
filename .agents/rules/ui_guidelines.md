# Diretrizes Estritas de UI/UX e Segurança do Ecossistema Systekna

## 1. Proibição de Emojis como Ícones
- **REGRA ABSOLUTA:** NUNCA utilizar emojis (ex: 👥, 🛡️, 💬, 📰, ⚡, 🚪, 🔍, 🗑️, 🏛️) como ícones de interface, botões, headers, abas ou componentes visuais.
- **PADRÃO OBRIGATÓRIO:** Utilizar SEMPRE ícones vetorizados em **SVG** (inline ou através de biblioteca padronizada de ícones, como Lucide, Feather ou Heroicons), com traço limpo (`stroke-width="1.8"` a `2.0"`), cores consistentes com o design system e alta definição em qualquer escala.

## 2. Visibilidade de Senha em Todos os Campos de Autenticação
- **REGRA ABSOLUTA:** TODO e qualquer campo de input para senhas (`type="password"`) DEVE obrigatoriamente possuir um botão táctil de **visualizar / ocultar senha**.
- **COMPORTAMENTO:**
  - O botão deve utilizar ícones SVG de olho aberto (*eye*) e olho fechado (*eye-off*).
  - O clique deve alternar dinamicamente o atributo `type` entre `"password"` e `"text"`.
  - Deve manter o foco e preservar o valor do campo sem submeter formulários acidentalmente (`type="button"`).
