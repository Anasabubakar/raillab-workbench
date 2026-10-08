# What you can do

- **Scenarios**: seven bundled (baseline, delayed payout, reordered and repeated responses, 503 outage, token expiry, wrong-transaction responses, a seeded mix) or edit the JSON to build your own (transient errors, repeats, stale snapshots, latency, mismatched ids, token expiry; poll numbers, probabilities or time windows).
- **Clients**: the corrected client, the defective client, and one mutant per rule (the corrected client with exactly one behavior removed). Run two side by side.
- **Seed**: the same scenario and seed always give the identical timeline (shown as a fingerprint); probabilistic scenarios change with the seed.
- **Read the result**: eight rules with evidence (`At 70000 ms the user was told "completed" while the anchor status was "pending_anchor"`), a swimlane diagram (anchor truth, responses served, what the user was told) and the full event timeline.
- **Save and open sessions** as JSON, validated against the session schema.

Evidence from a real browser (2026-10-07): [defective vs corrected](https://github.com/Rail-L-b/raillab-workbench/blob/main/docs/evidence/defective-vs-corrected-desktop.jpg), [SEP vs policy labels](https://github.com/Rail-L-b/raillab-workbench/blob/main/docs/evidence/rules-sep-vs-policy-desktop.jpg), [narrow screen](https://github.com/Rail-L-b/raillab-workbench/blob/main/docs/evidence/session-narrow-375.jpg).
