import { useState, useEffect } from "react";
import API from "../../services/ApiServices";
import "../User.css";
import { fetchUserData } from "../../utils/FetchData";

const DataInput_dsd = ({ dsd_list, gnd_id_list }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    sec: "",
    hzd: "",
    value: null,
  });

  const sectorListUrl = "users/sector/";
  const hazardListUrl = "users/hazard/";
  const [sectorList, setSectorList] = useState([]);
  const [hazardList, setHazardList] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedHzd, setSelectedHzd] = useState("");
  const [userInfo, setUserInfo] = useState(null);

  const [isSectorSelected, setIsSectorSelected] = useState(false);
  const [isHazardSelected, setIsHazardSelected] = useState(false);

  const [selectedOptionValue, setSelectedOptionValue] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [sendRequestType, setSendRequestType] = useState("post");

  const [existingGNDs, setExistingGNDs] = useState([]);
  const [dataId, setDataId] = useState(null);
  const [existingValue, setExistingValue] = useState(null);

  const submitAPI = "users/vulndataput/";

  const fetchSectorData = async () => {
    try {
      const response = await API.get(sectorListUrl);
      const jsonData = response.data;
      const fetchedSecArray = jsonData.map((item) => item.sec);
      setSectorList(fetchedSecArray);
    } catch (error) {
      console.error("Error fetching sector data:", error);
    }
  };

  const fetchHazardData = async () => {
    try {
      const response = await API.get(hazardListUrl);
      const jsonData = response.data;
      const fetchedHazardArray = jsonData.map((item) => item.hazard);
      setHazardList(fetchedHazardArray);
    } catch (error) {
      console.error("Error fetching hazard data:", error);
    }
  };

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
    setIsSectorSelected(true);
  };

  const handleHazardChange = (e) => {
    const { name, value } = e.target;
    setSelectedHzd(value);
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setIsHazardSelected(true);
  };

  const handleValueDropdownChange = (e) => {
    setSelectedOptionValue(e.target.value);
  };

  const toggleDropdownEdit = () => {
    if (sendRequestType === "put" || sendRequestType === "post") {
      setIsDisabled(false);
    } else {
      console.error("Request type should be PUT or POST");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSectorSelected && isHazardSelected) {
      const requests = gnd_id_list.map(async (gnd_id) => {
        const dataToSend = {
          user_id: formData.user_id,
          gnd_id: gnd_id,
          sec: formData.sec,
          hzd: formData.hzd,
          value: selectedOptionValue,
        };

        try {
          const response = await API.post(submitAPI, dataToSend);
          if (response.ok) {
            console.log("Data submitted successfully for gnd_id:", gnd_id);
          } else {
            setExistingGNDs((prev) => [...prev, gnd_id]);
            const APIEndpoint = `users/vulndata/check/?user_id=${dataToSend.user_id}&gnd_id=${gnd_id}&sec=${dataToSend.sec}&hzd=${dataToSend.hzd}`;
            const checkResponse = await API.get(APIEndpoint);
            const checkData = checkResponse.data;
            const fetchedValue = checkData[0].value;
            const fetchedID = checkData[0].id;
            setDataId(fetchedID);
            setExistingValue(fetchedValue);
            const updateResponse = await API.put(
              `${submitAPI}${fetchedID}/`,
              dataToSend
            );
            console.log(updateResponse);
          }
        } catch (error) {
          console.error("Error submitting data for gnd_id:", gnd_id, error);
        }
      });

      // Wait for all API requests to complete
      await Promise.all(requests);

      // Show success message after all requests are done
      MessageCenter("Data Successfully Saved");
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
    if (userInfo && userInfo.email) {
      setFormData((prevData) => ({
        ...prevData,
        user_id: userInfo.email,
      }));
    }
  }, [userInfo]);

  return (
    <div>
      <div className="data-input-form-container">
        <h3>Data Editor</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="user_id">User ID:</label>
          <input
            type="text"
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleHazardChange}
            readOnly
          />

          <label htmlFor="gnd_id">Selected Area(s): {dsd_list}</label>

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
            onChange={handleHazardChange}
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
              value={selectedOptionValue}
              onChange={handleValueDropdownChange}
              disabled={isDisabled}
              className="values-dropdown"
              style={{ fontSize: `14px` }}
            >
              <option value={0} disabled>
                Select a value...
              </option>
              {[...Array(10)].map((_, i) => (
                <option key={i} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="edit-dropdown-button"
              onClick={toggleDropdownEdit}
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

export default DataInput_dsd;
