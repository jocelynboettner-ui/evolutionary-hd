"""
transit_activations.py
Converts planetary positions → HD gates → activated channels → defined centers
Add this to your sacred-cycles-api backend (same folder as main.py)
"""
import swisseph as swe
from datetime import datetime, timedelta
from typing import Optional

# ── Planet to gate degree lookup ──
# Each of the 64 gates occupies a specific arc of the ecliptic.
# Source: Jovian Archive / Ra Uru Hu original gate sequence.
# Format: (start_degree, end_degree, gate_number)
# Arranged in ecliptic order starting from 0° Aries.
GATE_DEGREES = [
    (0.000,   5.625,  41),
    (5.625,  11.250,  19),
    (11.250, 16.875,  13),
    (16.875, 22.500,  49),
    (22.500, 28.125,  30),
    (28.125, 33.750,  55),
    (33.750, 39.375,  37),
    (39.375, 45.000,  63),
    (45.000, 50.625,  22),
    (50.625, 56.250,  36),
    (56.250, 61.875,  25),
    (61.875, 67.500,  17),
    (67.500, 73.125,  21),
    (73.125, 78.750,  51),
    (78.750, 84.375,  42),
    (84.375, 90.000,   3),
    (90.000,  95.625, 27),
    (95.625, 101.250, 24),
    (101.250, 106.875, 2),
    (106.875, 112.500, 23),
    (112.500, 118.125, 8),
    (118.125, 123.750, 20),
    (123.750, 129.375, 16),
    (129.375, 135.000, 35),
    (135.000, 140.625, 45),
    (140.625, 146.250, 12),
    (146.250, 151.875, 15),
    (151.875, 157.500, 52),
    (157.500, 163.125, 39),
    (163.125, 168.750, 53),
    (168.750, 174.375, 62),
    (174.375, 180.000, 56),
    (180.000, 185.625, 31),
    (185.625, 191.250, 33),
    (191.250, 196.875,  7),
    (196.875, 202.500,  4),
    (202.500, 208.125, 29),
    (208.125, 213.750, 59),
    (213.750, 219.375, 40),
    (219.375, 225.000, 64),
    (225.000, 230.625, 47),
    (230.625, 236.250,  6),
    (236.250, 241.875, 46),
    (241.875, 247.500, 18),
    (247.500, 253.125, 48),
    (253.125, 258.750, 57),
    (258.750, 264.375, 32),
    (264.375, 270.000, 50),
    (270.000, 275.625, 28),
    (275.625, 281.250, 44),
    (281.250, 286.875,  1),
    (286.875, 292.500, 43),
    (292.500, 298.125, 14),
    (298.125, 303.750, 34),
    (303.750, 309.375,  9),
    (309.375, 315.000,  5),
    (315.000, 320.625, 26),
    (320.625, 326.250, 11),
    (326.250, 331.875, 10),
    (331.875, 337.500, 58),
    (337.500, 343.125, 38),
    (343.125, 348.750, 54),
    (348.750, 354.375, 61),
    (354.375, 360.000, 60),
]

