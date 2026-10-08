# Changelog

## 0.1.1
- Saved sessions are now verified by recomputing their assertions, verdict and timeline fingerprint; inconsistent files are rejected. Re-paired with the published 0.1.1 release of its core (`compat.json` and the vendor stamp record the version and commit). Recorded real-run samples keep the version that recorded them.

## 0.1.0 (unreleased)
- Workbench running the real raillab-engine in the browser: scenarios, clients (corrected, defective, per-rule mutants), seed, side-by-side comparison.
- Rule results labelled SEP-24 requirement or application policy, with evidence; swimlane diagram; full timeline.
- Scenario JSON editor, session save and open with schema validation.
- Engine pinned as a committed release artifact with a stamped hash.
