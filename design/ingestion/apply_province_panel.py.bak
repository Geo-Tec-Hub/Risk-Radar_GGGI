#!/usr/bin/env python3
"""
apply_province_panel.py - turn a province panel's returned decisions into SQL.

Reads  catalog_addendum.csv  and  province_variable_overrides.csv  (both written
by build_province_overrides.py) and emits ONE transactional, idempotent SQL file
that:

  1. adds the panel's new variables to indicator_catalog, inheriting the
     settings of the variable each one replaces so a split cannot silently
     change normalisation or direction;
  2. re-saves every affected profile through save_profile_weights(), which is
     the ONLY supported way to change a weighting - it versions the profile,
     enforces the per-domain 100 rule and refuses to lose an exclusion.

CONSENSUS, AND WHY EACH VALUE IS USED
  agreed     a weight the panel itself set or that came forward from the legacy
             provincial workbook.
  contested  a DERIVED weight - the 25/75 split of a retired parent. It counts
             towards the domain total (so the profile computes) but is visibly
             not an expert decision, carries a note saying how it was derived,
             and is attributable via decided_by/decided_at. Reported separately
             as n_contested by v_profile_readiness.
  rejected   a variable the panel superseded. Carries no weight and records what
             replaced it, so the exclusion is a decision on the record rather
             than an absence.
  proposed   a membership with no weight yet - not counted, not excluded. Keeps
             "not yet reviewed" separable from "considered and rejected".

Nothing here writes a weight as 'agreed' that a person did not actually agree.

Usage:
    python apply_province_panel.py            # writes panel_central.sql
"""
import csv
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ADDENDUM = os.path.join(HERE, "catalog_addendum.csv")
OVERRIDES = os.path.join(HERE, "province_variable_overrides.csv")
OUT = os.path.join(HERE, "panel_central.sql")
USER_SQL = "(SELECT id FROM app_user ORDER BY id LIMIT 1)"

# Variables that legitimately carry NEGATIVE values because they express a
# change or trend rather than a quantity. Marked at creation here, not only by
# schema_signed_values_addendum.sql, because of an ordering trap: on a COLD
# build that addendum runs right after the seed, when a variable the panel
# introduced does not exist yet, so its UPDATE matches nothing and the variable
# silently stays 'absolute' -- and the first workbook carrying a negative is
# then rejected. Setting it on the INSERT makes the outcome the same whichever
# order the two files run in.
#
# Evidence for each (Central, 2026-09-03): 3-day cumulative rainfall ranges
# -30.05..57.05 with a median of -0.01, which is not a rainfall depth; warm days
# (TX90p) ranges -1.25..3.50. Every other variable in the same workbooks is
# strictly positive.
SIGNED = {"THREE_DAY_CUMULATIVE_RAINFALL", "OCCURRENCE_WARM_DAYS"}


