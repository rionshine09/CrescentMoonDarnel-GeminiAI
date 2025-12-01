import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Radio, AlertCircle } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { useLiveSession } from '../hooks/useLiveSession';

const VoiceChat: React.FC = () => {
  const { isConnected, isSpeaking, volume, error, connect, disconnect } = useLiveSession();
  const [hasInteracted, setHasInteracted] = useState(false);

  const toggleConnection = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      setHasInteracted(true);
      await connect();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#0f172a] relative overflow-hidden p-6">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[20%] w-80 h-80 bg-cyan-600 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 flex flex-col items-center space-y-8 max-w-md w-full">
        
        {/* Status Badge */}
        <div className={`
          flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono tracking-widest uppercase transition-all
          ${isConnected 
            ? 'bg-green-500/10 border-green-500/30 text-green-400' 
            : 'bg-slate-800/50 border-slate-700 text-slate-500'}
        `}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
          {isConnected ? 'Live Uplink Active' : 'Uplink Offline'}
        </div>

        {/* Visualizer Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Base Circle */}
            <div className={`absolute inset-0 rounded-full border-2 border-slate-800 transition-all duration-700 ${isConnected ? 'scale-100 opacity-100' : 'scale-90 opacity-50'}`} />
            <div className={`absolute inset-4 rounded-full border border-slate-800/50 transition-all duration-700 ${isConnected ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`} />
            
            {/* Canvas Visualizer */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <AudioVisualizer 
                 volume={isConnected ? volume : 0} 
                 active={isConnected} 
                 color={isSpeaking ? '#38bdf8' : '#34d399'} 
               />
            </div>
            
            {/* Static Icon if disconnected */}
            {!isConnected && (
              <Radio size={48} className="text-slate-700 z-10" />
            )}
        </div>

        {/* Info Text */}
        <div className="text-center space-y-2 h-16">
           <h2 className="text-2xl font-bold text-white tracking-tight">
             {isConnected ? (isSpeaking ? "Cress is speaking..." : "Listening...") : "Voice Uplink"}
           </h2>
           <p className="text-slate-400 text-sm">
             {isConnected 
               ? "Speak naturally. I'm listening." 
               : "Connect to start a real-time voice call."}
           </p>
        </div>

        {/* Controls */}
        <button
          onClick={toggleConnection}
          className={`
            group relative flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-[#0f172a]
            ${isConnected 
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white ring-red-500/30' 
              : 'bg-lunar-accent text-lunar-bg hover:bg-lunar-glow ring-lunar-accent/30'}
          `}
        >
          {isConnected ? <MicOff size={24} /> : <Mic size={24} />}
          
          {/* Ripple effect when waiting to connect */}
          {!isConnected && !hasInteracted && (
             <span className="absolute -inset-1 rounded-full border border-lunar-accent animate-ping opacity-75" />
          )}
        </button>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-950/30 px-4 py-3 rounded-lg border border-red-900/50 text-sm max-w-xs text-center">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

       <div className="absolute bottom-6 text-center">
            <span className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">
                Gemini 2.5 Flash Native Audio
            </span>
        </div>
    </div>
  );
};

export default VoiceChat;
