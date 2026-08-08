import React, { useState, useEffect } from "react";
import "../../User.css"; // Import your CSS file
import APIs from "../../../Services/APIs";

const DataAnalyse_Tabel = (props) => {
  const sector = props.sector;
  const hazard = props.hazard;
  const adminLevel = props.adminLevel;

  const [data, setData] = useState({});
  // analyzegnd
  const tableAPI =
    APIs() +
    "api/users/vulndata/" +
    adminLevel +
    "/avg/" +
    (adminLevel === "gnd" ? "sec=" : "?sec=") +
    sector +
    "&hzd=" +
    hazard;

  function getGndData(jsonData) {
    let gndData = {};
    // Iterate over each feature in the GeoJSON data
    jsonData.features.forEach((feature) => {
      // Check if the feature has 'gnd' and 'avg' properties
      if (
        feature.properties &&
        feature.properties.gnd &&
        feature.properties.avg
      ) {
        // Assign 'gnd' as key and 'avg' as value in the object
        gndData[feature.properties.gnd] = feature.properties.avg;
      }
    });
    return gndData;
  }

  useEffect(() => {
    fetchData();
  }, [sector, hazard, adminLevel]);

  const fetchData = async () => {
    try {
      console.log(adminLevel);
      const response = await fetch(tableAPI);
      const jsonData = await response.json();
      if (adminLevel === "gnd") {
        const gndData = getGndData(jsonData);
        console.log(gndData);
        setData(gndData);
      } else {
        setData(jsonData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };
  return (
    <div>
      <h2 className="chart-title">Average Values</h2>
      {/* <div className="print-button-container">
        <button onClick={handlePrint}>Print Table</button>
      </div> */}
      <div className="table-container">
        <div id="table-content">
          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data).map(([region, average]) => (
                <tr key={region}>
                  <td>{region}</td>
                  <td>{((average / 10) * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataAnalyse_Tabel;

////
