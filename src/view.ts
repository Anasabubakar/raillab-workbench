import type { AssertionResult, Session, TimelineEvent } from "@anas.abubakar/raillab-engine";
import { h } from "./dom.ts";
import { lanes } from "./lanes.ts";

const OUTCOME_LABEL: Record<string, string> = { pass: "Pass", fail: "Fail", not_applicable: "Not applicable", inconclusive: "Inconclusive" };
const KIND_HELP: Record<string, string> = {
  sep: "Follows from the SEP-24 text",
  policy: "An application policy: robust behavior that no standard requires",
};

export function ruleRow(a: AssertionResult): HTMLElement {
  return h(
    "article",
    { class: `rule rule-${a.outcome}`, "data-rule": a.id, "data-outcome": a.outcome, "data-kind": a.kind },
    h("header", {}, h("span", { class: `outcome outcome-${a.outcome}` }, OUTCOME_LABEL[a.outcome]), h("span", { class: `kind kind-${a.kind}`, title: KIND_HELP[a.kind] }, a.kind === "sep" ? "SEP-24 requirement" : "Application policy")),
    h("h4", {}, a.title),
    a.evidence.length > 0 && h("ul", { class: "plain evidence" }, ...a.evidence.map((e) => h("li", {}, e))),
    h("details", {}, h("summary", {}, "Basis"), h("p", { class: "muted small" }, a.basis)),
  );
}

function describe(e: TimelineEvent): { cls: string; text: string; flags: string } {
  if (e.kind === "anchor_transition") return { cls: "row-anchor", text: `Anchor: ${e.from ?? "(start)"} → ${e.to}`, flags: "" };
  if (e.kind === "consumer") {
    const ev = e.event;
    const text = ev.event === "user_status" ? `User told: ${ev.status}` : ev.event === "business_action" ? `Action: ${ev.action}` : ev.event === "status_applied" ? `Applied: ${ev.status} (poll ${ev.pollIndex})` : ev.event === "response_ignored" ? `Ignored poll ${ev.pollIndex}: ${ev.reason}` : ev.event === "auth_refreshed" ? "Re-authenticated" : `Gave up: ${ev.reason}`;
    return { cls: "row-consumer", text, flags: "" };
  }
  const flags = [e.reordered && "reordered", e.duplicate && "repeat", e.mismatchedId && "wrong id", e.authFailure && "403", ...e.faults.filter((f) => f.type !== "token_expiry").map((f) => f.type.replace(/_/g, " "))].filter(Boolean) as string[];
  const served = e.servedStatus ? ` → ${e.servedStatus}` : "";
  return { cls: e.httpStatus >= 400 ? "row-error" : "row-request", text: `${e.method} ${e.path.split("?")[0]} ${e.httpStatus}${served}`, flags: [...new Set(flags)].join(", ") };
}

export function timelineTable(session: Session): HTMLElement {
  const rows = session.timeline.map((e) => {
    const d = describe(e);
    return h("tr", { class: d.cls, "data-kind": e.kind }, h("td", {}, `${e.atMs}`), h("td", {}, e.kind === "request" ? (e.pollIndex ? `#${e.n} (poll ${e.pollIndex})` : `#${e.n}`) : ""), h("td", {}, d.text), h("td", {}, d.flags));
  });
  return h("div", { class: "table-wrap" }, h("table", { class: "timeline" }, h("thead", {}, h("tr", {}, ...["Virtual ms", "Request", "Event", "Fault / flag"].map((t) => h("th", { scope: "col" }, t)))), h("tbody", {}, ...rows)));
}

export function renderSession(session: Session, title: string): HTMLElement {
  const v = session.result.verdict;
  const counts = { pass: 0, fail: 0, not_applicable: 0, inconclusive: 0 } as Record<string, number>;
  for (const a of session.result.assertions) counts[a.outcome] = (counts[a.outcome] ?? 0) + 1;
  return h(
    "section",
    { class: "session", "data-verdict": v, "aria-label": title },
    h("header", { class: "session-head" }, h("h3", {}, title), h("span", { class: `verdict verdict-${v}` }, v === "pass" ? "All applicable rules passed" : v === "fail" ? "A rule failed" : "Inconclusive")),
    h("p", { class: "muted small" }, `Scenario ${session.scenario.name}, seed ${session.seed}. Timeline fingerprint `, h("code", {}, session.timelineDigest), `. ${session.endedAtMs} virtual ms.`),
    h("p", { class: "counts" }, `${counts.pass} passed, ${counts.fail} failed, ${counts.inconclusive} inconclusive, ${counts.not_applicable} not applicable`),
    session.consumerError && h("p", { class: "error" }, `Consumer problem: ${session.consumerError}`),
    h("div", { class: "lanes-wrap" }, lanes(session) as unknown as Node),
    h("div", { class: "legend small muted" }, "Served: circle = normal, red = 5xx, orange = 403, diamond = reordered (older than one already served), ring = exact repeat, cross = wrong transaction id."),
    h("div", { class: "rules" }, ...session.result.assertions.map(ruleRow)),
    h("details", { class: "timeline-details" }, h("summary", {}, `Full timeline (${session.timeline.length} events)`), timelineTable(session)),
  );
}
