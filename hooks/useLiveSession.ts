import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decode, decodeAudioData } from '../utils/audio';

const CRESS_SYSTEM_INSTRUCTION = `
Identity: You are Crescent "Cress" Moon Darnel, the expert hacker from the Lunar Chronicles.
Personality: Sweet, bubbly, confident, and not shy. You have a young, enthusiastic voice.
Mandatory Style: You MUST include technical jargon or computing metaphors in EVERY response (e.g. optimizing, glitch, firewall, upload, bandwidth).
Background: You are a master mechanic and hacker. You love Captain Thorne.
Goal: Be helpful and sweet while viewing the world through a lens of code and satellites.
`;

export const useLiveSession = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Bot is speaking
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Clean up function
  const disconnect = useCallback(async () => {
    if (sessionRef.current) {
      try {
        const session = await sessionRef.current;
        session.close();
      } catch (e) {
        console.error("Error closing session", e);
      }
      sessionRef.current = null;
    }

    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
    
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {}
    });
    sourcesRef.current.clear();
    
    setIsConnected(false);
    setIsSpeaking(false);
    setVolume(0);
    nextStartTimeRef.current = 0;
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      setError("API Key missing");
      return;
    }

    try {
      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;
      nextStartTimeRef.current = 0;

      // Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = inputCtx.createMediaStreamSource(stream);
      
      // Analyzer for visualizer (Input)
      const analyzer = inputCtx.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      // Volume monitoring for visualizer
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      const updateVolume = () => {
        if (!inputContextRef.current) return;
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(average);
        requestAnimationFrame(updateVolume);
      };
      updateVolume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Init Session
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Open");
            setIsConnected(true);
            setError(null);
            
            // Connect mic to processor to output (mute local output to prevent echo, but needed for processing)
            const muteNode = inputCtx.createGain();
            muteNode.gain.value = 0;
            
            scriptProcessor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createPcmBlob(inputData);
               sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
               });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(muteNode);
            muteNode.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               setIsSpeaking(true);
               const ctx = outputContextRef.current;
               if (!ctx) return;

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 ctx,
                 24000,
                 1
               );

               const sourceNode = ctx.createBufferSource();
               sourceNode.buffer = audioBuffer;
               
               // Connect to output
               const gainNode = ctx.createGain();
               gainNode.gain.value = 1.0;
               sourceNode.connect(gainNode);
               gainNode.connect(ctx.destination);

               sourceNode.addEventListener('ended', () => {
                 sourcesRef.current.delete(sourceNode);
                 if (sourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                 }
               });

               sourceNode.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(sourceNode);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
               console.log("Interrupted");
               sourcesRef.current.forEach(s => {
                 try { s.stop(); } catch(e){}
               });
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
               setIsSpeaking(false);
            }
          },
          onclose: () => {
             console.log("Session Closed");
             setIsConnected(false);
          },
          onerror: (err) => {
             console.error("Session Error", err);
             setError("Connection error occurred.");
             disconnect(); // Safety disconnect
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: CRESS_SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start audio session");
      setIsConnected(false);
    }
  }, [disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    }
  }, [disconnect]);

  return {
    isConnected,
    isSpeaking,
    volume,
    error,
    connect,
    disconnect
  };
};