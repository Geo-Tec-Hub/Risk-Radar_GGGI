import { useEffect, useState } from "react";
import MapComponent from "../components/Map/MapComponent";
import Nav from "../components/Nav";
import Tab from "../components/Tab";
import {
  fetchDistrictsBaseGeomData,
  fetchDivitionsVulnGeomData,
  fetchDSDSBaseGeomData,
  fetchDSDVulnGeomData,
  fetchProvinceGeom,
  fetchProvinceGNDVulnGeomData,
  fetchProvincesBaseGeomData,
  fetchProvinceVulnGeomData,
} from "../utils/FetchData";
import ChartComponent from "../components/Chart/ChartComponent";
import { MenuOutlined } from "@ant-design/icons";

export default function Home() {
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedHazard, setSelectedHazard] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [provincesBaseGeomData, setProvincesBaseGeomData] = useState(null);
  const [districtsBaseGeomData, setDistrictsBaseGeomData] = useState(null);
  const [DSDsBaseGeomData, setDSDsBaseGeomData] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [date, setDate] = useState(null);
  const [viewState, setViewState] = useState(true);

  // TAB . MORE
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [selectedProvinceGeom, setSelectedProvinceGeom] = useState(null);
  const [selectedViewGeom, setSelectedViewGeom] = useState(null);

  const handleViewState = () => {
    setViewState(!viewState);
  };

  useEffect(() => {
    const getGeomData = async (
      selectedSector,
      selectedHazard,
      selectedLayer
    ) => {
      setViewState(false);
      switch (selectedLayer) {
        case "pd":
          setProvincesBaseGeomData(
            await fetchProvincesBaseGeomData(selectedSector, selectedHazard)
          );
          setDate(new Date().getTime());
          break;

        case "disd":
          setDistrictsBaseGeomData(
            await fetchDistrictsBaseGeomData(selectedSector, selectedHazard)
          );
          setDate(new Date().getTime());
          break;

        case "dsd":
          var dsdGeoData = await fetchDSDSBaseGeomData(
            selectedSector,
            selectedHazard
          );
          setDSDsBaseGeomData(dsdGeoData.features);
          setDate(new Date().getTime());
          break;

        default:
          setGeoData(null);
          setDate(new Date().getTime());
          break;
      }
    };
    if (selectedSector && selectedHazard && selectedLayer) {
      getGeomData(selectedSector, selectedHazard, selectedLayer);
    }
  }, [selectedSector, selectedHazard, selectedLayer]);

  useEffect(() => {
    const updateMap = async (
      selectedLayer,
      provincesBaseGeomData,
      districtsBaseGeomData,
      DSDsBaseGeomData
    ) => {
      if (
        selectedLayer &&
        (provincesBaseGeomData || districtsBaseGeomData || DSDsBaseGeomData)
      ) {
        setViewState(true);
        switch (selectedLayer) {
          case "pd":
            setGeoData(provincesBaseGeomData);
            setSelectedProvinceGeom(null);
            break;

          case "disd":
            setGeoData(districtsBaseGeomData);
            setSelectedProvinceGeom(null);
            break;

          case "dsd":
            setGeoData(DSDsBaseGeomData);
            setSelectedProvinceGeom(null);
            break;

          default:
            setGeoData(null);
            setSelectedProvinceGeom(null);
            break;
        }
      }
    };

    updateMap(
      selectedLayer,
      provincesBaseGeomData,
      districtsBaseGeomData,
      DSDsBaseGeomData
    );
  }, [
    selectedLayer,
    provincesBaseGeomData,
    districtsBaseGeomData,
    DSDsBaseGeomData,
  ]);

  useEffect(() => {
    const getGeomData = async (
      selectedSector,
      selectedHazard,
      selectedProvince,
      selectedView
    ) => {
      setViewState(false);
      const provincegeom = await fetchProvinceGeom(selectedProvince);
      setSelectedProvinceGeom(provincegeom);
      switch (selectedView) {
        case "pd":
          var viewGeom = await fetchProvinceVulnGeomData(
            selectedProvince,
            selectedSector,
            selectedHazard
          );
          // Filter the features based on selectedProvince
          var filteredFeatures = viewGeom.filter(
            (feature) => feature.properties.pd === selectedProvince
          );
          // Set the filtered features to setSelectedViewGeom
          setSelectedViewGeom(filteredFeatures);
          setDate(new Date().getTime());
          break;

        case "disd":
          var disdGeom = await fetchDivitionsVulnGeomData(
            selectedProvince,
            selectedSector,
            selectedHazard
          );
          setSelectedViewGeom(disdGeom.features);
          setDate(new Date().getTime());
          break;

        case "dsd":
          var dsdGeoData = await fetchDSDVulnGeomData(
            selectedProvince,
            selectedSector,
            selectedHazard
          );
          setSelectedViewGeom(dsdGeoData.features);
          setDate(new Date().getTime());
          break;

        case "gnd":
          var gndGeoData = await fetchProvinceGNDVulnGeomData(
            selectedProvince,
            selectedSector,
            selectedHazard
          );
          setSelectedViewGeom(gndGeoData.features);
          setDate(new Date().getTime());
          break;

        default:
          setGeoData(null);
          setDate(new Date().getTime());
          break;
      }
    };
    if (selectedSector && selectedHazard && selectedProvince && selectedView) {
      getGeomData(
        selectedSector,
        selectedHazard,
        selectedProvince,
        selectedView
      );
    }
  }, [selectedSector, selectedHazard, selectedProvince, selectedView]);

  useEffect(() => {
    const updateMap = async (selectedProvinceGeom, selectedViewGeom) => {
      setViewState(true);
      setGeoData(selectedViewGeom);
    };
    if (selectedProvinceGeom && selectedViewGeom) {
      updateMap(selectedProvinceGeom, selectedViewGeom);
    }
  }, [selectedProvinceGeom, selectedViewGeom]);

  return (
    <div className="flex flex-wrap">
      <Nav />
      <div className="flex h-full relative w-full">
        <div className="w-60 flex flex-wrap rounded-xl bg-gray-50 border-gray-400 border-2 mt-5 absolute z-10 py-8 ml-8">
          <Tab
            setGeoData={setGeoData}
            setSelectedProvince={setSelectedProvince}
            selectedProvince={selectedProvince}
            setSelectedView={setSelectedView}
            selectedView={selectedView}
            selectedSector={selectedSector}
            setSelectedSector={setSelectedSector}
            selectedHazard={selectedHazard}
            setSelectedHazard={setSelectedHazard}
            selectedLayer={selectedLayer}
            setSelectedLayer={setSelectedLayer}
          />
        </div>
        <MapComponent
          key={date}
          geoData={geoData}
          selectedLayer={selectedLayer}
          selectedView={selectedView}
          selectedProvinceGeom={selectedProvinceGeom}
          selectedSector={selectedSector}
          selectedHazard={selectedHazard}
          selectedProvince={selectedProvince}
        />
        <button
          onClick={handleViewState}
          className=" absolute right-0 h-fit mr-5"
        >
          <MenuOutlined style={{ fontSize: "30px" }} />
        </button>
        {geoData && viewState && (
          <div className="flex flex-wrap max-h-screen overflow-hidden overflow-y-auto absolute z-10 w-fit right-5 top-36 bg-gray-50 border-gray-400 px-4 py-5 rounded-lg border-2">
            <ChartComponent
              selectedSector={selectedSector}
              selectedHazard={selectedHazard}
              selectedLayer={selectedLayer}
            />
          </div>
        )}
      </div>
    </div>
  );
}
