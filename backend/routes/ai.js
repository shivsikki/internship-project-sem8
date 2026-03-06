const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');

const router = express.Router();

// Check if OpenAI is configured
const isOpenAIConfigured = !!process.env.OPENAI_API_KEY;
const openai = isOpenAIConfigured ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// In-memory storage for short audio clips
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// POST /api/ai/voice-chat
// Expects: multipart/form-data with field "audio"
// Returns: audio/mpeg buffer (AI reply voice) and optional metadata
router.post(
  '/voice-chat',
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!isOpenAIConfigured) {
        return res.json({
          success: true,
          message: 'Voice chat simulation (OpenAI not configured)',
          transcript: "Hello, I'm a patient experiencing headache symptoms",
          response: "I understand you're experiencing headaches. This could be due to various factors including stress, dehydration, or migraines. I recommend staying hydrated, resting in a quiet room, and monitoring your symptoms. If headaches persist or worsen, please consult with your healthcare provider.",
          audioBuffer: null, // Would normally contain AI voice response
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded',
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 1) Speech-to-text: transcribe user audio
      const audioBuffer = req.file.buffer;
      const sttResponse = await openai.audio.transcriptions.create({
        file: {
          data: audioBuffer,
          name: req.file.originalname || 'audio.webm',
        },
        model: 'gpt-4o-mini-transcribe',
      });

      const userText = sttResponse.text?.trim();
      if (!userText) {
        return res.status(400).json({
          success: false,
          message: 'Could not transcribe audio',
        });
      }

      // 2) Chat completion: generate assistant reply text
      const systemPrompt =
        'You are a helpful medical assistant for a hospital management app. ' +
        'You CANNOT give diagnoses, but you can explain medical concepts simply, ' +
        'help patients understand appointments, prescriptions, test results (at a high level), ' +
        'and guide them to contact their doctor or emergency services when needed. ' +
        'Keep responses short (2–4 sentences) and conversational.';

      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userText,
          },
        ],
      });

      const aiText =
        chatResponse.choices?.[0]?.message?.content?.trim() ||
        "I'm here to help, but I could not understand that message clearly. Could you repeat it?";

      // 3) Text-to-speech: synthesize reply audio
      const ttsResponse = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'alloy',
        format: 'mp3',
        input: aiText,
      });

      const audioReplyBuffer = Buffer.from(await ttsResponse.arrayBuffer());

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'inline; filename="ai-reply.mp3"');
      res.setHeader('X-AI-Text', encodeURIComponent(aiText));

      return res.send(audioReplyBuffer);
    } catch (err) {
      console.error('AI voice-chat error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to process AI voice chat',
      });
    }
  }
);

// POST /api/ai/medicine-info
// Expects: { "medicine": "paracetamol" }
// Returns: detailed medicine information
router.post('/medicine-info', async (req, res) => {
  try {
    if (!isOpenAIConfigured) {
      return res.json({
        success: true,
        message: 'Medicine information (simulation mode)',
        medicine: req.body.medicine,
        information: {
          genericName: req.body.medicine,
          brandNames: ['Tylenol', 'Panadol', 'Calpol'],
          uses: ['Pain relief', 'Fever reduction', 'Headache', 'Muscle aches'],
          dosage: {
            adults: '500-1000mg every 4-6 hours (max 4000mg/day)',
            children: '10-15mg/kg every 4-6 hours (max 60mg/kg/day)'
          },
          sideEffects: ['Nausea', 'Stomach pain', 'Liver damage (high doses)', 'Allergic reactions'],
          warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Consult doctor if pregnant'],
          interactions: ['Warfarin', 'Alcohol', 'Other medications containing acetaminophen']
        }
      });
    }

    const { medicine } = req.body;
    if (!medicine || medicine.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Medicine name is required',
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a pharmaceutical information assistant. Provide detailed, accurate information about medicines including:
    - Generic name and brand names
    - Uses and indications
    - Dosage information (general)
    - Common side effects
    - Important warnings and precautions
    - Drug interactions
    - Contraindications
    - Storage instructions
    
    IMPORTANT: Always include a disclaimer that this information is for educational purposes only and patients should consult their doctor or pharmacist for medical advice.
    Format the response in clear, organized sections with bullet points for easy reading.`;

    const userPrompt = `Please provide comprehensive information about the medicine: ${medicine.trim()}`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more factual responses
    });

    const medicineInfo = chatResponse.choices?.[0]?.message?.content?.trim();

    if (!medicineInfo) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate medicine information',
      });
    }

    return res.json({
      success: true,
      data: {
        medicine: medicine.trim(),
        information: medicineInfo,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Medicine info error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to get medicine information',
    });
  }
});

// POST /api/ai/medicine-chat
// Expects: { "message": "Is paracetamol safe for children?" }
// Returns: AI response about medicine-related queries
router.post('/medicine-chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a helpful pharmaceutical assistant for patients. You can:
    - Provide information about medicines (uses, side effects, precautions)
    - Explain how medications work
    - Answer questions about drug interactions
    - Provide general dosage guidance
    - Explain medical terminology related to medications
    
    IMPORTANT LIMITATIONS:
    - NEVER provide specific medical diagnoses
    - NEVER recommend specific treatments for conditions
    - ALWAYS advise patients to consult their doctor or pharmacist for personalized medical advice
    - If asked about serious symptoms, advise seeking immediate medical attention
    - Keep responses concise but comprehensive
    - Use simple, easy-to-understand language
    
    Always include a disclaimer: "This information is for educational purposes only. Please consult your doctor or pharmacist for personalized medical advice."`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      temperature: 0.5,
    });

    const aiResponse = chatResponse.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate AI response',
      });
    }

    return res.json({
      success: true,
      data: {
        message: message.trim(),
        response: aiResponse,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Medicine chat error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to process medicine chat query',
    });
  }
});

