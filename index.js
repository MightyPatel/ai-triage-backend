const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/triage", async (req, res) => {
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
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    res.json(JSON.parse(response.choices[0].message.content));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process AI response" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

