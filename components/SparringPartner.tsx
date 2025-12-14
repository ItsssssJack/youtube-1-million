import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { sendMessageToGemini } from '../services/gemini';
import { ChatMessage } from '../types';

const SparringPartner: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Ready to analyze. What growth opportunities are we hunting today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Format history for the service
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await sendMessageToGemini(history, userMsg.text);
      
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                <Bot size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">Sparring Partner</h2>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online • Gemini Powered
                </p>
            </div>
        </div>
        <button className="text-xs font-semibold text-emerald-700 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-50">
            Reset Context
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'model' ? 'bg-[#14452F] text-white' : 'bg-gray-100 text-gray-600'
            }`}>
                {msg.role === 'model' ? <Sparkles size={18} /> : <User size={18} />}
            </div>
            
            <div className={`max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                ? 'bg-gray-900 text-white rounded-tr-none shadow-md' 
                : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#14452F] text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles size={18} className="animate-pulse" />
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about trends, outliers, or ideas..."
            className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-[#14452F] focus:border-transparent resize-none h-14"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 p-2 bg-[#14452F] text-white rounded-lg hover:bg-[#0f3624] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-3">
            AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};

export default SparringPartner;