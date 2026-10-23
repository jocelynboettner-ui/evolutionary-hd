// workbookPdf.js — printable, client-side personalized workbook + shared cycle-summary pages.
import { jsPDF } from "jspdf";
import { wandLinkLines, wandWiringText } from "../../backend/natal-wand.js";
import { cyclePlanetLine } from "../../backend/planet-meanings.js";

export const clean = (t) => String(t || "")
  .replace(/\r/g, "").replace(/\*\*(.+?)\*\*/g, "$1")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2014/g, " - ").replace(/\u2013/g, "-").replace(/\u2026/g, "...").replace(/\u2192/g, "->").replace(/\u2022/g, "-")
  .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF]/g, "");

const ink = [25, 22, 30], gold = [140, 100, 20], muted = [90, 85, 95], red = [170, 50, 40];

// Small text-flow writer over a jsPDF doc.
export function writer(doc) {
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const w = { doc, W, H, M: 72, y: 72 };
  w.maxW = W - 2 * w.M;
  w.ensure = (h) => { if (w.y + h > H - w.M) { doc.addPage(); w.y = w.M; } };
  w.page = () => { doc.addPage(); w.y = w.M; };
  w.text = (t, { font = "times", style = "normal", size = 12, color = ink, indent = 0, gap = 0.5, lh = 1.5, align } = {}) => {
    doc.setFont(font, style); doc.setFontSize(size); doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(t), w.maxW - indent);
    lines.forEach(l => { w.ensure(size * lh); doc.text(l, align === "center" ? W / 2 : w.M + indent, w.y, align ? { align } : undefined); w.y += size * lh; });
    w.y += size * gap;
  };
  w.h1 = (t) => { w.ensure(60); w.text(t, { style: "bold", size: 20, color: gold, gap: 0.6 }); };
  w.h2 = (t) => { w.ensure(50); w.y += 4; w.text(t, { font: "helvetica", style: "bold", size: 11, color: gold, gap: 0.3 }); };
  w.rule = () => { doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(w.M, w.y, W - w.M, w.y); w.y += 16; };
  w.lines = (n, step = 24) => { doc.setDrawColor(190, 185, 195); doc.setLineWidth(0.4); for (let i = 0; i < n; i++) { w.ensure(step); w.y += step; doc.line(w.M, w.y - 6, W - w.M, w.y - 6); } w.y += 8; };
  return w;
}

// One cycle's structured initiation summary (used in the reading PDF and the workbook).
function actualWindowText(c) {
  const pk = new Date(c.peakDate); if (isNaN(pk)) return "peak " + c.peakDate;
  const d = y => new Date(pk.getTime() + y * 365.25 * 864e5).toISOString().slice(0, 7);
  return c.key === "chironReturn" ? `opened ${d(-3.5)}, peak ${c.peakDate}, permanent overlay for life` : `${d(-3.5)} to ${d(3.5)}, peak ${c.peakDate}`;
}

