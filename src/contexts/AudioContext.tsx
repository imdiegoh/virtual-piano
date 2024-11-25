'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Tone from 'tone';

interface AudioContextType {
  isAudioInitialized: boolean;
  initializeAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const initializeAudio = async () => {
    try {
      await Tone.start();
      setIsAudioInitialized(true);
    } catch (error) {
      console.error('Audio initialization error:', error);
    }
  };

  useEffect(() => {
    const handleInteraction = async () => {
      if (!isAudioInitialized) {
        await initializeAudio();
        // Removemos los event listeners después de la inicialización
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('keydown', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [isAudioInitialized]);

  return (
    <AudioContext.Provider value={{ isAudioInitialized, initializeAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
