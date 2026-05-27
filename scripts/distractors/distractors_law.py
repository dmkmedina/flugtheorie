"""Distractors for Legislation cards (law-1 ... law-83)."""

LAW = {
    # law-1: Which publication shows the exact boundary line between Jura/Mittelland and Alps?
    # Correct: "The Glider Map (GLDK / Segelflugkarte)."
    "law-1": [
        "The DABS (Daily Airspace Bulletin Switzerland).",
        "The AIP (Aeronautical Information Publication).",
        "The NOTAM bulletin for free-flight pilots.",
    ],
    # law-2: What does the green dividing line on the Glider Map mean?
    # Correct: separates Mittelland/Jura (3050 m) from Alps (4550 m), etc.
    "law-2": [
        "It marks the lower limit of all controlled airspaces (Class C) around the major airports of Switzerland: Zürich, Geneva and Basel. North of the line the ceiling is FL130, south of it FL150 — a new map is published every three years.",
        "It indicates the daily boundary of the MIL-ON military activation zone. North of the line military flight times are Mon–Fri 07:30–12:05; south of the line they extend until 17:05. The map is updated annually in March.",
        "It shows the upper limit of airspace G across Switzerland: 600 m AGL north of the line, 1000 m AGL south of the line (because Alpine terrain is higher). The MIL-ON ceiling rises from 3950 m to 4550 m correspondingly.",
    ],
    # law-3: How high may you fly over the mountains in the Alps?
    # Correct: 4550 m + 600 m over peak; MIL-ON 3950; MIL-OFF 4550
    "law-3": [
        "Up to FL100 (3050 m) at all times in the Alps.",
        "Up to 4550 m only — never higher, even above tall peaks.",
        "Up to 3050 m with MIL-ON and 3950 m with MIL-OFF.",
    ],
    # law-4: MIL-ON times?
    # Correct: Mon-Fri 07:30-12:05 and 13:15-17:05, ceiling 3950 m
    "law-4": [
        "Monday–Sunday 08:00–17:00, ceiling 4550 m.",
        "Monday–Friday 09:00–18:00 with a 30-minute lunch break, ceiling 3050 m.",
        "Weekends and public holidays only, ceiling 3950 m.",
    ],
    # law-5: LS-R stands for?
    "law-5": [
        "LS-R = Reserved airspace for military training.",
        "LS-R = Recreational area for free-flight pilots.",
        "LS-R = Radio zone (mandatory contact required).",
    ],
    # law-6: Difference between green and red LS-R?
    "law-6": [
        "Red LS-R zones are permanently active (H24); green LS-R zones are seasonal (winter only, November–February) and check the AIP for current dates. Both forbid entry when active.",
        "Green LS-R zones forbid entry when active — check the GLDK for current status (green = inactive). Red LS-R zones, depending on activation, represent a relaxation of the normal rules (\"LS-R for gliders\").",
        "Red LS-R zones apply to motorised aircraft only; green LS-R zones apply only to gliders and paragliders. Both can be entered after radio contact on the published frequency.",
    ],
    # law-7: Rules in green LSR for gliders?
    "law-7": [
        "Inside an LSR for gliders, cloud clearances stay the same (1500 m horizontal, 300 m vertical) but flight visibility is reduced to 1.5 km. They are classified as LS-R because VFR traffic is restricted. Active 1 November – 28 February from sunrise to sunset.\n\nIMPORTANT: This only affects visibility, never cloud clearance.\n• \"MO\" suffix = only active during MIL-ON.\n• \"MA\" suffix = only active during MIL-OFF — check by radio.",
        "Inside an LSR for gliders, all cloud clearances are removed entirely as long as the pilot keeps the ground in sight. Flight visibility must remain at least 8 km. They are classified as LS-R because helicopter traffic is forbidden. Active year-round from sunrise to sunset.\n\nIMPORTANT: This only affects altitude limits, never visibility.\n• \"MO\" suffix = only active on Monday.\n• \"MA\" suffix = only active on weekends.",
        "Inside an LSR for gliders, reduced cloud clearances apply: 150 m vertical, 300 m horizontal. Flight visibility is reduced to 3 km. They are classified as LS-R because VFR is forbidden. Active 1 March – 31 October from sunset to sunrise (night only).\n\nIMPORTANT: This applies to both altitude limits and visibility.\n• \"MO\" suffix = only active in October.\n• \"MA\" suffix = only active in March.",
    ],
    # law-8: Special rules in LSR for Gliders?
    "law-8": [
        "Reduced cloud clearance of 100 m vertical, 50 m horizontal — applies up to FL100.",
        "Normal cloud distances apply; reduced visibility to 1.5 km is permitted.",
        "Cloud clearances are waived altogether below 600 m AGL inside the zone.",
    ],
    # law-9: LS-D stands for?
    "law-9": [
        "LS-D = Designated free-flight area for paragliders.",
        "LS-D = Departure airspace around airports — entry forbidden when active.",
        "LS-D = Daylight-only restricted area, active sunrise to sunset.",
    ],
    # law-10: NOTAM?
    "law-10": [
        "Notice to All Members — SHV's weekly safety bulletin.",
        "Network of Aviation Tracking and Monitoring — radar-based traffic info.",
        "Notice on Terrain and Mountains — annual hazard map.",
    ],
    # law-11: DABS?
    "law-11": [
        "A weekly publication that lists all permanent CTRs and TMAs in Switzerland in tabular form. Times are in local time (no UTC conversion needed). Published every Monday at 08:00 on www.bazl.admin.ch for the current week.",
        "The federal airspace classification map, updated every March alongside the new Glider Map. Shows the permanent boundaries of airspace classes G, E, C and D in graphical form. Available on the SHV portal for members only.",
        "A daily air-quality bulletin published by MeteoSwiss for free-flight pilots. Indicates visibility and turbulence forecasts in graphical form. Times are in UTC — add 1 h in winter, 2 h in summer. Published at 06:00 daily.",
    ],
    # law-12: AIP?
    "law-12": [
        "Airspace Information Pamphlet — quick reference for VFR pilots.",
        "Automatic Information Provider — onboard avionics device.",
        "Approach Information Plate — published per runway by BAZL.",
    ],
    # law-13: What is a CTR?
    "law-13": [
        "Cruise Traffic Region. A high-altitude corridor connecting major airports. Class C airspace; shown on the map with solid red lines and red shading; extends from FL100 up to FL250.",
        "Conditional Transit Route. A corridor through restricted areas, usable only when MIL-OFF is active. Shown with dashed green lines and white fill; extends from ground (GND) to the upper limit listed in the box.",
        "Controlled Terminal Radius. A 5 km circular zone around every Swiss airfield, regardless of size. Shown on the map with solid blue lines and transparent yellow fill; always extends from ground up to 600 m AGL.",
    ],
    # law-14: A CTR...
    "law-14": [
        "…surrounds a heliport and extends from 600 m AGL to FL100.",
        "…is shown as a solid dark-blue line and applies only between sunrise and sunset.",
        "…surrounds an airport but never reaches the ground, so paragliders can fly underneath.",
    ],
    # law-15: TMA?
    "law-15": [
        "Tactical Manoeuvring Area — military training zone over the Alps. Class C, active during MIL-ON hours only (Mon–Fri 07:30–12:05 and 13:15–17:05). Extends from FL100 to FL150. In the Jura: paragliders must respect the lower limit. In the Alps: lower limit is whichever is lower — the map limit OR 600 m AGL.",
        "Transponder Mandatory Area — entry only with an active transponder transmitting the assigned code. Class D, surrounds small regional airfields (Samedan, Lugano, Sion). Always extends from ground to FL100; paragliders cannot fly underneath.",
        "Terminal Movement Area — Class G zone around small airfields used for traffic separation. No clearance required, but radio contact recommended. Always extends from ground to the published upper limit; in the Alps the upper limit is whichever is lower: the map limit OR 600 m AGL.",
    ],
    # law-16: Minimum lower limit of a TMA in the Alps?
    "law-16": [
        "600 m AGL or the published lower limit — whichever is lower.",
        "Always the published lower limit, regardless of terrain.",
        "300 m AMSL or the published lower limit — whichever is lower.",
    ],
    # law-17: A TMA (altitude data)?
    "law-17": [
        "Located directly above an airfield, with the lower limit always at ground level (so paragliders can never fly underneath). Above a TMA you find the Airways linking airports, with limits shown on the map.",
        "Shown only in the AIP because the Glider Map omits TMAs (they do not affect paragliders). Limits are listed in feet AMSL. Below a TMA there is no airspace restriction; above it is a CTR.",
        "Always has a lower limit of 600 m AGL throughout Switzerland, regardless of map data. Above is uncontrolled airspace E up to FL100; below the TMA is the CTR, which extends to the ground.",
    ],
    # law-18: HX abbreviation?
    "law-18": [
        "Fixed activation times published annually in the AIP and on the Glider Map. The TMAs/CTRs of Zürich, Geneva and Basel carry the \"HX\" suffix because they are activated only during published hours. Most others are permanent (H24). We must assume HX zones are inactive by default unless otherwise notified.",
        "Active only during MIL-ON hours (Mon–Fri 07:30–12:05 and 13:15–17:05). Most CTRs/TMAs around small regional airports carry an \"HX\" suffix, meaning they are tied to military timings. Outside MIL-ON they revert to airspace G or E. The major-airport zones never use HX.",
        "Permanently active (H24) — same as the major-airport CTRs of Zürich, Geneva and Basel. The \"HX\" suffix marks zones that cannot be deactivated under any circumstances. Pilots cannot request inactive status via radio. If \"HX\" is missing, the zone is HX-temporary and must be checked daily.",
    ],
    # law-19: HX = (variant)?
    "law-19": [
        "Permanently active H24, never deactivated. Check the AIP for the controlling frequency. The 15-minute rule applies. If nothing is noted = HX-temporary (active only during published hours). Activations of major airports (LSZH, LSGG) appear in the NOTAM only.",
        "Active sunrise to sunset, 1 March to 31 October only. Check by phone or radio (frequency listed in the GLDK). The 60-minute rule applies. If nothing is noted = HX-permanent (always active). Most CTRs around Zürich are HX, but those around Geneva are H24.",
        "Active only when the corresponding LS-R zone is also activated. Check by NOTAM/DABS (every CTR/TMA in CH is listed). The 30-minute rule applies. If nothing is noted = inactive (treated as surrounding airspace). Alpnach and Sion are always H24.",
    ],
    # law-20: No HX label =
    "law-20": [
        "Always inactive — entry is unrestricted at any time.",
        "Active only during MIL-OFF hours (weekends and holidays).",
        "Activation is shown in the AIP, updated annually.",
    ],
    # law-21: AWY?
    "law-21": [
        "Approach Way — short corridor leading directly into an airfield's CTR.",
        "Alternative Way — backup routing for IFR traffic when main airways are closed.",
        "Aerial Wildlife Yard — protected zone where overflight is restricted year-round.",
    ],
    # law-22: FIZ stands for?
    "law-22": [
        "Federal Information Zone — area where DABS data is officially binding.",
        "Flight Inspection Zone — area where BAZL inspectors conduct random checks.",
        "Free-flight Identification Zone — paragliders must broadcast their SHV number.",
    ],
    # law-23: Rules in a FIZ?
    "law-23": [
        "Entry only with a formal clearance from the flight information service on the published frequency. Around Samedan airfield there is a FIZ where ATC clearance is required because the airspace becomes Class D during operating hours. The FIS operator can issue clearances and refuse entry.\n\nContrast with RMZ (Radio Mandatory Zone): the same rules apply there — clearance and two-way radio contact are mandatory.",
        "Entry only with listening watch and blind broadcasts — no radio contact required, the FIZ is purely informational. Around Samedan there is a FIZ active only outside the operating hours of the regional airfield. The airspace class itself is always G.\n\nContrast with RMZ (Radio Mandatory Zone): there a two-way contact is required and someone always responds on the published frequency.",
        "Entry forbidden during operating hours; permitted only outside published times. Around Samedan a FIZ is active to protect IFR traffic on approach; entry into the FIZ is treated as entry into a CTR. The airspace class changes to C during these times.\n\nContrast with RMZ (Radio Mandatory Zone): there entry is permitted but requires a transponder.",
    ],
    # law-24: Rules in an RMZ?
    "law-24": [
        "Entry only after establishing two-way radio contact with the appropriate ATC.",
        "Entry only with a transponder code assigned by the controlling agency.",
        "Entry only between sunrise and sunset; closed during nighttime.",
    ],
    # law-25: FL 150 corresponds to (Alps, MIL-OFF)?
    "law-25": [
        "≈ 5500 m above sea level.",
        "≈ 3950 m above sea level.",
        "≈ 3050 m above sea level.",
    ],
    # law-26: FL 100 is approximately?
    "law-26": [
        "≈ 3950 m above sea level.",
        "≈ 4550 m above sea level.",
        "≈ 1000 m above sea level.",
    ],
    # law-27: FL — Flight Level referenced to which pressure?
    "law-27": [
        "1023 hPa (QFE — local field pressure). Why: altimeters measure pressure relative to the ground; FL is a calibrated reference based on the takeoff altitude. Recalibrate before every flight to maintain accuracy.",
        "QNH from the nearest reporting airport, updated hourly via ATIS. Why: altimeters measure pressure, and QNH gives the local sea-level reference. Flight Level always equals current altitude AMSL divided by 100.",
        "Local sea-level pressure as broadcast by ATIS in millibars (mb). Why: FL is calculated dynamically from the current QNH. This ensures pilots always read the same height for the same location, regardless of weather.",
    ],
    # law-28: How much higher in high pressure?
    "law-28": [
        "Above 1037 hPa: +50 m  •  1032–1036: +100 m  •  1026–1031: +150 m  •  1020–1025: +200 m.",
        "+100 m for every 5 hPa above standard pressure (1013), no upper cap.",
        "Always +300 m above the GLDK ceiling, regardless of pressure value.",
    ],
    # law-29: Swiss legal provisions for hang-gliding found in?
    "law-29": [
        "The Federal Aviation Act (Luftfahrtgesetz LFG), 21 December 1948.",
        "The BAZL Operations Manual for Special-Category Aircraft, 2010.",
        "The SHV Statutes (Vereinsstatuten), revised annually.",
    ],
    # law-30: Swiss airspace classes?
    "law-30": [
        "7 classes globally (A–G), and all 7 are used in Switzerland.\n• A, B & C — entry is free for paragliders.\n• D & E — entry only with clearance and radio contact.\n\nG: ground to 300 m AGL, controlled. Below 600 AGL: 5 km visibility, clear of cloud. From 600 AGL: 8 km vis, 50 m horizontal / 100 m vertical cloud clearance.\n\nE: up to 3050 m AMSL. Below FL100: 8 km vis, 1.5/300 cloud clearance. Above FL100: 5 km vis, 50/100 cloud clearance.\n\nC: lower limit 3050/3950/4550 AMSL — upper limit 18,300 AMSL (uncontrolled; 5 km vis, 50/100).\n\nD: mostly around heliports.",
        "4 classes used in Switzerland: A, B, C and D — entry to all requires clearance.\n• A & B — controlled, paragliders forbidden.\n• C & D — free entry for VFR.\n\nA: ground to 600 m AGL, uncontrolled. Below 300 AGL: 1.5 km visibility, clear of cloud.\n\nB: up to 3050 / 3950 / 4550 m AMSL. Below 3050: 5 km vis, 1.5/300 cloud clearance.\n\nC: lower limit 3050/3950/4550 AMSL — upper limit 18,300 AMSL (controlled; 8 km vis, 1.5/300).\n\nD: mostly around airports.",
        "5 classes in Switzerland: G, E, D, C and B; F is reserved for IFR holding patterns.\n• G & D — entry is free.\n• B, C & E — entry only with clearance.\n\nG: ground to 1000 m AGL, uncontrolled. Below 500 AGL: 1.5 km visibility, clear of cloud. From 500 AGL: 5 km vis, 1.5 km horizontal / 300 m vertical cloud clearance.\n\nE: up to 3050 m AMSL only. Below 3050: 5 km vis, 1.5/300 cloud clearance. Above: requires clearance.\n\nC: lower limit 3050 AMSL — upper limit FL100. D: mostly around heliports.",
    ],
    # law-31: Which airspace classes don't require continuous radio?
    "law-31": [
        "C and D.",
        "Only G; in E radio is mandatory above 600 m AGL.",
        "All classes — radio is optional for paragliders under VFR.",
    ],
    # law-32: Upper limit of airspace G in Switzerland?
    "law-32": [
        "300 m AGL throughout Switzerland.",
        "1000 m AGL in the Alps; 600 m AGL elsewhere.",
        "FL100 (3050 m AMSL) regardless of terrain.",
    ],
    # law-33: Rules ground to 300 AGL (G)?
    "law-33": [
        "5 km visibility, 1.5 km horizontal and 300 m vertical cloud clearance.",
        "5 km visibility, clear of cloud.",
        "8 km visibility, 1500 m horizontal and 300 m vertical cloud clearance.",
    ],
    # law-34: Rules for flying up to 300 m?
    "law-34": [
        "5 km visibility and 1.5 km horizontal / 300 m vertical cloud clearance.",
        "8 km visibility, clear of cloud horizontally and vertically.",
        "1.5 km visibility with 50 m vertical and 100 m horizontal cloud clearance.",
    ],
    # law-35: VFR distances on Wed 14:30 in Alps at 200 m AGL / 3800 m AMSL?
    "law-35": [
        "5 km visibility / 1.5 km horizontal / 300 m vertical (because above 3050 AMSL).",
        "8 km visibility / 1.5 km horizontal / 300 m vertical (because above FL100).",
        "5 km visibility / clear of cloud / clear of cloud (because under 600 m AGL).",
    ],
    # law-36: Rules from 300 AGL (G)?
    "law-36": [
        "1.5 km visibility, clear of cloud horizontally and vertically.",
        "8 km visibility, 1500 m horizontal, 300 m vertical cloud clearance.",
        "5 km visibility, 50 m horizontal, 100 m vertical cloud clearance.",
    ],
    # law-37: Rules above 300 m?
    "law-37": [
        "Visibility 1.5 km, clear of cloud.",
        "Visibility 8 km, cloud clearance 1500 m horizontal / 300 m vertical.",
        "Visibility 5 km, cloud clearance 100 m horizontal / 50 m vertical.",
    ],
    # law-38: Up to 3050 AMSL (airspace E)?
    "law-38": [
        "8 km visibility, 1.5 km horizontal, 300 m vertical.",
        "1.5 km visibility, clear of cloud.",
        "5 km visibility, 50 m horizontal, 100 m vertical.",
    ],
    # law-39: From 3050 AMSL upward (E)?
    "law-39": [
        "5 km visibility, 1.5 km horizontal, 300 m vertical.",
        "1.5 km visibility, clear of cloud.",
        "8 km visibility, 8 km horizontal, 600 m vertical.",
    ],
    # law-40: From 4550 AMSL upward (C)?
    "law-40": [
        "Uncontrolled — same rules as airspace E above 3050 AMSL apply.",
        "5 km visibility, 1.5 km horizontal / 300 m vertical, entry without clearance.",
        "Entry permitted with listening watch on 130.930 MHz, no clearance required.",
    ],
    # law-41: Airspace tags on the map?
    "law-41": [
        "Numbers in red = altitudes in metres AGL; numbers in green = altitudes in feet AMSL.\n• Plain numbers = AMSL.\n• Italic numbers = AGL.\n• Blue lower number = altitude per local QNH (because pressure varies daily).\n• White number = altitude in flight levels.\n• Red-shaded = AGL, exact only above peaks.",
        "All numbers are in flight levels (FL); white background = AMSL, blue background = AGL.\n• Plain numbers = AMSL.\n• Italic numbers = standard atmosphere.\n• Blue lower number = altitude as measured by altimeter set to QFE.\n• White number = altitude per current QNH.\n• Red-shaded = barometric, can drift up to 200 m.",
        "Italic numbers = AGL; plain numbers = AMSL; red background = effective GPS altitude.\n• Lower limit is shown in italic, upper limit in plain numbers.\n• Blue lower number = altitude per local QNH.\n• White number = altitude per ICAO standard.\n• Green-shaded = altitude that varies with terrain.",
    ],
    # law-42: LS prefix?
    "law-42": [
        "Liechtenstein/Switzerland combined region. Examples: LSGG Geneva.",
        "Light Sport aircraft prefix (SHV registration system).",
        "Low-altitude Standard zone. Examples: LSZB Bern, LSGG Geneva.",
    ],
    # law-43: VFR?
    "law-43": [
        "Variable Flight Range — performance window of the wing.",
        "Vertical Flight Rules — rules for spiral dive and B-line stall manoeuvres.",
        "Visual Flight Reservation — pre-flight slot booking via SHV.",
    ],
    # law-44: IFR?
    "law-44": [
        "Internal Flight Routing — flight planning system used by ATC.",
        "Instrument Flight Reference — minimum equipment for cross-country flying.",
        "Initial Flight Registration — pilot certification level after solo exam.",
    ],
    # law-45: Rules around heliports?
    "law-45": [
        "Stay 5 km away (2.5 km for airfields). Above 300 m over the reference point is OK.",
        "Stay 1 km away from any landing site. No altitude restrictions apply.",
        "Stay 2.5 km away (5 km for airfields). Overflight requires prior radio contact.",
    ],
    # law-46: 5 planning questions in a region?
    "law-46": [
        "1. Wing class? 2. Pilot license level? 3. Visibility? 4. Cloud base? 5. Wind speed?",
        "1. Departure time? 2. Landing field? 3. Reserve packed? 4. Battery charged? 5. Insurance?",
        "1. Weather forecast? 2. Glide ratio? 3. Wing loading? 4. Fuel? 5. Passenger weight?",
    ],
    # law-47: Preparation on site at flying area?
    "law-47": [
        "Check the wing for porosity, replace any worn lines, repack the reserve. Inspect the harness for wear, calibrate the variometer, charge all batteries. Brief any passenger about emergency procedures and confirm their insurance.",
        "Submit a flight plan to BAZL and obtain clearance from the nearest CTR controller. Verify the active NOTAM, confirm MIL-ON status by phone, and double-check that the DABS shows no restrictions. Carry a printed copy of your SHV license.",
        "Inflate the harness airbag, brief the passenger, verify SHV insurance certificate. Set the altimeter to QNH, confirm GPS waypoints, and check that the speedbar is properly attached. Submit a flight plan if crossing a CTR.",
    ],
    # law-48: 1 foot equals?
    "law-48": [
        "≈ 25.4 cm.",
        "≈ 100 cm (1 metre).",
        "≈ 91.4 cm (3 feet).",
    ],
    # law-49: Airfield & heliport distances?
    "law-49": [
        "• Heliport: 5 km radius (red, circle + H).\n• Civil airfield: 2.5 km (red, one circle + line).\n• Joint civil/military: 2.5 km (violet, two circles + line).\n• Military airfield: 10 km (red, two circles + line).\nMinimum altitude when overflying: 300 m above the reference point.",
        "• Heliport: 1 km radius (violet, circle + H).\n• Civil airfield: 1 km (violet, one circle + line).\n• Joint civil/military: 5 km (red, two circles + line).\n• Military airfield: 5 km (violet, two circles + line).\nMinimum altitude when overflying: 150 m above the reference point.",
        "• Heliport: 2.5 km radius (red, circle + H).\n• Civil airfield: 5 km (red, one circle + line).\n• Joint civil/military: 10 km (violet, two circles + line).\n• Military airfield: 5 km (violet, two circles + line).\nMinimum altitude when overflying: 1500 m above the reference point.",
    ],
    # law-50: Min horizontal distance from military airfield runway?
    "law-50": [
        "2.5 km — at all times, regardless of military activity.",
        "5 km — at all times, including weekends and holidays.",
        "1 km — only during MIL-ON hours.",
    ],
    # law-51: Crowds, buildings, roads, ski slopes...
    "law-51": [
        "…must be overflown at a minimum altitude of 600 m AGL.",
        "…must be avoided horizontally by at least 5 km regardless of altitude.",
        "…require prior written permission from the cantonal authority for any overflight.",
    ],
    # law-52: Airworthiness check under VLK?
    "law-52": [
        "…be inspected by BAZL every 2 years.",
        "…be certified by the SHV before each season of use.",
        "…be checked annually by the manufacturer or an authorised representative.",
    ],
    # law-53: Towing with winches/vehicles?
    "law-53": [
        "Permitted up to 300 m AGL; above that requires authorisation.",
        "Always requires authorisation, regardless of altitude.",
        "Permitted up to 600 m AGL; above that requires authorisation.",
    ],
    # law-54: Take-off/landing on public waters?
    "law-54": [
        "Authorisation from the SHV technical commission is required.",
        "Authorisation from BAZL is required.",
        "Permitted without authorisation as long as no third parties are present.",
    ],
    # law-55: Training flights under whose supervision?
    "law-55": [
        "…a valid SHV pilot license (any class).",
        "…a valid tandem pilot license.",
        "…a valid SHV examiner authorisation.",
    ],
    # law-56: Required insurance during flights?
    "law-56": [
        "Pilot accident insurance (minimum cover CHF 100,000).",
        "Equipment / hull insurance (minimum cover CHF 10,000).",
        "Tandem passenger liability insurance (minimum CHF 5 million).",
    ],
    # law-57: Commercial tandem license?
    "law-57": [
        "Solo pilot license with at least 100 logged tandem flights.",
        "International IPPI Card with Stage 5 qualification.",
        "Instructor license (Fluglehrerausweis).",
    ],
    # law-58: FL stands for?
    "law-58": [
        "Free Lift (Freier Auftrieb).",
        "Flying License (Flugausweis).",
        "Final Limit (Flughöhenlimit).",
    ],
    # law-59: Diameter of target circle in practical exam?
    "law-59": [
        "Paraglider: 50 m. Hang glider (delta): 100 m.",
        "Paraglider: 20 m. Hang glider (delta): 50 m.",
        "Paraglider: 30 m. Hang glider (delta): 30 m.",
    ],
    # law-60: Who issues laws on use of Swiss airspace?
    "law-60": [
        "The cantons individually.",
        "BAZL and SHV jointly.",
        "Skyguide (the Swiss air navigation provider).",
    ],
    # law-61: Frequency for hang-gliding training?
    "law-61": [
        "130.930 MHz.",
        "161.300 MHz.",
        "118.025 MHz.",
    ],
    # law-62: Frequency for hang-glider air-to-air?
    "law-62": [
        "123.430 MHz.",
        "161.300 MHz.",
        "121.500 MHz.",
    ],
    # law-63: Use of 130.930 MHz requires?
    "law-63": [
        "…a BAKOM radiotelephony certificate.",
        "…SHV member status and an air-band radio license.",
        "…a one-day course at the local flight school.",
    ],
    # law-64: Max time between theory & practical exam?
    "law-64": [
        "12 months.",
        "24 months.",
        "60 months.",
    ],
    # law-65: Earliest re-sit after failed exam?
    "law-65": [
        "30 days.",
        "7 days.",
        "60 days.",
    ],
    # law-66: Where to appeal an exam decision?
    "law-66": [
        "BAZL (Federal Office of Civil Aviation).",
        "The cantonal civil court of the place of residence.",
        "The SHV technical commission.",
    ],
    # law-67: Hang-gliders fly under which rules?
    "law-67": [
        "Exclusively under IFR (instrument flight rules).",
        "Under VFR by default, but IFR is permitted in controlled airspace.",
        "Under special VFR rules issued by BAZL annually.",
    ],
    # law-68: Hang-gliders with electric propulsion may?
    "law-68": [
        "…take off from any flat field with at least 100 m clear approach.",
        "…take off only from designated paragliding sites with SHV approval.",
        "…take off without restriction — the rules are identical to non-powered hang-gliders.",
    ],
    # law-69: Insurance covers damage to?
    "law-69": [
        "…all third parties, both on the ground and in the air.",
        "…the pilot and the equipment, but not third parties.",
        "…uninvolved third parties in the air only (ground damage excluded).",
    ],
    # law-70: Mandatory markings on every hang-glider?
    "law-70": [
        "BAZL registration number and the pilot's name.",
        "SHV membership number and date of last inspection.",
        "EN certification class and serial number only.",
    ],
    # law-71: Deadline to file appeal?
    "law-71": [
        "60 days.",
        "12 days.",
        "90 days.",
    ],
    # law-72: Crossing border with hang-glider (no goods, papers OK)?
    "law-72": [
        "…forbidden unless prior authorisation is obtained from customs.",
        "…permitted only at designated border-crossing flight corridors.",
        "…permitted only between sunrise and sunset and only with active radio contact.",
    ],
    # law-73: Who exercises direct supervision of civil aviation?
    "law-73": [
        "Skyguide (the Swiss air navigation provider). Chain: 1. Confederation — makes laws  •  2. Skyguide — supervises  •  3. SHV and BAZL — implement. The VLK is enforced jointly by Skyguide and the cantons.",
        "SHV (Swiss Hang-Gliding Federation). Chain: 1. Confederation — makes laws  •  2. SHV — supervises hang-gliding only  •  3. BAZL — supervises the rest of civil aviation. The VLK is administered by BAZL.",
        "The Federal Department of the Environment, Transport, Energy and Communications (UVEK). Chain: 1. UVEK — makes laws  •  2. BAZL — supervises  •  3. SHV — implements free-flight rules only. The VLK is a federal-level statute.",
    ],
    # law-74: How airspaces are distinguished on the Glider Map?
    "law-74": [
        "Solid lines = active; dashed lines = inactive.",
        "Red lines = restricted; blue lines = free.",
        "Thick green lines = permanent; thin green lines = HX-activated.",
    ],
    # law-75: Mandatory plaque info on hang-glider?
    "law-75": [
        "Pilot's name, SHV number, insurance company, and policy number.",
        "Wing class (EN A/B/C/D), test pilot's signature, and date of last inspection.",
        "Manufacturer's name, country of origin, and the BAZL registration code.",
    ],
    # law-76: LS-P?
    "law-76": [
        "Pilot's license restriction zone — areas off-limits to license A holders.",
        "Public-information zone — daily NOTAM updates are mandatory before entry.",
        "Permanent landing zone — designated overnight stop for tandem operations.",
    ],
    # law-77: Publication for military flight-service hours?
    "law-77": [
        "The Glider Map (GLDK / Segelflugkarte).",
        "The AIP (Aeronautical Information Publication).",
        "The annual SHV airspace bulletin.",
    ],
    # law-78: LS-R for gliders with "MA" - status March-Oct?
    "law-78": [
        "Active only during MIL-ON; deactivated automatically with MIL-OFF.",
        "Permanently active 24/7 during the season.",
        "Inactive during MIL-OFF; activates automatically with MIL-ON.",
    ],
    # law-79: Who may fly in CH without Swiss license?
    "law-79": [
        "Any tourist with an EN-A glider and a 1-million liability insurance.",
        "Only SHV members holding the international IPPI Card stage 4.",
        "Swiss residents who have completed at least 50 logged flights.",
    ],
    # law-80: Content of exams for official licenses set by?
    "law-80": [
        "…the cantonal aviation authority of the pilot's residence.",
        "…the European Aviation Safety Agency (EASA) regulations.",
        "…the SHV alone, without federal approval.",
    ],
    # law-81: An AWY...
    "law-81": [
        "…connects an airport to its associated heliport, with no lateral limits.",
        "…is a temporary corridor activated only during MIL-ON hours.",
        "…is reserved exclusively for VFR traffic with continuous radio contact.",
    ],
    # law-82: Publication for framework of military flight-service hours?
    "law-82": [
        "The DABS lists the standard times; the GLDK shows daily activation.",
        "The AIP lists both the standard times and the daily activation status.",
        "The NOTAM bulletin is the only authoritative source for military timings.",
    ],
    # law-83: 5-point pre-launch check?
    "law-83": [
        "1. Wind  •  2. Weather  •  3. Wing  •  4. Witnesses  •  5. Way out.",
        "1. Glider class  •  2. Pilot certificate  •  3. Insurance  •  4. Reserve  •  5. Altimeter.",
        "1. Pre-flight weather briefing  •  2. NOTAM check  •  3. DABS check  •  4. Equipment  •  5. Passenger briefing.",
    ],
}
