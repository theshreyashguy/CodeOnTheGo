import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const OTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        localStorage.setItem("userEmail", email); // Store email on successful verification
        setTimeout(() => {
          navigate("/"); // Redirect to home/compiler page
        }, 2000);
      } else {
        setError(data.error || "OTP verification failed.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Fetch error:", err);
    }
  };

  const handleRequestNewOTP = async () => {
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email to request a new OTP.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setError(data.error || "Failed to request new OTP.");
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
          Verify Your Email
        </h2>
        <form onSubmit={handleVerifyOTP}>
          {message && (
            <div className="bg-green-900/20 border border-green-700 text-green-300 px-4 py-3 rounded relative mb-4">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!location.state?.email} // Disable if email came from signup
            />
          </div>
          <div className="mb-6">
            <label htmlFor="otp" className="block text-gray-300 text-sm font-bold mb-2">
              OTP:
            </label>
            <input
              type="text"
              id="otp"
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 mb-3 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength="6"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-cyan text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out w-full"
            >
              Verify OTP
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          Didn't receive a code?{" "}
          <button
            onClick={handleRequestNewOTP}
            className="text-primary-400 hover:underline focus:outline-none"
          >
            Request New OTP
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
