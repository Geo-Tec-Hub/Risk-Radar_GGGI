import React, { useState, useEffect } from "react";
import API from "../../services/ApiServices";
import "../User.css";
import { fetchUserData } from "../../utils/FetchData";

const DataInput = ({ gnd_id, onSubmit }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    sec: "",
    hzd: "",
    value: null,
  });

  const sectorListUrl = "users/sector/";
  const hazardListUrl = "users/hazard/";
  const submitAPI = "users/vulndataput/";

  const [sectorList, setSectorList] = useState([]);
  const [hazardList, setHazardList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedHzd, setSelectedHzd] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const [list1Selected, setList1Selected] = useState(false);
  const [list2Selected, setList2Selected] = useState(false);

  const [riskValue, setRiskValue] = useState(null);
  const [selectedOptionValue, setSelectedOptionValue] = useState({ value: 0 });
  const [isDisabled, setIsDisabled] = useState(false);
  const [sendRequestType, setSendRequestType] = useState(null);
  const [dataId, setDataId] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Fetch sector data
  const fetchSectorData = async () => {
    try {
      const response = await API.get(sectorListUrl);
      const jsonData = await response.data;
      const fetchedSecArray = jsonData.map((item) => item.sec);
      setSectorList(fetchedSecArray);
    } catch (error) {
      console.error("Error fetching sector data:", error);
    }
  };

  // Fetch hazard data
  const fetchHazardData = async () => {
    try {
      const response = await API.get(hazardListUrl);
      const jsonData = await response.data;
      const fetchedHazardArray = jsonData.map((item) => item.hazard);
      setHazardList(fetchedHazardArray);
    } catch (error) {
      console.error("Error fetching hazard data:", error);
    }
  };

  // Fetch user email
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token is missing. Redirect to login page.");
        return;
      }
      const data = await fetchUserData(token);
      setUserInfo({ email: data.email, id: data.id });
    } catch (error) {
      console.error("Error fetching user information", error);
    }
  };

  const handleSectorChange = (e) => {
    const { value } = e.target;
    setSelectedSector(value);
    setFormData((prevData) => ({ ...prevData, sec: value }));
    setList1Selected(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedHzd(value);
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setList2Selected(true);
  };

  const handleValueDropdownChange = (e) => {
    setSelectedOptionValue({ ...formData, value: e.target.value });
  };

  const functionOnListSelection = async () => {
    if (list1Selected && list2Selected) {
      setIsDisabled(true);
      const APIEndpoint = `users/vulndata/check/?user_id=${userInfo.email}&gnd_id=${gnd_id}&sec=${selectedSector}&hzd=${formData.hzd}`;
      try {
        const response = await API.get(APIEndpoint);
        const jsonData = await response.data;

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const fetchedValue = jsonData[0].value;
          const fetchedID = jsonData[0].id;
          setDataId(fetchedID);
          setRiskValue(fetchedValue);
          setSendRequestType("put");
          setSelectedOptionValue({ value: fetchedValue });
        } else {
          setSendRequestType("post");
          setSelectedOptionValue({ value: 0 });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  const EditDropdownValue = () => {
    setIsDisabled(false);
    setSelectedOptionValue({ value: 0 });
  };

  // Submit data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        user_id: formData.user_id,
        gnd_id: parseInt(gnd_id),
        sec: formData.sec,
        hzd: formData.hzd,
        value: selectedOptionValue.value,
      };

      let response;
      if (sendRequestType === "post") {
        response = await API.post(submitAPI, dataToSend);
      } else if (sendRequestType === "put") {
        response = await API.put(`${submitAPI}${dataId}/`, dataToSend);
      }

      if (response.status >= 200 && response.status < 300) {
        console.log("Data submitted successfully");
        setSubmittedData(sendRequestType === "post" ? "Saved" : "Updated");
        MessageCenter(
          sendRequestType === "post"
            ? "Data Successfully Saved"
            : "Data Successfully Updated"
        );
        onSubmit(formData);
      } else {
        console.error("Failed to submit data", response);
      }
    } catch (error) {
      console.error("Error submitting data", error);
    }
  };

  const MessageCenter = (message) => {
    window.alert(message);
    setIsDisabled(true);
  };

  useEffect(() => {
    fetchSectorData();
    fetchHazardData();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    functionOnListSelection();
  }, [list1Selected, list2Selected]);

  useEffect(() => {
    if (userInfo && userInfo.email) {
      setFormData((prevData) => ({
        ...prevData,
        user_id: userInfo.email,
      }));
    }
  }, [userInfo]);

  return (
    <div className="data-input-form-container">
      <h3>Data Editor</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="user_id">User ID:</label>
        <input
          type="text"
          id="user_id"
          name="user_id"
          value={formData.user_id}
          onChange={handleChange}
          readOnly
        />

        <label htmlFor="gnd_id">GND ID:</label>
        <h4>{gnd_id}</h4>

        <label htmlFor="sec">Sector:</label>
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

        <label htmlFor="hzd">Hazard:</label>
        <select
          id="hazard_list"
          name="hzd"
          value={formData.hzd}
          onChange={handleChange}
        >
          <option value="" disabled>
            Select a Hazard...
          </option>
          {hazardList.map((hazard, index) => (
            <option key={index} value={hazard}>
              {hazard}
            </option>
          ))}
        </select>

        <label htmlFor="value">Value:</label>
        <div>
          <select
            id="value_list"
            name="value"
            value={selectedOptionValue.value}
            onChange={handleValueDropdownChange}
            disabled={isDisabled}
            className="values-dropdown"
            style={{ fontSize: "14px" }}
          >
            <option value={0} disabled>
              Select a value...
            </option>
            {[...Array(10).keys()].map((val) => (
              <option key={val} value={val + 1}>
                {val + 1}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="edit-dropdown-button"
            onClick={EditDropdownValue}
          >
            Edit
          </button>
        </div>
        <button className="user-data-submit-button" type="submit">
          Save Data
        </button>
      </form>
    </div>
  );
};

export default DataInput;
