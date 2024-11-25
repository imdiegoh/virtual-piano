'use client';

import { useState, useEffect } from 'react';
import Piano from '@/components/Piano';
import { AudioProvider } from '@/contexts/AudioContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  const [octave, setOctave] = useState(4);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'z') {
        setOctave(prev => Math.max(prev - 1, 0));
      } else if (event.key.toLowerCase() === 'x') {
        setOctave(prev => Math.min(prev + 1, 8));
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <ThemeProvider>
      <AudioProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-200">
          <ThemeToggle />
          <Piano octave={octave} />
        </div>
      </AudioProvider>
    </ThemeProvider>
  );
}
