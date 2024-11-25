'use client';

import { useState, useEffect } from 'react';
import Piano from '@/components/Piano';
import * as Tone from 'tone';

export default function Home() {
  const [octave, setOctave] = useState(4);

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
      <Piano octave={octave} />
    </main>
  );
}
