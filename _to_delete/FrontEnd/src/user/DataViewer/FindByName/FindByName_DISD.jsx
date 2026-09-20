import { useState, useEffect } from "react";
import "../../User.css";
import API from "../../../services/ApiServices";

import DataInput_dsd from "../DataInput_SidePanel_v4";

const FindByName_DIST = () => {
  const [pdDropdownData, setPdDropdownData] = useState([]);
  const [selectedPdValue, setSelectedPdValue] = useState("");

  const [disdList, setDisdList] = useState([]);
  const [isAnyCheckboxChecked, setIsAnyCheckboxChecked] = useState(false);

  const [showDataInputPanel, setShowDataInputPanel] = useState(false);

  const [gndIDList, setGndIDList] = useState([]);
  const [selectedDisdValues, setSelectedDisdValues] = useState([]);

  const handleDataInputClose = () => {
    setShowDataInputPanel(false);
  };

  // GET province list for dropdown
  useEffect(() => {
    const fetchPdData = async () => {
      try {
        const response = await API.get("users/pd/");
        const data = await response.data;

        const features = data.features || [];
        const pdValues = features
          .map((feature) => feature.properties?.pd)
          .filter(Boolean);

        setPdDropdownData(pdValues);
      } catch (error) {
        console.error("Error fetching pd dropdown data:", error);
      }
    };

    fetchPdData();
  }, []);

  // GET Dictrict list of selected Province
  useEffect(() => {
    const fetchDisdData = async () => {
      try {
        const response = await API.get("users/disd/sql/?pd=" + selectedPdValue);
        const data = await response.data;

        const features = data.features || [];
        const disdList = features
          .map((feature) => feature.properties?.disd)
          .filter(Boolean)
          .map((disd) => ({ name: disd, checked: false })); // Adding checked property to each pd

        setDisdList(disdList);
      } catch (error) {
        console.error("Error fetching pd dropdown data:", error);
      }
    };

    fetchDisdData();
  }, [selectedPdValue]);

  useEffect(() => {
    setIsAnyCheckboxChecked(disdList.some((disd) => disd.checked));
  }, [disdList]);

  const handlePdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedPdValue(selectedValue);
  };

  const handleCheckboxChange = (index) => {
    const updatedDisdList = disdList.map((disd, i) => ({
      ...disd,
      checked: i === index ? !disd.checked : false,
    }));
    setDisdList(updatedDisdList);
  };

  const handleAddDataButton = async () => {
    setShowDataInputPanel(true);

    const checkedDisdNames = disdList
      .filter((disd) => disd.checked)
      .map((disd) => disd.name);

    setSelectedDisdValues(checkedDisdNames);

    const gndIdApi = "users/vulndata/disd=" + checkedDisdNames + "/";

    try {
      const response = await API.get(gndIdApi);
      const data = await response.data;

      // Extract gid values from the JSON data and populate an array
      const gndIDList = data.map((item) => item.gid);

      // Set the gndIDList state with the array of gid values
      setGndIDList(gndIDList);
    } catch (error) {
      console.error("Error fetching GND IDs:", error);
    }
  };

  return (
    <div>
      {/* province dropdown */}
      <div className="findByName-pd-dropdown">
        <label className="findByName-label" htmlFor="pdDropdown">
          Province:
        </label>
        <select
          className="findByName-select"
          id="pdDropdown"
          value={selectedPdValue}
          onChange={handlePdDropdownChange}
        >
          <option value="" disabled>
            Select a Province
          </option>
          {pdDropdownData.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* district list */}
      <div className="checkbox-container">
        <div className="checkbox-list">
          {disdList.map((disd, index) => (
            <div key={index} className="checkbox-item">
              <input
                type="checkbox"
                id={`disd-${index}`}
                checked={disd.checked}
                onChange={() => handleCheckboxChange(index)}
              />
              <label htmlFor={`disd-${index}`}>{disd.name}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          className="findbyname-add-data-button"
          disabled={!isAnyCheckboxChecked} // Disable button if no checkbox is checked
          onClick={handleAddDataButton}
        >
          Add data to selected Districts
        </button>
      </div>
      <div>
        {showDataInputPanel && (
          <div className="data-input-panel">
            <button
              className="data-input-close-button"
              onClick={handleDataInputClose}
            >
              <span>&times;</span>
            </button>
            <DataInput_dsd
              gnd_id_list={gndIDList}
              dsd_list={selectedDisdValues}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FindByName_DIST;
