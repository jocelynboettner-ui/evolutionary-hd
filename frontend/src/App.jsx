import { useState, useRef, useEffect } from "react";
import { CycleCards, NatalWandCard, NodesSection, ClosingMoves, PlanetsCurious, cycleCardsCss, nodesCss } from "./CycleCards.jsx";
import { downloadWorkbookPdf } from "./workbookPdf.js";
import { buildReadingPdf, SESSION_URL, SESSION_INVITE, SESSION_CTA } from "./readingPdf.js";
import { parseBirthText } from "../../backend/birth-parse.js";
import { PLANET_ORDER, planetMeaning } from "../../backend/reading-context.js";
import { renderBodygraphSVG, svgToPng } from "./bodygraph.js";

const API_URL = import.meta.env.VITE_API_URL || "https://evolutionary-hd-api.onrender.com";

// Access credentials for /api/chat: paid Stripe session id or owner preview code (?preview=CODE)
const getAccess = () => ({
  sessionId: sessionStorage.getItem("ehd_session_id") || undefined,
  previewCode: sessionStorage.getItem("ehd_preview_code") || undefined,
});

function Stars() {
    const stars = Array.from({ length: 120 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          r: Math.random() * 1.5 + 0.5,
          peak: (Math.random() * 2 + 1).toFixed(1),
          dur: (Math.random() * 3 + 2).toFixed(1),
    }));
    return (
          <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
            {stars.map((s) => (
                    <circle key={s.id} cx={s.x + "%"} cy={s.y + "%"} r={s.r} fill="white" opacity="0.7">
                              <animate attributeName="opacity" values={"0;" + s.peak + ";0"} dur={s.dur + "s"} repeatCount="indefinite" />
                    </circle>
                  ))}
          </svg>
        );
}

const PlanetaryKey = [
  { planet: "Sun (Conscious)", meaning: "your visible identity, what you radiate" },
  { planet: "Earth (Conscious)", meaning: "your grounding, what stabilizes you" },
  { planet: "Moon (Conscious)", meaning: "your emotional anchor, your inner rhythm" },
  { planet: "Sun (Unconscious)", meaning: "your deepest nature, felt before seen" },
  { planet: "North Node", meaning: "your evolutionary direction, where you're going" },
  { planet: "South Node", meaning: "your past patterns, what you came from" },
  { planet: "Saturn", meaning: "your teacher, your discipline, your karma" },
  { planet: "Chiron", meaning: "your wound and your medicine" },
  { planet: "Uranus", meaning: "your disruption and your genius" },
  { planet: "Neptune", meaning: "your dream and your dissolution" },
  { planet: "Pluto", meaning: "your transformation and your power" },
  { planet: "Jupiter", meaning: "your expansion and your wisdom" },
  { planet: "Mars", meaning: "your drive and your will" },
  { planet: "Venus", meaning: "your values and your magnetism" },
  { planet: "Mercury", meaning: "your mind and your communication" },
  ];

