// nodes-reading.js — the Reader's plain-language NODES section, journal prompts and "one move for the next
// 24 hours" (owner direction, Oct 2026; modeled on the validated sample /workspace/Josh_Nodes_Reading.md).
// Deterministic: built from the chart data, never from the model, so the body stays in everyday words.
// Teaching (owner, after Ra Uru Hu): true node, conscious (Personality) and unconscious (Design) placements.
// The South Node gate is the work a person has been doing; the North Node gate is the work they are moving
// toward; the handoff happens around the Uranus opposition (about 40-44). Placements appear ONLY in the small
// "For the curious" box. Pure helpers, server + browser.
import { CHANNELS, GATE_CENTER } from './cycle-enrichment.js';
import { normChannelKey, channelLabel, computeAge, parseBirthdate } from './reading-context.js';
import { authorityKey } from './natal-wand.js';
import { GATE_PLAIN } from './nodes-plain.js';

export { GATE_PLAIN };
export const NODES_TITLE = 'YOUR NODES: WHERE YOU\'VE BEEN AND WHERE YOU\'RE HEADED';
export const JOURNAL_TITLE = 'JOURNAL PROMPTS';
export const ONE_MOVE_TITLE = 'ONE MOVE FOR THE NEXT 24 HOURS';
export const CURIOUS_TITLE = 'FOR THE CURIOUS';

// Words that must never appear in the plain-language body (headings and paragraphs outside "For the curious").
export const JARGON_RE = /\b(gates?|lines? \d|channels?|hanging|centers?|undefined|personality|design (north|south)|north node|south node|gene keys?|siddhi|electromagnetic|neutrino|definition|circuit|incarnation|splenic|sacral|solar plexus|ajna|projector|manifestor|generator|reflector|authority)\b|\b\d{1,2}\.\d\b|\b\d{1,2}-\d{1,2}\b/i;

let _partners = null;
const partnersOf = g => { if (!_partners) { _partners = {}; CHANNELS.forEach(([a, b]) => { (_partners[a] ||= []).push(b); (_partners[b] ||= []).push(a); }); } return _partners[g] || []; };
const plain = g => GATE_PLAIN[g] || { e: 'your own way of meeting life', on: 'it carries you', off: 'it feels out of reach', habit: 'doing it the old way', brings: 'the missing piece' };
// The essence up to its first comma or colon, for use mid-sentence ("your gift for sensing people").
export const shortEssence = e => String(e || '').split(/[,:]/)[0].trim();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const orList = xs => xs.length <= 1 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' or ' + xs[xs.length - 1];
const yearOf = d => { const t = new Date(d); return isNaN(t) ? null : t.getUTCFullYear(); };

function point(p, natalGates, natalChannels) {
  if (!p?.gate) return null;
  const g = p.gate;
  const channels = natalChannels.filter(k => k.split('-').map(Number).includes(g)).map(k => ({ channel: k, label: channelLabel(k), partner: k.split('-').map(Number).find(x => x !== g) }));
  const partners = channels.length ? [] : partnersOf(g).filter(x => !natalGates.has(x));
  return { gate: g, line: p.line, name: String(p.iChingName || '').replace(/\s*\([^)]*\)\s*$/, ''), center: GATE_CENTER[g] || '', channels, partners, wiring: channels.length ? 'superhighway' : 'hanging' };
}
const NODE_ROLES = [['cN', 'personality', 'North Node'], ['cS', 'personality', 'South Node'], ['dN', 'design', 'North Node'], ['dS', 'design', 'South Node']];
export function natalNodes(chart) {
  if (!chart?.personality?.['North Node']?.gate) return null;
  const natalGates = new Set(chart.gates || []);
  const natalChannels = (chart.channels || []).map(normChannelKey).filter(Boolean);
  const out = {};
  for (const [k, side, planet] of NODE_ROLES) out[k] = point(chart[side]?.[planet], natalGates, natalChannels);
  return out;
}
const cycleNodes = ov => ov ? Object.fromEntries(NODE_ROLES.map(([k, side, planet]) => [k, ov[side]?.[planet]?.gate ? { gate: ov[side][planet].gate, line: ov[side][planet].line } : null])) : null;

