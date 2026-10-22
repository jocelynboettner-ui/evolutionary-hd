// CycleCards.jsx — structured "initiation of this season" cards per reached cycle
// (cycle profile, cycle cross, cycle type, Magic Wand gifts with planets + Gene Keys).
import React from "react";
import { wandLinkLines, wandWiringText } from "../../backend/natal-wand.js";

const gold = "#e0c068";
export function actualWindow(c) {
    const pk = new Date(c.peakDate); if (isNaN(pk)) return "";
    const d = y => new Date(pk.getTime() + y * 365.25 * 864e5).toISOString().slice(0, 7);
    return c.key === "chironReturn" ? `opened ${d(-3.5)} · peak ${c.peakDate} · permanent overlay for life` : `${d(-3.5)} to ${d(3.5)} · peak ${c.peakDate}`;
}
const H = ({ children }) => <div className="cc-h">{children}</div>;

export function CycleCards({ enrichment, compact = false }) {
    if (!enrichment?.length) return null;
    return (
        <div className="cycle-cards">
            {!compact && <div className="cc-title">✦ The Initiations of Your Cycles ✦</div>}
            {!compact && <p className="cc-intro">Your natal design is who you are, and it never changes. Each cycle adds energies that flow through your design in that season: a profile, a cross and sometimes a type. Your natal authority still chooses which to follow.</p>}
            {enrichment.map(c => (
                <div key={c.key} className="cc-card">
                    <div className="cc-cycle">{c.label}</div>
                    <div className="cc-small">Your window (from your chart): {actualWindow(c)}</div>
                    {c.window && <div className="cc-small">Typical window: {c.window}</div>}
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
                            <H>New strengths that switch on (centers)</H>
                            {c.magicWand.newCenters.map(x => <div key={x.center} className="cc-item"><b>{x.center}</b> — {x.gift}</div>)}
                        </>}
                        {c.magicWand.channels.length > 0 && <>
                            <H>New superhighways this season (channels)</H>
                            {c.magicWand.channels.map(ch => <div key={ch.channel} className="cc-item"><b>{ch.label}</b>{ch.natalGate ? ` — your natal Gate ${ch.natalGate} met by Gate ${ch.newGates.join(" & ")}` : " — fully new"}</div>)}
                        </>}
                        {c.magicWand.newGates.length > 0 && <>
                            <H>New energies this season (gates) · the planet carrying each · the gift in each</H>
                            {c.magicWand.newGates.map(g => (
                                <div key={g.gate} className="cc-gate">
                                    <b>Gate {g.gate}</b> <span className="cc-small">({g.center})</span>
                                    {g.planets.length > 0 && <div className="cc-small">{g.planets.map(p => `${p.side} ${p.planet} ${g.gate}.${p.line} — ${p.meaning}`).join("; ")}</div>}
                                    {g.geneKey && <div className="cc-gk">{g.geneKey.shadow} → <b>{g.geneKey.gift}</b> → {g.geneKey.siddhi}</div>}
                                </div>
                            ))}
                        </>}
                        {c.natalWand?.natalSun && <>
                            <H>Your natal wand in this season</H>
                            <div className="cc-small">Natal Sun {c.natalWand.natalSun.gate}.{c.natalWand.natalSun.line}{c.natalWand.natalSun.gift ? ` (${c.natalWand.natalSun.gift})` : ""}{c.natalWand.cycleSun ? ` · this season's Sun ${c.natalWand.cycleSun.gate}.${c.natalWand.cycleSun.line}` : ""}</div>
                            {wandLinkLines(c.natalWand).map(t => <div key={t} className="cc-item">{t}</div>)}
                        </>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// The natal Magic Wand: the conscious Sun gate.line alone (about 70% of the soul's purpose).
export function NatalWandCard({ wand }) {
    if (!wand?.sun) return null;
    const Pt = ({ role, p, note }) => !p ? null : (
        <div className="cc-gate">
            <b>{role}{p.name ? ` · ${p.name}` : ""}</b> <span className="cc-small">(Gate {p.gate})</span>
            <div className="cc-small">{[p.keynote, p.lineDescription].filter(Boolean).join(" · ")}</div>
            {p.geneKey && <div className="cc-gk">{p.geneKey.shadow} → <b>{p.geneKey.gift}</b> → {p.geneKey.siddhi}</div>}
            <div className="cc-small">{note}</div>
            {wandWiringText(p) && <div className="cc-small">{wandWiringText(p)}</div>}
        </div>
    );
    return (
        <div className="cycle-cards natal-wand">
            <div className="cc-wand" style={{ marginTop: 0 }}>
                <div className="cc-wand-title">🪄 Your Natal Magic Wand</div>
                <div className="cc-small">Your conscious Sun: in Human Design the Sun carries about 70% of your imprint, so it is about 70% of your soul's purpose.</div>
                <Pt role="Sun" p={wand.sun} note="what you radiate" />
                <H>How you wield it</H>
                <div className="cc-small"><b>{wand.type}</b>{wand.strategy ? ` · ${wand.strategy}` : ""} · <b>{wand.authority}</b>: {wand.wield}.</div>
            </div>
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

// YOUR NODES (plain language, built server-side by backend/nodes-reading.js): where you've been, the turning
// point, where you're headed. The actual placements appear only in the small "For the curious" box.
export function NodesSection({ nodes }) {
    if (!nodes?.sections?.length) return null;
    return (
        <div className="reading-nodes" data-section="nodes">
            <div className="rn-title">{nodes.title}</div>
            {nodes.intro && <p className="rn-intro">{nodes.intro}</p>}
            {nodes.sections.map(sec => (
                <div key={sec.heading} className="rn-sec">
                    <div className="rn-h">{sec.heading}</div>
                    {sec.paras.map((t, i) => <p key={i} className="rn-p">{t}</p>)}
                </div>
            ))}
            {nodes.curious?.lines?.length > 0 && (
                <div className="rn-curious">
                    <div className="rn-curious-t">{nodes.curious.title}</div>
                    {nodes.curious.lines.map((t, i) => <div key={i}>{t}</div>)}
                </div>
            )}
        </div>
    );
}

// The close of the reading: two or three journal prompts, then ONE MOVE FOR THE NEXT 24 HOURS (always last).
export function ClosingMoves({ nodes }) {
    if (!nodes?.oneMove) return null;
    return (
        <div className="reading-nodes reading-close" data-section="closing-moves">
            {nodes.journal?.prompts?.length > 0 && <div className="rn-sec">
                <div className="rn-h">{nodes.journal.title}</div>
                {nodes.journal.intro && <p className="rn-intro">{nodes.journal.intro}</p>}
                <ol className="rn-prompts">{nodes.journal.prompts.map((t, i) => <li key={i}>{t}</li>)}</ol>
            </div>}
            <div className="rn-sec rn-move">
                <div className="rn-h">{nodes.oneMove.title}</div>
                <p className="rn-p">{nodes.oneMove.text}</p>
            </div>
        </div>
    );
}

export const nodesCss = `
.reading-nodes { max-width: 720px; margin: 0 auto 24px; padding: 24px 26px; background: rgba(14,8,26,0.85); border: 1px solid rgba(201,168,76,0.3); border-radius: 16px; color: #f5f1e8; }
.rn-title { font-family: 'Cinzel', Georgia, serif; color: ${gold}; font-size: 19px; letter-spacing: 0.08em; margin-bottom: 10px; }
.rn-intro { font-family: var(--reading-font); font-style: italic; color: rgba(240,234,216,0.85); font-size: 17px; line-height: 1.6; margin: 0 0 12px; }
.rn-h { font-family: 'Cinzel', Georgia, serif; color: ${gold}; font-size: 15px; letter-spacing: 0.12em; margin: 18px 0 6px; }
.rn-p { font-family: var(--reading-font); font-size: 18px; line-height: 1.7; margin: 0 0 12px; }
.rn-prompts { font-family: var(--reading-font); font-size: 18px; line-height: 1.6; padding-left: 22px; margin: 0; }
.rn-prompts li { margin-bottom: 8px; }
.rn-move { border-top: 1px solid rgba(201,168,76,0.25); margin-top: 18px; }
.rn-curious { margin-top: 16px; padding: 10px 14px; border: 1px solid rgba(201,168,76,0.25); border-radius: 10px; background: rgba(201,168,76,0.05); font-size: 13px; line-height: 1.5; color: rgba(240,234,216,0.7); }
.rn-curious-t { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(201,168,76,0.9); margin-bottom: 4px; }
`;
