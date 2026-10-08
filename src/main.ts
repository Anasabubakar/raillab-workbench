import "./style.css";
import { z } from "zod";
import { parseSession, type Session } from "@anasabubakar/raillab-engine";
import { h } from "./dom.ts";
import { CLIENTS, PAIRING, SCENARIOS, runConfig, sessionProblem } from "./state.ts";
import { renderSession } from "./view.ts";

// Zod's JIT compiles validators with new Function, which a strict CSP forbids. Turn it off.
z.config({ jitless: true });

interface State {
  scenarioName: string;
  scenarioText: string;
  seed: string;
  clientId: string;
  compareId: string;
  sessions: Array<{ title: string; session: Session }>;
  error: string | null;
  busy: boolean;
}

const state: State = { scenarioName: SCENARIOS[0]!.name, scenarioText: SCENARIOS[0]!.json, seed: "1", clientId: "defective", compareId: "corrected", sessions: [], error: null, busy: false };

async function run(): Promise<void> {
  state.busy = true;
  state.error = null;
  render();
  const seed = Number(state.seed);
  const ids = [state.clientId, ...(state.compareId && state.compareId !== state.clientId ? [state.compareId] : [])];
  const out: State["sessions"] = [];
  for (const id of ids) {
    const r = await runConfig({ scenarioText: state.scenarioText, seed, clientId: id });
    if (!r.ok) {
      state.error = r.error;
      state.sessions = [];
      state.busy = false;
      render();
      return;
    }
    out.push({ title: CLIENTS.find((c) => c.id === id)!.label, session: r.session });
  }
  state.sessions = out;
  state.busy = false;
  render();
}