// Which planet in an overlay chart carries a gate (for the curious box).
function carrier(ov, gate) {
  for (const side of ['personality', 'design']) for (const [planet, p] of Object.entries(ov?.[side] || {})) if (p?.gate === gate) return { planet, side };
  return null;
}
// A cycle chart lights the missing partner of a natal node gate that waits for one (the moment she calls magic).
function completions(nodes, ov) {
  if (!nodes || !ov) return [];
  const ovGates = new Set(ov.gates || []);
  const out = [];
  for (const k of ['cN', 'dN', 'cS', 'dS']) {
    const p = nodes[k];
    if (!p || p.wiring !== 'hanging') continue;
    for (const partner of p.partners) if (ovGates.has(partner) && !out.find(x => x.role === k && x.partner === partner))
      out.push({ role: k, gate: p.gate, partner, channel: normChannelKey(`${p.gate}-${partner}`), label: channelLabel(`${p.gate}-${partner}`), carrier: carrier(ov, partner) });
  }
  return out;
}

const ROLE_NAME = { cN: 'conscious North Node', cS: 'conscious South Node', dN: 'unconscious North Node', dS: 'unconscious South Node' };
const bringsFor = p => orList(p.partners.slice(0, 2).map(g => plain(g).brings));

// "One move for the next 24 hours", fitted to the natal authority. Everyday words only.
export const ONE_MOVE = {
  splenic: 'Your clearest guidance is a quiet, in-the-moment hit in your body. It speaks once, softly, and doesn\'t repeat itself. Tomorrow, when someone asks you something, even something small, notice your very first instinct before your mind starts arguing, and act on it. Then notice how it felt to trust it.',
  emotional: 'Your clarity comes in waves, not in the moment, so the move is to not decide on the spot. Tomorrow, when something asks you for a yes or a no, say "let me sleep on it." Notice how it feels on the high, on the low and in between, and give your answer only once it feels calm and steady in your body, even if that takes a few days.',
  sacral: 'Your clearest guidance is a gut sound, an "uh-huh" or an "unh-unh" that comes before any words. Tomorrow, ask someone you trust to put a few simple yes-or-no questions to you about something you\'ve been weighing. Answer only with the sound that comes out of your belly, then follow it on one small thing before the day is over.',
  ego: 'Your clearest guidance is what your heart truly wants and is willing to promise. Tomorrow, say out loud one thing you actually want, starting with "I want," and make one promise only if you know you can keep it. Notice how much lighter it feels to drop one promise you never really wanted to make.',
  self: 'Your clearest guidance comes when you hear yourself speak. Tomorrow, talk one decision through with someone you trust, and ask them not to give advice, only to listen. Notice the moment your own voice says what you\'re going to do, and do that.',
  mental: 'Your clearest guidance comes from the right place and the right people, not from your head alone. Tomorrow, take one decision you\'ve been circling to a place that feels good to you, and talk it out with one or two people you trust. Listen for what you hear yourself say, and let that, not the pros and cons, set your next step.',
  lunar: 'Your clarity takes about a month to arrive, so the move is not to decide. Tomorrow, write down one choice you\'re weighing and simply note how it feels today, where you are and who you\'re with. Do the same for the next few weeks and let the answer reveal itself over time.',
  none: 'Tomorrow, before you say yes to anything, pause and notice what your body does first: lean in or pull back. Act on that first response once, on something small, and notice how it felt to trust yourself.',
};
export function oneMoveText(authority) { return ONE_MOVE[authorityKey(authority)] || ONE_MOVE.none; }

