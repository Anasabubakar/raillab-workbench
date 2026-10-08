import {
  AnchorModel,
  VirtualClock,
  digest,
  evaluate,
  verdictOf,
  MUTANTS,
  correctedConsumer,
  defectiveConsumer,
  parseScenario,
  runSession,
  type Consumer,
  type Scenario,
  type Session,
} from "@anasabubakar/raillab-engine";
import baseline from "@anasabubakar/raillab-engine/scenarios/baseline-withdrawal.json";
import delayed from "@anasabubakar/raillab-engine/scenarios/delayed-payout.json";
import everything from "@anasabubakar/raillab-engine/scenarios/everything-at-once.json";
import mismatched from "@anasabubakar/raillab-engine/scenarios/mismatched-reference.json";
import reordered from "@anasabubakar/raillab-engine/scenarios/reordered-and-repeated.json";
import stale from "@anasabubakar/raillab-engine/scenarios/stale-authentication.json";
import transient from "@anasabubakar/raillab-engine/scenarios/transient-outage.json";
import pairing from "../vendor/pairing.json";

export const PAIRING = pairing;

export const SCENARIOS: Array<{ name: string; title: string; json: string }> = [baseline, delayed, reordered, transient, stale, mismatched, everything].map((s) => ({
  name: s.name,
  title: s.title,
  json: JSON.stringify(s, null, 2),
}));

export interface ClientDef {
  id: string;
  label: string;
  note: string;
  consumer: Consumer;
}

export const CLIENTS: ClientDef[] = [
  { id: "corrected", label: "Corrected reference client", note: "Keeps pending/unknown state, retries, re-authenticates, checks ids, never goes backwards, acts once.", consumer: correctedConsumer },
  { id: "defective", label: "Defective reference client", note: "Announces completion early, trusts any response, applies stale statuses, repeats side effects, gives up on any error.", consumer: defectiveConsumer },
  ...Object.entries(MUTANTS).map(([key, m]) => ({ id: `mutant:${key}`, label: `Corrected client without ${key}`, note: `Exactly one behavior removed. Should fail: ${m.breaks}.`, consumer: m.consumer })),
];

export type RunOutcome = { ok: true; session: Session; scenario: Scenario } | { ok: false; error: string };

/** Parse the scenario text and run the real engine with the chosen client. Nothing here is scripted. */
export async function runConfig(opts: { scenarioText: string; seed: number; clientId: string }): Promise<RunOutcome> {
  let raw: unknown;
  try {
    raw = JSON.parse(opts.scenarioText);
  } catch (e) {
    return { ok: false, error: `The scenario is not valid JSON: ${e instanceof Error ? e.message : String(e)}` };
  }
  const parsed = parseScenario(raw);
  if (!parsed.ok) return { ok: false, error: "Invalid scenario:\n" + parsed.issues.slice(0, 8).map((i) => `  ${i.path}: ${i.message}`).join("\n") };
  if (!Number.isInteger(opts.seed) || opts.seed < 0 || opts.seed > 0xffffffff) return { ok: false, error: "The seed must be an integer from 0 to 4294967295." };
  const client = CLIENTS.find((c) => c.id === opts.clientId);
  if (!client) return { ok: false, error: `Unknown client ${opts.clientId}.` };
  const session = await runSession({ scenario: parsed.scenario, seed: opts.seed, consumer: client.consumer, consumerName: client.label });
  return { ok: true, session, scenario: parsed.scenario };
}

/**
 * A saved session carries its own verdict, assertion results and timeline fingerprint. Recompute all three from the
 * scenario, seed and timeline it contains (the anchor model is deterministic) and refuse a file that disagrees.
 */
export function sessionProblem(session: Session): string | null {
  const clock = new VirtualClock();
  const anchor = new AnchorModel(session.scenario, session.seed, (ms) => clock.iso(ms));
  const results = evaluate({ scenario: session.scenario, anchor, timeline: session.timeline });
  if (JSON.stringify(results) !== JSON.stringify(session.result.assertions)) return "Inconsistent session: its assertion results do not follow from its timeline.";
  if (verdictOf(results) !== session.result.verdict) return `Inconsistent session: its verdict is "${session.result.verdict}" but its assertions give "${verdictOf(results)}".`;
  if (digest(session.timeline) !== session.timelineDigest) return "Inconsistent session: its timeline fingerprint does not match its timeline.";
  return null;
}