export function renderCycleSummary(w, c) {
  w.h1(`${c.label} - The Initiation of This Season`);
  const pl = c.planetLine || cyclePlanetLine(c.key);
  if (pl) w.text(pl, { style: "italic", gap: 0.3 });
  w.text(`Your window (from your chart): ${actualWindowText(c)}.${c.window ? ` Typical window: ${c.window}.` : ""}`, { size: 11, color: muted, gap: 0.2 });
  w.text(`Your natal design is who you are and never changes; these are the energies flowing through it in this season, and your natal authority still chooses.`, { style: "italic", color: muted });
  w.h2("PROFILE YOU ARE LEARNING");
  w.text(`${c.profile.cycle}   (home base ${c.profile.natal})`, { size: 14, style: "bold" });
  w.h2(c.key === "chironReturn" ? "YOUR SECOND-HALF-OF-LIFE PURPOSE" : "CROSS OF THIS SEASON");
  w.text(c.cross.cycle, { size: 13, style: "bold" });
  (c.cross.gateKeys || []).forEach(g => g.geneKey && w.text(`Gate ${g.gate}: ${g.geneKey.shadow} -> ${g.geneKey.gift} -> ${g.geneKey.siddhi}`, { size: 11, indent: 12, gap: 0.1 }));
  w.text(`Home base: ${c.cross.natal}`, { size: 10.5, color: muted });
  w.h2("TYPE INITIATION");
  w.text(c.type.shifted ? `${c.type.cycle}   (home base ${c.type.natal})` : `${c.type.cycle} (same as natal)`, { size: 13, style: "bold" });
  if (c.type.shifted && c.type.info) {
    w.text(`Strategy: ${c.type.info.strategy}.  Signature: ${c.type.info.signature}.  Not-self: ${c.type.info.notSelf}.`, { size: 11 });
    w.text(`It asks you to ${c.type.info.asks}.`, { size: 11, style: "italic" });
  }
  if (c.authority.shifted) w.text(`Practicing ${c.authority.cycle} awareness; your natal ${c.authority.natal} authority remains your decision-maker.`, { size: 11, color: muted });
  w.h2("YOUR MAGIC WAND - WHAT THIS CYCLE OVERLAYS");
  if (c.magicWand.newCenters.length) w.text("New strengths that switch on (centers): " + c.magicWand.newCenters.map(x => `${x.center} (${x.gift})`).join("; "), { size: 11 });
  c.magicWand.channels.forEach(ch => w.text(`New superhighway: ${ch.label}${ch.natalGate ? ` - your natal Gate ${ch.natalGate} met by Gate ${ch.newGates.join(" & ")}` : " - fully new"}`, { size: 11, style: "bold", gap: 0.15 }));
  w.y += 4;
  c.magicWand.newGates.forEach(g => {
    w.ensure(48);
    w.text(`Gate ${g.gate} (${g.center})` + (g.geneKey ? `   ${g.geneKey.shadow} -> ${g.geneKey.gift} -> ${g.geneKey.siddhi}` : ""), { font: "helvetica", style: "bold", size: 10, gap: 0.05 });
    if (g.planets.length) w.text(g.planets.map(p => `${p.side} ${p.planet} ${g.gate}.${p.line} - ${p.meaning}`).join("; "), { size: 10, color: red, indent: 12, gap: 0.3 });
  });
  const nw = c.natalWand;
  if (nw?.natalSun) {
    w.h2("YOUR NATAL WAND IN THIS SEASON");
    w.text(`Natal Sun ${nw.natalSun.gate}.${nw.natalSun.line}${nw.natalSun.gift ? ` (${nw.natalSun.gift})` : ""}` + (nw.cycleSun ? `   -   this season's Sun ${nw.cycleSun.gate}.${nw.cycleSun.line}` : ""), { size: 11, style: "bold", gap: 0.2 });
    wandLinkLines(nw).forEach(t => w.text(t, { size: 10.5, indent: 12, gap: 0.15 }));
  }
}

// The natal Magic Wand (the conscious Sun gate.line alone), shared by the reading PDF and the workbook.
export function renderNatalWand(w, wand, { title = "YOUR MAGIC WAND - YOUR CONSCIOUS SUN" } = {}) {
  if (!wand?.sun) return;
  w.h2(title);
  w.text("Your conscious Sun. In Human Design the Sun carries about 70% of your imprint, so it is about 70% of your soul's purpose.", { size: 11, style: "italic", color: muted, gap: 0.3 });
  [["Sun", wand.sun, "what you radiate"]].forEach(([role, p, note]) => {
    if (!p) return;
    w.ensure(60);
    w.text(`${role}${p.name ? "  " + p.name : ""}  (Gate ${p.gate}; ${note})`, { font: "helvetica", style: "bold", size: 10.5, gap: 0.1 });
    const det = [p.keynote, p.lineDescription].filter(Boolean).join("  -  ");
    if (det) w.text(det, { size: 10.5, indent: 12, gap: 0.1 });
    if (p.geneKey) w.text(`Gene Key ${p.gate}: ${p.geneKey.shadow} -> ${p.geneKey.gift} -> ${p.geneKey.siddhi}`, { size: 10.5, indent: 12, color: red, gap: 0.1 });
    const wire = wandWiringText(p);
    if (wire) w.text(wire, { size: 10.5, indent: 12, gap: 0.3 });
  });
  w.text(`How you wield it: ${wand.type}${wand.strategy ? ` (${wand.strategy})` : ""}, ${wand.authority}: ${wand.wield}.`, { size: 11, gap: 0.4 });
}

const keyRank = (c, g) => (c.magicWand.channels.some(ch => ch.newGates.includes(g)) ? 2 : 0) + ((c.cross.gates || []).includes(g) ? 1 : 0);

// The workbook goes deep on ONE cycle (owner's direction): the cycle the person is in now (an open window),
// otherwise the most recently completed one. Uses the server's cycle status when given; otherwise computes it
// from each cycle's peak date (7-year window, Chiron permanent after it opens).
const YEAR_MS = 365.25 * 864e5;
const cycleWindow = (c) => {
  const pk = new Date(c.peakDate).getTime();
  return { start: pk - 3.5 * YEAR_MS, end: c.key === "chironReturn" ? Infinity : pk + 3.5 * YEAR_MS };
};
export function pickFocusCycle(enrichment = [], status = null, now = new Date()) {
  const byKey = (k) => k && enrichment.find(c => c.key === k);
  if (status) {
    const f = byKey(status.active?.[0]?.key) || byKey(status.focus?.key) || byKey(status.recent?.key);
    if (f) return f;
  }
  const t = now.getTime();
  const dated = enrichment.map(c => ({ c, ...cycleWindow(c) })).filter(x => !isNaN(x.start) && x.start <= t).sort((a, b) => b.start - a.start);
  const open = dated.find(x => t <= x.end);
  return (open || dated[0])?.c || enrichment[enrichment.length - 1] || null;
}
const isOpenNow = (c, status, now = new Date()) => {
  const s = [...(status?.active || [])].find(x => x.key === c.key);
  if (status) return !!s;
  const { start, end } = cycleWindow(c); const t = now.getTime(); return t >= start && t <= end;
};

