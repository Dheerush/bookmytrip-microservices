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

  // Try Gemini first
  const contextStr = context ? `\nContext: ${JSON.stringify(context)}` : '';
  const geminiPrompt = `You are Yatra, a friendly and helpful AI assistant for BookMyTrip — an Indian travel booking platform offering flights, trains, cabs, and hotels. Answer the following user message concisely and helpfully in 1-3 sentences. Use a warm, professional tone. If unsure, suggest the user contact support@bookmytrip.com.${contextStr}\n\nUser: ${message}`;
  const geminiReply = await callGemini(geminiPrompt);

  if (geminiReply) {
    res.status(200).json({ success: true, message: 'Support response generated', data: { reply: geminiReply, powered_by: 'gemini' } });
    return;
  }

  // Fallback to rule-based
  const msg = message.toLowerCase();
  const reply = msg.includes('refund')
    ? 'Refunds depend on fare rules and cancellation window. Open your booking and check the refund panel before submitting.'
    : msg.includes('payment')
      ? 'For payment failures, verify card details and retry once. If amount is debited, do not retry immediately; check payment status in booking history.'
      : 'I can help with itinerary, booking status, refunds, and offer eligibility. Share booking reference or route for a precise answer.';

  res.status(200).json({ success: true, message: 'Support response generated', data: { reply, powered_by: 'fallback' } });
});

export default router;
