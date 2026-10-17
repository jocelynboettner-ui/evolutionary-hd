// CycleCards.jsx — structured "initiation of this season" cards per reached cycle
// (cycle profile, cycle cross, cycle type, Magic Wand gifts with planets + Gene Keys).
import React from "react";

const gold = "#e0c068";
const H = ({ children }) => <div className="cc-h">{children}</div>;

export function CycleCards({ enrichment, compact = false }) {
    if (!enrichment?.length) return null;
    return (
        <div className="cycle-cards">
            {!compact && <div className="cc-title">✦ The Initiations of Your Cycles ✦</div>}
            {!compact && <p className="cc-intro">Your natal design is who you are, and it never changes. Each cycle adds energies that flow through your design in that season: a profile, a cross and sometimes a type. Your natal authority still chooses which to follow.</p>}
            {enrichment.map(c => (
                <div key={c.key} className="cc-card">
                    <div className="cc-cycle">{c.label}<span className="cc-date"> · peak {c.peakDate}</span></div>
                    <div className="cc-grid">
                        <div><H>Profile you are learning</H><div className="cc-big">{c.profile.cycle}</div><div className="cc-small">home base {c.profile.natal}</div></div>
                        <div><H>Type initiation</H><div className="cc-big">{c.type.cycle}</div><div className="cc-small">{c.type.shifted ? `home base ${c.type.natal}` : "same as natal"}</div></div>
                    </div>
                    {c.type.shifted && c.type.info && (
                        <div className="cc-type">Strategy: <b>{c.type.info.strategy}</b> · Signature: <b>{c.type.info.signature}</b> · Not-self: <b>{c.type.info.notSelf}</b>
                            <div className="cc-small">It asks you to {c.type.info.asks}.</div></div>
                    )}
                    {c.authority.shifted && <div className="cc-small" style={{ marginTop: 6 }}>Practicing {c.authority.cycle} awareness; your natal {c.authority.natal} authority remains your decision-maker.</div>}
                    <H>{c.key === "chironReturn" ? "Your second-half-of-life purpose" : "Cross of this season"}</H>
                    <div className="cc-cross">{c.cross.cycle}</div>
                    {c.cross.gateKeys?.length > 0 && (
                        <div className="cc-small">{c.cross.gateKeys.map(g => g.geneKey ? `Gate ${g.gate}: ${g.geneKey.shadow} → ${g.geneKey.gift} → ${g.geneKey.siddhi}` : null).filter(Boolean).join("  ·  ")}</div>
                    )}
                    <div className="cc-small">home base: {c.cross.natal}</div>
                    <div className="cc-wand">
                        <div className="cc-wand-title">🪄 Your Magic Wand</div>
                        {c.magicWand.newCenters.length > 0 && <>
                            <H>Centers that come online</H>
                            {c.magicWand.newCenters.map(x => <div key={x.center} className="cc-item"><b>{x.center}</b> — {x.gift}</div>)}
                        </>}
                        {c.magicWand.channels.length > 0 && <>
                            <H>Channels completed</H>
                            {c.magicWand.channels.map(ch => <div key={ch.channel} className="cc-item"><b>{ch.label}</b>{ch.natalGate ? ` — your natal Gate ${ch.natalGate} met by Gate ${ch.newGates.join(" & ")}` : " — fully new"}</div>)}
                        </>}
                        {c.magicWand.newGates.length > 0 && <>
                            <H>New gates · the planet carrying each · Gene Keys</H>
                            {c.magicWand.newGates.map(g => (
                                <div key={g.gate} className="cc-gate">
                                    <b>Gate {g.gate}</b> <span className="cc-small">({g.center})</span>
                                    {g.planets.length > 0 && <div className="cc-small">{g.planets.map(p => `${p.side} ${p.planet} ${g.gate}.${p.line} — ${p.meaning}`).join("; ")}</div>}
                                    {g.geneKey && <div className="cc-gk">{g.geneKey.shadow} → <b>{g.geneKey.gift}</b> → {g.geneKey.siddhi}</div>}
                                </div>
                            ))}
                        </>}
                    </div>
                </div>
            ))}
        </div>
    );
}

export const cycleCardsCss = `
.cycle-cards { background: rgba(14,8,26,0.92); border: 1px solid rgba(201,168,76,0.3); border-radius: 16px; padding: 22px; margin-bottom: 20px; color: #f5f1e8; font-family: var(--ui-font); }
.cc-title { font-family: 'Cinzel', Georgia, serif; color: ${gold}; text-align: center; letter-spacing: 0.12em; text-transform: uppercase; font-size: 15px; margin-bottom: 8px; }
.cc-intro { text-align: center; font-family: var(--reading-font); font-style: italic; color: rgba(240,234,216,0.88); font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
.cc-card { border-top: 1px solid rgba(201,168,76,0.25); padding-top: 16px; margin-top: 16px; }
.cycle-cards .cc-card:first-of-type { border-top: none; margin-top: 0; padding-top: 0; }
.cc-cycle { font-family: 'Cinzel', Georgia, serif; font-size: 20px; color: ${gold}; margin-bottom: 10px; }
.cc-date { font-size: 13px; color: rgba(240,234,216,0.6); font-family: var(--ui-font); }
.cc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cc-h { font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(201,168,76,0.9); margin: 12px 0 4px; }
.cc-big { font-size: 22px; font-weight: 600; color: #fff; }
.cc-small { font-size: 14px; color: rgba(240,234,216,0.75); line-height: 1.5; }
.cc-type { font-size: 15px; margin-top: 10px; line-height: 1.6; }
.cc-cross { font-family: var(--reading-font); font-size: 18px; color: #fff; margin-bottom: 4px; }
.cc-wand { margin-top: 16px; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.35); border-radius: 12px; padding: 14px 16px; }
.cc-wand-title { font-family: 'Cinzel', Georgia, serif; font-size: 18px; color: ${gold}; }
.cc-item { font-size: 15px; line-height: 1.55; margin: 4px 0; }
.cc-gate { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 15px; }
.cc-gk { font-size: 14px; color: #d9c8ff; margin-top: 2px; }
@media (max-width: 520px) { .cc-grid { grid-template-columns: 1fr; } .cycle-cards { padding: 16px; } }
`;
