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

async function fetchBotReply(message: string): Promise<string> {
  try {
    const res = await fetch("/api/ai/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json() as { data?: { reply?: string } };
    return data?.data?.reply ?? "I'm having trouble responding right now. Please try again in a moment.";
  } catch {
    return "Sorry, I couldn't connect to the assistant. Please try again shortly.";
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

    const replyText = await fetchBotReply(text.trim());

    msgIdRef.current += 1;
    const botReply: Message = {
      id: `b-${msgIdRef.current}`,
      role: "assistant",
      text: replyText,
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