function ReadingTableOfContents({ visible, birthdata, planets, cycles = [], status = null, part = "all" }) {
    if (!visible) return null;
    const showContents = part !== "key", showKey = part !== "contents";
    const curKeys = status ? [status.focus?.key, ...(status.overlays || []).map(o => o.key)].filter(Boolean) : cycles.map(c => c.key);
    const doneKeys = status ? (status.completed || []).map(c => c.key) : [];
    const cycleItems = cycles.filter(c => curKeys.includes(c.key)).map(c => c.label + (c.key === status?.focus?.key ? "" : " (overlay)") + (c.key === "chironReturn" ? " — story, Magic Wand, Gene Keys, practices, Second-Half-of-Life Purpose" : " — story, Magic Wand, Gene Keys, practices"));
    const doneItems = cycles.filter(c => doneKeys.includes(c.key)).map(c => c.label);
    return (
          <div style={{
                  background: "rgba(184,134,11,0.04)",
                  border: "1px solid rgba(184,134,11,0.15)",
                  borderRadius: "8px",
                  padding: "32px",
                  margin: "24px 0",
                  fontFamily: "var(--reading-font)",
          }}>
                {showContents && <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "28px" }}>
                        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
                        <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,216,0.7)", margin: 0, fontWeight: 400 }}>
                          {birthdata?.name ? `${birthdata.name}'s Reading Contains` : 'Your Reading Contains'}
                        </h2>
                        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  {[
            { title: "WHERE YOU ARE NOW", items: [] },
            { title: "YOUR HOME BASE — YOUR NATAL DESIGN", items: ["Type, Strategy & Authority", "Profile", "Centers & Definition", "Incarnation Cross", "Your Channels — Superpowers and Superhighways", "Your Magic Wand — your conscious Sun, about 70% of your soul's purpose"] },
            { title: "YOUR NODES — WHERE YOU'VE BEEN AND WHERE YOU'RE HEADED", items: [] },
            ...(cycleItems.length ? [{ title: "THE SEASON YOU ARE IN", items: cycleItems }] : []),
            { title: "THE INVITATION FORWARD", items: [] },
            ...(doneItems.length ? [{ title: "YOUR COMPLETED CYCLES", items: doneItems }] : []),
            { title: "JOURNAL PROMPTS & ONE MOVE FOR THE NEXT 24 HOURS", items: [] },
            { title: "REFERENCE — PLANETARY KEY & HOW TO READ YOUR DEFINITION", items: [] },
                    ].map(({ title, items }) => (
                                <div key={title} style={{ borderLeft: "1px solid rgba(184,134,11,0.2)", paddingLeft: "16px" }}>
                                            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "14px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "8px" }}>{title}</div>
                                  {items.length > 0 && (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                                  {items.map(item => (
                                                                    <span key={item} style={{ fontSize: "17px", color: "rgba(240,234,216,0.92)", fontStyle: "italic" }}>{item}</span>
                                                                  ))}
                                                </div>
                                            )}
                                </div>
                              ))}
                </div>
                </>}
                {showKey && <>
                {showContents && <div style={{ textAlign: "center", color: "rgba(184,134,11,0.3)", margin: "24px 0", letterSpacing: "0.3em" }}>—</div>}
                <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "8px" }}>PLANETARY KEY — How To Read Your Gates</div>
                        <div style={{ fontSize: "16px", color: "rgba(240,234,216,0.85)", fontStyle: "italic", marginBottom: "16px", lineHeight: "1.6" }}>
                                  Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life.
                        </div>
                        <div className="planet-list">
                          {PLANET_ORDER.map(planet => {
                              const row = (planets || []).find(r => r.planet === planet);
                              if (planets && !row) return null;            // e.g. Chiron when not in chart data
                              const fmt = a => a ? `${a.gate}.${a.line}${a.name ? " · " + a.name : ""}` : "—";
                              const cm = planetMeaning(planet, "Conscious"), um = planetMeaning(planet, "Unconscious");
                              return (
                                  <div key={planet} className="planet-row">
                                      <div className="planet-name">{planet}</div>
                                      {cm === um
                                          ? <div className="planet-meaning">{cm}</div>
                                          : <div className="planet-meaning">Conscious: {cm}<br />Unconscious: {um}</div>}
                                      {row && (
                                          <div className="planet-gates">
                                              <span><b>Conscious</b> {fmt(row.conscious)}</span>
                                              <span className="unc"><b>Unconscious</b> {fmt(row.unconscious)}</span>
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                        </div>
                </div>
                <div style={{ textAlign: "center", color: "rgba(184,134,11,0.3)", margin: "24px 0", letterSpacing: "0.3em" }}>—</div>
                <div>
                        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "12px" }}>HOW TO READ YOUR DEFINITION</div>
                        <p style={{ fontSize: "16px", color: "rgba(240,234,216,0.88)", lineHeight: "1.65", margin: "0 0 12px 0" }}>
                                  Think of your defined centers as <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>towns you know intimately</strong> — you grew up here, you know every street, you can give directions with confidence, you know exactly what to do and where to go. This is consistent, reliable energy that is always available to you.
                        </p>
                        <p style={{ fontSize: "16px", color: "rgba(240,234,216,0.88)", lineHeight: "1.65", margin: "0 0 12px 0" }}>
                                  Your defined <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>channels are the superhighways</strong> between those towns — familiar routes you travel automatically, with no need to think about which way to turn. This is where your most consistent gifts live.
                        </p>
                        <p style={{ fontSize: "16px", color: "rgba(240,234,216,0.88)", lineHeight: "1.65", margin: 0 }}>
                                  Your <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>undefined or open centers</strong> are places you are still exploring — like visiting a new city where you might take a taxi or ask a local for directions. You are learning here, not leading. These are also the places where you are most receptive, most flexible, and most wise about the experiences of others.
                        </p>
                </div>
                </>}
          </div>
        );
}

function parseBirthData(text) {
    const p = parseBirthText(text);
    return p.birthdate && p.location ? { birthdate: p.birthdate, birthtime: p.birthtime, location: p.location, name: p.name } : null;
}

function Message({ role, content }) {
    const isUser = role === "user";
    return (
          <div style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: "16px",
                  padding: "0 8px",
          }}>
                <div style={{
                    maxWidth: isUser ? "80%" : "min(100%, 70ch)",
                    background: isUser
                                ? "linear-gradient(135deg, rgba(109,40,217,0.9), rgba(76,29,149,0.9))"
                                : "rgba(14,8,26,0.92)",
                    border: isUser ? "none" : "1px solid rgba(167,139,250,0.25)",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: isUser ? "14px 18px" : "22px 26px",
                    color: "#f5f1e8",
                    fontFamily: isUser ? "var(--ui-font)" : "var(--reading-font)",
                    fontSize: isUser ? "17px" : "18px",
                    lineHeight: "1.65",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
          }}>
                  {content}
                </div>
          </div>
        );
}

// Bodygraph SVGs: natal + every reached cycle overlay (natal + that cycle's activations), labelled now / overlay / completed.
function bodygraphSvgs(charts) {
    if (!charts?.natal) return [];
    const n = charts.natal;
    const list = [{ key: 'natal', svg: renderBodygraphSVG({ natal: n, title: 'Natal Bodygraph', subtitle: [n.type, n.profile, n.authority].filter(Boolean).join(' · ') }) }];
    const st = charts.status || {};
    const active = new Map([st.focus, ...(st.overlays || [])].filter(Boolean).map(c => [c.key, c]));
    const src = charts.cycleCharts?.length ? charts.cycleCharts : (charts.cycles || []);
    src.forEach(c => {
        if (!c.chart) return;
        const a = active.get(c.key) || (charts.cycles || []).find(x => x.key === c.key);
        const isCurrent = active.has(c.key), isFocus = st.focus?.key === c.key;
        const sub = c.key === 'chironReturn' && a?.permanent ? 'Permanent overlay since ' + (a.peak || c.peak)
            : a?.start ? (isCurrent && a.inWindow !== false ? 'Window ' : 'Completed · window ') + a.start + ' to ' + a.end
            : 'Peak ' + c.peak + ' · completed';
        const pre = isFocus ? (a?.inWindow === false ? 'Most recent cycle: ' : 'Current cycle: ') : isCurrent ? 'Overlay: ' : '';
        list.push({ key: c.key, svg: renderBodygraphSVG({ natal: n, overlay: c.chart, title: pre + c.label, subtitle: sub }) });
    });
    return list;
}

