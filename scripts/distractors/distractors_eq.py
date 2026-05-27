"""Distractors for Equipment cards (eq-1 ... eq-49)."""

EQ = {
    # eq-1: Basics about different paraglider classes
    "eq-1": [
        "• A — beginner: high aspect ratio for best glide. • B — competition wing. • C/D — school gliders, low performance. • Speedflyer: classic XC tool used in summer thermals.",
        "All paragliders are now grouped into 2 classes only: A (recreational) and B (advanced). Speedflyers fall under class C and require a separate licence.",
        "Wing classes are based purely on aspect ratio: A < 5, B = 5–6, C = 6–7, D > 7. Performance and safety scale linearly with class letter.",
    ],
    # eq-2: How are paragliders tested?
    "eq-2": [
        "EN testing consists of a wind-tunnel measurement at sea level only — no flight tests are required for certification.",
        "BAZL conducts an annual structural inspection of every certified wing model; pilots receive a renewed sticker.",
        "Manufacturer self-certification — a paper report covering material specs and pilot weight range suffices; no test flights are required.",
    ],
    # eq-3: What material is a paraglider made of?
    "eq-3": [
        "• Canopy: polyester woven with kevlar threads.\n• Cloth weight ~150 g/m².\n• Carabiners: brass — last for the life of the wing.\n• Lower sail more robust than upper sail (load distribution).",
        "• Canopy: dyneema sheeting with PU coating.\n• Cloth weight ~10 g/m².\n• Carabiners: titanium — never replaced.\n• Both sails identical in weight and weave.",
        "• Canopy: aramid fibre with silicone coating.\n• Cloth weight ~80 g/m² (like A4 paper).\n• Carabiners: aluminium only — replaced every year.\n• Upper sail thinner than the lower sail.",
    ],
    # eq-4: Lines material?
    "eq-4": [
        "Outer sheath is dyneema; the core is polyester. Lines never stretch or shrink, regardless of UV exposure.",
        "Lines are made entirely of stainless-steel braid — UV-proof and dimensionally stable but heavy.",
        "Outer sheath of nylon; core of carbon fibre. Carbon is brittle and must be inspected before every flight.",
    ],
    # eq-5: Reserve parachute info?
    "eq-5": [
        "Reserves are made of woven aramid — no stretch allowed.\n• Square = oldest design.\n• Round = current standard, very stable.\n• Triangular = first-time-user option.\n\nAfter deployment you descend at ~2 m/s — equivalent to a soft skydive landing.\nLanding: try to land on the back protector to absorb shock.",
        "Reserves are made of polyester, woven thicker than canopy fabric for durability.\n• Cruciform = beginner-only.\n• Round = no longer used.\n• Triangular = standard.\n\nDescent rate ~8 m/s. Always land flat on your back.",
        "Reserves are made of silicone-coated nylon; sink rate after deployment is ~3 m/s. Land on the buttocks using parachute-landing technique. Square reserves are unstable and not certified in Switzerland.",
    ],
    # eq-6: Harness information?
    "eq-6": [
        "• Airbag harness: protector inflates only during launch — no protection in flight.\n• Foam protector: lighter than airbag.\n• Reversible harness: not allowed in solo flight.\n• Reclined harness: less aerodynamic but most comfortable.\n• Hike & Fly harness: includes a full foam back protector.",
        "All modern harnesses use only foam protectors; airbag harnesses are no longer certified in Switzerland. Reclined harnesses give the best view of the ground directly below.",
        "• Airbag harness: requires manual inflation before take-off.\n• Foam protector: standard for tandem flying only.\n• Reversible harness: includes a built-in reserve container.\n• Reclined harness: forbidden for cross-country flying.\n• Hike & Fly harness: integrated speedbar replaces brake handles.",
    ],
    # eq-7: Line stretch, storage, porosity, ageing
    "eq-7": [
        "• Line stretch is not measurable in practice — replace lines every 5 years regardless.\n• G-forces have no effect on wing ageing.\n• UV exposure only matters on the ground; in flight the wing is too high for UV damage.\n• Lines stretch when wet — pack the wing damp to preserve their length.\n• Porous fabric improves wing performance by reducing internal pressure.",
        "• Line lengths are maintained by the manufacturer; no field measurement is necessary.\n• G-forces during normal flight extend the wing's life by stress-relieving the seams.\n• UV exposure helps the coating bond — sun exposure is beneficial.\n• A wet wing should be folded tight and stored in a warm car to dry.\n• The coating prevents lines from chafing the cloth.",
        "• Line stretch is normal and should be left untreated.\n• Acro flying does not age the wing.\n• UV is only a concern below 1000 m AMSL.\n• Wet wings should be machine-dried.\n• Porosity is only an issue for tandem wings.",
    ],
    # eq-8: Leading edge & trailing edge?
    "eq-8": [
        "Leading edge = top of the wing (suction side). Trailing edge = bottom (pressure side).",
        "Leading edge = rear, where airflow enters. Trailing edge = front, where lift is generated.",
        "Leading edge = where the A-risers attach. Trailing edge = where the D-risers attach.",
    ],
    # eq-9: Consequence of shortening the D-lines?
    "eq-9": [
        "Angle of attack decreases; wing flies faster and is less prone to parachutal stall.",
        "Wing area increases; brake travel becomes shorter.",
        "Profile shape stays the same; only the riser length and trim speed change.",
    ],
    # eq-10: Altimeter gets info from?
    "eq-10": [
        "…GPS satellite signal.",
        "…air temperature and humidity sensors.",
        "…cellular network triangulation.",
    ],
    # eq-11: High attachment points lets turbulence be?
    "eq-11": [
        "…felt more, and they make weight-shift steering more effective.",
        "…felt less, and they improve weight-shift response.",
        "…felt more, but they make launch acceleration easier.",
    ],
    # eq-12: Sewing loops at line ends?
    "eq-12": [
        "…can cause up to 80% loss of strength, especially with dyneema lines.",
        "…has no effect on line strength; sewn loops are the manufacturer's preferred method.",
        "…strengthens the line by up to 20%, especially in polyester sheathed lines.",
    ],
    # eq-13: Advantage of looped vs sewn lines?
    "eq-13": [
        "Stronger than sewn loops, with no loss of breaking strength.",
        "Lower drag in flight because the loop is smaller.",
        "Better UV resistance because the splice protects the core.",
    ],
    # eq-14: Signs of fabric ageing?
    "eq-14": [
        "• Porosity decreases.\n• Airflow stays attached even at low speeds.\n• Wing becomes more prone to frontal collapse.",
        "• Wing becomes stiffer.\n• Brake travel becomes longer.\n• Wing becomes more prone to spin (Vrille).",
        "• Cloth weight increases over time.\n• Lines stretch unevenly.\n• Wing develops a permanent left-turn tendency.",
    ],
    # eq-15: Coating quality suffers when?
    "eq-15": [
        "…you pack the wing on cool, damp grass.",
        "…you store the wing in a dark, dry cellar.",
        "…you fly the wing in air below 0 °C.",
    ],
    # eq-16: Overall reserve design requirements?
    "eq-16": [
        "Maximum elasticity, with minimal strength to absorb shock loads.",
        "Maximum strength only — elasticity is undesirable as it prolongs descent.",
        "Low weight and high porosity to ensure rapid deployment.",
    ],
    # eq-17: Reserve's main attachment near body's CoG?
    "eq-17": [
        "…you can land sitting down, leaning back in the harness.",
        "…you should brace against the harness and land on the back protector.",
        "…landing posture does not matter — the reserve absorbs all impact.",
    ],
    # eq-18: Heavily diagonal cross-bracing in harness?
    "eq-18": [
        "…felt more, and they improve weight-shift steering precision.",
        "…felt less, and they enhance weight-shift response.",
        "…felt more, but they help during launch acceleration.",
    ],
    # eq-19: Purpose of diagonal V-ribs / cell walls?
    "eq-19": [
        "They increase cloth tension to make the wing more rigid in turbulence.",
        "They prevent collapse by maintaining internal air pressure independently of cell ports.",
        "They reduce wing weight by replacing some of the lower-surface cloth.",
    ],
    # eq-20: Loading a material to max tensile strength?
    "eq-20": [
        "…it returns elastically to its original dimensions and strength once unloaded.",
        "…it becomes stronger by work-hardening, with no dimensional change.",
        "…it weakens proportionally to the duration of loading but recovers full strength after rest.",
    ],
    # eq-21: Trim tabs/trimmers allow?
    "eq-21": [
        "…fine-tuning of brake-line length without changing flight behaviour.",
        "…independent steering of left and right wing halves for asymmetric trimming.",
        "…adjustment of the speedbar travel range without touching the risers.",
    ],
    # eq-22: Trim tabs/trimmers vary length of?
    "eq-22": [
        "…front (A) riser.",
        "…middle (B or C) riser.",
        "…brake line only.",
    ],
    # eq-23: Brake/steering-line length should be set so?
    "eq-23": [
        "…they pull the trailing edge down by ~10 cm in neutral position.",
        "…the brake travel is no more than 30 cm before the stall point.",
        "…the wing flies at trim speed with both brakes pulled half-down.",
    ],
    # eq-24: Cell-wall stress is greatest at?
    "eq-24": [
        "…the trailing edge near the brake-line attachment points.",
        "…the wingtips, where vortex forces are strongest.",
        "…the central cells of the wing, where vertical load is highest.",
    ],
    # eq-25: EN-standard type certification tells you about?
    "eq-25": [
        "…the long-term durability and ageing resistance of the wing.",
        "…the wing's suitability for tandem and acrobatic flying.",
        "…the maximum allowed pilot weight and the minimum cross-country glide ratio.",
    ],
    # eq-26: Coating the fabric?
    "eq-26": [
        "…increases its elasticity, making the wing more dynamic.",
        "…has no effect on cloth properties — coating is purely cosmetic.",
        "…reduces UV resistance, which is why uncoated cloth lasts longer.",
    ],
    # eq-27: Who sets the norms for SHV type certification?
    "eq-27": [
        "BAZL (Federal Office of Civil Aviation).",
        "EASA (European Aviation Safety Agency).",
        "DHV (German Hang-Gliding Federation).",
    ],
    # eq-28: Who specifies inspection intervals?
    "eq-28": [
        "BAZL.",
        "The SHV.",
        "The flight school that sold the wing.",
    ],
    # eq-29: Variometer tells the pilot?
    "eq-29": [
        "…horizontal speed relative to the ground.",
        "…ambient air temperature.",
        "…atmospheric pressure in hPa.",
    ],
    # eq-30: Best helmet against head injuries?
    "eq-30": [
        "Open-face helmet.",
        "Half-shell (ski-style) helmet.",
        "Climbing helmet without ear protection.",
    ],
    # eq-31: Factors that prolong reserve deployment?
    "eq-31": [
        "Short repack intervals, low humidity, an overly short bridle.",
        "Heavy pilot weight, low altitude, low air temperature.",
        "Frequent flying, low wing loading, square-design reserves.",
    ],
    # eq-32: Crossports in cell walls?
    "eq-32": [
        "…allow air to escape from the wing during the descent, reducing internal pressure.",
        "…serve as drainage holes to let water out after a wet landing.",
        "…separate the cells completely to prevent collapse propagation across the wing.",
    ],
    # eq-33: Manoeuvre where cell walls suffer downward loads?
    "eq-33": [
        "Wingover.",
        "Full stall.",
        "Spiral dive.",
    ],
    # eq-34: Risers least loaded in stable straight flight?
    "eq-34": [
        "The A-risers.",
        "The B-risers.",
        "The C-risers.",
    ],
    # eq-35: High over central Europe weakening; morning-calibrated altimeter in PM?
    "eq-35": [
        "…too low.",
        "…unchanged — the altimeter remains accurate all day.",
        "…oscillating around the true value with no consistent bias.",
    ],
    # eq-36: Trimmers released in fast flight?
    "eq-36": [
        "…so the angle of attack increases and the trailing edge bends downward.",
        "…so the wing area increases and the polar curve shifts to lower speeds.",
        "…so the speedbar becomes inactive and brake travel is reduced.",
    ],
    # eq-37: Reserves made of?
    "eq-37": [
        "Polyester.",
        "Aramid (Kevlar).",
        "Dyneema.",
    ],
    # eq-38: Purpose of cell walls and inter-cell walls?
    "eq-38": [
        "To increase the wing's overall weight for better penetration in turbulence.",
        "To improve airflow over the upper surface by channelling air between cells.",
        "To separate cells fully so a collapse in one does not propagate to the next.",
    ],
    # eq-39: How to fit loops to unsheathed aramid lines without weakening?
    "eq-39": [
        "Sewing with reinforced nylon thread.",
        "Heat-shrink tubing over the loop.",
        "Knotting using a double figure-eight.",
    ],
    # eq-40: Paraglider fabrics coated because?
    "eq-40": [
        "…it increases porosity and elasticity for better flight characteristics.",
        "…it adds colour and reduces weight.",
        "…it improves abrasion resistance against the lines.",
    ],
    # eq-41: Releasing trimmers in stable straight flight?
    "eq-41": [
        "…decreases the tendency to collapse, and brake travel becomes shorter.",
        "…has no effect on collapse risk; only trim speed changes.",
        "…increases speed and improves glide ratio without any safety penalty.",
    ],
    # eq-42: Principle for reserve-handle placement?
    "eq-42": [
        "The handle must be placed on the back of the harness, out of reach during normal flight.",
        "The handle should be hidden inside a zipped pocket to prevent accidental deployment.",
        "The handle must be positioned where it cannot be reached without releasing the brakes.",
    ],
    # eq-43: Reducing distance between two harness attachment points?
    "eq-43": [
        "…felt more, but reduces the risk of twisting.",
        "…felt less, and reduces the risk of twisting.",
        "…felt more, and increases the risk of twisting.",
    ],
    # eq-44: Anemometer measures?
    "eq-44": [
        "…vertical speed (climb/sink rate).",
        "…speed relative to the ground.",
        "…atmospheric pressure.",
    ],
    # eq-45: Typical wing loading for modern intermediate paraglider?
    "eq-45": [
        "Too low: 1 kg/m²  •  Normal: 2 kg/m²  •  Upper limit: 3 kg/m².",
        "Too low: 4 kg/m²  •  Normal: 6 kg/m²  •  Upper limit: 8 kg/m².",
        "Too low: 0.5 kg/m²  •  Normal: 1.5 kg/m²  •  Upper limit: 2.5 kg/m².",
    ],
    # eq-46: Effect of shortening / lengthening A-lines?
    "eq-46": [
        "A-lines SHORTENED: larger angle of attack, slower flight, harder launch, MORE prone to parachutal stall.\nA-lines LENGTHENED: smaller angle of attack, faster, easier launch, MORE prone to frontal collapse.",
        "A-lines SHORTENED: no change in angle of attack — only trim speed shifts.\nA-lines LENGTHENED: wing area effectively increases; profile unchanged.",
        "A-lines SHORTENED: profile becomes more cambered, increasing lift but reducing speed.\nA-lines LENGTHENED: profile flattens, increasing top speed and reducing stall margin.",
    ],
    # eq-47: Effect of shortening / lengthening D-lines?
    "eq-47": [
        "D-lines SHORTENED: easier launch, smaller angle of attack, faster flight, MORE prone to frontal collapse.\nD-lines LENGTHENED: harder launch, larger angle of attack, slower, MORE prone to parachutal stall.",
        "D-lines SHORTENED: profile flattens, increasing speed and lowering stall margin.\nD-lines LENGTHENED: profile cambers, increasing lift and slowing flight without other side effects.",
        "D-lines SHORTENED: no change in angle of attack; only riser tension shifts.\nD-lines LENGTHENED: wing area increases; flight behaviour unchanged.",
    ],
    # eq-48: D-lines sag with moderate brake — meaning?
    "eq-48": [
        "The wing has lost cell pressure and is about to collapse from behind.",
        "The D-risers have stretched permanently and must be replaced before next flight.",
        "Always abnormal — return to land and inspect the wing.",
    ],
    # eq-49: Shortening B-lines on a school wing?
    "eq-49": [
        "Angle of attack increases. Wing flies slower and is harder to launch.",
        "Angle of attack decreases. Wing flies faster and is more prone to frontal collapse.",
        "Both profile and angle of attack are unchanged; only riser balance shifts.",
    ],
}
