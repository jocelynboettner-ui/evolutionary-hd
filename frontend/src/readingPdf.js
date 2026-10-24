export const SESSION_URL = "https://app.acuityscheduling.com/schedule.php?owner=40622879";
export const SESSION_INVITE = "This is your map. If you want to walk the season you're in with me, we'll sit together 1:1 for 90 minutes. We'll read what it's asking of you, and where you've been performing instead of living.";
export const SESSION_CTA = "Book your 90-minute session · $333";
// readingPdf.js — client-side PDF export of a finished reading (no server cost).
import { jsPDF } from "jspdf";
import { PLANET_INTRO, planetMeaning } from "../../backend/reading-context.js";
import { writer, renderCycleSummary, renderNatalWand } from "./workbookPdf.js";
import { PLANETS_CURIOUS } from "../../backend/planet-meanings.js";
import { LOOK_BACK_TITLE, LOOK_BACK_INTRO, parseLookBackBlock } from "../../backend/look-back.js";

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
export function buildReadingPdf({ name, birthdata, natal = '', natalImage = null, natalWand = null, nodes = null, planets = [], cycles = [], closing = '', completedIntro = '', past = [], parts = null, qa = [], extraImages = [], generatedAt = new Date() }) {
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
  doc.splitTextToSize("The map was always there. No one handed it to you.", maxW).forEach(l => { doc.text(l, W / 2, y, { align: "center" }); y += 17; });
  y += 2;
  doc.setFont("times", "italic"); doc.setFontSize(12); doc.setTextColor(...muted);
  doc.splitTextToSize("Your Human Design, read through the great thresholds of your life: who you are by design, and the season you're in now.", maxW).forEach(l => { doc.text(l, W / 2, y, { align: "center" }); y += 16; });
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
  const topImgs = [natalImage, ...cycles.map(c => c.image), ...extraImages].filter(Boolean);
  if (topImgs.length === 1) drawImage(topImgs[0], 330);
  else for (let i = 0; i < topImgs.length; i += 2) {
    const row = topImgs.slice(i, i + 2), w = (maxW - 14) / 2;
    const h = Math.max(...row.map(im => w * (im.h / im.w)));
    if (y + h > H - M) { doc.addPage(); y = M; }
    row.forEach((im, j) => doc.addImage(im.dataUrl, "PNG", row.length === 1 ? (W - w) / 2 : M + j * (w + 14), y, w, w * (im.h / im.w)));
    y += h + 14;
  }
  if (topImgs.length) { doc.addPage(); y = M; }

  // Planetary placements (reference appendix): stacked, one planet per block (Conscious / Unconscious gate.line)
  const renderPlanets = () => {
    doc.addPage(); y = M;
    doc.setFont("times", "bold"); doc.setFontSize(15); doc.setTextColor(...gold);
    doc.text("Your Planetary Placements", M, y); y += 20;
    doc.setFont("times", "italic"); doc.setFontSize(BODY); doc.setTextColor(...ink);
    doc.splitTextToSize(PLANET_INTRO, maxW).forEach(l => { doc.text(l, M, y); y += LH; }); y += 6;
    const fmt = a => a ? `${a.gate}.${a.line}${a.name ? "  " + clean(a.name) : ""}` : "-";
    planets.forEach(r => {
      const cm = planetMeaning(r.planet, "Conscious"), um = planetMeaning(r.planet, "Unconscious");
      const meaning = doc.splitTextToSize(clean(cm === um ? cm : `Conscious: ${cm}. Unconscious: ${um}.`), maxW - 100);
      ensure(14 * (meaning.length + 2) + 10);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(...gold); doc.text(r.planet, M, y);
      doc.setFont("times", "italic"); doc.setFontSize(11); doc.setTextColor(...muted);
      meaning.forEach(l => { doc.text(l, M + 100, y); y += 14; });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(...ink);
      doc.text("Conscious:  " + fmt(r.conscious), M + 100, y); y += 14;
      doc.setTextColor(170, 50, 40); doc.text("Unconscious:  " + fmt(r.unconscious), M + 100, y); y += 18;
    });
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
    if (c.curious) curiousBox(c.curious);
    if (c.text) { ensure(60); renderText(c.text); }
  });
  if (cycles.some(c => c.enrichment)) curiousBox(PLANETS_CURIOUS);
  if (closing) { ensure(LH * 6); y += LH; renderText(closing); }
  { ensure(LH * 3); doc.setFont("times", "italic"); doc.setFontSize(BODY); doc.setTextColor(...gold);
    doc.splitTextToSize("This reading is your map. The Living Blueprint Workbook is the companion to live it, one page and one practice at a time.", maxW).forEach(l => { doc.text(l, M, y); y += LH; }); y += LH * 0.6; }
  // LOOKING BACK: one compact box per other cycle (years, 2-3 sentences, 2 journal prompts). No bodygraph, no gate cards.
  const lookBackBox = (c) => {
    const lb = parseLookBackBlock(c.text || '');
    if (!lb.summary && !lb.prompts.length) return;
    const SZ = 10.5, LL = SZ * 1.45, pad = 10, iw = maxW - 2 * pad;
    doc.setFontSize(SZ);
    const sum = lb.summary ? doc.splitTextToSize(clean(lb.summary), iw) : [];
    const pr = lb.prompts.map(p => doc.splitTextToSize("- " + clean(p), iw - 6));
    const h = pad + 13 + (lb.years || lb.active ? 13 : 0) + 4 + sum.length * LL + (pr.length ? 16 + pr.reduce((a, l) => a + l.length * LL + 2, 0) : 0) + pad - 4;
    ensure(h + 12);
    doc.setDrawColor(...gold); doc.setLineWidth(0.6); doc.setFillColor(251, 247, 236); doc.roundedRect(M, y, maxW, h, 4, 4, "FD");
    let yy = y + pad + 9;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); doc.setTextColor(...gold); doc.text(clean(lb.label || (c.label || "").toUpperCase()), M + pad, yy, { charSpace: 0.8 }); yy += 13;
    if (lb.years || lb.active) { doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...muted); doc.text(clean((lb.active ? "Still integrating - " : "") + lb.years), M + pad, yy); yy += 13; }
    yy += 4; doc.setFont("times", "normal"); doc.setFontSize(SZ); doc.setTextColor(...ink);
    sum.forEach(l => { doc.text(l, M + pad, yy); yy += LL; });
    if (pr.length) {
      yy += 4; doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold); doc.text("LOOK BACK", M + pad, yy, { charSpace: 1 }); yy += 12;
      doc.setFont("times", "italic"); doc.setFontSize(SZ); doc.setTextColor(...ink);
      pr.forEach(ls => { ls.forEach(l => { doc.text(l, M + pad + 4, yy); yy += LL; }); yy += 2; });
    }
    y += h + 12;
  };
  if (past.length) {
    ensure(LH * 8); y += LH;
    renderText(completedIntro || LOOK_BACK_TITLE + "\n\n" + LOOK_BACK_INTRO);
    past.forEach(lookBackBox);
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
