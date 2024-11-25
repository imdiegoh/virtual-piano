'use client';

import { useState, useEffect } from 'react';
import Piano from '@/components/Piano';
import * as Tone from 'tone';

export default function Home() {
  const [octave, setOctave] = useState(4);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'z') {
        setOctave(prev => Math.min(Math.max(prev - 1, 0), 8));
      } else if (event.key.toLowerCase() === 'x') {
        setOctave(prev => Math.min(Math.max(prev + 1, 0), 8));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    Tone.start();

    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="fixed bottom-8 right-8 flex gap-4 items-center bg-white/80 backdrop-blur-sm p-4 rounded-full shadow-lg">
        <input
          type="range"
          min="-20"
          max="0"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-800"
        />
      </div>
      <Piano octave={octave} volume={volume} />
    </main>
  );
}
