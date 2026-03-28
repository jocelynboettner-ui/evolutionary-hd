import { useState, useRef, useEffect, useCallback } from "react";

const API_URL = "https://evolutionary-hd.onrender.com";

const STARTERS = [
  { icon: "◈", label: "Generate my Evolutionary Human Design" },
  { icon: "◎", label: "What cycle am I currently in?" },
  { icon: "⟡", label: "Show my activated channels" },
  { icon: "◑", label: "What am I becoming?" },
  { icon: "✦", label: "Read my Human Design evolution" },
];

function StarField() {
  const stars = useRef(
    Array.from({ length: 110 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 1.2 + 0.2,
      delay: Math.random() * 8,
      dur: 3 + Math.random() * 5,
      peak: 0.12 + Math.random() * 0.5,
    }))
  ).current;
  return (
    <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cosmos" cx="45%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#120822" />
          <stop offset="55%" stopColor="#07041a" />
          <stop offset="100%" stopColor="#030210" />
        </radialGradient>
        <radialGradient id="neb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4338ca" stopOpacity="0.11" />
          <stop offset="100%" stopColor="#4338ca" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#cosmos)" />
      <ellipse cx="18%" cy="72%" rx="28%" ry="18%" fill="url(#neb1)" />
      <ellipse cx="82%" cy="22%" rx="22%" ry="14%" fill="url(#neb2)" />
      {stars.map((s) => (
        <circle key={s.id} cx={s.x + "%"} cy={s.y + "%"} r={s.r} fill="white" opacity={0}>
          <animate attributeName="opacity" values={"0;" + s.peak + ";0"} dur={s.dur + "s"} begin={s.delay + "s"} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px" }}>
      <span style={{ color: "#a78bfa", fontSize: 10, letterSpacing: "0.18em", fontFamily: "Georgia, serif", opacity: 0.65, textTransform: "uppercase" }}>Reading</span>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "linear-gradient(135deg, #c4b5fd, #818cf8)", animation: "hdpulse 1.4s ease-in-out " + (i * 0.18) + "s infinite" }} />
      ))}
    </div>
  );
}

