import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateBrandProfile(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const sys = `You are a Discord server branding expert. Given a description, return ONLY valid JSON with these fields:
{
  "brand_name": string,
  "tagline": string,
  "primary_color": "#RRGGBB",
  "secondary_color": "#RRGGBB",
  "font_key": "oswald" | "bebas-neue" | "another-danger" | "dancing-script",
  "background_key": "plain-black" | "plain-white" | "cyberpunk-grid" | "carbon-fiber" | "starfield" | "midnight-gradient" | "sunset",
  "glow_level": 0-25,
  "border_style": "none" | "neon" | "sharp" | "flame" | "katana" | "spirit"
}
No markdown. No explanation. Just JSON.`;

  const result = await model.generateContent(`${sys}\n\nDescription: ${prompt}`);
  const text   = result.response.text().trim();
  const clean  = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}
