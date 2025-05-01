const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const nearbyClinics = require('./getNearbyClinics'); // must come after app is defined
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(nearbyClinics); // this is now valid

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Triage Route
app.post('/api/triage', async (req, res) => {
  const {
    name,
    age,
    gender,
    conditions,
    medications,
    location,
    symptom,
    duration,
    severity,
    extras
  } = req.body;

  const prompt = `
You are a virtual medical triage assistant.

A patient has submitted the following information:
- Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Existing Conditions: ${conditions}
- Current Medications: ${medications}
- Location: ${location}
- Main Symptom: ${symptom}
- Duration: ${duration}
- Severity: ${severity}
- Additional Symptoms: ${extras}

Please:
1. Determine the urgency (Emergency, Soon, Routine)
2. Recommend the doctor type (e.g., General Practitioner)
3. If applicable, recommend a specialist (e.g., Cardiologist, Dermatologist)
4. Suggest 2 nearby clinics or hospitals based on the location. Include clinic name, distance, type, and doctor name.

Respond ONLY in valid JSON like:
{
  "urgency": "Soon",
  "doctor_type": "Specialist",
  "specialist": "Dermatologist",
  "nearby": [
    {
      "name": "Downtown Skin Centre",
      "type": "Clinic",
      "distance": "2.1 km",
      "doctor": "Dr. Aisha Kaur"
    },
    {
      "name": "City Health Hospital",
      "type": "Hospital",
      "distance": "4.7 km",
      "doctor": "Dr. John Roberts"
    }
  ]
}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    const reply = chat.choices[0].message.content;

    try {
      const parsed = JSON.parse(reply);
      res.json(parsed);
    } catch (parseErr) {
      console.error('❌ Failed to parse OpenAI response:', reply);
      res.status(500).json({ error: 'AI response is not valid JSON', raw: reply });
    }
  } catch (err) {
    console.error('❌ OpenAI API Error:', err);
    res.status(500).json({
      error: 'Failed to process AI response',
      details: err.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('✅ AI Triage Backend is Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
