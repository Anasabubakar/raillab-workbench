# ADR 0002: Consume the engine as a pinned tarball

Status: accepted, 2026-10-07.

The workbench must build from a clean independent clone, so it cannot import a sibling directory. Options: a registry package (not published yet), a git dependency (no remote yet), or a committed release artifact. We commit the `pnpm pack` tarball (about 49 KB) in `vendor/`, depend on it with `file:`, and stamp its SHA-256 in `vendor/pairing.json`. Tests fail if the stamp, the tarball, `package.json` and `compat.json` disagree. When the engine is published, the dependency can switch to the registry version without changing the code.
