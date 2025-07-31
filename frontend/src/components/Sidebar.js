import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("userEmail");

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        localStorage.removeItem("userEmail");
        navigate("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? "block py-2 mt-2 px-3 rounded bg-primary-500 transition duration-200"
      : "block py-2 mt-2 px-3 rounded transition duration-200 hover:bg-primary-500";
  };

  return (
    <div
      className={`inset-y-0 left-0 z-40 w-64 bg-dark-800 text-white p-4 flex flex-col transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0 fixed" : "-translate-x-full fixed"
      } md:translate-x-0 md:static md:min-h-screen`}
    >
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-bold">Code Editor</h2>
        <button
          onClick={onClose}
          className="md:hidden text-white text-2xl focus:outline-none"
        >
          &times;
        </button>
      </div>
      <nav>
        <ul>
          <li>
            <NavLink to="/" className={getNavLinkClass}>
              Compiler
            </NavLink>
          </li>
          <li>
            <NavLink to="/history" className={getNavLinkClass}>
              History
            </NavLink>
          </li>
        </ul>
      </nav>
      {isLoggedIn && (
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
