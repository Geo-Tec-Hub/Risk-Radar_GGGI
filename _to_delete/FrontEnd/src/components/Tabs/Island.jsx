import { Dropdown, Space } from "antd";
import { fetchSectorList, fetchHazardList } from "../../utils/FetchData";
import { useEffect, useState } from "react";

export default function Island({
  selectedSector,
  setSelectedSector,
  selectedHazard,
  setSelectedHazard,
  selectedLayer,
  setSelectedLayer,
}) {
  const [hazardList, setHazardList] = useState(null);
  const [sectorList, setSectorList] = useState(null);

  const [sectorItems, setSectorItems] = useState([]);
  const [hazardItems, setHazardItems] = useState([]);

  useEffect(() => {
    const getSectorList = async () => {
      const data = await fetchSectorList();
      if (data) {
        setSectorList(data);
      } else {
        setSectorList(null);
      }
    };

    const getHazardList = async () => {
      const data = await fetchHazardList();
      if (data) {
        setHazardList(data);
      } else {
        setHazardList(null);
      }
    };

    getSectorList();
    getHazardList();
  }, []);

  const handleSectorMenuClick = (value) => {
    setSelectedSector(value);
  };

  const handleHazardMenuClick = (value) => {
    setSelectedHazard(value);
  };

  useEffect(() => {
    if (sectorList) {
      const mappedItems = sectorList.map((sector) => ({
        label: sector.sec,
        key: sector.sec_id,
        onClick: () => handleSectorMenuClick(sector.sec),
      }));
      setSectorItems(mappedItems);
    }

    if (hazardList) {
      const mappedItems = hazardList.map((hazard) => ({
        label: hazard.hazard,
        key: hazard.hzd_id,
        onClick: () => handleHazardMenuClick(hazard.hazard),
      }));
      setHazardItems(mappedItems);
    }
  }, [sectorList, hazardList]);

  useEffect(() => {
    if (selectedHazard && selectedSector) {
      setSelectedLayer("pd");
    }
  }, [selectedHazard, selectedSector, setSelectedLayer]);

  return (
    <div className="w-fit mx-auto h-fit flex">
      <div className="flex w-11/12 mx-auto mt-5">
        <div className="w-full flex justify-center flex-wrap">
          <div className="flex flex-wrap space-y-5 max-w-60">
            <div className="flex flex-wrap w-full space-y-0">
              <label className="w-full" htmlFor="sector">
                Select Sector
              </label>
              <Dropdown
                className="bg-cyan-700 w-full rounded-md text-white"
                menu={{
                  items: sectorItems,
                  style: {
                    maxHeight: 200,
                    overflow: "auto",
                    textWrap: "nowrap",
                  },
                }}
              >
                <button onClick={(e) => e.preventDefault()}>
                  <Space>{selectedSector || "No Sector Selected"}</Space>
                </button>
              </Dropdown>
            </div>
            <div className="flex flex-wrap w-full">
              <label className="w-full" htmlFor="sector">
                Select Hazard
              </label>
              <Dropdown
                className="bg-cyan-700 w-full rounded-md text-white"
                menu={{
                  items: hazardItems,
                  style: {
                    maxHeight: 200,
                    overflow: "auto",
                    textWrap: "nowrap",
                  },
                }}
              >
                <button onClick={(e) => e.preventDefault()}>
                  <Space>{selectedHazard || "No Hazard Selected"}</Space>
                </button>
              </Dropdown>
            </div>
            <div className="flex flex-wrap w-full space-y-2">
              <label className="w-full mb-0 mt-4" htmlFor="layer">
                Select Layer
              </label>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedLayer === "pd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => setSelectedLayer("pd")}
              >
                Province
              </button>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedLayer === "disd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => setSelectedLayer("disd")}
              >
                District
              </button>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedLayer === "dsd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => setSelectedLayer("dsd")}
              >
                DSD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