# ── Channel map: gate → its partner gate → center pair ──
CHANNELS = {
    (1,  8):  ("G Center",    "Throat",       "Channel of Inspiration"),
    (2,  14): ("G Center",    "Sacral",        "Channel of the Beat"),
    (3,  60): ("Sacral",      "Root",          "Channel of Mutation"),
    (4,  63): ("Ajna",        "Head",          "Channel of Logic"),
    (5,  15): ("Sacral",      "G Center",      "Channel of Rhythm"),
    (6,  59): ("Solar Plexus","Sacral",        "Channel of Mating"),
    (7,  31): ("G Center",    "Throat",        "Channel of the Alpha"),
    (9,  52): ("Sacral",      "Root",          "Channel of Concentration"),
    (10, 20): ("G Center",    "Throat",        "Channel of Awakening"),
    (10, 34): ("G Center",    "Sacral",        "Channel of Exploration"),
    (10, 57): ("G Center",    "Spleen",        "Channel of Perfected Form"),
    (11, 56): ("Ajna",        "Throat",        "Channel of Curiosity"),
    (12, 22): ("Throat",      "Solar Plexus",  "Channel of Openness"),
    (13, 33): ("G Center",    "Throat",        "Channel of the Prodigal"),
    (15,  5): ("G Center",    "Sacral",        "Channel of Rhythm"),
    (16, 48): ("Throat",      "Spleen",        "Channel of the Wavelength"),
    (17, 62): ("Ajna",        "Throat",        "Channel of Acceptance"),
    (18, 58): ("Spleen",      "Root",          "Channel of Judgment"),
    (19, 49): ("Root",        "Solar Plexus",  "Channel of Synthesis"),
    (20, 57): ("Throat",      "Spleen",        "Channel of the Brainwave"),
    (21, 45): ("Heart",       "Throat",        "Channel of Money"),
    (23, 43): ("Throat",      "Ajna",          "Channel of Structuring"),
    (24, 61): ("Ajna",        "Head",          "Channel of Awareness"),
    (25, 51): ("G Center",    "Heart",         "Channel of Initiation"),
    (26, 44): ("Heart",       "Spleen",        "Channel of Surrender"),
    (27, 50): ("Sacral",      "Spleen",        "Channel of Preservation"),
    (28, 38): ("Spleen",      "Root",          "Channel of Struggle"),
    (29, 46): ("Sacral",      "G Center",      "Channel of Discovery"),
    (30, 41): ("Solar Plexus","Root",          "Channel of Recognition"),
    (32, 54): ("Spleen",      "Root",          "Channel of Transformation"),
    (33, 13): ("Throat",      "G Center",      "Channel of the Prodigal"),
    (34, 20): ("Sacral",      "Throat",        "Channel of Charisma"),
    (34, 57): ("Sacral",      "Spleen",        "Channel of Power"),
    (35, 36): ("Throat",      "Solar Plexus",  "Channel of Transience"),
    (37, 40): ("Solar Plexus","Heart",         "Channel of Community"),
    (39, 55): ("Root",        "Solar Plexus",  "Channel of Emoting"),
    (40, 37): ("Heart",       "Solar Plexus",  "Channel of Community"),
    (42, 53): ("Sacral",      "Root",          "Channel of Maturation"),
    (44, 26): ("Spleen",      "Heart",         "Channel of Surrender"),
    (45, 21): ("Throat",      "Heart",         "Channel of Money"),
    (47, 64): ("Ajna",        "Head",          "Channel of Abstraction"),
    (48, 16): ("Spleen",      "Throat",        "Channel of the Wavelength"),
    (49, 19): ("Solar Plexus","Root",          "Channel of Synthesis"),
    (51, 25): ("Heart",       "G Center",      "Channel of Initiation"),
    (53, 42): ("Root",        "Sacral",        "Channel of Maturation"),
    (54, 32): ("Root",        "Spleen",        "Channel of Transformation"),
    (55, 39): ("Solar Plexus","Root",          "Channel of Emoting"),
    (57, 20): ("Spleen",      "Throat",        "Channel of the Brainwave"),
    (57, 34): ("Spleen",      "Sacral",        "Channel of Power"),
    (58, 18): ("Root",        "Spleen",        "Channel of Judgment"),
    (59,  6): ("Sacral",      "Solar Plexus",  "Channel of Mating"),
    (60,  3): ("Root",        "Sacral",        "Channel of Mutation"),
    (61, 24): ("Head",        "Ajna",          "Channel of Awareness"),
    (62, 17): ("Throat",      "Ajna",          "Channel of Acceptance"),
    (63,  4): ("Head",        "Ajna",          "Channel of Logic"),
    (64, 47): ("Head",        "Ajna",          "Channel of Abstraction"),
}

