# Contributing

```bash
pnpm install --frozen-lockfile
pnpm run typecheck && pnpm test && pnpm run build
```

- The workbench must not decide outcomes. Everything shown comes from the engine's `runSession`; do not add canned results.
- Never run user-supplied code in the page.
- Keep the CSP free of `unsafe-eval` and `unsafe-inline` (zod runs with `jitless`). Report text goes in as text nodes only.
- Check UI changes in a real browser at desktop and 375 px width, measuring `main.scrollWidth` against `clientWidth` (`window.innerWidth` is not a reliable overflow check on emulated phones).
- To update the engine, rebuild its tarball, copy it to `vendor/`, run `pnpm stamp` and `pnpm install`, then run the tests.
- One logical change per commit; AI-assisted changes are welcome if you understand and verified them.