function render(): void {
  const active = document.activeElement as HTMLInputElement | null;
  const restore = active?.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  const root = document.getElementById("app")!;
  root.replaceChildren();

  const scenario = h("select", { id: "scenario", "aria-label": "Bundled scenario" }, ...SCENARIOS.map((s) => h("option", { value: s.name }, s.title)), h("option", { value: "custom" }, "Custom (edited below)"));
  scenario.value = state.scenarioName;
  scenario.addEventListener("change", () => {
    state.scenarioName = scenario.value;
    const s = SCENARIOS.find((x) => x.name === scenario.value);
    if (s) state.scenarioText = s.json;
    state.sessions = [];
    render();
  });
  const clientOptions = (selected: string, withNone: boolean) => {
    const sel = h("select", {}, ...(withNone ? [h("option", { value: "" }, "None")] : []), ...CLIENTS.map((c) => h("option", { value: c.id }, c.label)));
    sel.value = selected;
    return sel;
  };
  const client = clientOptions(state.clientId, false);
  client.id = "client";
  client.setAttribute("aria-label", "Client under test");
  client.addEventListener("change", () => (state.clientId = client.value));
  const compare = clientOptions(state.compareId, true);
  compare.id = "compare";
  compare.setAttribute("aria-label", "Second client to compare");
  compare.addEventListener("change", () => (state.compareId = compare.value));
  const seed = h("input", { id: "seed", type: "number", min: "0", max: "4294967295", value: state.seed, "aria-label": "Seed" });
  seed.addEventListener("input", () => (state.seed = seed.value));
  const text = h("textarea", { id: "scenario-json", rows: "14", spellcheck: "false", "aria-label": "Scenario JSON" });
  text.value = state.scenarioText;
  text.addEventListener("input", () => {
    state.scenarioText = text.value;
    state.scenarioName = "custom";
    scenario.value = "custom";
  });
  const go = h("button", { type: "button", id: "run" }, state.busy ? "Running…" : "Run");
  go.addEventListener("click", () => void run());
  if (state.busy) go.setAttribute("disabled", "");

  const file = h("input", { id: "session-file", type: "file", accept: "application/json,.json", "aria-label": "Open a saved session JSON" });
  file.addEventListener("change", async () => {
    const f = file.files?.[0];
    if (!f) return;
    try {
      const parsed = parseSession(JSON.parse(await f.text()));
      if (!parsed.ok) throw new Error(parsed.error);
      const problem = sessionProblem(parsed.session);
      if (problem) throw new Error(problem);
      state.sessions = [{ title: `Opened: ${f.name}`, session: parsed.session }];
      state.error = null;
    } catch (e) {
      state.error = `Not a valid RailLab session: ${e instanceof Error ? e.message : String(e)}`;
      state.sessions = [];
    }
    render();
  });
  const save = h("button", { type: "button", id: "save", class: "secondary" }, "Download first session as JSON");
  save.addEventListener("click", () => {
    const first = state.sessions[0];
    if (!first) return;
    const blob = new Blob([JSON.stringify(first.session, null, 2) + "\n"], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `raillab-${first.session.scenario.name}-seed${first.session.seed}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  if (state.sessions.length === 0) save.setAttribute("disabled", "");

  root.append(
    h("header", { class: "site" }, h("h1", {}, "RailLab workbench"), h("p", { class: "tag" }, "Make the anchor fail in the lab before the wallet fails for a user.")),
    h("p", { class: "sim-banner", role: "note" }, "Everything here is simulated: the anchor, its bank, every identifier and every payment. Nothing touches a real bank, a real anchor or the Stellar network. The scenario server and the clients below are the real engine code, running in your browser."),
    h(
      "section",
      { class: "controls", "aria-labelledby": "cfg" },
      h("h2", { id: "cfg" }, "Configure and run"),
      h("div", { class: "grid" }, h("label", { for: "scenario" }, "Scenario"), scenario, h("label", { for: "client" }, "Client under test"), client, h("label", { for: "compare" }, "Compare with"), compare, h("label", { for: "seed" }, "Seed"), seed),
      h("details", {}, h("summary", {}, "Scenario JSON (edit to build your own)"), text, h("p", { class: "muted small" }, "Faults: transient_error, duplicate_response, stale_snapshot, latency, mismatched_reference, token_expiry. Name polls with onPolls, or use a probability or a time window. Same scenario and seed always give the same timeline.")),
      h("div", { class: "actions" }, go, save, h("label", { for: "session-file", class: "file-label" }, "Open a saved session"), file),
      h("p", { class: "muted small" }, CLIENTS.find((c) => c.id === state.clientId)?.note ?? ""),
    ),
  );
  if (state.error) root.append(h("pre", { class: "error", role: "alert" }, state.error));
  if (state.sessions.length === 0 && !state.error) root.append(h("div", { class: "empty" }, h("p", {}, "Press Run. The defective client against the baseline scenario is a good start: it tells the user the withdrawal is complete while the anchor is still processing.")));
  if (state.sessions.length > 0) {
    const grid = h("div", { class: state.sessions.length > 1 ? "results two" : "results" }, ...state.sessions.map((s) => renderSession(s.session, s.title)));
    root.append(grid);
    if (state.sessions.length === 2 && state.sessions[0]!.session.scenario.name === state.sessions[1]!.session.scenario.name) {
      const same = state.sessions[0]!.session.timelineDigest === state.sessions[1]!.session.timelineDigest;
      root.append(h("p", { class: "muted small", id: "digest-note" }, same ? "Both runs produced the identical timeline, so the clients saw exactly the same anchor behavior." : "The two clients produced different timelines because their own requests differ (each request advances virtual time and each client polls differently). The anchor schedule and seed are the same."));
    }
  }
  root.append(h("footer", { class: "site" }, h("p", { class: "muted small" }, `Engine ${PAIRING.package} ${PAIRING.version} (artifact sha256 ${PAIRING.sha256.slice(0, 12)}). Rules marked "SEP-24 requirement" cite the specification; "Application policy" rules are choices, not standards. No wallet or anchor maintainer has reviewed these scenarios.`)));

  if (restore) {
    const el = document.getElementById(restore.id) as HTMLInputElement | null;
    if (el) {
      el.focus();
      try {
        el.setSelectionRange(restore.start, restore.end);
      } catch {
        /* selects have no selection range */
      }
    }
  }
}

render();
