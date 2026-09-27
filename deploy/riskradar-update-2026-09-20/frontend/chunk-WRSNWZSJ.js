// src/app/core/models/query-param.util.ts
function scopeToQueryParams(scope) {
  return {
    province: scope.province,
    sector: scope.sector,
    subsector: scope.subsector ?? null,
    hazard: scope.hazard
  };
}
function scopeFromQueryParams(params) {
  const { province, sector, hazard, subsector } = params;
  if (!province || !sector || !hazard) return null;
  return { province, sector, hazard, subsector: subsector || void 0 };
}

export {
  scopeToQueryParams,
  scopeFromQueryParams
};
//# debugId=308d7b41-7285-59d6-a82d-5a3b116ee45a
//# sourceMappingURL=chunk-WRSNWZSJ.js.map
