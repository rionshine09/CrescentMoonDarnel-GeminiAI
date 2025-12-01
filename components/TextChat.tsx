import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { ChatMessage as ChatMessageType, Sender } from '../types';
import ChatMessage from './ChatMessage';
import { createChatSession } from '../services/gemini';
import { Chat, GenerateContentResponse } from '@google/genai';

const TextChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: 'init-1',
        sender: Sender.BOT,
        text: "Link established! Signal is crystal clear. I'm ready to optimize your day! What data are we processing?",
      }
    ]);
    
    // Init session
    try {
      chatSessionRef.current = createChatSession();
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg: ChatMessageType = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: inputText,
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Placeholder thinking message
    const tempId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: tempId,
      sender: Sender.BOT,
      text: '',
      isThinking: true
    }]);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg.text });
      
      let fullText = '';
      let groundingMetadata = undefined;

      // Stream handling
      for await (const chunk of result) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
           fullText += c.text;
         }
         // Accumulate grounding metadata (usually comes at the end or in chunks)
         // For streaming, we might just grab the last valid one, or merge.
         if (c.candidates?.[0]?.groundingMetadata) {
            groundingMetadata = c.candidates[0].groundingMetadata;
         }
         
         // Live update the message in the UI
         setMessages(prev => prev.map(msg => {
            if (msg.id === tempId) {
              return {
                ...msg,
                text: fullText,
                isThinking: false, // Start showing text as soon as we have it
                groundingMetadata: groundingMetadata
              };
            }
            return msg;
         }));
      }

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === tempId) {
          return {
            ...msg,
            text: "*Connection interrupted. Uplink failed.* (Error generating response)",
            isThinking: false
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-900/50 p-4">
        <div className="max-w-4xl mx-auto flex items-end gap-3 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message to the satellite..."
            className="w-full bg-slate-800 text-slate-100 border border-slate-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-lunar-accent resize-none min-h-[50px] max-h-[150px] placeholder-slate-500 font-sans"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="absolute right-2 bottom-2 p-2 bg-lunar-accent text-lunar-bg rounded-lg hover:bg-lunar-glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
        <div className="text-center mt-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
                Secure Uplink • Gemini 3 Pro
            </span>
        </div>
      </div>
    </div>
  );
};

export default TextChat;