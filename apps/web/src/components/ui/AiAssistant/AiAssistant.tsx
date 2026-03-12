"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AiAssistant.module.scss";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const QUICK_ACTIONS = [
  { label: "🏨 Hotel Recommendations", prompt: "Can you recommend some good hotels?" },
  { label: "✈️ Best Flight Deals", prompt: "Show me the best flight deals right now." },
  { label: "🗺️ Plan My Trip", prompt: "Help me plan a trip to Goa." },
  { label: "📞 Raise a Complaint", prompt: "I want to raise a complaint about my booking." },
  { label: "❓ FAQs", prompt: "What are the frequently asked questions?" },
  { label: "💡 Travel Tips", prompt: "Share some travel tips for first-time travellers." },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  text: "👋 Namaste! I'm **Yatra**, your BookMyTrip AI assistant. I can help you with recommendations, bookings, complaints, travel tips, and more. How can I help you today?",
};

function getBotReply(userMsg: string): string {
  const lower = userMsg.toLowerCase();

  if (lower.includes("hotel") || lower.includes("stay"))
    return "🏨 Great choice! I'd recommend checking out our top-rated hotels in Goa, Jaipur, and Mumbai. Visit the Hotels page for live availability and exclusive discounts!";

  if (lower.includes("flight") || lower.includes("fly") || lower.includes("deal"))
    return "✈️ We have amazing flight deals! Check flights from Delhi to Goa starting ₹2,999. Head to the Flights page to search and compare.";

  if (lower.includes("train") || lower.includes("rail"))
    return "🚂 Looking for train bookings? We have 25+ trains across major routes. Visit the Trains page to find the perfect journey.";

  if (lower.includes("cab") || lower.includes("taxi") || lower.includes("car"))
    return "🚕 Need a ride? We offer Sedans, SUVs, MUVs, and Luxury cabs across all major cities. Check the Cabs page for pricing!";

  if (lower.includes("complaint") || lower.includes("issue") || lower.includes("problem"))
    return "📞 I'm sorry to hear that! Please share your booking ID and the issue you're facing. Our support team will connect with you within 24 hours. You can also email us at support@bookmytrip.com.";

  if (lower.includes("faq") || lower.includes("question"))
    return "❓ **FAQs:**\n• Cancel up to 24hrs before for full refund\n• Booking confirmation via email & SMS\n• Support available 24/7 via chat\n• EMI options on bookings above ₹5,000\n• Loyalty points on every booking!";

  if (lower.includes("tip") || lower.includes("advice"))
    return "💡 **Travel Tips:**\n• Book in advance for best prices\n• Tuesday & Wednesday flights are cheapest\n• Always carry a copy of your ID\n• Download offline maps\n• Pack light — you'll thank yourself later!";

  if (lower.includes("plan") || lower.includes("trip") || lower.includes("recommend"))
    return "🗺️ I'd love to help you plan! Tell me your destination, dates, and budget — I'll suggest the best flights, hotels, and activities for you.";

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
    return "👋 Hello! Welcome to BookMyTrip. What can I help you with — flights, hotels, trains, or cabs?";

  return "Thanks for your message! I can help with hotel recommendations, flight deals, trip planning, complaints, and more. Try asking me something specific! 😊";
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    msgIdRef.current += 1;
    const userId = `u-${msgIdRef.current}`;

    const userMsg: Message = {
      id: userId,
      role: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate bot reply
    setTimeout(() => {
      msgIdRef.current += 1;
      const botReply: Message = {
        id: `b-${msgIdRef.current}`,
        role: "assistant",
        text: getBotReply(text),
      };
      setMessages((prev) => [...prev, botReply]);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`${styles.fab} ${open ? styles.fabHidden : ""}`}
        onClick={() => setOpen(true)}
        type="button"
        aria-label="Open AI Assistant"
      >
        <span className={styles.fabIcon}>🤖</span>
        <span className={styles.fabLabel}>Yatra</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <span className={styles.headerIcon}>🤖</span>
              <div>
                <div className={styles.headerName}>Yatra</div>
                <div className={styles.headerStatus}>AI Travel Assistant</div>
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              type="button"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${msg.role === "user" ? styles.msgUser : styles.msgBot}`}
              >
                <div className={styles.msgBubble}>
                  {msg.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                      {i < msg.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className={styles.quickActions}>
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  className={styles.quickBtn}
                  type="button"
                  onClick={() => sendMessage(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <form className={styles.inputBar} onSubmit={handleSubmit}>
            <input
              className={styles.chatInput}
              placeholder="Ask Yatra anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className={styles.sendBtn} type="submit" disabled={!input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
