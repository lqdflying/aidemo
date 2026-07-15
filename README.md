# AI Demo Lab

Interactive, step-by-step visual explanations of modern AI systems. The lab now
includes a **Retrieval-Augmented Generation (RAG)** walkthrough and an **Agent
Orchestration** systems atlas that traces a CloudOps incident across policy,
context, stateless models, specialist agents, MCP/RAG tools, bounded recovery,
human approval, and a controlled outcome.

The studio is built on a reusable animation framework so future demos (semantic
search, …) register metadata, scenes, events, and an optional runtime adapter
instead of adding custom orchestration to the shell.

## Stack

- React 19 + Vite 8 + TypeScript (strict)
- Vitest + Testing Library for unit/component tests
- Self-hosted variable fonts (DM Sans, Space Grotesk) via Fontsource
- Lucide icons, hand-written light-first CSS with `prefers-reduced-motion` support
- Hardened Wolfi-based Docker image served by internal Nginx

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## Verify

```bash
npm run typecheck    # tsc -b
npm run lint         # oxlint
npm test             # vitest run
npm run build        # tsc -b && vite build  -> dist/
npm run preview      # serve the production build
```

## Project layout

```
src/app/            shell, routing, demo catalog, registry
src/framework/      reusable scene/event/playback + walkthrough UI primitives
src/demos/rag/      RAG simulation, three-act story, and visual stage
src/demos/agents/   agent simulation, six-act systems atlas, stages, and inspectors
src/styles/         design tokens, shared, RAG + agent responsive motion styles
deploy/nginx/       internal Nginx config + external domain-proxy example
scripts/release.sh  build -> push -> cosign sign -> verify
version.json        single source of truth for the image version
Dockerfile          multi-stage nodejs build -> nginx runtime
docker-compose.yml  local production-like serving
```

## Container, registry, and Nginx delivery

The production frontend ships as a hardened Docker image published to
`img.aksg.net/aidemo/aidemo` (Harbor project `aidemo`, repository `aidemo`).

- **Base images** (Wolfi, 0-CVE): `img.aksg.net/nodejs/nodejs:latest` (build),
  `img.aksg.net/nginx/nginx:latest` (runtime). Always build with `--pull`.
- **Internal Nginx** (inside the container) serves the SPA with SPA fallback so
  deep links like `/demos/rag` work after refresh. See `deploy/nginx/default.conf`.
- **External Nginx** (the user's front-line reverse proxy) owns the public
  domain, TLS, access control, and reverse proxying to the container port, plus
  an optional `/api` proxy to a future backend. See
  `deploy/nginx/domain-proxy.conf.example`.

### Local production-like run

```bash
docker compose up -d --build      # serves on http://localhost:8080
docker compose down
```

### Publish a release

The image uses a **four-tag policy** — one immutable full-semver tag plus three
mutable rolling aliases that all point at the same manifest/digest:

| Tag | Example | Mutability |
| --- | --- | --- |
| `<version>` | `0.1.0` | immutable, one per release, never re-pushed |
| `<minor>` | `0.1` | mutable, points at newest `0.1.x` |
| `<major>` | `0` | mutable, points at newest `0.x.x` |
| `latest` | `latest` | mutable, points at newest release |

`scripts/release.sh` builds with `--pull`, pushes all four tags, resolves the
immutable digest, signs it with Cosign (key-based), and verifies the signature.
One digest signature covers all four tags because they share the manifest.

```bash
# Prerequisites: Harbor auth in ~/.docker/config.json, cosign key material.
VERSION=0.1.0 ./scripts/release.sh
```

### Cosign signing

Signing is **key-based** (Harbor enforces content trust — unsigned images cannot
be pulled). Key material lives outside the repo:

- `~/.config/aidemo/cosign.key` (private, chmod 600)
- `~/.config/aidemo/cosign.pub` (public, safe to share)
- `~/.config/aidemo/cosign.password` (chmod 600)

Generate keys with `COSIGN_PASSWORD=... cosign generate-key-pair`. The release
script signs by digest (`image@sha256:…`), the integrity-preserving form Cosign
recommends. See `.cursor/rules/release.mdc` for the full tagging, push, scan, and
signing contract.

### External Nginx + domain + TLS

1. Point DNS for the domain at the host running the external Nginx.
2. Install TLS certs and enable the `deploy/nginx/domain-proxy.conf.example`
   server block (set `server_name`, cert paths, and upstream ports).
3. Reverse proxy `/` to the aidemo container port (default host `8080`).
4. When a live backend exists, enable the `/api/` block and point it at the
   backend upstream. The `/api` path is unused in v0.1.0 but ready.

### Verify a published image

```bash
cosign verify --key ~/.config/aidemo/cosign.pub img.aksg.net/aidemo/aidemo@<digest>
```

## Adding a new demo

1. Create `src/demos/<id>/` with a simulation/adapter, a `DemoStory`, and its
   visual stage; reuse the walkthrough timeline, explanation, and controls from
   `src/framework/`.
2. Register it in `src/app/registry.ts` (`demoRegistry.register({ ... })`).
3. The shell routes `/demos/<id>` to the registered component automatically.
