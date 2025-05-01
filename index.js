
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getRealClinics(location) {
  try {
    const geoRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: location,
        key: process.env.GOOGLE_API_KEY,
      }
    });

    const { lat, lng } = geoRes.data.results[0].geometry.location;

    const placesRes = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lng}`,
        radius: 5000,
        type: 'hospital',
        keyword: 'clinic',
        key: process.env.GOOGLE_API_KEY,
      }
    });

    return placesRes.data.results.slice(0, 5).map(place => ({
      name: place.name,
      address: place.vicinity,
      location: place.geometry.location,
      place_id: place.place_id
    }));
  } catch (error) {
    console.error('Google Maps API error:', error.message);
    return [];
  }
}

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
A patient submitted:
- Name: ${name}
- Age: ${age}
- Gender: ${gender}
- Existing Conditions: ${conditions}
- Current Medications: ${medications}
- Main Symptom: ${symptom}
- Duration: ${duration}
- Severity: ${severity}
- Additional Symptoms: ${extras}

Please determine:
1. Urgency (Emergency, Soon, Routine)
2. Doctor type (e.g., General Practitioner)
3. Specialist type if needed

Respond in JSON:
{
  "urgency": "Soon",
  "doctor_type": "Specialist",
  "specialist": "Dermatologist"
}
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    });

    const aiReply = chat.choices[0].message.content;
    const aiData = JSON.parse(aiReply);

    const realClinics = await getRealClinics(location);

    res.json({
      ...aiData,
      nearby: realClinics
    });
  } catch (err) {
    console.error('❌ Triage error:', err.message);
    res.status(500).json({ error: 'Failed to process triage request', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ AI Triage Backend with Google Clinics is Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
