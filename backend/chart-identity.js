// chart-identity.js — one birth payload, one chart. A new person's reading must not keep
// another person's type, profile, authority, centers, channels, or incarnation cross.
import { parseBirthText } from './birth-parse.js';
import { computeAge, normChannelKey } from './reading-context.js';

const IDENTITY_FIELDS = ['type', 'profile', 'authority', 'incarnation_cross'];

function pad(n) { return String(n).padStart(2, '0'); }

export function canonDate(value) {
  const s = String(value || '').trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${pad(+m[1])}-${pad(+m[2])}`;
  return '';
}

export function canonTime(value) {
  const m = String(value || '').trim().match(/^(\d{1,2}):(\d{2})/);
  return m ? `${pad(+m[1])}:${m[2]}` : '';
}

export function canonLocation(value) {
  return String(value || '').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim();
}

export function canonName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function canonicalBirth(birth) {
  if (!birth) return null;
  return {
    name: canonName(birth.name),
    birthdate: canonDate(birth.birthdate),
    birthtime: canonTime(birth.birthtime),
    location: canonLocation(birth.location),
    arc: birth.arc === 'masculine' ? 'masculine' : 'feminine',
  };
}

// Same person = same birth moment and place. A blank name does not collide with a filled one.
export function sameBirth(a, b) {
  const ca = canonicalBirth(a), cb = canonicalBirth(b);
  if (!ca?.birthdate || !cb?.birthdate) return false;
  if (ca.birthdate !== cb.birthdate || ca.birthtime !== cb.birthtime) return false;
  if (ca.location.toLowerCase() !== cb.location.toLowerCase()) return false;
  if (ca.name && cb.name && ca.name.toLowerCase() !== cb.name.toLowerCase()) return false;
  return true;
}

// Stable id for the birth payload this chart was calculated from. Not a secret.
export function chartIdForBirth(birth) {
  const c = canonicalBirth(birth);
  if (!c?.birthdate) return '';
  return [c.name.toLowerCase(), c.birthdate, c.birthtime, c.location.toLowerCase()].join('|');
}

export function isContinueTurn(text) {
  const userText = String(text || '').toLowerCase().trim();
  return userText === 'continue' || userText.endsWith('\ncontinue') || userText.split('\n').pop().trim() === 'continue';
}

export function isBirthEntry(text) {
  if (!text || isContinueTurn(text)) return false;
  const p = parseBirthText(text);
  return !!(p.birthdate && p.location);
}

function latestUser(messages) {
  if (!Array.isArray(messages)) return null;
  for (let i = messages.length - 1; i >= 0; i--) if (messages[i]?.role === 'user') return messages[i];
  return null;
}

// The latest user turn is a new birth chart, not a follow-up question and not "continue".
export function isFreshChartTurn(messages) {
  const last = latestUser(messages);
  return !!(last && typeof last.content === 'string' && isBirthEntry(last.content));
}

// Drop every turn from before the latest birth entry so a previous person's reading
// cannot stay in the model context (including on the automatic "continue" request).
export function isolateChartMessages(messages) {
  if (!Array.isArray(messages)) return [];
  if (isFreshChartTurn(messages)) {
    const last = latestUser(messages);
    return [{ role: 'user', content: last.content }];
  }
  let start = 0;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m?.role === 'user' && typeof m.content === 'string' && isBirthEntry(m.content)) start = i;
  }
  return messages.slice(start);
}

// Follow-up mode tells the model not to restate type, profile, and cross. That is correct
// only for a question about the chart already in this conversation — never for a new birth.
export function shouldUseFollowUpMode(messages) {
  if (!Array.isArray(messages) || isFreshChartTurn(messages)) return false;
  return messages.some(m => m?.role === 'assistant' && typeof m.content === 'string' && m.content.length > 500);
}

// Client: a newly parsed birth chart starts a new thread. Follow-up questions append.
export function nextChartMessages(priorMessages, userMsg, { fresh } = {}) {
  const msg = userMsg && userMsg.role ? userMsg : { role: 'user', content: String(userMsg?.content || userMsg || '') };
  if (fresh) return [msg];
  return [...(Array.isArray(priorMessages) ? priorMessages : []), msg];
}

function channelKeys(channels) {
  return [...new Set((channels || []).map(normChannelKey).filter(Boolean))].sort();
}

function centerKeys(centers) {
  return [...(centers || [])].map(String).sort();
}

export function readingIdentity(hdChart, birthdata) {
  const birth = canonicalBirth(birthdata);
  return {
    chartId: chartIdForBirth(birthdata),
    birth,
    type: hdChart?.type || '',
    profile: hdChart?.profile || '',
    authority: hdChart?.authority || '',
    incarnation_cross: hdChart?.incarnation_cross || '',
    channels: channelKeys(hdChart?.channels),
    defined_centers: centerKeys(hdChart?.defined_centers),
  };
}

function mismatch(chartId, fields) {
  const err = new Error('Reading identity does not match chart ' + (chartId || '(none)') + ' for this birth data (' + fields.join(', ') + ')');
  err.code = 'chart_identity_mismatch';
  err.fields = fields;
  return err;
}

export function assertReadingIdentity(identity, hdChart, birthdata) {
  const expected = readingIdentity(hdChart, birthdata);
  const fields = [];
  if (!identity || identity.chartId !== expected.chartId) fields.push('chartId');
  if (!sameBirth(identity?.birth, birthdata)) fields.push('birth');
  for (const k of IDENTITY_FIELDS) {
    if (String(identity?.[k] || '') !== String(expected[k] || '')) fields.push(k);
  }
  if (JSON.stringify(channelKeys(identity?.channels)) !== JSON.stringify(expected.channels)) fields.push('channels');
  if (JSON.stringify(centerKeys(identity?.defined_centers)) !== JSON.stringify(expected.defined_centers)) fields.push('defined_centers');
  if (fields.length) throw mismatch(expected.chartId, fields);
  return expected;
}

export function assertNatalMatchesIdentity(natal, identity) {
  if (!natal) throw mismatch(identity?.chartId, ['natal']);
  const fields = [];
  for (const k of IDENTITY_FIELDS) {
    if (String(natal[k] || '') !== String(identity?.[k] || '')) fields.push(k);
  }
  if (Array.isArray(natal.channels) && JSON.stringify(channelKeys(natal.channels)) !== JSON.stringify(channelKeys(identity?.channels))) fields.push('channels');
  if (Array.isArray(natal.defined_centers) && JSON.stringify(centerKeys(natal.defined_centers)) !== JSON.stringify(centerKeys(identity?.defined_centers))) fields.push('defined_centers');
  if (fields.length) throw mismatch(identity?.chartId, fields);
}

function factLine(facts, label) {
  const m = String(facts || '').match(new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ': (.*)$', 'm'));
  return m ? m[1].trim() : '';
}

// The prompt's fact block is what the model copies. Age and place can be right while type,
// profile, and cross were left over from the previous person — that must fail.
export function assertFactsMatchIdentity(facts, identity, now = new Date()) {
  const fields = [];
  const expect = (label, value, field) => {
    if (factLine(facts, label) !== String(value || 'unknown')) fields.push(field);
  };
  expect('TYPE', identity?.type, 'type');
  expect('AUTHORITY', identity?.authority, 'authority');
  expect('PROFILE', identity?.profile, 'profile');
  expect('INCARNATION CROSS', identity?.incarnation_cross, 'incarnation_cross');
  if (identity?.chartId && factLine(facts, 'CHART ID') !== identity.chartId) fields.push('chartId');
  const text = String(facts || '');
  const squash = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ');
  const flat = squash(text);
  if (identity?.birth?.location && !flat.includes(squash(identity.birth.location))) fields.push('location');
  if (identity?.birth?.name && !flat.includes(squash(identity.birth.name))) fields.push('name');
  const ageLine = text.match(/^CURRENT AGE: (\d+)/m);
  const expectedAge = computeAge(identity?.birth?.birthdate, now);
  if (ageLine && expectedAge != null && Number(ageLine[1]) !== expectedAge) fields.push('age');
  if (fields.length) throw mismatch(identity?.chartId, fields);
}

export function publishChartPayload(partial, hdChart, birthdata) {
  const identity = readingIdentity(hdChart, birthdata);
  assertReadingIdentity(identity, hdChart, birthdata);
  assertNatalMatchesIdentity(partial?.natal, identity);
  return {
    ...partial,
    chartId: identity.chartId,
    birth: identity.birth,
    identity: {
      type: identity.type,
      profile: identity.profile,
      authority: identity.authority,
      incarnation_cross: identity.incarnation_cross,
    },
  };
}

// Client guard: do not render a bodygraph, Magic Wand, or cycle cards for a different birth,
// and do not render a payload whose displayed natal fields disagree with its identity stamp.
export function chartsMatchBirth(charts, birthdata) {
  if (!charts?.chartId || !charts?.birth || !charts?.identity || !birthdata?.birthdate) return false;
  if (charts.chartId !== chartIdForBirth(birthdata)) return false;
  if (!sameBirth(charts.birth, birthdata)) return false;
  const natal = charts.natal || {};
  for (const k of IDENTITY_FIELDS) {
    if (charts.identity[k] && natal[k] && String(charts.identity[k]) !== String(natal[k])) return false;
  }
  return true;
}

// Paid checkout (including a 100% gift code) is bound to the birth details on THAT session.
// A different person is rejected — never merged (new place + previous type/profile/cross)
// and never calculated from the previous session's saved birth data.
export function resolveChartBirth({ requestBirth, sessionBirth, ownerPreview }) {
  if (ownerPreview) return { birthdata: requestBirth || null, error: null, source: 'request' };
  const request = requestBirth?.birthdate ? requestBirth : null;
  const session = sessionBirth?.birthdate ? sessionBirth : null;
  if (session && request && !sameBirth(request, session)) {
    return { birthdata: null, error: 'birth_mismatch', source: 'rejected' };
  }
  if (session && request) {
    return { birthdata: { ...request, ...session, intake: request.intake }, error: null, source: 'session' };
  }
  if (session) return { birthdata: session, error: null, source: 'session' };
  return { birthdata: request, error: null, source: 'request' };
}

// When the browser uploads a PDF, it may only be stored on the checkout it was generated for.
export function deliveryBirthOk(sessionBirth, uploadedBirth) {
  if (!uploadedBirth?.birthdate || !sessionBirth?.birthdate) return true;
  return sameBirth(sessionBirth, uploadedBirth);
}
