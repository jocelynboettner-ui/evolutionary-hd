// location-tz.js — map a free-text birthplace to an IANA timezone (US states by full name or
// abbreviation, Canadian provinces, common countries/cities). Returns null if unknown.
const US = {
  'America/New_York': ['connecticut','ct','delaware','de','district of columbia','dc','washington dc','florida','fl','georgia','ga','maine','me','maryland','md','massachusetts','ma','new hampshire','nh','new jersey','nj','new york','ny','north carolina','nc','ohio','oh','pennsylvania','pa','rhode island','ri','south carolina','sc','vermont','vt','virginia','va','west virginia','wv','michigan','mi','indiana','in'],
  'America/Chicago': ['alabama','al','arkansas','ar','illinois','il','iowa','ia','kansas','ks','kentucky','ky','louisiana','la','minnesota','mn','mississippi','ms','missouri','mo','nebraska','ne','north dakota','nd','oklahoma','ok','south dakota','sd','tennessee','tn','texas','tx','wisconsin','wi'],
  'America/Denver': ['colorado','co','idaho','id','montana','mt','new mexico','nm','utah','ut','wyoming','wy'],
  'America/Phoenix': ['arizona','az'],
  'America/Los_Angeles': ['california','ca','nevada','nv','oregon','or','washington','wa','washington state'],
  'America/Anchorage': ['alaska','ak'],
  'Pacific/Honolulu': ['hawaii','hi'],
  'America/Toronto': ['ontario','on','quebec','qc'],
  'America/Vancouver': ['british columbia','bc'],
  'America/Edmonton': ['alberta','ab'],
  'Europe/London': ['uk','united kingdom','england','scotland','wales','london'],
  'Europe/Paris': ['france','paris'], 'Europe/Berlin': ['germany','berlin'], 'Europe/Madrid': ['spain','madrid'],
  'Europe/Rome': ['italy','rome'], 'Europe/Amsterdam': ['netherlands','amsterdam'], 'Europe/Dublin': ['ireland','dublin'],
  'Australia/Sydney': ['sydney','new south wales','nsw'], 'Australia/Melbourne': ['melbourne','victoria'],
  'Asia/Tokyo': ['japan','tokyo'], 'Asia/Kolkata': ['india','mumbai','delhi'], 'America/Mexico_City': ['mexico'],
};
const CITY = { 'los angeles':'America/Los_Angeles','san francisco':'America/Los_Angeles','seattle':'America/Los_Angeles',
  'chicago':'America/Chicago','dallas':'America/Chicago','houston':'America/Chicago','denver':'America/Denver','phoenix':'America/Phoenix',
  'new york':'America/New_York','boston':'America/New_York','philadelphia':'America/New_York','miami':'America/New_York','atlanta':'America/New_York' };
const LOOKUP = {};
for (const [tz, names] of Object.entries(US)) names.forEach(n => { LOOKUP[n] = tz; });

export function tzForLocation(location) {
  const s = String(location || '').toLowerCase().replace(/\s+,/g, ',').replace(/[.]/g, '').trim();
  if (!s) return null;
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  // Region = last comma part (e.g. "Reading, Pennsylvania" -> "pennsylvania"; "Paris, France" -> "france")
  for (let i = parts.length - 1; i >= 1; i--) if (LOOKUP[parts[i]]) return LOOKUP[parts[i]];
  for (const [c, tz] of Object.entries(CITY)) if (s.includes(c)) return tz;
  // Region written without a comma: "Reading Pennsylvania"
  const words = s.split(/\s+/);
  for (let n = 3; n >= 1; n--) { const tail = words.slice(-n).join(' '); if (tail.length > 2 && LOOKUP[tail]) return LOOKUP[tail]; }
  return null;
}
