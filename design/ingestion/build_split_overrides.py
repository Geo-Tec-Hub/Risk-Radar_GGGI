#!/usr/bin/env python3
"""
build_split_overrides.py - derive province_variable_overrides.csv rows that
apply the Central panel's 25%/75% variable splits to any province.

WHY THIS IS NOT build_province_overrides.py
  That script diffs a panel's RETURNED workbooks against the pinned baseline,
  and is the right tool whenever a province returns real panel weights.
  The splits below were agreed by the Central panel (3 Sep 2026) and are being
  carried to the remaining provinces, whose returns keep the parent's weight in
  place and leave the new columns unweighted. So there is no returned weight to
  read: each split weight is DERIVED from that profile's own parent weight using
  Central's ratios, and lands in the database as consensus='contested' - a
  derived weight, visibly not an expert decision - via apply_province_panel.py.

  Parent weights are read from design/templates/generated/<Province>, which is
  what those profiles currently hold.

AN UNWEIGHTED PARENT IS ADDED ALONGSIDE, NEVER RETIRED
  In Eastern, Northern, Northwestern and Uva - and in three Southern landslide
  profiles - the hazard domain is the composite index at 100% and every
  component, including the split parent, is unweighted. There is no weight to
  split there, and retiring the parent is refused outright by FR-4.9b: excluding
  a component while the composite index carries weight would reinstate the
  composite as the hazard domain, against [P-5]. So when the parent carries no
  weight the two components are added as unweighted members (consensus
  'proposed' - a membership not yet reviewed, neither counted nor excluded) and
  the parent is left exactly as it is. That is all their workbooks need: the
  importer refuses a column the profile does not list, but tolerates a listed
  column the file omits.

PROFILES WITH INCOMPLETE WEIGHTS ARE SKIPPED
  save_profile_weights() refuses a profile whose agreed+contested weights do not
  total 100 per domain, and it is right to. Those profiles are reported and left
  out - a pre-existing gap in the province's weights, not something the split
  causes. Re-run once the panel supplies the missing weights.

CENTRAL IS NEVER REGENERATED HERE
  Central's rows came from its actual returned workbooks and include real panel
  weights. Pass --replace only for a province whose rows this script wrote.

Usage:
    python build_split_overrides.py --all [--dry-run]
    python build_split_overrides.py --province Uva [--replace]
"""
import csv, os, glob, sys, openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
OVERRIDES = os.path.join(HERE, "province_variable_overrides.csv")
GENERATED = os.path.join(HERE, "..", "templates", "generated")
PROTECTED = {"Central"}

SPLITS = {
 'DROUGHT_EVENTS_1974_TO_2022': [('DROUGHT_EVENTS_1974_TO_2004', 0.25),
                                 ('DROUGHT_EVENTS_2005_TO_2022', 0.75)],
 'FLOOD_EVENTS_1974_TO_2023': [('FLOOD_EVENTS_1974_TO_2004', 0.25),
                               ('FLOOD_EVENTS_2005_TO_2023', 0.75)],
 'MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_1974_TO_2022':
     [('MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_1974_TO_2004', 0.25),
      ('MAXIMUM_DROUGHT_AFFECTED_PEOPLE_DURING_2005_TO_2022', 0.75)],
 'MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_1974_TO_2023':
     [('MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_1974_TO_2004', 0.25),
      ('MAXIMUM_FLOOD_AFFECTED_PEOPLE_DURING_2005_TO_2023', 0.75)],
 'VERY_WET_DAYS': [('THREE_DAY_CUMULATIVE_RAINFALL', 0.60),
                   ('VERY_WET_DAYS_95TH_PERCENTILE', 0.40)],
}


