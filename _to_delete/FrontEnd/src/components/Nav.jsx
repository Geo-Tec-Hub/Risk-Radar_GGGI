import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo/logo.png";

export default function Nav() {
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setToken(token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <nav className="w-screen h-full bg-gray-300 py-2">
      <div className="flex justify-between w-11/12 mx-auto">
        <div className="flex items-center w-40 h-10">
          <a href="/">
            <img
              className="w-full h-full object-contain"
              src={logo}
              alt="Logo"
            />
          </a>
        </div>
        <ul className="flex items-center gap-7">
          <li>
            <a
              className="bg-cyan-700 px-6 py-1 rounded-xl text-white font-bold"
              href="/"
            >
              Home
            </a>
          </li>
          <li>
            <a
              className="bg-cyan-700 px-6 py-1 rounded-xl text-white font-bold"
              href="/about"
            >
              About
            </a>
          </li>
          <li>
            <a
              className="bg-cyan-700 px-6 py-1 rounded-xl text-white font-bold"
              href="/add"
            >
              Add Data
            </a>
          </li>
          <li>
            <a
              className="bg-cyan-700 px-6 py-1 rounded-xl text-white font-bold"
              href="/data"
            >
              My Data
            </a>
          </li>
          <li>
            <button onClick={token ? handleLogout : handleLogin}>
              <span
                className={`px-6 py-1 rounded-xl font-bold ${
                  token ? "bg-red-300 text-black" : "bg-cyan-700 text-white"
                }`}
              >
                {token ? "Logout" : "Login"}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
