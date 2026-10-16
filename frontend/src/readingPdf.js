// readingPdf.js — client-side PDF export of a finished reading (no server cost).
import { jsPDF } from "jspdf";

const clean = (t) => String(t || "")
  .replace(/\r/g, "")
  .replace(/\*\*(.+?)\*\*/g, "$1")
  .replace(/(^|\s)\*(.+?)\*(?=\s|$)/g, "$1$2")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  .replace(/\u2014/g, " - ").replace(/\u2013/g, "-").replace(/\u2026/g, "...")
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
export function buildReadingPdf({ name, birthdata, parts, generatedAt = new Date() }) {
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
      doc.text("Lit by Design  -  Evolutionary Human Design Reading" + (name ? "  -  " + clean(name) : ""), M, H - 36);
      doc.text(`Page ${i} of ${n}`, W - M, H - 36, { align: "right" });
    }
  };
  const ensure = (h) => { if (y + h > H - M) { doc.addPage(); y = M; } };

  // Title block
  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...gold);
  doc.text("LIT BY DESIGN", W / 2, y, { align: "center", charSpace: 2 }); y += 28;
  doc.setFont("times", "bold"); doc.setFontSize(24); doc.setTextColor(...ink);
  doc.text("Evolutionary Human Design Reading", W / 2, y, { align: "center" }); y += 30;
  if (name) { doc.setFont("times", "normal"); doc.setFontSize(18); doc.text(clean(name), W / 2, y, { align: "center" }); y += 24; }
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(...muted);
  const bd = birthdata || {};
  const birthLine = ["Born " + (bd.birthdate || ""), bd.birthtime, bd.location].filter(Boolean).join("  -  ");
  if (bd.birthdate) { doc.text(clean(birthLine), W / 2, y, { align: "center" }); y += 16; }
  doc.text("Generated " + generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), W / 2, y, { align: "center" }); y += 20;
  doc.setDrawColor(...gold); doc.setLineWidth(0.75); doc.line(W / 2 - 60, y, W / 2 + 60, y); y += 30;

  parts.filter(Boolean).forEach((part, pi) => {
    if (pi > 0) { doc.addPage(); y = M; }
    const paras = clean(part).split(/\n\s*\n/);
    paras.forEach((para) => {
      const lines = para.split("\n").map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;
      // a paragraph may start with a heading line
      let body = lines;
      const h = headingOf(lines[0]);
      if (h) {
        body = lines.slice(1);
        ensure(BODY * 1.6 * 4);                   // keep heading with at least 2 body lines
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
        // avoid a single orphan line at the bottom of a page
        if (i === 0 && wrapped.length > 1) ensure(LH * 2); else ensure(LH);
        doc.text(l, M, y); y += LH;
      });
      y += LH * 0.6;
    });
  });
  footer();
  return doc;
}

export function downloadReadingPdf(opts) {
  const doc = buildReadingPdf(opts);
  const slug = (opts.name || "reading").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`evolutionary-hd-reading-${slug}.pdf`);
}
