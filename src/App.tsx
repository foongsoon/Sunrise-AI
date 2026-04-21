/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Send, Search, GraduationCap, Info, MapPin, Loader2, User, Bot, Sparkles } from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { sendMessageStream, Message } from "./services/geminiService";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const stream = sendMessageStream(messages, input);
      let fullResponse = "";
      
      setMessages((prev) => [...prev, { role: "model", text: "" }]);

      for await (const chunk of stream) {
        fullResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === "model") {
            lastMessage.text = fullResponse;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "model", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { text: "Undergraduate Courses", icon: <GraduationCap className="w-4 h-4" /> },
    { text: "Admission Requirements", icon: <Info className="w-4 h-4" /> },
    { text: "Campus Facilities", icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#FDFCFB] text-slate-900 font-sans selection:bg-amber-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-bottom border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Sunrise Education</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Powered by Google Search</p>
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 hidden sm:block">
          Sunrise Education Assistant
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-8 py-12"
            >
              <div className="space-y-4">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  Welcome to <span className="text-amber-500">SUNRISE</span> Education
                </h2>
                <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
                  Ask me anything about our educational services and courses. I search the web in real-time to provide the best answers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => { setInput(prompt.text); }}
                    className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-2xl hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 bg-slate-50 group-hover:bg-amber-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-amber-500 transition-colors">
                      {prompt.icon}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 group",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border",
                  message.role === "user" 
                    ? "bg-slate-900 border-slate-900 text-white" 
                    : "bg-amber-50 border-amber-100 text-amber-600"
                )}>
                  {message.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "flex-1 max-w-[85%] rounded-3xl p-5 text-sm leading-relaxed shadow-sm transition-shadow hover:shadow-md",
                  message.role === "user"
                    ? "bg-amber-400 text-slate-900 font-medium"
                    : "bg-white border border-slate-100 text-slate-800"
                )}>
                  <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-a:text-amber-600 prose-strong:text-slate-900">
                    <Markdown>{message.text}</Markdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <div className="flex gap-4 animate-pulse">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <Bot className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex items-center gap-1 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 sm:p-8 bg-white/80 backdrop-blur-md border-t border-slate-100 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2 p-1.5 bg-slate-50 rounded-3xl border border-slate-200 focus-within:border-amber-400 focus-within:ring-4 focus-within:ring-amber-100 transition-all shadow-inner"
          >
            <div className="flex items-center justify-center w-10 h-10 text-slate-400 pl-2">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Sunrise Education..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder:text-slate-400 py-3"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                isLoading || !input.trim()
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 active:scale-95 shadow-amber-200"
              )}
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
            </button>
          </form>
          <p className="text-[10px] text-center mt-3 text-slate-400 uppercase tracking-widest font-bold">
            Real-time verification enabled via Google Search
          </p>
        </div>
      </footer>
    </div>
  );
}

