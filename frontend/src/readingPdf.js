export const SESSION_URL = "https://app.acuityscheduling.com/schedule.php?owner=40622879";
export const SESSION_INVITE = "This is your map. Book a 90-minute one-on-one session to dive deeper. We'll read what's being asked of you and where you've been performing instead of living.";
export const SESSION_CTA = "Book your 90-minute session · $333";
// readingPdf.js — client-side PDF export of a finished reading (no server cost).
import { jsPDF } from "jspdf";
import { PLANET_INTRO, planetMeaning } from "../../backend/reading-context.js";
import { OPENING_LINE, COMPLETED_CYCLES_INTRO } from "../../backend/reading-copy.js";
import { CONSCIOUS_UNCONSCIOUS, gateExplanation } from "../../backend/gate-explain.js";
import { writer, renderCycleSummary, renderNatalWand } from "./workbookPdf.js";
import { PLANETS_CURIOUS } from "../../backend/planet-meanings.js";

const clean = (t) => String(t || "")
  .replace(/\r/g, "")
  .replace(/\*\*(.+?)\*\*/g, "$1")
  .replace(/(^|\s)\*(.+?)\*(?=\s|$)/g, "$1$2")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2192/g, "->").replace(/\u2022/g, "-").replace(/\u2014/g, " - ").replace(/\u2013/g, "-").replace(/\u2026/g, "...")
  .replace(/[\u2726\u2727\u2605\u2606]/g, "*")
  .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF]/g, "");