def rows_for(folder):
    """Override rows for one generated/<folder>, plus the profiles skipped."""
    rows, skipped = [], []
    for f in sorted(glob.glob(os.path.join(GENERATED, folder, "*.xlsx"))):
        wb = openpyxl.load_workbook(f, data_only=True)
        m = {r[0]: r[1] for r in wb['_META'].iter_rows(values_only=True)}
        prov, sec = m.get('province'), m.get('main_sector')
        sub, haz = m.get('subsector') or '', m.get('hazard')
        seen, w, tot = False, {}, {}
        for r in wb['WEIGHTS'].iter_rows(values_only=True):
            if r[0] == 'variable_code':
                seen = True
                continue
            if seen and r[0] and not str(r[0]).startswith('SUM'):
                w[r[0]] = r[4]
                if r[4] not in (None, ''):
                    tot[r[2]] = tot.get(r[2], 0) + float(r[4])
        if not any(p in w for p in SPLITS):
            continue
        short = {d: v for d, v in tot.items() if round(v, 3) != 100}
        if short:
            skipped.append((prov, os.path.basename(f), short))
            continue
        for parent, parts in SPLITS.items():
            if parent not in w:
                continue
            pw = w[parent]
            if pw in (None, ''):
                # Nothing to split and nothing to exclude - see the docstring.
                for code, _ in parts:
                    rows.append([prov, sec, sub, haz, code, 'add', '',
                        'component of unweighted %s; no weight to split' % parent,
                        'added alongside %s' % parent])
                continue
            for code, frac in parts:
                rows.append([prov, sec, sub, haz, code, 'add',
                    '%g' % round(float(pw) * frac, 4),
                    'derived: %d%% of retired %s (%g)' % (frac * 100, parent, pw),
                    'replaces %s' % parent])
            rows.append([prov, sec, sub, haz, parent, 'retire', '', '',
                'superseded by ' + ' + '.join(c for c, _ in parts)])
    return rows, skipped


def arg(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


def main():
    dry = "--dry-run" in sys.argv
    replace = "--replace" in sys.argv
    one = arg("--province")
    if not one and "--all" not in sys.argv:
        sys.exit(__doc__)

    folders = sorted(d for d in os.listdir(GENERATED)
                     if os.path.isdir(os.path.join(GENERATED, d))
                     and not d.startswith("_"))
    if one:
        folders = [d for d in folders if d.replace("_", " ").lower() == one.lower()]
        if not folders:
            sys.exit("no generated folder for province %r" % one)

    existing = list(csv.reader(open(OVERRIDES, encoding='utf-8-sig')))
    done = {r[0] for r in existing if r and r[0] != 'province'}

    all_rows, all_skipped, touched = [], [], []
    for d in folders:
        rows, skipped = rows_for(d)
        prov = rows[0][0] if rows else (skipped[0][0] if skipped else d)
        if prov in PROTECTED and not one:
            print('%-14s left alone (its rows come from its own returned panel)' % prov)
            continue
        if prov in done and not replace:
            print('%-14s already in the file - rerun with --replace to redo it' % prov)
            continue
        if prov in PROTECTED and replace:
            sys.exit('refusing to regenerate %s: see the docstring' % prov)
        all_rows += rows
        all_skipped += skipped
        touched.append(prov)
        print('%-14s %3d rows for %2d profiles, %d skipped'
              % (prov, len(rows), len({tuple(r[:4]) for r in rows}), len(skipped)))

    for prov, name, short in all_skipped:
        print('  SKIPPED %-14s %-44s %s' % (prov, name[:-22], short))
    if not all_rows:
        return
    print('TOTAL %d rows across %s' % (len(all_rows), ', '.join(touched)))
    if dry:
        return
    if replace and touched:
        existing = [r for r in existing if not (r and r[0] in touched)]
        with open(OVERRIDES, 'w', encoding='utf-8', newline='') as fh:
            csv.writer(fh).writerows(existing)
    with open(OVERRIDES, 'a', encoding='utf-8', newline='') as fh:
        csv.writer(fh).writerows(all_rows)
    print('written to', os.path.relpath(OVERRIDES, HERE))


main()
