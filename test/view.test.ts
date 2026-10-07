import { beforeEach, describe, expect, it } from "vitest";
import { lanes } from "../src/lanes.ts";
import { runConfig, SCENARIOS } from "../src/state.ts";
import { renderSession, ruleRow, timelineTable } from "../src/view.ts";

const get = async (name: string, clientId: string, seed = 1) => {
  const r = await runConfig({ scenarioText: SCENARIOS.find((s) => s.name === name)!.json, seed, clientId });
  if (!r.ok) throw new Error(r.error);
  return r.session;
};
beforeEach(() => document.body.replaceChildren());

describe("rule rows", () => {
  it("label every rule as a SEP-24 requirement or an application policy and show the evidence", async () => {
    const s = await get("baseline-withdrawal", "defective");
    const el = renderSession(s, "Defective");
    const rows = [...el.querySelectorAll("[data-rule]")];
    expect(rows.length).toBe(8);
    expect(rows.filter((r) => r.getAttribute("data-kind") === "sep").length).toBe(3);
    const early = el.querySelector('[data-rule="no-early-completion"]')!;
    expect(early.getAttribute("data-outcome")).toBe("fail");
    expect(early.textContent).toMatch(/SEP-24 requirement/);
    expect(early.textContent).toMatch(/told "completed" while the anchor status was "pending_anchor"/);
    expect(el.querySelector('[data-rule="idempotent-business-actions"]')!.textContent).toMatch(/Application policy/);
  });

  it("renders hostile strings as text", () => {
    const row = ruleRow({ id: "x", title: '<img src=x onerror="window.__pwned=1">', kind: "policy", basis: "<script>1</script>", outcome: "fail", evidence: ["<b>bold</b>"] });
    document.body.append(row);
    expect(document.querySelector("img, script, b")).toBeNull();
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
    expect(row.textContent).toContain("<b>bold</b>");
  });
});

describe("session view", () => {
  it("shows the verdict, counts, fingerprint and a full timeline table that agrees with the session", async () => {
    const s = await get("reordered-and-repeated", "corrected");
    const el = renderSession(s, "Corrected");
    expect(el.getAttribute("data-verdict")).toBe("pass");
    expect(el.textContent).toContain(s.timelineDigest);
    const table = timelineTable(s);
    expect(table.querySelectorAll("tbody tr").length).toBe(s.timeline.length);
    expect(table.textContent).toMatch(/reordered/);
    expect(table.textContent).toMatch(/repeat/);
  });
});

describe("swimlane diagram", () => {
  it("draws one served marker per poll and flags reordered, repeated and wrong-id responses", async () => {
    const reordered = await get("reordered-and-repeated", "corrected");
    const svg = lanes(reordered);
    const polls = reordered.timeline.filter((e) => e.kind === "request" && e.pollIndex !== null);
    expect(svg.querySelectorAll("[data-poll]").length).toBe(polls.length);
    expect(svg.querySelectorAll(".mark-reordered").length).toBe(polls.filter((e) => e.kind === "request" && e.reordered).length);
    expect(svg.querySelectorAll(".mark-dup").length).toBe(1);
    const wrong = lanes(await get("mismatched-reference", "corrected"));
    expect(wrong.querySelectorAll(".mark-wrong").length).toBe(2);
  });

  it("draws the user's messages and the anchor's truth", async () => {
    const s = await get("baseline-withdrawal", "defective");
    const svg = lanes(s);
    expect(svg.querySelector('[data-told="completed"]')).not.toBeNull();
    expect([...svg.querySelectorAll("rect.seg")].map((r) => r.getAttribute("data-status"))).toContain("pending_anchor");
    expect(svg.querySelector("title")?.textContent).toMatch(/Timeline/);
  });
});