// POST /api/ai/symptom-checker
// Expects: { "symptoms": ["headache", "fever", "nausea"], "duration": "2 days", "severity": "moderate" }
// Returns: AI analysis with possible conditions and recommendations
router.post('/symptom-checker', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { symptoms, duration, severity, age, gender, additionalInfo } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms array is required',
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a preliminary symptom analysis assistant for a hospital management system. Your role is to:
    - Analyze symptoms and provide possible conditions
    - Assess urgency level (low, medium, high, emergency)
    - Recommend appropriate medical actions
    - Suggest which type of doctor to consult
    
    CRITICAL DISCLAIMERS:
    - This is NOT a medical diagnosis
    - Always advise consulting a healthcare professional
    - For severe symptoms, recommend immediate emergency care
    - Include clear medical disclaimer at the end
    
    Format your response as JSON with:
    {
      "possibleConditions": ["condition1", "condition2"],
      "urgencyLevel": "low|medium|high|emergency",
      "recommendedActions": ["action1", "action2"],
      "specialistType": "general physician|specialist name",
      "emergencyWarning": boolean,
      "disclaimer": "medical disclaimer text"
    }`;

    const userPrompt = `Patient information:
    Symptoms: ${symptoms.join(', ')}
    Duration: ${duration || 'not specified'}
    Severity: ${severity || 'not specified'}
    Age: ${age || 'not specified'}
    Gender: ${gender || 'not specified'}
    Additional information: ${additionalInfo || 'none'}
    
    Please analyze these symptoms and provide guidance.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const analysisText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let analysisData;
    try {
      analysisData = JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      analysisData = {
        possibleConditions: ['Unable to determine'],
        urgencyLevel: 'medium',
        recommendedActions: ['Consult a healthcare professional'],
        specialistType: 'general physician',
        emergencyWarning: false,
        disclaimer: 'This analysis is for informational purposes only. Please consult a qualified healthcare provider for proper diagnosis and treatment.',
        rawResponse: analysisText
      };
    }

    return res.json({
      success: true,
      data: {
        symptoms: symptoms,
        analysis: analysisData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Symptom checker error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze symptoms',
    });
  }
});

