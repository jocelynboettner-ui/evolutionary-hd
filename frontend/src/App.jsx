import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "https://evolutionary-hd.onrender.com";

// Stars background
function Stars() {
      const stars = Array.from({ length: 120 }, (_, i) => ({
              id: i,
              x: Math.random() * 100,
              y: Math.random() * 100
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

function parseBirthData(text) {
      const MONTHS = {
              jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
              jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12"
      };
      const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    
      let month, day, year;
    
      const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
      if (isoMatch) {
              year = isoMatch[1]; month = isoMatch[2]; day = isoMatch[3];
      } else {
              const wordMonthRe = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})[,\s]+(\d{4})\b/i;
              const wordMonthRe2 = /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*[,\s]\s*(\d{4})\b/i;
              const numericRe = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/;
              const m1 = text.match(wordMonthRe);
              const m2 = !m1 && text.match(wordMonthRe2);
              const m3 = !m1 && !m2 && text.match(numericRe);
              if (m1) {
                        month = MONTHS[m1[1].substring(0,3).toLowerCase()];
                        day = m1[2].padStart(2,"0");
                        year = m1[3];
              } else if (m2) {
                        day = m2[1].padStart(2,"0");
                        month = MONTHS[m2[2].substring(0,3).toLowerCase()];
                        year = m2[3];
              } else if (m3) {
                        month = m3[1].padStart(2,"0");
                        day = m3[2].padStart(2,"0");
                        year = m3[3];
              }
      }
    
      if (!month || !day || !year) return null;
    
      const birthdate = day + "-" + MONTH_NAMES[parseInt(month) - 1] + "-" + year;
    
      let birthtime;
      const time12 = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*([ap]m)\b/i);
      const time24 = !time12 && text.match(/\b([01]?\d|2[0-3]):(\d{2})\b/);
      if (time12) {
              let h = parseInt(time12[1]);
              const m = time12[2] ? time12[2] : "00";
              const ampm = time12[3].toLowerCase();
              if (ampm === "pm" && h !== 12) h += 12;
              if (ampm === "am" && h === 12) h = 0;
              birthtime = h.toString().padStart(2,"0") + ":" + m;
      } else if (time24) {
              birthtime = time24[1].padStart(2,"0") + ":" + time24[2];
      } else {
              birthtime = "12:00";
      }
    
      // Improved location parser — handles "City, State" and "City, Country"
      let location;
      // Try "in City, ST" or "in City, State" or "in City State"
      const inMatch = text.match(/\bin\s+([A-Za-z][A-Za-z\s]+(?:,\s*[A-Za-z]{2,})?)/i);
      if (inMatch) {
              location = inMatch[1].trim().replace(/[.,]+$/, "").trim();
      }
    
      if (!location) return null;
    
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
          
              // Always try to parse birth data from every message
              const parsed = parseBirthData(text);
          
              let currentBirthdata;
              let newMessages;
          
              if (parsed) {
                        // New birth data detected — always treat as a completely new person.
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
                                                                                                        if (parsed.error) throw new Error(parsed.error);
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
                            </h1>h1>
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
                                            display: "inline-block"
                            }}>
                                        Chart retrieved: {birthdata.birthdate} {birthdata.birthtime} — {birthdata.location}
                            </div>
                            )}
                        {chartDetected && (
                          <div style={{ marginTop: "10px" }}>
                            <button onClick={handleNewReading} style={{ fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(167,139,250,0.7)", background: "transparent", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "20px", padding: "4px 16px", cursor: "pointer", display: "inline-block" }}>
                              New Reading
                            </button>
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
}</circle>
