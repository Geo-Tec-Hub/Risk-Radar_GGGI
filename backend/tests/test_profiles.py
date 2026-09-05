import os, json, asyncio, sys
os.environ.update(PGHOST="/tmp/pgrun", PGPORT="5433", PGDATABASE="riskradar", PGUSER="postgres")
sys.path.insert(0,"/tmp/rr/backend")
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.db import open_pool_or_none
from app.routers import profiles
from app.deps import CurrentUser, get_current_user

app = FastAPI()
app.include_router(profiles.router, prefix="/api")

class FakeUser:
    def __init__(self, uid, prov, roles): self.id=uid; self.province_id=prov; self.roles=roles; self.province="Central"; self.email="dev@example.test"
    def has_role(self,c): return c in self.roles

async def boot():
    app.state.pool = await open_pool_or_none(app)
asyncio.get_event_loop().run_until_complete(boot()) if False else None

import anyio
@app.on_event("startup")
async def _s(): app.state.pool = await open_pool_or_none(app)

def as_user(u): app.dependency_overrides[get_current_user] = lambda: u

SCOPE="CEN:AGRICULTURE:PADDY:drought"
ok=fail=0
def check(name, cond, extra=""):
    global ok,fail
    if cond: ok+=1; print(f"  PASS  {name}")
    else:    fail+=1; print(f"  FAIL  {name} {extra}")

with TestClient(app) as c:
    print("\n== GET weights ==")
    r=c.get(f"/api/profiles/{SCOPE}/weights"); d=r.json()
    check("200", r.status_code==200, r.text[:200])
    check("scope round-trips", d["scope"]==SCOPE, d.get("scope"))
    check("code is the active version", d["code"].startswith("PADDY_DROUGHT_CEN_V"), d.get("code"))
    ht=[t for t in d["totals"] if t["domain"]=="hazard"][0]
    check("hazard totals 100 over counted only", ht["total"]==100.0, ht)
    check("composite reported excluded", ht["excluded"]==1, ht)
    idx=[v for v in d["variables"] if v["indicator_code"]=="DROUGHT_HAZARD_INDEX"][0]
    check("composite flagged is_composite_index", idx["is_composite_index"] is True)
    check("composite consensus=rejected, no weight", idx["consensus"]=="rejected" and idx["weight_pct"] is None, idx)
    check("exclusion is attributed", idx["decided_by"] is not None, idx)
    check("is_computable true", d["is_computable"] is True)

    print("\n== scope errors ==")
    check("bad shape -> 400", c.get("/api/profiles/CEN:AGRICULTURE/weights").status_code==400)
    r=c.get("/api/profiles/ZZZ:AGRICULTURE:PADDY:drought/weights")
    check("unknown province -> 404 naming it", r.status_code==404 and "province 'ZZZ'" in r.text, r.text[:120])
    r=c.get("/api/profiles/CEN:AGRICULTURE:PADDY:tsunami/weights")
    check("unknown hazard -> 404 naming it", r.status_code==404 and "hazard 'tsunami'" in r.text, r.text[:120])

    print("\n== readiness ==")
    r=c.get("/api/profiles/readiness"); d2=r.json()
    check("200 and not parsed as a scope", r.status_code==200, r.text[:120])
    check("243 active profiles", len(d2)==243, len(d2))
    check("carries a usable scope", d2[0]["scope"].count(":")==3, d2[0]["scope"])
    print(f"        computable now: {sum(1 for x in d2 if x['is_computable'])} of {len(d2)}")

    print("\n== PUT authorisation ==")
    body={"items":[{"indicator_code":v["indicator_code"],"domain":v["domain"],
                    "weight_pct":v["weight_pct"],"consensus":v["consensus"],
                    "consensus_note":v["consensus_note"]} for v in d["variables"]]}
    as_user(FakeUser(3, None, ["community"]))
    check("community -> 403", c.put(f"/api/profiles/{SCOPE}/weights", json=body).status_code==403)
    as_user(FakeUser(3, 999, ["expert"]))
    r=c.put(f"/api/profiles/{SCOPE}/weights", json=body)
    check("expert in the wrong province -> 403", r.status_code==403, r.text[:140])
    as_user(FakeUser(3, 1, ["expert"]))
    r=c.put(f"/api/profiles/{SCOPE}/weights", json=body)
    check("expert in the right province -> 200", r.status_code==200, r.text[:200])
    if r.status_code==200:
        check("version incremented", r.json()["version"]>d["version"], (d["version"], r.json()["version"]))
        check("consensus survived the save",
              [v for v in r.json()["variables"] if v["indicator_code"]=="DROUGHT_HAZARD_INDEX"][0]["consensus"]=="rejected")

    print("\n== PUT rule enforcement (messages come from the database) ==")
    bad=json.loads(json.dumps(body)); bad["items"][0]["weight_pct"]=1
    r=c.put(f"/api/profiles/{SCOPE}/weights", json=bad)
    check("wrong total -> 422", r.status_code==422 and "total 100" in r.text, r.text[:160])
    bad2=json.loads(json.dumps(body))
    for it in bad2["items"]:
        if it["indicator_code"]=="OCCURRENCE_WARM_DAYS": it["consensus"]="contested"; it["consensus_note"]=None
    r=c.put(f"/api/profiles/{SCOPE}/weights", json=bad2)
    check("contested with no note -> 422", r.status_code==422 and "note" in r.text, r.text[:160])

print(f"\n{ok} passed, {fail} failed")
sys.exit(1 if fail else 0)
