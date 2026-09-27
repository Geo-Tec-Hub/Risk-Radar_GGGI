// src/app/core/models/reference-data.model.ts
var HAZARDS = ["drought", "flood", "landslide"];
var SECTORS = [
  { code: "AGRICULTURE", name: "Agriculture", subsectors: ["Coconut", "Paddy", "Tea", "Vegetable & Other Field Crops"] },
  { code: "HUMAN_SETTLEMENTS", name: "Human Settlements", subsectors: [] },
  { code: "INDUSTRY", name: "Industry", subsectors: [] },
  { code: "INLAND_FISHERY", name: "Inland Fishery", subsectors: ["Inland Fishery"] },
  { code: "LIVESTOCK", name: "Livestock", subsectors: ["Buffalo", "Cattle", "Goat", "Pig & Sheep", "Poultry farming"] },
  { code: "TOURISM", name: "Tourism", subsectors: [] },
  { code: "TRANSPORTATION", name: "Transportation", subsectors: [] },
  { code: "WATER", name: "Water", subsectors: ["Irrigation Water", "Potable Water"] }
];
var PROVINCES = [
  "Central",
  "Eastern",
  "North Central",
  "Northern",
  "Northwestern",
  "Sabaragamuwa",
  "Southern",
  "Uva",
  "Western"
];
var PROVINCE_OPTIONS = [
  { id: 1, code: "CEN", name: "Central" },
  { id: 2, code: "EAS", name: "Eastern" },
  { id: 3, code: "NCE", name: "North Central" },
  { id: 4, code: "NOR", name: "Northern" },
  { id: 5, code: "NWE", name: "North Western" },
  { id: 6, code: "SAB", name: "Sabaragamuwa" },
  { id: 7, code: "SOU", name: "Southern" },
  { id: 8, code: "UVA", name: "Uva" },
  { id: 9, code: "WES", name: "Western" }
];
var TRACKS = ["data", "expert", "community"];
var PERIODS = ["2021-2025", "2026-2030"];

export {
  HAZARDS,
  SECTORS,
  PROVINCES,
  PROVINCE_OPTIONS,
  TRACKS,
  PERIODS
};
//# debugId=405a9098-1d72-5e21-bc42-8d2a3c63d6cf
//# sourceMappingURL=chunk-HN3O3DC2.js.map
