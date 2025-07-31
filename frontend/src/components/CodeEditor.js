import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ initialCode = '', language = 'javascript', theme = 'vs-dark', onCodeChange }) {
  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  function handleEditorChange(value, event) {
    setCode(value);
    if (onCodeChange) {
      onCodeChange(value);
    }
  }

  return (
    <div className="w-full h-full border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height="100%"
        language={language}
        theme={theme}
        value={code}
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          // Add other Monaco Editor options here
        }}
      />
    </div>
  );
}

export default CodeEditor;