"""
test_calculations.py
Run locally to verify ephemeris calculations before deploying.

Usage:
    pip install pyswisseph python-dateutil pytz
    python test_calculations.py
"""

import swisseph as swe
from datetime import datetime

swe.set_ephe_path("/app/ephe")  # or "" for Moshier fallback

SATURN = swe.SATURN
URANUS = swe.URANUS
CHIRON = swe.CHIRON


def jd(dt):
    return swe.julday(dt.year, dt.month, dt.day,
                      dt.hour + dt.minute / 60.0)


def lon(planet, dt):
    r, _ = swe.calc_ut(jd(dt), planet, swe.FLG_SWIEPH)
    return r[0]


def sign(deg):
    signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
             "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]
    return f"{deg:.2f} {signs[int(deg // 30)]}"


# Replace with any real birth data to verify
birth = datetime(1974, 1, 1, 12, 0)

natal_saturn = lon(SATURN, birth)
natal_uranus = lon(URANUS, birth)
natal_chiron = lon(CHIRON, birth)

print("=" * 50)
print(f"Birth: {birth.strftime('%B %d, %Y')}")
print(f"Natal Saturn:  {sign(natal_saturn)}")
print(f"Natal Uranus:  {sign(natal_uranus)}")
print(f"Natal Chiron:  {sign(natal_chiron)}")
print()

print("Scanning for Saturn Return (~age 29)...")
for years_offset in range(26, 34):
    test_dt = datetime(birth.year + years_offset, birth.month, birth.day)
    t_sat = lon(SATURN, test_dt)
    diff = abs(((t_sat - natal_saturn + 180) % 360) - 180)
    print(f"  Age ~{years_offset}: transit Saturn {sign(t_sat)} | diff {diff:.2f}")

print()
print("Scanning for Uranus Opposition (~age 42)...")
opp_target = (natal_uranus + 180) % 360
for years_offset in range(39, 45):
    test_dt = datetime(birth.year + years_offset, birth.month, birth.day)
    t_ura = lon(URANUS, test_dt)
    diff = abs(((t_ura - opp_target + 180) % 360) - 180)
    print(f"  Age ~{years_offset}: transit Uranus {sign(t_ura)} | diff from opp {diff:.2f}")

print()
print("Scanning for Chiron Return (~age 50)...")
for years_offset in range(48, 54):
    test_dt = datetime(birth.year + years_offset, birth.month, birth.day)
    t_chi = lon(CHIRON, test_dt)
    diff = abs(((t_chi - natal_chiron + 180) % 360) - 180)
    print(f"  Age ~{years_offset}: transit Chiron {sign(t_chi)} | diff {diff:.2f}")
