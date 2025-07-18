// File: api/generate.js

const { GoogleGenerativeAI } = require("@google/generative-ai");

// This uses the API key you'll set up in Vercel
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  // Make sure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Send the AI's response back to your React app
    res.status(200).json({ response: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
}
