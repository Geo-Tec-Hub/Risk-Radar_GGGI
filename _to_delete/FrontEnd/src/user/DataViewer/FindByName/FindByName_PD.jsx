import { useState, useEffect } from "react";
import "../../User.css";
import API from "../../../services/ApiServices";

const FindByName_PD = () => {
  const [pdList, setPdList] = useState([]);
  const [isAnyCheckboxChecked, setIsAnyCheckboxChecked] = useState(false);

  const [showDataInputPanel, setShowDataInputPanel] = useState(false);

  const [gndIDList, setGndIDList] = useState([]);
  const [selectedPdValues, setSelectedPdValues] = useState([]);

  const handleDataInputClose = () => {
    setShowDataInputPanel(false);
  };

  //GET Province name list
  useEffect(() => {
    const fetchPdData = async () => {
      try {
        const response = await API.get("users/pd/");
        const data = await response.data;

        const features = data.features || [];
        const pdList = features
          .map((feature) => feature.properties?.pd)
          .filter(Boolean)
          .map((pd) => ({ name: pd, checked: false })); // Adding checked property to each pd

        setPdList(pdList);
      } catch (error) {
        console.error("Error fetching pd dropdown data:", error);
      }
    };

    fetchPdData();
  }, []);

  useEffect(() => {
    setIsAnyCheckboxChecked(pdList.some((pd) => pd.checked));
  }, [pdList]);

  const handleCheckboxChange = (index) => {
    const updatedPdList = [...pdList];
    updatedPdList[index].checked = !updatedPdList[index].checked;
    setPdList(updatedPdList);
  };

  const handleAddDataButton = async () => {
    setShowDataInputPanel(true);

    const checkedPdNames = pdList
      .filter((pd) => pd.checked)
      .map((pd) => pd.name);

    setSelectedPdValues(checkedPdNames);

    const gndIdApi = "users/vulndata/pd=" + checkedPdNames + "/";

    try {
      const response = await API.get(gndIdApi);
      const data = await response.json();

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
      <div className="checkbox-container">
        <div className="checkbox-list">
          {pdList.map((pd, index) => (
            <div key={index} className="checkbox-item">
              <input
                type="checkbox"
                id={`pd-${index}`}
                checked={pd.checked}
                onChange={() => handleCheckboxChange(index)}
              />
              <label htmlFor={`pd-${index}`}>{pd.name}</label>
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

            {/* temporary note */}
            <div style={{ textAlign: "center", marginTop: "50px" }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100"
                height="100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "10px" }}
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="8" />
              </svg>
              <h1
                style={{
                  color: "#FF6347",
                  fontSize: "36px",
                  marginBottom: "10px",
                }}
              >
                This Section is Under Construction...!
              </h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FindByName_PD;
