# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Deploy Automatico no Vercel via GitHub

Este repositorio esta configurado para fazer push automatico a cada commit local.
Com isso, sempre que houver commit no branch conectado ao Vercel, um novo deploy e disparado automaticamente.

### Como funciona

- Hook local: `.githooks/post-commit`
- Acao: executa `git push` ao finalizar cada commit
- Efeito no Vercel: novo deploy quando o push chegar no GitHub

### Desativar temporariamente

Para pular o push automatico em um commit especifico:

```bash
SKIP_AUTO_PUSH=1 git commit -m "sua mensagem"
```

### Observacoes

- Se o branch ainda nao tiver upstream, o hook avisa e nao tenta forcar push.
- O Vercel precisa estar integrado ao repositorio GitHub e ao branch correto (ex.: `main`).
