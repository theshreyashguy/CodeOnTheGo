import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import CodeEditor from "../components/CodeEditor";

const SharedCodeViewerPage = () => {
  const { token } = useParams();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedCode = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/share/${token}`);
        const data = await response.json();

        if (response.ok) {
          setCode(data.code);
          setLanguage(data.language);
          setExpiresAt(new Date(data.expiresAt));
        } else {
          setError(data.error || "Failed to load shared code.");
        }
      } catch (err) {
        setError("Network error or server is unreachable.");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedCode();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="bg-dark-900 text-gray-100 min-h-screen font-sans flex items-center justify-center">
        Loading shared code...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-900 text-gray-100 min-h-screen font-sans flex items-center justify-center">
        <div className="bg-dark-800 p-8 rounded-lg shadow-md w-full max-w-md border border-dark-700 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-dark-900 text-gray-100 min-h-screen font-sans overflow-x-hidden">
      <section className="relative px-6 pt-6">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-cyan/10 blur-3xl"></div>
        </div>

        {/* Section header */}
        <div className="relative text-center mb-6 pt-6">
          <h2 className="text-4xl md:text-6xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-accent-pink to-primary-500">
            Shared Code
          </h2>
          {expiresAt && (
            <p className="max-w-2xl mx-auto mt-3 text-gray-400 text-lg">
              This code expires on: {expiresAt.toLocaleString()}
            </p>
          )}
        </div>

        <div className="relative flex flex-col items-center">
          <div className="w-full max-w-4xl mb-6">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <label htmlFor="language-display" className="text-lg text-gray-300">
                Language:
              </label>
              <span id="language-display" className="p-2 rounded-md bg-dark-700 text-white border border-dark-700">
                {language}
              </span>
            </div>
            <div className="w-full h-96 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-purple p-1 animate-float">
              <div className="w-full h-full bg-dark-800 rounded-xl overflow-hidden">
                <CodeEditor
                  initialCode={code}
                  language={language}
                  onCodeChange={() => {}} // Make it read-only
                  readOnly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SharedCodeViewerPage;
