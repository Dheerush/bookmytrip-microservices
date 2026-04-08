"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./AiAssistant.module.scss";

interface Message {
  id: string;
  role: "assistant" | "user";
  text: string;
  actionLink?: { label: string; href: string };
}

interface AiApiData {
  reply?: string;
  intent?: string;
  params?: {
    from?: string;
    to?: string;
    date?: string;
    passengers?: number;
    budget?: number;
    cabinClass?: string;
    seatClass?: string;
    bookingRef?: string;
    issue?: string;
  };
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

function buildActionLink(intent: string, params: AiApiData["params"]): { label: string; href: string } | undefined {
  if (!intent || !params) return undefined;
  const { from, to, date, passengers, cabinClass, seatClass } = params;

  if (intent === "FLIGHTS_SEARCH" && from && to) {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    if (date) p.set("date", date);
    if (passengers) p.set("passengers", String(passengers));
    if (cabinClass) p.set("class", cabinClass);
    return { label: `Search Flights: ${from} → ${to}`, href: `/flights?${p.toString()}` };
  }
  if (intent === "TRAINS_SEARCH" && from && to) {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    if (date) p.set("date", date);
    if (passengers) p.set("passengers", String(passengers));
    if (seatClass) p.set("class", seatClass);
    return { label: `Search Trains: ${from} → ${to}`, href: `/trains?${p.toString()}` };
  }
  if (intent === "CABS_SEARCH" && from) {
    const p = new URLSearchParams({ city: from });
    if (to) p.set("drop", to);
    if (date) p.set("date", date);
    return { label: `Search Cabs from ${from}`, href: `/cabs?${p.toString()}` };
  }
  if (intent === "HOTELS_SEARCH") {
    const p = new URLSearchParams();
    if (to) p.set("city", to);
    else if (from) p.set("city", from);
    if (date) p.set("checkIn", date);
    return { label: "Browse Hotels", href: `/hotels?${p.toString()}` };
  }
  if (intent === "BOOKING_STATUS") {
    return { label: "My Bookings", href: "/dashboard/bookings" };
  }
  if (intent === "COMPLAINT") {
    return { label: "Raise a Ticket", href: "/dashboard/support/new" };
  }
  return undefined;
}

async function fetchBotReply(message: string): Promise<{ text: string; actionLink?: { label: string; href: string } }> {
  try {
    const res = await fetch("/api/ai/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("API error");
    const json = await res.json() as { data?: AiApiData };
    const data = json?.data;
    const reply = data?.reply ?? "I'm having trouble responding right now. Please try again in a moment.";
    const actionLink = data?.intent ? buildActionLink(data.intent, data.params) : undefined;
    return { text: reply, actionLink };
  } catch {
    return { text: "Sorry, I couldn't connect to the assistant. Please try again shortly." };
  }
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || typing) return;

    msgIdRef.current += 1;

    const userMsg: Message = {
      id: `u-${msgIdRef.current}`,
      role: "user",
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const { text: replyText, actionLink } = await fetchBotReply(text.trim());

    msgIdRef.current += 1;
    const botReply: Message = {
      id: `b-${msgIdRef.current}`,
      role: "assistant",
      text: replyText,
      actionLink,
    };
    setMessages((prev) => [...prev, botReply]);
    setTyping(false);
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
                  {msg.actionLink && (
                    <a
                      href={msg.actionLink.href}
                      className={styles.actionLink}
                      target="_self"
                      onClick={() => setOpen(false)}
                    >
                      {msg.actionLink.label} →
                    </a>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className={`${styles.bubble} ${styles.assistant}`}>
                <span className={styles.typingDots}><span /><span /><span /></span>
              </div>
            )}
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
            <button className={styles.sendBtn} type="submit" disabled={!input.trim() || typing}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
