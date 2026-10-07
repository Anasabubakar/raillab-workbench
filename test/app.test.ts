import { beforeEach, describe, expect, it, vi } from "vitest";
import { runConfig, SCENARIOS } from "../src/state.ts";

async function boot() {
  document.body.innerHTML = '<main id="app"></main>';
  vi.resetModules();
  await import("../src/main.ts");
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const click = async (id: string) => {
  (document.getElementById(id) as HTMLButtonElement).click();
  await flush();
  await flush();
};
const set = (id: string, v: string) => {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  el.value = v;
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? "change" : "input"));
};

describe("workbench app", () => {
  beforeEach(() => document.body.replaceChildren());

  it("states the simulation boundary up front and starts empty", async () => {
    await boot();
    expect(document.body.textContent).toMatch(/Everything here is simulated/);
    expect(document.querySelector(".empty")).not.toBeNull();
    expect(document.querySelector("[data-verdict]")).toBeNull();
  });

  it("runs the defective and corrected clients side by side on the same scenario", async () => {
    await boot();
    await click("run");
    const sessions = [...document.querySelectorAll("section.session")];
    expect(sessions.map((s) => s.getAttribute("data-verdict"))).toEqual(["fail", "pass"]);
    expect(document.getElementById("digest-note")).not.toBeNull();
  });

  it("changes outcomes when the user picks another scenario and client", async () => {
    await boot();
    set("scenario", "transient-outage");
    set("client", "mutant:retryTransient");
    set("compare", "");
    await click("run");
    const sessions = document.querySelectorAll("section.session");
    expect(sessions.length).toBe(1);
    expect(document.querySelector('[data-rule="retries-transient-errors"]')!.getAttribute("data-outcome")).toBe("fail");
  });

  it("marks an edited scenario as custom and reports invalid JSON without crashing", async () => {
    await boot();
    set("scenario-json", "{broken");
    expect((document.getElementById("scenario") as HTMLSelectElement).value).toBe("custom");
    await click("run");
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/not valid JSON/);
    expect(document.querySelector("section.session")).toBeNull();
  });

  it("runs a user-edited scenario, not a canned result", async () => {
    await boot();
    const edited = JSON.parse(SCENARIOS[0]!.json);
    edited.faults = [{ type: "transient_error", status: 503, onPolls: [3] }];
    set("scenario-json", JSON.stringify(edited));
    set("client", "mutant:retryTransient");
    set("compare", "");
    await click("run");
    expect(document.querySelector('[data-rule="retries-transient-errors"]')!.getAttribute("data-outcome")).toBe("fail");
  });

  it("rejects a bad seed with a readable message", async () => {
    await boot();
    set("seed", "-4");
    await click("run");
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/seed must be an integer/);
  });

  it("opens a saved session and rejects tampered ones", async () => {
    await boot();
    const r = await runConfig({ scenarioText: SCENARIOS[0]!.json, seed: 1, clientId: "defective" });
    if (!r.ok) throw new Error(r.error);
    const good = new File([JSON.stringify(r.session)], "s.json", { type: "application/json" });
    const input = document.getElementById("session-file") as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [good], configurable: true });
    input.dispatchEvent(new Event("change"));
    await flush();
    await flush();
    expect(document.querySelector("section.session")?.getAttribute("data-verdict")).toBe("fail");

    const input2 = document.getElementById("session-file") as HTMLInputElement;
    const tampered = new File([JSON.stringify({ ...r.session, safetyScore: 9 })], "t.json", { type: "application/json" });
    Object.defineProperty(input2, "files", { value: [tampered], configurable: true });
    input2.dispatchEvent(new Event("change"));
    await flush();
    await flush();
    expect(document.querySelector('[role="alert"]')?.textContent).toMatch(/Not a valid RailLab session/);
  });
});
