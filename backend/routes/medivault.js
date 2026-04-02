const express = require('express');
const axios = require('axios');

const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

router.post('/search', async (req, res) => {
  const { query, searchType, country, currency } = req.body;

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Search query is required.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'MediVault is not configured on the server.' });
  }

  const targetCountry = country || 'India';
  const targetCurrency = currency || 'INR';

  const systemPrompt = `You are a medical information assistant. You MUST respond with a valid JSON array only — no markdown, no explanation, no extra text before or after the JSON.

Rules for pricing:
- Give one single canonical price per medicine — the most common retail price in ${targetCountry} for a standard pack.
- Do NOT list multiple variants of the same medicine with different prices. Only list each distinct medicine ONCE.
- Use the standard MRP (Maximum Retail Price) for ${targetCountry} in ${targetCurrency}.
- Price must be a plain number (e.g. 45.00), not a range, not a description.

Output format — a JSON array of medicine objects:
[
  {
    "name": "Medicine Brand/Generic Name",
    "dosage": "Strength and form, e.g. 500mg Tablet",
    "priceValue": 45.00,
    "price": "₹45.00",
    "use": "What it treats",
    "sideEffects": "Common side effects",
    "info": "Precautions or additional notes"
  }
]`;

  let userPrompt;
  if (searchType === 'symptom') {
    userPrompt = `Symptoms: ${query.trim()}
Country: ${targetCountry}, Currency: ${targetCurrency}

List 3-5 distinct medicines commonly used for these symptoms. Each medicine must appear only once. Return JSON array only.`;
  } else {
    userPrompt = `Medicine search: ${query.trim()}
Country: ${targetCountry}, Currency: ${targetCurrency}

List 1-3 of the most relevant formulations of this medicine. Do NOT repeat the same medicine at different prices — pick the most common retail price for each distinct formulation. Return JSON array only.`;
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hippocrates-lab.local',
          'X-OpenRouter-Title': 'Hippocrates Lab MediVault'
        },
        timeout: 30000
      }
    );

    const answer = response.data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.json({ success: true, medicines: [] });
    }

    const medicines = parseJsonResponse(answer);

    res.json({ success: true, medicines });
  } catch (err) {
    console.error('MediVault search error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while searching for medicines.'
    });
  }
});

function parseJsonResponse(text) {
  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(m => m && m.name)
      .map((m, index) => ({
        id: `med-${Date.now()}-${index}`,
        name: String(m.name || '').trim(),
        dosage: String(m.dosage || '').trim(),
        priceValue: typeof m.priceValue === 'number' ? m.priceValue : parseFloat(String(m.priceValue || '0').replace(/[^\d.]/g, '')) || 0,
        price: String(m.price || '').trim(),
        use: String(m.use || '').trim(),
        sideEffects: String(m.sideEffects || '').trim(),
        info: String(m.info || '').trim()
      }));
  } catch (e) {
    console.error('Failed to parse AI JSON response:', e.message);
    console.error('Raw response:', text.substring(0, 500));
    return [];
  }
}

module.exports = router;
