import React, { useEffect, useRef, useState } from 'react';
import { sendGabaiMessage } from '../api';
import './GabAIChat.css';

const introMessage = {
  role: 'assistant',
  content: 'Marhay na aldaw, I am GabAI. How may I help you?  •᎑• ',
};

const cleanReply = (text = '') =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

function GabAIAvatar({ compact = false }) {
  return (
    <span className={`gabai-avatar${compact ? ' compact' : ''}`} aria-hidden="true">
      <span className="gabai-avatar-antenna" />
      <span className="gabai-avatar-bow" />
      <span className="gabai-avatar-eye left" />
      <span className="gabai-avatar-eye right" />
      <span className="gabai-avatar-cheek left" />
      <span className="gabai-avatar-cheek right" />
      <span className="gabai-avatar-smile" />
    </span>
  );
}

export default function GabAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([introMessage]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const submit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    try {
      const history = nextMessages
        .filter((msg) => msg !== introMessage)
        .map((msg) => ({ role: msg.role, content: msg.content }));
      const res = await sendGabaiMessage(text, history);
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: cleanReply(res.data.reply) },
      ]);
    } catch (err) {
      const errorMessage = err.response?.data?.error
        || 'GabAI had trouble connecting. Please try again, or ask about products, stock, recommendations, or how to order.';
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gabai">
      {open && (
        <section className="gabai-panel" aria-label="GabAI chatbot">
          <header className="gabai-header">
            <div>
              <strong>GabAI</strong>
              <span>AniKahon assistant</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close GabAI">
              x
            </button>
          </header>

          <div className="gabai-messages">
            {messages.map((message, index) => (
              <div className={`gabai-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {busy && <div className="gabai-message assistant">GabAI is typing...</div>}
            <div ref={endRef} />
          </div>

          <form className="gabai-form" onSubmit={submit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products..."
              aria-label="Message GabAI"
            />
            <button type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        className="gabai-launcher"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open GabAI chatbot"
      >
        <GabAIAvatar />
        <span className="gabai-launcher-label">GabAI</span>
      </button>
    </div>
  );
}
