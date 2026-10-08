import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLIENTS, PAIRING, SCENARIOS, runConfig, sessionProblem } from "../src/state.ts";

const scenario = (name: string) => SCENARIOS.find((s) => s.name === name)!.json;
const outcome = (r: Awaited<ReturnType<typeof runConfig>>, id: string) => (r.ok ? r.session.result.assertions.find((a) => a.id === id)!.outcome : "error");

describe("running the real engine", () => {
  it("the defective client fails the SEP rule on the baseline scenario; the corrected client passes everything", async () => {
    const bad = await runConfig({ scenarioText: scenario("baseline-withdrawal"), seed: 1, clientId: "defective" });
    const good = await runConfig({ scenarioText: scenario("baseline-withdrawal"), seed: 1, clientId: "corrected" });
    expect(outcome(bad, "no-early-completion")).toBe("fail");
    expect(bad.ok && bad.session.result.verdict).toBe("fail");
    expect(good.ok && good.session.result.verdict).toBe("pass");
  });

  it("offers the corrected client, the defective client and one mutant per rule", () => {
    expect(CLIENTS.map((c) => c.id)).toEqual(["corrected", "defective", "mutant:strictCompletion", "mutant:reauthenticate", "mutant:checkReference", "mutant:retryTransient", "mutant:monotonic", "mutant:idempotentActions"]);
  });

  it("each bundled scenario runs for each client without a consumer error", async () => {
    for (const s of SCENARIOS) {
      for (const c of CLIENTS) {
        const r = await runConfig({ scenarioText: s.json, seed: 2, clientId: c.id });
        expect(r.ok, `${s.name}/${c.id}`).toBe(true);
        if (r.ok) expect(r.session.consumerError).toBeNull();
      }
    }
  });

  it("outcomes come from execution: editing the scenario changes them", async () => {
    const withFaults = await runConfig({ scenarioText: scenario("transient-outage"), seed: 1, clientId: "mutant:retryTransient" });
    expect(outcome(withFaults, "retries-transient-errors")).toBe("fail");
    const edited = JSON.parse(scenario("transient-outage"));
    edited.faults = [];
    const without = await runConfig({ scenarioText: JSON.stringify(edited), seed: 1, clientId: "mutant:retryTransient" });
    expect(outcome(without, "retries-transient-errors")).toBe("not_applicable");
  });

  it("is reproducible and seed-sensitive", async () => {
    const run = (seed: number) => runConfig({ scenarioText: scenario("everything-at-once"), seed, clientId: "corrected" });
    const [a, b, c] = await Promise.all([run(7), run(7), run(8)]);
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (a.ok && b.ok && c.ok) {
      expect(a.session.timelineDigest).toBe(b.session.timelineDigest);
      expect(a.session.timelineDigest).not.toBe(c.session.timelineDigest);
    }
  });

  it("reports invalid JSON, invalid scenarios, bad seeds and unknown clients readably", async () => {
    const cases: Array<[Parameters<typeof runConfig>[0], RegExp]> = [
      [{ scenarioText: "{nope", seed: 1, clientId: "corrected" }, /not valid JSON/],
      [{ scenarioText: JSON.stringify({ schemaVersion: "1", name: "x" }), seed: 1, clientId: "corrected" }, /Invalid scenario/],
      [{ scenarioText: scenario("baseline-withdrawal"), seed: -1, clientId: "corrected" }, /seed must be an integer/],
      [{ scenarioText: scenario("baseline-withdrawal"), seed: 1.5, clientId: "corrected" }, /seed must be an integer/],
      [{ scenarioText: scenario("baseline-withdrawal"), seed: 1, clientId: "nope" }, /Unknown client/],
    ];
    for (const [opts, re] of cases) {
      const r = await runConfig(opts);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(re);
    }
  });
});

describe("engine pairing", () => {
  it("the stamp matches the committed artifact byte for byte", () => {
    const tgz = readdirSync("vendor").find((f) => f.endsWith(".tgz"))!;
    expect(PAIRING.artifact).toBe(tgz);
    expect(PAIRING.sha256).toBe(createHash("sha256").update(readFileSync(`vendor/${tgz}`)).digest("hex"));
    expect(JSON.parse(readFileSync("package.json", "utf8")).dependencies["@anasabubakar/raillab-engine"]).toBe(`file:vendor/${tgz}`);
  });

  it("the installed engine is the stamped version", () => {
    const installed = JSON.parse(readFileSync("node_modules/@anasabubakar/raillab-engine/package.json", "utf8"));
    expect(installed.version).toBe(PAIRING.version);
  });
});

describe("pairing file", () => {
  it("compat.json lists exactly the stamped engine as tested", () => {
    const compat = JSON.parse(readFileSync("compat.json", "utf8"));
    expect(compat.pairs).toContainEqual({ engine: PAIRING.package, version: PAIRING.version, sessionVersion: PAIRING.sessionVersion, scenarioVersion: PAIRING.scenarioVersion, status: "tested" });
  });
});

describe("saved session consistency", () => {
  it("accepts every session the engine produces and rejects a hidden failure, a forged assertion and a changed timeline", async () => {
    for (const s of SCENARIOS) {
      for (const c of ["corrected", "defective"]) {
        const r = await runConfig({ scenarioText: s.json, seed: 3, clientId: c });
        if (!r.ok) throw new Error(r.error);
        expect(sessionProblem(JSON.parse(JSON.stringify(r.session))), `${s.name}/${c}`).toBeNull();
      }
    }
    const bad = await runConfig({ scenarioText: scenario("baseline-withdrawal"), seed: 1, clientId: "defective" });
    if (!bad.ok) throw new Error(bad.error);
    const base = JSON.parse(JSON.stringify(bad.session));
    expect(base.result.verdict).toBe("fail");
    const hidden = structuredClone(base);
    hidden.result.verdict = "pass";
    expect(sessionProblem(hidden)).toMatch(/verdict/);
    const forged = structuredClone(base);
    forged.result.assertions.forEach((a: { outcome: string }) => (a.outcome = "pass"));
    forged.result.verdict = "pass";
    expect(sessionProblem(forged)).toMatch(/assertion results/);
    const edited = structuredClone(base);
    edited.timeline = edited.timeline.filter((e: { kind: string }, i: number) => !(e.kind === "consumer" && i % 3 === 0));
    expect(sessionProblem(edited)).not.toBeNull();
  });
});
