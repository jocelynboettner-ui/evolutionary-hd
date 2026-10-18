"""parse_birth_utc must match backend/birth-time.js (first occurrence for a repeated hour,
shift forward for a skipped hour). Skips if pytz/dateutil are not installed.
Run: python3 test/test_parse_birth_utc.py   (from backend/)"""
import ast, os, unittest
from datetime import datetime
try:
    import pytz
    from dateutil import parser as dateparser
except ImportError:  # pragma: no cover
    pytz = None

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = open(os.path.join(HERE, '..', 'main.py')).read()
fn = [n for n in ast.parse(SRC).body if isinstance(n, ast.FunctionDef) and n.name == 'parse_birth_utc']

@unittest.skipIf(pytz is None, 'pytz/dateutil not installed')
class ParseBirthUtc(unittest.TestCase):
    def setUp(self):
        ns = {'pytz': pytz, 'dateparser': dateparser}
        exec(compile(ast.Module(body=fn, type_ignores=[]), 'main.py', 'exec'), ns)
        self.f = ns['parse_birth_utc']
    def eq(self, d, t, tz, want):
        self.assertEqual(self.f(d, t, tz), datetime.fromisoformat(want), f'{d} {t} {tz}')
    def test_normal(self):
        self.eq('1973-09-30', '05:10', 'America/New_York', '1973-09-30T09:10')
        self.eq('1963-08-15', '12:00', 'Asia/Kolkata', '1963-08-15T06:30')
        self.eq('1988-12-31', '23:50', 'Pacific/Auckland', '1988-12-31T10:50')
    def test_repeated_hour_first_occurrence(self):
        self.eq('1983-10-30', '01:30', 'America/New_York', '1983-10-30T05:30')
        self.eq('1996-10-27', '01:30', 'Europe/London', '1996-10-27T00:30')
        self.eq('1990-03-04', '02:30', 'Australia/Sydney', '1990-03-03T15:30')
    def test_skipped_hour_forward(self):
        self.eq('1985-04-28', '02:30', 'America/Chicago', '1985-04-28T08:30')
        self.eq('1996-03-31', '01:30', 'Europe/London', '1996-03-31T01:30')
        self.eq('1989-10-29', '02:30', 'Australia/Sydney', '1989-10-28T16:30')

if __name__ == '__main__':
    unittest.main(verbosity=1)
