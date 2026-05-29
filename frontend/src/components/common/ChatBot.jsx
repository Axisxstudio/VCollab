import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, Sparkles, ChevronDown,
  Zap, User, RotateCcw, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import '../../styles/chatbot.css';

const SAMPLE_QUESTIONS = [
  "What is VCollab?",
  "Show me the latest projects",
  "How do I collaborate on a project?",
  "What are the trending projects?",
  "How does the follow system work?",
  "Tell me about the blog feature",
];

function TypingIndicator() {
  return (
    <div className="vca-typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`vca-message ${isUser ? 'vca-message--user' : 'vca-message--bot'}`}
    >
      {!isUser && (
        <div className="vca-message-avatar">
          <Bot size={14} />
        </div>
      )}
      <div className="vca-message-bubble">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <div className="vca-message-markdown">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => {
                    if (href && href.startsWith('/')) {
                      e.preventDefault();
                      window.location.href = href;
                    }
                  }}>
                    {children}
                  </a>
                ),
                p: ({ children }) => <p>{children}</p>,
                strong: ({ children }) => <strong>{children}</strong>,
                ul: ({ children }) => <ul>{children}</ul>,
                li: ({ children }) => <li>{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        {!isUser && message.content && (
          <button className="vca-copy-btn" onClick={handleCopy} title="Copy message">
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        )}
      </div>
      {isUser && (
        <div className="vca-message-avatar vca-message-avatar--user">
          <User size={14} />
        </div>
      )}
    </motion.div>
  );
}

export default function ChatBot({ position = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [text, setText] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [messages, setMessages] = useState([]);

  const sendMessage = async (userText) => {
    if (!userText.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: userText };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setIsLoading(true);

    const botId = (Date.now() + 1).toString();
    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setMessages(prev => [...prev, { id: botId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        botText += chunk;
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: botText } : m));
      }

      // If response came back empty, show fallback
      if (!botText.trim()) {
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: '⚠️ The AI returned an empty response. The service may be rate-limited. Please try again in a moment.' } : m));
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => {
        const hasBotMsg = prev.some(m => m.id === botId);
        const errMsg = { id: botId, role: 'assistant', content: '⚠️ Could not connect. Please check your connection and try again.' };
        return hasBotMsg ? prev.map(m => m.id === botId ? errMsg : m) : [...prev, errMsg];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setHasInteracted(true);
    setText('');
    sendMessage(trimmed);
  };

  const handleSampleQuestion = (q) => {
    setHasInteracted(true);
    setIsOpen(true);
    sendMessage(q);
  };

  const handleReset = () => {
    setMessages([]);
    setHasInteracted(false);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`vca-container vca-container--${position}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="vca-window"
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="vca-window"
          >
            {/* Header */}
            <div className="vca-header">
              <div className="vca-header-glow" />
              <div className="vca-header-content">
                <div className="vca-header-bot-icon">
                  <Bot size={18} />
                  <div className="vca-online-dot" />
                </div>
                <div className="vca-header-info">
                  <span className="vca-header-name">VCollab Assistant</span>
                  <span className="vca-header-status">
                    <Sparkles size={10} />
                    Online
                  </span>
                </div>
                <div className="vca-header-actions">
                  <button className="vca-icon-btn" onClick={handleReset} title="Reset conversation">
                    <RotateCcw size={15} />
                  </button>
                  <button className="vca-icon-btn" onClick={() => setIsOpen(false)} title="Close">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="vca-messages">
              {messages.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="vca-welcome-screen"
                >
                  <div className="vca-welcome-icon">
                    <Bot size={28} />
                  </div>
                  <h3>Welcome to VCollab AI</h3>
                  <p>I can help you discover projects, learn about features, and find collaborators.</p>
                  
                  <div className="vca-suggestions-grid">
                    {SAMPLE_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        className="vca-suggestion-chip"
                        onClick={() => handleSampleQuestion(q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((m) => (
                    <MessageBubble key={m.id} message={m} />
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="vca-message vca-message--bot"
                    >
                      <div className="vca-message-avatar">
                        <Bot size={14} />
                      </div>
                      <div className="vca-message-bubble">
                        <TypingIndicator />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="vca-input-area">
              <form onSubmit={handleSubmit} className="vca-input-form">
                <textarea
                  ref={inputRef}
                  className="vca-textarea"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about VCollab..."
                  rows={1}
                />
                <button
                  type="submit"
                  className="vca-send-btn"
                  disabled={isLoading || !text.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="vca-trigger"
            className="vca-trigger-wrapper"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Tooltip on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className={`vca-tooltip vca-tooltip--${position}`}
                  initial={{ opacity: 0, x: position === 'left' ? -8 : 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Bot size={14} />
                  <span>Ask VCollab AI</span>
                  <ChevronDown size={12} style={{ rotate: position === 'left' ? '90deg' : '-90deg' }} />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              className="vca-fab"
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              <div className="vca-fab-glow" />
              <MessageSquare size={26} />
              <span className="vca-fab-pulse" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
