#!/usr/bin/env python3
"""
build_sabaragamuwa_overrides.py - append Sabaragamuwa rows to
province_variable_overrides.csv.

WHY THIS IS NOT build_province_overrides.py
  That script diffs a panel's RETURNED workbooks against the pinned baseline.
  Sabaragamuwa's return carries the same 25%/75% column split Central made, but
  the panel left the PARENT's weight in place and the two new columns
  unweighted - so there is no returned weight to read. The split weights here
  are therefore DERIVED from each profile's own parent weight using the ratios
  Central agreed on 3 Sep 2026, exactly as Central's derived rows were, and
  land in the database as consensus='contested' (a derived weight, visibly not
  an expert decision) via apply_province_panel.py.

  Parent weights are read from design/templates/generated/Sabaragamuwa, which is
  what the province's profiles currently hold.

  If the full returned Sabaragamuwa set ever yields real panel weights, replace
  these rows rather than adding to them.

PROFILES WITH INCOMPLETE WEIGHTS ARE SKIPPED
  save_profile_weights() refuses a profile whose agreed+contested weights do not
  total 100 per domain, and it is right to: seven Sabaragamuwa profiles have
  exposure variables the panel has not weighted yet (exposure sums 45-90). They
  are listed on stdout and left for a later run - this is a pre-existing gap in
  the province's weights, not something the split causes.

Usage:
    python build_sabaragamuwa_overrides.py [--dry-run] [--replace]
"""
import csv, os, glob, sys, openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
OVERRIDES = os.path.join(HERE, "province_variable_overrides.csv")
TEMPLATES = os.path.join(HERE, "..", "templates", "generated", "Sabaragamuwa")

SPLITS = {
 'DROUGHT_EVENTS_1974_TO_2022': [('DROUGHT_EVENTS_1974_TO_2004',0.25),
                                 ('DROUGHT_EVENTS_2005_TO_2022',0.75)],
 'FLOOD_EVENTS_1974_TO_2023': [('FLOOD_EVENTS_1974_TO_2004',0.25),
                               ('FLOOD_EVENTS_2005_TO_2023',0.75)],
 'MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_1974_TO_2022':
     [('MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_1974_TO_2004',0.25),
      ('MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_2005_TO_2022',0.75)],
 'MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_1974_TO_2023':
     [('MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_1974_TO_2004',0.25),
      ('MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_2005_TO_2023',0.75)],
 'VERY_WET_DAYS': [('THREE_DAY_CUMULATIVE_RAINFALL',0.60),
                   ('VERY_WET_DAYS_95TH_PERCENTILE',0.40)],
}

def main():
    dry = "--dry-run" in sys.argv
    replace = "--replace" in sys.argv
    rows, skipped = [], []
    for f in sorted(glob.glob(os.path.join(TEMPLATES, "*.xlsx"))):
        wb = openpyxl.load_workbook(f, data_only=True)
        m = {r[0]: r[1] for r in wb['_META'].iter_rows(values_only=True)}
        prov, sec = m.get('province'), m.get('main_sector')
        sub, haz = m.get('subsector') or '', m.get('hazard')
        seen_header, w, tot = False, {}, {}
        for r in wb['WEIGHTS'].iter_rows(values_only=True):
            if r[0] == 'variable_code':
                seen_header = True
                continue
            if seen_header and r[0] and not str(r[0]).startswith('SUM'):
                w[r[0]] = r[4]
                if r[4] not in (None, ''):
                    tot[r[2]] = tot.get(r[2], 0) + float(r[4])
        short = {d: v for d, v in tot.items() if round(v, 3) != 100}
        if short:
            skipped.append((os.path.basename(f), short))
            continue
        for parent, parts in SPLITS.items():
            if parent not in w:
                continue
            pw = w[parent]
            for code, frac in parts:
                wt = '' if pw in (None, '') else '%g' % round(float(pw) * frac, 4)
                rows.append([prov, sec, sub, haz, code, 'add', wt,
                    'derived: %d%% of retired %s (%s)' % (
                        frac * 100, parent, '' if pw is None else '%g' % pw),
                    'replaces %s' % parent])
            rows.append([prov, sec, sub, haz, parent, 'retire', '', '',
                'superseded by ' + ' + '.join(c for c, _ in parts)])

    existing = list(csv.reader(open(OVERRIDES, encoding='utf-8-sig')))
    has_sab = any(r and r[0] == 'Sabaragamuwa' for r in existing)
    if has_sab and not replace:
        sys.exit('Sabaragamuwa rows already present - rerun with --replace')
    for name, short in skipped:
        print('SKIPPED (weights incomplete) %-46s %s' % (name[:-22], short))
    print('%d rows for %d profiles' % (len(rows), len(set(tuple(r[:4]) for r in rows))))
    if dry:
        return
    if has_sab:
        existing = [r for r in existing if not (r and r[0] == 'Sabaragamuwa')]
        with open(OVERRIDES, 'w', encoding='utf-8', newline='') as fh:
            csv.writer(fh).writerows(existing)
    with open(OVERRIDES, 'a', encoding='utf-8', newline='') as fh:
        csv.writer(fh).writerows(rows)
    print('appended to', os.path.relpath(OVERRIDES, HERE))

main()
