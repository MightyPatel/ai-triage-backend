const express = require('express');
const cors = require('cors');
const OpenAI = require('openai'); // v4 uses default export
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create OpenAI client (v4+ syntax)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

 const reply = chat.data.choices[0].message.content;

try {
  const parsed = JSON.parse(reply);
  res.json(parsed);
} catch (parseErr) {
  console.error('Failed to parse OpenAI response:', reply);
  res.status(500).json({ error: 'AI response is not valid JSON', raw: reply });
}


app.get('/', (req, res) => {
  res.send('AI Triage API is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
