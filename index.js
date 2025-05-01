const express = require('express');
const cors = require('cors');
const OpenAI = require('openai'); // v4 default export
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI v4 client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/triage endpoint
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

Respond ONLY in valid JSON like:
{
  "urgency": "Soon",
  "doctor_type": "General Practitioner"
}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = chat.choices[0].message.content;

    try {
      const parsed = JSON.parse(reply);
      res.json(parsed);
    } catch (parseErr) {
      console.error('❌ Failed to parse OpenAI response:', reply);
      res.status(500).json({
        error: 'AI response is not valid JSON',
        raw: reply,
      });
    }
  } catch (err) {
    console.error('❌ OpenAI API Error:', err);
    res.status(500).json({
      error: 'Failed to process AI response',
      details: err.message,
    });
  }
});

// Root check route
app.get('/', (req, res) => {
  res.send('AI Triage API is running.');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
