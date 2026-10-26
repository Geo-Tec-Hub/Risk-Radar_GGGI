"""Build the web assets for the map's base layers and the overall hazard ranks.

Source : SHP/ (client shapefiles, Oct 2026, NOTED-9)
Output : frontend-angular/public/data/geo/
  province.geojson, district.geojson   outlines, simplified
  gnd/<Province>.geojson               GN divisions, one file per province, loaded on demand
  schools.geojson, hospitals.geojson   points, slim attributes
  hazard_ranks.json                    {ds_code: {p, dr, fl, ls}}  rank 1-4, 0 = no hazard

Run:  PYTHONPATH=<dir with pyshp+shapely> python3 design/spatial/build_geo_assets.py
"""
import glob, json, os, re
import shapefile
from shapely.geometry import shape, mapping

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SHP = os.path.join(ROOT, 'SHP')
OUT = os.path.join(ROOT, 'frontend-angular', 'public', 'data', 'geo')
os.makedirs(os.path.join(OUT, 'gnd'), exist_ok=True)

def title(s):  # "NORTH WESTERN" -> "North Western" (matches the register's province names)
    return ' '.join(w.capitalize() for w in s.split())

def rnd(o, nd=5):
    if isinstance(o, (list, tuple)):
        return [rnd(x, nd) for x in o]
    return round(o, nd)

def feat(geom, props, tol):
    g = shape(geom)
    if tol:
        g = g.simplify(tol, preserve_topology=True)
    if g.is_empty:
        return None
    m = mapping(g)
    return {'type': 'Feature', 'properties': props,
            'geometry': {'type': m['type'], 'coordinates': rnd(m['coordinates'])}}

def dump(path, feats):
    with open(path, 'w') as f:
        json.dump({'type': 'FeatureCollection', 'features': [x for x in feats if x]}, f, separators=(',', ':'))
    print(os.path.relpath(path, ROOT), round(os.path.getsize(path) / 1e6, 2), 'MB')

def rd(name):
    return shapefile.Reader(os.path.join(SHP, name), encoding='utf-8')

# --- outlines ---------------------------------------------------------------
r = rd('Admin_b/Province_boundary')
dump(f'{OUT}/province.geojson', [feat(s.__geo_interface__, {'name': title(rec['PROVINCE_N'])}, 0.002)
                                 for s, rec in zip(r.shapes(), r.records())])
r = rd('Admin_b/District_boundary')
dump(f'{OUT}/district.geojson', [feat(s.__geo_interface__, {'name': title(rec['DISTRICT_N']), 'province': title(rec['PROVINCE_N'])}, 0.001)
                                 for s, rec in zip(r.shapes(), r.records())])
r = rd('Admin_b/GN_boundary')
by = {}
for s, rec in zip(r.shapes(), r.records()):
    p = title(rec['PROVINCE_N'])
    by.setdefault(p, []).append(feat(s.__geo_interface__, {'name': rec['GND_NAME_C'], 'dsd': title(rec['DSD_N'])}, 0.0004))
for p, fs in by.items():
    dump(f"{OUT}/gnd/{p.replace(' ', '_')}.geojson", fs)

# --- points -----------------------------------------------------------------
r = rd('Base Layers/Govt_school')
dump(f'{OUT}/schools.geojson', [feat(s.__geo_interface__, {'name': rec['School_Nam'], 'type': rec['School_Typ'], 'district': rec['ADMIN_DIST']}, 0)
                                 for s, rec in zip(r.shapes(), r.records()) if s.points])
r = rd('Base Layers/Hospital')
dump(f'{OUT}/hospitals.geojson', [feat(s.__geo_interface__, {'name': rec['HOSP_NAME'], 'type': rec['HOS_TYPE'], 'district': rec['DISTRICT']}, 0)
                                  for s, rec in zip(r.shapes(), r.records()) if s.points])

# --- overall hazard ranks, keyed by the register's DS code ------------------
reg = {}
b = shapefile.Reader(os.path.join(ROOT, 'design', 'spatial', 'DS_Boundary'))
for rec in b.records():
    reg[(rec['PROVINCE_N'].upper(), rec['DS_Code'])] = rec['New_DS_Cod']
ranks = {}
for f in sorted(glob.glob(os.path.join(SHP, 'Hazard', '*.shp'))):
    rr = shapefile.Reader(f)
    for rec in rr.records():
        prov = rec['PROVINCE_N'].upper()
        code = reg.get((prov, rec['DS_Code']))
        if code:
            ranks[code] = {'p': title(prov), 'dr': rec['DR_Rank'], 'fl': rec['FL_Rank'], 'ls': rec['LS_Rank']}
with open(f'{OUT}/hazard_ranks.json', 'w') as fh:
    json.dump(ranks, fh, separators=(',', ':'))
print('hazard_ranks.json', len(ranks), 'divisions')
