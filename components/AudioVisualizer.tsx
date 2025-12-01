import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number; // 0 to 255
  active: boolean;
  color?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, active, color = '#38bdf8' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let currentHeight = 0;
    
    // Smooth the volume transition
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (!active) {
        currentHeight = 0;
        // Draw a flat line
        ctx.beginPath();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
        return;
      }

      // Smooth interpolation
      const targetHeight = (volume / 255) * canvas.height;
      currentHeight += (targetHeight - currentHeight) * 0.2;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 30 + (currentHeight / 3);

      // Draw "Cress's Satellite Signal" style visualization
      // Concentric circles
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = `${color}40`; // low opacity
      ctx.lineWidth = 1;
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Waveform lines
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      
      const bars = 20;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const barHeight = (Math.sin(Date.now() / 200 + i) * 0.5 + 0.5) * (currentHeight / 2);
        const x1 = centerX + Math.cos(angle) * (radius + 5);
        const y1 = centerY + Math.sin(angle) * (radius + 5);
        const x2 = centerX + Math.cos(angle) * (radius + 5 + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + 5 + barHeight);
        
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [volume, active, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full max-w-[300px] h-auto aspect-square"
    />
  );
};

export default AudioVisualizer;
