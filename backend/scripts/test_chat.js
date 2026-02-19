const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testChat() {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        console.error('❌ GEMINI_API_KEY is missing in .env');
        return;
    }

    console.log('🔑 Testing API Key:', API_KEY);
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        console.log('Attempting to use gemini-pro model...');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = "Hello, are you working?";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('✅ Chatbot is working! Response:', text);
    } catch (error) {
        console.error('❌ Chatbot check failed!');
        console.error('Error Message:', error.message);
        // Only log status code if available
        if (error.response) {
            console.error('Status:', error.response.status, error.response.statusText);
        }
    }
}

testChat();
