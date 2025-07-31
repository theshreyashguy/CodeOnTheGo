import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          credentials: "include", // Important for sending HttpOnly cookies
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("userEmail", data.email); // Store email
        console.log("Login successful:", data.message);
        // Redirect to a dashboard or home page after successful login
        navigate("/"); // Or wherever your main app content is
      } else {
        setError(data.error || "Login failed");
        console.error("Login error:", data.error);
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Fetch error:", err);
    }
  };

  return (
    <div className="bg-dark-900 text-gray-100 min-h-screen font-sans flex items-center justify-center">
      <div className="bg-dark-800 p-8 rounded-lg shadow-md w-full max-w-md border border-dark-700">
        <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent-pink to-primary-500">
          Login
        </h2>
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 mb-3 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-cyan text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out w-full"
            >
              Sign In
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary-400 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