const clip = s => { const t = String(s || '').replace(/\s+/g, ' ').trim().replace(/^["']|["']$/g, ''); return t.length > 110 ? t.slice(0, 107).replace(/\s+\S*$/, '') + '...' : t; };

/**
 * Build the nodes reading.
 * @param natal parsed natal chart (hd-v3-parser shape)
 * @param opts { cycles (transit-cycle windows), overlays ({uranusOpposition, chironReturn, ...} parsed charts),
 *               status (currentCycleStatus, arc applied), birthdate, name, now, answers {stuck, changed, craving, support} }
 */
export function nodesReading(natal, { cycles = null, overlays = {}, status = null, birthdate = '', name = '', now = new Date(), answers = null } = {}) {
  const n = natalNodes(natal);
  if (!n || !n.cN || !n.cS) return null;
  const P = k => plain(n[k]?.gate);
  const nm = String(name || '').trim();
  const age = computeAge(birthdate, now);
  const by = parseBirthdate(birthdate)?.y;
  const uo = cycles?.uranusOpposition || null;
  const uoStart = uo?.start ? new Date(uo.start) : null, uoEnd = uo?.end ? new Date(uo.end) : null, uoPeak = uo?.peak_datetime || uo?.peak ? new Date(uo.peak_datetime || uo.peak) : null;
  const t = now.getTime();
  const uoState = uoStart && uoEnd ? (t < uoStart.getTime() ? 'before' : t > uoEnd.getTime() ? 'past' : 'in') : (age == null ? 'unknown' : age < 38 ? 'before' : age > 46 ? 'past' : 'in');
  const ageAt = d => (by && d ? d.getUTCFullYear() - by : null);
  const uoLabel = status ? [status.focus, ...(status.overlays || []), ...(status.completed || [])].find(c => c?.key === 'uranusOpposition')?.label : null;
  const uoPhase = uoLabel ? uoLabel.split(':').slice(1).join(':').trim() : 'Closing the Mother';
  const uoOv = overlays?.uranusOpposition || null;
  const uoCyc = cycleNodes(uoOv);
  const uoDone = completions(n, uoOv);
  // seasons active now (focus + overlays in their window; Chiron stays on for life once reached)
  const activeKeys = [...new Set([...(status?.active || []).map(c => c.key), ...(status?.focus?.permanent ? [status.focus.key] : [])])].filter(k => k !== 'uranusOpposition' || uoState === 'in');
  const nowDone = activeKeys.flatMap(k => completions(n, overlays?.[k]).map(x => ({ ...x, cycle: k, cycleLabel: [status?.focus, ...(status?.overlays || [])].find(c => c?.key === k)?.label || k })));
  const seasoning = (() => {
    if (!answers) return null;
    if (answers.craving) return { where: 'headed', text: `You said you're craving "${clip(answers.craving)}." This is the road that leads there.` };
    if (answers.stuck) return { where: 'been', text: `You named feeling stuck around "${clip(answers.stuck)}." That is often how the old road feels once you've outgrown it.` };
    return null;
  })();

  // WHERE YOU'VE BEEN (South Nodes)
  const been = [];
  {
    const c = n.cS, p = P('cS');
    let s = `${nm ? nm + ', f' : 'F'}or most of your life you've worked from ${p.e}. `;
    s += c.wiring === 'superhighway' ? 'That\'s built in and always on. It\'s how you\'ve solved problems and found your way. '
      : `It comes alive most around people who bring ${bringsFor(c)}, and without them it can feel faint or slightly out of place. `;
    s += `When it's working, ${p.on}. When it isn't, ${p.off}.`;
    been.push(s);
    const d = n.dS;
    if (d && d.gate !== c.gate) {
      const q = P('dS');
      let u = `Underneath, quieter and harder to name, you've carried ${q.e}. `;
      u += d.wiring === 'superhighway' ? 'That one is steady and has always been there.' : `It wakes up most around people who bring ${bringsFor(d)}.`;
      been.push(u);
    }
    const habits = [p.habit, d && d.gate !== c.gate ? P('dS').habit : null].filter(Boolean);
    been.push(`That's the terrain you're outgrowing: ${habits.join(', and ')}.` + (seasoning?.where === 'been' ? ' ' + seasoning.text : ''));
  }

  // THE TURNING POINT (Uranus opposition)
  const turn = [];
  {
    const yrs = uoStart && uoEnd ? `roughly ${uoStart.getUTCFullYear()} to ${uoEnd.getUTCFullYear()}` : '';
    const ages = uoStart && uoEnd && ageAt(uoStart) != null ? `between about ${ageAt(uoStart)} and ${ageAt(uoEnd)}` : 'in your early forties';
    const cs = uoCyc?.cS ? plain(uoCyc.cS.gate) : null, cn = uoCyc?.cN ? plain(uoCyc.cN.gate) : null;
    const ds = uoCyc?.dS ? plain(uoCyc.dS.gate) : null, dn = uoCyc?.dN ? plain(uoCyc.dN.gate) : null;
    if (uoState === 'before') {
      const pk = uoPeak ? ` around ${uoPeak.getUTCFullYear()}` : '';
      let s = `The big turning point in this map usually arrives in your early forties${pk}, the season this map calls ${uoPhase}. You aren't there yet. For now, the road behind you is still the road you're meant to walk fully, and the road ahead is already a quiet pull.`;
      const fk = status?.focus?.key, fo = fk ? overlays?.[fk] : null, fcn = cycleNodes(fo)?.cN;
      if (fo && fcn) s += ` In the season you're in now (${status.focus.label}), that pull shows up as ${plain(fcn.gate).e}.`;
      turn.push(s);
    } else {
      const was = uoState === 'in' ? 'is' : 'was', ran = uoState === 'in' ? 'is running' : 'ran';
      let s = `${uoState === 'in' ? 'Right now' : 'Somewhere ' + ages}${yrs ? ', ' + yrs : ''}, life ${ran} a quiet audit. This ${was} your midlife turning point, the season this map calls ${uoPhase}, when the road you'd been on starts handing you over to the road ahead.`;
      if (cs && cn) s += ` In that season the old pull toward ${cs.habit} started to loosen its grip, and in its place came a new pull: ${cn.e}.`;
      turn.push(s);
      if (ds && dn && uoCyc.dS.gate !== uoCyc.cS?.gate) turn.push(`The same season pressed on something quieter, too. It asked you to let go of ${ds.habit} and leaned you toward ${dn.e}.`);
      // Only a lit North Node is "your direction showing you itself"; a lit South Node is the old road, so it is not called out here.
      const hit = uoDone.find(x => x.role === 'cN') || uoDone.find(x => x.role === 'dN');
      if (hit) {
        const g = plain(hit.gate), b = plain(hit.partner).brings;
        turn.push(`It also brought the right people close. During those years, ${shortEssence(g.e)} came fully alive whenever someone who brings ${b} stood next to you. If you remember a partnership or a stretch of work from that time that just worked, that was your direction showing you itself.`);
      }
    }
  }

  // WHERE YOU'RE HEADED (North Nodes)
  const headed = [];
  {
    const c = n.cN, p = P('cN');
    let s = `You're heading toward ${p.e}. `;
    s += c.wiring === 'superhighway' ? 'This isn\'t new to you. It has been built in and always on your whole life, a superhighway you\'ll recognize the moment you read it. What changes is that it becomes your main road. '
      : `This gift comes alive with certain people. Paired with someone who brings ${bringsFor(c)}, it switches fully on. `;
    s += `On track, ${p.on}. Off track, ${p.off}.` + (seasoning?.where === 'headed' ? ' ' + seasoning.text : '');
    headed.push(s);
    const d = n.dN;
    if (d && d.gate !== c.gate) {
      const q = P('dN');
      let u = `Underneath runs ${q.e}. `;
      u += d.wiring === 'superhighway' ? 'That one is steady and already yours.' : `It switches fully on around people who bring ${bringsFor(d)}.`;
      headed.push(u);
    }
    const spark = nowDone.find(x => x.role === 'cN' || x.role === 'dN');
    if (spark) headed.push(`Right now, in the season you're in, that gets an unusual spark: life is bringing you ${plain(spark.partner).brings}, the very piece that switches your ${spark.role === 'cN' ? 'direction' : 'quieter direction'} fully on. That's the kind of moment we call magic. You don't have to explain it. You live it.`);
  }

  // JOURNAL PROMPTS: get to know the buyer (stuck, what's changed, craving + support).
  const changed = uoState === 'before' ? 'What has changed for you in the last few years that you haven\'t fully made peace with?'
    : (uoStart ? `What has changed for you since about ${uoStart.getUTCFullYear()} that you haven't fully made peace with?` : 'What changed for you between your late thirties and now that you haven\'t fully made peace with?');
  const journal = [
    'Where in your life do you feel most stuck right now, and how long has it felt that way?',
    changed,
    'What are you craving more of right now, and what support do you wish you had to get there? From whom?',
  ];

  // FOR THE CURIOUS: the actual placements (the only place they appear).
  const pl = (k, p) => !p ? null : `${cap(ROLE_NAME[k])} ${p.gate}.${p.line}${p.name ? ' (' + p.name + ')' : ''}, ${p.wiring === 'superhighway' ? 'in channel ' + p.channels.map(c => c.label.replace(' Channel of ', ' ')).join(' and ') : 'waiting for ' + p.partners.join(' or ')}`;
  const curious = [`Natal (true node). ${['cN', 'cS', 'dN', 'dS'].map(k => pl(k, n[k])).filter(Boolean).join('. ')}.`];
  if (uo) {
    let s = `Uranus Opposition (${String(uo.start || '').slice(0, 10)} to ${String(uo.end || '').slice(0, 10)}, peak ${String(uo.peak_datetime || uo.peak || '').slice(0, 10)})`;
    if (uoCyc?.cN) s += `: cycle North Nodes ${uoCyc.cN.gate}.${uoCyc.cN.line} and ${uoCyc.dN?.gate}.${uoCyc.dN?.line}, cycle South Nodes ${uoCyc.cS.gate}.${uoCyc.cS.line} and ${uoCyc.dS?.gate}.${uoCyc.dS?.line}`;
    s += uoDone.length ? '. ' + uoDone.map(x => `Cycle ${x.carrier ? x.carrier.planet + ' ' : ''}${x.partner} completes ${x.label.replace(' Channel of ', ' ')} with the ${ROLE_NAME[x.role]} ${x.gate}`).join('. ') + '.' : '.';
    curious.push(s);
  }
  nowDone.forEach(x => curious.push(`Current season (${x.cycleLabel}): cycle ${x.carrier ? x.carrier.planet + ' ' : ''}${x.partner} completes ${x.label.replace(' Channel of ', ' ')} with the ${ROLE_NAME[x.role]} ${x.gate}.`));
  curious.push(`Natal design: ${natal.type || 'unknown type'}, ${natal.authority || 'authority unknown'}, ${natal.profile || ''}.`.replace(', .', '.'));

  return {
    title: NODES_TITLE,
    intro: 'Two points in your chart, called the nodes, show the road you\'ve been walking and the road you\'re walking into. One is the work you\'ve been doing. The other is the work you\'re moving toward. The handoff between them happens around your early forties.',
    sections: [
      { heading: 'WHERE YOU\'VE BEEN', paras: been },
      { heading: 'THE TURNING POINT', paras: turn },
      { heading: 'WHERE YOU\'RE HEADED', paras: headed },
    ],
    curious: { title: CURIOUS_TITLE, lines: curious },
    journal: { title: JOURNAL_TITLE, intro: 'Two or three minutes with each is plenty. Write what comes first.', prompts: journal },
    oneMove: { title: ONE_MOVE_TITLE, text: oneMoveText(natal.authority) },
    nodes: n, turningPoint: { state: uoState, start: uo?.start || null, end: uo?.end || null, peak: uo?.peak_datetime || uo?.peak || null, cycleNodes: uoCyc, completions: uoDone }, nowCompletions: nowDone,
  };
}

// Plain text of the body (title + intro + sections), e.g. for jargon checks.
export function nodesBodyText(r) {
  if (!r) return '';
  return [r.title, r.intro, ...r.sections.flatMap(s => [s.heading, ...s.paras])].join('\n\n');
}
export function closingBodyText(r) {
  if (!r) return '';
  return [r.journal.title, r.journal.intro, ...r.journal.prompts, r.oneMove.title, r.oneMove.text].join('\n\n');
}
// Body jargon check: returns the offending matches (empty when clean).
export function jargonHits(text) {
  const re = new RegExp(JARGON_RE.source, 'gi');
  return [...String(text || '').matchAll(re)].map(m => m[0]);
}

// Data block for the model (follow-up questions only); the section itself is never written by the model.
export function formatNodesForPrompt(r) {
  if (!r) return '';
  return ['=== NODES DATA (true node; the app shows the YOUR NODES section, JOURNAL PROMPTS and ONE MOVE FOR THE NEXT 24 HOURS itself; use this only to answer follow-up questions, in plain everyday language) ===',
    ...r.curious.lines,
    'Teaching: the South Node gate is the work they have been doing; the North Node gate is the work they are moving toward; the handoff happens around the Uranus opposition.',
    '=== END NODES DATA ==='].join('\n');
}
