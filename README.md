<p align="center"><img src="docs/assets/banner.svg" alt="raillab-workbench" width="100%"></p>

# raillab-workbench

[![CI](https://github.com/Rail-L-b/raillab-workbench/actions/workflows/ci.yml/badge.svg)](https://github.com/Rail-L-b/raillab-workbench/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![Release](https://img.shields.io/github/v/release/Rail-L-b/raillab-workbench)](https://github.com/Rail-L-b/raillab-workbench/releases)

[Documentation](https://stellar-developer-tools.gitbook.io/raillab-workbench/) · [Live demo](https://raillab-workbench-anasamasama.vercel.app) · [Core repository](https://github.com/Rail-L-b/raillab-engine) · [Issues](https://github.com/Rail-L-b/raillab-workbench/issues) · [Discussions](https://github.com/Rail-L-b/raillab-workbench/discussions)


An interactive incident playground for [RailLab](https://github.com/Rail-L-b/raillab-engine): pick a SEP-24 withdrawal scenario, choose a wallet client, press Run, and see exactly where the client breaks, with every rule labelled as a **SEP-24 requirement** or an **application policy**.

Nothing here is scripted. The scenario server and the reference clients are the real `raillab-engine` code running in your browser; edit the scenario JSON and the outcomes change because the code actually ran again. Everything the anchor does is **simulated**: no real bank, anchor, identifier or payment, and no network access.

Hosted demo: https://raillab-workbench-anasamasama.vercel.app

## Run

Node 22 or newer and pnpm.

```bash
git clone https://github.com/Rail-L-b/raillab-workbench.git
cd raillab-workbench
pnpm install --frozen-lockfile
pnpm dev            # or: pnpm build && pnpm preview
```

Press **Run**. By default it runs the defective client and the corrected client on the baseline scenario: the defective one tells the user the withdrawal is complete while the anchor is still at `pending_anchor` (a SEP-24 rule), and the corrected one waits for `completed`.

## What you can do

- **Scenarios**: seven bundled (baseline, delayed payout, reordered and repeated responses, 503 outage, token expiry, wrong-transaction responses, a seeded mix) or edit the JSON to build your own (transient errors, repeats, stale snapshots, latency, mismatched ids, token expiry; poll numbers, probabilities or time windows).
- **Clients**: the corrected client, the defective client, and one mutant per rule (the corrected client with exactly one behavior removed). Run two side by side.
- **Seed**: the same scenario and seed always give the identical timeline (shown as a fingerprint); probabilistic scenarios change with the seed.
- **Read the result**: eight rules with evidence (`At 70000 ms the user was told "completed" while the anchor status was "pending_anchor"`), a swimlane diagram (anchor truth, responses served, what the user was told) and the full event timeline.
- **Save and open sessions** as JSON, validated against the session schema.

Evidence from a real browser (2026-10-07): [defective vs corrected](docs/evidence/defective-vs-corrected-desktop.jpg), [SEP vs policy labels](docs/evidence/rules-sep-vs-policy-desktop.jpg), [narrow screen](docs/evidence/session-narrow-375.jpg).

## To test your own client

The workbench runs reference clients. To test your own wallet code, use the engine's CLI (`raillab test <scenario> -- <your command>`); see the engine's [consumer contract](https://github.com/Rail-L-b/raillab-engine/blob/main/docs/CONSUMER-CONTRACT.md). Running user-supplied code is deliberately not offered in the hosted page.

## Safety

- No network requests, no uploads, no user code execution; strict CSP without `unsafe-eval` (zod's JIT is disabled in `main.ts` because it would need `eval`; found in design review, verified in a real browser).
- Scenario text is parsed with the engine's schema (strict, bounded); a request budget stops a runaway client.
- Report text is inserted as text nodes only.

## Version pairing with the engine

The engine is consumed as a **pinned release artifact**, not a sibling path: `vendor/anas.abubakar-raillab-engine-0.1.1.tgz` (built with `pnpm pack` in raillab-engine), referenced as a `file:` dependency, so a clean clone installs exactly that code.

| workbench | raillab-engine | session / scenario schema | status |
|---|---|---|---|
| 0.1.1 | 0.1.1 (sha256 in `vendor/pairing.json`) | 1 / 1 | tested |

`pnpm stamp` records the artifact's version and SHA-256; tests check the stamp against the file, `compat.json` and `package.json`. To update: rebuild the tarball in the engine, copy it into `vendor/`, run `pnpm stamp` and `pnpm install`.

## Develop

```bash
pnpm run typecheck && pnpm test && pnpm run build     # 21 tests (jsdom)
```

## Status

Engineering complete for v0.1; verified in a real browser at desktop and 375 px widths (a width-containment bug was found and fixed there). Pushed to GitHub with CI green; not published to npm. No wallet or anchor maintainer has reviewed the scenarios or rules.

MIT licensed.

## Repository layout

- `docs/`: decision records (ADRs), evidence and assets
- `gitbook/`: source of the GitBook documentation
- `scripts/`: build, generation and recording scripts
- `src/`: source
- `test/`: tests
- `vendor/`: pinned artifacts from the paired core repository

## Documentation

The full documentation is at https://stellar-developer-tools.gitbook.io/raillab-workbench/. It is built from the `gitbook/` folder of this repository and synced from `main`, so a fix to a page is a pull request here.

## Contributing

Open issues are scoped so one person can finish one in a single cycle, and each lists acceptance criteria. Read [CONTRIBUTING.md](CONTRIBUTING.md), pick an issue from the [issue list](https://github.com/Rail-L-b/raillab-workbench/issues), and say you are taking it before you start. Security reports go through [SECURITY.md](SECURITY.md), not public issues.

## Maintainers

| Maintainer | Role | GitHub |
|---|---|---|
| Anas Abubakar | Lead maintainer | [@Anasabubakar](https://github.com/Anasabubakar) |
| Abdulbasit Fazazi | Co-maintainer | [@fazaziishola-coder](https://github.com/fazaziishola-coder) |

## Community

Questions and design discussion go in [GitHub Discussions](https://github.com/Rail-L-b/raillab-workbench/discussions). Bugs and scoped work go in [Issues](https://github.com/Rail-L-b/raillab-workbench/issues).

## License

MIT. See [LICENSE](LICENSE).

## Contributors

Thanks to all the contributors who have made this project possible.

<a href="https://github.com/Rail-L-b/raillab-workbench/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Rail-L-b/raillab-workbench" alt="Contributors to raillab-workbench" />
</a>