# ── Incarnation Cross gate groups ──
INCARNATION_CROSSES = {
    (1,  2,  4,  3): "Right Angle Cross of the Sphinx",
    (2,  1, 49,  4): "Right Angle Cross of the Sphinx",
    (3, 50, 60, 56): "Right Angle Cross of Mutation",
    (4, 49,  8,  3): "Right Angle Cross of Explanation",
    (5, 35, 15, 45): "Right Angle Cross of Tension",
    (6, 36, 11, 12): "Right Angle Cross of the Plane",
    (7, 13,  4, 49): "Right Angle Cross of the Alpha",
    (8, 14, 55, 59): "Right Angle Cross of Contagion",
    (9, 16, 52, 39): "Right Angle Cross of Determination",
    (10, 15, 18, 17): "Right Angle Cross of the Vessel of Love",
    (11, 12, 46, 25): "Right Angle Cross of Eden",
    (12, 11,  9, 16): "Right Angle Cross of the Rulebook",
    (13,  7, 43, 23): "Right Angle Cross of the Prodigal",
    (14,  8, 47, 22): "Right Angle Cross of Service",
    (15, 10, 17, 21): "Right Angle Cross of the Vessel of Love",
    (16,  9, 63, 64): "Right Angle Cross of Uncertainty",
    (17, 18, 21, 48): "Right Angle Cross of Service",
    (18, 17, 52, 58): "Right Angle Cross of Service",
    (19, 33, 44, 24): "Right Angle Cross of the Unexpected",
    (20, 34, 37, 40): "Right Angle Cross of the Now",
    (21, 48, 51, 57): "Right Angle Cross of Confrontation",
    (22, 47, 37, 40): "Right Angle Cross of Grace",
    (23, 43, 30, 29): "Right Angle Cross of Explanation",
    (24, 44, 61, 62): "Right Angle Cross of the Sleeping Phoenix",
    (25, 46, 10, 15): "Right Angle Cross of the Vessel of Love",
    (26, 45,  6, 36): "Right Angle Cross of the Trickster",
    (27, 28, 19, 33): "Right Angle Cross of Caring",
    (28, 27, 33, 19): "Right Angle Cross of Struggle",
    (29, 30, 20, 34): "Right Angle Cross of Confrontation",
    (30, 29, 14,  8): "Right Angle Cross of Eden",
    (31, 41,  7, 13): "Right Angle Cross of the Alpha",
    (32, 42, 54, 53): "Right Angle Cross of Migration",
    (33, 19, 13,  7): "Right Angle Cross of the Unexpected",
    (34, 20, 40, 37): "Right Angle Cross of the Now",
    (35,  5, 47, 22): "Right Angle Cross of Tension",
    (36,  6, 12, 11): "Right Angle Cross of the Plane",
    (37, 40, 22, 47): "Right Angle Cross of Community",
    (38, 39, 28, 27): "Right Angle Cross of Tension",
    (39, 38, 55, 59): "Right Angle Cross of the Unexpected",
    (40, 37, 47, 22): "Right Angle Cross of Community",
    (41, 31, 30, 29): "Right Angle Cross of the Unexpected",
    (42, 32, 53, 54): "Right Angle Cross of Maturation",
    (43, 23, 29, 30): "Right Angle Cross of Structuring",
    (44, 24, 19, 33): "Right Angle Cross of Transmission",
    (45, 26, 36,  6): "Right Angle Cross of the Scream",
    (46, 25, 15, 10): "Right Angle Cross of the Vessel of Love",
    (47, 22, 64, 63): "Right Angle Cross of Abstraction",
    (48, 21, 57, 51): "Right Angle Cross of Tension",
    (49,  4, 14,  8): "Right Angle Cross of the Four Ways",
    (50,  3, 27, 28): "Right Angle Cross of Rulership",
    (51, 57, 25, 46): "Right Angle Cross of Confrontation",
    (52, 58, 18, 17): "Right Angle Cross of Service",
    (53, 54, 42, 32): "Right Angle Cross of Cycles",
    (54, 53, 32, 42): "Right Angle Cross of Transformation",
    (55, 59, 38, 39): "Right Angle Cross of Spirit",
    (56, 60, 11, 12): "Right Angle Cross of Cycles",
    (57, 51, 20, 34): "Right Angle Cross of the Penetrating Sword",
    (58, 52, 17, 18): "Right Angle Cross of Service",
    (59, 55,  6, 36): "Right Angle Cross of Strategy",
    (60, 56,  3, 50): "Right Angle Cross of Limitation",
    (61, 62, 24, 44): "Right Angle Cross of Maya",
    (62, 61, 17, 18): "Right Angle Cross of the Messenger",
    (63, 64,  4, 49): "Right Angle Cross of Dominion",
    (64, 63, 47, 22): "Right Angle Cross of Confusion",
}

