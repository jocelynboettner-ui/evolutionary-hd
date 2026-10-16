import { useState, useRef, useEffect } from "react";
import { downloadReadingPdf } from "./readingPdf.js";
import { parseBirthText } from "../../backend/birth-parse.js";
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

function ReadingTableOfContents({ visible, birthdata }) {
    if (!visible) return null;
    return (
          <div style={{
                  background: "rgba(184,134,11,0.04)",
                  border: "1px solid rgba(184,134,11,0.15)",
                  borderRadius: "8px",
                  padding: "32px",
                  margin: "24px 0",
                  fontFamily: "var(--reading-font)",
          }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "28px" }}>
                        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
                        <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,216,0.7)", margin: 0, fontWeight: 400 }}>
                          {birthdata?.name ? `${birthdata.name}'s Reading Contains` : 'Your Reading Contains'}
                        </h2>
                        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  {[
            { title: "PART ONE — WHO YOU ARE", items: ["Type & Strategy", "Inner Authority", "Profile", "Incarnation Cross", "Definition"] },
            { title: "PART TWO — YOUR SUPERPOWERS AND SUPERHIGHWAYS", items: ["Your Channels", "Your Active Gates with Planetary Placements"] },
            { title: "PART THREE — YOUR CURRENT CHAPTER", items: ["Your Current Chapter", "Living It Now", "Decision-Making In This Cycle"] },
            { title: "PART FOUR — YOUR STORY OF BECOMING", items: ["Saturn Return", "Uranus Opposition", "Chiron Return"] },
            { title: "PART FIVE — WHAT IS MOST ALIVE RIGHT NOW", items: ["Today's Transit Activations", "What You Are Learning", "Who You Are Becoming"] },
            { title: "PART SIX — THE INVITATION FORWARD", items: [] },
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
                <div style={{ textAlign: "center", color: "rgba(184,134,11,0.3)", margin: "24px 0", letterSpacing: "0.3em" }}>—</div>
                <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "8px" }}>PLANETARY KEY — How To Read Your Gates</div>
                        <div style={{ fontSize: "16px", color: "rgba(240,234,216,0.85)", fontStyle: "italic", marginBottom: "16px", lineHeight: "1.6" }}>
                                  Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life.
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "6px 24px" }}>
                          {PlanetaryKey.map(({ planet, meaning }) => (
                        <div key={planet} style={{ display: "flex", alignItems: "baseline", gap: "8px", fontSize: "15px" }}>
                                      <span style={{ color: "rgba(240,234,216,0.8)", whiteSpace: "nowrap", minWidth: "140px" }}>{planet}</span>
                                      <span style={{ color: "rgba(184,134,11,0.4)", flexShrink: 0 }}>→</span>
                                      <span style={{ color: "rgba(240,234,216,0.85)", fontStyle: "italic" }}>{meaning}</span>
                        </div>
                      ))}
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

// Bodygraph SVGs: natal + each currently-active cycle overlay (natal + cycle activations)
function bodygraphSvgs(charts) {
    if (!charts?.natal) return [];
    const n = charts.natal;
    const list = [{ key: 'natal', svg: renderBodygraphSVG({ natal: n, title: 'Natal Bodygraph', subtitle: [n.type, n.profile, n.authority].filter(Boolean).join(' · ') }) }];
    (charts.cycles || []).forEach(c => {
        if (!c.chart) return;
        const recent = charts.status?.between;
        const sub = c.key === 'chironReturn' && c.permanent ? 'Permanent overlay since ' + c.peak : (recent ? 'Completed · window ' : 'Window ') + c.start + ' to ' + c.end;
        list.push({ key: c.key, svg: renderBodygraphSVG({ natal: n, overlay: c.chart, title: (recent ? 'Most recently completed: ' : 'Current cycle: ') + c.label, subtitle: sub }) });
    });
    return list;
}

