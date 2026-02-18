const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// fallback key if env not set (User will need to set this)
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

router.post('/', async (req, res) => {
    console.log('📨 /api/chat Request received');
    try {
        const { message, history } = req.body;
        console.log('💬 User Message:', message);

        if (!message) {
            console.log('❌ No message provided');
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('🔑 Using API Key:', API_KEY ? 'Yes (Hidden)' : 'No (Missing)');

        // For better health context
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const contextPrompt = `
      You are HealthHive AI, a helpful and empathetic medical assistant. 
      Your goal is to provide general health information and guidance.
      
      IMPORTANT RULES:
      1. Always clarify that you are an AI, not a doctor.
      2. If a user describes serious symptoms (chest pain, difficulty breathing, severe bleeding), tell them to seek immediate emergency medical help.
      3. Keep responses concise, friendly, and easy to understand.
      4. Do not prescribe medication.
      
      User content: ${message}
    `;

        console.log('🤖 Sending to Gemini...');
        const result = await model.generateContent(contextPrompt);
        const response = await result.response;
        const text = response.text();
        console.log('✅ Gemini Reponse:', text.substring(0, 50) + '...');

        res.json({ reply: text });

    } catch (error) {
        console.error('❌ Chat Route Error:', error);
        // Graceful fallback so the UI shows a message instead of an error
        console.log('⚠️ Falling back to offline response due to API error');
        res.json({
            reply: "My AI brain is currently locked (API Key 403 Forbidden). Please generate a new key at aistudio.google.com and update the .env file to fix me!",
        });
    }
});

module.exports = router;
