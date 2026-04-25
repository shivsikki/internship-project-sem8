const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const AIChat = require('../models/AIChat');
const auth = require('../middleware/auth');

const router = express.Router();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL || 'tngtech/deepseek-r1t2-chimera:free';

const SPECIALIZATIONS = [
  'General Practice',
  'Cardiovascular',
  'Neurological',
  'Orthopedic',
  'Dermatology',
  'Pediatrics',
  'Psychiatry',
  'Gastroenterology',
  'Ophthalmology',
  'ENT',
  'Ayurvedic'
];

const normalizeForMatch = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/gernal/g, 'general')
    .replace(/genral/g, 'general')
    .replace(/[^a-z0-9]/g, '');

const escapeRegex = (s) => (s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractCity = (question) => {
  const q = question || '';
  // Examples: "in Nadiad", "at Nadiad"
  const m =
    q.match(/\b(?:in|at)\s+([A-Za-z][A-Za-z\s]{1,30})/i) ||
    q.match(/city\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{1,30})/i);
  if (!m) return null;
  // Cut trailing clauses like "... and ...", "... for ..."
  return (m[1] || '')
    .split(/\s+(?:and|for|need|doctor|doctors|specialization|speciality)\b/i)[0]
    .trim()
    .replace(/[,.'"]/g, '');
};

const extractSpecialization = (question) => {
  const qNorm = normalizeForMatch(question);
  // direct match by canonical normalized strings
  for (const s of SPECIALIZATIONS) {
    const sNorm = normalizeForMatch(s);
    if (qNorm.includes(sNorm)) return s;
  }

  // small extra fallback for common typos near "general practice"
  if (qNorm.includes('generalpractice') || qNorm.includes('generalpractise')) {
    return 'General Practice';
  }

  return null;
};

const buildDoctorDirectoryAnswer = (city, specialization, doctors) => {
  const count = doctors.length;
  const lines = [];
  lines.push(`[[INFO]]Context[[/INFO]]: City <strong>${city}</strong>`);
  lines.push(
    `[[ACCENT]]Need[[/ACCENT]]: ${specialization ? `<strong>${specialization}</strong>` : 'Doctor visit'}`
  );
  lines.push(`[[NOTE]]Matches found[[/NOTE]]: <strong>${count}</strong> doctor${count === 1 ? '' : 's'}`);

  if (count === 0) {
    lines.push('');
    lines.push(`[[NOTE]]Suggestion[[/NOTE]]: Try a nearby city or a different specialization, then contact the clinic to confirm availability.`);
    lines.push('');
    lines.push(`[[NOTE]]Reminder[[/NOTE]]: If symptoms are severe, seek emergency medical care or contact your nearest doctor.`);
    return lines.join('\n');
  }

  lines.push('');
  lines.push(`Available doctors:`);
  for (const d of doctors.slice(0, 6)) {
    const phone = d.phone ? ` — Phone: ${d.phone}` : '';
    const lic = d.licenseNumber ? ` — License: ${d.licenseNumber}` : '';
    lines.push(
      `* <span class="ai-doctor-name"><strong>${d.name}</strong></span> — ${d.specialization || 'General'}${phone}${lic}`
    );
  }

  lines.push('');
  lines.push(
    `[[NOTE]]Reminder[[/NOTE]]: This list is for guidance only. Please call the clinic to confirm appointment availability and the latest care plan.`
  );
  return lines.join('\n');
};

const buildChatTitle = (question) => {
  const compact = (question || '').replace(/\s+/g, ' ').trim();
  if (!compact) return 'New chat';
  return compact.length > 60 ? `${compact.slice(0, 57)}...` : compact;
};

const buildFallbackPrompt = (question, history = []) => {
  const historyText = history.length
    ? `Conversation so far:\n${history
        .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n')}\n\n`
    : '';

  return (
    'You are a friendly AI helper for patients. ' +
    'Answer questions about medicines, tests, and general health in simple language. ' +
    'Do NOT diagnose, prescribe, or replace a real doctor. ' +
    'Always remind the user to consult their doctor or a qualified professional before changing medication or treatment.\n' +
    'Formatting rules for readability (important): ' +
    'Use headings that start with "## " for sections. ' +
    'Use bullet lists with lines starting with "* ". ' +
    'Use bold emphasis with **text**. ' +
    'Use these optional tokens for color/context: [[INFO]]Label[[/INFO]], [[ACCENT]]Emphasis[[/ACCENT]], [[NOTE]]Reminder[[/NOTE]]. ' +
    'Do not output HTML tags. ' +
    '\n\n' +
    historyText +
    'Patient question: ' +
    question.trim()
  );
};

const requestOpenRouterAnswer = async (question, history = []) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('AI helper is not configured on the server.');
  }

  const messages = [
    {
      role: 'system',
      content:
        'You are a friendly AI helper for patients. Answer questions about medicines, tests, and general health in simple language. ' +
        'Do not diagnose or replace a doctor. Use markdown-style formatting with ## headings, * bullets, **bold**, and optional [[INFO]] [[ACCENT]] [[NOTE]] tokens. Do not output HTML.'
    },
    ...history.map((message) => ({
      role: message.role,
      content: message.content
    })),
    {
      role: 'user',
      content: question.trim()
    }
  ];

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: DEFAULT_MODEL,
        messages
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

    if (answer) return answer;
  } catch (primaryError) {
    try {
      const fallbackResponse = await axios.post(
        OPENROUTER_API_URL,
        {
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'user',
              content: buildFallbackPrompt(question, history)
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

      return (
        fallbackResponse.data &&
        fallbackResponse.data.choices &&
        fallbackResponse.data.choices[0] &&
        fallbackResponse.data.choices[0].message &&
        fallbackResponse.data.choices[0].message.content
      );
    } catch (fallbackError) {
      console.error('AI helper error:', fallbackError.response?.data || fallbackError.message);
      throw fallbackError;
    }
  }
  return 'Sorry, I could not generate a response.';
};

const generateAssistantAnswer = async (question, history = []) => {
  const city = extractCity(question);
  const specialization = extractSpecialization(question);

  if (city) {
    const query = {
      role: 'doctor',
      city: { $regex: new RegExp(escapeRegex(city), 'i') }
    };

    if (specialization) {
      query.specialization = {
        $regex: new RegExp(escapeRegex(specialization), 'i')
      };
    }

    const doctors = await User.find(query, 'name specialization city phone licenseNumber').lean();
    return buildDoctorDirectoryAnswer(city, specialization || 'General Practice', doctors);
  }

  return requestOpenRouterAnswer(question, history);
};

router.post('/ask', async (req, res) => {
  const { question, history = [] } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: 'Question is required.' });
  }

  try {
    const safeHistory = Array.isArray(history)
      ? history.filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string')
      : [];
    const answer = await generateAssistantAnswer(question, safeHistory);
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

router.get('/chats', auth, async (req, res) => {
  try {
    const chats = await AIChat.find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .select('title updatedAt createdAt messages')
      .lean();

    const summaries = chats.map((chat) => ({
      _id: chat._id,
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      preview: chat.messages?.[chat.messages.length - 1]?.content || '',
      messageCount: chat.messages?.length || 0
    }));

    res.json({ success: true, chats: summaries });
  } catch (error) {
    console.error('Fetch AI chats error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to load saved chats.' });
  }
});

