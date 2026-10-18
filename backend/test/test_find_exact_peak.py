"""Regression tests for sacred-cycles-api return timing (stdlib only; no ephemeris needed).

Extracts find_exact_peak / angular_distance / normalize from main.py and runs them against
synthetic longitudes with a known exact crossing. The old implementation stopped at a
0.001 deg tolerance and returned the midpoint of the remaining bracket, which put Chiron
returns ~7 hours early (Jocelyn: 02:49 UTC instead of 09:47 UTC).

Run: python3 test/test_find_exact_peak.py   (from backend/)
"""
import ast, os, unittest
from datetime import datetime, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', 'main.py')).read()
WANT = {'normalize', 'angular_distance', 'find_exact_peak'}
mod = ast.Module(body=[n for n in ast.parse(SRC).body if isinstance(n, ast.FunctionDef) and n.name in WANT], type_ignores=[])

EPOCH = datetime(2000, 1, 1)
def make_ns(speed_deg_per_day, start_deg, wobble=0.0):
    def lon(dt):
        days = (dt - EPOCH).total_seconds() / 86400.0
        return (start_deg + speed_deg_per_day * days + wobble * days * days) % 360
    ns = {'datetime_to_jd': lambda dt: dt, 'get_planet_longitude': lambda jd, p: lon(jd), 'get_chiron_longitude': lambda jd: lon(jd)}
    exec(compile(mod, 'main.py', 'exec'), ns)
    return ns

class FindExactPeak(unittest.TestCase):
    def check(self, speed, use_chiron=False, is_opposition=False, wobble=0.0, tol_s=60):
        exact = datetime(2023, 6, 9, 9, 47, 0)
        days = (exact - EPOCH).total_seconds() / 86400.0
        target = 19.146
        natal = (target + 180) % 360 if is_opposition else target
        start = (target - speed * days - wobble * days * days) % 360
        ns = make_ns(speed, start, wobble)
        # 5-day (Chiron) / 15-day (Saturn, Uranus) brackets ending at various offsets after the crossing
        for step, after in [(5, 0.3), (5, 2.5), (5, 4.9), (15, 1.0), (15, 7.7), (15, 14.2)]:
            hi = exact + timedelta(days=after); lo = hi - timedelta(days=step)
            got = ns['find_exact_peak'](6, natal, lo, hi, is_opposition, use_chiron)
            self.assertLess(abs((got - exact).total_seconds()), tol_s, f'speed={speed} step={step} after={after}: {got} vs {exact}')

    def test_chiron_slow(self): self.check(0.0356, use_chiron=True)            # Chiron at Jocelyn's return
    def test_chiron_near_station(self): self.check(0.004, use_chiron=True, tol_s=120)
    def test_chiron_retrograde(self): self.check(-0.02, use_chiron=True)
    def test_saturn(self): self.check(0.128)
    def test_uranus_opposition(self): self.check(0.050, is_opposition=True)
    def test_nonlinear(self): self.check(0.03, use_chiron=True, wobble=1e-4)

if __name__ == '__main__':
    unittest.main(verbosity=1)
