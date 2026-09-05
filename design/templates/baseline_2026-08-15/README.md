# baseline_2026-08-15/

The Central workbooks **exactly as the expert panel received them** — extracted
from `Templates_generated_LOCKED_backup.zip` (the 15 August 2026 locked build).

Do not regenerate or edit these. `design/ingestion/build_province_overrides.py`
diffs the panel's returned files against this folder to work out what they
added, retired and weighted. If the baseline moves, the diff comes out empty and
the override files silently reduce to nothing — which is exactly what happened
once, on 2026-09-03, when the baseline still pointed at `generated/`.

Delete only when Central's overrides have been folded into the national
catalogue and the override file for Central is no longer needed.
