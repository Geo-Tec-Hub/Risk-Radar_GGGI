# Central Province panel — four things to confirm

Your 33 returned workbooks are loaded: **14,020 cells read, 4,412 distinct
values, all 41 DS divisions, 2021–2025.** Nothing was rejected, and where two
workbooks carried the same figure they agreed every time.

Four points need a word from the panel before any score is published. Each has a
default we have applied so work can continue — we need you to confirm or correct
it, not to start from scratch.

---

## 1. Two variables came back with negative values

|  | Range you supplied | Median |
|---|---|---|
| 3 day cumulative rainfall | −30.05 … 57.05 | **−0.01** |
| Occurrence of warm days (TX90p) | −1.25 … 3.50 | 1.78 |

Every other variable in the same files is positive — very wet days sits at
102.8–139.5, SPI at 1.44–1.88 — so these two look different in kind.

**Please confirm for each:**

- Is it an **absolute quantity**, a **change against a baseline**, or a **trend
  per decade**? (A median of −0.01 for 3-day rainfall reads as a change.)
- What is the **unit**, and for a change or trend, what **baseline period**?
- Does a **higher number mean worse** for that hazard? Note 3-day cumulative
  rainfall is used in both **flood** and **landslide** profiles — if the answer
  differs between them, say so.

*Applied for now:* both accepted as signed, both `higher is worse`. If the sign
convention is the other way round the map is inverted, which is why we are
asking rather than assuming.

## 2. Very wet days was split — we read the weights from its own name

The variable you replaced was named *"Very wet days (95th percentile) **and**
3 day cumulative rain fall (out of 35 — **40% for very wet days and 60% for
3 day cumulative** respectively)"*.

So we split its weight the same way. In Paddy / Flood, for example, its 35
became **14 for very wet days** and **21 for 3-day cumulative**.

**Please confirm 40/60 is still the intended weighting**, in every profile where
it appears.

## 3. The 25/75 period splits are our arithmetic, not your decision

Where you split a combined-period variable — drought events, flood events,
maximum affected people — we divided the old variable's weight in the 25/75
proportion your notes state. In Paddy / Drought the old 50 became **12.5 and
37.5**.

These are recorded as **contested** in the system, not agreed, precisely so they
are not mistaken for a panel decision. **Please confirm or replace each.**

## 4. One column heading was renamed

`3DAY_CUMULATIVE_RAINFALL` is stored as **`THREE_DAY_CUMULATIVE_RAINFALL`** — a
code cannot begin with a digit. Your original heading still works when you
upload, so nothing changes for you. Noted here only so the name is not a
surprise.

---

### What we did **not** change

- Nothing was rescaled to reach 100. Every domain reached 100 on your own
  figures plus the derived splits above.
- Variables you left blank are recorded as *not yet collected*, never as zero.
- The four superseded variables are recorded as **replaced by** their successors,
  not deleted, so the change is on the record.
- Your period tabs are read as **2021–2025** and **2026–2030**. The year cells
  inside still say 2020/2025 because they were locked when you renamed the tabs;
  the tab name is what counts.
