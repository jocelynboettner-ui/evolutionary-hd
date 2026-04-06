import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://evolutionary-hd.onrender.com";

// Stars background
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


// ============================================================
// PLANETARY KEY — used by Table of Contents
// ============================================================
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

// ============================================================
// READING TABLE OF CONTENTS
// Renders after a reading completes — sits between chart header
// and reading text so people can orient before they read.
// ============================================================
function ReadingTableOfContents({ visible, birthdata }) {
  if (!visible) return null;
  return (
    <div style={{
      background: "rgba(184,134,11,0.04)",
      border: "1px solid rgba(184,134,11,0.15)",
      borderRadius: "8px",
      padding: "32px",
      margin: "24px 0",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "28px" }}>
        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
        <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "14px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,234,216,0.7)", margin: 0, fontWeight: 400 }}>{birthdata?.name ? `${birthdata.name}'s Reading Contains` : 'Your Reading Contains'}</h2>
        <span style={{ color: "#b8860b", fontSize: "14px", opacity: 0.7 }}>✦</span>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        {[
          { title: "PART ONE — WHO YOU ARE", items: ["Type & Strategy", "Inner Authority", "Profile", "Incarnation Cross", "Definition"] },
                  { title: "PART TWO — YOUR SUPERPOWERS AND SUPERHIGHWAYS", items: ["Your Channels", "Your Active Gates with Planetary Placements"] },
                  { title: "PART THREE — YOUR CURRENT CHAPTER", items: ["Your Current Chapter", "Living It Now", "Decision-Making In This Cycle"] },
                  { title: "PART FOUR — YOUR STORY OF BECOMING", items: ["Saturn Return", "Uranus Opposition", "Chiron Return", "Your Role in the New Era"] },
          { title: "PART FIVE — WHAT IS MOST ALIVE RIGHT NOW", items: ["Today's Transit Activations", "What You Are Learning", "Who You Are Becoming"] },
          { title: "PART SIX — THE INVITATION FORWARD", items: [] },
        ].map(({ title, items }) => (
          <div key={title} style={{ borderLeft: "1px solid rgba(184,134,11,0.2)", paddingLeft: "16px" }}>
            <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "6px" }}>{title}</div>
            {items.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                {items.map(item => (
                  <span key={item} style={{ fontSize: "13px", color: "rgba(240,234,216,0.55)", fontStyle: "italic" }}>{item}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ textAlign: "center", color: "rgba(184,134,11,0.3)", margin: "24px 0", letterSpacing: "0.3em" }}>—</div>

      {/* Planetary Key */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "8px" }}>PLANETARY KEY — How To Read Your Gates</div>
        <div style={{ fontSize: "13px", color: "rgba(240,234,216,0.5)", fontStyle: "italic", marginBottom: "16px", lineHeight: "1.5" }}>
          Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "6px 24px" }}>
          {PlanetaryKey.map(({ planet, meaning }) => (
            <div key={planet} style={{ display: "flex", alignItems: "baseline", gap: "8px", fontSize: "12px" }}>
              <span style={{ color: "rgba(240,234,216,0.8)", whiteSpace: "nowrap", minWidth: "140px" }}>{planet}</span>
              <span style={{ color: "rgba(184,134,11,0.4)", flexShrink: 0 }}>→</span>
              <span style={{ color: "rgba(240,234,216,0.45)", fontStyle: "italic" }}>{meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ textAlign: "center", color: "rgba(184,134,11,0.3)", margin: "24px 0", letterSpacing: "0.3em" }}>—</div>

      {/* Definition Key */}
      <div>
        <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "12px" }}>HOW TO READ YOUR DEFINITION</div>
        <p style={{ fontSize: "13px", color: "rgba(240,234,216,0.55)", lineHeight: "1.7", marginBottom: "12px", margin: "0 0 12px 0" }}>
          Think of your defined centers as <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>towns you know intimately</strong> — you grew up here, you know every street, you can give directions with confidence, you know exactly what to do and where to go. This is consistent, reliable energy that is always available to you.
        </p>
        <p style={{ fontSize: "13px", color: "rgba(240,234,216,0.55)", lineHeight: "1.7", marginBottom: "12px", margin: "0 0 12px 0" }}>
          Your defined <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>channels are the superhighways</strong> between those towns — familiar routes you travel automatically, with no need to think about which way to turn. This is where your most consistent gifts live.
        </p>
        <p style={{ fontSize: "13px", color: "rgba(240,234,216,0.55)", lineHeight: "1.7", margin: 0 }}>
          Your <strong style={{ color: "rgba(240,234,216,0.8)", fontWeight: 600 }}>undefined or open centers</strong> are places you are still exploring — like visiting a new city where you might take a taxi or ask a local for directions. You are learning here, not leading. These are also the places where you are most receptive, most flexible, and most wise about the experiences of others.
        </p>
      </div>
    </div>
  );
}

