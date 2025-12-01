import React, { useState } from 'react';
import { MessageSquareText, Mic } from 'lucide-react';
import TextChat from './components/TextChat';
import VoiceChat from './components/VoiceChat';
import { Mode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode>('text');

  return (
    <div className="flex flex-col h-screen bg-lunar-bg text-slate-100 font-sans">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-8 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-slate-900 font-bold font-mono text-xl shadow-lg shadow-cyan-500/20">
             C
           </div>
           <div>
             <h1 className="font-bold text-lg tracking-tight">Cress</h1>
             <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest hidden md:block">
               Satellite Uplink V3.0
             </p>
           </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-800/80 rounded-full p-1 border border-slate-700/50">
          <button
            onClick={() => setMode('text')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === 'text' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareText size={16} />
            <span className="hidden sm:inline">Text</span>
          </button>
          <button
            onClick={() => setMode('voice')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === 'voice' 
                ? 'bg-lunar-accent text-slate-900 shadow-sm shadow-cyan-500/20' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic size={16} />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {mode === 'text' ? (
          <TextChat />
        ) : (
          <VoiceChat />
        )}
      </main>
    </div>
  );
};

export default App;
