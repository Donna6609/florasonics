import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import { usePullToRefresh } from "@/components/usePullToRefresh";

const EMOJI_OPTIONS = ["❤️", "😂", "😮", "😢", "👍", "🌿"];

function MessageBubble({ msg }) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState({});

  const addReaction = (emoji) => {
    setReactions(prev => ({
      ...prev,
      [emoji]: (prev[emoji] || 0) + 1,
    }));
    setShowPicker(false);
  };

  return (
    <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
      <div className="relative group">
        <div
          className={`max-w-xs sm:max-w-md px-4 py-3 rounded-2xl cursor-pointer ${
            msg.role === "user"
              ? "bg-emerald-600/40 border border-emerald-500/50 text-white/90"
              : "bg-white/[0.08] border border-white/[0.12] text-white/80"
          }`}
          onClick={() => setShowPicker(p => !p)}
        >
          <p className="text-sm leading-relaxed">{msg.content}</p>
        </div>

        {/* Emoji picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 4 }}
              className={`absolute z-10 flex gap-1 bg-slate-800 border border-white/10 rounded-full px-2 py-1.5 shadow-xl ${
                msg.role === "user" ? "right-0" : "left-0"
              } -bottom-10`}
            >
              {EMOJI_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={(e) => { e.stopPropagation(); addReaction(emoji); }}
                  aria-label={`React with ${emoji}`}
                  className="text-lg hover:scale-125 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reaction counts */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {Object.entries(reactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => addReaction(emoji)}
              className="flex items-center gap-0.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full px-2 py-0.5 text-xs text-white/80 transition-colors"
            >
              {emoji} <span>{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const queryClient = useQueryClient();
  const [conversationId] = useState(uuidv4());
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch messages for current conversation
  const { data: chatMessages = [] } = useQuery({
    queryKey: ["chatMessages", conversationId],
    queryFn: () => base44.entities.ChatMessage.filter({ conversation_id: conversationId }),
  });

  useEffect(() => {
    setMessages(chatMessages);
    scrollToBottom();
  }, [chatMessages]);

  // Save message to database
  const saveMessage = async (role, content) => {
    await base44.entities.ChatMessage.create({
      conversation_id: conversationId,
      role,
      content,
    });
    queryClient.invalidateQueries({ queryKey: ["chatMessages", conversationId] });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const refreshMessages = async () => {
    await queryClient.invalidateQueries({ queryKey: ["chatMessages", conversationId] });
  };

  const { PullIndicator, handlers: pullHandlers } = usePullToRefresh(refreshMessages);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Save user message
      await saveMessage("user", userMessage);

      // Get AI response
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful wellness assistant for FloraSonics, a nature-inspired soundscape app. You help users with:
- Sound recommendations based on their mood or needs
- Wellness tips and meditation guidance
- Information about the app's features
- General well-being advice

User message: "${userMessage}"

Be concise, friendly, and supportive. Suggest sounds from the app when relevant (rain, ocean, forest, birds, fire, wind, cafe, train, etc.).`,
        add_context_from_internet: false,
      });

      // Save assistant response
      await saveMessage("assistant", response);
    } catch (error) {
      console.error("Chat error:", error);
      await saveMessage("assistant", "Sorry, I had trouble responding. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" {...pullHandlers}>
      {/* Header */}
      <div className="bg-white/[0.05] border-b border-white/[0.08] backdrop-blur-xl px-4 sm:px-6 py-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20">
            <MessageCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Wellness Assistant</h1>
            <p className="text-xs text-white/40">Ask about sounds, wellness, or meditation</p>
          </div>
        </div>
      </div>

      {/* Pull Indicator */}
      <PullIndicator />

      {/* Messages container with aria-live for screen readers */}
      <div 
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
        role="region"
        aria-live="polite"
        aria-label="Chat messages"
        aria-atomic="false"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/[0.08] max-w-sm mx-auto">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <h2 className="text-lg font-semibold text-white/60 mb-2">Start a conversation</h2>
                  <p className="text-sm text-white/40">Ask about sounds, wellness tips, or how to use FloraSonics</p>
                </div>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <MessageBubble msg={msg} />
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
              role="status"
              aria-live="polite"
              aria-label="Assistant is thinking"
            >
              <div className="bg-white/[0.08] border border-white/[0.12] px-4 py-3 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className="text-sm text-white/60">Thinking...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white/[0.05] border-t border-white/[0.08] backdrop-blur-xl px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
            className="bg-white/[0.08] border-white/[0.12] text-white placeholder:text-white/40 focus:bg-white/[0.12] focus:border-emerald-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 min-w-[44px] min-h-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}