function Bodygraphs({ charts, only, status = false }) {
    const list = bodygraphSvgs(charts).filter(b => !only || (Array.isArray(only) ? only.includes(b.key) : b.key === only));
    if (!list.length) return null;
    const st = charts.status;
    return (
        <div style={{ background: "rgba(14,8,26,0.92)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
            {status && st && (
                <p style={{ margin: "0 0 14px", color: "#f5f1e8", fontSize: "17px", lineHeight: 1.6, textAlign: "center" }}>
                    {st.focus && st.focus.inWindow !== false
                        ? <>You are in: <strong style={{ color: "#e0c068" }}>{st.focus.label}</strong>{st.overlays?.length ? <> · also active: <strong style={{ color: "#e0c068" }}>{st.overlays.map(c => c.label).join(" + ")}</strong></> : null}</>
                        : st.focus
                        ? <>Between windows · integrating your most recent cycle: <strong style={{ color: "#e0c068" }}>{st.focus.label}</strong>{st.overlays?.length ? <> · also active: <strong style={{ color: "#e0c068" }}>{st.overlays.map(c => c.label).join(" + ")}</strong></> : null}</>
                        : <>No cycle window has opened yet · this reading is your natal design</>}
                </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
                {list.map(b => (
                    <div key={b.key} className="bodygraph" style={{ flex: "1 1 300px", maxWidth: "340px", borderRadius: "12px", overflow: "hidden" }}
                        dangerouslySetInnerHTML={{ __html: b.svg.replace('width="400"', 'width="100%"').replace(/height="\d+"/, '') }} />
                ))}
            </div>
        </div>
    );
}

// On-screen reading, current-cycle-first: status + natal & current bodygraphs -> where you are now + home base
// -> current cycle(s) in depth -> invitation forward -> completed cycles (brief) -> planetary key reference -> follow-ups.
export function readingKeys(seg, charts) {
    const en = charts?.enrichment || [], st = charts?.status || {};
    const cur = [st.focus?.key, ...(st.overlays || []).map(o => o.key)].filter(Boolean);
    const current = cur.filter(k => seg.cycles.some(c => c.key === k) || en.some(e => e.key === k));
    seg.cycles.forEach(c => { if (!current.includes(c.key)) current.push(c.key); });
    const order = ['saturnReturn', 'uranusOpposition', 'chironReturn', 'secondSaturnReturn'];
    const done = (st.completed || []).map(c => c.key);
    const past = order.filter(k => !current.includes(k) && (seg.past.some(p => p.key === k) || (done.includes(k) && en.some(e => e.key === k))));
    return { current, past };
}

function ReadingView({ messages, charts, birthdata }) {
    const visible = messages.filter(m => !m.hidden);
    const lastMain = messages.reduce((a, m, i) => (m.main ? i : a), -1);
    if (lastMain < 0) return <>
        {charts && <Bodygraphs charts={charts} status />}
        {visible.map((m, i) => <Message key={i} role={m.role} content={stripMarkers(m.content)} />)}
    </>;
    const firstMain = messages.findIndex(m => m.main);
    const before = messages.slice(0, firstMain).filter(m => !m.hidden);
    const after = messages.slice(lastMain + 1).filter(m => !m.hidden);
    const seg = splitReading(messages.slice(0, lastMain + 1).filter(m => m.role === 'assistant' && m.main).map(m => m.content));
    const en = charts?.enrichment || [];
    const { current, past } = readingKeys(seg, charts);
    return <>
        {before.map((m, i) => <Message key={'b' + i} role={m.role} content={m.content} />)}
        {charts && <Bodygraphs charts={charts} only={['natal', ...current]} status />}
        {charts?.natal?.birthTimeNote && <p className="birth-note" style={{ fontSize: 13, color: '#e8dcc0', textAlign: 'center', margin: '0 auto 1rem', maxWidth: 560 }}>Birth time note: {charts.natal.birthTimeNote}</p>}
        <Message role="assistant" content={seg.natal} />
        {charts?.natal?.wand && <NatalWandCard wand={charts.natal.wand} />}
        {charts?.natal?.nodes && <NodesSection nodes={charts.natal.nodes} />}
        {current.map(k => {
            const e = en.find(x => x.key === k); const t = seg.cycles.find(c => c.key === k)?.text;
            return <div key={k} className="cycle-section" data-cycle={k}>
                {e && <CycleCards enrichment={[e]} compact />}
                {t && <Message role="assistant" content={t} />}
            </div>;
        })}
        {en.length > 0 && <PlanetsCurious />}
        {seg.closing && <Message role="assistant" content={seg.closing} />}
        {past.length > 0 && <div className="completed-cycles">
            <Message role="assistant" content={seg.completed || "YOUR COMPLETED CYCLES\n\nIf you'd like to recognize or witness the cycles you've already walked, here they are."} />
            {past.map(k => {
                const e = en.find(x => x.key === k); const t = seg.past.find(c => c.key === k)?.text;
                return <div key={k} className="cycle-section past-cycle" data-cycle={k} style={{ maxWidth: 560, margin: '0 auto' }}>
                    {charts && <Bodygraphs charts={charts} only={k} />}
                    {e && <CycleCards enrichment={[e]} compact />}
                    {t && <Message role="assistant" content={t} />}
                </div>;
            })}
        </div>}
        {charts?.natal?.nodes && <ClosingMoves nodes={charts.natal.nodes} />}
        <div className="session-invite" style={{ textAlign: "center", margin: "2rem auto", padding: "24px", maxWidth: 560, border: "1px solid rgba(184,134,11,0.4)", borderRadius: 12, background: "rgba(184,134,11,0.06)" }}>
            <p style={{ margin: "0 0 16px", fontSize: 19, fontStyle: "italic", color: "#f5f1e8", lineHeight: 1.5 }}>{SESSION_INVITE}</p>
            <a href={SESSION_URL} target="_blank" rel="noopener noreferrer" className="pdf-btn" style={{ display: "inline-block", textDecoration: "none" }}>{SESSION_CTA}</a>
        </div>
        <ReadingTableOfContents visible={true} birthdata={birthdata} planets={charts?.natal?.planets} part="key" />
        {after.map((m, i) => <Message key={'a' + i} role={m.role} content={stripMarkers(m.content)} />)}
    </>;
}

// Split the main reading into opening+natal / current cycle(s) / closing / completed cycles using the server's markers.
const MARK_RE = '^\\[\\[(CYCLE:[a-zA-Z]+|PAST:[a-zA-Z]+|CLOSING|COMPLETED)\\]\\]';
const MARK = new RegExp(MARK_RE + '\\s*$', 'm');
export function stripMarkers(t) { return String(t || '').replace(new RegExp(MARK_RE + '\\s*\\n?', 'gm'), '').replace(/\n{3,}/g, '\n\n'); }
export function splitReading(parts) {
    const natal = stripMarkers(parts[0] || '').trim();
    const rest = parts.slice(1).join('\n\n');
    const cycles = [], past = []; let closing = '', completed = '';
    if (!MARK.test(rest)) return { natal, cycles, closing: stripMarkers(rest).trim(), completed, past };
    const chunks = rest.split(new RegExp(MARK_RE + '\\s*$', 'm'));
    for (let i = 1; i < chunks.length; i += 2) {
        const tag = chunks[i], body = (chunks[i + 1] || '').trim();
        if (tag === 'CLOSING') closing = body;
        else if (tag === 'COMPLETED') completed = body;
        else if (tag.startsWith('PAST:')) past.push({ key: tag.slice(5), text: body });
        else cycles.push({ key: tag.slice(6), text: body });
    }
    return { natal, cycles, closing, completed, past };
}

// Main reading = assistant messages flagged main (auto part 1 + part 2). Everything after the
// last main message is follow-up Q&A; the birth-data message and hidden "continue" are excluded.
export function splitForPdf(messages) {
    let last = -1;
    messages.forEach((m, i) => { if (m.main) last = i; });
    if (last < 0) {  // fallback: first assistant message (and one after a hidden continue) are the reading
        const a = messages.findIndex(m => m.role === 'assistant');
        last = a;
        if (a >= 0 && messages[a + 1]?.hidden && messages[a + 2]?.role === 'assistant') last = a + 2;
    }
    const parts = messages.slice(0, last + 1).filter(m => m.role === 'assistant' && m.content).map(m => m.content);
    const qa = [];
    messages.slice(last + 1).forEach(m => {
        if (m.hidden) return;
        if (m.role === 'user') qa.push({ q: m.content, a: '' });
        else if (m.role === 'assistant' && qa.length && !qa[qa.length - 1].a) qa[qa.length - 1].a = m.content;
    });
    return { parts, qa: qa.filter(x => x.a) };
}

async function buildPdfDoc(birthdata, messages, charts) {
    const svgs = bodygraphSvgs(charts);
    const imgs = {};
    await Promise.all(svgs.map(b => svgToPng(b.svg).then(im => { imgs[b.key] = im; }).catch(e => console.error('Bodygraph image error:', e))));
    const { parts, qa } = splitForPdf(messages);
    const seg = splitReading(parts);
    const en = charts?.enrichment || [];
    const { current, past } = readingKeys(seg, charts);
    return buildReadingPdf({
        name: birthdata?.name,
        birthdata,
        natal: seg.natal,
        natalImage: imgs.natal || null,
        natalWand: charts?.natal?.wand || null,
        nodes: charts?.natal?.nodes || null,
        planets: charts?.natal?.planets || [],
        cycles: current.map(k => ({ key: k, image: imgs[k] || null, enrichment: en.find(e => e.key === k) || null, text: seg.cycles.find(c => c.key === k)?.text || '' })),
        closing: seg.closing,
        completedIntro: past.length ? (seg.completed || "YOUR COMPLETED CYCLES\n\nIf you'd like to recognize or witness the cycles you've already walked, here they are.") : '',
        past: past.map(k => ({ key: k, image: imgs[k] || null, enrichment: en.find(e => e.key === k) || null, text: seg.past.find(c => c.key === k)?.text || '' })),
        qa,
    });
}

const pdfName = (name) => `your-missing-map-${(name || "reading").toString().trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;

async function handleDownloadPdf(birthdata, messages, charts) {
    const doc = await buildPdfDoc(birthdata, messages, charts);
    doc.save(pdfName(birthdata?.name));
}

// Email delivery (only when the server reports it is enabled): upload the finished PDF once.
async function deliverReading(sessionId, birthdata, messages, charts) {
    const doc = await buildPdfDoc(birthdata, messages, charts);
    const pdf = doc.output("datauristring").split(",")[1];
    const res = await fetch(API_URL + "/api/reading/deliver", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, pdf }) });
    return res.ok ? res.json() : { emailed: false };
}

// Read one /api/chat SSE response fully (buffered; nothing is shown while it streams).
async function streamChat(messages, birthdata) {
    const body = { messages: messages.map(m => ({ role: m.role, content: stripMarkers(m.content) })), ...getAccess() };
    if (birthdata) body.birthdata = birthdata;
    const out = { text: "", charts: null, error: null, notice: null };
    try {
        const res = await fetch(API_URL + "/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (res.status === 402) { out.error = "Payment is required to generate a reading."; return out; }
        if (res.status === 409) { const j = await res.json().catch(() => ({})); out.error = j.error || "This purchase's reading has already been created."; out.code = j.code || "already_delivered"; return out; }
        if (!res.ok || !res.body) { out.error = "Server error " + res.status; return out; }
        const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = "";
        outer: while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            let nl;
            while ((nl = buf.indexOf("\n")) >= 0) {
                const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6);
                if (data === "[DONE]") break outer;
                try {
                    const j = JSON.parse(data);
                    if (j.charts) out.charts = j.charts;
                    if (j.workbook) out.workbook = j.workbook;
                    if (j.notice) out.notice = j.notice;
                    if (j.text) out.text += j.text;
                    if (j.error) out.error = j.error;
                } catch (e) {}
            }
        }
    } catch (err) { out.error = err.message || "Network error"; }
    return out;
}

const GEN_LINES = [
    "Calculating your chart and life cycles…",
    "Mapping the channels that have come online…",
    "Weaving your story of becoming…",
    "Bringing it all together into your reading…",
];

function GeneratingScreen() {
    const [i, setI] = useState(0);
    useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % GEN_LINES.length), 6000); return () => clearInterval(t); }, []);
    return (
        <div className="gen-screen" role="status" aria-live="polite">
            <div className="gen-orb" aria-hidden="true" />
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "22px", color: "#e0c068", letterSpacing: "0.08em", margin: "28px 0 12px" }}>Generating your reading…</div>
            <div style={{ fontSize: "17px", lineHeight: 1.6, color: "#f5f1e8", maxWidth: "46ch", margin: "0 auto" }}>
                This takes a few minutes — your full reading and printable PDF will appear when it's ready. Feel free to relax.
            </div>
            <div key={i} className="gen-line">{GEN_LINES[i]}</div>
        </div>
    );
}

// Follow-up questions, trimmed (owner, Oct 2026) to ones that are not redundant with each other or with the reading:
// the reading already covers the cycle Magic Wand and natal wand in this season, the Chiron purpose, Gene Keys,
// integration practices, the nodes and a 24-hour move, so those questions are gone. At most three remain:
// one "how do I live this season's energy through my design" question (type shift, else profile), one about a
// completed First Saturn Return (only when it is not the current cycle), and one about close relationships.
export function followupPrompts(charts) {
    const n = charts?.natal || {};
    const en = charts?.enrichment || [];
    const pretty = t => String(t || "").replace(/_+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const prof = p => { const m = String(p || "").match(/(\d)\D+(\d)/); return m ? `${m[1]}/${m[2]}` : ""; };
    const natalType = pretty(n.type) || "natal";
    const current = en.find(e => e.key === charts?.status?.focus?.key) || en[en.length - 1];
    const saturn = en.find(e => e.key === "saturnReturn");
    const out = [];
    if (current?.type?.shifted) out.push(`How do I live my ${current.transit || current.label} ${current.type.cycle} energy through my ${natalType} design?`);
    else if (current?.profile?.shifted) out.push(`How do I embody my ${current.transit || current.label} ${current.profile.cycle} profile while honoring my natal ${prof(n.profile) || current.profile.natal} profile?`);
    if (saturn && saturn.key !== current?.key) out.push(`What did my First Saturn Return, ${saturn.phase || "The Maiden"}, begin that is flowering now?`);
    out.push("How does my design show up in my closest relationships, and what do I need from the people I love?");
    return out;
}

function DeliveryNotice({ delivery, setDelivery }) {
    const box = { position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto 1.5rem", padding: "1rem 1.25rem", border: "1px solid rgba(201,168,76,0.35)", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.6 };
    const { sessionId, status, to, note } = delivery;
    async function resend() {
        setDelivery({ ...delivery, note: "Sending…" });
        const r = await fetch(API_URL + "/api/reading/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) }).then(x => x.json()).catch(() => ({}));
        setDelivery({ ...delivery, note: r.emailed ? `Sent to ${r.to}.` : (r.error || "Could not resend right now.") });
    }
    if (status === "sending") return <div style={box}>✉ Emailing a copy of your reading…</div>;
    if (status === "sent") return <div style={box}>✉ A copy of your reading has been emailed{to ? ` to ${to}` : ""}.</div>;
    if (status === "failed") return <div style={box}>We couldn't email your reading just now. Please use the Download PDF button below to save it.</div>;
    return (
        <div style={box}>
            <p style={{ margin: "0 0 0.75rem" }}>Your reading for this purchase has already been created and emailed to you.</p>
            <a className="pdf-btn" href={`${API_URL}/api/reading/pdf/${encodeURIComponent(sessionId)}`}>⬇ Download your reading</a>
            <button className="pdf-btn wb-btn" onClick={resend}>✉ Resend email</button>
            {note && <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>{note}</p>}
        </div>
    );
}

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [streamingDone, setStreamingDone] = useState(false);
    const [birthdata, setBirthdata] = useState(null);
    const [arc, setArc] = useState('feminine');  // owner's arcs: feminine (default) or masculine; chosen, never inferred
    const [charts, setCharts] = useState(null);
    const [chartDetected, setChartDetected] = useState(false);
    const [workbook, setWorkbook] = useState(null);
    const [delivery, setDelivery] = useState(null); // { sessionId, status: sending|sent|failed|already, to, note }
    const bottomRef = useRef(null);
    const topRef = useRef(null);
  
    useEffect(() => {
          if (loading) {
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
    }, [messages, loading]);
  
    useEffect(() => {
          const params = new URLSearchParams(window.location.search);
          const sessionId = params.get('session_id');
          const preview = params.get('preview');
          if (preview) {
                  sessionStorage.setItem('ehd_preview_code', preview);
                  window.history.replaceState({}, '', '/');
          }
          const readingLink = params.get('reading');
          if (readingLink) {
                  window.history.replaceState({}, '', '/');
                  setDelivery({ sessionId: readingLink, status: 'already' });
          }
          if (sessionId) sessionStorage.setItem('ehd_session_id', sessionId);
          if (sessionId) {
                  window.history.replaceState({}, '', '/');
                  fetch(`${API_URL}/api/verify-session/${sessionId}`)
                            .then(r => r.json())
                            .then(({ paid, delivery: deliveryOn, delivered, birthdate, birthtime, location, name, arc: paidArc }) => {
                                        if (paid && deliveryOn && delivered) {
                                                      setDelivery({ sessionId, status: 'already' });
                                                      return;
                                        }
                                        if (paid) {
                                                      const syntheticText = `${name ? name + ' ' : ''}${birthdate} ${birthtime} ${location}`.trim();
                                                      const parsed = { birthdate, birthtime, location, name, arc: paidArc === 'masculine' ? 'masculine' : 'feminine' };
                                                      setBirthdata(parsed);
                                                      setChartDetected(true);
                                                      setStreamingDone(false);
                                                      const userMsg = { role: 'user', content: syntheticText };
                                                      runReading([userMsg], parsed, true, deliveryOn ? sessionId : null);
                                        }
                            })
                            .catch(err => console.error('Session verify error:', err));
          }
    }, []);
  
    async function sendMessage(overrideText) {
          const text = (overrideText ?? input).trim();
          if (!text || loading) return;
          setInput("");
          setStreamingDone(false);
          const userMsg = { role: "user", content: text };
          const parsed = parseBirthData(text);
          let currentBirthdata;
          let newMessages;
          if (parsed && getAccess().previewCode) {
                  // Owner preview: skip Stripe, run the reading directly (server verifies the code)
                  currentBirthdata = { birthdate: parsed.birthdate, birthtime: parsed.birthtime, location: parsed.location, name: parsed.name, arc };
                  setBirthdata(currentBirthdata);
                  setChartDetected(true);
                  setStreamingDone(false);
                  newMessages = [...messages, userMsg];
                  setMessages(newMessages);
          } else if (!parsed && !chartDetected) {
                  // Couldn't read birth details: ask again locally instead of sending a chart-less request
                  const miss = parseBirthText(text).missing;
                  setMessages([...messages, userMsg, { role: "assistant", content: `I couldn't read ${miss.length ? miss.join(", ") : "your birth details"} from that. Please enter your name, birth date, birth time, and birthplace, for example:\n\nJocelyn, September 30, 1973, 5:07 AM, Reading, Pennsylvania\n\nYour reading takes a few minutes to generate; when it's complete, a Download PDF button will appear.` }]);
                  return;
          } else if (parsed) {
                  // Redirect to Stripe checkout before delivering the reading
                  setLoading(true);
                  try {
                      const res = await fetch(API_URL + "/api/create-checkout-session", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                              birthdate: parsed.birthdate,
                              birthtime: parsed.birthtime,
                              location: parsed.location,
                              name: parsed.name,
                              arc,
                          }),
                      });
                      const { url } = await res.json();
                      window.location.href = url;
                  } catch (err) {
                      console.error("Stripe redirect error:", err);
                      setLoading(false);
                  }
                  return;
          } else {
                  currentBirthdata = chartDetected ? birthdata : null;
                  newMessages = [...messages, userMsg];
                  setMessages(newMessages);
          }
          await runReading(newMessages, currentBirthdata, !!parsed);
    }

    // Generate (buffered) and reveal everything at once. For a new reading, part 2 ("continue")
    // is generated automatically so the complete reading appears together.
    async function runReading(newMessages, bd, full, deliverSessionId = null) {
          setMessages(newMessages);
          setLoading(true);
          setStreamingDone(false);
          try {
                  const r1 = await streamChat(newMessages, bd);
                  if (r1.charts) setCharts(r1.charts);
                  if (r1.code && deliverSessionId) { setMessages([]); setDelivery({ sessionId: deliverSessionId, status: 'already' }); return; }
                  if (r1.error || !r1.text) {
                          setMessages([...newMessages, { role: "assistant", content: "Something interrupted your reading. Please try again in a moment." + (r1.error ? "\n\n(" + r1.error + ")" : "") }]);
                          return;
                  }
                  let final = [...newMessages, { role: "assistant", content: r1.text, main: full && !r1.notice }];
                  if (full && !r1.notice) {
                          const p1 = r1.text.split("\n").filter(l => !/type\s+["']?continue/i.test(l)).join("\n").trim();
                          const withCont = [...newMessages, { role: "assistant", content: p1, main: true }, { role: "user", content: "continue", hidden: true }];
                          const r2 = await streamChat(withCont, bd);
                          if (r2.workbook) setWorkbook(r2.workbook);
                          final = r2.text && !r2.error ? [...withCont, { role: "assistant", content: r2.text, main: true }] : [...newMessages, { role: "assistant", content: p1, main: true }];
                  }
                  setMessages(final);
                  if (deliverSessionId && final[final.length - 1]?.main) {
                          setDelivery({ sessionId: deliverSessionId, status: 'sending' });
                          deliverReading(deliverSessionId, bd, final, r1.charts)
                                  .then(d => setDelivery({ sessionId: deliverSessionId, status: d.emailed ? 'sent' : 'failed', to: d.to }))
                                  .catch(() => setDelivery({ sessionId: deliverSessionId, status: 'failed' }));
                  }
          } catch (err) {
                  setMessages([...newMessages, { role: "assistant", content: "Something interrupted your reading. Please try again in a moment." }]);
          } finally {
                  setLoading(false);
                  setStreamingDone(true);
                  setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
    }
  
    function handleNewReading() {
          setMessages([]);
          setCharts(null);
          setWorkbook(null);
          setBirthdata(null);
          setChartDetected(false);
          setStreamingDone(false);
          setInput("");
    }
  
    function handleKey(e) {
          if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
          }
    }
  
    const isEmpty = messages.length === 0;
  
    return (
          <div style={{
                  minHeight: "100vh",
                  background: "radial-gradient(ellipse at top, #1a0533 0%, #0a0118 50%, #000 100%)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  fontFamily: "var(--ui-font)",
          }}>
                <Stars />
            {chartDetected && (
                    <button className="new-reading-btn" onClick={handleNewReading}>
                              ✦ New Reading
                    </button>
                )}
                <div style={{
                    position: "relative", zIndex: 1,
                    textAlign: "center",
                    padding: "48px 24px 32px",
                    borderBottom: "1px solid rgba(201,168,76,0.2)",
                    marginBottom: "8px",
          }}>
                        <div style={{ color: "#c9a84c", fontSize: "18px", marginBottom: "12px", opacity: 0.7 }}>✦</div>
                        <h1 style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontFamily: "'Cinzel', Georgia, serif", fontWeight: 400 }}>
                                  <span style={{ fontSize: "clamp(24px,5vw,52px)", color: "#c9a84c", letterSpacing: "0.15em", textTransform: "uppercase" }}>Your Missing</span>
                                  <span style={{ fontSize: "clamp(32px,7vw,72px)", color: "#f0ead8", letterSpacing: "0.06em", lineHeight: 1 }}>Map</span>
                        </h1>
                        <p style={{ margin: "12px auto 0", maxWidth: "46ch", fontSize: "clamp(14px,2.2vw,18px)", color: "rgba(240,234,216,0.75)", fontStyle: "italic", lineHeight: 1.5 }}>The map was always there. No one handed it to you.</p>
                        <p style={{ margin: "8px auto 0", maxWidth: "46ch", fontSize: "clamp(13px,1.9vw,16px)", color: "rgba(240,234,216,0.6)", lineHeight: 1.5 }}>Your personalized Human Design reading through your Saturn, Uranus and Chiron returns.</p>
                        <div style={{ color: "#c9a84c", fontSize: "18px", marginTop: "12px", opacity: 0.7 }}>✦</div>
                  {chartDetected && birthdata && !loading && (
                      <div style={{ marginTop: "12px", fontSize: "12px", color: "rgba(134,239,172,0.85)", background: "rgba(134,239,172,0.08)", border: "1px solid rgba(134,239,172,0.2)", borderRadius: "20px", padding: "4px 16px", display: "inline-block" }}>
                                  Chart retrieved: {birthdata.birthdate} {birthdata.birthtime} — {birthdata.location}
                      </div>
                        )}
                </div>
                <div style={{
                    position: "relative",
                    zIndex: 1,
                    flex: 1,
                    overflowY: "auto",
                    padding: "24px 16px",
                    maxWidth: "760px",
                    width: "100%",
                    margin: "0 auto",
                    boxSizing: "border-box",
          }}>
                        <div ref={topRef} />
                  {chartDetected && !loading && (
                      <ReadingTableOfContents visible={true} birthdata={birthdata} planets={charts?.natal?.planets} cycles={charts?.enrichment || []} status={charts?.status} part={messages.some(m => m.main) ? "contents" : "all"} />
                    )}
                  {isEmpty && (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.45)" }}>
                                  <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.6 }}>✦</div>
                                  <div style={{ fontSize: "18px", lineHeight: "1.65", color: "rgba(230,220,255,0.92)" }}>
                                                Share your birth date, time, and city<br />
                                                to receive Your Missing Map, your evolutionary reading.
                                  </div>
                                  <div style={{ marginTop: "16px", fontSize: "16px", color: "rgba(167,139,250,0.85)" }}>
                                                Example: "My name is Sarah. October 5, 1975 at 6:30am in Chicago, Illinois"
                                  </div>
                                  <div style={{ marginTop: "20px", fontSize: "16px", lineHeight: "1.6", color: "rgba(245,241,232,0.9)", maxWidth: "52ch", marginLeft: "auto", marginRight: "auto" }}>
                                                Your reading takes a few minutes to fully generate. Feel free to relax rather than reading along. When it's complete, a Download PDF button will appear so you can print or save your full report.
                                  </div>
                      </div>
                        )}
                  {delivery && <DeliveryNotice delivery={delivery} setDelivery={setDelivery} />}
                  {loading && <GeneratingScreen />}
                  {!loading && <ReadingView messages={messages} charts={charts} birthdata={birthdata} />}

                  {chartDetected && streamingDone && !loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                      <div style={{
                                    borderTop: '1px solid rgba(201,168,76,0.2)',
                                    paddingTop: '2rem',
                                    marginTop: '2rem'
                      }}>
                                  <button className="pdf-btn" onClick={() => handleDownloadPdf(birthdata, messages, charts)}>
                                      ⬇ Download PDF{splitForPdf(messages).qa.length ? " (includes your questions)" : ""}
                                  </button>
                                  {charts?.natal && (
                                      <button className="pdf-btn wb-btn" onClick={() => downloadWorkbookPdf({ name: birthdata?.name, birthdata, natal: charts.natal, enrichment: charts.enrichment || [], status: charts.status, workbook })}>
                                          ✎ Download The Living Blueprint Workbook
                                      </button>
                                  )}
                                  {charts?.natal && <p className="map-workbook-note" style={{ textAlign: "center", fontStyle: "italic", color: "rgba(240,234,216,0.75)", fontSize: "15px", margin: "0.5rem 0 1.5rem" }}>Your Missing Map is your map. The Living Blueprint Workbook is how you live it.</p>}
                                  <p style={{
                                      fontSize: '0.8rem',
                                      color: 'rgba(201,168,76,0.7)',
                                      marginBottom: '1rem',
                                      textAlign: 'center',
                                      letterSpacing: '0.1em',
                                      textTransform: 'uppercase'
                      }}>
                                                ✦ &nbsp; Continue your reading &nbsp; ✦
                                  </p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {followupPrompts(charts).map((prompt, i) => (
                                        <button
                                                            key={i}
                                                            onClick={() => sendMessage(prompt)}
                                                            style={{
                                                                                  background: 'rgba(201,168,76,0.08)',
                                                                                  border: '1px solid rgba(201,168,76,0.4)',
                                                                                  borderRadius: '4px',
                                                                                  color: 'rgba(240,234,216,0.9)',
                                                                                  padding: '0.75rem 1.25rem',
                                                                                  textAlign: 'left',
                                                                                  cursor: 'pointer',
                                                                                  fontSize: '17px',
                                                                                  lineHeight: '1.5',
                                                                                  transition: 'background 0.2s, border-color 0.2s',
                                                                                  fontFamily: 'var(--ui-font)',
                                                                                  fontStyle: 'italic',
                                                            }}
                                                            onMouseEnter={e => {
                                                                                  e.currentTarget.style.background = 'rgba(201,168,76,0.18)';
                                                                                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.8)';
                                                            }}
                                                            onMouseLeave={e => {
                                                                                  e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
                                                                                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)';
                                                            }}
                                                          >
                                                          ✦ &nbsp; {prompt}
                                        </button>
                                      ))}
                                  </div>
                      </div>
                        )}
                        <div ref={bottomRef} />
                </div>
                <div style={{
                    position: "relative",
                    zIndex: 1,
                    borderTop: "1px solid rgba(167,139,250,0.2)",
                    background: "rgba(10,1,24,0.8)",
                    padding: "16px",
          }}>
                        {!chartDetected && (
                          <div className="arc-choice" role="radiogroup" aria-label="Which arc speaks to you?" style={{ maxWidth: "760px", margin: "0 auto 10px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", color: "rgba(240,234,216,0.85)", fontSize: "14px" }}>
                            <span style={{ fontStyle: "italic" }}>Which arc speaks to you?</span>
                            {[["feminine", "Feminine", "Maiden · Mother · Phoenix · Sovereign"], ["masculine", "Masculine", "Apprentice · Builder · Crucible · Sovereign"]].map(([v, t, d]) => (
                              <button key={v} type="button" role="radio" aria-checked={arc === v} data-arc={v} onClick={() => setArc(v)}
                                style={{ background: arc === v ? "rgba(184,134,11,0.25)" : "transparent", border: "1px solid " + (arc === v ? "#b8860b" : "rgba(167,139,250,0.4)"), color: "inherit", borderRadius: "999px", padding: "5px 12px", cursor: "pointer", fontSize: "13px", fontFamily: "inherit" }}>
                                <strong>{t}</strong> <span style={{ opacity: 0.8 }}>({d})</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div style={{
                      display: "flex",
                      gap: "10px",
                      maxWidth: "760px",
                      margin: "0 auto",
                      background: "rgba(255,255,255,0.12)",
                      border: "1.5px solid rgba(167,139,250,0.6)",
                      borderRadius: "14px",
                      padding: "4px 4px 4px 16px",
          }}>
                                  <textarea
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                onKeyDown={handleKey}
                                                placeholder="Your name + birth date, time, and city..."
                                                rows={1}
                                                style={{
                                                                flex: 1,
                                                                background: "transparent",
                                                                border: "none",
                                                                outline: "none",
                                                                color: "rgba(255,255,255,0.95)",
                                                                fontSize: "17px",
                                                                resize: "none",
                                                                padding: "10px 0",
                                                                fontFamily: "inherit",
                                                                lineHeight: "1.5",
                                                }}
                                              />
                                  <button
                                                onClick={sendMessage}
                                                disabled={loading || !input.trim()}
                                                style={{
                                                                background: loading || !input.trim() ? "rgba(139,92,246,0.3)" : "rgba(139,92,246,0.85)",
                                                                border: "none",
                                                                borderRadius: "10px",
                                                                width: "44px",
                                                                height: "44px",
                                                                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                transition: "background 0.2s",
                                                                alignSelf: "center",
                                                                flexShrink: 0,
                                                }}
                                              >
                                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                                            <line x1="22" y1="2" x2="11" y2="13" />
                                                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                              </svg>
                                  </button>
                        </div>
                        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                                  Press Enter to send · Shift+Enter for new line
                        </div>
                </div>
                <style>{`
                        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
                                :root { --ui-font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; --reading-font: 'Lora', Georgia, 'Times New Roman', serif; }
                                .pdf-btn { display:block; margin: 0 auto 1.5rem; padding: 12px 28px; background: #c9a84c; color: #140d02; border: none; border-radius: 999px; font-family: var(--ui-font); font-size: 16px; font-weight: 600; cursor: pointer; }
                                .pdf-btn:hover { background: #e0c068; }
                                .wb-btn { background: transparent; color: #e0c068; border: 1.5px solid #c9a84c; margin-top: -0.75rem; }
                                .wb-btn:hover { background: rgba(201,168,76,0.15); }
                                ${cycleCardsCss}
                                ${nodesCss}
                                .planet-list { display: flex; flex-direction: column; gap: 10px; }
                                .planet-row { padding: 10px 12px; border-left: 2px solid rgba(201,168,76,0.5); background: rgba(255,255,255,0.03); border-radius: 0 8px 8px 0; }
                                .planet-name { font-family: var(--ui-font); font-weight: 600; font-size: 16px; color: #e0c068; }
                                .planet-meaning { font-size: 16px; color: rgba(245,241,232,0.92); font-style: italic; margin-top: 2px; line-height: 1.5; }
                                .planet-gates { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: 6px; font-family: var(--ui-font); font-size: 15px; color: #f5f1e8; }
                                .planet-gates b { font-weight: 600; color: rgba(245,241,232,0.7); margin-right: 4px; }
                                .planet-gates .unc b { color: #e98b80; }
.gen-screen { text-align: center; padding: 72px 20px 60px; font-family: var(--ui-font); }
                                .gen-orb { width: 84px; height: 84px; margin: 0 auto; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #f3dd8a, #c9a84c 45%, rgba(201,168,76,0.15) 72%); box-shadow: 0 0 40px rgba(201,168,76,0.45); animation: orb 3.2s ease-in-out infinite; }
                                @keyframes orb { 0%,100% { transform: scale(0.92); opacity: 0.75 } 50% { transform: scale(1.06); opacity: 1 } }
                                .gen-line { margin-top: 22px; font-size: 16px; color: rgba(230,220,255,0.9); font-style: italic; animation: fadein 1.2s ease; }
                                @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
                                @media (prefers-reduced-motion: reduce) { .gen-orb, .gen-line { animation: none } }
                                .pdf-btn:focus-visible { outline: 3px solid #f5f1e8; outline-offset: 2px; }
                                * { box-sizing: border-box; }
                                        body { margin: 0; background: #000; }
                                                textarea::placeholder { color: rgba(220,200,255,0.75); }
                                                        textarea::-webkit-scrollbar { display: none; }
                                                                @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
                                                                        .new-reading-btn {
                                                                                  position: fixed;
                                                                                            top: 16px;
                                                                                                      right: 16px;
                                                                                                                padding: 10px 20px;
                                                                                                                          background: transparent;
                                                                                                                                    border: 1px solid #c9a84c;
                                                                                                                                              color: #c9a84c;
                                                                                                                                                        font-family: 'Cinzel', serif;
                                                                                                                                                                  font-size: 10px;
                                                                                                                                                                            letter-spacing: 0.25em;
                                                                                                                                                                                      text-transform: uppercase;
                                                                                                                                                                                                cursor: pointer;
                                                                                                                                                                                                          z-index: 100;
                                                                                                                                                                                                                    transition: all 0.3s;
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                    .new-reading-btn:hover {
                                                                                                                                                                                                                                              background: #c9a84c;
                                                                                                                                                                                                                                                        color: #0f0d0a;
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                      `}</style>
          </div>
        );
}
