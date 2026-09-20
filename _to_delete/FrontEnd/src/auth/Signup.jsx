import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoPNG from "../assets/logo/logo.png";
import API from "../services/ApiServices";

export default function Signup() {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();

  const setToken = (token) => {
    localStorage.setItem("token", token);
  };

  const handleSignup = async () => {
    try {
      if (password.length < 8) {
        setErrorMessage("Password must be at least 8 characters long.");
        return;
      }
      const response = await API.post("users/register/", {
        first_name,
        last_name,
        email,
        password,
      });
      const token = response.data.token;
      setToken(token);
      setErrorMessage(null);
      setSuccessMessage("Account created successfully");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Signup failed", error);
      setErrorMessage("Email already exists. Please try another email.");
      setSuccessMessage(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Link to="/">
        <img src={LogoPNG} alt="Company Logo" className="w-32 mb-8" />
      </Link>
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      {errorMessage && <div className=" text-red-500">{errorMessage}</div>}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-500 text-white rounded">
          {successMessage}
        </div>
      )}
      <form className="bg-white p-6 rounded-lg shadow-md w-80">
        <div className="mb-4">
          <label htmlFor="fname" className="block text-gray-700">
            First Name:
          </label>
          <input
            id="fname"
            type="text"
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="lname" className="block text-gray-700">
            Last Name:
          </label>
          <input
            id="lname"
            type="text"
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700">
            Email:
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700">
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-6 border border-gray-300 rounded"
          />
        </div>
        <div className="mb-4">
          <button
            type="button"
            onClick={handleSignup}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </button>
        </div>
      </form>

      <div className="mt-4 text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </div>
    </div>
  );
}