function parseBirthData(text) {
  const MONTHS = {
    jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
    jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
  };
  const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let month, day, year;

  // ISO: 1975-01-20
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) { year = isoMatch[1]; month = isoMatch[2]; day = isoMatch[3]; }

  // Numeric: 1/20/1975 or 01-20-1975
  if (!month) {
    const nm = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
    if (nm) { month = nm[1].padStart(2,"0"); day = nm[2].padStart(2,"0"); year = nm[3]; }
  }

  // Word month: "January 20, 1975" / "January 20th, 1975" / "20 January 1975"
  if (!month) {
    const wordRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})\b/i;
    const wordRe2 = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*[,\s]\s*(\d{4})\b/i;
    const m1 = text.match(wordRe);
    const m2 = !m1 && text.match(wordRe2);
    if (m1) { month = MONTHS[m1[1].substring(0,3).toLowerCase()]; day = m1[2].padStart(2,"0"); year = m1[3]; }
    else if (m2) { day = m2[1].padStart(2,"0"); month = MONTHS[m2[2].substring(0,3).toLowerCase()]; year = m2[3]; }
  }

  if (!month || !day || !year) return null;
  const birthdate = year + "-" + month + "-" + day;

  // Time: handles "12:11 PM", "12:11pm", "5:07 AM", "5:07am", "14:30"
  let birthtime = "12:00";
  const time12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap]m)\b/i);
  const time24 = !time12 && text.match(/\b([01]?\d|2[0-3]):(\d{2})\b/);
  if (time12) {
    let h = parseInt(time12[1]);
    const m = time12[2] || "00";
    const ampm = time12[3].toLowerCase();
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;
    birthtime = h.toString().padStart(2,"0") + ":" + m;
  } else if (time24) {
    birthtime = time24[1].padStart(2,"0") + ":" + time24[2];
  }

  // Strip date/time tokens before location matching to avoid "PM City, ST" false matches
  let locText = text
    .replace(/\b\d{4}-\d{2}-\d{2}\b/, "")
    .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}\b/, "")
    .replace(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}\b/gi, "")
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*[,\s]\s*\d{4}\b/gi, "")
    .replace(/\b\d{1,2}(?::\d{2})?\s*[ap]m\b/gi, "")
    .replace(/\b([01]?\d|2[0-3]):\d{2}\b/, "")
    .replace(/\bat\b/gi, "")
    .trim();

  let location = null;

  // 1. Explicit "in City, State" or "in City State"
  const inMatch = locText.match(/\bin\s+([A-Za-z][A-Za-z .]+(?:,\s*[A-Za-z]{2,})?)/i);
  if (inMatch) location = inMatch[1].trim().replace(/[.,]+$/, "").trim();

  // 2. "City, State" — comma-separated — in cleaned text
  if (!location) {
    const commaMatch = locText.match(/([A-Za-z][A-Za-z .]{1,}),\s*([A-Za-z]{2,})/);
    if (commaMatch) location = commaMatch[1].trim() + ", " + commaMatch[2].trim();
  }

  // 3. "City ST" — bare city + 2-letter state code at end
  if (!location) {
    const endMatch = locText.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+([A-Z]{2})\s*$/);
    if (endMatch) location = endMatch[1] + ", " + endMatch[2];
  }

  if (!location) return null;
        // Extract name if present
        const nameMatch = text.match(/(?:my name is|i'm|i am|called)\s+([A-Z][a-z]+)/i)
          || text.match(/^([A-Z][a-z]+)\s*[—\-,]/m);
        const name = nameMatch ? nameMatch[1] : null;
  return { birthdate, birthtime, location, name };
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
                          maxWidth: "80%",
                          background: isUser
                                        ? "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(109,40,217,0.6))"
                                        : "rgba(255,255,255,0.07)",
                          border: isUser ? "none" : "1px solid rgba(167,139,250,0.25)",
                          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                          padding: "14px 18px",
                          color: "rgba(255,255,255,0.92)",
                          fontSize: "15px",
                          lineHeight: "1.65",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
              }}>
                        {content}
                    </div>
              </div>
            );
}

