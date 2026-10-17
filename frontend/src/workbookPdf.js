// workbookPdf.js — printable, client-side personalized workbook + shared cycle-summary pages.
import { jsPDF } from "jspdf";

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
export function renderCycleSummary(w, c) {
  w.h1(`${c.label} - The Initiation of This Season`);
  w.text(`Peak ${c.peakDate}. Your natal design is who you are and never changes; these are the energies flowing through it in this season, and your natal authority still chooses.`, { style: "italic", color: muted });
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
  if (c.magicWand.newCenters.length) w.text("Centers that come online: " + c.magicWand.newCenters.map(x => `${x.center} (${x.gift})`).join("; "), { size: 11 });
  c.magicWand.channels.forEach(ch => w.text(`Channel ${ch.label}${ch.natalGate ? ` - natal Gate ${ch.natalGate} met by Gate ${ch.newGates.join(" & ")}` : " - fully new"}`, { size: 11, style: "bold", gap: 0.15 }));
  w.y += 4;
  c.magicWand.newGates.forEach(g => {
    w.ensure(48);
    w.text(`Gate ${g.gate} (${g.center})` + (g.geneKey ? `   ${g.geneKey.shadow} -> ${g.geneKey.gift} -> ${g.geneKey.siddhi}` : ""), { font: "helvetica", style: "bold", size: 10, gap: 0.05 });
    if (g.planets.length) w.text(g.planets.map(p => `${p.side} ${p.planet} ${g.gate}.${p.line} - ${p.meaning}`).join("; "), { size: 10, color: red, indent: 12, gap: 0.3 });
  });
}

const keyRank = (c, g) => (c.magicWand.channels.some(ch => ch.newGates.includes(g)) ? 2 : 0) + ((c.cross.gates || []).includes(g) ? 1 : 0);

export function buildWorkbookPdf({ name, birthdata, natal, enrichment = [], workbook, generatedAt = new Date() }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const w = writer(doc);
  const wb = workbook || {};
  const nm = clean(name || "Your");
  // Cover
  w.y = 200;
  w.text("LIT BY DESIGN", { font: "helvetica", style: "bold", size: 11, color: gold, align: "center" });
  w.text("Evolutionary Human Design Workbook", { style: "bold", size: 26, align: "center" });
  if (name) w.text(nm, { size: 20, align: "center" });
  const bd = birthdata || {};
  if (bd.birthdate) w.text(["Born " + bd.birthdate, bd.birthtime, bd.location].filter(Boolean).join("  -  "), { font: "helvetica", size: 11, color: muted, align: "center" });
  w.text("Prepared " + generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), { font: "helvetica", size: 11, color: muted, align: "center" });
  // Intro
  w.page(); w.h1("Welcome");
  w.text(wb.themes?.intro || `${name ? nm + ", this" : "This"} workbook accompanies your Evolutionary Human Design reading. Move through it slowly. Your natal design is who you are and it never changes; each cycle you have lived added energies that flow through that design, and your natal authority still chooses which to follow. Use these pages to notice, practice and integrate.`);
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
  // Per cycle
  enrichment.forEach(c => {
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
    const practices = [...(cw.practices || []), ...(c.key === "chironReturn" ? (wb.purpose?.practices || []) : [])];
    if (practices.length) { w.h2("INTEGRATION PRACTICES"); practices.forEach((p, i) => w.text(`${i + 1}.  ${p}`, { size: 12, gap: 0.3 })); w.text("Notes on practicing:", { size: 11, color: muted, gap: 0 }); w.lines(4); }
    const prompts = [...(cw.journalPrompts || []), ...(c.key === "chironReturn" ? (wb.purpose?.journalPrompts || []) : [])];
    const fallback = [`What did the ${c.label} ask you to let go of?`, `Where are you practicing the ${c.profile.cycle} profile in your life now?`, `What gift came online during this season that you now trust?`];
    w.page(); w.h1(`${c.label} - Journal`);
    (prompts.length ? prompts : fallback).forEach(p => { w.text(p, { style: "bolditalic", size: 12.5, gap: 0.2 }); w.lines(6); });
  });
  // Themes
  if (enrichment.length) {
    w.page(); w.h1("Themes Across Your Cycles");
    w.text(`Your journey so far: ${enrichment.map(c => c.label).join(" -> ")}. Look at how each season built on the last.`, { style: "italic" });
    (wb.themes?.themesPrompts?.length ? wb.themes.themesPrompts : ["What thread runs through every cycle you have lived?", "What did each cycle prepare you for in the next?", "What feels most integrated now?"])
      .forEach(p => { w.text(p, { style: "bolditalic", size: 12.5, gap: 0.2 }); w.lines(7); });
  }
  // Closing
  w.page(); w.y = 220;
  w.text("With Gratitude", { style: "bold", size: 22, color: gold, align: "center" });
  w.text(wb.themes?.closing || "May you keep returning to these pages as your design continues to unfold. You are home in yourself.", { style: "italic", size: 13, align: "center" });
  w.y += 30;
  w.text("LIT BY DESIGN", { font: "helvetica", style: "bold", size: 12, color: gold, align: "center" });
  w.text("Evolutionary Human Design", { font: "helvetica", size: 10, color: muted, align: "center" });
  // footer
  const n = doc.internal.getNumberOfPages();
  for (let i = 2; i <= n; i++) { doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.text("Lit by Design  -  Evolutionary Human Design Workbook" + (name ? "  -  " + nm : ""), w.M, w.H - 36); doc.text(`Page ${i} of ${n}`, w.W - w.M, w.H - 36, { align: "right" }); }
  return doc;
}

export function downloadWorkbookPdf(opts) {
  const doc = buildWorkbookPdf(opts);
  const slug = (opts.name || "reading").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`evolutionary-hd-workbook-${slug}.pdf`);
}
