import PropTypes from "prop-types";
import { useState } from "react";
import Island from "./Tabs/Island";
import More from "./Tabs/More";

export default function Tab({
  setGeoData,
  setSelectedProvince,
  selectedProvince,
  setSelectedView,
  selectedView,
  selectedSector,
  setSelectedSector,
  selectedHazard,
  setSelectedHazard,
  selectedLayer,
  setSelectedLayer,
}) {
  const [selectedTab, setSelectedTab] = useState("island");

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setGeoData(null);
    setSelectedProvince(null);
    setSelectedView(null);
    setSelectedSector(null);
    setSelectedHazard(null);
    setSelectedLayer(null);
  };

  return (
    <>
      <div className="w-full bg-transparent flex">
        <button
          onClick={() => handleTabChange("island")}
          className={`w-1/2 font-bold rounded-md transition duration-700 ease-linear ${
            selectedTab === "island"
              ? "bg-cyan-700 text-white"
              : "bg-gray-300 text-black"
          }`}
        >
          All Island
        </button>
        <button
          onClick={() => handleTabChange("more")}
          className={`w-1/2 font-bold rounded-md transition duration-700 ease-linear ${
            selectedTab === "more"
              ? "bg-cyan-700 text-white"
              : "bg-gray-300 text-black"
          }`}
        >
          More
        </button>
      </div>
      <div className="w-full h-fit flex flex-nowrap transition duration-700 ease-linear">
        {selectedTab === "island" ? (
          <Island
            selectedSector={selectedSector}
            setSelectedSector={setSelectedSector}
            selectedHazard={selectedHazard}
            setSelectedHazard={setSelectedHazard}
            selectedLayer={selectedLayer}
            setSelectedLayer={setSelectedLayer}
          />
        ) : (
          <More
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
        )}
      </div>
    </>
  );
}

Tab.propTypes = {
  setGeoData: PropTypes.any,
  setSelectedProvince: PropTypes.any,
  selectedProvince: PropTypes.any,
  setSelectedView: PropTypes.any,
  selectedView: PropTypes.any,
  selectedSector: PropTypes.any,
  setSelectedSector: PropTypes.any,
  selectedHazard: PropTypes.any,
  setSelectedHazard: PropTypes.any,
  selectedLayer: PropTypes.any,
  setSelectedLayer: PropTypes.any,
};
