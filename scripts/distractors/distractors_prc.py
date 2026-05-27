"""Distractors for Flight Practice cards (prc-1 ... prc-63)."""

PRC = {
    # prc-1: How to calculate range from glide ratio?
    "prc-1": [
        "Glide ratio ÷ altitude = distance. Example: glide ratio 9, altitude 1000 m → 9 ÷ 1000 = 9 km.",
        "Altitude × wing area = distance. Example: 1000 m × 25 m² = 25,000 m³.",
        "Glide ratio + altitude (in km) = distance. Example: 9 + 1 = 10 km.",
    ],
    # prc-2: Flying south with 25 km/h west wind — how to arrive highest?
    "prc-2": [
        "Aim southeast (downwind) and fly with brakes applied to extend glide.",
        "Aim straight south and fly with the speedbar fully engaged.",
        "Aim northwest (into the wind) and fly at minimum sink speed.",
    ],
    # prc-3: Steady 15 km/h headwind at launch — what to expect?
    "prc-3": [
        "Long launch run, high running speed.",
        "Short launch run, high running speed.",
        "Long launch run, low running speed.",
    ],
    # prc-4: Turbulence with slight pitch/roll oscillation — correct reaction?
    "prc-4": [
        "Apply full brakes on both sides to stop the oscillations immediately.",
        "Lean forward and pull A-risers to flatten the wing and dampen pitch.",
        "Actively counter every oscillation with opposite brake input to keep the wing level.",
    ],
    # prc-5: Zurich-Kloten reports QNH 1015. What does this mean?
    "prc-5": [
        "The local field elevation in metres above sea level is 1015.",
        "The pressure at the runway threshold is 1015 hPa; sea-level pressure varies.",
        "The standard pressure setting is 1015 hPa; FL is calculated from this value.",
    ],
    # prc-6: Vrille (spin)?
    "prc-6": [
        "Rapid rotation around the longitudinal axis with both wings stalled simultaneously.",
        "Slow descent under a fully stalled wing — both halves stop flying at the same speed.",
        "Sideways slip with one wing tip pointing toward the ground, no rotation involved.",
    ],
    # prc-7: After launch must brake hard right to fly straight — cause?
    "prc-7": [
        "A knot in the lines on the RIGHT side (it shortens the right side).",
        "A line stretch over time has lengthened the left side relative to the right.",
        "A wet wing causes asymmetric flow separation on the right wingtip.",
    ],
    # prc-8: Consequences of knot between D-lines and brake lines on left?
    "prc-8": [
        "Higher risk of frontal collapse and a left turn may cause flow separation.",
        "Reduced top speed only; no effect on stall behaviour.",
        "Both wing halves stall at the same speed; no asymmetric risk.",
    ],
    # prc-9: Greatest collision risk between delta and paraglider?
    "prc-9": [
        "The paraglider approaches the delta from above and behind.",
        "The delta approaches the paraglider from above and in front.",
        "The paraglider approaches the delta from below and in front.",
    ],
    # prc-10: Red cloth ~6×6 m with yellow X — meaning?
    "prc-10": [
        "…landing direction reversed — land in the opposite direction shown by the windsock.",
        "…training in progress — give way to school flights but landing is permitted.",
        "…priority landing zone — land here only with prior radio contact.",
    ],
    # prc-11: Over-braking in a turn — consequences?
    "prc-11": [
        "Both wing halves stall simultaneously, leading to a stable parachutal descent.",
        "The wing pitches forward and accelerates into a frontal collapse.",
        "The wing rolls level and decelerates to minimum sink speed; no collapse risk.",
    ],
    # prc-12: First to land — direction and circuit?
    "prc-12": [
        "The first to land must follow the wind direction and fly a RIGHT-hand circuit.",
        "The last to land chooses the direction; the others must follow with the same circuit.",
        "The first to land must always land into the wind and fly a RIGHT-hand circuit.",
    ],
    # prc-13: Accelerate by pulling A-risers only — consequences?
    "prc-13": [
        "Asymmetric collapse: one wingtip folds in while the other continues to fly normally.",
        "Increased angle of attack and higher risk of parachutal stall.",
        "Spin (Vrille): one wing half stalls while the other accelerates forward.",
    ],
    # prc-14: 32 km/h, 2 °C air — wind-chill equivalent?
    "prc-14": [
        "−5 °C.",
        "−20 °C.",
        "+2 °C (no significant wind-chill at this speed).",
    ],
    # prc-15: Hit lift, circle, after 90° vario shows sink — best manoeuvre?
    "prc-15": [
        "Complete a 360° turn — the lift is centred where you started.",
        "Reverse the turn direction immediately to re-find the lift on the opposite side.",
        "Continue circling — the lift will return on the next 360° cycle.",
    ],
    # prc-16: Crab angle depends on?
    "prc-16": [
        "…airspeed and air density only.",
        "…wing loading and wing class.",
        "…altitude AMSL and pressure.",
    ],
    # prc-17: Choosing landing field in 25 km/h valley wind — most important requirement?
    "prc-17": [
        "The terrain on the leeward side must be flat and free of trees.",
        "The landing field must be at least 100 m × 100 m to allow circuit options.",
        "The approach must be over open water to dampen turbulence.",
    ],
    # prc-18: >50% asymmetric collapse, pilot does nothing — consequence?
    "prc-18": [
        "A controlled left or right turn with no further development.",
        "A stable parachutal descent at 5.5 m/s.",
        "A frontal collapse propagating to the other side of the wing.",
    ],
    # prc-19: Knot in front lines on left side — consequences?
    "prc-19": [
        "Less susceptible to turbulence on the left side; the right will collapse more easily.",
        "Higher risk of parachutal stall on the right side; left side is more stable.",
        "Wing flies normally — front-line knots have no effect on collapse behaviour.",
    ],
    # prc-20: Long exposure to airflow increases?
    "prc-20": [
        "…heart rate and blood pressure.",
        "…cabin altitude perception.",
        "…risk of hypoxia at low altitudes.",
    ],
    # prc-21: Wind 25 km/h at landing — as feet touch ground?
    "prc-21": [
        "…immediately run forward into the wind to keep the wing inflated above your head.",
        "…hold both brakes at half down to maintain control during ground handling.",
        "…release both brakes completely and let the wing collapse naturally behind you.",
    ],
    # prc-22: Crab angle…?
    "prc-22": [
        "…decreases with stronger crosswind.",
        "…remains constant regardless of crosswind strength.",
        "…increases with stronger headwind.",
    ],
    # prc-23: Launch from forest clearing — what to expect?
    "prc-23": [
        "…strong wind at the ground but calm air above the treetops, ensuring smooth launch.",
        "…uniform wind from ground to ridge height; no special precautions needed.",
        "…sinking air directly behind the trees, requiring a longer take-off run.",
    ],
    # prc-24: Pilot A 35 km/h, Pilot B 50 km/h, same crosswind?
    "prc-24": [
        "A must choose a SMALLER crab angle than B.",
        "Both pilots use the same crab angle — speed has no effect on crab.",
        "B must choose a LARGER crab angle than A, because higher speed amplifies drift.",
    ],
    # prc-25: To what altitude can a healthy body at rest adapt?
    "prc-25": [
        "≈ 2000 m.",
        "≈ 6000 m.",
        "≈ 8000 m.",
    ],
    # prc-26: Signs that a launch site is in the lee?
    "prc-26": [
        "Steady, constant wind from a single direction.",
        "Strong sunshine and rising air over the launch.",
        "Continuous gentle breeze with no gusts or direction changes.",
    ],
    # prc-27: To stay airborne longest in calm air?
    "prc-27": [
        "Fly with no brakes (hands up, trim speed).",
        "Fly with full speedbar pressed.",
        "Fly with full brakes (stall point).",
    ],
    # prc-28: Left circuit, landing west, base leg notice light east wind — action?
    "prc-28": [
        "Abort the approach, climb back up, and re-plan a right-hand circuit to land into wind.",
        "Continue the approach but switch direction at the last moment to land into the east wind.",
        "Apply full speedbar and dive steeply to compensate for the unexpected tailwind.",
    ],
    # prc-29: Tree landing — avoid damaging glider how?
    "prc-29": [
        "Pull the wing down sharply by the trailing edge to release it from branches.",
        "Cut all lines at the riser ends to remove the wing in one piece.",
        "Leave the brake lines tensioned and lower the wing by its leading edge only.",
    ],
    # prc-30: Spiral dive — what to note?
    "prc-30": [
        "…it is the safest descent method for beginners in any conditions.",
        "…it produces minimal G-load, so anyone can execute it without training.",
        "…it is recommended in calm air only; turbulence has no effect on the manoeuvre.",
    ],
    # prc-31: Wingover means?
    "prc-31": [
        "Rapid forward pitch with brief 90° dive angle.",
        "Slow, sustained spiral around the vertical axis at low bank.",
        "A full 360° loop around the lateral axis with the wing inverted at the top.",
    ],
    # prc-32: Releasing big-ears — note that?
    "prc-32": [
        "…should be actively pumped open as fast as possible to restore full speed.",
        "…should be opened only at altitudes above 2000 m AGL.",
        "…should be opened by pulling A-risers down to force them to re-inflate.",
    ],
    # prc-33: Stable parachutal stall 500 m above landing — react?
    "prc-33": [
        "Apply full brakes to recover normal flight from a clean stall.",
        "Let the wing descend in the stall and land using PLF technique.",
        "Pull the C- or D-risers down to break the stable stall state.",
    ],
    # prc-34: Consequences of wet canopy?
    "prc-34": [
        "Easier to inflate and launch; flow stays attached at higher angles of attack.",
        "Wing flies faster and is more prone to frontal collapse.",
        "No effect on flight behaviour as long as the lines remain dry.",
    ],
    # prc-35: Descending with big-ears — note?
    "prc-35": [
        "…is flying at a smaller angle of attack, so there's a higher risk of frontal collapse.",
        "…is flying at the same angle of attack as in normal flight; only the wing area changes.",
        "…is flying at a larger wing area, so the sink rate decreases compared to normal flight.",
    ],
    # prc-36: Advantage of big-ears descent?
    "prc-36": [
        "Highest possible sink rate (over 10 m/s) with minimal pilot effort.",
        "Total control over descent rate with no loss of forward speed.",
        "Allows the pilot to release the brakes and rest while descending.",
    ],
    # prc-37: Lugano 1015, Zurich-Kloten 1007 — meaning?
    "prc-37": [
        "Strong northerly flow with Nordföhn on the south side of the Alps.",
        "Weak pressure gradient — calm conditions expected on both sides of the Alps.",
        "Bise (east wind) sweeping across the Mittelland; no Föhn expected.",
    ],
    # prc-38: Steady 20 km/h headwind at launch — most important requirement?
    "prc-38": [
        "Lots of wind → the terrain in front of the wing must be free of obstacles for 200 m.",
        "Lots of wind → the launch site must be on a south-facing slope.",
        "Lots of wind → the take-off run must be at least 50 m long.",
    ],
    # prc-39: Circling in thermal with 270°/10 kt — where in thermal?
    "prc-39": [
        "On the LEEWARD (east) side of the thermal.",
        "Directly in the centre of the thermal, where the lift is strongest.",
        "On the upwind side but only above the tilt height of the thermal.",
    ],
    # prc-40: Where do golden eagles build nests?
    "prc-40": [
        "In high mountain meadows above the treeline.",
        "On the floor of remote alpine valleys, near streams.",
        "In rock crevices on the south-facing slopes of the Mittelland.",
    ],
    # prc-41: Abrupt turn initiation from straight flight — consequence?
    "prc-41": [
        "Frontal collapse: the wing pitches forward and folds across the leading edge.",
        "A clean, banked turn with no risk of collapse, as long as airspeed is maintained.",
        "Both wing halves stall simultaneously, leading to a stable parachutal descent.",
    ],
    # prc-42: Final approach, slightly too high — correct action?
    "prc-42": [
        "Release both brakes and accelerate to dive to the field with full speedbar.",
        "Apply brakes intermittently to enter mini spiral turns and dump altitude.",
        "Maintain trim speed and let the wing glide; aim past the target to recover.",
    ],
    # prc-43: Flying upwind, reach a cumulus — where rising air?
    "prc-43": [
        "On the LEEWARD side of the cumulus.",
        "Directly below the centre of the cloud.",
        "On the downwind side, below the trailing edge of the cloud.",
    ],
    # prc-44: Crab angle decreases when?
    "prc-44": [
        "…airspeed is decreased.",
        "…wind strength is increased.",
        "…the wind direction shifts from crosswind to headwind.",
    ],
    # prc-45: Heavy cold and ear infection — primary risk in flight?
    "prc-45": [
        "Sudden loss of consciousness due to hypoxia.",
        "Hearing loss in one ear, with no associated pain.",
        "Severe nausea and vomiting from inner-ear imbalance.",
    ],
    # prc-46: Crab angle is the angle between?
    "prc-46": [
        "…the longitudinal axis of the wing and the wind direction.",
        "…the flight path over ground and the wind direction.",
        "…the lateral axis of the glider and the horizon.",
    ],
    # prc-47: Asymmetric collapse — correct reaction?
    "prc-47": [
        "1. Apply full brake on the collapsed side to inflate it.\n2. Weight-shift toward the collapsed side to restore symmetry.",
        "1. Pull the speedbar to add internal pressure and re-inflate.\n2. Avoid weight-shift to prevent twist.",
        "1. Release all brakes and let the wing recover by itself.\n2. Avoid weight-shift completely until recovery is complete.",
    ],
    # prc-48: Circle 10 min, drift 3 km — wind speed?
    "prc-48": [
        "9 km/h.",
        "30 km/h.",
        "3 km/h.",
    ],
    # prc-49: One-sided flow separation while circling — correct reaction?
    "prc-49": [
        "Apply more brake on the collapsed side to restore flow attachment.",
        "Weight-shift toward the inside of the turn and pull both brakes equally.",
        "Pull the speedbar fully to accelerate out of the stall regime.",
    ],
    # prc-50: Where do chamois and ibex live in winter/spring?
    "prc-50": [
        "On north-facing forested slopes.",
        "On valley floors near rivers and streams.",
        "On glacier surfaces above 3000 m AMSL.",
    ],
    # prc-51: Sign of one-sided flow separation?
    "prc-51": [
        "The brake handle on the affected side becomes harder to pull, with increased resistance.",
        "The wing tip on the affected side rises sharply above the rest of the canopy.",
        "Both brake handles slacken at the same time, indicating bilateral collapse.",
    ],
    # prc-52: 20 km/h tailwind, want to fly as far as possible?
    "prc-52": [
        "Fly with full speedbar to maximise distance over ground.",
        "Fly at trim speed (hands up) — best glide ratio gives best distance.",
        "Apply full brake to fly at minimum sink and let the wind carry you.",
    ],
    # prc-53: 270°/10 kt — where strongest sink?
    "prc-53": [
        "On the WINDWARD (west) side of the thermal.",
        "Directly above the thermal, where the rising air converges.",
        "In the centre of the thermal, between the rising and sinking air.",
    ],
    # prc-54: 3 m/s thermal — fly to maximise altitude gain?
    "prc-54": [
        "Fly at trim speed (hands up) for best penetration through the thermal.",
        "Apply full speedbar to maximise time spent inside the thermal.",
        "Apply 60–80% brake to fly very slowly and stay in the lift longer.",
    ],
    # prc-55: How best to reduce one-sided flow separation risk?
    "prc-55": [
        "Always fly with maximum brake input to keep the wing under tight control.",
        "Fly with full speedbar at all times to keep internal pressure high.",
        "Use weight-shift exclusively — avoid using brakes to steer.",
    ],
    # prc-56: Shock symptoms after impact — actions?
    "prc-56": [
        "Give them sips of water to maintain hydration and call for help.",
        "Lay them flat on their back, give a sweet drink, and elevate the legs.",
        "Sit them upright, give them coffee or tea, and keep them moving to maintain consciousness.",
    ],
    # prc-57: Stable parachutal stall on final, 10 m AGL — react?
    "prc-57": [
        "Push A-risers forward immediately to restore normal flight.",
        "Apply full speedbar to break out of the stall and regain forward speed.",
        "Pull C- or D-risers down to break the stall, then flare normally.",
    ],
    # prc-58: Calm air, fly as far as possible?
    "prc-58": [
        "Apply 20–30% brake (minimum sink speed).",
        "Apply full speedbar for maximum distance per unit altitude.",
        "Apply 50% brake for maximum gliding stability.",
    ],
    # prc-59: From what pressure difference Zurich/Lugano to expect Föhn?
    "prc-59": [
        "1 hPa.",
        "10 hPa.",
        "20 hPa.",
    ],
    # prc-60: Strong wind gradient near ground, glider settles briefly — what?
    "prc-60": [
        "…apply full brake immediately to prevent further sink.",
        "…pull the speedbar to power through the gradient.",
        "…weight-shift forward and pull both brakes to flare prematurely.",
    ],
    # prc-61: Landing in 30 m target, getting tight — options to lose height?
    "prc-61": [
        "• B-line stall — fastest descent and most precise control.\n• Spiral dive — accurate altitude dump near the ground.\n• Apply full speedbar to extend the approach.",
        "• Release big-ears at low altitude for instant lift recovery.\n• Tuck legs in to reduce drag and accelerate descent.\n• Apply full brake to enter a parachutal stall and drop vertically.",
        "• Pull D-risers down to dump altitude rapidly.\n• Apply asymmetric brake to enter a flat spin.\n• Increase wing loading by adding ballast in flight.",
    ],
    # prc-62: Good pre-flight prep at home?
    "prc-62": [
        "• Submit a flight plan to BAZL.\n• Book a tandem partner.\n• Charge GoPro batteries.\n• Pack snacks.\n• Confirm landing field reservation with the SHV.",
        "• Check insurance policy expiry.\n• Renew the SHV badge.\n• Buy fuel for the retrieve vehicle.\n• Print Glider Map.\n• Set GPS waypoints.",
        "• Wash the wing.\n• Re-pack the reserve.\n• Read the latest SHV newsletter.\n• Buy a new helmet.\n• Trim the brake-line length.",
    ],
    # prc-63: "The flight begins at landing field" — on site?
    "prc-63": [
        "• Pack the reserve.\n• Check insurance papers.\n• Verify license validity.\n• Confirm fuel for retrieve vehicle.\n• Brief the passenger.",
        "• Calibrate variometer.\n• Set altimeter to QNH.\n• Replace batteries.\n• Update DABS on smartphone.\n• Inflate harness airbag.",
        "• Check the Glider Map.\n• Review NOTAM.\n• Confirm MIL-ON status by phone.\n• Submit a flight plan.\n• Wait for clearance from ATC.",
    ],
}
