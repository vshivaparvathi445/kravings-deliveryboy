import React, { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter subject");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/support/message", {
        subject: subject.trim(),
        message: message.trim(),
      });

      toast.success(response.data?.message || "Message sent successfully!");

      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Support API Error:", error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send support message"
      );
    } finally {
      setLoading(false);
    }
  };

  const callSupport = () => {
    window.location.href = "tel:+911800000000";
  };

  const faq = [
    "How can I accept a delivery?",
    "How can I check my earnings?",
    "Why is my order not showing?",
    "How can I update my profile?",
  ];

  return (
    <div className="support-page">
      <header className="support-header">
        <h1>Support</h1>
        <p>How can we help you today?</p>
      </header>

      {/* Contact Support */}
      <div className="support-cards">
        <div className="support-card">
          <div className="support-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M4 4h16v12H7l-3 3V4z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="support-card-body">
            <h3>Live Chat</h3>
            <p>Chat with our support team.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => toast.success("Live Chat will be available soon")}
          >
            Start Chat
          </button>
        </div>

        <div className="support-card">
          <div className="support-card-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.2 1.1L6.6 10.8z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="support-card-body">
            <h3>Call Support</h3>
            <p>Talk directly with our support team.</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={callSupport}>
            Call Support
          </button>
        </div>
      </div>

      {/* Send Message */}
      <div className="support-form-card">
        <h2>Send a message</h2>
        <p>Tell us about your problem and our support team will reply.</p>

        <form onSubmit={sendMessage} noValidate>
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Example: Payment problem"
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              rows="6"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your problem..."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>

      {/* FAQs */}
      <div className="faq-section">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {faq.map((question, index) => (
            <button
              type="button"
              className="faq-item"
              key={index}
              onClick={() => toast(question)}
            >
              <span>{question}</span>
              <span className="faq-chevron" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
