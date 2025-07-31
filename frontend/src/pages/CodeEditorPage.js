import React, { useState } from "react";
import CodeEditor from "../components/CodeEditor";

function CodeEditorPage() {
  const [currentCode, setCurrentCode] = useState("// Write your code here\n");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState(""); // New state for input

  const handleCodeChange = (newCode) => {
    setCurrentCode(newCode);
  };

  const handleLanguageChange = (event) => {
    setSelectedLanguage(event.target.value);
    setCurrentCode("// Write your code here\n"); // Reset code on language change
  };

  const handleRunCode = async () => {
    if (
      !currentCode.trim() ||
      currentCode.trim() === "// Write your code here"
    ) {
      setOutput("Please write some code before running.");
      return;
    }
    setIsLoading(true);
    setOutput("");
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: currentCode,
            language: selectedLanguage,
            input: input, // Send the input to the backend
          }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Something went wrong");
      }

      const result = await response.json();
      setOutput(result.output);

      // Save the code to history
      const email = localStorage.getItem("userEmail");
      if (email) {
        try {
          await fetch(`${process.env.REACT_APP_BACKEND_URL}/code`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              language: selectedLanguage,
              code: currentCode,
            }),
            credentials: "include",
          });
        } catch (saveError) {
          console.error("Failed to save code:", saveError);
          // Optionally, show a notification to the user that saving failed
        }
      }
    } catch (error) {
      setOutput(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-dark-900 text-gray-100 min-h-screen font-sans overflow-x-hidden">
      <section className="relative px-6 pt-6">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-gradient-to-r from-primary-500/10 to-accent-cyan/10 blur-3xl"></div>
        </div>

        {/* Section header */}
        <div className="relative text-center mb-6">
          <h2 className="text-4xl md:text-6xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-accent-pink to-primary-500 pt-6">
            Code Editor
          </h2>
          <p className="max-w-2xl mx-auto mt-3 text-gray-400 text-lg">
            Write, run, and share code in your favorite languages.
          </p>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="flex flex-col md:flex-row w-full gap-6 mb-6">
            {" "}
            {/* New flex container for side-by-side */}
            <div className="w-full md:w-2/3">
              {" "}
              {/* Code Editor Section */}
              <div className="flex items-center justify-center space-x-2 mb-4">
                <label
                  htmlFor="language-select"
                  className="text-lg text-gray-300"
                >
                  Select Language:
                </label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={handleLanguageChange}
                  className="p-2 rounded-md bg-dark-700 text-white border border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="go">Go</option>
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                </select>
              </div>
              <div className="w-full h-96 rounded-2xl bg-gradient-to-br from-accent-pink to-accent-purple p-1 animate-float">
                <div className="w-full h-full bg-dark-800 rounded-xl overflow-hidden">
                  <CodeEditor
                    initialCode={currentCode}
                    language={selectedLanguage}
                    onCodeChange={handleCodeChange}
                  />
                </div>
              </div>
            </div>
            {/* Input Section */}
            <div className="w-full md:w-1/3">
              <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Input
              </h2>
              <textarea
                className="w-full h-96 p-4 rounded-lg bg-dark-800 text-white border border-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                placeholder="Enter input here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              ></textarea>
            </div>
          </div>

          <button
            onClick={handleRunCode}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-primary-500 to-accent-cyan text-white font-semibold rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Running..." : "Run Code"}
          </button>
          {output && (
            <div className="w-full max-w-4xl mt-8">
              <h2 className="text-2xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-accent-cyan to-primary-400">
                Output
              </h2>
              <div className="bg-dark-800 p-4 rounded-lg text-white whitespace-pre-wrap border border-dark-700">
                {output}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default CodeEditorPage;
