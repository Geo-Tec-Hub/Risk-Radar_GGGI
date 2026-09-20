import axios from "axios";

// Create an Axios instance with default configuration
const API = axios.create({
  baseURL: "https://riskradarback.geoinfobox.com/api/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Function to set the authorization token
export const setHeadersToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `token ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};

// Function to set the authorization token
export const deleteHeadersToken = () => {
  delete API.defaults.headers.common["Authorization"];
};

// Global error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error.response.data);
  }
);

export default API;
