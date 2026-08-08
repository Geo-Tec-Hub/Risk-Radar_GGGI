/**
 * New Virsion of DataView_SidePanle
 *
 * Changes:
 *      component - GndDataView --> DataViewPanel
 *      variables - gnd_id --> admin_area_id | *new --> admin_level | *new --> admin_area_name
 */
import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Label,
} from "recharts";

import APIs from "../../Services/APIs";
import Nodata from "../../../Assets/icons/no-data.png";

// TODO match to new variables 'admin_id' and 'admin_level'
const DataViewPanel = ({ admin_area_id, admin_area_name, admin_level }) => {
  const CustomYAxisTick = ({ x, y, payload }) => {
    const labelLines = payload.value.split("\n");

    return (
      <g transform={`translate(${x},${y})`}>
        {labelLines.map((line, index) => (
          <text
            key={index}
            x={0}
            y={index * 12}
            dy={0}
            textAnchor="end"
            fontSize={10}
          >
            {line}
          </text>
        ))}
      </g>
    );
  };

  const [chartDimensions, setChartDimensions] = useState(120);
  const [chartPosition, setChartPosition] = useState({
    width: 350,
    height: 300,
  });

  const [sectorList, setSectorList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [hazardData, setHazardData] = useState({
    flood: 0.0,
    drought: 0.0,
    rainfall: 0.0,
    landslides: 0.0,
    salt_water: 0.0,
    soil: 0.0,
    temperature: 0.0,
    tornado: 0.0,
    frost: 0.0,
    lightning: 0.0,
    thunder: 0.0,
    intensity_rainfall: 0.0,
    costal: 0.0,
  });
  const [adminLevel, setAdminLevel] = useState(null); //* for panel title

  if (admin_level === "gnd") {
    setAdminLevel("Grama Niladhari Division");
  } else if (admin_level === "dsd") {
    setAdminLevel("Divisional Secretariat Division");
  } else if (admin_level === "dist") {
    setAdminLevel("District");
  } else if (admin_level === "pd") {
    setAdminLevel("Province");
  } else {
    console.log("invalid admin level");
  }

  const sector_list_url = APIs() + "api/users/sector/";
  //   const gnd_ID = admin_id;    // * <-----chnage GND
  const admin_ID = admin_area_id;
  const admin_LEVEL = admin_level;

  // fetch sector list
  const fetchSectorData = async (api) => {
    try {
      const response = await fetch(api);
      const jsonData = await response.json();

      // Extract "sec" values from the fetched data
      const fetchedSecArray = jsonData.map((item) => item.sec);

      // Update the sectorList state with the fetched data
      setSectorList(fetchedSecArray);
    } catch (error) {
      console.error("Error fetching sector data:", error);
    }
  };

  // fetch hazard data
  const fetchHazardData = async (api) => {
    try {
      const response = await fetch(api);
      const jsonData = await response.json();
      setHazardData(jsonData);
    } catch (error) {
      console.error("Error fetching hazard data:", error);
    }
  };

  // sum of the hazard values
  const calculateSum = () => {
    const valuesArray = Object.values(hazardData);
    return valuesArray.reduce((acc, currentValue) => acc + currentValue, 0);
  };

  // on select function - fetch hazard data
  const handleSectorChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedSector(selectedValue);

    // generate graph api              //TODO admin_LEVEL value
    const hazard_tabel_api =
      APIs() +
      `api/users/vulndata/${admin_LEVEL}/avg/?sec=${selectedValue}&gnd_id=${admin_ID}`;

    // fetch hazard data when sector changes
    fetchHazardData(hazard_tabel_api);
    console.log(hazard_tabel_api);
  };

  useEffect(() => {
    // Fetch sector data when the component mounts
    fetchSectorData(sector_list_url);

    const handleResize = () => {
      // Set the width and height based on the screen width
      const newRadius = window.innerWidth < 1200 ? 80 : 120;

      const newWidth = window.innerWidth < 1200 ? 280 : 350;
      const newHeight = window.innerWidth < 1200 ? 220 : 300;

      setChartDimensions(newRadius);
      setChartPosition({ width: newWidth, height: newHeight });
    };

    // Attach the event listener
    window.addEventListener("resize", handleResize);

    // Call the handleResize function once to set initial dimensions
    handleResize();

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Convert hazard data into an array of objects suitable for pie chart
  const hazardDataArray = Object.entries(hazardData).map(([key, value]) => ({
    name: key,
    value: (value / 10) * 100,
  }));

  // Convert hazard data into an array of objects suitable for horizontal bar chart
  const barChartData = hazardDataArray.map((entry) => ({
    name: entry.name,
    value: entry.value,
  }));

  const customColors = [
    "#3498db",
    "#2ecc71",
    "#e74c3c",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#2c3e50",
    "#27ae60",
    "#d35400",
    "#34495e",
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#2c3e50",
    "#27ae60",
  ];

  // Filter out entries with 0 values
  const filteredHazardDataArray = hazardDataArray.filter(
    (entry) => entry.value !== 0
  );

  // Generate legend items based on the colors used in the pie chart
  const legend =
    filteredHazardDataArray.length > 0
      ? filteredHazardDataArray.map((entry) => {
          const colorIndex = customColors.findIndex(
            (color) =>
              color ===
              customColors.find(
                (c, index) => entry.name === hazardDataArray[index].name
              )
          );
          return (
            <div key={entry.name} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: customColors[colorIndex] }}
              ></div>
              <div className="legend-name">{entry.name}</div>
            </div>
          );
        })
      : null;

  const handleRefresh = () => {
    // Trigger data fetching when the refresh button is clicked
    fetchHazardData(
      `${APIs()}api/users/vulndata/gnd/avg/?sec=${selectedSector}&gnd_id=${gnd_ID}`
    );
  };

  // if no data to show
  if (calculateSum() === 0) {
    return (
      <div className="gnd-data-form">
        <label htmlFor="sector">Sector Name: </label>
        <select
          id="sector_list"
          name="sector"
          value={selectedSector}
          onChange={handleSectorChange}
        >
          <option value="" disabled>
            Select a Sector...
          </option>
          {sectorList.map((sector, index) => (
            <option key={index} value={sector}>
              {sector}
            </option>
          ))}
        </select>
        <button onClick={handleRefresh} className="refresh-button">
          ↻ Refresh
        </button>

        <div className="no-data-message">
          <img src={Nodata} alt="No Data Icon" className="no-data-image" />
          No data to show
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="gnd-data-form">
        {/* Sector Dropdown list */}
        <h5>Selected {adminLevel}</h5>
        <p>
          <b>Name: </b>
          {admin_area_name} | <b>ID: </b>
          {admin_area_id}
        </p>
        <label htmlFor="sector">Sector Name: </label>
        <select
          id="sector_list"
          name="sector"
          value={selectedSector}
          onChange={handleSectorChange}
        >
          {/* Empty option */}
          <option value="" disabled>
            Select a Sector...
          </option>
          {/* Other options */}
          {sectorList.map((sector, index) => (
            <option key={index} value={sector}>
              {sector}
            </option>
          ))}
        </select>
        <button onClick={handleRefresh} className="refresh-button">
          ↻ Refresh
        </button>

        {/* Pie chart */}
        <div className="pie-chart-container">
          <PieChart width={chartPosition.width} height={chartPosition.height}>
            {/* Title */}
            <text x={0} y={20} className="chart-title">
              Comparison of Hazards
            </text>

            {/* Pie */}
            <Pie
              data={hazardDataArray}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={chartDimensions}
              fill="#3498db"
            >
              {hazardDataArray.map((entry, index) => (
                <Cell key={index} fill={customColors[index]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${((value / calculateSum()) * 10).toFixed(1)}%`,
                name,
              ]}
            />
          </PieChart>
          {/* Legend */}
          <div className="legend-container">{legend}</div>
        </div>

        {/* Horizontal bar chart */}
        <div className="bar-chart-container">
          {/* Title */}
          <text x={0} y={20} className="chart-title">
            Hazard Magnitude Percent
          </text>

          <BarChart
            width={chartPosition.width}
            height={350}
            data={barChartData}
            margin={{ top: 10, right: 0, left: 80, bottom: 0 }}
            layout="vertical" // Set layout to vertical for horizontal bar chart
            barCategoryGap={0}
          >
            <XAxis
              type="number"
              tickFormatter={(value) => `${value}%`}
              fontSize={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              fontSize={10}
              interval={0}
              angle={-0}
              tick={<CustomYAxisTick />}
            />
            <Tooltip
              formatter={(value, name, props) => [
                `${((value / 10) * 10).toFixed(1)}%`,
                name,
              ]}
            />
            <Bar dataKey="value" fill="#005be3" />
          </BarChart>
        </div>
      </div>
    </div>
  );
};

export default DataViewPanel;
