import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

let genAIClient = null;

try {
  if (apiKey) {
    genAIClient = new GoogleGenAI({ apiKey });
    console.log('✨ Gemini SDK initialized successfully with configured API key.');
  } else {
    console.warn('⚠️ GEMINI_API_KEY is not set. Real AI optimization will fallback to local heuristic solver until key is provided.');
    // Initialize without key or handle gracefully
    genAIClient = new GoogleGenAI({ apiKey: 'UNCONFIGURED_KEY' });
  }
} catch (err) {
  console.error('⚠️ Gemini client initialization warning:', err.message);
}

export const ai = genAIClient;
export const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