# Center membership: which gates belong to which center
CENTER_GATES = {
    "Head":        [64, 61, 63],
    "Ajna":        [47, 24, 4, 17, 43, 11],
    "Throat":      [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
    "G Center":    [1, 13, 25, 46, 22, 36, 10, 15, 7, 2],
    "Heart":       [21, 40, 26, 51],
    "Solar Plexus":[36, 22, 37, 6, 49, 55, 30],
    "Sacral":      [5, 14, 29, 59, 9, 3, 42, 27, 34],
    "Spleen":      [48, 57, 32, 28, 44, 50, 18],
    "Root":        [58, 38, 54, 53, 60, 52, 19, 39, 41],
}

def degree_to_gate(longitude: float) -> int:
    """Convert ecliptic longitude (0-360deg) to HD gate number."""
    lon = longitude % 360
    for start, end, gate in GATE_DEGREES:
        if start <= lon < end:
            return gate
    return 60  # fallback

def get_transit_gates_today(date: Optional[datetime] = None) -> dict:
    """
    Get all planetary gate activations for a given date.
    Returns dict of planet_name -> gate_number.
    Logs planet degrees and gates for debugging.
    """
    dt = date or datetime.utcnow()
    jd = swe.julday(dt.year, dt.month, dt.day,
                    dt.hour + dt.minute / 60.0)

    print(f"  TRANSIT DATE USED: {dt.strftime('%Y-%m-%d %H:%M UTC')}")

    planets = {
        "Sun":     swe.SUN,
        "Moon":    swe.MOON,
        "Mercury": swe.MERCURY,
        "Venus":   swe.VENUS,
        "Mars":    swe.MARS,
        "Jupiter": swe.JUPITER,
        "Saturn":  swe.SATURN,
        "Uranus":  swe.URANUS,
        "Neptune": swe.NEPTUNE,
        "Pluto":   swe.PLUTO,
        "Chiron":  swe.CHIRON,
    }

    result = {}
    for name, planet_id in planets.items():
        try:
            pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_SWIEPH | swe.FLG_SPEED)
            gate = degree_to_gate(pos[0])
            result[name] = gate
            print(f"  TRANSIT {name}: {pos[0]:.4f}deg -> Gate {gate}")
        except Exception as e1:
            try:
                pos, _ = swe.calc_ut(jd, planet_id, swe.FLG_MOSEPH | swe.FLG_SPEED)
                gate = degree_to_gate(pos[0])
                result[name] = gate
                print(f"  TRANSIT {name} (Moshier): {pos[0]:.4f}deg -> Gate {gate}")
            except Exception as e2:
                print(f"  TRANSIT {name}: ERROR swieph={e1} moseph={e2}")
                result[name] = None

    return result

def find_activated_channels(
    transit_gates: dict,
    natal_gates: list
) -> list:
    """
    Find channels temporarily completed by transits.
    A channel lights up when one gate is natal AND the partner gate is
    activated by a transiting planet.
    """
    activated = []
    natal_set = set(natal_gates)
    transit_gate_set = {g for g in transit_gates.values() if g}

    for (g1, g2), (center1, center2, channel_name) in CHANNELS.items():
        # Case 1: natal has g1, transit hits g2
        if g1 in natal_set and g2 in transit_gate_set:
            transiting_planets = [p for p, g in transit_gates.items() if g == g2]
            activated.append({
                "channel":            channel_name,
                "gates":              f"{g1}-{g2}",
                "natal_gate":         g1,
                "transit_gate":       g2,
                "transiting_planets": transiting_planets,
                "centers":            f"{center1} to {center2}",
                "description": (
                    f"Your natal Gate {g1} is being activated by transit Gate {g2} "
                    f"(via {', '.join(transiting_planets)}), temporarily completing "
                    f"the {channel_name} between {center1} and {center2}."
                )
            })
        # Case 2: natal has g2, transit hits g1
        elif g2 in natal_set and g1 in transit_gate_set:
            transiting_planets = [p for p, g in transit_gates.items() if g == g1]
            activated.append({
                "channel":            channel_name,
                "gates":              f"{g1}-{g2}",
                "natal_gate":         g2,
                "transit_gate":       g1,
                "transiting_planets": transiting_planets,
                "centers":            f"{center1} to {center2}",
                "description": (
                    f"Your natal Gate {g2} is being activated by transit Gate {g1} "
                    f"(via {', '.join(transiting_planets)}), temporarily completing "
                    f"the {channel_name} between {center1} and {center2}."
                )
            })

    return activated

