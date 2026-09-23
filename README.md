# Krashaq Web

Next.js farmer experience with Redux Toolkit/RTK Query, React Hook Form, Zod, a shadcn-style Radix button and MapLibre. Session credentials stay in HttpOnly cookies; Redux stores only a verified identity and UI state. API requests are same-origin and mutations include a CSRF token.

## Local commands

Run these from the workspace root unless stated otherwise. Docker Desktop must be running.

```zsh
python3 uaip-infrastructure/scripts/stop-krashaq-product.py
ADMIN_EMAILS=admin@example.test python3 uaip-infrastructure/scripts/run-krashaq-product.py --skip-build --smoke
```

Run web development only from `krashaq-web`:

```zsh
pnpm dev
pnpm test
pnpm test:jest
pnpm typecheck
pnpm build
```

The model gateway uses the ignored local OpenAI configuration generated from `uaip-infrastructure/secrets.local.env`; do not add API keys to committed files.

Public routes are `/sign-in` and `/sign-up`; `/login` and `/register` are compatibility redirects. Next 16 `proxy.ts` admits private routes only when an HttpOnly access cookie or non-secret session hint exists. The refresh credential remains scoped to `/v1/auth`; `SessionGate` verifies the active server session through the Gateway and refreshes only when the access session is expired. The Gateway is the authorization authority for every API request.

Private routes include `/dashboard`, `/krashaq-ai`, `/farming-intelligence`, `/knowledge`, `/farms`, `/weather`, `/markets`, `/alerts`, `/profile` and `/settings`; admins also have `/admin/users` and `/admin/knowledge`. `features/auth/` owns forms, session resolution and profile components; `features/ui/` owns display preferences; `store/` composes feature slices; `lib/api/` owns the CSRF-aware HTTP client and RTK Query cache. Container entry uses standalone Next. Production TLS belongs at the edge.

```text
src/
  app/                 # routes, global styles and route aliases
  proxy.ts              # protected/public route admission (Next 16 middleware)
  components/
    layout/             # reusable authenticated application frame
    ui/                 # generic visual primitives
  features/
    auth/               # sign-in/up, session gate, profile slice/components
    ui/                 # locale and selected-farm slice
  lib/
    api/                # Gateway HTTP client and RTK Query endpoints
    auth/               # route-safe redirect helpers
  store/                # Redux store and typed hooks
```
