"""
Sacred Cycles API
POST /transit-cycles  -- Real astrology calculations via Swiss Ephemeris
POST /human-design    -- Human Design chart via humandesign.ai
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import swisseph as swe
from datetime import datetime, timedelta
import pytz
from dateutil import parser as dateparser
import os
import httpx
import urllib.request
from transit_activations import get_full_transit_activation, format_transit_activations_for_prompt

app = FastAPI(
    title="Sacred Cycles API",
    description="Transit-based Human Design cycle calculations using Swiss Ephemeris",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

EPHE_PATH = os.environ.get("EPHE_PATH", "/app/ephe")

# Download ephemeris files at startup if missing
EPHE_FILES = {
    "seas_18.se1": "https://www.astro.com/ftp/swisseph/ephe/seas_18.se1",  # Sun/Moon/asteroids incl Chiron
    "sepl_18.se1": "https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1",  # Planets
    "semo_18.se1": "https://www.astro.com/ftp/swisseph/ephe/semo_18.se1",  # Moon
}

def ensure_ephe_files():
    os.makedirs(EPHE_PATH, exist_ok=True)
    downloaded = []
    failed = []
    for fname, url in EPHE_FILES.items():
        fpath = os.path.join(EPHE_PATH, fname)
        if os.path.exists(fpath) and os.path.getsize(fpath) > 1000:
            downloaded.append(fname)
            continue
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            if len(data) > 1000:
                with open(fpath, "wb") as f:
                    f.write(data)
                downloaded.append(fname)
            else:
                failed.append(fname)
        except Exception as e:
            failed.append(f"{fname} ({e})")
    return downloaded, failed

# Download files at startup
_downloaded, _failed = ensure_ephe_files()

swe.set_ephe_path(EPHE_PATH)

# Detect which engine is available after attempting downloads
def _test_se_files():
    try:
        jd = swe.julday(2000, 1, 1, 12.0)
        swe.calc_ut(jd, swe.CHIRON, swe.FLG_SWIEPH)
        return True
    except Exception:
        return False

SE_FILES_AVAILABLE = _test_se_files()
CALC_FLAG = (swe.FLG_SWIEPH | swe.FLG_SPEED) if SE_FILES_AVAILABLE else (swe.FLG_MOSEPH | swe.FLG_SPEED)

SATURN = swe.SATURN
URANUS = swe.URANUS
# Use Chiron if SE files available, otherwise approximate with Pluto's orbital neighborhood (fallback)
CHIRON = swe.CHIRON

HD_AI_API_KEY = os.environ.get("HD_AI_API_KEY", "")
HD_AI_BASE_URL = "https://api.humandesign.ai"


class TransitRequest(BaseModel):
    date: str
    time: Optional[str] = "12:00"
    latitude: float
    longitude: float
    timezone: str


class CycleWindow(BaseModel):
    start: str
    peak: str
    end: str
    natal_degree: float
    peak_transit_degree: float
    description: str
    peak_datetime: Optional[str] = None


class TransitResponse(BaseModel):
    saturnReturn: CycleWindow
    uranusOpposition: CycleWindow
    chironReturn: CycleWindow


class HumanDesignRequest(BaseModel):
    date: str
    time: Optional[str] = "12:00"
    timezone: str


class HumanDesignResponse(BaseModel):
    type: str
    strategy: str
    authority: str
    profile: str
    incarnation_cross: str
    definition: str
    signature: str
    not_self: str
    defined_centers: list
    open_centers: list
    channels: list
    gates: list
    personality: dict
    design: dict


def datetime_to_jd(dt):
    return swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute / 60.0 + dt.second / 3600.0)


def get_planet_longitude(jd, planet):
    """Calculate planet longitude using best available engine."""
    result, flag = swe.calc_ut(jd, planet, CALC_FLAG)
    return result[0]


def get_chiron_longitude(jd):
    """Get Chiron longitude, falling back to Moshier Chiron approximation if SE files missing."""
    if SE_FILES_AVAILABLE:
        result, flag = swe.calc_ut(jd, swe.CHIRON, swe.FLG_SWIEPH | swe.FLG_SPEED)
        return result[0]
    else:
        # Chiron's orbital period is ~50.7 years
        # Approximate position from known epoch: Chiron was at 3.08 Taurus (33.08 deg) on Jan 1, 2000
        # Daily motion ~0.01929 degrees/day
        jd_epoch = swe.julday(2000, 1, 1, 12.0)
        days_from_epoch = jd - jd_epoch
        # Chiron orbital period = 18492 days
        chiron_at_epoch = 33.08
        daily_motion = 360.0 / 18492.0
        return (chiron_at_epoch + days_from_epoch * daily_motion) % 360


def normalize(deg):
    return deg % 360


def angular_distance(a, b):
    diff = (a - b) % 360
    if diff > 180:
        diff -= 360
    return diff


def find_exact_peak(planet, natal_deg, search_start, search_end, is_opposition=False, use_chiron=False):
    target = normalize(natal_deg + 180) if is_opposition else natal_deg
    lo = search_start
    hi = search_end
    def get_lon(dt):
        jd = datetime_to_jd(dt)
        return get_chiron_longitude(jd) if use_chiron else get_planet_longitude(jd, planet)
    for _ in range(60):
        mid = lo + (hi - lo) / 2
        dist = angular_distance(get_lon(mid), target)
        dist_lo = angular_distance(get_lon(lo), target)
        if (dist_lo < 0) == (dist < 0):
            lo = mid
        else:
            hi = mid
        if abs(dist) < 0.001:
            break
    return lo + (hi - lo) / 2


def find_cycle_peak(planet, natal_deg, birth_dt, expected_years, search_window_years=4.0, is_opposition=False, use_chiron=False):
    target = normalize(natal_deg + 180) if is_opposition else natal_deg
    search_start = birth_dt + timedelta(days=365.25 * (expected_years - search_window_years))
    search_end = birth_dt + timedelta(days=365.25 * (expected_years + search_window_years))

    def get_lon(dt):
        jd = datetime_to_jd(dt)
        return get_chiron_longitude(jd) if use_chiron else get_planet_longitude(jd, planet)

    best_dt = search_start
    best_dist = float('inf')
    prev_dist = None
    crossing_start = None
    current = search_start
    step = timedelta(days=30)

    while current <= search_end:
        lon_deg = get_lon(current)
        dist = abs(angular_distance(lon_deg, target))
        if dist < best_dist:
            best_dist = dist
            best_dt = current
        if prev_dist is not None:
            prev_s = angular_distance(get_lon(current - step), target)
            curr_s = angular_distance(lon_deg, target)
            if prev_s * curr_s < 0:
                crossing_start = current - step
        prev_dist = dist
        current += step

    refine_start = (crossing_start or best_dt) - timedelta(days=45)
    refine_end = (crossing_start or best_dt) + timedelta(days=45)
    return find_exact_peak(planet, natal_deg, refine_start, refine_end, is_opposition, use_chiron)


def find_cycle_peak_precise(
    planet, natal_deg, birth_dt, expected_years,
    search_window_years=4.0, is_opposition=False, use_chiron=False
):
    """
    Find the TRUE peak of a transit cycle — the middle crossing
    when a planet retrogrades back and forth over a natal degree.
    Planets cross a natal degree up to 3 times:
      1. Direct pass (approaching)
      2. Retrograde pass (retreating) <- TRUE PEAK
      3. Direct pass again (departing)
    We find all crossings and return the middle one.
    """
    target = normalize(natal_deg + 180) if is_opposition else natal_deg
    search_start = birth_dt + timedelta(days=365.25 * (expected_years - search_window_years))
    search_end   = birth_dt + timedelta(days=365.25 * (expected_years + search_window_years))

    # Fine scan to catch all retrograde crossings
    crossings = []
    current = search_start
    step = timedelta(days=15)
    prev_dist = None
    while current <= search_end:
        jd = datetime_to_jd(current)
        if use_chiron:
            lon = get_chiron_longitude(jd)
        else:
            lon = get_planet_longitude(jd, planet)
        dist = angular_distance(lon, target)
        if prev_dist is not None:
            if prev_dist * dist < 0:  # sign change = crossing
                crossing_peak = find_exact_peak(
                    planet, natal_deg,
                    current - step, current,
                    is_opposition, use_chiron
                )
                crossings.append(crossing_peak)
        prev_dist = dist
        current += step

    if not crossings:
        # Fallback to original method
        return find_cycle_peak(
            planet, natal_deg, birth_dt,
            expected_years, search_window_years, is_opposition, use_chiron
        )
    if len(crossings) == 1:
        return crossings[0]
    if len(crossings) >= 3:
        # Middle crossing = true peak of retrograde dance
        return crossings[len(crossings) // 2]
    # Two crossings — return the later one (retrograde pass)
    return crossings[-1]


def calculate_transit_cycles(birth_utc, lat, lon_coord):
    birth_jd = datetime_to_jd(birth_utc)
    natal_saturn = get_planet_longitude(birth_jd, SATURN)
    natal_uranus = get_planet_longitude(birth_jd, URANUS)
    natal_chiron = get_chiron_longitude(birth_jd)

    saturn_peak = find_cycle_peak_precise(SATURN, natal_saturn, birth_utc, expected_years=29.5)
    uranus_peak = find_cycle_peak_precise(URANUS, natal_uranus, birth_utc, expected_years=42.0, is_opposition=True)
    chiron_peak = find_cycle_peak_precise(None, natal_chiron, birth_utc, expected_years=50.7, use_chiron=True)

    window = timedelta(days=365.25 * 3.5)
    chiron_peak_lon = get_chiron_longitude(datetime_to_jd(chiron_peak))
    return {
        "saturnReturn": {
            "start": (saturn_peak - window).strftime("%Y-%m-%d"),
            "peak": saturn_peak.strftime("%Y-%m-%d"),
            "end": (saturn_peak + window).strftime("%Y-%m-%d"),
            "natal_degree": round(natal_saturn, 4),
            "peak_transit_degree": round(get_planet_longitude(datetime_to_jd(saturn_peak), SATURN), 4),
            "peak_datetime": saturn_peak.strftime("%Y-%m-%dT%H:%M:%S"),
            "description": f"Transit Saturn returns to natal Saturn at {natal_saturn:.2f}",
        },
        "uranusOpposition": {
            "start": (uranus_peak - window).strftime("%Y-%m-%d"),
            "peak": uranus_peak.strftime("%Y-%m-%d"),
            "end": (uranus_peak + window).strftime("%Y-%m-%d"),
            "natal_degree": round(natal_uranus, 4),
            "peak_transit_degree": round(get_planet_longitude(datetime_to_jd(uranus_peak), URANUS), 4),
            "peak_datetime": uranus_peak.strftime("%Y-%m-%dT%H:%M:%S"),
            "description": f"Transit Uranus opposes natal Uranus at {natal_uranus:.2f}",
        },
        "chironReturn": {
            "start": (chiron_peak - window).strftime("%Y-%m-%d"),
            "peak": chiron_peak.strftime("%Y-%m-%d"),
            "end": (chiron_peak + window).strftime("%Y-%m-%d"),
            "natal_degree": round(natal_chiron, 4),
            "peak_transit_degree": round(chiron_peak_lon, 4),
            "peak_datetime": chiron_peak.strftime("%Y-%m-%dT%H:%M:%S"),
            "description": f"Transit Chiron returns to natal Chiron at {natal_chiron:.2f}" + ("" if SE_FILES_AVAILABLE else " (Moshier approx)"),
        }
    }


def parse_hd_response(data):
    props = data.get("Properties", {})

    def get_prop(key, fallbacks=[]):
        val = props.get(key, {})
        result = val.get("Id") or val.get("Option") or ""
        if not result:
            for fk in fallbacks:
                val2 = props.get(fk, {})
                result = val2.get("Id") or val2.get("Option") or ""
                if result:
                    break
        return result

    def parse_activations(raw):
        if not raw or not isinstance(raw, dict):
            return {}
        return {
            planet: {"gate": int(v.get("Gate", 0)), "line": int(v.get("Line", 0))}
            for planet, v in raw.items()
            if isinstance(v, dict)
        }

    return {
        "type": get_prop("Type"),
        "strategy": get_prop("Strategy"),
        "authority": get_prop("InnerAuthority", ["Authority"]),
        "profile": get_prop("Profile"),
        "incarnation_cross": get_prop("IncarnationCross", ["Cross"]),
        "definition": get_prop("Definition"),
        "signature": get_prop("Signature"),
        "not_self": get_prop("NotSelf", ["Not-Self"]),
        "defined_centers": data.get("DefinedCenters") or data.get("defined_centers") or [],
        "open_centers": data.get("OpenCenters") or data.get("open_centers") or [],
        "channels": data.get("Channels") or data.get("channels") or [],
        "gates": data.get("Gates") or data.get("gates") or [],
        "personality": parse_activations(data.get("Personality")),
        "design": parse_activations(data.get("Design")),
    }


def parse_birth_utc(date_str, time_str, timezone_str):
    tz = pytz.timezone(timezone_str)
    birth_local = tz.localize(dateparser.parse(f"{date_str} {time_str or '12:00'}"))
    return birth_local.astimezone(pytz.utc).replace(tzinfo=None)


@app.post("/transit-cycles", response_model=TransitResponse)
async def transit_cycles(req: TransitRequest):
    """Calculate real transit-based cycle windows from birth data."""
    try:
        birth_utc = parse_birth_utc(req.date, req.time, req.timezone)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid date/time/timezone: {e}")

    if birth_utc > datetime.utcnow():
        raise HTTPException(status_code=422, detail="Birth date must be in the past.")

    try:
        result = calculate_transit_cycles(birth_utc, req.latitude, req.longitude)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris calculation failed: {e}")

    return result


@app.post("/human-design", response_model=HumanDesignResponse)
async def human_design(req: HumanDesignRequest):
    """Fetch Human Design chart from humandesign.ai and return clean structured data."""
    if not HD_AI_API_KEY:
        raise HTTPException(status_code=500, detail="HD_AI_API_KEY env var not set")

    iso_date = f"{req.date}T{req.time or '12:00'}:00"
    url = (
        f"{HD_AI_BASE_URL}/v3/hd-data"
        f"?date={iso_date}"
        f"&timezone={req.timezone}"
        f"&api_key={HD_AI_API_KEY}"
    )
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"humandesign.ai request failed: {e}")

    if not resp.is_success:
        raise HTTPException(status_code=resp.status_code, detail=f"humandesign.ai error: {resp.text[:300]}")

    try:
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="humandesign.ai returned non-JSON response")

    return parse_hd_response(data)



# ── Transit Activations endpoint ──

class ActivationRequest(BaseModel):
    natal_gates: List[int]
    natal_defined_centers: List[str]
    cycle_start: str
    cycle_end: str
    reading_date: Optional[str] = None


@app.post("/transit-activations")
async def transit_activations(req: ActivationRequest):
    """
    Returns activated channels, temporarily defined centers,
    and the dominant incarnation cross for a cycle window.
    """
    try:
        reading_date = None
        if req.reading_date:
            reading_date = datetime.strptime(req.reading_date, "%Y-%m-%d")

        data = get_full_transit_activation(
            natal_gates=req.natal_gates,
            natal_defined_centers=req.natal_defined_centers,
            cycle_start=req.cycle_start,
            cycle_end=req.cycle_end,
            reading_date=reading_date,
        )

        return {
            "raw": data,
            "prompt_text": format_transit_activations_for_prompt(data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Activation calculation failed: {e}")



@app.get("/health")
def health():
    engine = "Swiss Ephemeris (pyswisseph)" if SE_FILES_AVAILABLE else "Swiss Ephemeris (pyswisseph) + Moshier fallback"
    return {
        "status": "ok",
        "engine": engine,
        "se_files": SE_FILES_AVAILABLE,
        "ephe_downloaded": _downloaded,
        "ephe_failed": _failed,
    }
