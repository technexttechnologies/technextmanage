"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { getLiveChatTicket, sendChatMessage } from "./chat-actions";
import { formatDistanceToNow } from "date-fns";

export function ClientChatWidget({ token }: { token: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages when opened
  useEffect(() => {
    if (isOpen) {
      loadMessages();
      // Optional: Set up a polling interval to get new messages from admin
      const interval = setInterval(loadMessages, 10000); // poll every 10s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadMessages = async () => {
    try {
      const ticket = await getLiveChatTicket(token);
      if (ticket && ticket.messages) {
        setMessages(ticket.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const optimisticMessage = {
      id: "temp-" + Date.now(),
      message: inputText,
      senderId: null, // From customer
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText("");
    setLoading(true);
    scrollToBottom();

    try {
      const updatedMessages = await sendChatMessage(token, optimisticMessage.message);
      setMessages(updatedMessages);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          backgroundColor: "var(--brand-primary)",
          color: "white",
          border: "none",
          boxShadow: "var(--shadow-lg)",
          cursor: "pointer",
          display: isOpen ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <MessageCircle size={30} />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "30px",
            right: "30px",
            width: "350px",
            height: "500px",
            backgroundColor: "var(--surface-card)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-xl)",
            display: "flex",
            flexDirection: "column",
            zIndex: 10000,
            overflow: "hidden",
            border: "1px solid var(--surface-border)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {/* Header */}
          <div style={{ backgroundColor: "var(--brand-primary)", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>Chat with TechNext</h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", opacity: 0.9 }}>We typically reply within a few hours.</p>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", padding: "4px" }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "var(--surface-background)" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px", fontSize: "14px" }}>
                <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: "10px" }} />
                <p>No messages yet.<br/>How can we help you today?</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = !msg.senderId;
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isCustomer ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        backgroundColor: isCustomer ? "var(--brand-primary)" : "var(--surface-card)",
                        color: isCustomer ? "white" : "var(--text-primary)",
                        border: isCustomer ? "none" : "1px solid var(--surface-border)",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        borderBottomRightRadius: isCustomer ? "4px" : "12px",
                        borderBottomLeftRadius: !isCustomer ? "4px" : "12px",
                      }}
                    >
                      {msg.message}
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {formatDistanceToNow(new Date(msg.createdAt))} ago
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} style={{ padding: "16px", backgroundColor: "var(--surface-card)", borderTop: "1px solid var(--surface-border)", display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "20px",
                border: "1px solid var(--surface-border)",
                backgroundColor: "var(--surface-background)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px",
                backgroundColor: inputText.trim() ? "var(--brand-primary)" : "var(--surface-border)",
                color: "white",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: inputText.trim() ? "pointer" : "not-allowed",
                transition: "background-color 0.2s",
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : <Send size={18} style={{ marginLeft: "2px" }} />}
            </button>
          </form>
          <style dangerouslySetInnerHTML={{__html: `
            .spin { animation: spin 1s linear infinite; }
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}
    </>
  );
}
