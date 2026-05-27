"""Combined distractors data."""
from distractors_law import LAW
from distractors_eq import EQ
from distractors_met import MET
from distractors_prc import PRC
from distractors_aer import AER

DISTRACTORS = {}
DISTRACTORS.update(LAW)
DISTRACTORS.update(EQ)
DISTRACTORS.update(MET)
DISTRACTORS.update(PRC)
DISTRACTORS.update(AER)
