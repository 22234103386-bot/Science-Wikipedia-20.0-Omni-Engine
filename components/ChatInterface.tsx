import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { chatWithAssistant } from '../services/geminiService';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  contextBrief: string;
  botName: string;
  suggestedQuestions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  contextBrief, 
  botName,
  suggestedQuestions 
}) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const responseText = await chatWithAssistant(messages.concat(userMsg), text, contextBrief);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "Signal lost. Retrying..." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center mt-20 opacity-40">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-sci-accent" />
            <p className="text-sm font-bold text-sci-subtext">ASK ME ANYTHING</p>
          </div>
        )}
        
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{msg.role === 'user' ? 'YOU' : botName}</span>
            <div className={`max-w-[90%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${
              msg.role === 'user' 
                ? 'bg-sci-accent text-white font-medium rounded-tr-none' 
                : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start">
            <div className="bg-slate-100 rounded-2xl rounded-tl-none p-3 border border-slate-200">
               <div className="flex space-x-1">
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75" />
                 <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150" />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {messages.length < 5 && suggestedQuestions.length > 0 && !isTyping && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {suggestedQuestions.map((q, i) => (
            <button 
              key={i}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] text-sci-accent font-bold transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-2 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Type your question..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-sci-accent focus:ring-1 focus:ring-sci-accent transition-colors font-medium placeholder:text-slate-400"
          />
          <button 
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-white hover:bg-sci-accent hover:text-white border border-slate-200 rounded-md text-sci-accent disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
