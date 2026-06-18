#!/usr/bin/env python3
"""Author the paragliding-theory podcast scripts -> data/podcasts.json.

Why a Python authoring file instead of hand-written JSON: the scripts are long
two-host dialogues full of apostrophes and quotes, which are painful and
error-prone to escape by hand in JSON. Here the prose lives in readable
triple-quoted strings and we let json.dumps handle all escaping.

Pipeline:
  scripts/author_podcasts.py  ->  data/podcasts.json        (transcript + metadata; THIS file)
  scripts/build_podcasts.py   ->  assets/podcast/<id>.m4a   (real audio, needs a cloud-TTS key)
                              ->  data/podcast_timing.json   (per-segment start times + duration)
  build.py                    inlines podcasts.json (+ timing if present) as window.PODCASTS

Each episode maps to one Study-Guide topic (data/guide.json parts). Episode 1
(Aerodynamics) is fully scripted as the template; the rest carry real metadata
and an outline and are filled in once the format is approved.

Speakers:  a = Maya  (instructor — calm, precise, paints pictures)
           b = Theo  (curious student — asks what a learner would ask)

Audio-first rule: never say "as you can see"; describe every diagram out loud.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HOSTS = {
    "a": {"name": "Maya", "role": "instructor", "openai_voice": "shimmer", "elevenlabs_voice": "Rachel"},
    "b": {"name": "Theo", "role": "learner", "openai_voice": "onyx", "elevenlabs_voice": "Adam"},
}

# --- Episode 1 — Aerodynamics ------------------------------------------------
# Sourced from data/guide.json part1 (12 chapters). Spoken-friendly: symbols are
# written out ("the square of the speed", "ten degrees", "two G") so TTS reads
# them correctly and the transcript stays readable.
AERO = [
    ("b", "Okay Maya, I'll be honest. When someone says a paraglider just flies, my brain kind of accepts it and moves on. But the exam wants me to actually understand the forces. So where do we even start?"),
    ("a", "We start with the most boring-sounding word in aerodynamics, which is secretly the key to everything. Vectors."),
    ("b", "Vectors. Great. Sounds like homework."),
    ("a", "Stay with me, it's simpler than it sounds. A vector is just an arrow. It has three things: a length, which tells you how big the force is; a direction, which way the arrow points; and an origin, the point where it pushes. That's the whole idea."),
    ("b", "So when you draw a force as an arrow, a longer arrow means a bigger force."),
    ("a", "Exactly. If one centimetre of arrow means ten kilograms, then a three-centimetre arrow is thirty kilograms of force. And here's the rule examiners love: when two forces act on the same point, you can't just add the numbers. You have to add the arrows, tip to tail, because direction matters."),
    ("b", "Give me the picture."),
    ("a", "Picture two people pushing a shopping trolley. If they both push the same way, the pushes add up, full speed ahead. If they push directly against each other with equal strength, the trolley doesn't move at all. Same length arrows, opposite directions, they cancel."),
    ("b", "And if they push at an angle to each other?"),
    ("a", "Then the trolley rolls off in a compromise direction, somewhere between the two. That combined arrow is called the resultant. Hold onto that word, because the entire flight of a paraglider is just a handful of arrows adding up to a resultant."),
    ("b", "One catch I'd guess: you can't add a speed arrow to a force arrow."),
    ("a", "Correct, and that's a classic trick question. Only add vectors of the same type. Forces with forces, speeds with speeds. Never mix the two."),

    ("b", "Alright, arrows. So what's the first real force acting on us up there?"),
    ("a", "Drag. Stick your hand out of a moving car window. That push backwards on your hand, that's drag. It always points the same way the air is flowing."),
    ("b", "And what decides how strong it is?"),
    ("a", "Four things, and only four. One: how much surface you stick into the wind. Two: the wind speed. Three: the air density, how thick the air is. And four: the shape of the object."),
    ("b", "Let me guess what is not on the list, because that feels like exam bait."),
    ("a", "It absolutely is. Weight is not on the list. Temperature, humidity, the material it's made of, none of them matter for drag. If a question throws those at you, ignore them."),
    ("b", "Okay, surface area first. If I double the area facing the wind?"),
    ("a", "Drag doubles. It's a straight-line relationship. Triple the area, triple the drag. Halve it, halve the drag. Same story with air density: double the density, double the drag."),
    ("b", "And wind speed? I have a feeling speed isn't so polite."),
    ("a", "Speed is the dangerous one. Drag grows with the square of the speed. Double your speed and drag doesn't double, it quadruples. Triple the speed, and drag is nine times bigger."),
    ("b", "Nine times. So a gust that's three times stronger hits like nine times the force."),
    ("a", "That single fact, drag goes with the square of speed, explains why flying fast in rough air is so much more violent. Burn it in."),
    ("b", "You mentioned air density changes with height. Do we have to memorise that?"),
    ("a", "There's a lovely memory trick. At eleven hundred, twenty-two hundred, thirty-three hundred and forty-four hundred metres, the density drops to ninety, eighty, seventy and sixty percent of sea level. Think of it in tens: ten and ninety, twenty and eighty, thirty and seventy, forty and sixty. Each pair adds up to a hundred."),
    ("b", "Neat. And those are the numbers they'll ask for."),
    ("a", "They are. And keep two other halving heights separate in your mind: air pressure halves at around five thousand five hundred metres, but air density halves a bit higher, around six thousand six hundred metres. Examiners love to swap those two."),
    ("b", "Pressure halves at fifty-five hundred, density at sixty-six hundred. Got it."),
    ("a", "And the fourth factor, shape, is captured by a number called the drag coefficient. A flat plate is about one. A curved, cupped shape facing the wind is worse, about one point three. A smooth teardrop is wonderfully low, under a tenth."),

    ("b", "So far drag just pushes us backwards. When does flying actually happen?"),
    ("a", "The moment you tilt a flat, stretched shape, a wing, into the wind at a slight angle. Now you get a second force, at right angles to the wind, called lift."),
    ("b", "Right angles to the wind, not straight up?"),
    ("a", "Important distinction. Lift is perpendicular to the airflow, pointing toward the upper surface, not perpendicular to the ground. Hold that thought, it matters later."),
    ("b", "So why does a wing make lift? I've heard three different explanations and I never know which one is right."),
    ("a", "Here's the secret: they're all right, at the same time. Explanation one, Bernoulli: the curved top makes the air on top speed up, and faster air has lower pressure, so the wing gets sucked upward. Explanation two, Newton: the wing tilts the air downward, and every action has an equal and opposite reaction, so the air pushes the wing up. That's the hand-out-the-car-window feeling. Explanation three, circulation: the sharp trailing edge spins up a little vortex that sets up a circulation around the wing and helps deflect the wake downward."),
    ("b", "Three lenses, one phenomenon."),
    ("a", "And one vivid detail for the exam: the suction on top is about twice as strong as the push from below. At a typical angle, roughly two thirds of your lift comes from the top surface being sucked up, and only one third from below pushing."),
    ("b", "So the wing is mostly being pulled up from above, like a vacuum cleaner lying on its back."),
    ("a", "Lovely way to picture it. And most of that lift, about two thirds of it, is generated by the front third of the wing. The leading edge does the heavy lifting, literally."),

    ("b", "Let's talk about that angle you keep mentioning. The angle of attack."),
    ("a", "Picture the wing's cross-section, the profile. It's like a long teardrop: fat and rounded at the front, tapering to a sharp tail. Now draw an imaginary line from the leading edge straight back to the trailing edge. That line is the chord. The angle of attack is the angle between that chord and the oncoming air."),
    ("b", "Between the chord and the air, not the chord and the horizon?"),
    ("a", "That's the trap, and you just dodged it. Always measured against the oncoming air. And because a paraglider is always sinking gently through the air mass, that air actually meets you slightly from below."),
    ("b", "So what happens as I increase the angle of attack, as I pull the brakes and tilt the wing up?"),
    ("a", "Walk up a ladder with me. Around ten degrees, the wing is at its sweet spot, the most lift for the least drag. That's your best glide. Push to around twenty degrees and you make the most lift of all, but drag is piling up. That's minimum sink, where you fall the slowest. Then around twenty-five degrees, it all collapses. The air can't follow the top of the wing anymore, it detaches, and the wing stops flying. That's the stall."),
    ("b", "Ten, twenty, twenty-five. Best glide, minimum sink, stall."),
    ("a", "That ladder is one of the most useful things you'll ever memorise. Best glide near ten degrees, minimum sink near twenty, stall around twenty-five."),

    ("b", "You said fall the slowest and glide the farthest like they're different things. Aren't they the same?"),
    ("a", "They're genuinely different, and it's one of the deepest ideas in the sport. Imagine a graph. Speed across the bottom, sink rate going down the side. Plot every flying speed and you get a curve. We call it the polar curve."),
    ("b", "I can't see a graph. Paint it for me."),
    ("a", "Picture a hill-shaped curve that sags downward. The very top of the sag, the highest point of the curve, is where you're sinking the slowest. That's minimum sink, perfect for staying up in a thermal. But the farthest you can glide is not the top of the hill. It's the point where a straight line drawn from the origin just barely kisses the curve. That touch point is your best glide speed, and it's a bit faster than minimum sink."),
    ("b", "So to stay up, fly slow at minimum sink. To get somewhere, speed up a touch to best glide."),
    ("a", "Exactly. Slowest sink and farthest distance are two different speeds. That one distinction wins exam questions and saves real flights."),

    ("b", "Let's put a number on how far. That's glide ratio, right?"),
    ("a", "Glide ratio is just how far forward you travel for every unit you drop. A glide of eight means eight metres forward for every metre down. It's the same as lift divided by drag, and the same as horizontal speed divided by sink rate. Four ways to say one thing: efficiency."),
    ("b", "And modern wings are what, eight to ten?"),
    ("a", "School wings around eight or nine, hot ships a bit above ten. But here's the rule every instructor hammers home: never plan a real crossing on that number."),
    ("b", "Why not? It's the wing's glide ratio."),
    ("a", "Because it assumes perfectly still air, perfect speed, and zero mistakes. To decide whether you can clear a ridge or reach a field, plan with a conservative glide of five or six. If you arrive high, wonderful. If you needed the full ten to make it, you wouldn't have made it."),
    ("b", "Plan with five or six, not nine or ten. That's a keeper."),

    ("a", "And wind bends all of this. Your glide through the air never changes, but your glide over the ground does."),
    ("b", "Headwind eats my distance."),
    ("a", "It does, and the fix is counterintuitive. Into a headwind, or in sinking air, you speed up. You push some accelerator. It feels wrong to dive when you're worried about reaching a field, but flying faster gives you the best possible glide over the ground."),
    ("b", "And with the wind behind me?"),
    ("a", "Then ease off, fly slower, closer to minimum sink, and let the wind carry you. One more clean fact: a horizontal headwind changes your ground speed but not your sink rate. Sinking air, on the other hand, adds directly to your sink."),

    ("b", "Okay, let's talk about the wing behaving itself, or not. Stability."),
    ("a", "Three axes to name first. Yaw is the nose swinging left and right, turning about a vertical axis. Roll is the wingtips rocking up and down. Pitch is the wing surging forward and back in front of you, like when you punch into a thermal and the wing pitches back, then dives forward as you pop out the other side."),
    ("b", "And a stable wing does what after a bump?"),
    ("a", "Comes home by itself. The picture is a ball in a bowl: nudge it and it always rolls back to the bottom. An unstable wing is a ball balanced on top of an upturned bowl, the smallest nudge and it runs away. And an indifferent wing is a ball on a flat table: shove it, and it just sits wherever it stops."),
    ("b", "So release the speedbar and a stable wing settles back to normal trim on its own."),
    ("a", "Right. And one sobering note: most modern wings are indifferent in a tight spiral. They won't necessarily come out on their own. You have to actively fly them out."),
    ("b", "That sounds like exactly the kind of thing that gets people hurt."),
    ("a", "It has. Which leads to one rule I want you to never forget. When you're on the speedbar, flying fast, do not steer with the brakes."),
    ("b", "Why not? Brakes are how I steer."),
    ("a", "Because on bar, the wing is at a low angle of attack and the trailing edge is already tight. Yank a brake and you spike the angle of attack right where the wing is most likely to tuck, and you can trigger a frontal collapse. On bar, steer with your weight, or at most a centimetre or two of rear riser. Save the brakes for when the bar is back off."),

    ("b", "Last stop. Turning. Why does a hard turn feel so heavy?"),
    ("a", "Because turning adds a new arrow. In a steady turn, centrifugal force pulls you outward, horizontally. Add that to your weight pulling straight down, and the resultant, your effective weight, points down and outward, and it's bigger than your real weight."),
    ("b", "How much bigger?"),
    ("a", "We measure it in G, the load factor. At thirty degrees of bank it's barely more than normal. At forty-five degrees you're pulling about one point four G. At sixty degrees of bank it's a full two G. Your effective weight has doubled."),
    ("b", "Two G at sixty degrees. And it keeps climbing fast after that?"),
    ("a", "Frighteningly fast. Seventy degrees is roughly three G, and eighty degrees is around six G. And here's the sting in the tail: as the load goes up, your whole speed range shifts up too, including your stall speed."),
    ("b", "So in a hard turn I can stall at a speed that would be perfectly safe in straight flight."),
    ("a", "That's the headline. A heavily banked wing flies faster, loads up, and stalls earlier. Respect the load factor."),

    ("b", "Okay, let me try to land this. Give me the through-line."),
    ("a", "Everything is arrows adding up. Drag pushes back and grows with the square of speed. Tilt a wing and you get lift, two thirds of it suction on top, mostly from the front third. The angle of attack sets everything: ten degrees best glide, twenty minimum sink, twenty-five stall. Glide ratio is your efficiency, but plan with five or six, not ten. Into wind or sink, fly faster. A stable wing comes home like a ball in a bowl. And in a turn, your weight multiplies and your stall speed climbs."),
    ("b", "Arrows, the square of speed, the angle-of-attack ladder, conservative glide, and respect the turn. I can actually hold those five in my head."),
    ("a", "Then you've got the spine of the whole aerodynamics paper. Everything else is just detail hanging off those bones."),
    ("b", "That actually made sense out loud. Thanks Maya."),
    ("a", "That's the whole idea. Catch you in the next episode, meteorology, where the air itself starts fighting back."),
]

# --- Episodes 2-5 — real metadata + outline, scripts to follow ---------------
EPISODES = [
    {
        "id": "aerodynamics", "part": "part1", "topic": "Aerodynamics",
        "title": "Aerodynamics & Flight Mechanics",
        "icon": "📐", "color": "#a855f7", "est_minutes": 12,
        "blurb": "How a wing actually flies — vectors, drag and the square-of-speed rule, the three explanations of lift, the angle-of-attack ladder, the polar curve, glide ratio, stability, and load factor in turns.",
        "outline": [],
        "segments": [{"speaker": s, "text": t} for s, t in AERO],
    },
    {
        "id": "meteorology", "part": "part2", "topic": "Meteorology",
        "title": "Meteorology",
        "icon": "🌦️", "color": "#06b6d4", "est_minutes": 12,
        "blurb": "The invisible engine: why air rises, how thermals form and where to find them, clouds as billboards in the sky, wind gradient and the venturi effect, and the signs that tell you to stay on the ground.",
        "outline": [
            "Heating and convection — why the ground builds thermals, and the daily rhythm of a flyable day",
            "Reading clouds out loud — cumulus as thermal markers, over-development, and the danger signs",
            "Wind: gradient near the ground, venturi compression through gaps, rotor and lee-side turbulence",
            "Fronts, stability and the forecasts that decide whether you fly",
        ],
        "segments": [],
    },
    {
        "id": "legislation", "part": "part3", "topic": "Legislation / Airspace",
        "title": "Law & Airspace",
        "icon": "⚖️", "color": "#3b82f6", "est_minutes": 9,
        "blurb": "The rules that keep everyone alive: airspace classes and where free-flight is allowed, right-of-way and priority, distances and no-fly zones, and the pilot's legal responsibilities.",
        "outline": [
            "Airspace classes painted as a layer cake — what each one means for a paraglider",
            "Right-of-way: who yields to whom, ridge rules, and converging gliders",
            "Where you may not fly — protected zones, clouds, and minimum distances",
            "Insurance, licensing and the pilot-in-command's responsibilities",
        ],
        "segments": [],
    },
    {
        "id": "equipment", "part": "part4", "topic": "Equipment",
        "title": "Equipment",
        "icon": "🎒", "color": "#f59e0b", "est_minutes": 10,
        "blurb": "Your gear, from canopy to carabiner: how a wing is built, lines and risers, the harness and reserve parachute, certification classes, and the pre-flight check that catches problems on the ground.",
        "outline": [
            "Anatomy of the wing — cells, internal structure, line cascade and risers",
            "Harness, reserve and connectors — how the safety system fits together",
            "Certification classes (A to D) and what they really say about a wing",
            "The pre-flight check, daily care, and when to retire a wing",
        ],
        "segments": [],
    },
    {
        "id": "flying-skills", "part": "part5", "topic": "Flying Skills",
        "title": "Flying Skills",
        "icon": "🛬", "color": "#10b981", "est_minutes": 11,
        "blurb": "Putting it together in the air: launch technique, active flying to keep the wing overhead, planning the approach and landing, and recognising and recovering from collapses when the air turns rough.",
        "outline": [
            "Launch — forward and reverse, the wall, and aborting safely",
            "Active flying — feeling the wing and keeping it loaded over your head",
            "The approach: circuit planning, the aiming point and flaring to land",
            "When it goes wrong — collapses, cravattes and the calm recovery sequence",
        ],
        "segments": [],
    },
]


def main():
    data = {
        "version": 1,
        "description": "Two-host audio companions, one per study-guide topic. Audio is rendered separately by scripts/build_podcasts.py.",
        "hosts": HOSTS,
        "episodes": EPISODES,
    }
    out = os.path.join(ROOT, "data", "podcasts.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    scripted = [e for e in EPISODES if e["segments"]]
    words = sum(len(seg["text"].split()) for e in scripted for seg in e["segments"])
    print(f"Wrote {out}")
    print(f"  Episodes: {len(EPISODES)} ({len(scripted)} fully scripted, {len(EPISODES) - len(scripted)} outlined)")
    for e in EPISODES:
        n = len(e["segments"])
        tag = f"{n} segments" if n else "outline only"
        print(f"   - {e['id']:<14} {e['topic']:<22} {tag}")
    print(f"  Scripted words: {words} (~{round(words / 150)} min of speech at 150 wpm)")


if __name__ == "__main__":
    main()
