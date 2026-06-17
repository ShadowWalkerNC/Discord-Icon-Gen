'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Text generation ────────────────────────────────────────────────────────────
async function geminiRequest(prompt, { temperature = 0.9, maxOutputTokens = 512 } = {}) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { temperature, maxOutputTokens },
    });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// ── Image generation ───────────────────────────────────────────────────────────
async function geminiImageRequest(prompt) {
    const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' });
    const result = await model.generateImages({
        prompt,
        numberOfImages: 1,
        aspectRatio: '1:1',
    });
    const b64 = result.generatedImages?.[0]?.image?.imageBytes;
    if (!b64) throw new Error('No image returned from Imagen');
    return Buffer.from(b64, 'base64');
}

// ── JSON extractor ─────────────────────────────────────────────────────────────
function extractJson(raw) {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in Gemini response');
    return JSON.parse(match[0]);
}

module.exports = { geminiRequest, geminiImageRequest, extractJson };