function renderContent(content) {
  const lines = content.split("\n");
  const out = [];
  let k = 0;
  for (const line of lines) {
    if (/^═{4,}$/.test(line.trim())) {
      out.push(<div key={k++} style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.22), rgba(129,140,248,0.18), transparent)", margin: "16px 0 12px" }} />);
      continue;
    }
    if (/^[🌐🧬🔄🔀⚡🌀✧🎭🌱]/.test(line)) {
      const emoji = line.match(/^[🌐🧬🔄🔀⚡🌀✧🎭🌱]/)[0];
      const text = line.replace(/^[🌐🧬🔄🔀⚡🌀✧🎭🌱]\s*/, "");
      out.push(<div key={k++} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 4 }}><span style={{ fontSize: 14 }}>{emoji}</span><span style={{ fontFamily: "Georgia, serif", fontSize: 10, letterSpacing: "0.2em", color: "#ddc8ff", textTransform: "uppercase", fontWeight: "bold" }}>{text}</span></div>);
      continue;
    }
    if (/^✦/.test(line)) {
      out.push(<div key={k++} style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#e9d5ff", letterSpacing: "0.06em", marginTop: 16, marginBottom: 4, fontWeight: "bold" }}>{line}</div>);
      continue;
    }
    if (/^[▸•]\s/.test(line)) {
      out.push(<div key={k++} style={{ display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "#a78bfa", flexShrink: 0 }}>▸</span><span style={{ color: "#ede0ff", fontSize: 13.5, lineHeight: 1.75 }}>{line.replace(/^[▸•]\s/, "")}</span></div>);
      continue;
    }
    const lm = line.match(/^(Type|Strategy|Authority|Profile|Definition|Incarnation Cross|Activated Centers|Open Centers|Cycle|Focus|Apex Age|Your Position|Phase|Window|Theme|Overlay Cross|Emerging Profile|Sun|Moon|Rising|Mercury|Venus|Mars|Jupiter|Saturn|Uranus|Neptune|Pluto|North Node|South Node|What it activates|Why it appears now|How it helps you evolve):\s*(.*)/);
    if (lm) {
      out.push(<div key={k++} style={{ marginBottom: 5, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "baseline" }}><span style={{ color: "#a78bfa", fontSize: 11, fontFamily: "Georgia, serif", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>{lm[1]}:</span><span style={{ color: "#f0e8ff", fontSize: 13.5, lineHeight: 1.65 }}>{lm[2]}</span></div>);
      continue;
    }
    if (line.trim() === "") { out.push(<div key={k++} style={{ height: 5 }} />); continue; }
    out.push(<p key={k++} style={{ color: "#ede0ff", fontSize: 14, lineHeight: 1.8, margin: "0 0 4px" }}>{line}</p>);
  }
  return out;
}

function Message({ msg, isNew }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 20, gap: 10, animation: isNew ? "msgIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards" : "none", opacity: isNew ? 0 : 1 }}>
      {!isUser && <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#e9d5ff", flexShrink: 0, marginTop: 2, boxShadow: "0 0 0 1px rgba(167,139,250,0.2), 0 0 20px rgba(109,40,217,0.38)" }}>✦</div>}
      <div style={{ maxWidth: isUser ? "72%" : "88%", padding: isUser ? "12px 18px" : "16px 20px", borderRadius: isUser ? "20px 20px 6px 20px" : "6px 20px 20px 20px", background: isUser ? "linear-gradient(135deg, rgba(109,40,217,0.35) 0%, rgba(67,56,202,0.28) 100%)" : "rgba(255,255,255,0.07)", border: isUser ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(16px)" }}>
        {isUser ? <p style={{ color: "#ffffff", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{msg.content}</p> : renderContent(msg.content)}
      </div>
    </div>
  );
}

function StarterChip({ starter, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={() => onClick(starter.label)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(109,40,217,0.2)" : "rgba(255,255,255,0.03)", border: hovered ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.08)", borderRadius: 40, padding: "9px 16px", color: hovered ? "#e9d5ff" : "#b8a8d8", fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s ease", backdropFilter: "blur(8px)", fontFamily: "Georgia, serif", letterSpacing: "0.02em", animation: "chipIn 0.5s " + delay + "s cubic-bezier(0.16,1,0.3,1) forwards", opacity: 0, whiteSpace: "nowrap" }}>
      <span style={{ color: "#a78bfa", fontSize: 11 }}>{starter.icon}</span>
      {starter.label}
    </button>
  );
}

export default function EvolutionaryHD() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Welcome.\n\nYour design is not a fixed map — it is a living system, deepening and transforming with every major transit you move through.\n\nTo generate your Evolutionary Human Design reading, share:\n\n• Your birth date\n• Your birth time (as precise as you know)\n• Your birth city and country\n\nOr choose a question below to begin." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showStarters, setShowStarters] = useState(true);
  const [newMsgIdx, setNewMsgIdx] = useState(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 130) + "px";
  }, []);

  const send = useCallback(async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    setShowStarters(false);
    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setNewMsgIdx(next.length - 1);
    setLoading(true);
    try {
      const res = await fetch(API_URL + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages((prev) => { const u = [...prev, { role: "assistant", content: "API Error: " + data.error }]; setNewMsgIdx(u.length - 1); return u; });
      } else if (data.content && data.content.length > 0) {
        const textBlock = data.content.find((b) => b.type === "text");
        const reply = textBlock ? textBlock.text : "No text block found.";
        setMessages((prev) => { const u = [...prev, { role: "assistant", content: reply }]; setNewMsgIdx(u.length - 1); return u; });
      } else {
        setMessages((prev) => { const u = [...prev, { role: "assistant", content: "Empty response." }]; setNewMsgIdx(u.length - 1); return u; });
      }
    } catch (err) {
      setMessages((prev) => { const u = [...prev, { role: "assistant", content: "Connection error: " + (err ? err.message : "unknown") }]; setNewMsgIdx(u.length - 1); return u; });
    }
    setLoading(false);
  }, [input, loading, messages]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", position: "relative", overflow: "hidden", background: "#070415" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(167,139,250,0.4);border-radius:4px}
        textarea{resize:none;outline:none}
        textarea::placeholder{color:rgba(200,180,255,0.55);font-family:Georgia,serif;font-style:italic}
        @keyframes msgIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chipIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes hdpulse{0%,80%,100%{transform:scale(0.85);opacity:0.4}40%{transform:scale(1.2);opacity:1}}
        @keyframes headerIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes orbFloat{0%,100%{transform:translateY(0px)}50%{transform:translateY(-14px)}}
      `}</style>
      <StarField />
      <header style={{ position: "relative", zIndex: 10, padding: "26px 32px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.04)", background: "linear-gradient(180deg, rgba(7,4,21,0.92) 0%, transparent 100%)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 1, height: 24, background: "linear-gradient(180deg, transparent, rgba(167,139,250,0.4), transparent)" }} />
          <h1 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: 13, letterSpacing: "0.24em", color: "#f5eeff", fontWeight: 400, textTransform: "uppercase", margin: 0 }}>Evolutionary Human Design</h1>
          <div style={{ width: 1, height: 24, background: "linear-gradient(180deg, transparent, rgba(167,139,250,0.4), transparent)" }} />
        </div>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 11.5, color: "rgba(200,170,255,0.65)", margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", fontStyle: "italic" }}>Your design evolves through every cycle</p>
      </header>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 20px 20px", position: "relative", zIndex: 5, maxWidth: 780, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column" }}>
        {messages.map((msg, idx) => <Message key={idx} msg={msg} isNew={idx === newMsgIdx} />)}
        {loading && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#e9d5ff", flexShrink: 0 }}>✦</div>
            <div style={{ background: "rgba(255,255,255,0.028)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px 20px 20px 20px", backdropFilter: "blur(16px)" }}><TypingIndicator /></div>
          </div>
        )}
        {showStarters && messages.length === 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, marginBottom: 8 }}>
            {STARTERS.map((s, i) => <StarterChip key={i} starter={s} onClick={send} delay={0.6 + i * 0.09} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ position: "relative", zIndex: 10, padding: "14px 20px 22px", background: "linear-gradient(0deg, rgba(7,4,21,0.97) 0%, transparent 100%)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 20, padding: "10px 12px 10px 18px", backdropFilter: "blur(16px)" }}>
          <textarea ref={textareaRef} value={input} onChange={(e) => { setInput(e.target.value); autoResize(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Share your birth date, time, and city to begin…" rows={1} style={{ flex: 1, background: "transparent", border: "none", color: "#ffffff", fontSize: 14, lineHeight: 1.6, fontFamily: "Georgia, serif", minHeight: 44, maxHeight: 130, paddingTop: 10, paddingBottom: 10 }} />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 40, height: 40, borderRadius: "50%", background: input.trim() && !loading ? "linear-gradient(135deg, #7c3aed 0%, #4338ca 100%)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(167,139,250,0.2)", cursor: input.trim() && !loading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s ease" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke={input.trim() && !loading ? "#e9d5ff" : "rgba(167,139,250,0.3)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(167,139,250,0.2)", fontSize: 10, letterSpacing: "0.12em", marginTop: 10, fontFamily: "Georgia, serif", textTransform: "uppercase" }}>Saturn Return · Uranus Opposition · Chiron Return · Second Saturn Return</p>
      </div>
    </div>
  );
                                                                                                                                                                                                                                                                                                                                                                                    }
