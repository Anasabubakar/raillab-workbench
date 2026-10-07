import type { RequestEvent, Session, TransitionEvent } from "@anasabubakar/raillab-engine";

const NS = "http://www.w3.org/2000/svg";
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text?: string): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

const W = 900;
const LEFT = 120;
const RIGHT = 20;

/** One swimlane diagram: what the anchor really was, what the consumer was served, and what the user was told. */
export function lanes(session: Session): SVGSVGElement {
  const end = Math.max(session.endedAtMs, 1);
  const x = (t: number) => LEFT + (t / end) * (W - LEFT - RIGHT);
  const svg = s("svg", { viewBox: `0 0 ${W} 190`, role: "img", class: "lanes" });
  svg.append(s("title", {}, "Timeline: anchor status, responses served and messages shown to the user"));
  const laneLabel = (y: number, t: string) => svg.append(s("text", { x: 8, y: y + 4, class: "lane-label" }, t));
  laneLabel(30, "Anchor (truth)");
  laneLabel(95, "Served");
  laneLabel(160, "User told");
  for (const y of [30, 95, 160]) svg.append(s("line", { x1: LEFT, x2: W - RIGHT, y1: y, y2: y, class: "lane-line" }));

  const tr = session.timeline.filter((e): e is TransitionEvent => e.kind === "anchor_transition");
  tr.forEach((e, i) => {
    const next = tr[i + 1]?.atMs ?? end;
    const terminal = ["completed", "refunded"].includes(e.to);
    svg.append(s("rect", { x: x(e.atMs), y: 14, width: Math.max(x(next) - x(e.atMs), 2), height: 32, class: `seg ${terminal ? "seg-done" : "seg-pending"}`, "data-status": e.to }));
    if (x(next) - x(e.atMs) > 60) svg.append(s("text", { x: x(e.atMs) + 4, y: 34, class: "seg-text" }, e.to.replace("pending_", "").replace(/_/g, " ")));
  });

  const reqs = session.timeline.filter((e): e is RequestEvent => e.kind === "request" && e.pollIndex !== null);
  for (const r of reqs) {
    const cls = r.httpStatus >= 500 ? "dot-err" : r.httpStatus === 403 ? "dot-auth" : "dot-ok";
    const cx = x(r.atMs);
    if (r.reordered) svg.append(s("path", { d: `M${cx} 85 l8 10 l-8 10 l-8 -10 z`, class: "mark-reordered", "data-poll": r.pollIndex! }));
    else svg.append(s("circle", { cx, cy: 95, r: 5, class: cls, "data-poll": r.pollIndex! }));
    if (r.duplicate) svg.append(s("circle", { cx, cy: 95, r: 9, class: "mark-dup" }));
    if (r.mismatchedId) svg.append(s("path", { d: `M${cx - 6} 89 l12 12 m0 -12 l-12 12`, class: "mark-wrong" }));
  }

  const told = session.timeline.flatMap((e) => (e.kind === "consumer" && e.event.event === "user_status" ? [{ at: e.atMs, status: e.event.status }] : []));
  for (const t of told) svg.append(s("rect", { x: x(t.at) - 5, y: 150, width: 10, height: 20, rx: 3, class: `told told-${t.status}`, "data-told": t.status }));
  return svg;
}
