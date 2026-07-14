'use client';

import React, { useEffect, useRef } from 'react';
import { useVoiceStore } from '@/store/useVoiceStore';

export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { soundLevel, isSpeaking, isListening } = useVoiceStore();
  const levelRef = useRef(0);

  // Sync soundLevel smoothly
  useEffect(() => {
    levelRef.current = soundLevel;
  }, [soundLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 150;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Base Level (breathing state)
      const currentLevel = levelRef.current;
      
      // Calculate target wave amplitude based on mic input or synthesized speaker
      let targetAmplitude = 4;
      if (isListening && currentLevel > 1) {
        targetAmplitude = Math.min(currentLevel * 1.5, centerY - 10);
      } else if (isSpeaking) {
        targetAmplitude = 20 + Math.sin(phase * 4) * 8; // Simulated wave for speaking
      } else if (!isListening && !isSpeaking) {
        targetAmplitude = 1; // flat line
      }

      phase += 0.05;

      // Draw multiple overlapping sine waves for rich fluid effect
      const drawSineWave = (
        wavePhase: number, 
        waveAmplitude: number, 
        frequency: number, 
        opacity: number,
        lineWidth: number
      ) => {
        ctx.beginPath();
        
        // Dynamic horizontal color gradients
        const grad = ctx.createLinearGradient(0, 0, width, 0);
        if (isSpeaking) {
          grad.addColorStop(0, `rgba(59, 130, 246, ${opacity})`); // Blue
          grad.addColorStop(0.5, `rgba(139, 92, 246, ${opacity})`); // Violet
          grad.addColorStop(1, `rgba(236, 72, 153, ${opacity})`); // Pink
        } else {
          grad.addColorStop(0, `rgba(99, 102, 241, ${opacity})`); // Indigo
          grad.addColorStop(0.5, `rgba(59, 130, 246, ${opacity})`); // Blue
          grad.addColorStop(1, `rgba(16, 185, 129, ${opacity})`); // Emerald
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // Add glowing neon shadows
        ctx.shadowBlur = 16;
        ctx.shadowColor = isSpeaking ? 'rgba(139, 92, 246, 0.4)' : 'rgba(59, 130, 246, 0.4)';

        for (let x = 0; x < width; x++) {
          // Attenuation envelope at edges so wave stays within limits
          const envelope = Math.sin((x / width) * Math.PI);
          
          const y = centerY + Math.sin(x * frequency + wavePhase) * waveAmplitude * envelope;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      };

      // Draw 3 layers of waves with varying phases
      drawSineWave(phase, targetAmplitude, 0.012, 0.9, 3.5);
      drawSineWave(phase * -1.2 + 1, targetAmplitude * 0.7, 0.018, 0.55, 2.5);
      drawSineWave(phase * 0.8 + 2, targetAmplitude * 0.45, 0.008, 0.3, 1.5);

      ctx.shadowBlur = 0; // reset shadow

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isSpeaking, isListening]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
