import React, { useState, useEffect } from "react";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedCodeId, setSelectedCodeId] = useState(null);
  const [expirationMinutes, setExpirationMinutes] = useState(60); // Default to 60 minutes
  const [sharedLink, setSharedLink] = useState("");
  const [sharedLinkExpiresAt, setSharedLinkExpiresAt] = useState(null);
  const [copyShareLinkFeedback, setCopyShareLinkFeedback] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        setError("You must be logged in to view your history.");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/code?email=${email}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch history");
        }
        const data = await response.json();
        setHistory(data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/code/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete code snippet");
      }

      setHistory(history.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  const openShareModal = (codeId) => {
    setSelectedCodeId(codeId);
    setSharedLink(""); // Clear previous link
    setSharedLinkExpiresAt(null);
    setCopyShareLinkFeedback("");
    setShowShareModal(true);
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setSelectedCodeId(null);
    setExpirationMinutes(60); // Reset to default
  };

  const handleCreateShareLink = async () => {
    if (!selectedCodeId || expirationMinutes < 1) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codeId: selectedCodeId,
            expirationMinutes: parseInt(expirationMinutes),
          }),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSharedLink(`${window.location.origin}/share/${data.token}`);
        setSharedLinkExpiresAt(new Date(data.expiresAt));

        // Update the local history state to mark this item as shared
        setHistory((prevHistory) =>
          prevHistory.map((item) =>
            item.id === selectedCodeId ? { ...item, isShared: true } : item
          )
        );
      } else {
        setError(data.error || "Failed to create share link.");
      }
    } catch (err) {
      setError("Network error or server is unreachable.");
      console.error("Share link error:", err);
    }
  };

  const copyGeneratedShareLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink).then(
        () => {
          setCopyShareLinkFeedback("Copied!");
          setTimeout(() => setCopyShareLinkFeedback(""), 2000);
        },
        (err) => {
          console.error("Failed to copy share link: ", err);
          setCopyShareLinkFeedback("Failed to copy");
        }
      );
    }
  };

  return (
    <div className="bg-dark-900 text-gray-100 min-h-screen font-sans overflow-x-hidden ">
      <section className="relative px-6 pt-6 min-h-screen">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-cyan/10 blur-3xl"></div>
        </div>

        {/* Section header */}
        <div className="relative text-center mb-6 pt-6">
          <h2 className="text-4xl md:text-6xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-accent-pink to-primary-500">
            Code History
          </h2>
          <p className="max-w-2xl mx-auto mt-3 text-gray-400 text-lg pt-6">
            Here you can find all the code you have previously compiled.
          </p>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}
        <div className="space-y-4 max-w-4xl mx-auto">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-dark-800 p-4 rounded-lg shadow-md"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold text-primary-400">
                    {item.language}
                  </h2>
                  {item.isShared && (
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white">
                      Shared
                    </span>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCopy(item.code, item.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    >
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => openShareModal(item.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <pre className="bg-dark-900 p-3 rounded-md whitespace-pre-wrap">
                  <code>{item.code}</code>
                </pre>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400">
              <p className="text-xl">No history found.</p>
              <p>Start compiling some code to see your history here.</p>
            </div>
          )}
        </div>
      </section>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-dark-700">
            <h3 className="text-xl font-bold mb-4">Share Code Snippet</h3>
            {!sharedLink ? (
              <>
                <div className="mb-4">
                  <label
                    htmlFor="expiration"
                    className="block text-gray-300 text-sm font-bold mb-2"
                  >
                    Expiration (minutes):
                  </label>
                  <input
                    type="number"
                    id="expiration"
                    className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 leading-tight focus:outline-none focus:shadow-outline border-dark-700 focus:ring-2 focus:ring-primary-500"
                    value={expirationMinutes}
                    onChange={(e) => setExpirationMinutes(e.target.value)}
                    min="1"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={closeShareModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateShareLink}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg"
                  >
                    Generate Link
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 text-green-400">
                  Share link generated successfully!
                </p>
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Shareable Link:
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={sharedLink}
                    className="shadow appearance-none border rounded w-full py-2 px-3 bg-dark-700 text-gray-100 leading-tight border-dark-700"
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    Expires:{" "}
                    {sharedLinkExpiresAt
                      ? sharedLinkExpiresAt.toLocaleString()
                      : "N/A"}
                  </p>
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={copyGeneratedShareLink}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    {copyShareLinkFeedback || "Copy Link"}
                  </button>
                  <button
                    onClick={closeShareModal}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
