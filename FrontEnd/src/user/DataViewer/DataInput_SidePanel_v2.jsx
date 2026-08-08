import { useState, useEffect } from "react";
import API from "../../services/ApiServices";
import "../User.css";
import { fetchUserData } from "../../utils/FetchData";

const DataInput_v2 = ({ admin_area_list, gnd_id, onSubmit }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    admin_area: "[]",
    sec: "",
    hzd: "",
    value: null,
  });

  const sectorListUrl = "users/sector/";
  const hazardListUrl = "users/hazard/";
  const [sectorList, setSectorList] = useState([]);
  const [hazardList, setHazardList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedHzd, setSelectedHzd] = useState(""); // used for update selected item
  const [userInfo, setUserInfo] = useState(null);

  const submitAPInew = "users/vulndataput/";

  const [list1Selected, setList1Selected] = useState(null);
  const [list2Selected, setList2Selected] = useState(null);

  const [riskValue, setRiskValue] = useState(null); // according to user's choise
  const [selectedOptionValue, setSelectedOptionValue] = useState({ value: 0 });
  const [isDisabled, setIsDisabled] = useState(false);

  const [sendRequestType, setSendRequestType] = useState(null);

  const [dataId, setDataId] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  // Fetch sector data
  const fetchSectorData = async (api) => {
    try {
      const response = await API.get(api);
      const jsonData = await response.data;

      // Extract "sec" values from the fetched data
      const fetchedSecArray = jsonData.map((item) => item.sec);

      // Update the sectorList state with the fetched data
      setSectorList(fetchedSecArray);
    } catch (error) {
      console.error("Error fetching sector data:", error);
    }
  };

  // Fetch hazard data
  const fetchHazardData = async (api) => {
    try {
      const response = await API.get(api);
      const jsonData = await response.data;

      // Extract "hzd" values from the fetched data
      const fetchedHazardArray = jsonData.map((item) => item.hazard);

      // Update the hazardList state with the fetched data
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
      setUserInfo({
        email: data.email,
        id: data.id,
      });
    } catch (error) {
      console.error("Error fetching user information", error);
    }
  };

  const handleSectorChange = (e) => {
    const { value } = e.target;
    setSelectedSector(value);
    setFormData((prevData) => ({
      ...prevData,
      sec: value,
    }));

    setList1Selected(true);
    functionOnListSelection();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedHzd(formData.hzd);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setList2Selected(true);
    functionOnListSelection();
  };

  const handleValueDropdownChange = (e) => {
    setSelectedOptionValue({
      ...formData,
      value: e.target.value,
    });
  };

  const functionOnListSelection = async () => {
    setIsDisabled(true);
    console.log(list1Selected + " | " + list2Selected);
    if (list1Selected && list2Selected) {
      const User_email = userInfo.email;
      const sec = selectedSector;
      const hzd = formData.hzd;
      const API =
        "sers/vulndata/check/?user_id=" +
        User_email +
        "&gnd_id=" +
        gnd_id +
        "&sec=" +
        sec +
        "&hzd=" +
        hzd;

      try {
        const response = await fetch(API);
        const jsonData = await response.data;

        if (Array.isArray(jsonData) && jsonData.length > 0) {
          const fetchedValue = jsonData[0].value;
          const fetchedID = jsonData[0].id;
          setDataId(fetchedID);
          setRiskValue(fetchedValue);
          setSendRequestType("put");
          setSelectedOptionValue({ value: riskValue });
          console.log("put");
        } else {
          console.error("Empty response from the API");
          setSendRequestType("post");
          setSelectedOptionValue({ value: 0 });
          console.log("post");
        }
      } catch (error) {
        console.error("Error fetching sector data:", error);
      }
    }
  };

  const EditDropdownValue = () => {
    if (sendRequestType === "put") {
      console.log("PUT");
      setIsDisabled(false);
      setSelectedOptionValue({ value: 0 });
    } else if (sendRequestType === "post") {
      console.log("POST");
      setIsDisabled(false);
    } else {
      console.log("Type should PUT or POST");
    }
  };

  // submit form data
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        user_id: formData.user_id,
        admin_area_name: parseInt(admin_area_list), // Renamed from gnd_id to admin_area_name
        sec: formData.sec,
        hzd: formData.hzd,
        value: selectedOptionValue.value,
      };
      console.log(dataToSend);

      const response = await API.post(submitAPInew, dataToSend);

      // If using fetch instead of API.post
      // const response = await fetch(submitAPInew, {
      //   method: "POST",
      //   body: JSON.stringify(dataToSend),
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      // });

      if (response.ok) {
        console.log("Data submitted successfully");
        setSubmittedData("Saved");
        MessageCenter("Data Successfully Saved");
        // Additional actions after successful submission
        onSubmit(formData);
      } else {
        console.error("Failed to submit data");
        // Handle potential uniqueness constraint error here
      }
    } catch (error) {
      console.log(error);
    }
  };

  const MessageCenter = (message) => {
    window.alert(message);
    setIsDisabled(true);
  };

  useEffect(() => {
    // Fetch sector data when the component mounts
    fetchSectorData(sectorListUrl);

    // Fetch hazard data when the component mounts
    fetchHazardData(hazardListUrl);

    // Fetch user email
    fetchUserInfo();

    functionOnListSelection();
  }, [
    sectorListUrl,
    hazardListUrl,
    list1Selected,
    list2Selected,
    selectedSector,
    selectedHzd,
    riskValue,
  ]);

  // Update user_id once user information is fetched
  useEffect(() => {
    if (userInfo && userInfo.email) {
      setFormData((prevData) => ({
        ...prevData,
        user_id: userInfo.email,
      }));
    }
  }, [userInfo]);

  return (
    <div>
      Version 2
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
          <label htmlFor="admin_area">Administrative Area(s):</label>
          {/* <h4>{gnd_id}</h4> */}
          {/* selected area list */}
          <p>
            {" "}
            <b>{admin_area_list}</b>
          </p>

          <label htmlFor="sec">Sector:</label>
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
          <label htmlFor="hzd">Hazard:</label>
          <select
            id="hazard_list"
            name="hzd"
            value={formData.hzd}
            onChange={handleChange}
          >
            {/* Empty option */}
            <option value="" disabled>
              Select a Hazard...
            </option>
            {/* Other options */}
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
              // disabled={isDisabled}         // todo: uncomment and fix
              className="values-dropdown"
              style={{ fontSize: `14px` }}
            >
              <option value={0} disabled>
                Select a value...
              </option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
              <option value={9}>9</option>
              <option value={10}>10</option>
            </select>
            {/* need a button here */}
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
    </div>
  );
};

export default DataInput_v2;
