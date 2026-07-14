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

      // Colors
      const activeColor = isSpeaking 
        ? 'rgba(129, 140, 248, ' // Indigo for Grok speaking
        : 'rgba(99, 102, 241, ';  // Purple for User listening

      // Draw multiple overlapping sine waves for rich fluid effect
      const drawSineWave = (
        wavePhase: number, 
        waveAmplitude: number, 
        frequency: number, 
        opacity: number,
        lineWidth: number
      ) => {
        ctx.beginPath();
        ctx.strokeStyle = activeColor + opacity + ')';
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';

        // Add glow shadow
        ctx.shadowBlur = 10;
        ctx.shadowColor = activeColor + '0.3)';

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

      // Draw 3 layers of waves
      drawSineWave(phase, targetAmplitude, 0.012, 0.8, 3.5);
      drawSineWave(phase * -1.2 + 1, targetAmplitude * 0.7, 0.018, 0.45, 2.5);
      drawSineWave(phase * 0.8 + 2, targetAmplitude * 0.4, 0.008, 0.25, 1.5);

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
