/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Increase payload limit to support image & audio base64 uploads
app.use(express.json({ limit: '25mb' }));

// Initialize GoogleGenAI SDK with server-side environment key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// PART A: Photo Freshness Check Endpoint
app.post('/api/gemini/photo-freshness', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: 'Analyze this photo of food in an institutional kitchen for freshness, quality, and spoilage indicators.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction:
          'You are a food-safety assistant for an Indian institutional kitchen. Look at this photo of food. Return JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_food: {
              type: Type.BOOLEAN,
              description: 'Whether the photo contains edible food items',
            },
            food_identified: {
              type: Type.STRING,
              description: 'Name of the dish or ingredients identified in the photo',
            },
            freshness_score: {
              type: Type.INTEGER,
              description: 'Freshness rating from 0 (heavily spoiled/mouldy/inedible) to 100 (pristine fresh)',
            },
            visible_issues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of visible physical issues like mould, discolouration, wilting, slime, dryness, none',
            },
            confidence: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high'],
              description: 'Confidence in this visual assessment',
            },
            note: {
              type: Type.STRING,
              description: 'One short, concise sentence summarizing the visual food safety verdict',
            },
          },
          required: ['is_food', 'food_identified', 'freshness_score', 'visible_issues', 'confidence', 'note'],
        },
      },
    });

    const textOutput = response.text?.trim() || '{}';
    const parsed = JSON.parse(textOutput);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/photo-freshness:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process food freshness analysis',
      isRateLimit: error?.status === 429 || error?.message?.includes('429'),
    });
  }
});

// PART C: Plate-Waste Check Endpoint (Learn)
app.post('/api/gemini/plate-waste', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 in request body' });
    }

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: imageBase64,
      },
    };

    const textPart = {
      text: 'Analyze this photo of a meal tray or plate after dining. Estimate the percentage of food left and identify the main leftover item.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction:
          'You are a food-waste auditor for an Indian institutional canteen. Look at this photo of a meal tray or plate after consumption. Estimate the percentage of food left on the plate (0-100%) and identify the main leftover item. Return JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            is_tray: {
              type: Type.BOOLEAN,
              description: 'Whether the image contains a food tray, plate, thali, or meal leftover',
            },
            waste_percentage: {
              type: Type.INTEGER,
              description: 'Estimated percentage of served food remaining uneaten (0-100)',
            },
            main_leftover_item: {
              type: Type.STRING,
              description: 'Main food item remaining on the tray (e.g. Rice, Chapati, Dal, Sabzi, Salad)',
            },
            confidence: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high'],
              description: 'Confidence in this visual waste assessment',
            },
            note: {
              type: Type.STRING,
              description: 'One concise explanatory sentence summarizing the plate waste observation',
            },
          },
          required: ['is_tray', 'waste_percentage', 'main_leftover_item', 'confidence', 'note'],
        },
      },
    });

    const textOutput = response.text?.trim() || '{}';
    const parsed = JSON.parse(textOutput);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/plate-waste:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process plate waste analysis',
      isRateLimit: error?.status === 429 || error?.message?.includes('429'),
    });
  }
});

// PART B: Voice Batch Entry Endpoint
app.post('/api/gemini/voice-batch', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    // Clean mime type string if needed (strip codecs=opus parameter for Gemini audio input)
    let cleanMimeType = (mimeType || 'audio/webm').split(';')[0].trim();
    if (!cleanMimeType) cleanMimeType = 'audio/webm';

    const audioPart = {
      inlineData: {
        mimeType: cleanMimeType,
        data: audioBase64,
      },
    };

    const textPart = {
      text: 'Listen carefully to the worker voice note. Transcribe faithfully and extract food batch metadata.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [audioPart, textPart] },
      config: {
        systemInstruction:
          'Transcribe this audio exactly as spoken. It may be in English, Hindi, Tamil or another Indian language. Then extract the batch details. Return JSON only.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: {
              type: Type.STRING,
              description: 'Exact transcription in the original language spoken',
            },
            language: {
              type: Type.STRING,
              description: 'Primary language identified, e.g. English, Hindi, Tamil, Hinglish, Bengali, etc.',
            },
            dish: {
              type: Type.STRING,
              description: 'Extracted dish name or food title',
            },
            category: {
              type: Type.STRING,
              enum: ['Cooked', 'Raw/Bulk', 'Packaged'],
              description: 'Category: Cooked, Raw/Bulk, Packaged, or null if unknown',
            },
            quantity_kg: {
              type: Type.NUMBER,
              description: 'Quantity in kilograms as a positive number, or null if not stated',
            },
            temperature_c: {
              type: Type.NUMBER,
              description: 'Measured or storage temperature in degrees Celsius, or null if not stated',
            },
            storage: {
              type: Type.STRING,
              enum: ['Ambient', 'Chilled', 'Hot-hold'],
              description: 'Storage condition: Ambient, Chilled, Hot-hold, or null if not stated',
            },
            allergens: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Explicit allergens mentioned, or empty array',
            },
          },
          required: ['transcript', 'language', 'dish', 'allergens'],
        },
      },
    });

    const textOutput = response.text?.trim() || '{}';
    const parsed = JSON.parse(textOutput);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/gemini/voice-batch:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to process voice batch audio',
      isRateLimit: error?.status === 429 || error?.message?.includes('429'),
    });
  }
});

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AnnaChakra server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