SAVE_BLOCK = r"""
DO $panel$
DECLARE
    s      RECORD;
    v_pid  BIGINT;
    v_prov SMALLINT;
    v_sec  BIGINT;
    v_sub  BIGINT;
    v_haz  BIGINT;
    v_user BIGINT;
    v_items JSONB;
    v_new  BIGINT;
    n_done INTEGER := 0;
BEGIN
    SELECT id INTO v_user FROM app_user
     WHERE email = 'panel-import@riskradar.local';
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'the panel-import service account is missing - step 0 did not run';
    END IF;

    FOR s IN
        SELECT DISTINCT province, sector, subsector, hazard FROM panel_override
         ORDER BY 1, 2, 3, 4
    LOOP
        SELECT vp.id, vp.province_id, vp.sector_id, vp.subsector_id, vp.hazard_type_id
          INTO v_pid, v_prov, v_sec, v_sub, v_haz
          FROM vulnerability_profile vp
          JOIN province p     ON p.id  = vp.province_id
          JOIN sector   sec   ON sec.id = vp.sector_id
          LEFT JOIN subsector sub ON sub.id = vp.subsector_id
          JOIN hazard_type h  ON h.id  = vp.hazard_type_id
         WHERE vp.is_active
           AND p.name   = s.province
           AND sec.name = s.sector
           AND COALESCE(sub.name, '') = COALESCE(s.subsector, '')
           AND h.name   = s.hazard;

        IF v_pid IS NULL THEN
            RAISE EXCEPTION 'No active profile for % / % / % / %',
                s.province, s.sector, s.subsector, s.hazard;
        END IF;

        WITH ov AS (
            SELECT * FROM panel_override o
             WHERE o.province = s.province AND o.sector = s.sector
               AND COALESCE(o.subsector,'') = COALESCE(s.subsector,'')
               AND o.hazard = s.hazard
        ),
        cur AS (
            SELECT ic.code, pi.domain::text AS domain, pi.weight_pct,
                   pi.relationship::text AS relationship
              FROM profile_indicator pi
              JOIN indicator_catalog ic ON ic.id = pi.indicator_id
             WHERE pi.profile_id = v_pid
        ),
        added AS (
            SELECT o.code, ic.domain::text AS domain, o.weight_pct,
                   ic.direction::text AS relationship
              FROM ov o
              JOIN indicator_catalog ic ON ic.code = o.code
             WHERE o.action = 'add'
               AND NOT EXISTS (SELECT 1 FROM cur c WHERE c.code = o.code)
        ),
        merged AS (
            SELECT c.code, c.domain, c.relationship,
                   ow.action, COALESCE(ow.weight_pct, c.weight_pct) AS weight_pct,
                   COALESCE(ow.basis, ow.note) AS note
              FROM cur c
              LEFT JOIN ov ow ON ow.code = c.code
            UNION ALL
            SELECT a.code, a.domain, a.relationship,
                   'add', a.weight_pct,
                   (SELECT COALESCE(o2.basis, o2.note) FROM ov o2
                     WHERE o2.code = a.code AND o2.action = 'add' LIMIT 1)
              FROM added a
        ),
        typed AS (
            SELECT m.code, m.domain, m.relationship, m.note,
                   CASE
                     -- superseded: no weight, and the replacement is on the record
                     WHEN m.action = 'retire'                    THEN 'rejected'
                     -- a weight the panel itself entered
                     WHEN m.action = 'weight'                    THEN 'agreed'
                     -- a DERIVED split weight: counts, but is not an expert decision
                     WHEN m.action = 'add' AND m.weight_pct IS NOT NULL
                                                                 THEN 'contested'
                     -- no weight yet: not counted, not excluded
                     WHEN m.weight_pct IS NULL                   THEN 'proposed'
                     ELSE 'agreed'
                   END AS consensus,
                   CASE WHEN m.action = 'retire' THEN NULL ELSE m.weight_pct END
                       AS weight_pct
              FROM merged m
        )
        SELECT jsonb_agg(jsonb_build_object(
                   'code', t.code,
                   'domain', t.domain,
                   'weight_pct', t.weight_pct,
                   'relationship', t.relationship,
                   'consensus', t.consensus,
                   'consensus_note',
                       CASE WHEN t.consensus IN ('contested','rejected')
                            THEN COALESCE(t.note, 'recorded by the provincial panel review')
                       END))
          INTO v_items
          FROM typed t;

        v_new := save_profile_weights(
                     v_prov, v_sec, v_sub, v_haz, v_items, v_user, NULL,
                     s.province || ' panel review, returned 2026-09-03. '
                     || 'Weights marked contested are DERIVED splits of a retired '
                     || 'variable and await panel confirmation.');
        n_done := n_done + 1;
    END LOOP;

    RAISE NOTICE 're-saved % profiles from panel decisions', n_done;
END
$panel$;
"""


def q(v):
    if v is None or v == "":
        return "NULL"
    return "'" + str(v).replace("'", "''") + "'"