// A line is a heading if it's a markdown heading or a short ALL-CAPS line.
function headingOf(line) {
  const m = line.match(/^#{1,6}\s+(.*)$/);
  if (m) return m[1].trim();
  const t = line.trim();
  if (t.length > 2 && t.length < 80 && /[A-Z]/.test(t) && t === t.toUpperCase() && !/[.!?,]$/.test(t)) return t;
  return null;
}

/**
 * @param {{ name?: string, birthdata?: {birthdate?:string,birthtime?:string,location?:string}, parts: string[], generatedAt?: Date }} opts
 * @returns {jsPDF}
 */
export function buildReadingPdf({ name, birthdata, natal = '', natalImage = null, natalWand = null, nodes = null, planets = [], cycles = [], closing = '', completedIntro = '', past = [], parts = null, qa = [], generatedAt = new Date() }) {
  // Current-cycle-first order: natal + current-cycle bodygraphs -> where you are now + home base text ->
  // current cycle(s) (initiation summary, story + Magic Wand) -> invitation forward -> completed cycles
  // (smaller bodygraph, summary, brief story) -> planetary placements (reference) -> Your Questions.
  if (parts && !natal) natal = parts.join('\n\n');
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
  const M = 72, maxW = W - 2 * M;               // 1" margins -> ~70-75 characters per line at 12pt
  const BODY = 12, LH = BODY * 1.6;
  const ink = [25, 22, 30], gold = [140, 100, 20], muted = [90, 85, 95];
  let y = M;

  const footer = () => {
    const n = doc.internal.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
      doc.text("Lit by Design  -  Your Missing Map" + (name ? "  -  " + clean(name) : ""), M, H - 36);
      doc.text(`Page ${i} of ${n}`, W - M, H - 36, { align: "right" });
    }
  };
  const ensure = (h) => { if (y + h > H - M) { doc.addPage(); y = M; } };

  // Title block
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...gold);
  doc.text("LIT BY DESIGN", W / 2, y, { align: "center", charSpace: 2 }); y += 28;
  doc.setFont("times", "bold"); doc.setFontSize(24); doc.setTextColor(...ink);
  doc.text("Your Missing Map", W / 2, y, { align: "center" }); y += 22;
  doc.setFont("times", "italic"); doc.setFontSize(13); doc.setTextColor(...ink);
  doc.splitTextToSize(OPENING_LINE, maxW).forEach(l => { doc.text(l, W / 2, y, { align: "center" }); y += 17; });
  y += 14; doc.setTextColor(...ink);
  if (name) { doc.setFont("times", "normal"); doc.setFontSize(18); doc.text(clean(name), W / 2, y, { align: "center" }); y += 24; }
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...muted);
  const bd = birthdata || {};
  const birthLine = ["Born " + (bd.birthdate || ""), bd.birthtime, bd.location].filter(Boolean).join("  -  ");
  if (bd.birthdate) { doc.text(clean(birthLine), W / 2, y, { align: "center" }); y += 16; }
  doc.text("Generated " + generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W / 2, y, { align: "center" }); y += 20;
  doc.setDrawColor(...gold); doc.setLineWidth(0.75); doc.line(W / 2 - 60, y, W / 2 + 60, y); y += 30;

  // Natal bodygraph
  const drawImage = (im, wMax = 300) => {
    if (!im) return;
    const w = Math.min(wMax, maxW), h = w * (im.h / im.w);
    if (y + h > H - M) { doc.addPage(); y = M; }
    doc.addImage(im.dataUrl, "PNG", (W - w) / 2, y, w, h); y += h + 14;
  };
  const topImgs = [natalImage, ...cycles.map(c => c.image)].filter(Boolean);
  if (topImgs.length === 1) drawImage(topImgs[0], 330);
  else for (let i = 0; i < topImgs.length; i += 2) {
    const row = topImgs.slice(i, i + 2), w = (maxW - 14) / 2;
    const h = Math.max(...row.map(im => w * (im.h / im.w)));
    if (y + h > H - M) { doc.addPage(); y = M; }
    row.forEach((im, j) => doc.addImage(im.dataUrl, "PNG", row.length === 1 ? (W - w) / 2 : M + j * (w + 14), y, w, w * (im.h / im.w)));
    y += h + 14;
  }
  if (topImgs.length) { doc.addPage(); y = M; }

  // Planetary placements (reference appendix). Each gate.line is an in-PDF link to a short note.
  // Conscious = black / Personality. Unconscious = red / Design. Defined in plain words above the list.
  const renderPlanets = () => {
    doc.addPage(); y = M;
    doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(...gold);
    doc.text("Your Planetary Placements", M, y); y += 20;
    doc.setFont("times", "italic"); doc.setFontSize(BODY); doc.setTextColor(...ink);
    doc.splitTextToSize(PLANET_INTRO + " Select a gate number to read what it means.", maxW).forEach(l => { doc.text(l, M, y); y += LH; }); y += 4;
    doc.setFont("times", "normal"); doc.setFontSize(BODY); doc.setTextColor(...ink);
    doc.splitTextToSize(CONSCIOUS_UNCONSCIOUS, maxW).forEach(l => { ensure(LH); doc.text(l, M, y); y += LH; }); y += 8;
    const pageNo = () => (typeof doc.getCurrentPageInfo === "function" ? doc.getCurrentPageInfo().pageNumber : doc.internal.getCurrentPageInfo().pageNumber);
    const pending = [];
    const drawGate = (label, activation, color) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...color);
      const prefix = label + ":  ";
      doc.text(prefix, M + 100, y);
      const x = M + 100 + doc.getTextWidth(prefix);
      if (!activation?.gate) { doc.text("-", x, y); y += 14; return; }
      const ex = gateExplanation(activation);
      const title = clean(ex.title);
      doc.setTextColor(...gold); doc.text(title, x, y);
      const w = doc.getTextWidth(title);
      doc.setDrawColor(...gold); doc.setLineWidth(0.4); doc.line(x, y + 1.5, x + w, y + 1.5);
      pending.push({ page: pageNo(), x, y: y - 9, w, h: 12, id: ex.id });
      y += 14;
    };
    planets.forEach(r => {
      const cm = planetMeaning(r.planet, "Conscious"), um = planetMeaning(r.planet, "Unconscious");
      const meaning = doc.splitTextToSize(clean(cm === um ? cm : `Conscious: ${cm}. Unconscious: ${um}.`), maxW - 100);
      ensure(14 * (meaning.length + 2) + 10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...gold); doc.text(r.planet, M, y);
      doc.setFont("times", "italic"); doc.setFontSize(11); doc.setTextColor(...muted);
      meaning.forEach(l => { doc.text(l, M + 100, y); y += 14; });
      drawGate("Conscious", r.conscious, ink);
      drawGate("Unconscious", r.unconscious, [170, 50, 40]);
      y += 4;
    });
    const notes = [];
    const seen = new Set();
    planets.forEach(r => [r.conscious, r.unconscious].forEach(a => {
      if (!a?.gate) return;
      const ex = gateExplanation(a);
      if (seen.has(ex.id)) return;
      seen.add(ex.id);
      notes.push(ex);
    }));
    if (!notes.length) return;
    doc.addPage(); y = M;
    doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(...gold);
    doc.text("What These Gates Mean", M, y); y += 22;
    const anchors = {};
    notes.forEach(ex => {
      const body = ex.paragraphs.flatMap(p => doc.splitTextToSize(clean(p), maxW));
      ensure(16 + 14 * body.length + 12);
      anchors[ex.id] = { page: pageNo(), top: y };
      doc.setFont("times", "bold"); doc.setFontSize(12); doc.setTextColor(...gold);
      doc.text(clean(ex.title), M, y); y += 16;
      doc.setFont("times", "normal"); doc.setFontSize(11); doc.setTextColor(...ink);
      body.forEach(l => { ensure(14); doc.text(l, M, y); y += 14; });
      y += 10;
    });
    const saved = pageNo();
    pending.forEach(p => {
      const dest = anchors[p.id];
      if (!dest) return;
      doc.setPage(p.page);
      doc.link(p.x, p.y, p.w, p.h, { pageNumber: dest.page, top: dest.top });
    });
    doc.setPage(saved);
  };



  const renderText = (part) => {
    const paras = clean(part).split(/\n\s*\n/);
    paras.forEach((para) => {
      const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      let body = lines;
      const h = headingOf(lines[0]);
      if (h) {
        body = lines.slice(1);
        ensure(BODY * 1.6 * 4);
        y += 8;
        doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(...gold);
        doc.splitTextToSize(h, maxW).forEach(l => { doc.text(l, M, y); y += 20; });
        y += 4;
      }
      if (!body.length) return;
      if (/^[-=]{3,}$/.test(body.join(""))) return;
      doc.setFont("times", "normal"); doc.setFontSize(BODY); doc.setTextColor(...ink);
      const wrapped = doc.splitTextToSize(body.join(" "), maxW);
      wrapped.forEach((l, i) => {
        if (i === 0 && wrapped.length > 1) ensure(LH * 2); else ensure(LH);
        doc.text(l, M, y); y += LH;
      });
      y += LH * 0.6;
    });
  };
  // Plain-language heading + paragraphs (nodes section, journal prompts, one move).
  const heading = (h) => { ensure(BODY * 1.6 * 4); y += 8; doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(...gold); doc.splitTextToSize(clean(h), maxW).forEach(l => { doc.text(l, M, y); y += 20; }); y += 4; };
  const para = (t, { italic = false, indent = 0 } = {}) => {
    doc.setFont("times", italic ? "italic" : "normal"); doc.setFontSize(BODY); doc.setTextColor(...ink);
    const wrapped = doc.splitTextToSize(clean(t), maxW - indent);
    wrapped.forEach((l, i) => { if (i === 0 && wrapped.length > 1) ensure(LH * 2); else ensure(LH); doc.text(l, M + indent, y); y += LH; });
    y += LH * 0.6;
  };
  // Small "For the curious" box: the only place the actual placements appear.
  const curiousBox = (c) => {
    if (!c?.lines?.length) return;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
    const lines = c.lines.flatMap(t => doc.splitTextToSize(clean(t), maxW - 20));
    const h = 22 + lines.length * 11 + 8;
    ensure(h + 10); y += 4;
    doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.setFillColor(250, 246, 236); doc.roundedRect(M, y, maxW, h, 4, 4, "FD");
    let yy = y + 14;
    doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold); doc.text(clean(c.title || "FOR THE CURIOUS"), M + 10, yy, { charSpace: 1 }); yy += 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(...muted);
    lines.forEach(l => { doc.text(l, M + 10, yy); yy += 11; });
    y += h + 12;
  };
  const renderNodes = (r) => {
    if (!r?.sections?.length) return;
    doc.addPage(); y = M;
    heading(r.title);
    if (r.intro) para(r.intro, { italic: true });
    r.sections.forEach(sec => { heading(sec.heading); sec.paras.forEach(t => para(t)); });
    curiousBox(r.curious);
  };
  // Close of the reading: journal prompts, then ONE MOVE FOR THE NEXT 24 HOURS (always last).
  const renderClosingMoves = (r) => {
    if (!r?.oneMove) return;
    ensure(LH * 10); y += LH * 0.5;
    if (r.journal?.prompts?.length) {
      heading(r.journal.title);
      if (r.journal.intro) para(r.journal.intro, { italic: true });
      r.journal.prompts.forEach((t, i) => para(`${i + 1}.  ${t}`, { indent: 6 }));
    }
    heading(r.oneMove.title);
    para(r.oneMove.text);
  };
  renderText(natal);
  if (natalWand?.sun) { const w = writer(doc); w.y = y; w.ensure(200); renderNatalWand(w, natalWand, { title: "YOUR MAGIC WAND AT A GLANCE" }); y = w.y + 10; }
  renderNodes(nodes);
  cycles.forEach(c => {
    doc.addPage(); y = M;
    if (c.enrichment) { const w = writer(doc); w.y = y; renderCycleSummary(w, c.enrichment); y = w.y + 10; }
    if (c.text) { ensure(60); renderText(c.text); }
  });
  if (cycles.some(c => c.enrichment) || past.some(c => c.enrichment)) curiousBox(PLANETS_CURIOUS);
  if (closing) { ensure(LH * 6); y += LH; renderText(closing); }
  { ensure(LH * 3); doc.setFont("times", "italic"); doc.setFontSize(BODY); doc.setTextColor(...gold);
    doc.splitTextToSize("This reading is your map. The Living Blueprint Workbook is the companion to live it, one page and one practice at a time.", maxW).forEach(l => { doc.text(l, M, y); y += LH; }); y += LH * 0.6; }
  if (past.length) {
    doc.addPage(); y = M;
    renderText(completedIntro || COMPLETED_CYCLES_INTRO);
    past.forEach(c => {
      ensure(260); y += LH * 0.5;
      if (c.image) drawImage(c.image, 220);
      if (c.enrichment) { const w = writer(doc); w.y = y; renderCycleSummary(w, c.enrichment); y = w.y + 10; }
      if (c.text) { ensure(60); renderText(c.text); }
    });
  }
  renderClosingMoves(nodes);
  // 1:1 session invitation (clickable link), after the reading's close and before the reference appendix.
  {
    ensure(110); y += LH;
    doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(W / 2 - 60, y, W / 2 + 60, y); y += 26;
    doc.setFont("times", "italic"); doc.setFontSize(14); doc.setTextColor(...ink);
    doc.splitTextToSize(SESSION_INVITE, maxW).forEach(l => { doc.text(l, W / 2, y, { align: "center" }); y += 20; });
    y += 6; doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...gold);
    doc.textWithLink(SESSION_CTA, W / 2 - doc.getTextWidth(SESSION_CTA) / 2, y, { url: SESSION_URL }); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted);
    doc.textWithLink(SESSION_URL, W / 2 - doc.getTextWidth(SESSION_URL) / 2, y, { url: SESSION_URL }); y += 24;
  }
  if (planets.length) renderPlanets();
  const pairs = qa.filter(x => x && x.q && x.a);
  if (pairs.length) {
    doc.addPage(); y = M;
    doc.setFont("times", "bold"); doc.setFontSize(20); doc.setTextColor(...gold);
    doc.text("Your Questions", M, y); y += 30;
    pairs.forEach((x, i) => {
      if (i > 0) { ensure(40); doc.setDrawColor(...gold); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 22; }
      const qLines = doc.splitTextToSize(clean(x.q), maxW - 26);
      ensure(LH * (qLines.length + 3));
      doc.setFont("times", "bold"); doc.setFontSize(BODY + 1); doc.setTextColor(...gold); doc.text("Q:", M, y);
      doc.setFont("times", "bolditalic"); doc.setTextColor(...ink);
      qLines.forEach(l => { doc.text(l, M + 26, y); y += LH; });
      y += LH * 0.5;
      renderText(x.a);
      y += LH * 0.5;
    });
  }
  footer();
  return doc;
}

export function downloadReadingPdf(opts) {
  const doc = buildReadingPdf(opts);
  const slug = (opts.name || "reading").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`your-missing-map-${slug}.pdf`);
}