router.get('/chats/:chatId', auth, async (req, res) => {
  try {
    const chat = await AIChat.findOne({ _id: req.params.chatId, userId: req.userId }).lean();
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Fetch AI chat error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to load this chat.' });
  }
});

router.post('/chats', auth, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const safeMessages = Array.isArray(messages)
      ? messages.filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
      : [];

    if (!safeMessages.length) {
      return res.status(400).json({ success: false, message: 'Cannot save an empty chat.' });
    }

    const chat = await AIChat.create({
      userId: req.userId,
      title: title?.trim() || buildChatTitle(safeMessages.find((m) => m.role === 'user')?.content),
      messages: safeMessages.map((m) => ({ role: m.role, content: m.content.trim() }))
    });

    res.status(201).json({ success: true, chatId: chat._id, title: chat.title });
  } catch (error) {
    console.error('Create AI chat error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to save this chat.' });
  }
});

router.put('/chats/:chatId', auth, async (req, res) => {
  try {
    const { title, messages } = req.body;
    const chat = await AIChat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    if (typeof title === 'string' && title.trim()) {
      chat.title = title.trim();
    }

    if (Array.isArray(messages)) {
      const safeMessages = messages.filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim());
      if (!safeMessages.length) {
        return res.status(400).json({ success: false, message: 'Cannot save an empty chat.' });
      }
      chat.messages = safeMessages.map((m) => ({ role: m.role, content: m.content.trim() }));
    }

    await chat.save();
    res.json({ success: true, chatId: chat._id, title: chat.title, updatedAt: chat.updatedAt });
  } catch (error) {
    console.error('Update AI chat error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to update this chat.' });
  }
});

router.post('/chats/:chatId/messages', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const question = typeof content === 'string' ? content.trim() : '';

    if (!question) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const chat = await AIChat.findOne({ _id: req.params.chatId, userId: req.userId });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found.' });
    }

    chat.messages.push({ role: 'user', content: question });
    const priorHistory = chat.messages.slice(0, -1).map((message) => ({
      role: message.role,
      content: message.content
    }));
    const answer = await generateAssistantAnswer(question, priorHistory);
    chat.messages.push({ role: 'assistant', content: answer });

    if (!chat.title || chat.title === 'New chat') {
      chat.title = buildChatTitle(question);
    }

    await chat.save();

    res.json({
      success: true,
      answer,
      messages: chat.messages,
      chatId: chat._id,
      title: chat.title,
      updatedAt: chat.updatedAt
    });
  } catch (error) {
    console.error('Append AI chat message error:', error.response?.data || error.message);
    res.status(500).json({ success: false, message: 'Unable to continue this chat.' });
  }
});

module.exports = router;

