import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage as ChatMessageType, Sender } from '../types';
import { Bot, User, Cpu, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === Sender.BOT;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${isBot ? 'bg-lunar-accent' : 'bg-lunar-muted'}`}>
          {isBot ? <Bot size={18} className="text-lunar-bg" /> : <User size={18} className="text-lunar-bg" />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
          <div className={`px-4 py-3 rounded-2xl text-sm md:text-base shadow-sm ${
            isBot 
              ? 'bg-lunar-card text-lunar-text border border-slate-700 rounded-tl-none' 
              : 'bg-lunar-accent text-lunar-bg font-medium rounded-tr-none'
          }`}>
            {message.isThinking ? (
              <div className="flex items-center gap-2 text-lunar-muted italic animate-pulse">
                <Cpu size={16} />
                <span>Processing satellite data...</span>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none break-words">
                <ReactMarkdown
                   components={{
                    a: ({ node, ...props }) => <a {...props} className="text-sky-300 underline hover:text-sky-200" target="_blank" rel="noopener noreferrer" />
                   }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {/* Citations/Grounding */}
          {isBot && message.groundingMetadata?.groundingChunks && (
             <div className="mt-2 flex flex-wrap gap-2">
               {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
                 if (chunk.web?.uri && chunk.web?.title) {
                   return (
                     <a 
                      key={idx} 
                      href={chunk.web.uri}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 rounded-full transition-colors border border-slate-700"
                     >
                        <ExternalLink size={10} />
                        <span className="truncate max-w-[150px]">{chunk.web.title}</span>
                     </a>
                   );
                 }
                 return null;
               })}
             </div>
          )}
          
          <span className="text-xs text-slate-500 mt-1 px-1">
            {isBot ? 'Cress' : 'You'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
