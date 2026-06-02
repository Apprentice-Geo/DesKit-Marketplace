# DesKit Marketplace

Central registry for [DesKit](https://github.com/WiIIiamWei/DesKit) plugins.

This repository is a **curated index**. It does not host plugin code — each
plugin lives in its own repository and ships prebuilt `.deskit` packages as
GitHub Release assets. This repo only stores small JSON listings that point
at those releases. The DesKit client reads this index over plain HTTPS; it
never clones or speaks Git.

## How it works

```
DesKit client ──HTTPS GET──▶ registry.json (this repo, raw.githubusercontent)
                                    │  list of entries
                                    ▼
              ──HTTPS GET──▶ <plugin>/releases/.../*.deskit (author's repo)
                                    │  verify sha256
                                    ▼
                            install into userData/plugins/
```

- `registry.json` — the index the client fetches. Format defined by
  `schema/registry.schema.json`.
- `plugins/<id>.json` — one file per plugin listing. Splitting per-plugin
  keeps submission PRs from colliding. Shape defined by
  `schema/registry-entry.schema.json`.
- `schema/` — JSON Schemas for validation (CI + editors).

## Submitting a plugin

1. Build your plugin from the
   [deskit-plugin-template](https://github.com/WiIIiamWei/deskit-plugin-template).
2. Tag a release (`git tag v1.0.0 && git push --tags`). The template's
   GitHub Action builds, zips a `<id>-<version>.deskit`, computes its
   SHA-256, and attaches both to a GitHub Release.
3. Copy `plugins/com.example.hello.json.example` to
   `plugins/<your-plugin-id>.json`, fill in the fields (including the
   Release `downloadUrl` and the `sha256` from the Action output).
   Set `icon` to either `lucide:<name>` (for a bundled Lucide icon) or a
   relative image path packaged inside the plugin's `.deskit` file. Keep
   this value aligned with the plugin's own `deskit.json` icon so installed
   plugins and marketplace listings render consistently without network
   access.
4. Open a pull request. A maintainer reviews the listing, verifies the
   download hash, and merges.

## Trust model

- **PR review** is the gate — a maintainer approves every listing change.
- **`sha256` pinning** — the client refuses any download whose hash does
  not match the reviewed entry, so a Release replaced after review is
  rejected.
- **Pinned versions** — `downloadUrl` references a tagged Release; an
  upstream re-tag must come back as a new version PR.

DesKit's plugin sandbox is intentionally lightweight (P0) and is **not** a
hard security boundary against malicious code. Only install plugins you
trust. See the DesKit plugin docs for the sandbox model.

## License

Listing metadata in this repo is MIT. Each plugin is licensed by its own
author — see the plugin's homepage.
