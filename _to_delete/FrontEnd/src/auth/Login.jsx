import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LogoPNG from "../assets/logo/logo.png";
import API from "../services/ApiServices";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, []);

  const handleLogin = async () => {
    try {
      const response = await API.post("users/login/", {
        email,
        password,
      });
      const token = response.data.token;
      localStorage.setItem("token", token);
      navigate("/");
    } catch (error) {
      setErrorMessage(
        "Authentication failed. Please check your email and password."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Link to="/">
        <img src={LogoPNG} alt="Company Logo" className="w-32 mb-8" />
      </Link>
      <h2 className="text-2xl font-bold mb-4">Login</h2>

      {errorMessage && <div className=" text-red-500">{errorMessage}</div>}

      <form className="bg-white p-6 rounded-lg shadow-md w-80">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Email:
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div>
          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Login
          </button>
        </div>
      </form>
      <div className="mt-4">
        Don t have an account?{" "}
        <Link to="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