def find_temporarily_defined_centers(
    transit_gates: dict,
    natal_defined_centers: list,
    natal_gates: list
) -> list:
    """
    Find undefined centers that become temporarily defined when transit gates
    complete channels into them.
    """
    natal_set = set(natal_gates)
    transit_gate_set = {g for g in transit_gates.values() if g}
    all_active_gates = natal_set | transit_gate_set

    newly_defined = []
    for center, gates in CENTER_GATES.items():
        if center in natal_defined_centers:
            continue  # already defined natally

        center_channels = [
            (g1, g2, name)
            for (g1, g2), (c1, c2, name) in CHANNELS.items()
            if c1 == center or c2 == center
        ]

        for g1, g2, channel_name in center_channels:
            if g1 in all_active_gates and g2 in all_active_gates:
                transit_contributing = [
                    p for p, g in transit_gates.items()
                    if g in (g1, g2) and g not in natal_set
                ]
                if transit_contributing:
                    newly_defined.append({
                        "center":       center,
                        "via_channel":  channel_name,
                        "gates":        f"{g1}-{g2}",
                        "transit_planets": transit_contributing,
                        "description": (
                            f"Your {center} -- normally undefined -- is temporarily "
                            f"activated via the {channel_name} (Gates {g1}-{g2}) "
                            f"by transiting {', '.join(transit_contributing)}."
                        )
                    })
                    break  # one activation per center is enough

    return newly_defined

def get_cycle_incarnation_cross(
    cycle_start: str,
    cycle_end: str,
    natal_gates: list,
    overlay_cross: Optional[str] = None
) -> dict:
    """
    Return the incarnation cross active during this cycle.

    Priority:
    1. Use overlay_cross if provided (passed directly from humandesign.ai overlay chart)
       This is the most accurate — it's the actual cross from the peak-date chart.
    2. Fall back to peak date Sun position calculation.
    3. Last resort: monthly sampling (least accurate, kept as final fallback).
    """

    # Priority 1: overlay cross passed directly from humandesign.ai overlay chart
    if overlay_cross:
        print(f"  CYCLE CROSS: using overlay_cross from Node: {overlay_cross}")
        return {
            "cross": overlay_cross,
            "source": "overlay_chart",
            "description": (
                f"The Incarnation Cross active at the peak of this cycle is the {overlay_cross}."
            )
        }

    # Priority 2: Calculate from peak date (midpoint of cycle window)
    print("  CYCLE CROSS: no overlay_cross provided, calculating from peak date")
    try:
        start = datetime.strptime(cycle_start, "%Y-%m-%d")
        end   = datetime.strptime(cycle_end,   "%Y-%m-%d")
        peak  = start + (end - start) / 2
        jd = swe.julday(peak.year, peak.month, peak.day, 12.0)

        try:
            sun_pos, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH | swe.FLG_SPEED)
        except Exception:
            sun_pos, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH | swe.FLG_SPEED)

        sun_gate = degree_to_gate(sun_pos[0])

        cross = None
        for gates, cross_name in INCARNATION_CROSSES.items():
            if sun_gate == gates[0]:
                cross = cross_name
                break

        if cross:
            print(f"  CYCLE CROSS: peak date Sun gate {sun_gate} -> {cross}")
            return {
                "cross": cross,
                "source": "peak_date_sun",
                "description": f"The Incarnation Cross at the cycle peak is the {cross}."
            }
    except Exception as e:
        print(f"  CYCLE CROSS: peak date calculation failed: {e}")

    # Priority 3: Monthly sampling fallback (original approach)
    print("  CYCLE CROSS: falling back to monthly sampling")
    try:
        start = datetime.strptime(cycle_start, "%Y-%m-%d")
        end   = datetime.strptime(cycle_end,   "%Y-%m-%d")
        cross_counts = {}
        current = start
        while current <= end:
            jd = swe.julday(current.year, current.month, current.day, 12.0)
            try:
                try:
                    sun_pos, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH | swe.FLG_SPEED)
                except Exception:
                    sun_pos, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_MOSEPH | swe.FLG_SPEED)
                sun_gate  = degree_to_gate(sun_pos[0])
                earth_gate = degree_to_gate((sun_pos[0] + 180) % 360)
                for gates, cross_name in INCARNATION_CROSSES.items():
                    if sun_gate == gates[0] or earth_gate == gates[1]:
                        cross_counts[cross_name] = cross_counts.get(cross_name, 0) + 1
                        break
            except Exception:
                pass
            current += timedelta(days=30)

        if cross_counts:
            dominant = max(cross_counts, key=cross_counts.get)
            return {
                "cross": dominant,
                "source": "monthly_sampling",
                "gate_activations": cross_counts,
                "description": (
                    f"The dominant Incarnation Cross active during this cycle window "
                    f"is the {dominant}, appearing in {cross_counts[dominant]} of the "
                    f"{len(cross_counts)} monthly samplings."
                )
            }
    except Exception as e:
        print(f"  CYCLE CROSS: monthly sampling failed: {e}")

    return {
        "cross": "Unable to calculate",
        "source": "error",
        "description": "Cross calculation unavailable."
    }