def main():
    defs = list(csv.DictReader(open(ADDENDUM, encoding="utf-8-sig")))
    rows = list(csv.DictReader(open(OVERRIDES, encoding="utf-8-sig")))

    # variable -> the retired parent it replaces, for settings inheritance
    parent = {}
    for r in rows:
        if r["action"] == "add" and r["note"].startswith("replaces "):
            parent[r["variable_code"]] = r["note"][len("replaces "):].strip()

    scopes = sorted({(r["province"], r["main_sector"], r["subsector"], r["hazard"])
                     for r in rows})
    by_scope = defaultdict(list)
    for r in rows:
        by_scope[(r["province"], r["main_sector"], r["subsector"],
                  r["hazard"])].append(r)

    L = []
    add = L.append
    add("-- Generated by design/ingestion/apply_province_panel.py - do not hand-edit.")
    add("-- Applies a provincial panel's returned decisions. Re-running is safe:")
    add("-- each run versions the affected profiles rather than mutating them in place.")
    add("BEGIN;")
    add("")
    add("-- 0. the account the decisions are attributed to --------------------------")
    add("-- save_profile_weights() records decided_by for every contested or rejected")
    add("-- membership. An exclusion that cannot be attributed is indistinguishable")
    add("-- from an oversight (SRS 2.4), so a NULL user here is not acceptable: this")
    add("-- creates a suspended service account that no one can sign in as, whose only")
    add("-- purpose is to carry the attribution for decisions loaded from a file.")
    add("INSERT INTO app_user (email, password_hash, full_name, organization,")
    add("                      is_active, status)")
    add("VALUES ('panel-import@riskradar.local', '!no-login', 'Provincial panel import',")
    add("        'Risk Radar system account', FALSE, 'suspended')")
    add("ON CONFLICT (email) DO NOTHING;")
    add("")
    add("-- 1. the panel's new variables ------------------------------------------")
    for d in defs:
        code = d["variable_code"]
        p = parent.get(code)
        kind = "signed" if code in SIGNED else "absolute"
        add("INSERT INTO indicator_catalog")
        add("    (code, name, domain, direction, norm_method, norm_scope,")
        add("     period_aggregation, is_composite_index, status, value_kind,")
        add("     description)")
        if p:
            add("SELECT %s, %s, %s::domain_type," % (q(code), q(d["variable_name"]),
                                                     q(d["domain"])))
            add("       ic.direction, ic.norm_method, ic.norm_scope,")
            add("       ic.period_aggregation, FALSE, 'active',")
            add("       %s::indicator_value_kind, %s"
                % (q(kind), q(d["note"] + " | settings inherited from " + p)))
            add("  FROM indicator_catalog ic WHERE ic.code = %s" % q(p))
        else:
            add("VALUES (%s, %s, %s::domain_type, 'higher_is_worse', 'minmax',"
                % (q(code), q(d["variable_name"]), q(d["domain"])))
            add("        'pooled', 'average', FALSE, 'active',")
            add("        %s::indicator_value_kind, %s)" % (q(kind), q(d["note"])))
        add("ON CONFLICT (code) DO NOTHING;")
        # Re-running must still correct a row created before value_kind existed,
        # which ON CONFLICT DO NOTHING would leave alone.
        if kind == "signed":
            add("UPDATE indicator_catalog SET value_kind = 'signed'")
            add(" WHERE code = %s AND value_kind <> 'signed';" % q(code))
        add("")

    add("-- 1b. header aliases -------------------------------------------------------")
    add("-- The heading the panel actually typed, kept so their returned workbooks and")
    add("-- anything else written against that heading still resolve after a rename.")
    for d in defs:
        was = d["note"].split("column header was '")[-1].split("'")[0] \
            if "column header was '" in d["note"] else None
        if was:
            add("INSERT INTO indicator_alias (indicator_id, alias)")
            add("SELECT id, %s FROM indicator_catalog WHERE code = %s"
                % (q(was), q(d["variable_code"])))
            add("ON CONFLICT DO NOTHING;")
            add("")
    add("-- 2. the panel's decisions, scope by scope --------------------------------")
    add("CREATE TEMP TABLE panel_override (")
    add("    province text, sector text, subsector text, hazard text,")
    add("    code text, action text, weight_pct numeric, basis text, note text")
    add(") ON COMMIT DROP;")
    add("INSERT INTO panel_override VALUES")
    vals = []
    for r in rows:
        vals.append("  (%s, %s, %s, %s, %s, %s, %s, %s, %s)" % (
            q(r["province"]), q(r["main_sector"]), q(r["subsector"] or None),
            q(r["hazard"]), q(r["variable_code"]), q(r["action"]),
            r["weight_pct"] if r["weight_pct"] else "NULL",
            q(r["basis"] or None), q(r["note"] or None)))
    add(",\n".join(vals) + ";")
    add("")
    add(SAVE_BLOCK)
    add("COMMIT;")

    open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(L) + "\n")
    print("wrote %s" % os.path.relpath(OUT, HERE))
    print("  %d new catalogue variables" % len(defs))
    print("  %d override rows across %d profile scopes" % (len(rows), len(scopes)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
