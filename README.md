# Evolutionary Human Design

Real transit-based astrology calculations using Swiss Ephemeris.

## Architecture

```
Frontend (React/Vite)
  │
  ▼ POST /api/chat (with birthdata)
  │
Node.js backend (server.js)
  │
  ├─ POST /human-design   ──► Sacred Cycles API (Python)
  │                              └─► humandesign.ai /v3/hd-data
  │
  └─ POST /transit-cycles ──► Sacred Cycles API (Python)
                                 └─► Swiss Ephemeris (pyswisseph)
                                       • Natal Saturn / Uranus / Chiron positions
                                       • Monthly transit scan → binary search → exact crossing
  │
  ▼ JSON merged into Claude context
  │
Claude API (interpretation layer)
```

## How the cycle calculation works

Unlike age-based estimates (`birthYear + 29`), this API:

1. **Calculates natal positions** — the exact ecliptic degree of Saturn, Uranus, and Chiron at birth using Julian Day conversion and the Swiss Ephemeris planetary tables.

2. **Scans transit positions** — steps through time month by month from the expected cycle age range.

3. **Binary-searches for the exact crossing** — narrows to sub-degree precision (< 0.001°) when transit planet = natal degree (return) or natal degree + 180° (opposition).

4. **Returns 7-year windows** — 3.5 years before and after the exact peak.

## Services

| Service | Path | Port |
|---------|------|------|
| Frontend (Vite) | `frontend/` | 5173 |
| Node backend | `backend/server.js` | 3001 |
| Sacred Cycles API | `backend/main.py` | 8000 |

## Local setup

```bash
# 1. Install Python deps
cd backend && pip install -r requirements.txt

# 2. Download Swiss Ephemeris data files (free, optional — Moshier fallback if absent)
mkdir ephe
curl https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 -o ephe/seas_18.se1
curl https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 -o ephe/sepl_18.se1
curl https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 -o ephe/semo_18.se1

# 3. Start Sacred Cycles API
uvicorn main:app --reload --port 8000

# 4. Start Node backend (in a new terminal)
npm install && node server.js

# 5. Start frontend (in a new terminal)
cd ../frontend && npm install && npm run dev
```

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | Node backend | Claude API key |
| `HD_AI_API_KEY` | Sacred Cycles API | humandesign.ai API key |
| `SACRED_CYCLES_URL` | Node backend | URL of Python service (default: http://localhost:8000) |

## Test the endpoints

```bash
# Transit cycles
curl -X POST http://localhost:8000/transit-cycles \
  -H "Content-Type: application/json" \
  -d '{"date":"1974-03-15","time":"14:30","latitude":40.71,"longitude":-74.00,"timezone":"America/New_York"}'

# Human Design chart
curl -X POST http://localhost:8000/human-design \
  -H "Content-Type: application/json" \
  -d '{"date":"1974-03-15","time":"14:30","timezone":"America/New_York"}'
```

## Deploy

```bash
# Docker (Sacred Cycles API)
docker build -t sacred-cycles-api ./backend
docker run -p 8000:8000 -e HD_AI_API_KEY=your_key sacred-cycles-api

# Railway
railway up

# Render: connect GitHub repo, set Dockerfile path to backend/Dockerfile

# Fly.io
fly launch && fly deploy
```

## Frontend integration

```js
// BEFORE (age-based estimate)
const cycles = calculateCycles(birthdate, selectedCycles);

// AFTER (real planetary degrees)
import { fetchTransitCycles, fetchHumanDesign } from './sacred-cycles-client.js';
const cycles = await fetchTransitCycles(birthdate, birthtime, birthplace);
```

See `frontend/src/sacred-cycles-client.js` for the full drop-in. Response shape is identical — Claude interpretation layer unchanged.

## Ephemeris data files

The Dockerfile downloads the `_18` series covering 1800–2400 AD. For birth dates before 1800, download the `_12` series instead. All files available free from [astro.com](https://www.astro.com/ftp/swisseph/ephe/).

## Next endpoint to build

```
POST /human-design/overlay
Input:  same birth data + overlay date (saturn return peak, chiron return peak, etc.)
Output: overlay Type, Profile, Incarnation Cross, channels, gates
```

Then merge natal + overlay → full Evolutionary Human Design reading engine.
