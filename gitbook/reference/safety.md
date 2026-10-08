# Safety

- No network requests, no uploads, no user code execution; strict CSP without `unsafe-eval` (zod's JIT is disabled in `main.ts` because it would need `eval`; found in design review, verified in a real browser).
- Scenario text is parsed with the engine's schema (strict, bounded); a request budget stops a runaway client.
- Report text is inserted as text nodes only.
