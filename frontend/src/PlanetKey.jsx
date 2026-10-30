// Planetary key: how to read each gate, with a short explanation for every gate.line,
// plus a plain definition of conscious (black / Personality) and unconscious (red / Design).
import { useEffect, useRef } from "react";
import { PLANET_ORDER, planetMeaning } from "../../backend/reading-context.js";
import { CONSCIOUS_UNCONSCIOUS, gateExplanation } from "../../backend/gate-explain.js";

export function GateModal({ explanation, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const close = () => onClose();
    const onCancel = (e) => { e.preventDefault(); close(); };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  }, [onClose]);
  if (!explanation) return null;
  return (
    <dialog ref={ref} className="gate-modal" aria-labelledby="gate-modal-title" onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="gate-modal-kicker">Gate</div>
      <h3 id="gate-modal-title">{explanation.title}</h3>
      {explanation.keynote && <p className="gate-modal-key">{explanation.keynote}</p>}
      {explanation.paragraphs.filter(p => p !== explanation.keynote).map(p => <p key={p}>{p}</p>)}
      <button type="button" className="gate-modal-close" onClick={onClose}>Close</button>
    </dialog>
  );
}

function GateButton({ activation, onOpen }) {
  if (!activation?.gate) return <>—</>;
  const ex = gateExplanation(activation);
  return (
    <button type="button" className="gate-link" onClick={() => onOpen(ex)}>
      {ex.title}
    </button>
  );
}

export function PlanetKey({ planets, onOpenGate }) {
  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#b8860b", marginBottom: "8px" }}>PLANETARY KEY — How To Read Your Gates</div>
      <div style={{ fontSize: "16px", color: "rgba(240,234,216,0.85)", fontStyle: "italic", marginBottom: "12px", lineHeight: "1.6" }}>
        Each gate in your chart sits in a planetary position. The planet tells you HOW that gate expresses in your life. The number, such as 61.6, is the gate and its line. Select it to read what that gate means.
      </div>
      <p style={{ fontSize: "16px", color: "rgba(240,234,216,0.92)", lineHeight: "1.65", margin: "0 0 16px" }}>{CONSCIOUS_UNCONSCIOUS}</p>
      <div className="planet-list">
        {PLANET_ORDER.map(planet => {
          const row = (planets || []).find(r => r.planet === planet);
          if (planets && !row) return null;
          const cm = planetMeaning(planet, "Conscious"), um = planetMeaning(planet, "Unconscious");
          return (
            <div key={planet} className="planet-row">
              <div className="planet-name">{planet}</div>
              {cm === um
                ? <div className="planet-meaning">{cm}</div>
                : <div className="planet-meaning">Conscious: {cm}<br />Unconscious: {um}</div>}
              {row && (
                <div className="planet-gates">
                  <span><b>Conscious</b> <GateButton activation={row.conscious} onOpen={onOpenGate} /></span>
                  <span className="unc"><b>Unconscious</b> <GateButton activation={row.unconscious} onOpen={onOpenGate} /></span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const planetKeyCss = `
.gate-link { background: none; border: none; padding: 0; margin: 0; color: #e0c068; font: inherit; font-size: inherit; line-height: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; text-align: left; }
.gate-link:hover, .gate-link:focus-visible { color: #fff; outline: none; }
.gate-modal { max-width: 520px; width: calc(100% - 32px); max-height: min(80vh, 640px); overflow-y: auto; border: 1px solid rgba(201,168,76,0.55); border-radius: 16px; background: #140d1f; color: #f5f1e8; padding: 22px 22px 18px; font-family: var(--reading-font), Georgia, serif; }
.gate-modal::backdrop { background: rgba(0,0,0,0.66); }
.gate-modal-kicker { font-family: 'Cinzel', Georgia, serif; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: #b8860b; margin-bottom: 6px; }
.gate-modal h3 { font-family: 'Cinzel', Georgia, serif; font-weight: 400; font-size: 22px; color: #f0ead8; margin: 0 0 8px; }
.gate-modal-key { font-style: italic; color: #e0c068; margin: 0 0 12px; }
.gate-modal p { font-size: 16px; line-height: 1.6; margin: 0 0 10px; }
.gate-modal-gk { color: #d9c8ff; font-size: 15px; }
.gate-modal-close { display: block; margin: 8px 0 0 auto; background: #c9a84c; color: #140d02; border: none; border-radius: 999px; padding: 8px 18px; font-family: var(--ui-font), system-ui, sans-serif; font-weight: 600; cursor: pointer; }
.gate-modal-close:focus-visible { outline: 3px solid #f5f1e8; outline-offset: 2px; }
`;
