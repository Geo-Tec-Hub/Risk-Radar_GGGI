import PropTypes from "prop-types";
import { Dropdown, Space } from "antd";
import { fetchSectorList, fetchHazardList } from "../../utils/FetchData";
import { useEffect, useState } from "react";

export default function More({
  selectedSector,
  setSelectedSector,
  selectedHazard,
  setSelectedHazard,
  selectedProvince,
  setSelectedProvince,
  setSelectedView,
  selectedView,
}) {
  const [hazardList, setHazardList] = useState([]);
  const [sectorList, setSectorList] = useState([]);
  const [provinceList, setProvinceList] = useState([]);

  const [sectorItems, setSectorItems] = useState([]);
  const [hazardItems, setHazardItems] = useState([]);
  const [provinceItems, setProvinceItems] = useState([]);

  useEffect(() => {
    const provinces = [
      { id: 1, name: "Central" },
      { id: 2, name: "Eastern" },
      { id: 3, name: "North Central" },
      { id: 4, name: "Northern" },
      { id: 5, name: "North Western" },
      { id: 6, name: "Sabaragamuwa" },
      { id: 7, name: "Southern" },
      { id: 8, name: "Uva" },
      { id: 9, name: "Western" },
    ];

    setProvinceList(provinces);
  }, []);

  useEffect(() => {
    const getSectorList = async () => {
      const data = await fetchSectorList();
      setSectorList(data || []);
    };

    const getHazardList = async () => {
      const data = await fetchHazardList();
      setHazardList(data || []);
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

  const handleProvinceMenuClick = (value) => {
    setSelectedProvince(value);
  };

  useEffect(() => {
    if (sectorList.length) {
      const mappedItems = sectorList.map((sector) => ({
        label: sector.sec,
        key: sector.sec_id,
        onClick: () => handleSectorMenuClick(sector.sec),
      }));
      setSectorItems(mappedItems);
    }

    if (hazardList.length) {
      const mappedItems = hazardList.map((hazard) => ({
        label: hazard.hazard,
        key: hazard.hzd_id,
        onClick: () => handleHazardMenuClick(hazard.hazard),
      }));
      setHazardItems(mappedItems);
    }

    if (provinceList.length) {
      const mappedItems = provinceList.map((province) => ({
        label: province.name,
        key: province.id,
        onClick: () => handleProvinceMenuClick(province.name),
      }));
      setProvinceItems(mappedItems);
    }
  }, [sectorList, hazardList, provinceList]);

  const handleSectorViewClick = (value) => {
    setSelectedView(value);
  };

  useEffect(() => {
    if (selectedHazard && selectedSector) {
      setSelectedView("pd");
    }
  }, [selectedHazard, selectedSector, setSelectedView]);

  return (
    <div className="w-full h-fit flex">
      <div className="flex w-11/12 mx-auto mt-5">
        <div className="w-full flex justify-center flex-wrap">
          <div className="flex flex-wrap space-y-5 max-w-60">
            <div className="flex flex-wrap w-full">
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
              <label className="w-full" htmlFor="hazard">
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
            <div className="flex flex-wrap w-full">
              <label className="w-full" htmlFor="province">
                Select Province
              </label>
              <Dropdown
                className="bg-cyan-700 w-full rounded-md text-white"
                menu={{
                  items: provinceItems,
                  style: {
                    maxHeight: 200,
                    overflow: "auto",
                    textWrap: "nowrap",
                  },
                }}
              >
                <button onClick={(e) => e.preventDefault()}>
                  <Space>{selectedProvince || "No Province Selected"}</Space>
                </button>
              </Dropdown>
            </div>
            <div className="flex flex-wrap w-full space-y-2 mt-4">
              <label className="w-full" htmlFor="layer">
                Select Layer
              </label>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedView === "pd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => handleSectorViewClick("pd")}
              >
                Province
              </button>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedView === "disd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => handleSectorViewClick("disd")}
              >
                District
              </button>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedView === "dsd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => handleSectorViewClick("dsd")}
              >
                DSD
              </button>
              <button
                className={`w-full rounded-md text-white font-bold ${
                  selectedView === "gnd" ? "bg-blue-700" : "bg-cyan-700"
                }`}
                onClick={() => handleSectorViewClick("gnd")}
              >
                GND
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

More.propTypes = {
  selectedSector: PropTypes.string,
  setSelectedSector: PropTypes.func.isRequired,
  selectedHazard: PropTypes.string,
  setSelectedHazard: PropTypes.func.isRequired,
  selectedProvince: PropTypes.string,
  setSelectedProvince: PropTypes.func.isRequired,
  selectedView: PropTypes.string,
  setSelectedView: PropTypes.func.isRequired,
};
