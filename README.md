# raillab-workbench

An interactive incident playground for [RailLab](https://github.com/Anasabubakar/raillab-engine): pick a SEP-24 withdrawal scenario, choose a wallet client, press Run, and see exactly where the client breaks, with every rule labelled as a **SEP-24 requirement** or an **application policy**.

Nothing here is scripted. The scenario server and the reference clients are the real `raillab-engine` code running in your browser; edit the scenario JSON and the outcomes change because the code actually ran again. Everything the anchor does is **simulated**: no real bank, anchor, identifier or payment, and no network access.

Hosted demo: not deployed yet (see Status). Run it locally below.

## Run

Node 22 or newer and pnpm.

```bash
git clone https://github.com/Anasabubakar/raillab-workbench.git
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

The workbench runs reference clients. To test your own wallet code, use the engine's CLI (`raillab test <scenario> -- <your command>`); see the engine's [consumer contract](https://github.com/Anasabubakar/raillab-engine/blob/main/docs/CONSUMER-CONTRACT.md). Running user-supplied code is deliberately not offered in the hosted page.

## Safety

- No network requests, no uploads, no user code execution; strict CSP without `unsafe-eval` (zod's JIT is disabled in `main.ts` because it would need `eval`; found in design review, verified in a real browser).
- Scenario text is parsed with the engine's schema (strict, bounded); a request budget stops a runaway client.
- Report text is inserted as text nodes only.

## Version pairing with the engine

The engine is consumed as a **pinned release artifact**, not a sibling path: `vendor/anasabubakar-raillab-engine-0.1.0.tgz` (built with `pnpm pack` in raillab-engine), referenced as a `file:` dependency, so a clean clone installs exactly that code.

| workbench | raillab-engine | session / scenario schema | status |
|---|---|---|---|
| 0.1.0 | 0.1.0 (sha256 in `vendor/pairing.json`) | 1 / 1 | tested |

`pnpm stamp` records the artifact's version and SHA-256; tests check the stamp against the file, `compat.json` and `package.json`. To update: rebuild the tarball in the engine, copy it into `vendor/`, run `pnpm stamp` and `pnpm install`.

## Develop

```bash
pnpm run typecheck && pnpm test && pnpm run build     # 21 tests (jsdom)
```

## Status

Engineering complete for v0.1; verified in a real browser at desktop and 375 px widths (a width-containment bug was found and fixed there). Not done: hosted deployment (Vercel CLI not installed in the build environment, public publishing not authorized), GitHub publishing and CI run. No wallet or anchor maintainer has reviewed the scenarios or rules.

MIT licensed.