def get_full_transit_activation(
    natal_gates: list,
    natal_defined_centers: list,
    cycle_start: str,
    cycle_end: str,
    reading_date: Optional[datetime] = None,
    overlay_cross: Optional[str] = None
) -> dict:
    """
    Master function -- returns all transit activation data for the prompt.
    Call this from main.py and inject into chartText.
    overlay_cross: pass the incarnation cross from the humandesign.ai overlay chart
                   (the actual Chiron/Saturn/Uranus peak chart) so we don't recalculate it.
    """
    today = reading_date or datetime.utcnow()

    transit_gates       = get_transit_gates_today(today)
    activated_channels  = find_activated_channels(transit_gates, natal_gates)
    temp_defined        = find_temporarily_defined_centers(
                              transit_gates, natal_defined_centers, natal_gates
                          )
    cycle_cross         = get_cycle_incarnation_cross(
                              cycle_start, cycle_end, natal_gates,
                              overlay_cross=overlay_cross
                          )

    return {
        "reading_date":                today.strftime("%Y-%m-%d"),
        "transit_gates_today":         transit_gates,
        "activated_channels":          activated_channels,
        "temporarily_defined_centers": temp_defined,
        "cycle_incarnation_cross":     cycle_cross,
    }

def format_transit_activations_for_prompt(data: dict) -> str:
    """
    Format the transit activation data into clean text for Claude's prompt.
    No markdown. Claude will weave this into the reading naturally.
    """
    lines = [
        "TRANSIT ACTIVATIONS -- CURRENT EVOLUTIONARY LAYER",
        f"Reading Date: {data['reading_date']}",
        "",
    ]

    lines.append("Today's Planetary Gate Positions:")
    for planet, gate in data["transit_gates_today"].items():
        if gate:
            lines.append(f"  {planet}: Gate {gate}")
    lines.append("")

    if data["activated_channels"]:
        lines.append("Channels Currently Activated by Transit:")
        for ch in data["activated_channels"]:
            lines.append(f"  {ch['channel']} ({ch['gates']}) -- {ch['centers']}")
            lines.append(f"  Activated by: {', '.join(ch['transiting_planets'])}")
            lines.append(f"  {ch['description']}")
            lines.append("")
    else:
        lines.append("No channels currently being activated by transit.")
        lines.append("")

    if data["temporarily_defined_centers"]:
        lines.append("Centers Temporarily Defined by Current Transits:")
        for center in data["temporarily_defined_centers"]:
            lines.append(f"  {center['center']} -- via {center['via_channel']}")
            lines.append(f"  {center['description']}")
            lines.append("")
    else:
        lines.append("No undefined centers are being temporarily defined today.")
        lines.append("")

    cross = data["cycle_incarnation_cross"]
    lines.append("Dominant Incarnation Cross Active During This Cycle:")
    lines.append(f"  {cross['cross']}")
    lines.append(f"  {cross.get('description', '')}")
    lines.append("")

    lines.append(
        "INSTRUCTION FOR CLAUDE: Add a section after the cycle section titled "
        "'YOUR EVOLUTIONARY ACTIVATION -- WHAT IS ALIVE RIGHT NOW'. "
        "Interpret the activated channels and temporarily defined centers as the "
        "specific evolutionary pressure this person is under during their current cycle. "
        "Connect each activation to their natal design and the cycle they are in. "
        "Reference the cycle incarnation cross as the overarching theme of this 7-year window. "
        "Write in the same sacred, grounded, prose style as the rest of the reading. "
        "No markdown. No pound signs. Plain text only."
    )

    return "\n".join(lines)
