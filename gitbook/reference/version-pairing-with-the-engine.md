# Version pairing with the engine

The engine is consumed as a **pinned release artifact**, not a sibling path: `vendor/anas.abubakar-raillab-engine-0.1.1.tgz` (built with `pnpm pack` in raillab-engine), referenced as a `file:` dependency, so a clean clone installs exactly that code.

| workbench | raillab-engine | session / scenario schema | status |
|---|---|---|---|
| 0.1.1 | 0.1.1 (sha256 in `vendor/pairing.json`) | 1 / 1 | tested |

`pnpm stamp` records the artifact's version and SHA-256; tests check the stamp against the file, `compat.json` and `package.json`. To update: rebuild the tarball in the engine, copy it into `vendor/`, run `pnpm stamp` and `pnpm install`.