// POST /api/ai/health-analytics
// Expects: { "userId": "user_id", "timeframe": "1month|3months|6months|1year" }
// Returns: Health insights based on user's medical history
router.post('/health-analytics', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { userId, timeframe = '3months' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Import models to get user's medical data
    const Appointment = require('../models/Appointment');
    const Prescription = require('../models/Prescription');
    const Test = require('../models/Test');
    const User = require('../models/User');

    // Get user's medical history
    const appointments = await Appointment.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });
    
    const prescriptions = await Prescription.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ prescribedDate: -1 });
    
    const tests = await Test.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ testDate: -1 });

    const user = await User.findById(userId);

    // Filter data based on timeframe
    const now = new Date();
    const timeframes = {
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365
    };
    const daysAgo = timeframes[timeframe] || 90;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    const recentAppointments = appointments.filter(apt => new Date(apt.appointmentDate) >= cutoffDate);
    const recentPrescriptions = prescriptions.filter(pres => new Date(pres.prescribedDate) >= cutoffDate);
    const recentTests = tests.filter(test => new Date(test.testDate) >= cutoffDate);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a health analytics assistant. Analyze the patient's medical history and provide:
    - Health trends and patterns
    - Medication adherence insights
    - Appointment frequency analysis
    - Test result patterns
    - Preventive care recommendations
    - Lifestyle suggestions
    
    Format as JSON with:
    {
      "healthScore": number (0-100),
      "trends": ["trend1", "trend2"],
      "medicationInsights": ["insight1", "insight2"],
      "appointmentCompliance": "excellent|good|fair|poor",
      "recommendations": ["rec1", "rec2"],
      "preventiveCare": ["care1", "care2"],
      "lifestyleSuggestions": ["suggestion1", "suggestion2"]
    }`;

    const userData = {
      age: user?.age,
      gender: user?.gender,
      recentAppointments: recentAppointments.map(apt => ({
        date: apt.appointmentDate,
        doctor: apt.doctor?.name,
        specialization: apt.doctor?.specialization,
        status: apt.status
      })),
      recentPrescriptions: recentPrescriptions.map(pres => ({
        date: pres.prescribedDate,
        doctor: pres.doctor?.name,
        medications: pres.medications?.map(med => `${med.name} ${med.dosage}`),
        status: pres.status
      })),
      recentTests: recentTests.map(test => ({
        date: test.testDate,
        doctor: test.doctor?.name,
        testName: test.testName,
        result: test.result,
        status: test.status
      }))
    };

    const userPrompt = `Patient health data for ${timeframe} analysis:
    ${JSON.stringify(userData, null, 2)}
    
    Please analyze this health data and provide insights.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const analyticsText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let analyticsData;
    try {
      analyticsData = JSON.parse(analyticsText);
    } catch (parseError) {
      analyticsData = {
        healthScore: 75,
        trends: ['Regular checkups needed'],
        medicationInsights: ['Continue prescribed medications'],
        appointmentCompliance: 'good',
        recommendations: ['Schedule regular checkups'],
        preventiveCare: ['Annual health screening'],
        lifestyleSuggestions: ['Maintain healthy diet'],
        rawResponse: analyticsText
      };
    }

    return res.json({
      success: true,
      data: {
        timeframe,
        analytics: analyticsData,
        summary: {
          totalAppointments: recentAppointments.length,
          totalPrescriptions: recentPrescriptions.length,
          totalTests: recentTests.length,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Health analytics error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate health analytics',
    });
  }
});

// POST /api/ai/smart-reminders
// Expects: { "userId": "user_id", "preferences": ["medications", "appointments", "tests"] }
// Returns: Personalized reminder schedule
router.post('/smart-reminders', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { userId, preferences = ['medications', 'appointments', 'tests'] } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get user's upcoming appointments, active prescriptions, and scheduled tests
    const Appointment = require('../models/Appointment');
    const Prescription = require('../models/Prescription');
    const Test = require('../models/Test');
    const User = require('../models/User');

    const upcomingAppointments = await Appointment.find({ 
      patient: userId, 
      appointmentDate: { $gte: new Date() },
      status: 'scheduled'
    }).populate('doctor', 'name specialization');

    const activePrescriptions = await Prescription.find({ 
      patient: userId, 
      status: 'active'
    }).populate('doctor', 'name specialization');

    const scheduledTests = await Test.find({ 
      patient: userId, 
      testDate: { $gte: new Date() },
      status: 'scheduled'
    }).populate('doctor', 'name specialization');

    const user = await User.findById(userId);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are a smart reminder scheduling assistant. Create personalized reminders based on:
    - User's medical schedule
    - Medication timing requirements
    - Appointment preparation needs
    - Test preparation instructions
    - User preferences
    
    Format as JSON with:
    {
      "reminders": [
        {
          "type": "medication|appointment|test|general",
          "title": "reminder title",
          "description": "detailed description",
          "scheduledTime": "ISO datetime",
          "priority": "low|medium|high",
          "frequency": "once|daily|weekly|monthly",
          "actions": ["action1", "action2"]
        }
      ],
      "insights": ["insight1", "insight2"]
    }`;

    const medicalData = {
      user: {
        age: user?.age,
        gender: user?.gender,
        preferences: preferences
      },
      upcomingAppointments: upcomingAppointments.map(apt => ({
        date: apt.appointmentDate,
        doctor: apt.doctor?.name,
        specialization: apt.doctor?.specialization,
        notes: apt.notes
      })),
      activePrescriptions: activePrescriptions.map(pres => ({
        medications: pres.medications,
        prescribedDate: pres.prescribedDate,
        doctor: pres.doctor?.name,
        instructions: pres.instructions
      })),
      scheduledTests: scheduledTests.map(test => ({
        date: test.testDate,
        testName: test.testName,
        doctor: test.doctor?.name,
        instructions: test.instructions
      }))
    };

    const userPrompt = `Create smart reminders for this user:
    ${JSON.stringify(medicalData, null, 2)}
    
    Generate appropriate reminders for the next 30 days.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const remindersText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let remindersData;
    try {
      remindersData = JSON.parse(remindersText);
    } catch (parseError) {
      remindersData = {
        reminders: [],
        insights: ['Unable to generate personalized reminders'],
        rawResponse: remindersText
      };
    }

    return res.json({
      success: true,
      data: {
        preferences,
        reminders: remindersData.reminders || [],
        insights: remindersData.insights || [],
        summary: {
          upcomingAppointments: upcomingAppointments.length,
          activePrescriptions: activePrescriptions.length,
          scheduledTests: scheduledTests.length,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Smart reminders error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate smart reminders',
    });
  }
});

