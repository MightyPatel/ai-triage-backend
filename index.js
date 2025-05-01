// Import dependencies
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Initialize Express
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// OpenAI Configuration (Ensure you have the OPENAI_API_KEY in your environment variables)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// API endpoint to process triage information
app.post('/api/triage', async (req, res) => {
  const { symptom, duration, severity, extras } = req.body;

  const prompt = `
    You are a virtual health assistant. A user reports:
    - Symptom: ${symptom}
    - Duration: ${duration}
    - Severity: ${severity}
    - Additional symptoms: ${extras}

    Suggest:
    1. Urgency (Emergency, Soon, Routine)
    2. Doctor type (e.g., General Practitioner)

    Respond in JSON:
    {
      "urgency": "Soon",
      "doctor_type": "General Practitioner"
    }
  `;

  try {
    // Send request to OpenAI API
    const chat = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo', // You can also use gpt-4 or another available model
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = chat.data.choices[0].message.content;
    res.json(JSON.parse(reply)); // Send the parsed response to the client
  } catch (err) {
    console.error('OpenAI API Error:', err.response ? err.response.data : err.message);
    res.status(500).json({ error: 'Failed to process AI response', details: err.response ? err.response.data : err.message });
  }
});

// Default route for checking if the server is running
app.get('/', (req, res) => {
  res.send('AI Triage API is running.');
});

// Define the port from environment variable (required by Render)
const PORT = process.env.PORT || 3000;  // Render automatically provides PORT, or use 3000 for local dev
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