export function buildWorkbookPdf({ name, birthdata, natal, enrichment = [], workbook, status = null, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const w = writer(doc);
  const wb = workbook || {};
  const nm = clean(name || "Your");
  const focus = pickFocusCycle(enrichment, status, generatedAt);
  const others = enrichment.filter(c => c !== focus);
  // Cover
  w.y = 200;
  w.text("LIT BY DESIGN", { font: "helvetica", style: "bold", size: 11, color: gold, align: "center" });
  w.text("The Living Blueprint Workbook", { style: "bold", size: 26, align: "center" });
  w.text("A companion to Your Missing Map: the map, and then the workbook to live it", { style: "italic", size: 13, color: muted, align: "center" });
  if (name) w.text(nm, { size: 20, align: "center" });
  const bd = birthdata || {};
  if (bd.birthdate) w.text(["Born " + bd.birthdate, bd.birthtime, bd.location].filter(Boolean).join("  -  "), { font: "helvetica", size: 11, color: muted, align: "center" });
  w.text("Prepared " + generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { font: "helvetica", size: 11, color: muted, align: "center" });
  // Intro
  w.page(); w.h1("Welcome");
  w.text(wb.themes?.intro || `${name ? nm + ", this" : "This"} workbook accompanies Your Missing Map, your Human Design reading. The reading is your map; this workbook is how you live it. Move through it slowly. Your natal design is who you are and it never changes; each cycle you have lived added energies that flow through that design, and your natal authority still chooses which to follow. Use these pages to notice, practice and integrate.`);
  if (focus) w.text(`These pages focus on ${focus.label}, the season ${isOpenNow(focus, status, generatedAt) ? "you are in now" : "you most recently walked"}: the centers, gates and channels it brings online, with practices and journal space to live them.`);
  w.text("How to use this workbook: read one page at a time, try the practices for a week, and write freely in the space provided. There are no wrong answers.", { style: "italic", color: muted });
  // Natal home base
  w.page(); w.h1("Your Home Base - Natal Design");
  if (wb.themes?.homeBase) w.text(wb.themes.homeBase);
  if (natal) {
    [["Type", natal.type], ["Authority", natal.authority], ["Profile", natal.profile], ["Incarnation Cross", natal.incarnation_cross],
     ["Defined Centers", (natal.defined_centers || []).join(", ")], ["Channels", (natal.channels || []).join(", ")]].forEach(([k, v]) => {
      if (!v) return; w.h2(k.toUpperCase()); w.text(String(v).replace(/_+/g, " "), { size: 13 });
    });
  }
  w.h2("REFLECTION"); w.text("Where in your life do you already feel most at home in your design?", { style: "italic" }); w.lines(6);
  if (natal?.wand?.sun) {
    renderNatalWand(w, natal.wand);
    w.h2("REFLECTION"); w.text(`Where did your Gate ${natal.wand.sun.gate}${natal.wand.sun.geneKey ? " gift of " + natal.wand.sun.geneKey.gift : ""} move through you this week, and what did your ${natal.wand.authority || "authority"} say about where to point it?`, { style: "italic" }); w.lines(5);
  }
  // Focus cycle only: full initiation summary (centers, gates, channels), integration and journal pages.
  (focus ? [focus] : []).forEach(c => {
    const cw = wb.cycles?.[c.key] || {};
    w.page(); renderCycleSummary(w, c);
    w.page(); w.h1(`${c.label} - Integration`);
    if (cw.cycleReflection) w.text(cw.cycleReflection, { style: "italic" });
    if (c.key === "chironReturn" && wb.purpose?.purposeReflection) { w.h2("YOUR SECOND-HALF-OF-LIFE PURPOSE"); w.text(wb.purpose.purposeReflection, { style: "italic" }); }
    const gifts = (cw.geneKeyContemplations || []).length ? cw.geneKeyContemplations : [...c.magicWand.newGates].filter(g => g.geneKey).sort((a, b) => keyRank(c, b.gate) - keyRank(c, a.gate)).slice(0, 3).map(g => ({ gate: g.gate, prompt: `Where are you meeting the gift of ${g.geneKey.gift} (Gate ${g.gate}) in your life now?` }));
    w.h2("GENE KEYS GIFT CONTEMPLATION");
    gifts.forEach(g => {
      const gk = c.magicWand.newGates.find(x => x.gate === Number(g.gate))?.geneKey || c.cross.gateKeys?.find(x => x.gate === Number(g.gate))?.geneKey;
      w.text(`Gate ${g.gate}${gk ? `: ${gk.shadow} -> ${gk.gift} -> ${gk.siddhi}` : ""}`, { font: "helvetica", style: "bold", size: 11, gap: 0.2 });
      w.text(g.prompt, { style: "italic", size: 12, gap: 0.2 }); w.lines(4);
    });
    if ((cw.natalWandPractices || []).length) { w.h2("YOUR NATAL WAND IN THIS SEASON"); cw.natalWandPractices.forEach((p, i) => w.text(`${i + 1}.  ${p}`, { size: 12, gap: 0.3 })); w.lines(3); }
    const practices = [...(cw.practices || []), ...(c.key === "chironReturn" ? (wb.purpose?.practices || []) : [])];
    if (practices.length) { w.h2("INTEGRATION PRACTICES"); practices.forEach((p, i) => w.text(`${i + 1}.  ${p}`, { size: 12, gap: 0.3 })); w.text("Notes on practicing:", { size: 11, color: muted, gap: 0 }); w.lines(4); }
    const prompts = [...(cw.journalPrompts || []), ...(c.key === "chironReturn" ? (wb.purpose?.journalPrompts || []) : [])];
    const fallback = [`What did the ${c.transit || c.label} (${c.phase || ''}) ask you to let go of?`, `Where are you practicing the ${c.profile.cycle} profile in your life now?`, `What gift came online during this season that you now trust?`];
    w.page(); w.h1(`${c.label} - Journal`);
    (prompts.length ? prompts : fallback).forEach(p => { w.text(p, { style: "bolditalic", size: 12.5, gap: 0.2 }); w.lines(6); });
  });
  // Themes: the other cycles get one or two sentences each (no gate/channel detail), then the reflection prompts.
  if (enrichment.length) {
    w.page(); w.h1("Themes Across Your Cycles");
    if (focus && others.length) {
      w.text(`This workbook goes deep on ${focus.label}, the season ${isOpenNow(focus, status, generatedAt) ? "you are in now" : "you most recently walked"}. Your other cycles are part of the ground it stands on; their full detail lives in Your Missing Map.`, { style: "italic" });
      others.filter(c => isOpenNow(c, status, generatedAt)).forEach(c =>
        w.text(`${c.label}: also active now${c.key === "chironReturn" ? " (a permanent overlay)" : ""}, alongside ${focus.label}. Its story and Magic Wand are in Your Missing Map.`, { size: 11.5, gap: 0.35 }));
      const done = others.filter(c => !isOpenNow(c, status, generatedAt));
      if (done.length) w.text(`Completed: ${done.map(c => c.label).join(" and ")}. What ${done.length > 1 ? "those thresholds" : "that threshold"} broke open and gave you is already part of how you meet ${focus.label}.`, { size: 11.5, gap: 0.35 });
      w.y += 6;
    } else {
      w.text(`Your journey so far: ${enrichment.map(c => c.label).join(" -> ")}. Look at how each season built on the last.`, { style: "italic" });
    }
    (wb.themes?.themesPrompts?.length ? wb.themes.themesPrompts : ["What thread runs through every cycle you have lived?", "What did each cycle prepare you for in the next?", "What feels most integrated now?"])
      .forEach(p => { w.ensure(60 + 7 * 24); w.text(p, { style: "bolditalic", size: 12.5, gap: 0.2 }); w.lines(7); });
  }
  // Closing
  w.page(); w.y = 220;
  w.text("With Gratitude", { style: "bold", size: 22, color: gold, align: "center" });
  w.text(wb.themes?.closing || "May you keep returning to these pages as your design continues to unfold. You are home in yourself.", { style: "italic", size: 13, align: "center" });
  w.y += 30;
  w.text("LIT BY DESIGN", { font: "helvetica", style: "bold", size: 12, color: gold, align: "center" });
  w.text("Your Missing Map  ·  The Living Blueprint Workbook", { font: "helvetica", size: 10, color: muted, align: "center" });
  // footer
  const n = doc.internal.getNumberOfPages();
  for (let i = 2; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.text("Lit by Design  -  The Living Blueprint Workbook" + (name ? "  -  " + nm : ""), w.M, w.H - 36); doc.text(`Page ${i} of ${n}`, w.W - w.M, w.H - 36, { align: "right" }); }
  return doc;
}

export function downloadWorkbookPdf(opts) {
  const doc = buildWorkbookPdf(opts);
  const slug = (opts.name || "reading").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`living-blueprint-workbook-${slug}.pdf`);
}
