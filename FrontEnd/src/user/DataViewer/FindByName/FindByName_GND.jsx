import React, { useState, useEffect } from "react";
import "../../User.css"; // Assuming you have your CSS file here
import API from "../../../services/ApiServices";

import DataInput_v3 from "../DataInput_SidePanel_v3";

const FindByName_GND = () => {
  const [pdDropdownData, setPdDropdownData] = useState([]);
  const [selectedPdValue, setSelectedPdValue] = useState("");

  const [disdDropdownData, setDisdDropdownData] = useState([]);
  const [selectedDisdValue, setSelectedDisdValue] = useState("");
  const [isDisdDropdownActive, setDisdDropdownActive] = useState(false);

  const [dsdDropdownData, setDsdDropdownData] = useState([]);
  const [selectedDsdValue, setSelectedDsdValue] = useState("");
  const [isDsdDropdownActive, setDsdDropdownActive] = useState(false);

  const [gndList, setGndList] = useState([]);
  const [isAnyCheckboxChecked, setIsAnyCheckboxChecked] = useState(false);

  const [showDataInputPanel, setShowDataInputPanel] = useState(false);
  const [adminAreaList, setAdminAreaList] = useState([]);

  const [adminAreaIdList, setAdminAreaIdList] = useState([]);

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

  // GET dsd list for dropdown
  useEffect(() => {
    const fetchDsdData = async () => {
      try {
        if (selectedDisdValue) {
          const response = await API.get(
            "users/dsd/sql/?disd=" + selectedDisdValue
          );
          const data = await response.data;

          const features = data.features || [];
          const dsdValues = features
            .map((feature) => feature.properties?.dsd)
            .filter(Boolean);

          setDsdDropdownData(dsdValues);
          setDsdDropdownActive(true);
        } else {
          // Reset dsd dropdown when disd value is empty
          setDsdDropdownData([]);
          setDsdDropdownActive(false);
        }
      } catch (error) {
        console.error("Error fetching dsd dropdown data:", error);
      }
    };

    fetchDsdData();
  }, [selectedDisdValue]);

  // GET GND list of selected DSD
  useEffect(() => {
    const fetchGndData = async () => {
      try {
        const response = await API.get(
          "users/gnd/sql/?dsd=" + selectedDsdValue
        );
        const data = await response.data;

        const features = data.features || [];
        const gndList = features
          .map((feature) => ({
            name: feature.properties?.gnd,
            gid: feature.properties?.gid,
            checked: false,
          })) // Adding checked property to each gnd
          .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

        setGndList(gndList);
      } catch (error) {
        console.error("Error fetching gnd dropdown data:", error);
      }
    };

    fetchGndData();
  }, [selectedDsdValue]);

  useEffect(() => {
    setIsAnyCheckboxChecked(gndList.some((gnd) => gnd.checked));
  }, [gndList]);

  const handlePdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedPdValue(selectedValue);
    setSelectedDisdValue(""); // Reset the disd dropdown value when the pd dropdown changes
    setSelectedDsdValue("");
  };

  const handleDisdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedDisdValue(selectedValue);
    setSelectedDsdValue("");
  };

  const handleDsdDropdownChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedDsdValue(selectedValue);
  };

  const handleCheckboxChange = (index) => {
    const updatedGndList = gndList.map((gnd, i) => {
      if (i === index) {
        return { ...gnd, checked: true };
      } else {
        return { ...gnd, checked: false };
      }
    });

    setGndList(updatedGndList);
  };

  const handleAddDataButton = () => {
    // Get the names and GIDs of the selected GNDs
    const selectedGnds = gndList
      .filter((gnd) => gnd.checked)
      .map((gnd) => gnd.name);

    const selectedGndIds = gndList
      .filter((gnd) => gnd.checked)
      .map((gnd) => gnd.gid);

    // Do something with the selected GNDs, for example:
    console.log(selectedGnds);
    console.log(selectedGndIds);
    setShowDataInputPanel(true);
    setAdminAreaList(selectedGnds);
    setAdminAreaIdList(selectedGndIds);
  };

  const handleDataInputClose = () => {
    setShowDataInputPanel(false);
  };

  return (
    <div>
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

      {isDsdDropdownActive && (
        <div className="findByName-dsd-dropdown">
          <label className="findByName-label" htmlFor="dsdDropdow">
            Divisional District:
          </label>
          <select
            className="findByName-select"
            id="dsdDropdown"
            value={selectedDsdValue}
            onChange={handleDsdDropdownChange}
          >
            <option value="" disabled>
              Select a Division
            </option>
            {dsdDropdownData.map((item, index) => (
              <option key={index} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* GND list */}
      <div className="checkbox-container">
        <div className="checkbox-list">
          {gndList.map((gnd, index) => (
            <div key={index} className="checkbox-item">
              <input
                type="checkbox"
                id={`gnd-${index}`}
                checked={gnd.checked}
                onChange={() => handleCheckboxChange(index)}
              />
              <label htmlFor={`gnd-${index}`}>{gnd.name}</label>
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
            <DataInput_v3
              admin_area_list={adminAreaList}
              admin_area_id_list={adminAreaIdList}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FindByName_GND;
