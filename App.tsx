

import React, { useState } from 'react';
import './index.css'; // This line imports the styles we will create next

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('...');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt) {
      alert('Please enter a prompt!');
      return;
    }

    setIsLoading(true);
    setResponse('Thinking...');

    try {
      // This correctly calls your backend API without any keys
      const apiResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`);
      }

      const data = await apiResponse.json();
      setResponse(data.response);

    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      setResponse("Something went wrong. Please check the logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1>My AI App</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the AI anything..."
          rows={4}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      <h3>Response:</h3>
      <div className="response-area">
        {response}
      </div>
    </div>
  );
}

export default App;
