import { useState } from "react";
import FindByName_PD from "./FindByName/FindByName_PD";
import FindByName_DISD from "./FindByName/FindByName_DISD";
import FindByName_DSD from "./FindByName/FindByName_DSD";
import FindByName_GND from "./FindByName/FindByName_GND";
import { PlusCircleOutlined } from "@ant-design/icons";

export default function DataViewerByName() {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [adminSelected, setAdminSelected] = useState("");

  const handleFindByNameClick = () => {
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const handleAdminDropdownChange = (event) => {
    setAdminSelected(event.target.value);
  };

  return (
    <div>
      <button
        className="flex absolute top-60 w-fit bg-blue-600 flex-wrap justify-center p-2 z-50 text-white font-bold"
        onClick={handleFindByNameClick}
      >
        <PlusCircleOutlined className="flex justify-center w-full text-center mx-auto font-bold text-2xl" />
        <span className="flex justify-center w-full text-center mx-auto">
          Add Data
        </span>
      </button>

      {isPopupVisible && (
        <div className="findByName-popup active">
          <div className="findByName-popup-content">
            <span className="findByName-close" onClick={closePopup}>
              &times;
            </span>
            <p>Select the admin level you want to enter data.</p>

            <div className="findByName-dropdown">
              <label className="findByName-label" htmlFor="adminDropdown">
                Data Input Level:
              </label>
              <select
                className="findByName-select"
                id="adminDropdown"
                value={adminSelected}
                onChange={handleAdminDropdownChange}
              >
                <option value="" disabled>
                  Select an Admin Level
                </option>
                <option value="District wise">District wise</option>
                <option value="Divisional Secretariat Division wise">
                  Divisional Secretariat Division wise
                </option>
                <option value="Grama Niladhari Division wise">
                  Grama Niladhari Division wise
                </option>
              </select>
            </div>

            {adminSelected === "Province wise" && (
              <div className="findByName-dropdown">
                <p className="information-text">
                  <i className="fas fa-info-circle"></i>
                  <i> Select one or more provinces to enter data.</i>
                </p>
                <FindByName_PD />
              </div>
            )}

            {adminSelected === "District wise" && (
              <div className="findByName-dropdown">
                <p className="information-text">
                  <i className="fas fa-info-circle"></i>
                  <i>
                    {" "}
                    Select one or more Districts under a province to enter data.
                  </i>
                </p>
                <FindByName_DISD />
              </div>
            )}

            {adminSelected === "Divisional Secretariat Division wise" && (
              <div className="findByName-dropdown">
                <p className="information-text">
                  <i className="fas fa-info-circle"></i>
                  <i>
                    {" "}
                    Select a "Province" {">"} "District" {">"} one or more
                    "Divisional Secretariat Division" to enter data.
                  </i>
                </p>
                <FindByName_DSD />
              </div>
            )}

            {adminSelected === "Grama Niladhari Division wise" && (
              <div className="findByName-dropdown">
                <p className="information-text">
                  <i className="fas fa-info-circle"></i>
                  <i>
                    {" "}
                    Select a "Province" {">"} "District" {">"} "Divisional
                    Secretariat Division" {">"} one or more "Grama Nildhari
                    Division" to enter data.
                  </i>
                </p>
                <FindByName_GND />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
