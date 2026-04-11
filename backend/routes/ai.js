const express = require('express');
const axios = require('axios');

const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

router.post('/ask', async (req, res) => {
  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, message: 'AI helper is not configured on the server.' });
  }

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        // Some OpenRouter providers (like gemma via Google) do not allow
        // separate developer/system instructions, so we inline our
        // instructions into the single user message.
        messages: [
          {
            role: 'user',
            content:
              'You are a friendly AI helper for patients. ' +
              'Answer questions about medicines, tests, and general health in simple language. ' +
              'Do NOT diagnose, prescribe, or replace a real doctor. ' +
              'Always remind the user to consult their doctor or a qualified professional before changing medication or treatment.\n\n' +
              'Patient question: ' + question.trim()
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hippocrates-lab.local',
          'X-OpenRouter-Title': 'Hippocrates Lab AI Helper'
        },
        timeout: 30000
      }
    );

    const answer =
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message &&
      response.data.choices[0].message.content;

    res.json({
      success: true,
      answer: answer || 'Sorry, I could not generate a response.'
    });
  } catch (err) {
    console.error('AI helper error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while contacting the AI helper.'
    });
  }
});

module.exports = router;

