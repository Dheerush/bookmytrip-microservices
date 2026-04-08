import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env';

const router: Router = Router();

// ── Gemini helper ────────────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  }
}

const itinerarySchema = z.object({
  from: z.string().min(2),
  destination: z.string().min(2),
  days: z.number().int().min(1).max(20),
  budget: z.number().positive(),
  interests: z.array(z.string()).default([]),
});

const supportSchema = z.object({
  message: z.string().min(3).max(1200),
  context: z.record(z.string(), z.unknown()).optional(),
});

router.post('/itinerary-suggestions', async (req, res) => {
  const parsed = itinerarySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Validation failed', code: 'VALIDATION_ERROR' });
    return;
  }

  const { destination, days, budget, interests, from } = parsed.data;

  // Try Gemini first
  const interestStr = interests.length ? interests.join(', ') : 'general sightseeing';
  const geminiPrompt = `You are a travel planner for India. Create a concise ${days}-day itinerary travelling from ${from} to ${destination} with a total budget of INR ${budget}. Interests: ${interestStr}. For each day provide a headline and 3 activity bullet points. Keep your response under 500 words.`;
  const geminiText = await callGemini(geminiPrompt);

  if (geminiText) {
    res.status(200).json({
      success: true,
      message: 'Itinerary generated',
      data: { from, destination, days, budget, text: geminiText, powered_by: 'gemini' },
    });
    return;
  }

  // Fallback to rule-based
  const perDay = Math.floor(budget / days);
  const suggestions = Array.from({ length: days }).map((_, index) => ({
    day: index + 1,
    headline: `Day ${index + 1} in ${destination}`,
    activities: [
      `Explore local highlights near ${destination}`,
      interests[0] ? `Focus on ${interests[0]} experiences` : 'Add one curated experience',
      `Target spend: around INR ${perDay}`,
    ],
  }));

  res.status(200).json({
    success: true,
    message: 'Itinerary generated',
    data: { from, destination, days, budget, suggestions, powered_by: 'fallback' },
  });
});

router.post('/support', async (req, res) => {
  const parsed = supportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Validation failed', code: 'VALIDATION_ERROR' });
    return;
  }

  const { message, context } = parsed.data;

  const SYSTEM_PROMPT = `You are Yatra, the AI assistant for BookMyTrip — India's travel booking platform for flights, trains, cabs, and hotels.

Your capabilities:
1. Help users search for flights, trains, cabs, and hotels by extracting travel parameters
2. Explain booking status and travel policies
3. Guide users through raising or checking support complaints
4. Answer FAQs about booking, cancellation, refunds, baggage, and travel tips
5. Provide personalised travel suggestions

Classify the user's intent into exactly one of:
  FLIGHTS_SEARCH | TRAINS_SEARCH | CABS_SEARCH | HOTELS_SEARCH | BOOKING_STATUS | COMPLAINT | FAQ | GENERAL

Rules:
- For *_SEARCH intents, extract travel parameters from the message (from, to, date, passengers, budget, cabinClass, seatClass)
- Dates should be normalised to YYYY-MM-DD format if determinable; otherwise null
- For COMPLAINT, extract bookingRef and issue description if mentioned
- Always reply in friendly, helpful, concise Indian-English (mix of formal and warm tone)
- Never invent booking details — only work with what the user provides

Respond ONLY with a valid JSON object (no markdown, no explanation outside JSON):
{
  "intent": "<INTENT>",
  "params": {
    "from": "<city or null>",
    "to": "<city or null>",
    "date": "<YYYY-MM-DD or null>",
    "passengers": <number or null>,
    "budget": <INR number or null>,
    "cabinClass": "<economy|premiumEconomy|business or null>",
    "seatClass": "<sleeper|ac3Tier|ac2Tier|ac1st|general or null>",
    "bookingRef": "<ref or null>",
    "issue": "<issue description or null>"
  },
  "reply": "<Your natural language response to the user — 2-4 sentences>"
}`;

  const fullPrompt = `${SYSTEM_PROMPT}${context ? `\n\nSession context: ${JSON.stringify(context)}` : ''}\n\nUser message: ${message}`;

  const rawGeminiReply = await callGemini(fullPrompt);

  if (rawGeminiReply) {
    try {
      // Strip markdown code fences if Gemini wraps the JSON
      const jsonStr = rawGeminiReply.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const structured = JSON.parse(jsonStr) as {
        intent: string;
        params: Record<string, unknown>;
        reply: string;
      };
      res.status(200).json({
        success: true,
        message: 'Support response generated',
        data: {
          reply: structured.reply ?? rawGeminiReply,
          intent: structured.intent ?? 'GENERAL',
          params: structured.params ?? {},
          powered_by: 'gemini',
        },
      });
      return;
    } catch {
      // JSON parse failed — fall back to returning raw reply
      res.status(200).json({
        success: true,
        message: 'Support response generated',
        data: { reply: rawGeminiReply, intent: 'GENERAL', params: {}, powered_by: 'gemini' },
      });
      return;
    }
  }

  // Rule-based fallback
  const msg = message.toLowerCase();
  let intent = 'GENERAL';
  let reply: string;

  if (msg.includes('flight') || msg.includes('fly') || msg.includes('plane')) {
    intent = 'FLIGHTS_SEARCH';
    reply = 'I can help you search for flights! Please share your departure city, destination, travel date, and number of passengers.';
  } else if (msg.includes('train') || msg.includes('rail') || msg.includes('irctc')) {
    intent = 'TRAINS_SEARCH';
    reply = 'Looking for a train? Tell me your departure city, destination, and travel date.';
  } else if (msg.includes('cab') || msg.includes('taxi') || msg.includes('car')) {
    intent = 'CABS_SEARCH';
    reply = 'I can help you find a cab. Share your pickup city, destination, and travel date.';
  } else if (msg.includes('hotel') || msg.includes('stay') || msg.includes('room')) {
    intent = 'HOTELS_SEARCH';
    reply = 'Looking for accommodation? Let me know the city, check-in date, and number of nights.';
  } else if (msg.includes('refund')) {
    intent = 'FAQ';
    reply = 'Refunds are processed within 5–7 business days after cancellation. You can check refund status in your booking history.';
  } else if (msg.includes('cancel')) {
    intent = 'FAQ';
    reply = 'To cancel a booking, go to My Bookings, select the booking, and click Cancel. Refund eligibility depends on the fare rules.';
  } else if (msg.includes('complaint') || msg.includes('issue') || msg.includes('problem')) {
    intent = 'COMPLAINT';
    reply = 'I\'m sorry you\'re facing an issue. Please share your booking reference and a brief description, and I\'ll raise a support ticket right away.';
  } else if (msg.includes('booking') || msg.includes('status')) {
    intent = 'BOOKING_STATUS';
    reply = 'I can check your booking status. Please share the booking reference number.';
  } else {
    reply = 'Hello! I\'m Yatra, your BookMyTrip assistant. I can help with flights, trains, cabs, hotels, booking status, refunds, and more. What can I help you with today?';
  }

  res.status(200).json({
    success: true,
    message: 'Support response generated',
    data: { reply, intent, params: {}, powered_by: 'fallback' },
  });
});

export default router;
