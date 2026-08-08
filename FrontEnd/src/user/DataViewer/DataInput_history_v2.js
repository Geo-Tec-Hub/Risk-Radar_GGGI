import { useState, useEffect } from "react";
import { useSpring, animated } from "react-spring";
import axios from "axios";

import APIs from "../../Services/APIs";
import "../User.css";
import SearchIcon from "../../../Assets/icons/search-grey.png";

const DataInputHistoryPopup = ({ onClose }) => {
  const popupAnimation = useSpring({
    opacity: 1,
    transform: "scale(1)",
    from: { opacity: 0, transform: "scale(0.8)" },
    config: { duration: 100 },
  });

  const [historyData, setHistoryData] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");

  const [sortOrderDateCreated, setSortOrderDateCreated] = useState("asc");
  const [sortedDataDateCreated, setSortedDataDateCreated] = useState([]);

  const [sortOrderLastModified, setSortOrderLastModified] = useState("asc");
  const [sortedDataLastModified, setSortedDataLastModified] = useState([]);

  const handleSortDateCreated = () => {
    handleSort(
      "date_created",
      sortOrderDateCreated,
      setSortOrderDateCreated,
      setSortedDataDateCreated
    );
  };

  const handleSortLastModified = () => {
    handleSort(
      "date_updated",
      sortOrderLastModified,
      setSortOrderLastModified,
      setSortedDataLastModified
    );
  };

  const handleSort = (
    column,
    currentSortOrder,
    setSortOrder,
    setSortedData
  ) => {
    const newSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newSortOrder);

    const sorted = filteredData.slice().sort((a, b) => {
      const valueA = new Date(a[column]);
      const valueB = new Date(b[column]);

      return newSortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    setSortedData(sorted);
  };

  const handleFilterChange = (event) => {
    setFilterText(event.target.value);
  };

  const filteredData = historyData.filter(
    (data) =>
      data.sec.toLowerCase().includes(filterText.toLowerCase()) ||
      data.hzd.toLowerCase().includes(filterText.toLowerCase()) ||
      data.dsd.toLowerCase().includes(filterText.toLowerCase()) ||
      data.gnd.toLowerCase().includes(filterText.toLowerCase()) ||
      data.disd.toLowerCase().includes(filterText.toLowerCase()) ||
      data.pd.toLowerCase().includes(filterText.toLowerCase())
  );

  const downloadCSV = () => {
    const csvData = convertToCSV(filteredData);
    const blob = new Blob([csvData], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "historyData.csv";
    link.click();
  };

  const convertToCSV = (data) => {
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    return [header, ...rows].join("\n");
  };

  const formatDate = (datetime) => {
    const date = new Date(datetime);
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("Token is missing. Redirect to login page.");
          return;
        }
        const response = await fetch(APIs() + "api/users/me/", {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserEmail(data.email);
        } else {
          console.error("Failed to fetch user information");
        }
      } catch (error) {
        console.error("Error fetching user information", error);
      }
    };

    fetchUserInfo();

    const fetchData = async () => {
      try {
        const response = await axios.get(
          APIs() + "/api/users/vulndata/history/?user_id=" + userEmail
        );

        if (response.data && Array.isArray(response.data)) {
          setHistoryData(response.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) {
      fetchData();
    }
  }, [userEmail]);

  return (
    <div className="data-input-history-container">
      <div className="data-input-history-overlay" onClick={onClose}></div>
      <animated.div style={popupAnimation} className="data-input-history-popup">
        <div className="popup-window-top">
          <h4>Data Input History</h4>
          <button className="popup-close-button" onClick={onClose}>
            <span>&times;</span>
          </button>
          <button
            title="Save data on the table"
            className="download-button"
            onClick={downloadCSV}
          >
            Export as a CSV
          </button>

          <div className="filter-container">
            <img className="filter-image" src={SearchIcon} alt="Search" />
            <input
              type="text"
              id="filterText"
              value={filterText}
              onChange={handleFilterChange}
              placeholder="Filter by Location name/ Sector/ Hazard"
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th className="th-1">Data ID</th>
                <th className="th-2">Province</th>
                <th className="th-1">District</th>
                <th className="th-2">DSD</th>
                <th className="th-1">GND Name</th>
                <th className="th-2">Sector</th>
                <th className="th-1">Hazard</th>
                <th className="th-2">Value</th>
                <th className="th-1" onClick={handleSortDateCreated}>
                  Date Created {sortOrderDateCreated === "asc" ? "▲" : "▼"}
                </th>
                <th className="th-2">Last Modified</th>
                {/* <th className="th-2" onClick={handleSortLastModified}>
                  Last Modified {sortOrderLastModified === "asc" ? "▲" : "▼"}
                </th> */}
              </tr>
            </thead>
            <tbody>
              {sortedDataDateCreated.length > 0
                ? sortedDataDateCreated.map((data) => (
                    <tr key={data.id}>
                      <td className="td-1">{data.id}</td>
                      <td className="td-2">{data.pd}</td>
                      <td className="td-1">{data.disd}</td>
                      <td className="td-2">{data.dsd}</td>
                      <td className="td-1">{data.gnd}</td>
                      <td className="td-2">{data.sec}</td>
                      <td className="td-1">{data.hzd}</td>
                      <td className="td-2">{data.value}</td>
                      <td className="td-1">{formatDate(data.date_created)}</td>
                      <td className="td-2">{formatDate(data.date_updated)}</td>
                    </tr>
                  ))
                : sortedDataLastModified.length > 0
                ? sortedDataLastModified.map((data) => (
                    <tr key={data.id}>
                      <td className="td-1">{data.id}</td>
                      <td className="td-2">{data.pd}</td>
                      <td className="td-1">{data.disd}</td>
                      <td className="td-2">{data.dsd}</td>
                      <td className="td-1">{data.gnd}</td>
                      <td className="td-2">{data.sec}</td>
                      <td className="td-1">{data.hzd}</td>
                      <td className="td-2">{data.value}</td>
                      <td className="td-1">{formatDate(data.date_created)}</td>
                      <td className="td-2">{formatDate(data.date_updated)}</td>
                    </tr>
                  ))
                : filteredData.map((data) => (
                    <tr key={data.id}>
                      <td className="td-1">{data.id}</td>
                      <td className="td-2">{data.pd}</td>
                      <td className="td-1">{data.disd}</td>
                      <td className="td-2">{data.dsd}</td>
                      <td className="td-1">{data.gnd}</td>
                      <td className="td-2">{data.sec}</td>
                      <td className="td-1">{data.hzd}</td>
                      <td className="td-2">{data.value}</td>
                      <td className="td-1">{formatDate(data.date_created)}</td>
                      <td className="td-2">{formatDate(data.date_updated)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </animated.div>
    </div>
  );
};

export default DataInputHistoryPopup;