// POST /api/ai/ai-triage
// Expects: { "chiefComplaint": "complaint", "vitalSigns": {...}, "symptoms": [...], "medicalHistory": {...} }
// Returns: Triage assessment with priority level
router.post('/ai-triage', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { chiefComplaint, vitalSigns, symptoms, medicalHistory, age, gender } = req.body;
    
    if (!chiefComplaint) {
      return res.status(400).json({
        success: false,
        message: 'Chief complaint is required',
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an AI-powered medical triage assistant. Assess the patient's condition and determine:
    - Triage priority level (1-Emergency, 2-Urgent, 3-Semi-urgent, 4-Non-urgent)
    - Estimated wait time category
    - Recommended care setting (ER, Urgent Care, Primary Care)
    - Immediate actions needed
    - Red flag symptoms to watch
    
    CRITICAL: This is triage assessment, not diagnosis. Always recommend professional medical evaluation.
    
    Format as JSON with:
    {
      "triageLevel": 1|2|3|4,
      "priorityName": "Emergency|Urgent|Semi-urgent|Non-urgent",
      "recommendedCare": "Emergency Room|Urgent Care|Primary Care|Telemedicine",
      "estimatedWaitTime": "immediate|<15min|<30min|<1hour|>1hour",
      "immediateActions": ["action1", "action2"],
      "redFlags": ["flag1", "flag2"],
      "recommendedTests": ["test1", "test2"],
      "specialistNeeded": "specialist type",
      "disclaimer": "medical disclaimer text"
    }`;

    const userPrompt = `Triage assessment for:
    Chief Complaint: ${chiefComplaint}
    Age: ${age || 'not specified'}
    Gender: ${gender || 'not specified'}
    Vital Signs: ${JSON.stringify(vitalSigns || {})}
    Symptoms: ${symptoms ? symptoms.join(', ') : 'none specified'}
    Medical History: ${JSON.stringify(medicalHistory || {})}
    
    Please provide triage assessment.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const triageText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let triageData;
    try {
      triageData = JSON.parse(triageText);
    } catch (parseError) {
      triageData = {
        triageLevel: 3,
        priorityName: 'Semi-urgent',
        recommendedCare: 'Primary Care',
        estimatedWaitTime: '<30min',
        immediateActions: ['Wait for medical evaluation'],
        redFlags: [],
        recommendedTests: [],
        specialistNeeded: 'general physician',
        disclaimer: 'This triage assessment is for informational purposes only. Please seek immediate medical attention for severe symptoms.',
        rawResponse: triageText
      };
    }

    return res.json({
      success: true,
      data: {
        chiefComplaint,
        triage: triageData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('AI triage error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform triage assessment',
    });
  }
});

// POST /api/ai/emergency-detection
// Expects: { "symptoms": [...], "vitalSigns": {...}, "situation": "description", "location": "location" }
// Returns: Emergency assessment with immediate actions
router.post('/emergency-detection', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'OPENAI_API_KEY not configured on server',
      });
    }

    const { symptoms, vitalSigns, situation, location, age, gender } = req.body;
    
    if (!symptoms && !situation) {
      return res.status(400).json({
        success: false,
        message: 'Either symptoms or situation description is required',
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an emergency detection and response assistant. Assess if this is a medical emergency and provide:
    - Emergency level (Critical, Serious, Urgent, Non-emergency)
    - Call emergency services immediately (yes/no)
    - Immediate life-saving actions
    - What to do while waiting for help
    - Emergency services to contact
    - Information to prepare for responders
    
    CRITICAL: When in doubt, always recommend calling emergency services.
    
    Format as JSON with:
    {
      "isEmergency": true|false,
      "emergencyLevel": "Critical|Serious|Urgent|Non-emergency",
      "callEmergency": true|false,
      "emergencyNumber": "911|local emergency number",
      "immediateActions": ["action1", "action2"],
      "whileWaiting": ["step1", "step2"],
      "emergencyServices": ["service1", "service2"],
      "infoForResponders": ["info1", "info2"],
      "warningSigns": ["sign1", "sign2"],
      "disclaimer": "emergency response disclaimer"
    }`;

    const userPrompt = `Emergency assessment:
    Symptoms: ${symptoms ? symptoms.join(', ') : 'none specified'}
    Vital Signs: ${JSON.stringify(vitalSigns || {})}
    Situation: ${situation || 'not described'}
    Location: ${location || 'not specified'}
    Age: ${age || 'not specified'}
    Gender: ${gender || 'not specified'}
    
    Assess if this is a medical emergency and provide immediate guidance.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
    });

    const emergencyText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let emergencyData;
    try {
      emergencyData = JSON.parse(emergencyText);
    } catch (parseError) {
      emergencyData = {
        isEmergency: true,
        emergencyLevel: 'Urgent',
        callEmergency: true,
        emergencyNumber: '911',
        immediateActions: ['Call emergency services immediately'],
        whileWaiting: ['Stay calm', 'Monitor breathing'],
        emergencyServices: ['Ambulance', 'Emergency Room'],
        infoForResponders: ['Current symptoms', 'Medical history'],
        warningSigns: ['Difficulty breathing', 'Chest pain'],
        disclaimer: 'This is an AI assessment. Call emergency services immediately for any potential medical emergency.',
        rawResponse: emergencyText
      };
    }

    return res.json({
      success: true,
      data: {
        assessment: emergencyData,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Emergency detection error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to assess emergency situation',
    });
  }
});

