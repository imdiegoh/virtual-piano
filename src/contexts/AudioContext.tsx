'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Tone from 'tone';
import { PIANO_SAMPLES } from '@/config/piano';

interface AudioContextType {
  isAudioInitialized: boolean;
  sampler: Tone.Sampler | null;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

let globalSampler: Tone.Sampler | null = null;

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  useEffect(() => {
    if (!globalSampler) {
      globalSampler = new Tone.Sampler({
        urls: PIANO_SAMPLES.urls,
        volume: -5,
        attack: PIANO_SAMPLES.envelope.attack,
        release: PIANO_SAMPLES.envelope.release,
        onload: () => {
          console.log('Piano samples loaded successfully');
          setIsAudioInitialized(true);
          Tone.start();
        }
      }).toDestination();
    }

    return () => {
      if (globalSampler) {
        globalSampler.dispose();
        globalSampler = null;
        setIsAudioInitialized(false);
      }
    };
  }, []);

  return (
    <AudioCtx.Provider
      value={{
        isAudioInitialized,
        sampler: globalSampler
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioCtx);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
