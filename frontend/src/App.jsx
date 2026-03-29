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

// Parse birth data from message text
// Looks for patterns like: "October 5, 1975 at 6:30am in Chicago, Illinois"
function parseBirthData(text) {
  // Try to find date pattern
  const datePattern = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})[,\s]+(\d{4})\b/i;
  const dateMatch = text.match(datePattern);

  // Try to find time pattern
  const timePattern = /\b(\d{1,2})(?::(\d{2}))?\s*([ap]m)\b/i;
  const timeMatch = text.match(timePattern);

  // Try 24h time too
  const time24Pattern = /\b([01]?\d|2[0-3]):(\d{2})\b/;
  const time24Match = !timeMatch && text.match(time24Pattern);

  // Try to find location - look for "in [City, State/Country]"
  const locationPattern = /\bin\s+([A-Za-z][A-Za-z\s,\.]+(?:,\s*[A-Za-z\s]+)?)/i;
  const locationMatch = text.match(locationPattern);

  if (!dateMatch || (!timeMatch && !time24Match) || !locationMatch) {
    return null;
  }

  const months = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
  const monthKey = dateMatch[1].substring(0, 3).toLowerCase();
  const month = months[monthKey];
  const day = dateMatch[2].padStart(2, "0");
  const year = dateMatch[3];
  const birthdate = day + "-" + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(month)-1] + "-" + year;

  let birthtime;
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const mins = timeMatch[2] ? timeMatch[2] : "00";
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === "pm" && hours !== 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;
    birthtime = hours.toString().padStart(2, "0") + ":" + mins;
  } else if (time24Match) {
    birthtime = time24Match[1].padStart(2, "0") + ":" + time24Match[2];
  }

  const location = locationMatch[1].trim().replace(/[.,]+$/, "");

  return { birthdate, birthtime, location };
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

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Try to parse birth data from this message
    let currentBirthdata = birthdata;
    if (!currentBirthdata) {
      const parsed = parseBirthData(text);
      if (parsed) {
        currentBirthdata = parsed;
        setBirthdata(parsed);
        setChartDetected(true);
      }
    }

    try {
      const body = {
        messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
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
      const data = await res.json();
      const reply = data.content?.[0]?.text || "No response";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong: " + err.message }]);
    } finally {
      setLoading(false);
    }
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

      {/* Header */}
      <div style={{
        position: "relative",
        zIndex: 1,
        textAlign: "center",
        padding: "32px 24px 16px",
        borderBottom: "1px solid rgba(167,139,250,0.15)",
      }}>
        <div style={{ fontSize: "11px", letterSpacing: "4px", color: "rgba(167,139,250,0.7)", textTransform: "uppercase", marginBottom: "8px" }}>
          Evolutionary
        </div>
        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "400", color: "rgba(255,255,255,0.95)", letterSpacing: "2px" }}>
          Human Design
        </h1>
        <div style={{ fontSize: "11px", letterSpacing: "3px", color: "rgba(167,139,250,0.6)", marginTop: "6px", textTransform: "uppercase" }}>
          Living Blueprint Reader
        </div>
        {chartDetected && birthdata && (
          <div style={{
            marginTop: "10px",
            fontSize: "12px",
            color: "rgba(134,239,172,0.85)",
            background: "rgba(134,239,172,0.08)",
            border: "1px solid rgba(134,239,172,0.2)",
            borderRadius: "20px",
            padding: "4px 16px",
            display: "inline-block",
          }}>
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
        {isEmpty && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.45)" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px", opacity: 0.6 }}>✦</div>
            <div style={{ fontSize: "16px", lineHeight: "1.8", color: "rgba(200,180,255,0.7)" }}>
              Share your birth date, time, and city<br />
              to receive your evolutionary reading.
            </div>
            <div style={{ marginTop: "16px", fontSize: "13px", color: "rgba(167,139,250,0.5)" }}>
              Example: "October 5, 1975 at 6:30am in Chicago, Illinois"
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
              Reading your chart
              <span style={{ display: "inline-block", animation: "pulse 1.5s infinite" }}> ...</span>
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
            placeholder="Share your birth date, time, and city..."
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
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea::placeholder { color: rgba(220,200,255,0.75); }
        textarea::-webkit-scrollbar { display: none; }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
    }