function Bodygraphs({ charts }) {
    const list = bodygraphSvgs(charts);
    if (!list.length) return null;
    const st = charts.status;
    return (
        <div style={{ background: "rgba(14,8,26,0.92)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
            {st && (
                <p style={{ margin: "0 0 14px", color: "#f5f1e8", fontSize: "17px", lineHeight: 1.6, textAlign: "center" }}>
                    {st.active.length
                        ? <>You are in: <strong style={{ color: "#e0c068" }}>{st.active.map(c => c.label).join(" + ")}</strong></>
                        : <>Between cycles{st.recent ? <> · most recently completed: <strong style={{ color: "#e0c068" }}>{st.recent.label}</strong></> : null}</>}
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

async function handleDownloadPdf(birthdata, messages, charts) {
    let images = [];
    try { images = await Promise.all(bodygraphSvgs(charts).map(b => svgToPng(b.svg))); }
    catch (e) { console.error('Bodygraph image error:', e); }
    downloadReadingPdf({
        name: birthdata?.name,
        birthdata,
        parts: messages.filter(m => m.role === 'assistant' && m.content).map(m => m.content),
        images,
    });
}

const FOLLOWUP_PROMPTS = [
    "What are the locks and keys I carry in my Chiron overlay — and what do they mean for my role in the great transition?",
    "What are my greatest gifts to embody right now — the capacities that are fully online and ready to be lived?",
    "Tell me more about what I am learning in the cycle I am currently navigating.",
    "What is the wound that is becoming my medicine — and how do I know when it has fully turned?",
    "What does my design say about how I am meant to serve in the season I am in now?"
  ];

export default function App() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [streamingDone, setStreamingDone] = useState(false);
    const [birthdata, setBirthdata] = useState(null);
    const [charts, setCharts] = useState(null);
    const [chartDetected, setChartDetected] = useState(false);
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
          if (sessionId) sessionStorage.setItem('ehd_session_id', sessionId);
          if (sessionId) {
                  window.history.replaceState({}, '', '/');
                  fetch(`${API_URL}/api/verify-session/${sessionId}`)
                            .then(r => r.json())
                            .then(({ paid, birthdate, birthtime, location, name }) => {
                                        if (paid) {
                                                      const syntheticText = `${name ? name + ' ' : ''}${birthdate} ${birthtime} ${location}`.trim();
                                                      const parsed = { birthdate, birthtime, location, name };
                                                      setBirthdata(parsed);
                                                      setChartDetected(true);
                                                      setStreamingDone(false);
                                                      const userMsg = { role: 'user', content: syntheticText };
                                                      const newMessages = [userMsg];
                                                      setMessages(newMessages);
                                                      setLoading(true);
                                                      fetch(`${API_URL}/api/chat`, {
                                                                      method: 'POST',
                                                                      headers: { 'Content-Type': 'application/json' },
                                                                      body: JSON.stringify({ messages: newMessages, birthdata: parsed, ...getAccess() }),
                                                      }).then(async res => {
                                                                      if (!res.ok) { setLoading(false); return; }
                                                                      const reader = res.body.getReader();
                                                                      const decoder = new TextDecoder();
                                                                      let fullText = '';
                                                                      setMessages([...newMessages, { role: 'assistant', content: '' }]);
                                                                      while (true) {
                                                                                        const { done, value } = await reader.read();
                                                                                        if (done) break;
                                                                                        const chunk = decoder.decode(value);
                                                                                        const lines = chunk.split('\n');
                                                                                        for (const line of lines) {
                                                                                                            if (line.startsWith('data: ')) {
                                                                                                                                  const data = line.slice(6).trim();
                                                                                                                                  if (data === '[DONE]') break;
                                                                                                                                  try {
                                                                                                                                                          const parsed2 = JSON.parse(data);
                                                                                                                                                          if (parsed2.charts) setCharts(parsed2.charts);
                                                                                                                                                          if (parsed2.text) {
                                                                                                                                                                                    fullText += parsed2.text;
                                                                                                                                                                                    setMessages([...newMessages, { role: 'assistant', content: fullText }]);
                                                                                                                                                                                    await new Promise(r => setTimeout(r, 20));
                                                                                                                                                            }
                                                                                                                                    } catch (e) {}
                                                                                                              }
                                                                                          }
                                                                      }
                                                                      setLoading(false);
                                                                      setStreamingDone(true);
                                                                      setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                                                      }).catch(() => setLoading(false));
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
                  currentBirthdata = { birthdate: parsed.birthdate, birthtime: parsed.birthtime, location: parsed.location, name: parsed.name };
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
          setLoading(true);
          try {
                  const body = {
                            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
                            ...getAccess(),
                  };
                  if (currentBirthdata) {
                            body.birthdata = currentBirthdata;
                  }
                  const res = await fetch(API_URL + "/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body),
                  });
                  if (!res.ok) throw new Error("Server error: " + res.status);
                  const contentType = res.headers.get("content-type") || "";
                  if (contentType.includes("text/event-stream")) {
                            const reader = res.body.getReader();
                            const decoder = new TextDecoder();
                            let fullText = "";
                            setMessages([...newMessages, { role: "assistant", content: "" }]);
                            while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;
                                        const chunk = decoder.decode(value);
                                        const lines = chunk.split("\n");
                                        for (const line of lines) {
                                                      if (line.startsWith("data: ")) {
                                                                      const data = line.slice(6).trim();
                                                                      if (data === "[DONE]") break;
                                                                      try {
                                                                                        const parsed = JSON.parse(data);
                                                                                        if (parsed.charts) setCharts(parsed.charts);
                                                                                        if (parsed.text) {
                                                                                                            fullText += parsed.text;
                                                                                                            setMessages([...newMessages, { role: "assistant", content: fullText }]);
                                                                                                            await new Promise(r => setTimeout(r, 20));
                                                                                          }
                                                                                        if (parsed.error) {
                                                                                                            setMessages([...newMessages, {
                                                                                                                                  role: "assistant",
                                                                                                                                  content: "Something shifted — please try again in a moment. 🌀"
                                                                                                              }]);
                                                                                                            setLoading(false);
                                                                                                            return;
                                                                                          }
                                                                      } catch (e) {}
                                                      }
                                        }
                            }
                  } else {
                            const data = await res.json();
                            const reply = data.content?.[0]?.text || "No response";
                            setMessages([...newMessages, { role: "assistant", content: reply }]);
                  }
          } catch (err) {
                  setMessages([...newMessages, { role: "assistant", content: "Something went wrong: " + err.message }]);
          } finally {
                  setLoading(false);
                  setStreamingDone(true);
                  setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
    }
  
    function handleNewReading() {
          setMessages([]);
          setCharts(null);
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
                                  <span style={{ fontSize: "clamp(24px,5vw,52px)", color: "#c9a84c", letterSpacing: "0.15em", textTransform: "uppercase" }}>Evolutionary</span>
                                  <span style={{ fontSize: "clamp(32px,7vw,72px)", color: "#f0ead8", letterSpacing: "0.06em", lineHeight: 1 }}>Human Design</span>
                                  <span style={{ fontSize: "clamp(11px,2vw,16px)", color: "rgba(240,234,216,0.55)", letterSpacing: "0.35em", textTransform: "uppercase", fontStyle: "italic", marginTop: "8px" }}>Living Blueprint Reader</span>
                        </h1>
                        <div style={{ color: "#c9a84c", fontSize: "18px", marginTop: "12px", opacity: 0.7 }}>✦</div>
                  {chartDetected && birthdata && (
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
                  {chartDetected && (
                      <ReadingTableOfContents visible={true} birthdata={birthdata} />
                    )}
                  {isEmpty && (
                      <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.45)" }}>
                                  <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.6 }}>✦</div>
                                  <div style={{ fontSize: "18px", lineHeight: "1.65", color: "rgba(230,220,255,0.92)" }}>
                                                Share your birth date, time, and city<br />
                                                to receive your evolutionary reading.
                                  </div>
                                  <div style={{ marginTop: "16px", fontSize: "16px", color: "rgba(167,139,250,0.85)" }}>
                                                Example: "My name is Sarah. October 5, 1975 at 6:30am in Chicago, Illinois"
                                  </div>
                                  <div style={{ marginTop: "20px", fontSize: "16px", lineHeight: "1.6", color: "rgba(245,241,232,0.9)", maxWidth: "52ch", marginLeft: "auto", marginRight: "auto" }}>
                                                Your reading takes a few minutes to fully generate. Feel free to relax rather than reading along. When it's complete, a Download PDF button will appear so you can print or save your full report.
                                  </div>
                      </div>
                        )}
                  {charts && <Bodygraphs charts={charts} />}
                  {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
                  {loading && chartDetected && (
                      <div className="gen-banner" role="status" aria-live="polite">
                          <div style={{ fontWeight: 600, fontSize: "17px", marginBottom: "6px", color: "#e0c068" }}>✦ Your reading is being created</div>
                          <div style={{ fontSize: "16px", lineHeight: 1.6 }}>
                              It takes a few minutes to fully generate. Feel free to relax rather than reading along. When it's complete, a <strong>Download PDF</strong> button will appear so you can print or save your full report.
                          </div>
                          <div className="gen-bar"><span /></div>
                      </div>
                  )}
                  {loading && (
                      <div style={{ display: "flex", justifyContent: "flex-start", padding: "0 8px", marginBottom: "16px" }}>
                                  <div style={{
                                      background: "rgba(255,255,255,0.07)",
                                      border: "1px solid rgba(167,139,250,0.25)",
                                      borderRadius: "18px 18px 18px 4px",
                                      padding: "14px 20px",
                                      color: "rgba(167,139,250,0.7)",
                                      fontSize: "14px",
                      }}>
                                                Reading your chart <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}> ...</span>
                                  </div>
                      </div>
                        )}
                  {chartDetected && streamingDone && !loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                      <div style={{
                                    borderTop: '1px solid rgba(201,168,76,0.2)',
                                    paddingTop: '2rem',
                                    marginTop: '2rem'
                      }}>
                                  <button className="pdf-btn" onClick={() => handleDownloadPdf(birthdata, messages, charts)}>
                                      ⬇ Download PDF
                                  </button>
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
                                    {FOLLOWUP_PROMPTS.map((prompt, i) => (
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
                                .gen-banner { position: sticky; top: 12px; z-index: 50; margin: 0 8px 18px; padding: 16px 20px; background: rgba(30,18,52,0.97); border: 1px solid #c9a84c; border-radius: 14px; color: #f5f1e8; font-family: var(--ui-font); box-shadow: 0 6px 24px rgba(0,0,0,0.5); }
                                .gen-bar { margin-top: 12px; height: 6px; border-radius: 3px; background: rgba(201,168,76,0.2); overflow: hidden; }
                                .gen-bar span { display: block; width: 35%; height: 100%; border-radius: 3px; background: #c9a84c; animation: genslide 1.8s ease-in-out infinite; }
                                @keyframes genslide { 0% { transform: translateX(-100%) } 100% { transform: translateX(300%) } }
                                @media (prefers-reduced-motion: reduce) { .gen-bar span { animation: none; width: 100%; opacity: 0.5 } }
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
