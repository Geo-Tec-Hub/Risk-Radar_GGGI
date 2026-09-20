import API, { setHeadersToken } from "../services/ApiServices";

const fetchData = async (endpoint, token, errorMsg) => {
  if (token) {
    try {
      setHeadersToken(token);
      const response = await API.get(endpoint);
      return response.data;
    } catch (err) {
      console.error(errorMsg, err);
      return null;
    }
  } else {
    try {
      const response = await API.get(endpoint);
      return response.data;
    } catch (err) {
      console.error(errorMsg, err);
      return null;
    }
  }
};

export const fetchUserData = (token) =>
  fetchData("users/me/", token, "Failed to fetch user data");

export const fetchUserUploadedData = (email) =>
  fetchData(
    `users/vulndata/history/?user_id=${email}`,
    null,
    "Failed to fetch user data"
  );

// https://riskradarback.geoinfobox.com/api/users/vulndata/history/?user_id=www.sanjayamadusanka2017@gmail.com

export const fetchSectorList = async () => {
  const data = await fetchData(
    "users/sector/",
    null,
    "Failed to fetch sectors list"
  );
  if (data) {
    return data;
  } else {
    return null;
  }
};

export const fetchHazardList = async () => {
  const data = await fetchData(
    "users/hazard/",
    null,
    "Failed to fetch hazard list"
  );
  if (data) {
    return data;
  } else {
    return null;
  }
};

export const fetchProvincesBaseGeomData = (selectedSector, selectedHazard) =>
  fetchData(
    `users/vulndata/pd/geom/avg/?sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to provice data"
  );

export const fetchDistrictsBaseGeomData = (selectedSector, selectedHazard) =>
  fetchData(
    `users/vulndata/disd/geom/avg/?sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to District data"
  );

export const fetchDSDSBaseGeomData = (selectedSector, selectedHazard) =>
  fetchData(
    `users/vulndata/dsd/geom/avg/?sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to DSD data"
  );

export const fetchGNDSBaseGeomData = (selectedSector, selectedHazard) =>
  fetchData(
    `users/vulndata/gnd/avg/sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to GND data"
  );

export const fetchChartData = (selectedLayer, selectedSector, selectedHazard) =>
  fetchData(
    `users/vulndata/${selectedLayer}/avg/?sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to Load Chart data"
  );

export const fetchProvinceGeom = (selectedProvince) =>
  fetchData(
    `users/pd/pd=${selectedProvince}/`,
    null,
    "Failed to fetch province geom data"
  );

export const fetchProvinceVulnGeomData = (
  selectedProvince,
  selectedSector,
  selectedHazard
) =>
  fetchData(
    `users/vulndata/pd/geom/avg/?sec=${selectedSector}&hzd=${selectedHazard}`,
    null,
    "Failed to fetch province vuln data"
  );

export const fetchDivitionsVulnGeomData = (
  selectedProvince,
  selectedSector,
  selectedHazard
) =>
  fetchData(
    `users/vulndata/disd/avg/pd/pd=${selectedProvince}&sec=${selectedSector}&hzd=${selectedHazard}/`,
    null,
    "Failed to fetch province vuln data"
  );

export const fetchDSDVulnGeomData = (
  selectedProvince,
  selectedSector,
  selectedHazard
) =>
  fetchData(
    `users/vulndata/dsd/avg/pd/pd=${selectedProvince}&sec=${selectedSector}&hzd=${selectedHazard}/`,
    null,
    "Failed to fetch province vuln data"
  );

export const fetchProvinceGNDVulnGeomData = (
  selectedProvince,
  selectedSector,
  selectedHazard
) =>
  fetchData(
    `users/vulndata/gnd/avg/pd/pd=${selectedProvince}&sec=${selectedSector}&hzd=${selectedHazard}/`,
    null,
    "Failed to fetch province vuln data"
  );
