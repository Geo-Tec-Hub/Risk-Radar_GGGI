import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import "../../User.css";
import API from "../../../../services/apiConfig";

const DataAnalyse_Charts = (props) => {
  const sector = props.sector;
  const hazard = props.hazard;
  const adminLevel = props.adminLevel;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const baseAPI = "api/users/vulndata/";
  const chartAPI =
    baseAPI + adminLevel + "/avg/?sec=" + sector + "&hzd=" + hazard;

  useEffect(() => {
    if (adminLevel !== "dsd" && adminLevel !== "gnd") {
      fetchData();
    }
  }, [sector, hazard, adminLevel]);

  // display size cal
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial dimensions
    handleResize();

    // Listen for window resize event
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await API.get(chartAPI);
      const jsonData = response.data;
      setData(
        Object.entries(jsonData).map(([region, average]) => ({
          region,
          average: ((average / 10) * 100).toFixed(2),
        }))
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  return (
    <div className="data-chart-container">
      <h2 className="chart-title">Average {hazard} </h2>
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
          barSize={100}
          className="modern-bar-chart"
        >
          <XAxis
            dataKey="region"
            angle={20}
            textAnchor="start"
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip formatter={(value) => `${value}%`} />
          <Bar
            dataKey="average"
            fill="rgb(0, 109, 181)"
            radius={[0, 0, 0, 0]}
          />
          <ReferenceLine
            y={25}
            stroke="white"
            // label="25%"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <ReferenceLine
            y={50}
            stroke="white"
            // label="50%"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <ReferenceLine
            y={75}
            stroke="white"
            // label="75%"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DataAnalyse_Charts;
