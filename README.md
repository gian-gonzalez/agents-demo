# belo agentic · demo de agentes creados por usuarios

Demo de **agentes autónomos de IA desplegados en Vercel** con [eve](https://eve.dev), el framework de agentes de Vercel. Cada persona entra con su cuenta de Vercel, crea sus propios agentes de *belo Agentic Banking* (https://agentic.belo.app, hoy en lista de espera, por eso la cuenta es mock) y cualquiera puede probarlos. La home muestra en vivo quién creó qué.

Regla de oro de belo, implementada con el human-in-the-loop de eve: **el agente propone, la persona decide**. Todo movimiento de dinero queda en `HUMAN_APPROVAL_REQUIRED` hasta que la persona aprueba.

## Cómo está armado

```
agent/                      el único agente eve del proyecto (se "disfraza" del agente de cada usuario)
├── agent.ts                modelo anthropic/claude-opus-5.5 vía AI Gateway, sin tools por defecto
├── instructions.md         identidad belo + reglas de operación (system, estático)
├── instructions/persona.ts defineDynamic → nombre, instrucciones y permisos del agente de la sesión
├── tools/belo.ts           defineDynamic → solo las capacidades belo que el dueño habilitó
├── lib/belo-mock.ts        cuenta belo mock en estado de sesión (saldos, rendimientos, tarjetas, movimientos)
├── lib/belo-tools.ts       las 7 capacidades belo como tools con aprobación humana
├── lib/profiles.ts         carga el perfil del agente (header x-agent-id → DB)
├── channels/eve.ts         auth: Sign in with Vercel (Better Auth) + x-agent-id → attributes.agentId
└── hooks/runs.ts           turn.settled → registra la ejecución (usuario, costo, tokens)

apps/web/                   Next.js 16 (galería, crear agente, perfil, feed en vivo, chat con useEveAgent)
└── lib/db/                 Drizzle + Neon Postgres; store en memoria si no hay DATABASE_URL

vercel.ts                   Vercel Services: web + agente en un solo proyecto
```

Cómo un solo deployment sirve agentes de muchos usuarios: el chat envía `x-agent-id`; el canal lo verifica y lo guarda en `ctx.session.auth.initiator.attributes`; antes de cada llamada al modelo, `defineDynamic` lee ese atributo y construye instrucciones y tools de *ese* agente (memoizado por sesión).

## Capacidades belo (mock)

| Permiso               | Tool               | Aprobación humana                 |
| --------------------- | ------------------ | --------------------------------- |
| `account.balances`    | `account_balances` | no                                |
| `account.yields`      | `account_yields`   | no                                |
| `account.activity`    | `account_activity` | no                                |
| `exchange.fx`         | `exchange_fx`      | siempre                           |
| `ramp.fiat_crypto`    | `ramp_fiat_crypto` | siempre                           |
| `card.manage`         | `card_manage`      | al emitir tarjeta                 |
| `transaction.approve` | `transaction_pay`  | siempre; riesgo y límite → denied |

## Desarrollo

```bash
pnpm install
pnpm dev:all      # web + agente con `vercel dev --local`  (http://localhost:3000)
pnpm dev          # solo el agente, con la TUI de eve
pnpm typecheck && pnpm typecheck:web
```

En local no hay sign-in (`localDev()`), el usuario es "Dev local" y, sin `DATABASE_URL`, los agentes viven en memoria.

## Deploy

```bash
eve link                                  # una vez
vercel integration add neon --name agents-demo-db   # Postgres del Marketplace → DATABASE_URL
vercel env pull && pnpm db:push           # crea las tablas
eve deploy
```

Modelo: `agent/agent.ts` llama a Anthropic directo con `ANTHROPIC_API_KEY` (local en `.env.local`, en Vercel con `vercel env add`). Alternativa: volver al string `anthropic/claude-opus-5.5` para usar AI Gateway (pide tarjeta para liberar los créditos gratis).

Requisitos en la cuenta de Vercel: y Sign in with Vercel (lo configura `eve add channel/web`). La app quedó con **Sign-In Access = Anyone with a Vercel account** (campo `signInFrom: any-team`, cambiado vía `vercel api PATCH /v1/apps/<id>`), así cualquier persona con cuenta de Vercel puede entrar y crear agentes.
