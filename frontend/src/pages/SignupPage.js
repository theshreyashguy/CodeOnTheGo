import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isOTPSent, setIsOTPSent] = useState(false); // New state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    setMessage("Sending OTP to your email..."); // Immediate feedback
    setIsOTPSent(false); // Reset OTP sent status

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setMessage(""); // Clear sending message if validation fails
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/signup`,
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
        setMessage(data.message || "Signup successful!");
        setIsOTPSent(true); // Set OTP sent to true
        console.log("Signup successful:", data.message);
        // Delay navigation to allow user to read the message
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: email } });
        }, 3000); // Navigate after 3 seconds
      } else {
        setError(data.error || "Signup failed");
        console.error("Signup error:", data.error);
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Fetch error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 text-gray-100 font-sans">
      <div className="bg-dark-800 p-8 rounded-lg shadow-md w-full max-w-md border border-dark-700">
        <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent-pink to-primary-500">
          Sign Up
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
          {message && (
            <div
              className="bg-green-900/20 border border-green-700 text-green-300 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> {message}</span>
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
              disabled={isOTPSent} // Disable after OTP is sent
            />
          </div>
          <div className="mb-4">
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
              disabled={isOTPSent} // Disable after OTP is sent
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="confirm-password"
              className="block text-gray-300 text-sm font-bold mb-2"
            >
              Confirm Password:
            </label>
            <input
              type="password"
              id="confirm-password"
              className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 mb-3 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isOTPSent} // Disable after OTP is sent
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-cyan text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out w-full"
              disabled={isOTPSent} // Disable after OTP is sent
            >
              Sign Up
            </button>
          </div>
        </form>
        <p className="text-center text-gray-400 text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-400 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
