import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import CodeEditorPage from "./pages/CodeEditorPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Sidebar from "./components/Sidebar";
import HistoryPage from "./pages/HistoryPage";
import ProtectedRoute from "./components/ProtectedRoute";
import OTPVerificationPage from "./pages/OTPVerificationPage";
import SharedCodeViewerPage from "./pages/SharedCodeViewerPage";

function App() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const shouldShowSidebar = ![
    "/login",
    "/signup",
    "/verify-otp",
    "/share/:token",
  ].includes(location.pathname);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex">
      {shouldShowSidebar && (
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      )}
      <main
        className={`flex-grow transition-all duration-300 ${
          shouldShowSidebar ? "md:ml-0" : "ml-0"
        }`}
      >
        {shouldShowSidebar && (
          <button
            onClick={toggleSidebar}
            className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-dark-700 text-white"
          >
            {isSidebarOpen ? "✕" : "☰"}
          </button>
        )}
        <Routes>
          <Route path="/" element={<CodeEditorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/share/:token" element={<SharedCodeViewerPage />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
