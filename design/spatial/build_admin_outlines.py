"""Province and district OUTLINES for the map, dissolved from DS_Boundary (NOTED-19).

Built from the same DS-division polygons the map draws, so the lines sit exactly on
the division edges at every zoom (the client shapefiles in SHP/Admin_b did not, and
looked odd when zoomed out). Output: frontend-angular/public/data/geo/{province,district}.geojson

Run: python3 design/spatial/build_admin_outlines.py design/spatial/DS_Boundary frontend-angular/public/data/geo
"""
import json, sys, shapefile
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
src, out = sys.argv[1], sys.argv[2]
r = shapefile.Reader(src)
def title(s):
    t = ' '.join(w.capitalize() for w in s.split())
    return {'North Western': 'Northwestern'}.get(t, t)
prov, dist = {}, {}
for sh, rec in zip(r.shapes(), r.records()):
    g = shape(sh.__geo_interface__).buffer(0)
    prov.setdefault(title(rec['PROVINCE_N']), []).append(g)
    dist.setdefault((title(rec['DISTRICT_N']).replace(' District', ''), title(rec['PROVINCE_N'])), []).append(g)
def rnd(o):
    return [rnd(x) for x in o] if isinstance(o, (list, tuple)) else round(o, 5)
def feat(geoms, props, tol):
    # Snap the union to a tiny grid first so slivers between neighbours close,
    # then simplify the OUTLINE (boundary lines), not each polygon.
    u = unary_union([g.buffer(0.0002) for g in geoms]).buffer(-0.0002)
    line = u.boundary.simplify(tol, preserve_topology=True)
    m = mapping(line)
    return {'type': 'Feature', 'properties': props, 'geometry': {'type': m['type'], 'coordinates': rnd(m['coordinates'])}}
P = [feat(v, {'name': k}, 0.0008) for k, v in sorted(prov.items())]
D = [feat(v, {'name': k[0], 'province': k[1]}, 0.0005) for k, v in sorted(dist.items())]
json.dump({'type': 'FeatureCollection', 'features': P}, open(out + '/province.geojson', 'w'), separators=(',', ':'))
json.dump({'type': 'FeatureCollection', 'features': D}, open(out + '/district.geojson', 'w'), separators=(',', ':'))
print(len(P), 'provinces', len(D), 'districts')