export default function App() {
      const [messages, setMessages] = useState([]);
      const [input, setInput] = useState("");
      const [loading, setLoading] = useState(false);
      const [birthdata, setBirthdata] = useState(null);
      const [chartDetected, setChartDetected] = useState(false);
      const bottomRef = useRef(null);
    
      useEffect(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, [messages, loading]);

        // ── STRIPE: Check for returning paid session ──
        useEffect(() => {
                  const params = new URLSearchParams(window.location.search);
                  const sessionId = params.get('session_id');
                  if (sessionId) {
                              window.history.replaceState({}, '', '/');
                              fetch(`${API_URL}/api/verify-session/${sessionId}`)
                                .then(r => r.json())
                                .then(({ paid, birthdate, birthtime, location, name }) => {
                                                if (paid) {
                                                                  const syntheticText = `${name ? name + ' ' : ''}${birthdate} ${birthtime} ${location}`.trim();
                                                                  setInput(syntheticText);
                                                                  const parsed = { birthdate, birthtime, location, name };
                                                                  setBirthdata(parsed);
                                                                  setChartDetected(true);
                                                                  const userMsg = { role: 'user', content: syntheticText };
                                                                  const newMessages = [userMsg];
                                                                  setMessages(newMessages);
                                                                  setLoading(true);
                                                                  fetch(`${API_URL}/api/chat`, {
                                                                                      method: 'POST',
                                                                                      headers: { 'Content-Type': 'application/json' },
                                                                                      body: JSON.stringify({ messages: newMessages, birthdata: parsed }),
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
                                                                                                                                                                                          if (parsed2.text) {
                                                                                                                                                                                                                        fullText += parsed2.text;
                                                                                                                                                                                                                        setMessages([...newMessages, { role: 'assistant', content: fullText }]);
                                                                                                                                                                                                                      }
                                                                                                                                                                    } catch (e) {}
                                                                                                                                          }
                                                                                                                  }
                                                                                            }
                                                                                      setLoading(false);
                                                                  }).catch(() => setLoading(false));
                                                }
                                })
                                .catch(err => console.error('Session verify error:', err));
                  }
        }, []);
    
      async function sendMessage() {
              const text = input.trim();
              if (!text || loading) return;
              setInput("");
          
              const userMsg = { role: "user", content: text };
          
              // Always try to parse birth data from every message
              const parsed = parseBirthData(text);
          
              let currentBirthdata;
              let newMessages;
          
              if (parsed) {
                        // New birth data detected — always treat as a completely new person.

                        // ── STRIPE: If new birth data and not yet paid, redirect to checkout ──
                        if (parsed && !chartDetected) {
                                    setLoading(true);
                                    try {
                                                  const res = await fetch(`${API_URL}/api/create-checkout-session`, {
                                                                  method: 'POST',
                                                                  headers: { 'Content-Type': 'application/json' },
                                                                  body: JSON.stringify({
                                                                                    birthdate: parsed.birthdate,
                                                                                    birthtime: parsed.birthtime,
                                                                                    location: parsed.location,
                                                                                    name: parsed.name || '',
                                                                  }),
                                                  });
                                                  const { url } = await res.json();
                                                  window.location.href = url;
                                    } catch (err) {
                                                  console.error('Checkout error:', err);
                                                  setLoading(false);
                                    }
                                    return;
                        }
                        // Reset ALL state so nothing from the previous session bleeds through.
                        currentBirthdata = parsed;
                        setBirthdata(parsed);
                        setChartDetected(true);
                        setMessages([userMsg]);       // clear old messages immediately
                        newMessages = [userMsg];      // only this message goes to server
              } else {
                        // Only use stored birthdata if it belongs to this session
                        // Never fall back to potentially stale data from a previous person
                        currentBirthdata = chartDetected ? birthdata : null;
                        newMessages = [...messages, userMsg];
                        setMessages(newMessages);
              }
          
              setLoading(true);
          
              try {
                        const body = {
                                    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
                        };
                        if (currentBirthdata) {
                                    body.birthdata = currentBirthdata;
                        } else if (chartDetected && currentBirthdata) {
                                    // Safety net: always send stored birthdata for follow-up messages
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
                                                                                                        if (parsed.text) {
                                                                                                                              fullText += parsed.text;
                                                                                                                              setMessages([...newMessages, { role: "assistant", content: fullText }]);
                                                                                                            }
                                                                                                        if (parsed.error) {
                    setMessages([...newMessages, {
                      role: "assistant",
                      content: "Something shifted — please try again in a moment. 🌀"
                    }]);
                    setLoading(false);
                    return;
                  }
                                                                                        } catch (e) { /* skip malformed */ }
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
              }
      }
    
      function handleNewReading() {
              setMessages([]);
              setBirthdata(null);
              setChartDetected(false);
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
                        fontFamily: "'Georgia', serif",
              }}>
                    <Stars />
      {chartDetected && (
        <button className="new-reading-btn" onClick={handleNewReading}>
          ✦ New Reading
        </button>
      )}
              
      {/* Header */}
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
              
                  {/* Messages */}
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
                        {chartDetected && (
          <ReadingTableOfContents visible={true}  birthdata={birthdata}/>
        )}
        {isEmpty && (
                            <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.45)" }}>
                                        <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.6 }}>✦</div>
                                        <div style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(200,180,255,0.7)" }}>
                                                      Share your birth date, time, and city<br />
                                                      to receive your evolutionary reading.
                                        </div>
                                        <div style={{ marginTop: "16px", fontSize: "16px", color: "rgba(167,139,250,0.85)" }}>
                                                      Example: "My name is Sarah. October 5, 1975 at 6:30am in Chicago, Illinois"
                                        </div>
                            </div>
                            )}
                        {messages.map((m, i) => <Message key={i} role={m.role} content={m.content} />)}
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
                            <div ref={bottomRef} />
                    </div>
              
                  {/* Input */}
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
                                                                        fontSize: "15px",
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
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
        }`}</style>
              </div>
            );
}
