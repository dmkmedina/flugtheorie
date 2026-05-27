"""Distractors for Meteorology cards (met-1 ... met-78)."""

MET = {
    # met-1: Reading wind strength from a pressure map (isobar spacing)?
    "met-1": [
        "Reference scale: Switzerland on the map.\n• Isobar cells smaller than Switzerland → weak wind.\n• Larger than Switzerland → strong wind.\n• Roughly the same size → calm.",
        "The colour of the isobars indicates wind strength: red = strong, blue = weak, green = moderate.",
        "Wind strength is read from the surface wind arrows; isobar spacing only shows pressure tendency, not wind.",
    ],
    # met-2: Wind directions in degrees?
    "met-2": [
        "North = 90°  •  Bise (E) = 0°  •  South = 270°  •  West = 180°.",
        "North = 0°  •  Bise (E) = 180°  •  South = 90°  •  West = 270°.",
        "North = 180°  •  Bise (E) = 270°  •  South = 360°  •  West = 90°.",
    ],
    # met-3: Convert knots to km/h quickly? E.g. 10 kt.
    "met-3": [
        "Halve and add 10%. Example: 10 kt ÷ 2 = 5, +10% = 5.5 km/h.",
        "Multiply by 3. Example: 10 kt × 3 = 30 km/h.",
        "Subtract 10% then double. Example: 10 kt − 10% = 9, ×2 = 18 km/h.",
    ],
    # met-4: Venturi effect?
    "met-4": [
        "Wind slows down where its path narrows — e.g. in a narrowing valley.",
        "Wind direction reverses around obstacles due to pressure equalisation.",
        "Wind temperature rises sharply when forced through narrow passes.",
    ],
    # met-5: Warm front — how long and how fast?
    "met-5": [
        "Warm front moves at ~40–70 km/h. Takes 6–12 h to cross Switzerland. Arrives at the surface first. On charts: triangles.",
        "Warm front moves at ~5–10 km/h. Takes 36–48 h to cross Switzerland. Arrives at the surface first. On charts: solid line with no symbols.",
        "Warm front moves at ~25–35 km/h. Takes 24–48 h to cross Switzerland. Arrives at the surface first. On charts: alternating triangles and half-circles.",
    ],
    # met-6: What do you see 1 h before a warm front arrives?
    "met-6": [
        "Excellent visibility, deep blue sky, sudden temperature drop, high cloud base.",
        "Strong gusty wind from changing directions, scattered cumulus, lenticular clouds.",
        "Clear skies, calm wind, large temperature–dew-point spread, no clouds visible.",
    ],
    # met-7: Cold front — how long and how fast?
    "met-7": [
        "Cold front moves at ~15–25 km/h — less dangerous because slower than warm fronts. Takes 12–24 h to cross Switzerland. On charts: half-circles. Arrives aloft first.",
        "Cold front moves at ~80–120 km/h — extremely fast and arrives without warning. Crosses Switzerland in 2–4 h. On charts: solid line with no symbols.",
        "Cold front moves at ~5–10 km/h — slow but produces heavy precipitation. Takes 36–48 h to cross Switzerland. On charts: dashed line with arrows.",
    ],
    # met-8: Occlusion?
    "met-8": [
        "Occurs when a warm front catches up to a cold front. Always has cold-front character. On charts: dashed line with no symbols.",
        "Occurs at the meeting point of three air masses (cold, warm and tropical). On charts: a star symbol.",
        "Occurs when two cold fronts merge over the Alps. Produces no precipitation but very strong wind.",
    ],
    # met-9: Cloud overview — types and altitude levels?
    "met-9": [
        "2 altitude levels:\n1. High — Cumulonimbus, Lenticularis\n2. Low — Stratus, Altocumulus\n\n• Cirrus = puffy and fluffy.\n• Lenticularis = flat overcast layer.\n• 8/8 = ideal for thermal flying; 2/8 = unflyable.",
        "4 altitude levels: Cirro (highest), Alto (mid-high), Stratus (mid-low), Cumulo (lowest).\n• Cumulus = always associated with hail.\n• Lenticularis = sign of calm, stable air.\n• Cirrus = the lowest cloud type.",
        "3 altitude levels but grouped by colour:\n1. White — Cumulus, Cirrus\n2. Grey — Stratus, Altostratus\n3. Black — Nimbostratus, Cumulonimbus\n• Cumulus Congestus = ideal thermal marker.\n• Lenticularis = sign of weak winds aloft.",
    ],
    # met-10: Why does ground inversion form?
    "met-10": [
        "Due to solar heating of the ground during the day.",
        "Due to the passage of a cold front bringing warm air aloft.",
        "Due to strong winds mixing the lower atmosphere overnight.",
    ],
    # met-11: Inversion?
    "met-11": [
        "Cooler air above, warmer below — the normal stable daytime stratification.",
        "Temperature decreases uniformly with height (standard lapse rate).",
        "A vertical zone of mixed air where temperature varies randomly with height.",
    ],
    # met-12: Isothermal layer?
    "met-12": [
        "A layer in which temperature increases with height (warmer aloft).",
        "A layer in which pressure stays constant with height.",
        "A layer where humidity reaches 100% but no clouds form.",
    ],
    # met-13: Reverse thermal (Umkehrthermik)?
    "met-13": [
        "At midday, slopes facing the sun heat up rapidly and trigger massive cumulus development directly above the peak.",
        "Cool air from the valley rises along a heated slope during peak afternoon heating.",
        "Wind blowing downslope (katabatic) at night creates surface-level lift that paragliders can use to extend daytime flights.",
    ],
    # met-14: What does adiabatic mean?
    "met-14": [
        "An air mass exchanges heat freely with its surroundings as it rises or sinks.",
        "An air mass cools by mixing with cooler surrounding air at altitude.",
        "An air mass that maintains constant temperature regardless of pressure changes.",
    ],
    # met-15: Dry adiabatic lapse rate?
    "met-15": [
        "0.65 °C cooling per 100 m of ascent.",
        "0.6 °C cooling per 100 m of ascent.",
        "2 °C cooling per 100 m of ascent.",
    ],
    # met-16: Moist (wet) adiabatic lapse rate?
    "met-16": [
        "1 °C per 100 m (same as the dry adiabatic rate).",
        "0.3–0.5 °C per 100 m (always less than 0.5).",
        "1.2–1.5 °C per 100 m (faster than dry adiabatic because of condensation).",
    ],
    # met-17: Altitude of the tropopause?
    "met-17": [
        "Over us: about 5500 m. Globally up to 8000 m.",
        "Over us: about 18,000 m. Globally up to 25,000 m.",
        "Over us: about 3050 m. Globally up to 6000 m.",
    ],
    # met-18: What determines lapse rate of moist rising air?
    "met-18": [
        "The temperature of the surrounding atmosphere.",
        "The horizontal wind speed at cloud base.",
        "The barometric pressure at the launch site.",
    ],
    # met-19: When two winds meet head-on, it's…?
    "met-19": [
        "…mechanical turbulence.",
        "…orographic turbulence.",
        "…thermal turbulence.",
    ],
    # met-20: Turbulence caused by buildings?
    "met-20": [
        "…shear-induced turbulence.",
        "…thermal turbulence.",
        "…orographic or Föhn turbulence.",
    ],
    # met-21: Wave motion caused by terrain?
    "met-21": [
        "Mechanical turbulence.",
        "Shear-induced turbulence.",
        "Convective (thermal) turbulence.",
    ],
    # met-22: Decrease of air temperature with altitude (standard)?
    "met-22": [
        "About 1 °C per 100 m (dry adiabatic rate).",
        "About 0.3 °C per 100 m (very stable air).",
        "About 2 °C per 100 m (standard ICAO atmosphere).",
    ],
    # met-23: Isothermal layers and inversions are?
    "met-23": [
        "…layers that enhance thermal development and rising air.",
        "…wind-shear zones that cause mechanical turbulence.",
        "…cloud-forming layers where precipitation typically starts.",
    ],
    # met-24: Sunny at altitude with fog in valleys signals?
    "met-24": [
        "…strong instability in the lower troposphere.",
        "…the imminent arrival of a cold front from the west.",
        "…the formation of Föhn on the lee side of the Alps.",
    ],
    # met-25: Warm air mass in frontal formation is?
    "met-25": [
        "…lower than the adjacent air mass.",
        "…the same as the adjacent air mass.",
        "…more humid than the adjacent air mass, regardless of temperature.",
    ],
    # met-26: At same altitude AMSL, air is?
    "met-26": [
        "…denser when warm than when cold.",
        "…of equal density regardless of temperature.",
        "…less dense when humid than when dry.",
    ],
    # met-27: Stable stratification means for flying?
    "met-27": [
        "Strong thermals and excellent climb rates.",
        "Frequent cumulus formation and high cloud base.",
        "Risk of thunderstorms in the afternoon.",
    ],
    # met-28: What is an outflow?
    "met-28": [
        "A gentle upward current of warm air typical of fair-weather thermals.",
        "The horizontal divergence of air at cloud base, leading to weakening lift.",
        "A slow downward subsidence of stable high-pressure air over the Mittelland.",
    ],
    # met-29: When is the valley wind strongest?
    "met-29": [
        "Strongest in autumn — peak in October — especially in the Aare and Reuss valleys. Strongest at ridge height.",
        "Strongest in winter — peak in January — caused by Bise from the northeast.",
        "Strongest at night, when slopes cool and katabatic flow accelerates down the valley.",
    ],
    # met-30: 3 dangerous conditions for flying?
    "met-30": [
        "Bise, Bora, Mistral.",
        "Rain, snow, ice.",
        "Inversion, isothermal layer, blue thermals.",
    ],
    # met-31: What is needed for a Föhn wind?
    "met-31": [
        "A large temperature difference between day and night.",
        "A weak high over central Europe with no terrain effect.",
        "Strong solar heating and a moist surface layer.",
    ],
    # met-32: Signs: strong wind, humidity, mountains, at/behind peaks — wind warning?
    "met-32": [
        "Cumulus Congestus.",
        "Altostratus.",
        "Cirrus.",
    ],
    # met-33: Synoptic situation for Südföhn in Alpine valleys?
    "met-33": [
        "Switzerland is on the back side of a high-pressure ridge, with cold air advancing from the north.",
        "Switzerland is centred under a high-pressure system with no fronts in sight.",
        "An occlusion is crossing the Jura, with strong west winds aloft.",
    ],
    # met-34: Conditions for radiation fog?
    "met-34": [
        "Overcast sky, strong wind, large temperature–dew-point spread.",
        "Clear sky, strong wind, small temperature–dew-point spread.",
        "Cloudy sky, calm wind, large temperature–dew-point spread.",
    ],
    # met-35: Dew point in meteorology?
    "met-35": [
        "…the temperature at which the air becomes saturated and precipitation starts to fall.",
        "…the difference between actual and standard atmospheric pressure at a given altitude.",
        "…the altitude at which cumulus clouds begin to form on a thermal day.",
    ],
    # met-36: Wind in Ticino Alpine valleys when Azores high extends to central Europe?
    "met-36": [
        "Südföhn.",
        "Bise.",
        "Mistral.",
    ],
    # met-37: Favourable conditions for Nordföhn in Ticino?
    "met-37": [
        "Switzerland is centred under a high-pressure system; warm humid air is pushed from the southwest against the Alps.",
        "Switzerland is in the warm sector of a depression; a warm front is approaching the Jura.",
        "The Azores high extends towards central Europe, with no significant temperature gradient across the Alps.",
    ],
    # met-38: Valley wind with decreasing altitude?
    "met-38": [
        "…decreases (strongest at ridge height).",
        "…remains constant from valley floor to ridge top.",
        "…reverses direction below 500 m above the valley floor.",
    ],
    # met-39: Temperature of an air parcel rising from ground without forming a cloud?
    "met-39": [
        "It cools by 0.65 °C per 100 m (standard atmospheric lapse rate).",
        "It warms by 1 °C per 100 m due to compression as it rises.",
        "It cools by 0.6 °C per 100 m (moist adiabatic rate) because hidden humidity slows the cooling.",
    ],
    # met-40: Surface winds over flat terrain blow?
    "met-40": [
        "…perpendicular to the isobars, from low pressure toward high pressure.",
        "…parallel to the isobars, from low pressure toward high pressure.",
        "…in random directions, dictated mainly by surface friction and local heating.",
    ],
    # met-41: Altocumulus castellanus 2 h after sunrise signal?
    "met-41": [
        "…stable stratification at cloud level — no afternoon convection expected.",
        "…the arrival of a warm front within the next 6 hours.",
        "…strong sinking air aloft; thermals will be capped at low altitude.",
    ],
    # met-42: In a high-pressure region in our hemisphere?
    "met-42": [
        "…air masses rotate counter-clockwise around its centre and rise (convection) over a wide area.",
        "…air masses rotate clockwise around its centre and rise (convection) over a wide area.",
        "…air masses rotate counter-clockwise around its centre and sink (subsidence) over a wide area.",
    ],
    # met-43: Phase change that releases heat?
    "met-43": [
        "Transition from solid to liquid (melting).",
        "Transition from liquid to gas (evaporation).",
        "Transition from solid to gas (sublimation).",
    ],
    # met-44: Where is inversion typically found?
    "met-44": [
        "At the boundary between dry surface air and humid air aloft.",
        "Inside cumulonimbus clouds, near the freezing level.",
        "At the tropopause, between troposphere and stratosphere.",
    ],
    # met-45: Why does temperature of a rising air parcel change?
    "met-45": [
        "Because solar radiation directly warms the air as it gains altitude.",
        "Because surrounding cold air aloft cools the parcel by mixing.",
        "Because air temperature is fixed at each altitude by the standard atmosphere.",
    ],
    # met-46: Clouds form when?
    "met-46": [
        "…air sinks and warms above its dew point.",
        "…humidity drops below 50% and the air becomes saturated.",
        "…surface heating causes water vapour to evaporate from the ground.",
    ],
    # met-47: Does time of day affect frontal thunderstorms?
    "met-47": [
        "Yes — frontal thunderstorms always form in the afternoon.",
        "Yes — frontal thunderstorms only form between sunrise and sunset.",
        "Yes — frontal thunderstorms are most likely between 14:00 and 18:00.",
    ],
    # met-48: Time of day in Alpine valleys when mainly thermal turbulence?
    "met-48": [
        "Around 15:00.",
        "Around 17:00.",
        "Around 08:00.",
    ],
    # met-49: What dissolves a ground inversion?
    "met-49": [
        "The passage of a warm front during the day.",
        "Strong wind aloft that mixes the air over many hours.",
        "Sunset, when the ground stops radiating heat.",
    ],
    # met-50: Thermal turbulence?
    "met-50": [
        "When two opposing winds collide at altitude.",
        "When air flows over a ridge and creates standing waves.",
        "When buildings deflect surface wind into vortices.",
    ],
    # met-51: Balloon of 5 dm³ rising sea level to 5500 m?
    "met-51": [
        "≈ 5 dm³ — volume stays constant because air pressure inside equalises.",
        "≈ 2.5 dm³ — volume halves because density increases with altitude.",
        "≈ 20 dm³ — volume quadruples because pressure drops to one quarter.",
    ],
    # met-52: Atmospheric pressure at sea level not always the same?
    "met-52": [
        "…the rotation of the Earth causes pressure to vary periodically with latitude.",
        "…humidity changes alter the molecular weight of air, raising or lowering pressure.",
        "…the gravitational pull of the moon causes daily tidal variations in atmospheric pressure.",
    ],
    # met-53: Required for a Föhn in Alpine valleys?
    "met-53": [
        "A weak pressure gradient combined with strong solar heating in the valleys.",
        "A stable high over central Europe with no fronts within 500 km.",
        "Strong surface winds across the Mittelland combined with cool air aloft.",
    ],
    # met-54: Lenticularis clouds form when?
    "met-54": [
        "…humid air at the surface heats and rises faster than the surrounding mass.",
        "…a cold front lifts warm humid air over a stable boundary.",
        "…air at altitude becomes saturated under calm windless conditions.",
    ],
    # met-55: Why does moist rising air cool more slowly than dry?
    "met-55": [
        "Because moist air is heavier and resists altitude gain, slowing the cooling.",
        "Because evaporation in rising air absorbs heat from the surrounding atmosphere.",
        "Because humidity reduces the molecular speed of air, slowing temperature change.",
    ],
    # met-56: Distant sign of Cumulus Congestus / CB producing precipitation?
    "met-56": [
        "A flat, anvil-shaped top spreading horizontally just below the tropopause.",
        "Sharp, well-defined cauliflower tops with strong vertical development.",
        "A ring of lenticular clouds forming around the base of the cumulus.",
    ],
    # met-57: Sunny at altitude AND in valleys signals?
    "met-57": [
        "…an unstable atmosphere likely to produce thunderstorms by afternoon.",
        "…the arrival of Südföhn within the next few hours.",
        "…the imminent formation of low cloud and reduced visibility.",
    ],
    # met-58: Air pressure is a result of?
    "met-58": [
        "…air density.",
        "…temperature.",
        "…humidity.",
    ],
    # met-59: What is an "air mass" in meteorology?
    "met-59": [
        "A vertical column of air whose pressure decreases with altitude.",
        "A region of air bounded by isobars on a synoptic chart.",
        "A volume of air whose temperature alone is uniform throughout.",
    ],
    # met-60: A valley wind develops because air?
    "met-60": [
        "…cools faster in the mountains than over the flat lowlands during the day.",
        "…flows downslope at night due to katabatic cooling.",
        "…is accelerated by Venturi effect along the valley walls.",
    ],
    # met-61: Blue thermals occur when?
    "met-61": [
        "…the temperature–dew-point spread is so small that cumulus forms at very low altitude.",
        "…strong wind shear at altitude prevents thermals from reaching the dew point.",
        "…cloud cover blocks solar heating, so thermals are weak and invisible.",
    ],
    # met-62: Peak turbulence time in summer Alpine valleys?
    "met-62": [
        "11:00.",
        "09:00.",
        "19:00.",
    ],
    # met-63: Best conditions for thermals over land?
    "met-63": [
        "Strong wind and high humidity.",
        "Wet ground and overcast sky.",
        "Calm wind and snow-covered surface.",
    ],
    # met-64: The cumulus cloud base is?
    "met-64": [
        "…the upper edge of the cloud, where the wind-shear layer caps thermal development.",
        "…the altitude at which condensed water droplets begin to freeze.",
        "…the layer of maximum updraft strength inside the cloud.",
    ],
    # met-65: Signs of Südföhn on north side of Alps?
    "met-65": [
        "• Stratus covering the entire sky.\n• High, thin cirrus only.\n• Calm wind near the ground.\n• Bise blowing at the launch site.",
        "• Distant mountains fully visible against a deep blue sky.\n• No lenticulars, only fair-weather cumulus.\n• Steady west wind near the surface.\n• A freshening northeast wind at the launch site.",
        "• Overcast with low cloud base.\n• Continuous light precipitation.\n• Cold, gusty north wind.\n• Falling temperatures throughout the day.",
    ],
    # met-66: Lapse rate of an isothermal layer?
    "met-66": [
        "1 °C per 100 m (dry adiabatic rate).",
        "0.65 °C per 100 m (standard atmosphere).",
        "0.6 °C per 100 m (moist adiabatic rate).",
    ],
    # met-67: Weather situation favouring high-reaching thermals over the Alps?
    "met-67": [
        "A strong high with its centre over the Atlantic and a cold front over Switzerland.",
        "A deep low over the Mediterranean with strong south wind aloft.",
        "A stationary occlusion over the Alps with humid south wind.",
    ],
    # met-68: Phase change that consumes heat?
    "met-68": [
        "Gas → liquid (condensation).",
        "Liquid → solid (freezing).",
        "Gas → solid (deposition).",
    ],
    # met-69: How does air 100 m AGL warm during day?
    "met-69": [
        "Directly by solar radiation, which heats the air as it passes through the atmosphere.",
        "By the passage of warm fronts that move heat horizontally across Switzerland.",
        "By compression — air sinking from altitude warms as it reaches lower levels.",
    ],
    # met-70: Month when thermals in Alps reach highest?
    "met-70": [
        "June.",
        "May.",
        "October.",
    ],
    # met-71: Phase change that releases heat?
    "met-71": [
        "Liquid → gas (evaporation).",
        "Solid → gas (sublimation).",
        "Solid → liquid (melting).",
    ],
    # met-72: Phase change that consumes heat?
    "met-72": [
        "Gas → liquid (condensation).",
        "Liquid → solid (freezing).",
        "Gas → solid (deposition).",
    ],
    # met-73: Warm front =
    "met-73": [
        "Precipitation BEGINS with the passage of the front.",
        "Precipitation continues during and after the front passes.",
        "No precipitation associated with the front itself; only fog forms behind it.",
    ],
    # met-74: Cold front =
    "met-74": [
        "Precipitation ENDS with the passage of the front.",
        "Precipitation occurs only ahead of the front, never during or after.",
        "No precipitation at all; cold fronts produce only wind and temperature drop.",
    ],
    # met-75: Cold air =
    "met-75": [
        "Rises (because lighter) → lower pressure.",
        "Stays at the same altitude → no pressure effect.",
        "Sinks to the ground (because heavier) → lower pressure.",
    ],
    # met-76: Warm air =
    "met-76": [
        "Sinks to the ground (because heavier) → higher pressure.",
        "Stays at the same altitude → no pressure effect.",
        "Rises (because lighter) → higher pressure.",
    ],
    # met-77: Luv =
    "met-77": [
        "Leeward (sheltered side, downwind of an obstacle).",
        "Crosswind side of a ridge or mountain.",
        "Downslope direction during evening cooling.",
    ],
    # met-78: Lee =
    "met-78": [
        "Windward (facing into the wind).",
        "Upslope direction during morning heating.",
        "Crosswind side of a ridge or mountain.",
    ],
}
