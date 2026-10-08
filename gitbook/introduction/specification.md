# Specification

## User
A wallet developer who wants to see how a SEP-24 client behaves under incident conditions, and to explain it to a colleague, without installing anything.

## Supported scope
Choose or edit a scenario; choose one or two reference clients (including per-rule mutants); choose a seed; run the real engine in the browser; view rule outcomes with evidence, a swimlane diagram and the timeline; save and open session JSON.

## Non-goals
No hosted execution of user code, no server, no network access, no accounts. Does not implement the engine's HTTP server or external runner (CLI only). Does not decide outcomes itself: every outcome comes from `runSession`.

## Failure classes
| Input | Result |
|---|---|
| Scenario text is not JSON | readable error, no run |
| Scenario fails the schema | the first eight schema problems, no run |
| Seed not an integer in 0..4294967295 | readable error |
| Unknown client id | readable error |
| Session file invalid or tampered (extra fields, bad verdict) | readable error, previous results cleared |

## Acceptance criteria (each tested)
1. The defective client fails the SEP rule and the corrected client passes everything on the baseline scenario.
2. Outcomes change when the scenario is edited (they come from execution).
3. Same scenario and seed reproduce the fingerprint; a different seed changes a probabilistic one.
4. Every rule row shows its kind (SEP-24 requirement or application policy) and evidence.
5. The swimlane draws one served marker per poll and flags reordered, repeated and wrong-id responses.
6. Pairing stamp, tarball hash, `compat.json` and `package.json` agree.
7. Runs under a strict CSP in a real browser at desktop and 375 px widths without horizontal overflow (manual evidence).
