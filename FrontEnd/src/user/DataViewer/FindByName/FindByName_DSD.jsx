import React, { useState, useEffect } from "react";
import "../../User.css"; // Assuming you have your CSS file here
import API from "../../../services/ApiServices";

import DataInput_dsd from "../DataInput_SidePanel_v4";

const FindByName_DSD = () => {
  const [pdDropdownData, setPdDropdownData] = useState([]);
  const [selectedPdValue, setSelectedPdValue] = useState("");

  const [disdDropdownData, setDisdDropdownData] = useState([]);
  const [selectedDisdValue, setSelectedDisdValue] = useState("");
  const [isDisdDropdownActive, setDisdDropdownActive] = useState(false);

  const [dsdList, setDsdList] = useState([]);
  const [selectedDsdValues, setSelectedDsdValues] = useState([]);
  const [isAnyCheckboxChecked, setIsAnyCheckboxChecked] = useState(false);

  const [showDataInputPanel, setShowDataInputPanel] = useState(false);

  const [gndIDList, setGndIDList] = useState([]);

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

  // GET district list for dropdown
  useEffect(() => {
    const fetchDisdData = async () => {
      try {
        if (selectedPdValue) {
          const response = await API.get(
            "users/disd/sql/?pd=" + selectedPdValue
          );
          const data = await response.data;

          const features = data.features || [];
          const disdValues = features
            .map((feature) => feature.properties?.disd)
            .filter(Boolean);

          setDisdDropdownData(disdValues);
          setDisdDropdownActive(true);
        } else {
          // Reset disd dropdown when pd value is empty
          setDisdDropdownData([]);
          setDisdDropdownActive(false);
        }
      } catch (error) {
        console.error("Error fetching disd dropdown data:", error);
      }
    };

    fetchDisdData();
  }, [selectedPdValue]);

  // GET district list
  useEffect(() => {
    const fetchDisdData = async () => {
      try {
        if (selectedPdValue) {
          const response = await API.get(
            "users/disd/sql/?pd=" + selectedPdValue
          );
          const data = await response.data;

          const features = data.features || [];
          const disdValues = features
            .map((feature) => feature.properties?.disd)
            .filter(Boolean);

          setDisdDropdownData(disdValues);
          setDisdDropdownActive(true);
        } else {
          // Reset disd dropdown when pd value is empty
          setDisdDropdownData([]);
          setDisdDropdownActive(false);
        }
      } catch (error) {
        console.error("Error fetching disd dropdown data:", error);
      }
    };

    fetchDisdData();
  }, [selectedPdValue]);

  // GET DSD list of selected district
  useEffect(() => {
    const fetchDsdData = async () => {
      try {
        const response = await API.get(
          "users/dsd/sql/?disd=" + selectedDisdValue
        );
        const data = await response.data;

        const features = data.features || [];
        const dsdList = features
          .map((feature) => feature.properties?.dsd)
          .filter(Boolean)
          .map((dsd) => ({ name: dsd, checked: false })); // Adding checked property to each pd
        //   .sort((a, b) => a.name.localeCompare(b.name));

        setDsdList(dsdList);
      } catch (error) {
        console.error("Error fetching pd dropdown data:", error);
      }
    };

    fetchDsdData();
  }, [selectedDisdValue]);

  useEffect(() => {
    setIsAnyCheckboxChecked(dsdList.some((dsd) => dsd.checked));
  }, [dsdList]);

  const handlePdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedPdValue(selectedValue);
    setSelectedDisdValue(""); // Reset the second dropdown value when the first dropdown changes
  };

  const handleDisdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedDisdValue(selectedValue);
  };

  const handleCheckboxChange = (index) => {
    const updatedDsdList = dsdList.map((dsd, i) => ({
      ...dsd,
      checked: i === index ? !dsd.checked : false,
    }));
    setDsdList(updatedDsdList);
  };

  const handleAddDataButton = async () => {
    setShowDataInputPanel(true);

    const checkedDsdNames = dsdList
      .filter((dsd) => dsd.checked)
      .map((dsd) => dsd.name);

    setSelectedDsdValues(checkedDsdNames);

    const gndIdApi = "users/vulndata/dsd=" + checkedDsdNames + "/";
    console.log(gndIdApi);

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
          Province:0
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

      {isDisdDropdownActive && (
        <div className="findByName-disd-dropdown">
          <label className="findByName-label" htmlFor="disdDropdow">
            District:
          </label>
          <select
            className="findByName-select"
            id="disdDropdown"
            value={selectedDisdValue}
            onChange={handleDisdDropdownChange}
          >
            <option value="" disabled>
              Select a District
            </option>
            {disdDropdownData.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* DSD list */}
      <div className="checkbox-container">
        <div className="checkbox-list">
          {dsdList.map((dsd, index) => (
            <div key={index} className="checkbox-item">
              <input
                type="checkbox"
                id={`dsd-${index}`}
                checked={dsd.checked}
                onChange={() => handleCheckboxChange(index)}
              />
              <label htmlFor={`dsd-${index}`}>{dsd.name}</label>
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
          Add data to selected provinces
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
              pd={selectedPdValue}
              disd={selectedDisdValue}
              dsd_list={selectedDsdValues}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FindByName_DSD;