// POST /api/ai/health-recommendations
// Expects: { "userId": "user_id", "preferences": {...} }
// Returns: Personalized health recommendations and wellness plan
router.post('/health-recommendations', async (req, res) => {
  try {
    if (!isOpenAIConfigured) {
      return res.json({
        success: true,
        message: 'Health recommendations (simulation mode)',
        recommendations: {
          wellnessScore: 85,
          healthGoals: [
            { goal: 'Maintain healthy blood pressure', priority: 'high' },
            { goal: 'Regular exercise routine', priority: 'medium' },
            { goal: 'Balanced nutrition', priority: 'high' },
            { goal: 'Stress management', priority: 'medium' }
          ],
          personalizedPlan: {
            exercise: '30 minutes moderate exercise, 5 days per week',
            nutrition: 'Focus on whole foods, reduce processed sugar intake',
            sleep: '7-9 hours quality sleep per night',
            hydration: '8 glasses of water daily'
          },
          insights: [
            'Your recent vitals show good overall health',
            'Consider increasing physical activity for better cardiovascular health',
            'Regular health screenings recommended'
          ],
          riskAssessment: {
            overall: 'Low',
            factors: ['Age', 'Family History'],
            recommendations: ['Annual checkups', 'Monitor blood pressure']
          }
        }
      });
    }

    const { userId, age, gender, preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get user's medical data for personalization
    const Appointment = require('../models/Appointment');
    const Prescription = require('../models/Prescription');
    const Test = require('../models/Test');
    const User = require('../models/User');

    const user = await User.findById(userId);
    const appointments = await Appointment.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });
    
    const prescriptions = await Prescription.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ prescribedDate: -1 });
    
    const tests = await Test.find({ patient: userId })
      .populate('doctor', 'name specialization')
      .sort({ testDate: -1 });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an advanced AI health coach and wellness advisor. Generate comprehensive, personalized health recommendations based on the user's:
    - Medical history and current conditions
    - Lifestyle preferences and goals
    - Age and gender
    - Recent appointments and medications
    - Test results and health metrics
    
    Create recommendations that are:
    - Safe and appropriate for the user's health status
    - Actionable and realistic
    - Categorized by type (exercise, diet, sleep, stress, etc.)
    - Prioritized by importance
    - Include difficulty levels and time commitments
    
    Format as JSON with:
    {
      "recommendations": [
        {
          "id": number,
          "category": "exercise|diet|sleep|stress|hydration|medical",
          "title": "recommendation title",
          "description": "detailed description",
          "priority": "high|medium|low",
          "difficulty": "easy|moderate|hard",
          "timeCommitment": "time estimate",
          "benefits": ["benefit1", "benefit2"],
          "actionSteps": ["step1", "step2"],
          "progress": 0
        }
      ],
      "goals": [
        {
          "id": number,
          "title": "goal title",
          "category": "weight|fitness|mental|medical",
          "target": number,
          "current": number,
          "unit": "kg|km|days|mmHg"
        }
      ],
      "wellnessScore": number (0-100),
      "personalizedPlan": {
        "phase": "plan phase name",
        "duration": "time period",
        "focus": ["focus1", "focus2"],
        "weeklySchedule": [
          {
            "day": "Monday",
            "activities": ["activity1", "activity2"]
          }
        ]
      },
      "insights": [
        {
          "type": "positive|warning|opportunity",
          "title": "insight title",
          "description": "detailed insight",
          "confidence": number (0-100)
        }
      ],
      "riskAssessment": {
        "overall": "low|moderate|high|critical",
        "factors": [
          {
            "name": "factor name",
            "risk": "low|moderate|high|critical",
            "score": number (0-100)
          }
        ],
        "recommendations": ["recommendation1", "recommendation2"]
      }
    }`;

    const userData = {
      age: age || user?.age,
      gender: gender || user?.gender,
      preferences: preferences || {
        fitness: 'moderate',
        diet: 'balanced',
        sleep: 'adequate',
        stress: 'moderate'
      },
      medicalHistory: {
        appointments: appointments.map(apt => ({
          date: apt.appointmentDate,
          doctor: apt.doctor?.name,
          specialization: apt.doctor?.specialization,
          reason: apt.reason,
          status: apt.status
        })),
        prescriptions: prescriptions.map(pres => ({
          medications: pres.medications,
          prescribedDate: pres.prescribedDate,
          doctor: pres.doctor?.name,
          status: pres.status
        })),
        tests: tests.map(test => ({
          testName: test.testName,
          testDate: test.testDate,
          result: test.result,
          status: test.status
        }))
      }
    };

    const userPrompt = `Generate personalized health recommendations for this user:
    ${JSON.stringify(userData, null, 2)}
    
    Please create a comprehensive wellness plan with actionable recommendations.`;

    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const recommendationsText = chatResponse.choices?.[0]?.message?.content?.trim();
    
    let recommendationsData;
    try {
      recommendationsData = JSON.parse(recommendationsText);
    } catch (parseError) {
      // Fallback to mock data if JSON parsing fails
      recommendationsData = {
        recommendations: [
          {
            id: 1,
            category: 'exercise',
            title: 'Daily Walking',
            description: 'Walk for 30 minutes daily to improve cardiovascular health',
            priority: 'high',
            difficulty: 'easy',
            timeCommitment: '30 min/day',
            benefits: ['Better heart health', 'Weight management', 'Improved mood'],
            actionSteps: ['Start with 10 minutes', 'Gradually increase time', 'Find a walking partner'],
            progress: 0
          }
        ],
        goals: [
          {
            id: 1,
            title: 'Walk 5K daily',
            category: 'fitness',
            target: 5,
            current: 2,
            unit: 'km'
          }
        ],
        wellnessScore: 75,
        personalizedPlan: {
          phase: 'Foundation Building',
          duration: '4 weeks',
          focus: ['Establishing habits', 'Building consistency'],
          weeklySchedule: [
            { day: 'Monday', activities: ['30 min walk', 'Healthy meal prep'] }
          ]
        },
        insights: [
          {
            type: 'positive',
            title: 'Good Start',
            description: 'You have a solid foundation to build upon',
            confidence: 85
          }
        ],
        riskAssessment: {
          overall: 'low',
          factors: [
            { name: 'Cardiovascular', risk: 'low', score: 15 }
          ],
          recommendations: ['Continue regular exercise']
        }
      };
    }

    return res.json({
      success: true,
      data: recommendationsData,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Health recommendations error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate health recommendations',
    });
  }
});

module.exports = router;

